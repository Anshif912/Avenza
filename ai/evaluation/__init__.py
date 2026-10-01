"""
Avenza Evaluation, Benchmarking, and Explainability Package
"""

from .metrics import compute_biomedical_metrics, calculate_false_alarm_rate, calculate_detection_latency
from .explainability import MultimodalExplainer
from .benchmark_evaluator import BenchmarkSuite

__all__ = [
    "compute_biomedical_metrics",
    "calculate_false_alarm_rate",
    "calculate_detection_latency",
    "MultimodalExplainer",
    "BenchmarkSuite",
]
