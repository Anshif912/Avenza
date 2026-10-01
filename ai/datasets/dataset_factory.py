"""
Avenza Dataset Factory and PyTorch Dataset Provider
Handles multi-channel alignment, sliding window segmentation, subject-wise train/val/test splits, and DataLoader creation.
"""

import os
import json
import glob
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from typing import Dict, List, Tuple, Optional, Any
from sklearn.model_selection import GroupKFold, GroupShuffleSplit


class AvenzaMultimodalDataset(Dataset):
    """
    PyTorch Dataset for synchronized Multimodal Neonatal Apnea monitoring.
    Returns:
      - video_seq: (T_video, C_video) -> (150, 4) for 10s window at 15 FPS
      - ppg_seq: (T_ppg, C_ppg) -> (500, 4) for 10s window at 50 Hz
      - sqi_vec: (3,) -> [ppg_sqi, video_sqi, perfusion_index]
      - label_binary: 0 or 1
      - label_multiclass: 0=Normal, 1=Central, 2=Obstructive, 3=Mixed
      - subject_id: str
    """

    def __init__(
        self,
        samples: List[Dict[str, Any]],
        transform: Optional[Any] = None
    ):
        self.samples = samples
        self.transform = transform

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        sample = self.samples[idx]
        
        video_seq = torch.tensor(sample["video_seq"], dtype=torch.float32)
        ppg_seq = torch.tensor(sample["ppg_seq"], dtype=torch.float32)
        sqi_vec = torch.tensor(sample["sqi_vec"], dtype=torch.float32)
        
        label_binary = torch.tensor(sample["label_binary"], dtype=torch.float32)
        label_multiclass = torch.tensor(sample["label_multiclass"], dtype=torch.long)
        
        return {
            "video_seq": video_seq,
            "ppg_seq": ppg_seq,
            "sqi_vec": sqi_vec,
            "label_binary": label_binary,
            "label_multiclass": label_multiclass,
            "subject_id": sample["subject_id"],
            "scenario": sample["scenario"]
        }


