"""
Baseline Tree-Based Machine Learning Models (Random Forest and XGBoost)
Provides solid tabular baselines with feature importance extraction for scientific benchmarking.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, average_precision_score, confusion_matrix
)

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False


class BaselineTreeModel:
    """
    Wrapper for Random Forest and XGBoost baseline classifiers.
    """

    FEATURE_COLS = [
        "disp_mean", "disp_std", "disp_min", "disp_max",
        "oflow_mean", "oflow_std", "mov_energy_mean",
        "hr_mean", "hr_min", "hr_drop",
        "spo2_mean", "spo2_min", "spo2_drop",
        "ppg_red_std", "ppg_ir_std",
        "ppg_sqi", "video_sqi", "perfusion_idx"
    ]

    def __init__(self, model_type: str = "random_forest", n_estimators: int = 150, random_state: int = 42):
        self.model_type = model_type.lower()
        self.random_state = random_state
        self.n_estimators = n_estimators

        if self.model_type == "xgboost" and XGB_AVAILABLE:
            self.model = xgb.XGBClassifier(
                n_estimators=n_estimators,
                max_depth=5,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=random_state,
                eval_metric="logloss"
            )
        else:
            self.model = RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=8,
                min_samples_split=4,
                class_weight="balanced",
                random_state=random_state
            )

    def train(self, df_train: pd.DataFrame) -> Dict[str, Any]:
        """
        Trains the tree model on tabular features.
        """
        X_train = df_train[self.FEATURE_COLS].fillna(0.0).values
        y_train = df_train["label_binary"].values

        self.model.fit(X_train, y_train)

        # Feature importances
        if hasattr(self.model, "feature_importances_"):
            importances = {col: float(val) for col, val in zip(self.FEATURE_COLS, self.model.feature_importances_)}
        else:
            importances = {}

        return {
            "model_type": self.model_type,
            "n_samples": len(df_train),
            "feature_importances": importances
        }

    def evaluate(self, df_test: pd.DataFrame) -> Dict[str, float]:
        """
        Evaluates the model on test split and computes standard biomedical metrics.
        """
        X_test = df_test[self.FEATURE_COLS].fillna(0.0).values
        y_test = df_test["label_binary"].values

        preds_prob = self.model.predict_proba(X_test)[:, 1]
        preds_bin = (preds_prob >= 0.5).astype(int)

        tn, fp, fn, tp = confusion_matrix(y_test, preds_bin, labels=[0, 1]).ravel()
        sensitivity = tp / max(1, tp + fn)
        specificity = tn / max(1, tn + fp)
        precision = tp / max(1, tp + fp)
        f1 = f1_score(y_test, preds_bin, zero_division=0)
        
        try:
            auroc = roc_auc_score(y_test, preds_prob)
            auprc = average_precision_score(y_test, preds_prob)
        except Exception:
            auroc = 0.5
            auprc = 0.5

        return {
            "model_name": f"Baseline_{self.model_type.upper()}",
            "sensitivity": float(sensitivity),
            "specificity": float(specificity),
            "precision": float(precision),
            "f1_score": float(f1),
            "auroc": float(auroc),
            "auprc": float(auprc),
            "tp": int(tp),
            "fp": int(fp),
            "tn": int(tn),
            "fn": int(fn)
        }

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.model, filepath)

    def load(self, filepath: str):
        self.model = joblib.load(filepath)
