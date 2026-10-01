"""
Avenza Master End-to-End AI/ML Pipeline Runner
Executes complete dataset synthesis, feature extraction, cross-validation, baseline training,
deep multimodal fusion training, ONNX export, and benchmark verification.
"""

import os
import sys
import time
import json
import numpy as np
import pandas as pd
import torch

from ..datasets.avenza_dataset_generator import AvenzaDatasetGenerator
from ..datasets.pics_loader import PICSLoader
from ..datasets.apnea_ecg_loader import ApneaECGLoader
from ..datasets.dataset_factory import extract_windows_from_sessions
from ..training.train_baseline import train_and_eval_baselines
from ..training.train_fusion import train_fusion_model
from ..inference.onnx_exporter import export_fusion_to_onnx, verify_onnx_model
from ..evaluation.benchmark_evaluator import BenchmarkSuite


def run_master_pipeline():
    print("================================================================================")
    print("      AVENZA — END-TO-END MULTIMODAL AI/ML PIPELINE EXECUTION")
    print("================================================================================")
    total_start = time.time()

    # 1. Dataset Generation & Ingestion
    print("\n[Step 1/6] Ingesting & Generating Multi-Channel Benchmark Sessions...")
    generator = AvenzaDatasetGenerator(base_dir="data/sessions")
    session_paths = generator.generate_benchmark_suite(num_subjects=12)

    # Optional PhysioNet checks
    print("  Loading PhysioNet PICS and Apnea-ECG reference loaders...")
    pics = PICSLoader()
    _ = pics.load_or_download_record("infant1")
    apnea_ecg = ApneaECGLoader()
    _ = apnea_ecg.load_record("a01")

    # 2. Windowing & Feature Extraction
    print("\n[Step 2/6] Performing Synchronized Multi-Modal Windowing (10s windows, 1s stride)...")
    samples, df_tabular = extract_windows_from_sessions(session_paths, window_sec=10, stride_sec=1)
    print(f"  Generated {len(samples)} multimodal sequence windows.")
    print(f"  Extracted tabular feature matrix with shape {df_tabular.shape}.")
    print(f"  Apnea window prevalence: {df_tabular['label_binary'].mean() * 100:.1f}%")

    os.makedirs("data/processed", exist_ok=True)
    df_tabular.to_csv("data/processed/multimodal_tabular_features.csv", index=False)

    # 3. Train Baselines (Random Forest & XGBoost)
    print("\n[Step 3/6] Training Baseline Tree Models with 5-Fold Subject-Wise Cross-Validation...")
    baseline_results = train_and_eval_baselines(df_tabular, output_dir="data/processed/models")

    # 4. Train Multimodal Deep Fusion Model
    print("\n[Step 4/6] Training Avenza Multimodal Fusion Network (1D CNN + Bi-GRU)...")
    fusion_results = train_fusion_model(
        samples=samples,
        output_dir="data/processed/models",
        epochs=15,
        batch_size=32,
        lr=1e-3
    )

    # 5. ONNX Export and Verification
    print("\n[Step 5/6] Exporting Model to ONNX and Verifying Single-Window Latency...")
    onnx_path = export_fusion_to_onnx(
        model_weights_path="data/processed/models/best_fusion_model.pt",
        output_onnx_path="data/processed/models/avenza_fusion_model.onnx"
    )
    onnx_verif = verify_onnx_model(onnx_path)

    # 6. Comprehensive Comparative Benchmarking
    print("\n[Step 6/6] Executing Unified Benchmark Suite Across All Models...")
    bench = BenchmarkSuite(models_dir="data/processed/models", output_dir="data/processed/benchmarks")
    comparison = bench.run_benchmark(samples=samples, df_tabular=df_tabular)

    elapsed = time.time() - total_start
    print("\n================================================================================")
    print(f"  AVENZA PIPELINE EXECUTION COMPLETED SUCCESSFULLY IN {elapsed:.1f}s")
    print("================================================================================")
    print("Summary of Final Test Set Metrics:")
    for model_name, metrics in comparison.items():
        print(f"  * {model_name:30s} | F1: {metrics['f1_score']:.4f} | AUROC: {metrics['auroc']:.4f} | Sens: {metrics['sensitivity']:.4f} | Spec: {metrics['specificity']:.4f}")
    print("================================================================================\n")


if __name__ == "__main__":
    run_master_pipeline()
