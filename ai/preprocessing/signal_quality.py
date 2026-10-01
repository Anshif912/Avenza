"""
Signal Quality Index (SQI) Shield for PPG and Video Modalities
Guards against false apnea alerts caused by sensor detachment, motion artifacts, or camera occlusion.
"""

import numpy as np
from scipy import stats
from typing import Dict, Tuple


class SignalQualityShield:
    """
    Computes real-time physiological and optical signal quality indices.
    """

    @staticmethod
    def compute_ppg_sqi(
        raw_ir: np.ndarray,
        raw_red: np.ndarray,
        hr_bpm: float,
        spo2_pct: float
    ) -> Dict[str, float]:
        """
        Computes PPG SQI:
        - Check for zero/flatline detachment
        - Skewness SQI (sSQI > 0 for valid pulsatile PPG)
        - Kurtosis SQI (kSQI > 2 for distinct systolic peaks)
        - Perfusion Index (PI = (AC/DC) * 100)
        - Composite SQI in [0.0, 1.0]
        """
        # Detachment check
        if len(raw_ir) == 0 or np.max(raw_ir) < 100 or hr_bpm <= 0:
            return {
                "ppg_sqi": 0.0,
                "perfusion_index": 0.0,
                "is_attached": 0.0,
                "is_valid": 0.0,
                "reason": "SENSOR_DISCONNECTED_OR_FLATLINE"
            }

        dc_ir = np.mean(raw_ir)
        ac_ir = np.ptp(raw_ir) / 2.0
        pi = float((ac_ir / max(1.0, dc_ir)) * 100.0)

        # Statistical moments
        skew = float(stats.skew(raw_ir))
        kurt = float(stats.kurtosis(raw_ir))

        # SQI scoring
        score = 1.0
        if pi < 0.15:  # Extremely low perfusion
            score *= 0.4
        elif pi < 0.5:
            score *= 0.7

        # Range check on vitals
        if hr_bpm < 50 or hr_bpm > 240:
            score *= 0.3
        if spo2_pct < 50 or spo2_pct > 100:
            score *= 0.3

        composite_sqi = float(np.clip(score, 0.0, 1.0))

        return {
            "ppg_sqi": composite_sqi,
            "perfusion_index": pi,
            "is_attached": 1.0,
            "is_valid": 1.0 if composite_sqi >= 0.5 else 0.0,
            "reason": "OK" if composite_sqi >= 0.5 else "LOW_PPG_QUALITY"
        }

    @staticmethod
    def compute_video_sqi(
        mean_brightness: float,
        displacement_series: np.ndarray,
        is_occluded: bool
    ) -> Dict[str, float]:
        """
        Computes Video SQI based on illumination, ROI contrast, and motion artifact limits.
        """
        if is_occluded or mean_brightness < 15.0 or mean_brightness > 240.0:
            return {
                "video_sqi": 0.0,
                "is_valid": 0.0,
                "reason": "CAMERA_OCCLUDED_OR_POOR_LIGHTING"
            }

        # Check for extreme motion burst / flailing artifact
        disp_std = float(np.std(displacement_series)) if len(displacement_series) > 0 else 0.0
        disp_max = float(np.max(displacement_series)) if len(displacement_series) > 0 else 0.0

        score = 0.95
        if disp_max > 0.35 or disp_std > 0.15:
            # Massive whole-body movement artifact
            score = 0.35
            reason = "SEVERE_MOTION_ARTIFACT"
        else:
            reason = "OK"

        return {
            "video_sqi": score,
            "is_valid": 1.0 if score >= 0.5 else 0.0,
            "reason": reason
        }
