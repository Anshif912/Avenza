"""
AVENZA Hardware & Camera Bridge Module
Connects physical ESP32 sensor telemetry and live webcam optical flow to the AI inference engine.
"""

from .hardware_bridge import ESP32HardwareBridge, esp32_bridge
from .camera_bridge import WebcamMotionBridge, camera_bridge

__all__ = ["ESP32HardwareBridge", "esp32_bridge", "WebcamMotionBridge", "camera_bridge"]
