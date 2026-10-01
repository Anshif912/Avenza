"""
Real-Time Streaming Multimodal Inference Engine
Maintains circular buffers, runs real-time filtering, evaluates neural model, updates state machine, and generates explanations.
"""

import os
import collections
import numpy as np
import torch
from typing import Dict, Any, List, Optional, Tuple

from ..models.fusion_model import AvenzaMultimodalFusionNet
from ..models.state_machine import ApneaTemporalStateMachine, MonitorState
from ..preprocessing.signal_quality import SignalQualityShield
from ..preprocessing.signal_filters import butter_bandpass_filter, remove_baseline_wander
from ..evaluation.explainability import MultimodalExplainer

try:
    import onnxruntime as ort
    ORT_AVAILABLE = True
except ImportError:
    ORT_AVAILABLE = False


class RealtimeApneaInferenceEngine:
    """
    Streaming Inference Engine for live neonatal monitoring.
    """

    CLASS_NAMES = ["normal", "central_apnea", "obstructive_apnea", "mixed_apnea"]

    def __init__(
        self,
        model_path: str = "data/processed/models/best_fusion_model.pt",
        use_onnx_if_available: bool = True,
        ppg_fs: int = 50,
        video_fs: int = 15,
        window_sec: int = 10
    ):
        self.ppg_fs = ppg_fs
        self.video_fs = video_fs
        self.window_sec = window_sec
        self.ppg_buffer_len = window_sec * ppg_fs      # 500 samples
        self.video_buffer_len = window_sec * video_fs  # 150 samples

        # Streaming Circular Buffers
        self.ppg_red_buf = collections.deque(maxlen=self.ppg_buffer_len)
        self.ppg_ir_buf = collections.deque(maxlen=self.ppg_buffer_len)
        self.hr_buf = collections.deque(maxlen=self.ppg_buffer_len)
        self.spo2_buf = collections.deque(maxlen=self.ppg_buffer_len)

        self.vid_disp_buf = collections.deque(maxlen=self.video_buffer_len)
        self.vid_flow_buf = collections.deque(maxlen=self.video_buffer_len)
        self.vid_pose_y_buf = collections.deque(maxlen=self.video_buffer_len)
        self.vid_energy_buf = collections.deque(maxlen=self.video_buffer_len)

        # State Machine & Quality Shield
        self.state_machine = ApneaTemporalStateMachine()
        self.explainer = MultimodalExplainer()

        # Model Loading
        self.use_onnx = False
        self.ort_session = None
        self.torch_model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        onnx_file = model_path.replace(".pt", ".onnx")
        if use_onnx_if_available and ORT_AVAILABLE and os.path.exists(onnx_file):
            try:
                self.ort_session = ort.InferenceSession(onnx_file, providers=["CPUExecutionProvider"])
                self.use_onnx = True
                print(f"[Inference Engine] Running in optimized ONNX Runtime mode ({onnx_file})")
            except Exception as e:
                print(f"[Inference Engine] ONNX fallback to PyTorch due to: {e}")

        if not self.use_onnx:
            self.torch_model = AvenzaMultimodalFusionNet()
            if os.path.exists(model_path):
                ckpt = torch.load(model_path, map_location=self.device, weights_only=False)
                self.torch_model.load_state_dict(ckpt["model_state_dict"])
            self.torch_model.eval().to(self.device)
            print(f"[Inference Engine] Running in PyTorch mode ({self.device.upper()})")

    def reset_buffers(self):
        """Clears all streaming buffers and resets state machine."""
        self.ppg_red_buf.clear()
        self.ppg_ir_buf.clear()
        self.hr_buf.clear()
        self.spo2_buf.clear()

        self.vid_disp_buf.clear()
        self.vid_flow_buf.clear()
        self.vid_pose_y_buf.clear()
        self.vid_energy_buf.clear()

        self.state_machine.reset()

    def push_ppg_sample(self, raw_red: float, raw_ir: float, hr: float, spo2: float):
        """Pushes single PPG sensor packet (called at 50 Hz)."""
        self.ppg_red_buf.append(raw_red)
        self.ppg_ir_buf.append(raw_ir)
        self.hr_buf.append(hr)
        self.spo2_buf.append(spo2)

    def push_video_sample(self, displacement: float, flow_y: float, pose_y: float, energy: float):
        """Pushes single camera movement packet (called at 15 Hz)."""
        self.vid_disp_buf.append(displacement)
        self.vid_flow_buf.append(flow_y)
        self.vid_pose_y_buf.append(pose_y)
        self.vid_energy_buf.append(energy)

    def is_warmed_up(self) -> bool:
        """Returns True if at least 50% of the window buffer is filled."""
        return len(self.ppg_ir_buf) >= (self.ppg_buffer_len // 2) and len(self.vid_disp_buf) >= (self.video_buffer_len // 2)

    def process_inference_step(self) -> Dict[str, Any]:
        """
        Executes a complete inference cycle over the current buffer state.
        Typically invoked at 1 Hz.
        """
        if not self.is_warmed_up():
            return {
                "status": "BUFFERING",
                "progress_pct": round((len(self.ppg_ir_buf) / self.ppg_buffer_len) * 100, 1),
                "state": MonitorState.NORMAL.value,
                "apnea_score": 0.0,
                "is_alert": False,
                "reason": "Filling initial sliding window buffers..."
            }

        # Convert buffers to arrays with padding if still warming up
        raw_red = np.pad(np.array(self.ppg_red_buf), (max(0, self.ppg_buffer_len - len(self.ppg_red_buf)), 0), 'edge')
        raw_ir = np.pad(np.array(self.ppg_ir_buf), (max(0, self.ppg_buffer_len - len(self.ppg_ir_buf)), 0), 'edge')
        hr_arr = np.pad(np.array(self.hr_buf), (max(0, self.ppg_buffer_len - len(self.hr_buf)), 0), 'edge')
        spo2_arr = np.pad(np.array(self.spo2_buf), (max(0, self.ppg_buffer_len - len(self.spo2_buf)), 0), 'edge')

        disp_arr = np.pad(np.array(self.vid_disp_buf), (max(0, self.video_buffer_len - len(self.vid_disp_buf)), 0), 'edge')
        flow_arr = np.pad(np.array(self.vid_flow_buf), (max(0, self.video_buffer_len - len(self.vid_flow_buf)), 0), 'edge')
        pose_arr = np.pad(np.array(self.vid_pose_y_buf), (max(0, self.video_buffer_len - len(self.vid_pose_y_buf)), 0), 'edge')
        ener_arr = np.pad(np.array(self.vid_energy_buf), (max(0, self.video_buffer_len - len(self.vid_energy_buf)), 0), 'edge')

        # 1. Digital Filtering
        f_red = butter_bandpass_filter(raw_red, 0.5, 8.0, self.ppg_fs)
        f_ir = butter_bandpass_filter(raw_ir, 0.5, 8.0, self.ppg_fs)
        f_red = (f_red - np.mean(f_red)) / (np.std(f_red) + 1e-6)
        f_ir = (f_ir - np.mean(f_ir)) / (np.std(f_ir) + 1e-6)

        ppg_matrix = np.stack([f_red, f_ir, hr_arr / 200.0, spo2_arr / 100.0], axis=-1)  # (500, 4)
        mov_matrix = np.stack([disp_arr, flow_arr, pose_arr, ener_arr], axis=-1)         # (150, 4)

        # 2. Compute Signal Quality
        current_hr = float(hr_arr[-1])
        current_spo2 = float(spo2_arr[-1])
        is_video_occluded = (np.max(disp_arr) <= 1e-6 and np.max(flow_arr) <= 1e-6 and np.max(ener_arr) <= 1e-6)
        ppg_sqi_info = SignalQualityShield.compute_ppg_sqi(raw_ir, raw_red, current_hr, current_spo2)
        vid_sqi_info = SignalQualityShield.compute_video_sqi(120.0, disp_arr, is_occluded=is_video_occluded)

        sqi_vec = np.array([
            ppg_sqi_info["ppg_sqi"],
            vid_sqi_info["video_sqi"],
            min(1.0, ppg_sqi_info["perfusion_index"] / 5.0)
        ], dtype=np.float32)

        # 3. Model Forward Pass
        if self.use_onnx:
            in_v = np.expand_dims(mov_matrix.astype(np.float32), 0)
            in_p = np.expand_dims(ppg_matrix.astype(np.float32), 0)
            in_s = np.expand_dims(sqi_vec, 0)

            out_prob, out_mc, out_wv, out_wp = self.ort_session.run(None, {
                "video_seq": in_v,
                "ppg_seq": in_p,
                "sqi_vec": in_s
            })
            raw_prob = float(out_prob[0])
            mc_idx = int(np.argmax(out_mc[0]))
            w_vid = float(out_wv[0])
            w_ppg = float(out_wp[0])
        else:
            in_v = torch.tensor(mov_matrix, dtype=torch.float32, device=self.device).unsqueeze(0)
            in_p = torch.tensor(ppg_matrix, dtype=torch.float32, device=self.device).unsqueeze(0)
            in_s = torch.tensor(sqi_vec, dtype=torch.float32, device=self.device).unsqueeze(0)

            with torch.no_grad():
                out = self.torch_model(in_v, in_p, in_s)
                raw_prob = float(out["binary_prob"].cpu().numpy()[0])
                mc_idx = int(torch.argmax(out["multiclass_logits"], dim=-1).cpu().numpy()[0])
                w_vid = float(out["w_video"].cpu().numpy()[0])
                w_ppg = float(out["w_ppg"].cpu().numpy()[0])

        event_type_str = self.CLASS_NAMES[mc_idx] if 0 <= mc_idx < len(self.CLASS_NAMES) else "central_apnea"

        # 4. State Machine Update
        verdict = self.state_machine.update(
            apnea_score=raw_prob,
            ppg_sqi=sqi_vec[0],
            video_sqi=sqi_vec[1],
            perfusion_index=ppg_sqi_info["perfusion_index"],
            pred_type=event_type_str
        )

        # 5. Explainability Attribution
        attr = self.explainer.attribute_window(
            video_seq=mov_matrix,
            ppg_seq=ppg_matrix,
            sqi_vec=sqi_vec,
            apnea_score=raw_prob,
            w_video=w_vid,
            w_ppg=w_ppg
        )

        return {
            "status": "ACTIVE",
            "state": verdict["state"],
            "apnea_score": round(verdict["apnea_score"], 3),
            "is_alert": verdict["is_alert"],
            "event_type": verdict["event_type"],
            "event_duration_sec": verdict["event_duration_sec"],
            "current_vitals": {
                "heart_rate": round(current_hr, 1),
                "spo2": round(current_spo2, 1),
                "perfusion_index": round(ppg_sqi_info["perfusion_index"], 2)
            },
            "signal_quality": {
                "ppg_sqi": round(float(sqi_vec[0]), 3),
                "video_sqi": round(float(sqi_vec[1]), 3),
                "is_ppg_valid": bool(ppg_sqi_info["is_valid"]),
                "is_video_valid": bool(vid_sqi_info["is_valid"])
            },
            "evidence_weights": {
                "video_weight": round(w_vid, 3),
                "ppg_weight": round(w_ppg, 3)
            },
            "attribution": attr,
            "reason": verdict["reason"],
            "prototype_disclaimer": "AI-ASSISTED APNEA EVENT DETECTION — PROTOTYPE (MODEL PROBABILITY — NOT A CLINICAL DIAGNOSIS)"
        }
