"""
Baseline Tree Model Training and Cross-Validation Script
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List

from ..models.baseline_model import BaselineTreeModel
from .cross_validation import SubjectWiseCrossValidator


def train_and_eval_baselines(df_tabular: pd.DataFrame, output_dir: str = "data/processed/models") -> Dict[str, Any]:
    """
    Trains and validates Random Forest and XGBoost baselines using Subject-Wise 5-Fold CV.
    """
    os.makedirs(output_dir, exist_ok=True)
    cv = SubjectWiseCrossValidator(n_splits=5)

    results = {
        "random_forest": [],
        "xgboost": []
    }

    print("[Baseline Training] Starting 5-Fold Subject-Wise Cross-Validation...")

    for fold_idx, (df_train, df_val) in enumerate(cv.split_tabular(df_tabular)):
        print(f"  --- Fold {fold_idx + 1}/5 (Train Subjects: {len(df_train['subject_id'].unique())}, Val Subjects: {len(df_val['subject_id'].unique())}) ---")
        
        # 1. Random Forest
        rf = BaselineTreeModel(model_type="random_forest", n_estimators=100, random_state=42 + fold_idx)
        rf.train(df_train)
        rf_metrics = rf.evaluate(df_val)
        rf_metrics["fold"] = fold_idx + 1
        results["random_forest"].append(rf_metrics)

        # 2. XGBoost
        xgb_m = BaselineTreeModel(model_type="xgboost", n_estimators=100, random_state=42 + fold_idx)
        xgb_m.train(df_train)
        xgb_metrics = xgb_m.evaluate(df_val)
        xgb_metrics["fold"] = fold_idx + 1
        results["xgboost"].append(xgb_metrics)

    # Compute aggregate cross-validation means
    summary = {}
    for m_type in ["random_forest", "xgboost"]:
        metrics_list = results[m_type]
        summary[m_type] = {
            "mean_sensitivity": float(np.mean([m["sensitivity"] for m in metrics_list])),
            "std_sensitivity": float(np.std([m["sensitivity"] for m in metrics_list])),
            "mean_specificity": float(np.mean([m["specificity"] for m in metrics_list])),
            "std_specificity": float(np.std([m["specificity"] for m in metrics_list])),
            "mean_precision": float(np.mean([m["precision"] for m in metrics_list])),
            "mean_f1": float(np.mean([m["f1_score"] for m in metrics_list])),
            "std_f1": float(np.std([m["f1_score"] for m in metrics_list])),
            "mean_auroc": float(np.mean([m["auroc"] for m in metrics_list])),
            "mean_auprc": float(np.mean([m["auprc"] for m in metrics_list]))
        }
        print(f"  [Summary {m_type.upper()}] F1: {summary[m_type]['mean_f1']:.4f} | AUROC: {summary[m_type]['mean_auroc']:.4f} | Sens: {summary[m_type]['mean_sensitivity']:.4f} | Spec: {summary[m_type]['mean_specificity']:.4f}")

    # Train final model on full dataset and save
    final_rf = BaselineTreeModel(model_type="random_forest", n_estimators=150)
    rf_info = final_rf.train(df_tabular)
    final_rf.save(os.path.join(output_dir, "baseline_random_forest.joblib"))

    final_xgb = BaselineTreeModel(model_type="xgboost", n_estimators=150)
    xgb_info = final_xgb.train(df_tabular)
    final_xgb.save(os.path.join(output_dir, "baseline_xgboost.joblib"))

    # Save feature importances and evaluation json
    eval_payload = {
        "cv_summary": summary,
        "fold_details": results,
        "rf_feature_importances": rf_info["feature_importances"],
        "xgb_feature_importances": xgb_info["feature_importances"]
    }
    with open(os.path.join(output_dir, "baseline_evaluation.json"), "w") as f:
        json.dump(eval_payload, f, indent=2)

    return eval_payload