def extract_windows_from_sessions(
    session_paths: List[str],
    window_sec: int = 10,
    stride_sec: int = 1,
    ppg_fs: int = 50,
    video_fs: int = 15
) -> Tuple[List[Dict[str, Any]], pd.DataFrame]:
    """
    Reads synchronized CSV and JSON files from session directories and segments into sliding windows.
    Also extracts tabular summary features for baseline tree models (XGBoost/RandomForest).
    """
    all_samples: List[Dict[str, Any]] = []
    tabular_records: List[Dict[str, Any]] = []

    window_len_ppg = window_sec * ppg_fs
    stride_len_ppg = stride_sec * ppg_fs
    window_len_video = window_sec * video_fs
    stride_len_video = stride_sec * video_fs

    for sess_dir in session_paths:
        meta_file = os.path.join(sess_dir, "metadata.json")
        ppg_file = os.path.join(sess_dir, "ppg", "ppg.csv")
        mov_file = os.path.join(sess_dir, "movement", "movement.csv")
        sqi_file = os.path.join(sess_dir, "quality", "signal_quality.csv")
        evt_file = os.path.join(sess_dir, "events", "events.json")

        if not (os.path.exists(meta_file) and os.path.exists(ppg_file) and os.path.exists(mov_file)):
            continue

        with open(meta_file, "r") as f:
            meta = json.load(f)
        with open(evt_file, "r") as f:
            events = json.load(f)

        df_ppg = pd.read_csv(ppg_file)
        df_mov = pd.read_csv(mov_file)
        df_sqi = pd.read_csv(sqi_file)

        subject_id = meta.get("subject_id", "unknown")
        scenario = meta.get("scenario", "unknown")

        # PPG channels
        f_red = df_ppg["filtered_red"].values
        f_ir = df_ppg["filtered_ir"].values
        hr = df_ppg["heart_rate"].values / 200.0  # normalized
        spo2 = df_ppg["spo2"].values / 100.0     # normalized
        ppg_matrix = np.stack([f_red, f_ir, hr, spo2], axis=-1)  # (N_ppg, 4)

        # Movement channels
        disp = df_mov["chest_displacement"].values
        oflow = df_mov["optical_flow_magnitude"].values
        pose_y = df_mov["pose_chest_y"].values
        energy = df_mov["movement_energy"].values
        mov_matrix = np.stack([disp, oflow, pose_y, energy], axis=-1)  # (N_video, 4)

        # SQI channels
        p_sqi = df_sqi["ppg_sqi"].values
        v_sqi = df_sqi["video_sqi"].values
        p_idx = df_sqi["perfusion_index"].values / 5.0  # normalized

        total_sec = min(len(df_ppg) / ppg_fs, len(df_mov) / video_fs)
        num_windows = int((total_sec - window_sec) / stride_sec) + 1

        for w_idx in range(num_windows):
            start_sec = w_idx * stride_sec
            end_sec = start_sec + window_sec
            mid_sec = (start_sec + end_sec) / 2.0

            p_start = int(start_sec * ppg_fs)
            p_end = p_start + window_len_ppg
            v_start = int(start_sec * video_fs)
            v_end = v_start + window_len_video

            if p_end > len(ppg_matrix) or v_end > len(mov_matrix):
                continue

            w_ppg = ppg_matrix[p_start:p_end]
            w_mov = mov_matrix[v_start:v_end]
            w_sqi = np.array([
                np.mean(p_sqi[v_start:v_end]),
                np.mean(v_sqi[v_start:v_end]),
                np.mean(p_idx[v_start:v_end])
            ], dtype=np.float32)

            # Determine ground-truth label based on events
            is_apnea = 0
            mc_label = 0  # 0=Normal, 1=Central, 2=Obstructive, 3=Mixed
            for evt in events:
                evt_start = evt["onset_sec"]
                evt_end = evt_start + evt["duration_sec"]
                # If window overlaps significantly (>40%) with event
                overlap_start = max(start_sec, evt_start)
                overlap_end = min(end_sec, evt_end)
                overlap_dur = max(0.0, overlap_end - overlap_start)
                if overlap_dur >= 3.0:
                    is_apnea = 1
                    t_name = evt.get("event_type", "central_apnea")
                    if t_name == "central_apnea":
                        mc_label = 1
                    elif t_name == "obstructive_apnea":
                        mc_label = 2
                    elif t_name == "mixed_apnea":
                        mc_label = 3
                    break

            sample = {
                "video_seq": w_mov.astype(np.float32),
                "ppg_seq": w_ppg.astype(np.float32),
                "sqi_vec": w_sqi,
                "label_binary": float(is_apnea),
                "label_multiclass": mc_label,
                "subject_id": subject_id,
                "scenario": scenario,
                "start_sec": start_sec,
                "end_sec": end_sec
            }
            all_samples.append(sample)

            # Tabular features for Baseline ML (mean, std, min, max, energy)
            tab_feat = {
                "subject_id": subject_id,
                "scenario": scenario,
                "label_binary": is_apnea,
                "label_multiclass": mc_label,
                # Movement features
                "disp_mean": np.mean(w_mov[:, 0]),
                "disp_std": np.std(w_mov[:, 0]),
                "disp_min": np.min(w_mov[:, 0]),
                "disp_max": np.max(w_mov[:, 0]),
                "oflow_mean": np.mean(w_mov[:, 1]),
                "oflow_std": np.std(w_mov[:, 1]),
                "mov_energy_mean": np.mean(w_mov[:, 3]),
                # PPG features
                "hr_mean": np.mean(df_ppg["heart_rate"].values[p_start:p_end]),
                "hr_min": np.min(df_ppg["heart_rate"].values[p_start:p_end]),
                "hr_drop": np.max(df_ppg["heart_rate"].values[p_start:p_end]) - np.min(df_ppg["heart_rate"].values[p_start:p_end]),
                "spo2_mean": np.mean(df_ppg["spo2"].values[p_start:p_end]),
                "spo2_min": np.min(df_ppg["spo2"].values[p_start:p_end]),
                "spo2_drop": np.max(df_ppg["spo2"].values[p_start:p_end]) - np.min(df_ppg["spo2"].values[p_start:p_end]),
                "ppg_red_std": np.std(w_ppg[:, 0]),
                "ppg_ir_std": np.std(w_ppg[:, 1]),
                # SQI features
                "ppg_sqi": w_sqi[0],
                "video_sqi": w_sqi[1],
                "perfusion_idx": w_sqi[2]
            }
            tabular_records.append(tab_feat)

    df_tabular = pd.DataFrame(tabular_records)
    return all_samples, df_tabular


def create_dataloaders(
    samples: List[Dict[str, Any]],
    batch_size: int = 32,
    test_size: float = 0.2,
    val_size: float = 0.1,
    random_state: int = 42
) -> Tuple[DataLoader, DataLoader, DataLoader, List[str], List[str], List[str]]:
    """
    Performs strict Subject-Wise Group Splitting to ensure zero subject leakage between splits.
    Returns:
      (train_loader, val_loader, test_loader, train_subjects, val_subjects, test_subjects)
    """
    subjects = np.array([s["subject_id"] for s in samples])
    unique_subjects = np.unique(subjects)
    np.random.seed(random_state)
    shuffled_subjects = np.random.permutation(unique_subjects)

    n_total = len(shuffled_subjects)
    n_test = max(1, int(n_total * test_size))
    n_val = max(1, int(n_total * val_size))
    n_train = n_total - n_test - n_val

    test_subs = list(shuffled_subjects[:n_test])
    val_subs = list(shuffled_subjects[n_test:n_test + n_val])
    train_subs = list(shuffled_subjects[n_test + n_val:])

    train_samples = [s for s in samples if s["subject_id"] in train_subs]
    val_samples = [s for s in samples if s["subject_id"] in val_subs]
    test_samples = [s for s in samples if s["subject_id"] in test_subs]

    train_ds = AvenzaMultimodalDataset(train_samples)
    val_ds = AvenzaMultimodalDataset(val_samples)
    test_ds = AvenzaMultimodalDataset(test_samples)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=False)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, drop_last=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, drop_last=False)

    return train_loader, val_loader, test_loader, train_subs, val_subs, test_subs
