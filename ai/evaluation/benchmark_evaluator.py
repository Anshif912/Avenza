"""
Avenza Comprehensive Benchmark Suite
Evaluates and compares all model architectures on identical Subject-Wise test splits.
"""

import os
import json
import numpy as np
import pandas as pd
import torch
from typing import Dict, List, Any, Optional

from .metrics import compute_biomedical_metrics
from ..models.baseline_model import BaselineTreeModel
from ..models.video_encoder import VideoMovementEncoder
from ..models.physiological_encoder import PhysiologicalEncoder
from ..models.fusion_model import AvenzaMultimodalFusionNet
from ..datasets.dataset_factory import AvenzaMultimodalDataset, create_dataloaders


class BenchmarkSuite:
    """
    Orchestrates comparative benchmarking across baseline and deep multimodal architectures.
    """

    def __init__(self, models_dir: str = "data/processed/models", output_dir: str = "data/processed/benchmarks"):
        self.models_dir = models_dir
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def run_benchmark(
        self,
        samples: List[Dict[str, Any]],
        df_tabular: pd.DataFrame,
        device: str = "cuda" if torch.cuda.is_available() else "cpu"
    ) -> Dict[str, Any]:
        """
        Executes unified benchmark across all models and generates comparison tables.
        """
        print("[BenchmarkSuite] Starting unified benchmark evaluation...")

        # Obtain subject-wise splits
        train_loader, val_loader, test_loader, train_subs, val_subs, test_subs = create_dataloaders(
            samples, batch_size=32, test_size=0.2, val_size=0.1, random_state=42
        )

        df_test = df_tabular[df_tabular["subject_id"].isin(test_subs)].copy()
        y_test_true = df_test["label_binary"].values
        total_test_hours = len(df_test) / 3600.0  # Approx 1-sec windows

        benchmark_results = {}

        # -------------------------------------------------------------
        # 1. Baseline: Random Forest
        # -------------------------------------------------------------
        rf_path = os.path.join(self.models_dir, "baseline_random_forest.joblib")
        if os.path.exists(rf_path):
            rf = BaselineTreeModel(model_type="random_forest")
            rf.load(rf_path)
            rf_metrics = rf.evaluate(df_test)
            benchmark_results["Random_Forest"] = rf_metrics

        # -------------------------------------------------------------
        # 2. Baseline: XGBoost
        # -------------------------------------------------------------
        xgb_path = os.path.join(self.models_dir, "baseline_xgboost.joblib")
        if os.path.exists(xgb_path):
            xgb_m = BaselineTreeModel(model_type="xgboost")
            xgb_m.load(xgb_path)
            xgb_metrics = xgb_m.evaluate(df_test)
            benchmark_results["XGBoost"] = xgb_metrics

        # -------------------------------------------------------------
        # 3. Multimodal Late-Fusion Net
        # -------------------------------------------------------------
        fusion_path = os.path.join(self.models_dir, "best_fusion_model.pt")
        if os.path.exists(fusion_path):
            fusion_net = AvenzaMultimodalFusionNet().to(device)
            ckpt = torch.load(fusion_path, map_location=device, weights_only=False)
            fusion_net.load_state_dict(ckpt["model_state_dict"])
            fusion_net.eval()

            all_probs = []
            with torch.no_grad():
                for batch in test_loader:
                    v_seq = batch["video_seq"].to(device)
                    p_seq = batch["ppg_seq"].to(device)
                    sqi_v = batch["sqi_vec"].to(device)
                    out = fusion_net(v_seq, p_seq, sqi_v)
                    all_probs.extend(out["binary_prob"].cpu().numpy())

            all_probs = np.array(all_probs)
            all_preds = (all_probs >= 0.5).astype(int)

            fusion_metrics = compute_biomedical_metrics(
                y_true=y_test_true[:len(all_probs)],
                y_pred=all_preds,
                y_prob=all_probs,
                total_monitoring_hours=total_test_hours
            )
            fusion_metrics["model_name"] = "Avenza_Multimodal_Fusion_Net"
            benchmark_results["Avenza_Multimodal_Fusion_Net"] = fusion_metrics

        # Save benchmark json
        out_file = os.path.join(self.output_dir, "benchmark_comparison.json")
        with open(out_file, "w") as f:
            json.dump(benchmark_results, f, indent=2)

        print(f"[BenchmarkSuite] Benchmark completed. Results saved to {out_file}")
        return benchmark_results
