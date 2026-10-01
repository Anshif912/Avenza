"""
Physiological Temporal Encoder (Multi-Scale Dilated 1D CNN + Bi-GRU)
Processes raw/filtered MAX30102 PPG signals (RED and IR) alongside HR and SpO2 trends.
"""

import torch
import torch.nn as nn
from typing import Dict, Tuple, Optional


class PhysiologicalEncoder(nn.Module):
    """
    Multi-Scale Dilated 1D CNN + Bidirectional GRU Encoder for multi-channel PPG and Vitals.
    Input shape: (B, T_ppg=500, C_ppg=4)
    Output: Latent physiological embedding (B, 64)
    """

    def __init__(self, in_channels: int = 4, embedding_dim: int = 64, gru_hidden: int = 32, dropout: float = 0.25):
        super().__init__()
        self.in_channels = in_channels
        self.embedding_dim = embedding_dim

        # Multi-Scale 1D Conv Blocks with Dilation
        self.conv_blocks = nn.Sequential(
            # Block 1: Fast pulse morphology (kernel_size=7, stride=2)
            nn.Conv1d(in_channels, 32, kernel_size=7, stride=2, padding=3),  # 500 -> 250
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2),  # 250 -> 125
            nn.Dropout(dropout),

            # Block 2: Dilated convolution for longer vital trends
            nn.Conv1d(32, 64, kernel_size=5, dilation=2, padding=4),  # 125 -> 125
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2),  # 125 -> 62
            nn.Dropout(dropout),

            # Block 3: Higher-order feature extraction
            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2)   # 62 -> 31
        )

        # Bidirectional GRU
        self.gru = nn.GRU(
            input_size=128,
            hidden_size=gru_hidden,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=dropout
        )

        # Projection to latent embedding
        self.fc_embed = nn.Sequential(
            nn.Linear(gru_hidden * 2, embedding_dim),
            nn.LayerNorm(embedding_dim),
            nn.ReLU(),
            nn.Dropout(dropout)
        )

        # Standalone classification head (for ablation studies)
        self.classifier_head = nn.Sequential(
            nn.Linear(embedding_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x: torch.Tensor, return_embedding_only: bool = True):
        """
        x: (B, T, C) or (B, C, T)
        """
        if x.dim() == 3 and x.size(1) > x.size(2):  # (B, T, C) -> permute to (B, C, T)
            x = x.permute(0, 2, 1)

        conv_out = self.conv_blocks(x)  # (B, 128, 30)

        gru_in = conv_out.permute(0, 2, 1)  # (B, 30, 128)
        gru_out, _ = self.gru(gru_in)       # (B, 30, gru_hidden * 2)

        # Temporal pooling
        avg_pool = torch.mean(gru_out, dim=1)
        max_pool, _ = torch.max(gru_out, dim=1)
        pooled = (avg_pool + max_pool) / 2.0

        embed = self.fc_embed(pooled)  # (B, embedding_dim)

        if return_embedding_only:
            return embed

        logits = self.classifier_head(embed)
        return embed, logits
