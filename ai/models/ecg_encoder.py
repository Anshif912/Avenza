"""
ECG Temporal Encoder (1D CNN + Bi-GRU)
Processes raw single-lead ECG and QRS waveform sequences.
"""

import torch
import torch.nn as nn
from typing import Optional, Tuple


class ECGEncoder(nn.Module):
    """
    1D CNN + Bidirectional GRU Encoder for raw ECG time series.
    Input shape: (B, T_ecg=500, 1)
    Output: Latent ECG embedding (B, 64)
    """

    def __init__(self, in_channels: int = 1, embedding_dim: int = 64, gru_hidden: int = 32, dropout: float = 0.25):
        super().__init__()
        self.conv_blocks = nn.Sequential(
            nn.Conv1d(in_channels, 32, kernel_size=11, stride=2, padding=5),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Dropout(dropout),

            nn.Conv1d(32, 64, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Dropout(dropout),

            nn.Conv1d(64, 128, kernel_size=5, padding=2),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(30)
        )

        self.gru = nn.GRU(
            input_size=128,
            hidden_size=gru_hidden,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=dropout
        )

        self.fc_embed = nn.Sequential(
            nn.Linear(gru_hidden * 2, embedding_dim),
            nn.LayerNorm(embedding_dim),
            nn.ReLU(),
            nn.Dropout(dropout)
        )

        self.classifier_head = nn.Sequential(
            nn.Linear(embedding_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x: torch.Tensor, return_embedding_only: bool = True):
        if x.dim() == 2:
            x = x.unsqueeze(1)  # (B, 1, T)
        elif x.dim() == 3 and x.size(1) > x.size(2):
            x = x.permute(0, 2, 1)

        conv_out = self.conv_blocks(x)
        gru_in = conv_out.permute(0, 2, 1)
        gru_out, _ = self.gru(gru_in)

        avg_pool = torch.mean(gru_out, dim=1)
        max_pool, _ = torch.max(gru_out, dim=1)
        pooled = (avg_pool + max_pool) / 2.0

        embed = self.fc_embed(pooled)

        if return_embedding_only:
            return embed

        logits = self.classifier_head(embed)
        return embed, logits
