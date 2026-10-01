"""
Avenza Signal Preprocessing and Feature Extraction Package
"""

from .signal_filters import butter_bandpass_filter, remove_baseline_wander, normalize_signal
from .optical_flow_extractor import OpticalFlowExtractor
from .feature_extractor import BiomedicalFeatureExtractor
from .signal_quality import SignalQualityShield
from .windowing import generate_sliding_windows

__all__ = [
    "butter_bandpass_filter",
    "remove_baseline_wander",
    "normalize_signal",
    "OpticalFlowExtractor",
    "BiomedicalFeatureExtractor",
    "SignalQualityShield",
    "generate_sliding_windows",
]
