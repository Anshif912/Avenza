"""
Biomedical Feature Extractor for Tabular Baseline and Hybrid Classification
"""

import numpy as np
from scipy import signal, stats
from typing import Dict, List, Any


class BiomedicalFeatureExtractor:
    """
    Computes statistical, temporal, spectral, and cross-channel features from multimodal windows.
    """

    @staticmethod
    def extract_time_domain(sig: np.ndarray, prefix: str = "") -> Dict[str, float]:
        """
        Extracts time-domain statistical moments and peak dynamics.
        """
        if len(sig) == 0:
            return {}
        
        sig_mean = float(np.mean(sig))
        sig_std = float(np.std(sig))
        sig_max = float(np.max(sig))
        sig_min = float(np.min(sig))
        sig_ptp = sig_max - sig_min
        sig_rms = float(np.sqrt(np.mean(sig**2)))
        
        # Zero-crossing rate
        zero_crossings = float(np.sum(np.diff(np.sign(sig - sig_mean) != 0)) / max(1, len(sig)))
        
        # Kurtosis and Skewness
        sig_skew = float(stats.skew(sig)) if sig_std > 1e-6 else 0.0
        sig_kurt = float(stats.kurtosis(sig)) if sig_std > 1e-6 else 0.0

        p = f"{prefix}_" if prefix else ""
        return {
            f"{p}mean": sig_mean,
            f"{p}std": sig_std,
            f"{p}max": sig_max,
            f"{p}min": sig_min,
            f"{p}ptp": sig_ptp,
            f"{p}rms": sig_rms,
            f"{p}zcr": zero_crossings,
            f"{p}skew": sig_skew,
            f"{p}kurt": sig_kurt
        }

    @staticmethod
    def extract_frequency_domain(sig: np.ndarray, fs: float, prefix: str = "") -> Dict[str, float]:
        """
        Extracts spectral features: dominant frequency, spectral entropy, band power.
        """
        if len(sig) < 8:
            return {}

        freqs, psd = signal.welch(sig, fs=fs, nperseg=min(len(sig), int(fs * 4)))
        psd_sum = np.sum(psd) + 1e-12
        psd_norm = psd / psd_sum
        
        # Spectral entropy
        spectral_entropy = float(-np.sum(psd_norm * np.log2(psd_norm + 1e-12)))
        
        # Dominant peak frequency
        dominant_freq = float(freqs[np.argmax(psd)])

        # Band powers (e.g. VLF: 0.01-0.2 Hz, LF: 0.2-0.8 Hz, HF: 0.8-2.5 Hz)
        vlf_mask = (freqs >= 0.01) & (freqs < 0.2)
        lf_mask = (freqs >= 0.2) & (freqs < 0.8)
        hf_mask = (freqs >= 0.8) & (freqs < 2.5)

        p_vlf = float(np.sum(psd[vlf_mask]))
        p_lf = float(np.sum(psd[lf_mask]))
        p_hf = float(np.sum(psd[hf_mask]))
        lf_hf_ratio = p_lf / max(1e-6, p_hf)

        p = f"{prefix}_" if prefix else ""
        return {
            f"{p}dom_freq": dominant_freq,
            f"{p}spec_entropy": spectral_entropy,
            f"{p}p_vlf": p_vlf,
            f"{p}p_lf": p_lf,
            f"{p}p_hf": p_hf,
            f"{p}lf_hf_ratio": lf_hf_ratio
        }

    @classmethod
    def extract_all_window_features(
        cls,
        video_window: np.ndarray,
        ppg_window: np.ndarray,
        hr_series: np.ndarray,
        spo2_series: np.ndarray,
        sqi_vec: np.ndarray,
        video_fs: float = 15.0,
        ppg_fs: float = 50.0
    ) -> Dict[str, float]:
        """
        Extracts full comprehensive feature vector for a 10s multimodal window.
        """
        features = {}

        # Video movement features (chest displacement & optical flow)
        if len(video_window.shape) > 1:
            disp = video_window[:, 0]
            oflow = video_window[:, 1]
        else:
            disp = video_window
            oflow = np.gradient(video_window)

        features.update(cls.extract_time_domain(disp, prefix="vid_disp"))
        features.update(cls.extract_frequency_domain(disp, fs=video_fs, prefix="vid_disp"))
        features.update(cls.extract_time_domain(oflow, prefix="vid_oflow"))

        # PPG features (filtered RED & IR)
        if len(ppg_window.shape) > 1:
            f_red = ppg_window[:, 0]
            f_ir = ppg_window[:, 1]
        else:
            f_red = ppg_window
            f_ir = ppg_window

        features.update(cls.extract_time_domain(f_ir, prefix="ppg_ir"))
        features.update(cls.extract_frequency_domain(f_ir, fs=ppg_fs, prefix="ppg_ir"))
        features.update(cls.extract_time_domain(f_red, prefix="ppg_red"))

        # HR & SpO2 dynamics
        features.update(cls.extract_time_domain(hr_series, prefix="hr"))
        features["hr_drop_from_max"] = float(np.max(hr_series) - np.min(hr_series))
        
        features.update(cls.extract_time_domain(spo2_series, prefix="spo2"))
        features["spo2_drop_from_max"] = float(np.max(spo2_series) - np.min(spo2_series))

        # SQI metrics
        features["ppg_sqi"] = float(sqi_vec[0])
        features["video_sqi"] = float(sqi_vec[1])
        features["perfusion_index"] = float(sqi_vec[2])

        return features
