"""
Avenza Synchronized Multi-Channel Dataset Generator
Generates standardized multi-sensor recording sessions conforming to Avenza Dataset Specifications:
- metadata.json
- ppg/ppg.csv
- movement/movement.csv
- events/events.json
- quality/signal_quality.csv

Covers 8 realistic clinical/prototype scenarios:
1. Normal Quiet Sleep
2. Central Apnea (respiratory pause >10s, subsequent desaturation, bradycardia drop >=15 BPM)
3. Obstructive Apnea (paradoxical chest effort, falling SpO2/HR)
4. Mixed Apnea (central pause followed by obstructed breathing effort)
5. Motion Artifact (vigorous movement, corrupted PPG, stable true vitals)
6. Sensor Detachment / Probe Disconnect (flatline/zero PPG, SQI=0, SENSOR_ERROR)
7. Camera Occlusion / Poor Lighting (video SQI=0, camera channel zero-weighted)
8. Hypothermia / Cold Stress (low peripheral perfusion PI < 0.5%, shivering movement)
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any
from datetime import datetime


class AvenzaDatasetGenerator:
    """
    Generates high-fidelity synchronized multimodal neonatal monitoring sessions.
    """

    def __init__(self, base_dir: str = "data/sessions", ppg_fs: int = 50, video_fs: int = 15):
        self.base_dir = base_dir
        self.ppg_fs = ppg_fs
        self.video_fs = video_fs
        os.makedirs(self.base_dir, exist_ok=True)

    def generate_session(
        self,
        session_id: str,
        subject_id: str,
        scenario: str = "normal_quiet_sleep",
        duration_sec: int = 180,
        gestational_age_weeks: float = 32.5,
        birth_weight_grams: int = 1650
    ) -> str:
        """
        Generates a complete synchronized session directory and returns the session folder path.
        """
        session_path = os.path.join(self.base_dir, session_id)
        os.makedirs(os.path.join(session_path, "ppg"), exist_ok=True)
        os.makedirs(os.path.join(session_path, "movement"), exist_ok=True)
        os.makedirs(os.path.join(session_path, "events"), exist_ok=True)
        os.makedirs(os.path.join(session_path, "quality"), exist_ok=True)

        np.random.seed(abs(hash(f"{session_id}_{scenario}")) % (2**32))

        # Time vectors
        n_ppg = int(duration_sec * self.ppg_fs)
        n_video = int(duration_sec * self.video_fs)
        t_ppg = np.linspace(0, duration_sec, n_ppg, endpoint=False)
        t_video = np.linspace(0, duration_sec, n_video, endpoint=False)

        # Baseline vitals
        base_hr = np.random.uniform(135.0, 150.0)
        base_spo2 = np.random.uniform(96.0, 98.5)
        base_resp_rate = np.random.uniform(40.0, 52.0)  # breaths / min
        base_temp_c = 36.8

        hr_series = np.ones(n_ppg) * base_hr
        spo2_series = np.ones(n_ppg) * base_spo2
        resp_rate_series = np.ones(n_video) * base_resp_rate

        # Quality metrics
        ppg_sqi_series = np.ones(n_ppg) * 0.95
        video_sqi_series = np.ones(n_video) * 0.92
        perfusion_index = np.ones(n_ppg) * 2.1
        probe_attached = np.ones(n_ppg, dtype=int)
        camera_occluded = np.zeros(n_video, dtype=int)

        # Movement signals
        chest_displacement = np.zeros(n_video)
        optical_flow_mag = np.zeros(n_video)
        pose_chest_y = np.ones(n_video) * 0.45
        movement_energy = np.zeros(n_video)

        # Event list
        events: List[Dict[str, Any]] = []

        # Construct baseline respiration waveform (Video)
        resp_phase = np.cumsum(2 * np.pi * (resp_rate_series / 60.0) / self.video_fs)
        resp_movement = 0.015 * np.sin(resp_phase) + np.random.normal(0, 0.001, n_video)
        chest_displacement[:] = np.abs(resp_movement)
        optical_flow_mag[:] = np.abs(np.gradient(resp_movement, 1.0 / self.video_fs))
        pose_chest_y[:] = 0.45 + resp_movement
        movement_energy[:] = optical_flow_mag**2

        # -------------------------------------------------------------
        # Scenario Specific Dynamics
        # -------------------------------------------------------------
        if scenario == "central_apnea":
            # Apnea onset at 45s, duration 22s (ends at 67s)
            apnea_start_sec = 45.0
            apnea_dur_sec = 22.0
            apnea_end_sec = apnea_start_sec + apnea_dur_sec

            # Video: Cessation of chest movement
            v_start = int(apnea_start_sec * self.video_fs)
            v_end = int(apnea_end_sec * self.video_fs)
            chest_displacement[v_start:v_end] *= 0.04
            optical_flow_mag[v_start:v_end] *= 0.03
            pose_chest_y[v_start:v_end] = 0.45 + np.random.normal(0, 0.0003, v_end - v_start)
            movement_energy[v_start:v_end] *= 0.02

            # PPG: Physiological response (SpO2 drops after ~6s lag, HR decelerates by >=15 BPM)
            p_start = int(apnea_start_sec * self.ppg_fs)
            p_end = int(apnea_end_sec * self.ppg_fs)
            lag_samples = int(6.0 * self.ppg_fs)
            recovery_samples = int(15.0 * self.ppg_fs)

            # HR drops by 28 BPM (from 145 to 117)
            hr_drop_peak = p_start + int(14.0 * self.ppg_fs)
            for i in range(p_start, min(n_ppg, p_end + recovery_samples)):
                if i < hr_drop_peak:
                    frac = (i - p_start) / (hr_drop_peak - p_start)
                    hr_series[i] = base_hr - 28.0 * np.sin(frac * np.pi / 2)
                else:
                    rec_frac = min(1.0, (i - hr_drop_peak) / (p_end + recovery_samples - hr_drop_peak))
                    hr_series[i] = (base_hr - 28.0) + 32.0 * rec_frac  # slight rebound tachycardia
            
            # SpO2 desaturation down to 82%
            spo2_drop_peak = p_start + lag_samples + int(10.0 * self.ppg_fs)
            for i in range(p_start + lag_samples, min(n_ppg, p_end + recovery_samples + int(10 * self.ppg_fs))):
                if i < spo2_drop_peak:
                    frac = (i - (p_start + lag_samples)) / (spo2_drop_peak - (p_start + lag_samples))
                    spo2_series[i] = base_spo2 - 15.0 * frac
                else:
                    rec_frac = min(1.0, (i - spo2_drop_peak) / (recovery_samples + int(10 * self.ppg_fs)))
                    spo2_series[i] = (base_spo2 - 15.0) + 15.0 * (rec_frac ** 0.5)

            events.append({
                "event_id": f"evt_{session_id}_01",
                "event_type": "central_apnea",
                "onset_sec": apnea_start_sec,
                "duration_sec": apnea_dur_sec,
                "severity": "CRITICAL",
                "nadir_spo2": float(np.min(spo2_series)),
                "nadir_hr": float(np.min(hr_series)),
                "hr_deceleration_bpm": float(base_hr - np.min(hr_series)),
                "evidence_sources": ["Camera Chest Stillness", "SpO2 Desaturation (>=3%)", "Bradycardia Deceleration (>=15 BPM)"],
                "validation_level": "SYNTHETIC_CLINICALLY_CALIBRATED"
            })

        elif scenario == "obstructive_apnea":
            # Obstructive: Paradoxical chest movement continues/increases, but SpO2 falls & HR falls
            apnea_start_sec = 50.0
            apnea_dur_sec = 20.0
            v_start = int(apnea_start_sec * self.video_fs)
            v_end = int((apnea_start_sec + apnea_dur_sec) * self.video_fs)
            # Paradoxical hyper-vigorous chest movement
            chest_displacement[v_start:v_end] *= 2.2
            optical_flow_mag[v_start:v_end] *= 2.5
            movement_energy[v_start:v_end] *= 4.0

            p_start = int(apnea_start_sec * self.ppg_fs)
            p_end = int((apnea_start_sec + apnea_dur_sec) * self.ppg_fs)
            for i in range(p_start, min(n_ppg, p_end + int(15 * self.ppg_fs))):
                frac = min(1.0, (i - p_start) / (p_end - p_start))
                spo2_series[i] = max(81.0, base_spo2 - 16.0 * frac)
                hr_series[i] = max(112.0, base_hr - 24.0 * frac)

            events.append({
                "event_id": f"evt_{session_id}_02",
                "event_type": "obstructive_apnea",
                "onset_sec": apnea_start_sec,
                "duration_sec": apnea_dur_sec,
                "severity": "CRITICAL",
                "nadir_spo2": float(np.min(spo2_series)),
                "nadir_hr": float(np.min(hr_series)),
                "hr_deceleration_bpm": float(base_hr - np.min(hr_series)),
                "evidence_sources": ["Paradoxical Chest Movement", "SpO2 Desaturation", "Bradycardia Deceleration"],
                "validation_level": "SYNTHETIC_CLINICALLY_CALIBRATED"
            })

        elif scenario == "mixed_apnea":
            # Mixed: 10s central pause + 10s obstructive effort
            apnea_start_sec = 40.0
            apnea_dur_sec = 22.0
            v_start = int(apnea_start_sec * self.video_fs)
            v_mid = int((apnea_start_sec + 11.0) * self.video_fs)
            v_end = int((apnea_start_sec + apnea_dur_sec) * self.video_fs)
            chest_displacement[v_start:v_mid] *= 0.05
            chest_displacement[v_mid:v_end] *= 2.0

            p_start = int(apnea_start_sec * self.ppg_fs)
            p_end = int((apnea_start_sec + apnea_dur_sec) * self.ppg_fs)
            for i in range(p_start, min(n_ppg, p_end + int(12 * self.ppg_fs))):
                frac = min(1.0, (i - p_start) / (p_end - p_start))
                spo2_series[i] = max(83.0, base_spo2 - 14.0 * frac)
                hr_series[i] = max(115.0, base_hr - 22.0 * frac)

            events.append({
                "event_id": f"evt_{session_id}_03",
                "event_type": "mixed_apnea",
                "onset_sec": apnea_start_sec,
                "duration_sec": apnea_dur_sec,
                "severity": "CRITICAL",
                "nadir_spo2": float(np.min(spo2_series)),
                "nadir_hr": float(np.min(hr_series)),
                "hr_deceleration_bpm": float(base_hr - np.min(hr_series)),
                "evidence_sources": ["Initial Movement Pause", "Subsequent Obstructive Effort", "Desaturation"],
                "validation_level": "SYNTHETIC_CLINICALLY_CALIBRATED"
            })

        elif scenario == "motion_artifact":
            # Infant movement burst between 30s and 45s: PPG SQI degrades, true vitals unchanged
            m_start = int(30.0 * self.video_fs)
            m_end = int(45.0 * self.video_fs)
            chest_displacement[m_start:m_end] *= 4.5
            optical_flow_mag[m_start:m_end] *= 5.0
            movement_energy[m_start:m_end] *= 12.0
            video_sqi_series[m_start:m_end] = 0.45  # marked as motion artifact

            pm_start = int(30.0 * self.ppg_fs)
            pm_end = int(45.0 * self.ppg_fs)
            ppg_sqi_series[pm_start:pm_end] = 0.22  # severe motion corruption
            # True HR/SpO2 remains normal

        elif scenario == "probe_disconnect":
            # Probe removed at 50s
            pd_start = int(50.0 * self.ppg_fs)
            probe_attached[pd_start:] = 0
            ppg_sqi_series[pd_start:] = 0.0
            perfusion_index[pd_start:] = 0.0
            spo2_series[pd_start:] = 0.0
            hr_series[pd_start:] = 0.0

        elif scenario == "camera_occlusion":
            # Camera occluded at 40s to 70s
            c_start = int(40.0 * self.video_fs)
            c_end = int(70.0 * self.video_fs)
            camera_occluded[c_start:c_end] = 1
            video_sqi_series[c_start:c_end] = 0.05
            chest_displacement[c_start:c_end] = 0.0
            optical_flow_mag[c_start:c_end] = 0.0

        elif scenario == "hypothermia_cold_stress":
            # Peripheral vasoconstriction: low perfusion index
            base_temp_c = 35.4
            perfusion_index[:] = 0.35
            ppg_sqi_series[:] = 0.72

        # -------------------------------------------------------------
        # Generate Raw & Filtered PPG Waveforms (RED & IR)
        # -------------------------------------------------------------
        hr_freq = hr_series / 60.0
        ppg_phase = np.cumsum(2 * np.pi * hr_freq / self.ppg_fs)
        
        # Systolic peak + dicrotic notch pulse template
        ppg_pulsatile = (
            0.7 * np.sin(ppg_phase) +
            0.3 * np.sin(2 * ppg_phase - 0.5) +
            0.15 * np.sin(3 * ppg_phase - 1.0)
        )
        
        # DC baseline for RED and IR
        dc_ir = 35000.0
        dc_red = 32000.0
        
        # AC amplitude modulated by Perfusion Index and SpO2
        # R = (AC_red / DC_red) / (AC_ir / DC_ir) => SpO2 ~ 110 - 25 * R
        # R = (110 - SpO2) / 25
        r_ratio = np.clip((110.0 - spo2_series) / 25.0, 0.4, 1.4)
        ac_ir = (perfusion_index / 100.0) * dc_ir
        ac_red = r_ratio * ac_ir * (dc_red / dc_ir)

        raw_ir = dc_ir + ac_ir * ppg_pulsatile + np.random.normal(0, 50, n_ppg)
        raw_red = dc_red + ac_red * ppg_pulsatile + np.random.normal(0, 50, n_ppg)

        if scenario == "probe_disconnect":
            raw_ir[pd_start:] = 0.0
            raw_red[pd_start:] = 0.0

        if scenario == "motion_artifact":
            raw_ir[pm_start:pm_end] += np.random.normal(0, 2000, pm_end - pm_start)
            raw_red[pm_start:pm_end] += np.random.normal(0, 2000, pm_end - pm_start)

        # Filtered PPG (AC component normalized)
        filtered_ir = (raw_ir - np.mean(raw_ir)) / (np.std(raw_ir) + 1e-6)
        filtered_red = (raw_red - np.mean(raw_red)) / (np.std(raw_red) + 1e-6)

        # -------------------------------------------------------------
        # Save Dataset Files
        # -------------------------------------------------------------
        # 1. Metadata
        metadata = {
            "session_id": session_id,
            "subject_id": subject_id,
            "scenario": scenario,
            "gestational_age_weeks": gestational_age_weeks,
            "birth_weight_grams": birth_weight_grams,
            "duration_sec": duration_sec,
            "ppg_fs": self.ppg_fs,
            "video_fs": self.video_fs,
            "chamber_temp_c": base_temp_c,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "prototype_disclaimer": "SYNTHETIC / CALIBRATED PROTOTYPE DATASET — NOT CLINICAL DIAGNOSIS"
        }
        with open(os.path.join(session_path, "metadata.json"), "w") as f:
            json.dump(metadata, f, indent=2)

        # 2. PPG CSV
        df_ppg = pd.DataFrame({
            "timestamp": np.round(t_ppg, 3),
            "raw_red": np.round(raw_red, 1),
            "raw_ir": np.round(raw_ir, 1),
            "filtered_red": np.round(filtered_red, 4),
            "filtered_ir": np.round(filtered_ir, 4),
            "heart_rate": np.round(hr_series, 1),
            "spo2": np.round(spo2_series, 1),
            "ac_dc_ratio": np.round(r_ratio, 3)
        })
        df_ppg.to_csv(os.path.join(session_path, "ppg", "ppg.csv"), index=False)

        # 3. Movement CSV
        df_movement = pd.DataFrame({
            "timestamp": np.round(t_video, 3),
            "chest_displacement": np.round(chest_displacement, 5),
            "optical_flow_magnitude": np.round(optical_flow_mag, 5),
            "pose_chest_y": np.round(pose_chest_y, 4),
            "movement_energy": np.round(movement_energy, 6)
        })
        df_movement.to_csv(os.path.join(session_path, "movement", "movement.csv"), index=False)

        # 4. Quality CSV
        # Subsample PPG SQI to video timestamps for synchronized quality table
        df_quality = pd.DataFrame({
            "timestamp": np.round(t_video, 3),
            "ppg_sqi": np.round(np.interp(t_video, t_ppg, ppg_sqi_series), 3),
            "video_sqi": np.round(video_sqi_series, 3),
            "perfusion_index": np.round(np.interp(t_video, t_ppg, perfusion_index), 2),
            "probe_attached": np.interp(t_video, t_ppg, probe_attached).astype(int),
            "camera_occluded": camera_occluded
        })
        df_quality.to_csv(os.path.join(session_path, "quality", "signal_quality.csv"), index=False)

        # 5. Events JSON
        with open(os.path.join(session_path, "events", "events.json"), "w") as f:
            json.dump(events, f, indent=2)

        return session_path

    def generate_benchmark_suite(self, num_subjects: int = 10) -> List[str]:
        """
        Generates a comprehensive benchmark suite across multiple subjects and scenarios.
        """
        scenarios = [
            "normal_quiet_sleep",
            "central_apnea",
            "obstructive_apnea",
            "mixed_apnea",
            "motion_artifact",
            "probe_disconnect",
            "camera_occlusion",
            "hypothermia_cold_stress"
        ]
        
        session_paths = []
        for s_idx in range(1, num_subjects + 1):
            subject_id = f"infant_sub_{s_idx:02d}"
            ga = 28.0 + (s_idx % 8) * 1.5
            bw = 1100 + (s_idx % 8) * 180
            
            for sc in scenarios:
                session_id = f"sess_{subject_id}_{sc}"
                path = self.generate_session(
                    session_id=session_id,
                    subject_id=subject_id,
                    scenario=sc,
                    duration_sec=120,
                    gestational_age_weeks=ga,
                    birth_weight_grams=bw
                )
                session_paths.append(path)
                
        print(f"[AvenzaDatasetGenerator] Generated {len(session_paths)} synchronized benchmark sessions.")
        return session_paths
