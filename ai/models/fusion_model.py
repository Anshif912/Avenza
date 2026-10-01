"""
Multimodal Late-Fusion Network with Signal Quality Gating
Combines Video Movement and MAX30102 Physiological Embeddings with dynamic SQI attention.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple, Optional, Any

from .video_encoder import VideoMovementEncoder
from .physiological_encoder import PhysiologicalEncoder


class AvenzaMultimodalFusionNet(nn.Module):
    """
    Multimodal Late-Fusion Network for Neonatal Apnea Event Detection.
    Fuses:
      - Video Movement Embedding (64 dims)
      - Physiological PPG & Vitals Embedding (64 dims)
      - Real-time Signal Quality Vector [ppg_sqi, video_sqi, perfusion_index]
    """

    def __init__(
        self,
        video_channels: int = 4,
        ppg_channels: int = 4,
        embedding_dim: int = 64,
        num_classes: int = 4,
        dropout: float = 0.3
    ):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.num_classes = num_classes

        # Modality Encoders
        self.video_encoder = VideoMovementEncoder(
            in_channels=video_channels,
            embedding_dim=embedding_dim,
            dropout=dropout
        )
        self.ppg_encoder = PhysiologicalEncoder(
            in_channels=ppg_channels,
            embedding_dim=embedding_dim,
            dropout=dropout
        )

        # Dynamic SQI Gating Network
        self.sqi_gate = nn.Sequential(
            nn.Linear(3, 16),
            nn.ReLU(),
            nn.Linear(16, 2),
            nn.Sigmoid()
        )

        # Late-Fusion Multi-Layer Perceptron (MLP)
        # Input dim: 64 (video) + 64 (ppg) + 3 (sqi) = 131
        fusion_in_dim = embedding_dim * 2 + 3

        self.fusion_mlp = nn.Sequential(
            nn.Linear(fusion_in_dim, 128),
            nn.LayerNorm(128),
            nn.ReLU(),
            nn.Dropout(dropout),

            nn.Linear(128, 64),
            nn.LayerNorm(64),
            nn.ReLU(),
            nn.Dropout(dropout * 0.7),

            nn.Linear(64, 32),
            nn.ReLU()
        )

        # Multi-Task Prediction Heads
        # Head 1: Binary Apnea Detection (0 or 1)
        self.binary_head = nn.Linear(32, 1)

        # Head 2: Multi-Class Apnea Classification (Normal, Central, Obstructive, Mixed)
        self.multiclass_head = nn.Linear(32, num_classes)

    def forward(
        self,
        video_seq: torch.Tensor,
        ppg_seq: torch.Tensor,
        sqi_vec: torch.Tensor
    ) -> Dict[str, torch.Tensor]:
        """
        video_seq: (B, 150, 4) or (B, 4, 150)
        ppg_seq:   (B, 500, 4) or (B, 4, 500)
        sqi_vec:   (B, 3) -> [ppg_sqi, video_sqi, perfusion_index]
        """
        # 1. Compute Modality Embeddings
        v_embed = self.video_encoder(video_seq)  # (B, 64)
        p_embed = self.ppg_encoder(ppg_seq)      # (B, 64)

        # 2. Compute Dynamic Quality Gating Weights
        # Base learned gate scaled by direct SQI values
        raw_gate = self.sqi_gate(sqi_vec)  # (B, 2) -> [g_video, g_ppg]
        p_sqi = sqi_vec[:, 0:1]
        v_sqi = sqi_vec[:, 1:2]

        g_video = raw_gate[:, 0:1] * torch.clamp(v_sqi, min=0.01, max=1.0)
        g_ppg = raw_gate[:, 1:2] * torch.clamp(p_sqi, min=0.01, max=1.0)

        # Re-normalize gate weights
        gate_sum = g_video + g_ppg + 1e-6
        w_video = g_video / gate_sum
        w_ppg = g_ppg / gate_sum

        # 3. Gated Modality Fusion
        v_gated = v_embed * w_video
        p_gated = p_embed * w_ppg

        fused_features = torch.cat([v_gated, p_gated, sqi_vec], dim=-1)  # (B, 131)
        latent_rep = self.fusion_mlp(fused_features)                     # (B, 32)

        # 4. Multi-Task Outputs
        binary_logits = self.binary_head(latent_rep).squeeze(-1)         # (B,)
        binary_prob = torch.sigmoid(binary_logits)                       # (B,)

        multiclass_logits = self.multiclass_head(latent_rep)             # (B, 4)

        return {
            "binary_logits": binary_logits,
            "binary_prob": binary_prob,
            "multiclass_logits": multiclass_logits,
            "latent_rep": latent_rep,
            "w_video": w_video.squeeze(-1),
            "w_ppg": w_ppg.squeeze(-1)
        }
