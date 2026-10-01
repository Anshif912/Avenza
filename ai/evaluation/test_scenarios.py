"""
Comprehensive Acceptance & Clinical Edge-Case Test Suite
Validates all 15 operational and failure scenarios on the live inference engine.
"""

import os
import time
import numpy as np
from typing import Dict, List, Any, Tuple

from ..inference.inference_engine import RealtimeApneaInferenceEngine
from ..models.state_machine import MonitorState


def generate_pulsatile_ppg(hr: float, spo2: float, n_samples: int = 500, fs: int = 50, is_disconnected: bool = False, pi: float = 2.0) -> Tuple[np.ndarray, np.ndarray]:
    """Generates realistic pulsatile RED and IR PPG counts."""
    if is_disconnected:
        return np.zeros(n_samples), np.zeros(n_samples)

    t = np.linspace(0, n_samples / fs, n_samples, endpoint=False)
    freq = hr / 60.0
    phase = 2 * np.pi * freq * t
    pulse = 0.7 * np.sin(phase) + 0.3 * np.sin(2 * phase - 0.5)

    dc_ir = 35000.0
    dc_red = 32000.0
    ac_ir = (pi / 100.0) * dc_ir
    r_ratio = max(0.4, (110.0 - spo2) / 25.0)
    ac_red = r_ratio * ac_ir * (dc_red / dc_ir)

    raw_ir = dc_ir + ac_ir * pulse + np.random.normal(0, 5, n_samples)
    raw_red = dc_red + ac_red * pulse + np.random.normal(0, 5, n_samples)

    return raw_red, raw_ir


def fill_engine_buffers(
    engine: RealtimeApneaInferenceEngine,
    hr: float = 142.0,
    spo2: float = 97.5,
    resp_rate: float = 45.0,
    is_apnea_pause: bool = False,
    is_obstructive: bool = False,
    is_mixed: bool = False,
    is_disconnected: bool = False,
    is_occluded: bool = False,
    is_motion: bool = False,
    pi: float = 2.0
):
    """Fills 10 seconds of video (150) and PPG (500) samples with biological respiratory rhythm."""
    raw_red, raw_ir = generate_pulsatile_ppg(hr, spo2, 500, engine.ppg_fs, is_disconnected=is_disconnected, pi=pi)

    for i in range(500):
        engine.push_ppg_sample(
            raw_red=float(raw_red[i]),
            raw_ir=float(raw_ir[i]),
            hr=0.0 if is_disconnected else hr,
            spo2=0.0 if is_disconnected else spo2
        )

    t_v = np.linspace(0, 10, 150, endpoint=False)
    if is_apnea_pause:
        disp_series = np.ones(150) * 0.0003 + np.random.normal(0, 0.0001, 150)
        flow_series = np.ones(150) * 0.0001
        pose_series = np.ones(150) * 0.45
        ener_series = flow_series**2
    elif is_obstructive:
        # Paradoxical hyper-vigorous chest movement
        resp_m = 0.040 * np.sin(2 * np.pi * (resp_rate / 60.0) * t_v)
        disp_series = np.abs(resp_m) * 2.2
        flow_series = np.abs(np.gradient(resp_m, 1.0 / 15.0)) * 2.5
        pose_series = 0.48 + resp_m
        ener_series = flow_series**2
    elif is_mixed:
        # 5s pause + 5s obstructed effort
        disp_series = np.ones(150) * 0.0003
        resp_m = 0.035 * np.sin(2 * np.pi * 0.8 * t_v[75:])
        disp_series[75:] = np.abs(resp_m) * 2.0
        flow_series = np.abs(np.gradient(disp_series, 1.0 / 15.0))
        pose_series = 0.45 + disp_series
        ener_series = flow_series**2
    elif is_motion:
        disp_series = 0.45 + np.random.normal(0, 0.1, 150)
        flow_series = 0.25 + np.random.normal(0, 0.05, 150)
        pose_series = 0.55 + np.random.normal(0, 0.05, 150)
        ener_series = flow_series**2
    elif is_occluded:
        disp_series = np.zeros(150)
        flow_series = np.zeros(150)
        pose_series = np.zeros(150)
        ener_series = np.zeros(150)
    else:
        # Healthy oscillating chest respiration
        resp_phase = 2 * np.pi * (resp_rate / 60.0) * t_v
        resp_m = 0.015 * np.sin(resp_phase)
        disp_series = np.abs(resp_m)
        flow_series = np.abs(np.gradient(resp_m, 1.0 / 15.0))
        pose_series = 0.45 + resp_m
        ener_series = flow_series**2

    for i in range(150):
        engine.push_video_sample(
            displacement=float(disp_series[i]),
            flow_y=float(flow_series[i]),
            pose_y=float(pose_series[i]),
            energy=float(ener_series[i])
        )


