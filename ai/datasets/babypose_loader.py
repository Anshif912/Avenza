"""
babyPose and Infant Pose Movement Dataset Loader
Handles infant keypoint tracking, 2D/3D joint coordinates, and movement kinematics.

SCIENTIFIC CONTEXT:
In preterm and term infants, spontaneous movement patterns (General Movements - GMs) provide
critical neurological and respiratory indicators.
Preterm infant respiratory chest excursions can be tracked via chest/abdomen keypoints or ROI optical flow.
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple


class BabyPoseLoader:
    """
    Loader for infant pose tracking datasets (babyPose format).
    Processes keypoint coordinates (chest, abdomen, head, limbs) into respiratory and general movement time series.
    """

    JOINTS = [
        "nose", "neck", "right_shoulder", "right_elbow", "right_wrist",
        "left_shoulder", "left_elbow", "left_wrist", "chest_midpoint",
        "abdomen_midpoint", "right_hip", "right_knee", "right_ankle",
        "left_hip", "left_knee", "left_ankle"
    ]

    def __init__(self, data_dir: str = "data/raw/babypose", target_fps: int = 15):
        self.data_dir = data_dir
        self.target_fps = target_fps
        os.makedirs(self.data_dir, exist_ok=True)

    def generate_simulated_pose_session(
        self,
        session_id: str,
        duration_sec: int = 120,
        has_central_apnea: bool = False,
        has_motion_artifact: bool = False
    ) -> Dict[str, np.ndarray]:
        """
        Generates realistic infant 2D pose trajectory coordinates over time:
        - Chest and abdomen oscillate at 40-50 bpm (0.67-0.83 Hz) during normal breathing.
        - Central apnea: Chest and abdomen movements cease / collapse to noise floor.
        - Motion artifact: High-frequency, large-displacement limb bursts.
        """
        np.random.seed(abs(hash(session_id)) % (2**32))
        num_frames = int(duration_sec * self.target_fps)
        t = np.linspace(0, duration_sec, num_frames, endpoint=False)
        
        # Base infant position in normalized frame coordinates [0, 1]
        base_positions = {
            "chest_midpoint": np.array([0.50, 0.45]),
            "abdomen_midpoint": np.array([0.50, 0.55]),
            "neck": np.array([0.50, 0.35]),
            "nose": np.array([0.50, 0.25]),
            "right_shoulder": np.array([0.40, 0.38]),
            "left_shoulder": np.array([0.60, 0.38]),
            "right_elbow": np.array([0.35, 0.48]),
            "left_elbow": np.array([0.65, 0.48]),
            "right_wrist": np.array([0.38, 0.55]),
            "left_wrist": np.array([0.62, 0.55]),
            "right_hip": np.array([0.43, 0.65]),
            "left_hip": np.array([0.57, 0.65]),
            "right_knee": np.array([0.40, 0.78]),
            "left_knee": np.array([0.60, 0.78]),
            "right_ankle": np.array([0.42, 0.90]),
            "left_ankle": np.array([0.58, 0.90]),
        }
        
        # Normal respiration: ~42 breaths/min (0.7 Hz)
        resp_freq = 0.70 + 0.05 * np.sin(2 * np.pi * 0.02 * t)
        resp_phase = np.cumsum(2 * np.pi * resp_freq / self.target_fps)
        resp_waveform = np.sin(resp_phase)
        
        # Apnea window: 40s to 60s
        apnea_mask = np.zeros(num_frames, dtype=bool)
        if has_central_apnea and duration_sec >= 60:
            apnea_start = int(40 * self.target_fps)
            apnea_end = int(60 * self.target_fps)
            apnea_mask[apnea_start:apnea_end] = True
            resp_waveform[apnea_mask] *= 0.05  # Severe movement cessation
        
        # Motion burst window: 80s to 90s
        motion_mask = np.zeros(num_frames, dtype=bool)
        if has_motion_artifact and duration_sec >= 90:
            m_start = int(80 * self.target_fps)
            m_end = int(90 * self.target_fps)
            motion_mask[m_start:m_end] = True
        
        trajectories = {}
        for joint, base in base_positions.items():
            coords = np.tile(base, (num_frames, 1))
            
            # Respiratory displacement on chest & abdomen (predominantly Y-axis)
            if "chest" in joint or "abdomen" in joint:
                amp = 0.012 if "chest" in joint else 0.008
                coords[:, 1] += amp * resp_waveform
            
            # Spontaneous General Movements (fidgety movements)
            g_noise = np.random.normal(0, 0.002, (num_frames, 2))
            coords += g_noise
            
            # Limb motion bursts
            if motion_mask.any() and ("wrist" in joint or "ankle" in joint or "knee" in joint):
                coords[motion_mask, :] += np.random.normal(0, 0.06, (np.sum(motion_mask), 2))
                
            trajectories[joint] = coords.astype(np.float32)
        
        # Compute derived kinetic metrics: chest displacement, optical flow proxy, movement energy
        chest_y = trajectories["chest_midpoint"][:, 1]
        chest_velocity = np.gradient(chest_y, 1.0 / self.target_fps)
        chest_displacement = np.abs(chest_y - np.mean(chest_y))
        
        # Movement kinetic energy across all joints
        total_energy = np.zeros(num_frames)
        for joint, coords in trajectories.items():
            vx = np.gradient(coords[:, 0], 1.0 / self.target_fps)
            vy = np.gradient(coords[:, 1], 1.0 / self.target_fps)
            total_energy += 0.5 * (vx**2 + vy**2)
        
        return {
            "session_id": session_id,
            "fps": self.target_fps,
            "timestamps": t,
            "trajectories": trajectories,
            "chest_displacement": chest_displacement.astype(np.float32),
            "chest_velocity": chest_velocity.astype(np.float32),
            "movement_energy": total_energy.astype(np.float32),
            "apnea_mask": apnea_mask.astype(np.int32),
            "motion_mask": motion_mask.astype(np.int32)
        }
