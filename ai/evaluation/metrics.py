"""
Biomedical Monitoring Evaluation Metrics Suite
"""

import numpy as np
from typing import Dict, List, Tuple, Any
from sklearn.metrics import (
    confusion_matrix, roc_auc_score, average_precision_score,
    f1_score, precision_score, recall_score
)


def compute_biomedical_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
    total_monitoring_hours: float = 1.0
) -> Dict[str, float]:
    """
    Computes comprehensive biomedical detection metrics:
    - Sensitivity / Recall (TPR)
    - Specificity (TNR)
    - Precision / PPV
    - Negative Predictive Value (NPV)
    - F1-Score
    - AUROC
    - AUPRC
    - False Alarms per Hour (FAR/hr)
    """
    y_true = np.asarray(y_true).astype(int)
    y_pred = np.asarray(y_pred).astype(int)
    y_prob = np.asarray(y_prob).astype(float)

    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

    sensitivity = float(tp / max(1, tp + fn))
    specificity = float(tn / max(1, tn + fp))
    precision = float(tp / max(1, tp + fp))
    npv = float(tn / max(1, tn + fn))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    try:
        auroc = float(roc_auc_score(y_true, y_prob))
        auprc = float(average_precision_score(y_true, y_prob))
    except Exception:
        auroc = 0.5
        auprc = 0.5

    false_alarms_per_hour = float(fp / max(0.01, total_monitoring_hours))

    return {
        "sensitivity": sensitivity,
        "specificity": specificity,
        "precision": precision,
        "npv": npv,
        "f1_score": f1,
        "auroc": auroc,
        "auprc": auprc,
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
        "false_alarms_per_hour": false_alarms_per_hour
    }


def calculate_false_alarm_rate(fp_count: int, total_duration_seconds: float) -> float:
    """
    Calculates False Alarms per Hour (FA/hr).
    """
    hours = max(0.001, total_duration_seconds / 3600.0)
    return float(fp_count / hours)


def calculate_detection_latency(
    ground_truth_events: List[Dict[str, Any]],
    detected_events: List[Dict[str, Any]],
    tolerance_sec: float = 8.0
) -> Dict[str, float]:
    """
    Computes mean detection latency (seconds from ground-truth event onset to detection confirmation).
    """
    latencies = []
    for gt in ground_truth_events:
        gt_onset = gt["onset_sec"]
        # Find matching detected event
        matched = False
        for det in detected_events:
            det_onset = det.get("onset_sec", det.get("timestamp", 0.0))
            if abs(det_onset - gt_onset) <= tolerance_sec or (gt_onset <= det_onset <= gt_onset + gt["duration_sec"]):
                latencies.append(max(0.0, det_onset - gt_onset))
                matched = True
                break

    mean_lat = float(np.mean(latencies)) if len(latencies) > 0 else 0.0
    median_lat = float(np.median(latencies)) if len(latencies) > 0 else 0.0

    return {
        "mean_latency_sec": mean_lat,
        "median_latency_sec": median_lat,
        "matched_events": len(latencies),
        "total_gt_events": len(ground_truth_events)
    }