def run_acceptance_tests() -> Dict[str, Any]:
    print("================================================================================")
    print("      AVENZA — 15 ACCEPTANCE & EDGE CASE VERIFICATION SCENARIOS")
    print("================================================================================")

    engine = RealtimeApneaInferenceEngine(
        model_path="data/processed/models/best_fusion_model.pt",
        use_onnx_if_available=True
    )

    results = []

    def log_test(scenario_num: int, name: str, passed: bool, detail: str):
        status = "PASSED [OK]" if passed else "FAILED [X]"
        print(f"Scenario {scenario_num:02d}: {name:48s} | {status} | {detail}")
        results.append({
            "scenario_num": scenario_num,
            "name": name,
            "passed": passed,
            "detail": detail
        })

    # -------------------------------------------------------------
    # Scenario 1: Normal Quiet Sleep
    # -------------------------------------------------------------
    engine.reset_buffers()
    fill_engine_buffers(engine, hr=142.0, spo2=97.5, is_apnea_pause=False)
    res = engine.process_inference_step()
    passed = (res["state"] == MonitorState.NORMAL.value and not res["is_alert"] and res["apnea_score"] < 0.35)
    log_test(1, "Normal Quiet Sleep Baseline", passed, f"State: {res['state']}, Score: {res['apnea_score']}")

    # -------------------------------------------------------------
    # Scenario 2: Central Apnea Event Formation
    # -------------------------------------------------------------
    engine.reset_buffers()
    # Cessation of chest movement + HR deceleration + desaturation
    fill_engine_buffers(engine, hr=115.0, spo2=83.0, is_apnea_pause=True)
    _ = engine.process_inference_step()
    _ = engine.process_inference_step()
    res = engine.process_inference_step()
    passed = (res["state"] == MonitorState.APNEA_EVENT.value and res["is_alert"] and res["apnea_score"] >= 0.65)
    log_test(2, "Central Apnea Multi-Evidence Detection", passed, f"State: {res['state']}, Score: {res['apnea_score']}, Event: {res['event_type']}")

    # -------------------------------------------------------------
    # Scenario 3: Obstructive Apnea (Paradoxical Movement)
    # -------------------------------------------------------------
    engine.reset_buffers()
    fill_engine_buffers(engine, hr=112.0, spo2=81.0, is_obstructive=True)
    _ = engine.process_inference_step()
    _ = engine.process_inference_step()
    res = engine.process_inference_step()
    passed = (res["state"] == MonitorState.APNEA_EVENT.value and res["is_alert"])
    log_test(3, "Obstructive Apnea Detection", passed, f"State: {res['state']}, Score: {res['apnea_score']}")

    # -------------------------------------------------------------
    # Scenario 4: Mixed Apnea Transition
    # -------------------------------------------------------------
    engine.reset_buffers()
    fill_engine_buffers(engine, hr=114.0, spo2=83.0, is_mixed=True)
    _ = engine.process_inference_step()
    _ = engine.process_inference_step()
    res = engine.process_inference_step()
    passed = (res["state"] == MonitorState.APNEA_EVENT.value and res["is_alert"])
    log_test(4, "Mixed Apnea Event Classification", passed, f"State: {res['state']}, Score: {res['apnea_score']}")

    # -------------------------------------------------------------
    # Scenario 5: MAX30102 Sensor Probe Disconnection
    # -------------------------------------------------------------
    engine.reset_buffers()
    fill_engine_buffers(engine, is_disconnected=True)
    res = engine.process_inference_step()
    passed = (res["state"] == MonitorState.SENSOR_ERROR.value and not res["is_alert"])
    log_test(5, "Probe Disconnection Quality Shield", passed, f"State: {res['state']}, Reason: {res['reason']}")

    # -------------------------------------------------------------
    # Scenario 6: Camera Occlusion / Blanket Covering Chest
    # -------------------------------------------------------------
    engine.reset_buffers()
    fill_engine_buffers(engine, hr=140.0, spo2=97.0, is_occluded=True)
    res = engine.process_inference_step()
    passed = (res["state"] in [MonitorState.NORMAL.value, MonitorState.VIDEO_UNAVAILABLE.value] and not res["is_alert"])
    log_test(6, "Camera Occlusion Safe Fallback", passed, f"State: {res['state']}, Alert: {res['is_alert']}")

    # -------------------------------------------------------------
    # Scenario 7: High-Energy Infant Motion Artifact
    # -------------------------------------------------------------
    engine.reset_buffers()
    fill_engine_buffers(engine, hr=145.0, spo2=96.0, is_motion=True)
    res = engine.process_inference_step()
    passed = (res["state"] in [MonitorState.MOTION_ARTIFACT.value, MonitorState.NORMAL.value] and not res["is_alert"])
    log_test(7, "Motion Artifact False-Alarm Suppression", passed, f"State: {res['state']}, Alert: {res['is_alert']}")

    # -------------------------------------------------------------
    # Scenario 8: Event Recovery Transition
    # -------------------------------------------------------------
    # Step 1: Apnea event
    fill_engine_buffers(engine, hr=115.0, spo2=83.0, is_apnea_pause=True)
    _ = engine.process_inference_step()
    _ = engine.process_inference_step()
    _ = engine.process_inference_step()
    # Step 2: Normal returns
    fill_engine_buffers(engine, hr=145.0, spo2=98.0, is_apnea_pause=False)
    _ = engine.process_inference_step()
    _ = engine.process_inference_step()
    _ = engine.process_inference_step()
    res = engine.process_inference_step()
    passed = (res["state"] in [MonitorState.RECOVERY.value, MonitorState.NORMAL.value] and not res["is_alert"])
    log_test(8, "Spontaneous Recovery Hysteresis", passed, f"State: {res['state']}, Alert: {res['is_alert']}")

    # -------------------------------------------------------------
    # Scenario 9: Consecutive Window Confirmation Hysteresis
    # -------------------------------------------------------------
    engine.reset_buffers()
    fill_engine_buffers(engine, hr=115.0, spo2=83.0, is_apnea_pause=True)
    res1 = engine.process_inference_step()
    passed = (res1["state"] == MonitorState.SUSPECTED.value and not res1["is_alert"])
    log_test(9, "Single-Window Suspected Filter (No False Alarm)", passed, f"State: {res1['state']}, Confirmed: {res1['is_alert']}")

    # -------------------------------------------------------------
    # Scenario 10: Modality Attribution Breakdown
    # -------------------------------------------------------------
    attr = res1.get("attribution", {})
    passed = ("video_contribution_pct" in attr and "spo2_contribution_pct" in attr and "hr_contribution_pct" in attr)
    log_test(10, "XAI Modality Attribution Verification", passed, f"Vid: {attr.get('video_contribution_pct')}% | SpO2: {attr.get('spo2_contribution_pct')}% | HR: {attr.get('hr_contribution_pct')}%")

    # -------------------------------------------------------------
    # Scenario 11: Clinical Rationale Natural Language Summary
    # -------------------------------------------------------------
    passed = ("clinical_summary" in attr and len(attr["clinical_summary"]) > 5)
    log_test(11, "Clinical Natural Language Rationale", passed, f"Summary: {attr.get('clinical_summary')[:60]}...")

    # -------------------------------------------------------------
    # Scenario 12: Sub-Millisecond ONNX Inference Latency
    # -------------------------------------------------------------
    t_start = time.perf_counter()
    for _ in range(10):
        _ = engine.process_inference_step()
    avg_lat_ms = ((time.perf_counter() - t_start) / 10.0) * 1000.0
    passed = (avg_lat_ms < 15.0)
    log_test(12, "Real-Time Latency Benchmark (<15ms)", passed, f"Measured Avg Latency: {avg_lat_ms:.2f} ms")

    # -------------------------------------------------------------
    # Scenario 13: Buffer Warmup Indicator
    # -------------------------------------------------------------
    engine.reset_buffers()
    res_buf = engine.process_inference_step()
    passed = (res_buf["status"] == "BUFFERING" and not res_buf["is_alert"])
    log_test(13, "Buffer Warmup Detection", passed, f"Status: {res_buf['status']}, Progress: {res_buf.get('progress_pct')}%")

    # -------------------------------------------------------------
    # Scenario 14: Perfusion Index SQI Gating
    # -------------------------------------------------------------
    engine.reset_buffers()
    fill_engine_buffers(engine, hr=140.0, spo2=97.0, pi=0.1)
    res_pi = engine.process_inference_step()
    passed = (res_pi["current_vitals"]["perfusion_index"] < 0.5)
    log_test(14, "Low Peripheral Perfusion Detection", passed, f"PI: {res_pi['current_vitals']['perfusion_index']}%")

    # -------------------------------------------------------------
    # Scenario 15: Mandatory Prototype Disclaimer Verification
    # -------------------------------------------------------------
    passed = ("prototype_disclaimer" in res1 and "NOT A CLINICAL DIAGNOSIS" in res1["prototype_disclaimer"].upper())
    log_test(15, "Mandatory Research & Prototype Disclaimer", passed, f"Disclaimer: {res1.get('prototype_disclaimer')[:60]}...")

    passed_count = sum(1 for r in results if r["passed"])
    print("================================================================================")
    print(f"  SCENARIO VERIFICATION COMPLETE: {passed_count}/{len(results)} PASSED")
    print("================================================================================\n")

    return {
        "total_scenarios": len(results),
        "passed_scenarios": passed_count,
        "results": results
    }


if __name__ == "__main__":
    run_acceptance_tests()
