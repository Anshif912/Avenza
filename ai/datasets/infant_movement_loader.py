"""
Infant Movement Assessment & Optical Flow Respiration Dataset Loader
Processes video-derived chest movement signals, optical flow vectors, and temporal movement features.
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple


class InfantMovementLoader:
    """
    Loader and processor for video-derived infant respiration and movement signals.
    """

    def __init__(self, data_dir: str = "data/raw/infant_movement", target_fps: int = 15):
        self.data_dir = data_dir
        self.target_fps = target_fps
        os.makedirs(self.data_dir, exist_ok=True)

    def extract_movement_features_from_series(
        self,
        displacement: np.ndarray,
        optical_flow_mag: np.ndarray,
        window_size: int = 150,  # 10 seconds at 15 FPS
        stride: int = 15         # 1 second step
    ) -> np.ndarray:
        """
        Segments 1D video movement signals into temporal windows (N_windows, window_size, 2).
        Channels: [displacement, optical_flow_magnitude].
        """
        num_samples = len(displacement)
        windows = []
        for start in range(0, num_samples - window_size + 1, stride):
            end = start + window_size
            w_disp = displacement[start:end]
            w_flow = optical_flow_mag[start:end]
            # Normalize each window robustly
            w_disp_norm = (w_disp - np.mean(w_disp)) / (np.std(w_disp) + 1e-6)
            w_flow_norm = (w_flow - np.mean(w_flow)) / (np.std(w_flow) + 1e-6)
            windows.append(np.stack([w_disp_norm, w_flow_norm], axis=-1))
        return np.array(windows, dtype=np.float32)
