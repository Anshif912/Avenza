"""
Subject-Wise Group K-Fold Cross Validation Engine
Ensures zero subject / patient leakage across cross-validation folds.
"""

import numpy as np
import pandas as pd
from typing import List, Tuple, Dict, Any, Generator
from sklearn.model_selection import GroupKFold


class SubjectWiseCrossValidator:
    """
    Executes rigorous GroupKFold splits partitioned strictly by infant subject ID.
    """

    def __init__(self, n_splits: int = 5):
        self.n_splits = n_splits
        self.gkf = GroupKFold(n_splits=n_splits)

    def split_tabular(self, df: pd.DataFrame) -> Generator[Tuple[pd.DataFrame, pd.DataFrame], None, None]:
        """
        Yields (df_train, df_val) for tabular DataFrames.
        """
        groups = df["subject_id"].values
        X = df.index.values

        for train_idx, val_idx in self.gkf.split(X, groups=groups):
            df_train = df.iloc[train_idx].copy()
            df_val = df.iloc[val_idx].copy()
            yield df_train, df_val

    def split_samples(self, samples: List[Dict[str, Any]]) -> Generator[Tuple[List[Dict[str, Any]], List[Dict[str, Any]]], None, None]:
        """
        Yields (train_samples, val_samples) for sample dictionary lists.
        """
        groups = np.array([s["subject_id"] for s in samples])
        indices = np.arange(len(samples))

        for train_idx, val_idx in self.gkf.split(indices, groups=groups):
            train_s = [samples[i] for i in train_idx]
            val_s = [samples[i] for i in val_idx]
            yield train_s, val_s
