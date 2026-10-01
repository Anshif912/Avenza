"""
Video Movement Temporal Encoder (1D CNN + Bi-GRU)
Encodes chest displacement, optical flow velocity, and pose trajectories into a latent movement embedding.
"""

import torch
import torch.nn as nn
from typing import Dict, Tuple, Optional


class VideoMovementEncoder(nn.Module):
    """
    1D CNN + Bidirectional GRU Encoder for infant video movement time series.
    Input shape: (B, T_video=150, C_video=4)
    Output: Latent video embedding (B, 64)
    """

    def __init__(self, in_channels: int = 4, embedding_dim: int = 64, gru_hidden: int = 32, dropout: float = 0.25):
        super().__init__()
        self.in_channels = in_channels
        self.embedding_dim = embedding_dim

        # 1D Convolutional Blocks: (B, C, T)
        self.conv_blocks = nn.Sequential(
            # Block 1
            nn.Conv1d(in_channels, 32, kernel_size=5, padding=2),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2),  # 150 -> 75
            nn.Dropout(dropout),

            # Block 2
            nn.Conv1d(32, 64, kernel_size=5, padding=2),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2),  # 75 -> 37
            nn.Dropout(dropout),

            # Block 3
            nn.Conv1d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2)  # 37 -> 18
        )

        # Bidirectional GRU
        self.gru = nn.GRU(
            input_size=64,
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

        # Standalone classification head (for video-only ablation studies)
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

        # Conv feature extraction
        conv_out = self.conv_blocks(x)  # (B, 64, 30)

        # Permute to (B, 30, 64) for GRU
        gru_in = conv_out.permute(0, 2, 1)
        gru_out, _ = self.gru(gru_in)   # (B, 30, gru_hidden * 2)

        # Global average + max pooling across time
        avg_pool = torch.mean(gru_out, dim=1)
        max_pool, _ = torch.max(gru_out, dim=1)
        pooled = (avg_pool + max_pool) / 2.0

        embed = self.fc_embed(pooled)  # (B, embedding_dim)

        if return_embedding_only:
            return embed
        
        logits = self.classifier_head(embed)
        return embed, logits
