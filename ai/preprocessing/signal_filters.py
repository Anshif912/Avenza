"""
Digital Signal Filtering and Preprocessing for Neonatal Biomedical Signals
"""

import numpy as np
from scipy import signal
from typing import Tuple, Optional


def butter_bandpass(lowcut: float, highcut: float, fs: float, order: int = 4):
    """
    Designs a Butterworth bandpass filter.
    """
    nyq = 0.5 * fs
    low = max(0.01, lowcut / nyq)
    high = min(0.99, highcut / nyq)
    b, a = signal.butter(order, [low, high], btype='band')
    return b, a


def butter_bandpass_filter(
    data: np.ndarray,
    lowcut: float,
    highcut: float,
    fs: float,
    order: int = 4
) -> np.ndarray:
    """
    Applies forward-backward zero-phase digital filtering (filtfilt).
    """
    if len(data) < order * 3:
        return data
    b, a = butter_bandpass(lowcut, highcut, fs, order=order)
    try:
        y = signal.filtfilt(b, a, data)
        return y.astype(np.float32)
    except Exception:
        return data.astype(np.float32)


def remove_baseline_wander(data: np.ndarray, fs: float, cutoff_hz: float = 0.5) -> np.ndarray:
    """
    Removes low-frequency baseline drift / wander using a high-pass Butterworth filter.
    """
    if len(data) < 12:
        return data
    nyq = 0.5 * fs
    normal_cutoff = max(0.01, min(0.99, cutoff_hz / nyq))
    b, a = signal.butter(2, normal_cutoff, btype='high', analog=False)
    try:
        return signal.filtfilt(b, a, data).astype(np.float32)
    except Exception:
        return (data - np.mean(data)).astype(np.float32)


def normalize_signal(data: np.ndarray, method: str = "zscore") -> np.ndarray:
    """
    Normalizes signal using z-score or robust median/IQR scaling.
    """
    if method == "zscore":
        std = np.std(data)
        if std < 1e-7:
            return np.zeros_like(data)
        return ((data - np.mean(data)) / std).astype(np.float32)
    elif method == "minmax":
        min_v = np.min(data)
        max_v = np.max(data)
        if abs(max_v - min_v) < 1e-7:
            return np.zeros_like(data)
        return ((data - min_v) / (max_v - min_v)).astype(np.float32)
    elif method == "robust":
        median = np.median(data)
        iqr = np.percentile(data, 75) - np.percentile(data, 25)
        if iqr < 1e-7:
            return np.zeros_like(data)
        return ((data - median) / iqr).astype(np.float32)
    return data
