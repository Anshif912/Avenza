"""
Sliding Window Segmentation Utility
"""

import numpy as np
from typing import List, Tuple, Dict, Any


def generate_sliding_windows(
    data: np.ndarray,
    window_samples: int,
    stride_samples: int
) -> List[np.ndarray]:
    """
    Generates contiguous sliding windows from a 1D or 2D NumPy array.
    """
    windows = []
    total_len = len(data)
    for start in range(0, total_len - window_samples + 1, stride_samples):
        end = start + window_samples
        windows.append(data[start:end])
    return windows
