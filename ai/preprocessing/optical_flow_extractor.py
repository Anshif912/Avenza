"""
Video Respiration and Chest Movement Optical Flow Extractor
Extracts respiratory waveforms from video frame streams using Farneback Optical Flow and Frame Differencing.
"""

import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple


class OpticalFlowExtractor:
    """
    Computes optical flow vectors and motion energy from ROI bounding boxes in video streams.
    """

    def __init__(self, target_fps: int = 15):
        self.target_fps = target_fps
        self.prev_gray: Optional[np.ndarray] = None

    def reset(self):
        self.prev_gray = None

    def process_frame(
        self,
        frame: np.ndarray,
        roi_box: Optional[Tuple[int, int, int, int]] = None
    ) -> Dict[str, float]:
        """
        Processes a single video frame.
        roi_box: (x, y, w, h) in pixels. If None, uses central 50% ROI.
        Returns:
          - displacement: Average magnitude of movement vector
          - flow_y: Vertical displacement velocity (expansion/contraction)
          - motion_energy: Kinetic energy proxy (sum of squared flow velocities)
          - is_occluded: Boolean flag if lighting is extremely low or camera blocked
        """
        if len(frame.shape) == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        else:
            gray = frame.copy()

        h, w = gray.shape
        if roi_box is None:
            # Center 50% ROI
            rx, ry, rw, rh = int(w * 0.25), int(h * 0.25), int(w * 0.5), int(h * 0.5)
        else:
            rx, ry, rw, rh = roi_box

        rx = max(0, min(rx, w - 1))
        ry = max(0, min(ry, h - 1))
        rw = max(10, min(rw, w - rx))
        rh = max(10, min(rh, h - ry))

        roi_gray = gray[ry:ry + rh, rx:rx + rw]
        mean_brightness = float(np.mean(roi_gray))

        # Check occlusion / darkness
        if mean_brightness < 12.0 or mean_brightness > 245.0:
            return {
                "displacement": 0.0,
                "flow_y": 0.0,
                "motion_energy": 0.0,
                "is_occluded": True,
                "mean_brightness": mean_brightness
            }

        if self.prev_gray is None or self.prev_gray.shape != roi_gray.shape:
            self.prev_gray = roi_gray
            return {
                "displacement": 0.0,
                "flow_y": 0.0,
                "motion_energy": 0.0,
                "is_occluded": False,
                "mean_brightness": mean_brightness
            }

        # Farneback Dense Optical Flow
        flow = cv2.calcOpticalFlowFarneback(
            prev=self.prev_gray,
            next=roi_gray,
            flow=None,
            pyr_scale=0.5,
            levels=3,
            winsize=15,
            iterations=3,
            poly_n=5,
            poly_sigma=1.2,
            flags=0
        )

        flow_x = flow[..., 0]
        flow_y = flow[..., 1]
        mag = np.sqrt(flow_x**2 + flow_y**2)

        avg_mag = float(np.mean(mag))
        avg_flow_y = float(np.mean(flow_y))
        energy = float(np.mean(mag**2))

        self.prev_gray = roi_gray

        return {
            "displacement": avg_mag,
            "flow_y": avg_flow_y,
            "motion_energy": energy,
            "is_occluded": False,
            "mean_brightness": mean_brightness
        }
