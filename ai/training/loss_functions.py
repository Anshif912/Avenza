"""
Custom Loss Functions for Biomedical Imbalanced Time Series
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class BinaryFocalLoss(nn.Module):
    """
    Focal Loss for addressing class imbalance in apnea event detection.
    FL(p_t) = -alpha_t * (1 - p_t)^gamma * log(p_t)
    """

    def __init__(self, alpha: float = 0.25, gamma: float = 2.0, reduction: str = "mean"):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        logits: (B,) unnormalized log-odds
        targets: (B,) binary ground truth in {0, 1}
        """
        probs = torch.sigmoid(logits)
        bce_loss = F.binary_cross_entropy_with_logits(logits, targets, reduction="none")

        p_t = probs * targets + (1.0 - probs) * (1.0 - targets)
        alpha_t = self.alpha * targets + (1.0 - self.alpha) * (1.0 - targets)
        focal_weight = alpha_t * torch.pow((1.0 - p_t), self.gamma)

        loss = focal_weight * bce_loss

        if self.reduction == "mean":
            return loss.mean()
        elif self.reduction == "sum":
            return loss.sum()
        return loss


class MultiTaskApneaLoss(nn.Module):
    """
    Combined loss function:
    L_total = L_binary_focal + lambda_mc * L_multiclass_ce
    """

    def __init__(self, alpha: float = 0.25, gamma: float = 2.0, lambda_mc: float = 0.4):
        super().__init__()
        self.binary_focal = BinaryFocalLoss(alpha=alpha, gamma=gamma)
        self.mc_ce = nn.CrossEntropyLoss()
        self.lambda_mc = lambda_mc

    def forward(
        self,
        binary_logits: torch.Tensor,
        mc_logits: torch.Tensor,
        binary_targets: torch.Tensor,
        mc_targets: torch.Tensor
    ) -> torch.Tensor:
        l_bin = self.binary_focal(binary_logits, binary_targets)
        l_mc = self.mc_ce(mc_logits, mc_targets)
        return l_bin + self.lambda_mc * l_mc
