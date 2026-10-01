"""
AVENZA Webcam Kinematics & Optical Flow Bridge
Captures 15 FPS video frames from webcam, tracks chest ROI, computes Farneback optical flow,
and streams motion kinematics directly into the multimodal AI inference engine.
"""

import time
import threading
import logging
from typing import Dict, Any, Optional, Tuple
import cv2
import numpy as np

from ..preprocessing.optical_flow_extractor import OpticalFlowExtractor

logger = logging.getLogger("AVENZA_CAM")


class WebcamMotionBridge:
    """
    Video Kinematics Processor for Real-Time Multimodal Infant Respiration Tracking.
    """

    def __init__(self, camera_index: int = 0, target_fps: int = 15):
        self.camera_index = camera_index
        self.target_fps = target_fps
        self.frame_interval = 1.0 / target_fps

        self.cap: Optional[cv2.VideoCapture] = None
        self.extractor = OpticalFlowExtractor(target_fps=target_fps)
        self.inference_engine_ref = None

        self.is_running = False
        self.is_capturing = False
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()

        # Motion metrics
        self.fps_actual = 0.0
        self.frames_processed = 0
        self.last_frame_time = 0.0
        self.last_error: Optional[str] = None

        self.latest_motion: Dict[str, Any] = {
            "displacement": 0.015,
            "flow_y": 0.005,
            "pose_y": 0.45,
            "energy": 0.001,
            "is_occluded": False,
            "mean_brightness": 128.0,
            "fps": 0.0,
            "tracking_status": "NOT_STARTED"
        }

    def set_inference_engine(self, engine):
        """Attaches the global RealtimeApneaInferenceEngine."""
        self.inference_engine_ref = engine

    def start_capture(self, camera_index: Optional[int] = None) -> bool:
        """Starts live webcam frame acquisition thread."""
        if camera_index is not None:
            self.camera_index = camera_index

        if self.is_capturing:
            return True

        logger.info(f"Opening webcam device index {self.camera_index} at {self.target_fps} FPS...")
        try:
            self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW if cv2.__name__ == 'cv2' and 'win32' in sys_platform() else cv2.CAP_ANY)
            if not self.cap.isOpened():
                # Try default backend
                self.cap = cv2.VideoCapture(self.camera_index)

            if not self.cap.isOpened():
                self.last_error = f"Cannot open camera index {self.camera_index}."
                logger.warning(self.last_error)
                self.latest_motion["tracking_status"] = "CAMERA_UNAVAILABLE"
                return False

            # Configure video resolution for efficient 15 FPS optical flow
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, self.target_fps)

            self.is_running = True
            self.is_capturing = True
            self.extractor.reset()
            self.latest_motion["tracking_status"] = "LOCKED"

            self.thread = threading.Thread(target=self._capture_worker, daemon=True, name="WebcamBridgeWorker")
            self.thread.start()
            logger.info("Webcam optical flow processor started.")
            return True
        except Exception as e:
            self.last_error = f"Webcam init error: {e}"
            logger.error(self.last_error)
            self.latest_motion["tracking_status"] = "ERROR"
            return False

    def stop_capture(self):
        """Stops live camera capture."""
        self.is_running = False
        self.is_capturing = False
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None
        self.latest_motion["tracking_status"] = "STOPPED"
        logger.info("Webcam capture stopped.")

    def process_external_frame(self, frame: np.ndarray, roi_box: Optional[Tuple[int, int, int, int]] = None) -> Dict[str, Any]:
        """
        Allows processing video frames received from browser/external stream.
        """
        motion = self.extractor.process_frame(frame, roi_box=roi_box)
        with self.lock:
            self.latest_motion.update({
                "displacement": round(motion["displacement"], 4),
                "flow_y": round(motion["flow_y"], 4),
                "pose_y": 0.45,
                "energy": round(motion["motion_energy"], 6),
                "is_occluded": motion["is_occluded"],
                "mean_brightness": round(motion.get("mean_brightness", 128.0), 1),
                "tracking_status": "OCCLUDED" if motion["is_occluded"] else "LOCKED"
            })

        if self.inference_engine_ref:
            self.inference_engine_ref.push_video_sample(
                displacement=motion["displacement"],
                flow_y=motion["flow_y"],
                pose_y=0.45,
                energy=motion["motion_energy"]
            )

        return self.latest_motion

    def _capture_worker(self):
        """Background thread reading webcam frames at steady 15 FPS."""
        fps_counter = 0
        fps_timer = time.time()

        while self.is_running:
            start_tick = time.time()

            if not self.cap or not self.cap.isOpened():
                time.sleep(0.5)
                continue

            ret, frame = self.cap.read()
            if not ret or frame is None:
                logger.warning("Camera frame read failed. Retrying...")
                time.sleep(0.2)
                continue

            self.process_external_frame(frame)
            self.frames_processed += 1
            fps_counter += 1

            # Update FPS calculation
            if time.time() - fps_timer >= 1.0:
                self.fps_actual = fps_counter / (time.time() - fps_timer)
                self.latest_motion["fps"] = round(self.fps_actual, 1)
                fps_counter = 0
                fps_timer = time.time()

            # Enforce 15 FPS rate limiting
            elapsed = time.time() - start_tick
            sleep_time = self.frame_interval - elapsed
            if sleep_time > 0.001:
                time.sleep(sleep_time)

    def get_status(self) -> Dict[str, Any]:
        """Returns camera bridge status."""
        return {
            "is_capturing": self.is_capturing,
            "camera_index": self.camera_index,
            "target_fps": self.target_fps,
            "fps_actual": round(self.fps_actual, 1),
            "frames_processed": self.frames_processed,
            "last_error": self.last_error,
            "latest_motion": self.latest_motion
        }


def sys_platform():
    import sys
    return sys.platform


# Global singleton instance
camera_bridge = WebcamMotionBridge()
