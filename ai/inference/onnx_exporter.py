"""
ONNX Model Exporter and Latency Benchmark Engine
Exports AvenzaMultimodalFusionNet to optimized ONNX format for edge deployment.
"""

import os
import sys
import time
import numpy as np
import torch
from typing import Dict, Any, Tuple

# Ensure stdout handles UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    import onnxruntime as ort
    ORT_AVAILABLE = True
except ImportError:
    ORT_AVAILABLE = False

from ..models.fusion_model import AvenzaMultimodalFusionNet


def export_fusion_to_onnx(
    model_weights_path: str = "data/processed/models/best_fusion_model.pt",
    output_onnx_path: str = "data/processed/models/avenza_fusion_model.onnx",
    device: str = "cpu"
) -> str:
    """
    Exports trained PyTorch model to ONNX with dynamic batch size.
    """
    os.makedirs(os.path.dirname(output_onnx_path), exist_ok=True)

    model = AvenzaMultimodalFusionNet()
    if os.path.exists(model_weights_path):
        ckpt = torch.load(model_weights_path, map_location=device, weights_only=False)
        model.load_state_dict(ckpt["model_state_dict"])
    model.eval().to(device)

    # Dummy inputs for tracing: (Batch, Seq_Len, Channels)
    dummy_video = torch.randn(1, 150, 4, dtype=torch.float32, device=device)
    dummy_ppg = torch.randn(1, 500, 4, dtype=torch.float32, device=device)
    dummy_sqi = torch.tensor([[0.95, 0.90, 2.1]], dtype=torch.float32, device=device)

    # Class wrapper to output fixed tensor tuple for ONNX
    class ONNXExportWrapper(torch.nn.Module):
        def __init__(self, net):
            super().__init__()
            self.net = net

        def forward(self, v, p, s):
            out = self.net(v, p, s)
            return out["binary_prob"], out["multiclass_logits"], out["w_video"], out["w_ppg"]

    wrapper = ONNXExportWrapper(model)
    wrapper.eval().to(device)

    try:
        # Export with dynamo=False for reliable, deterministic operator conversion
        torch.onnx.export(
            wrapper,
            (dummy_video, dummy_ppg, dummy_sqi),
            output_onnx_path,
            export_params=True,
            opset_version=18,
            do_constant_folding=True,
            dynamo=False,
            input_names=["video_seq", "ppg_seq", "sqi_vec"],
            output_names=["binary_prob", "multiclass_logits", "w_video", "w_ppg"],
            dynamic_axes={
                "video_seq": {0: "batch_size"},
                "ppg_seq": {0: "batch_size"},
                "sqi_vec": {0: "batch_size"},
                "binary_prob": {0: "batch_size"},
                "multiclass_logits": {0: "batch_size"},
                "w_video": {0: "batch_size"},
                "w_ppg": {0: "batch_size"}
            }
        )
    except TypeError:
        # Fallback if dynamo argument not supported in version
        torch.onnx.export(
            wrapper,
            (dummy_video, dummy_ppg, dummy_sqi),
            output_onnx_path,
            export_params=True,
            opset_version=18,
            do_constant_folding=True,
            input_names=["video_seq", "ppg_seq", "sqi_vec"],
            output_names=["binary_prob", "multiclass_logits", "w_video", "w_ppg"],
            dynamic_axes={
                "video_seq": {0: "batch_size"},
                "ppg_seq": {0: "batch_size"},
                "sqi_vec": {0: "batch_size"},
                "binary_prob": {0: "batch_size"},
                "multiclass_logits": {0: "batch_size"},
                "w_video": {0: "batch_size"},
                "w_ppg": {0: "batch_size"}
            }
        )

    print(f"[ONNX Export] Successfully exported model to {output_onnx_path}")
    return output_onnx_path


def verify_onnx_model(onnx_path: str = "data/processed/models/avenza_fusion_model.onnx") -> Dict[str, Any]:
    """
    Verifies ONNX execution and benchmarks single-window latency over 100 warm iterations.
    """
    if not ORT_AVAILABLE:
        return {"status": "onnxruntime_not_installed"}

    session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

    dummy_video = np.random.randn(1, 150, 4).astype(np.float32)
    dummy_ppg = np.random.randn(1, 500, 4).astype(np.float32)
    dummy_sqi = np.array([[0.95, 0.90, 2.1]], dtype=np.float32)

    # Warmup
    for _ in range(10):
        _ = session.run(None, {
            "video_seq": dummy_video,
            "ppg_seq": dummy_ppg,
            "sqi_vec": dummy_sqi
        })

    # Benchmark 100 runs
    latencies = []
    for _ in range(100):
        t0 = time.perf_counter()
        outputs = session.run(None, {
            "video_seq": dummy_video,
            "ppg_seq": dummy_ppg,
            "sqi_vec": dummy_sqi
        })
        latencies.append((time.perf_counter() - t0) * 1000.0)

    mean_lat = float(np.mean(latencies))
    p95_lat = float(np.percentile(latencies, 95))

    print(f"[ONNX Verification] Mean Latency: {mean_lat:.2f} ms | P95 Latency: {p95_lat:.2f} ms (Target: < 15.0 ms)")

    return {
        "status": "VERIFIED_SUCCESS",
        "mean_latency_ms": mean_lat,
        "p95_latency_ms": p95_lat,
        "meets_target": mean_lat < 15.0,
        "output_shapes": [list(o.shape) for o in outputs]
    }
