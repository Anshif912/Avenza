"""
Multimodal Late-Fusion Network Training Engine with CUDA Acceleration
"""

import os
import json
import time
import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from typing import Dict, List, Tuple, Any, Optional
from sklearn.metrics import f1_score, roc_auc_score, precision_score, recall_score

from ..models.fusion_model import AvenzaMultimodalFusionNet
from .loss_functions import MultiTaskApneaLoss
from ..datasets.dataset_factory import create_dataloaders


def train_fusion_model(
    samples: List[Dict[str, Any]],
    output_dir: str = "data/processed/models",
    epochs: int = 25,
    batch_size: int = 32,
    lr: float = 1e-3,
    device: Optional[str] = None
) -> Dict[str, Any]:
    """
    Trains the AvenzaMultimodalFusionNet on subject-split multimodal data.
    """
    os.makedirs(output_dir, exist_ok=True)
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    print(f"[Fusion Training] Initializing training on device: {device.upper()}")

    # Subject-wise splitting
    train_loader, val_loader, test_loader, train_subs, val_subs, test_subs = create_dataloaders(
        samples, batch_size=batch_size, test_size=0.2, val_size=0.1, random_state=42
    )

    print(f"  Train samples: {len(train_loader.dataset)} (Subjects: {train_subs})")
    print(f"  Val samples:   {len(val_loader.dataset)} (Subjects: {val_subs})")
    print(f"  Test samples:  {len(test_loader.dataset)} (Subjects: {test_subs})")

    model = AvenzaMultimodalFusionNet(
        video_channels=4,
        ppg_channels=4,
        embedding_dim=64,
        num_classes=4,
        dropout=0.25
    ).to(device)

    criterion = MultiTaskApneaLoss(alpha=0.25, gamma=2.0, lambda_mc=0.4)
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    best_val_f1 = -1.0
    best_model_path = os.path.join(output_dir, "best_fusion_model.pt")
    history = {"train_loss": [], "val_loss": [], "val_f1": [], "val_auroc": [], "lr": []}

    start_time = time.time()

    for epoch in range(1, epochs + 1):
        # --- Training Epoch ---
        model.train()
        total_loss = 0.0
        n_batches = 0

        for batch in train_loader:
            v_seq = batch["video_seq"].to(device)
            p_seq = batch["ppg_seq"].to(device)
            sqi_v = batch["sqi_vec"].to(device)
            y_bin = batch["label_binary"].to(device)
            y_mc = batch["label_multiclass"].to(device)

            optimizer.zero_grad()
            outputs = model(v_seq, p_seq, sqi_v)

            loss = criterion(
                binary_logits=outputs["binary_logits"],
                mc_logits=outputs["multiclass_logits"],
                binary_targets=y_bin,
                mc_targets=y_mc
            )

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
            optimizer.step()

            total_loss += loss.item()
            n_batches += 1

        scheduler.step()
        avg_train_loss = total_loss / max(1, n_batches)

        # --- Validation Loop ---
        model.eval()
        val_loss = 0.0
        val_batches = 0
        all_val_preds = []
        all_val_probs = []
        all_val_targets = []

        with torch.no_grad():
            for batch in val_loader:
                v_seq = batch["video_seq"].to(device)
                p_seq = batch["ppg_seq"].to(device)
                sqi_v = batch["sqi_vec"].to(device)
                y_bin = batch["label_binary"].to(device)
                y_mc = batch["label_multiclass"].to(device)

                outputs = model(v_seq, p_seq, sqi_v)
                loss = criterion(
                    binary_logits=outputs["binary_logits"],
                    mc_logits=outputs["multiclass_logits"],
                    binary_targets=y_bin,
                    mc_targets=y_mc
                )

                val_loss += loss.item()
                val_batches += 1

                probs = outputs["binary_prob"].cpu().numpy()
                preds = (probs >= 0.5).astype(int)
                targets = y_bin.cpu().numpy().astype(int)

                all_val_probs.extend(probs)
                all_val_preds.extend(preds)
                all_val_targets.extend(targets)

        avg_val_loss = val_loss / max(1, val_batches)
        val_f1 = float(f1_score(all_val_targets, all_val_preds, zero_division=0))
        try:
            val_auroc = float(roc_auc_score(all_val_targets, all_val_probs))
        except Exception:
            val_auroc = 0.5

        history["train_loss"].append(float(avg_train_loss))
        history["val_loss"].append(float(avg_val_loss))
        history["val_f1"].append(float(val_f1))
        history["val_auroc"].append(float(val_auroc))
        history["lr"].append(float(optimizer.param_groups[0]["lr"]))

        print(f"  Epoch {epoch:02d}/{epochs:02d} | Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | Val F1: {val_f1:.4f} | Val AUROC: {val_auroc:.4f}")

        # Checkpoint best model
        if val_f1 >= best_val_f1:
            best_val_f1 = val_f1
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_f1": val_f1,
                "val_auroc": val_auroc,
                "train_subjects": train_subs,
                "val_subjects": val_subs,
                "test_subjects": test_subs
            }, best_model_path)

    elapsed = time.time() - start_time
    print(f"[Fusion Training] Completed in {elapsed:.1f}s. Best Val F1: {best_val_f1:.4f}. Model saved to {best_model_path}")

    # Load best weights and evaluate on unseen Test Set
    checkpoint = torch.load(best_model_path, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    all_test_probs = []
    all_test_preds = []
    all_test_targets = []
    all_test_mc_preds = []
    all_test_mc_targets = []

    with torch.no_grad():
        for batch in test_loader:
            v_seq = batch["video_seq"].to(device)
            p_seq = batch["ppg_seq"].to(device)
            sqi_v = batch["sqi_vec"].to(device)
            y_bin = batch["label_binary"].to(device)
            y_mc = batch["label_multiclass"].to(device)

            outputs = model(v_seq, p_seq, sqi_v)
            probs = outputs["binary_prob"].cpu().numpy()
            mc_preds = torch.argmax(outputs["multiclass_logits"], dim=-1).cpu().numpy()

            all_test_probs.extend(probs)
            all_test_preds.extend((probs >= 0.5).astype(int))
            all_test_targets.extend(y_bin.cpu().numpy().astype(int))
            all_test_mc_preds.extend(mc_preds)
            all_test_mc_targets.extend(y_mc.cpu().numpy().astype(int))

    all_test_targets = np.array(all_test_targets)
    all_test_preds = np.array(all_test_preds)
    all_test_probs = np.array(all_test_probs)

    tp = int(np.sum((all_test_targets == 1) & (all_test_preds == 1)))
    fp = int(np.sum((all_test_targets == 0) & (all_test_preds == 1)))
    tn = int(np.sum((all_test_targets == 0) & (all_test_preds == 0)))
    fn = int(np.sum((all_test_targets == 1) & (all_test_preds == 0)))

    test_metrics = {
        "model_name": "Avenza_Multimodal_Fusion_Net",
        "sensitivity": float(tp / max(1, tp + fn)),
        "specificity": float(tn / max(1, tn + fp)),
        "precision": float(tp / max(1, tp + fp)),
        "f1_score": float(f1_score(all_test_targets, all_test_preds, zero_division=0)),
        "auroc": float(roc_auc_score(all_test_targets, all_test_probs)),
        "tp": tp, "fp": fp, "tn": tn, "fn": fn,
        "n_test_samples": len(all_test_targets)
    }

    results = {
        "best_val_f1": float(best_val_f1),
        "test_metrics": test_metrics,
        "history": history,
        "train_subjects": [str(s) for s in train_subs],
        "val_subjects": [str(s) for s in val_subs],
        "test_subjects": [str(s) for s in test_subs]
    }

    with open(os.path.join(output_dir, "fusion_training_results.json"), "w") as f:
        json.dump(results, f, indent=2)

    return results
