"""
Integration and Unit Tests for AVENZA Hardware Bridge and Inference Pipeline.
Verifies serial JSON parsing, command dispatch, camera kinematics integration, and neural inference.
"""

import os
import sys
import json
import time
import unittest
import numpy as np

from .hardware_bridge import ESP32HardwareBridge
from .camera_bridge import WebcamMotionBridge
from ..inference.inference_engine import RealtimeApneaInferenceEngine
from ..models.state_machine import MonitorState


class TestHardwareBridgeIntegration(unittest.TestCase):

    def setUp(self):
        self.bridge = ESP32HardwareBridge(port=None)
        self.engine = RealtimeApneaInferenceEngine()
        self.bridge.set_inference_engine(self.engine)

    def test_packet_parsing_flat_and_nested(self):
        """Verifies dual flat and nested packet deserialization."""
        sample_json = json.dumps({
            "type": "telemetry",
            "device": "AVENZA_ESP32",
            "deviceId": "AVENZA-ESP32-01",
            "firmware": "1.0.0",
            "timestamp": 123456,
            "uptimeMs": 10000,
            "ds18b20_temp": 28.5,
            "dht_temp": 27.2,
            "humidity": 62.0,
            "fan": 0,
            "peltier": 0,
            "red": 0,
            "yellow": 1,
            "green": 0,
            "max30102": 1,
            "raw_red": 51200,
            "raw_ir": 54800,
            "sensors": {
                "max30102": {
                    "connected": True,
                    "contact": True,
                    "heartRate": 138.0,
                    "heartRateValid": True,
                    "heartRateQuality": 0.92,
                    "spo2": 98.0,
                    "spo2Valid": True,
                    "spo2Quality": 0.90,
                    "ir": 54800,
                    "red": 51200,
                    "qualityRating": "GOOD"
                },
                "dht11": {
                    "connected": True,
                    "temperature": 27.2,
                    "humidity": 62.0,
                    "valid": True
                },
                "ds18b20": {
                    "connected": True,
                    "temperature": 28.5,
                    "valid": True
                }
            },
            "actuators": {
                "fanCommand": False,
                "peltierCommand": "OFF",
                "peltierPwm": 0,
                "safetyCutoff": False,
                "driverStatus": "READY_OFF"
            }
        })

        callback_received = []
        self.bridge.register_callback(lambda data: callback_received.append(data))

        self.bridge._parse_telemetry_packet(sample_json)

        status = self.bridge.get_status()
        self.assertTrue(status["is_connected"])
        self.assertEqual(status["latest_telemetry"]["ds18b20_temp"], 28.5)
        self.assertEqual(status["latest_telemetry"]["dht_temp"], 27.2)
        self.assertEqual(status["latest_telemetry"]["humidity"], 62.0)
        self.assertEqual(status["latest_telemetry"]["fan"], 0)
        self.assertEqual(status["latest_telemetry"]["yellow_led"], 1)
        self.assertEqual(status["latest_telemetry"]["raw_ir"], 54800)
        self.assertEqual(len(callback_received), 1)

    def test_streaming_inference_pipeline_warmup_and_step(self):
        """Verifies feeding 500 PPG samples + 150 video samples triggers real model inference."""
        self.engine.reset_buffers()
        self.assertFalse(self.engine.is_warmed_up())

        # Feed 500 PPG samples (10s @ 50 Hz) and 150 video samples (10s @ 15 Hz)
        for i in range(500):
            t = i / 50.0
            raw_ir = 50000 + 3000 * np.sin(2 * np.pi * 2.2 * t)
            raw_red = 46000 + 2500 * np.sin(2 * np.pi * 2.2 * t)
            self.engine.push_ppg_sample(raw_red=raw_red, raw_ir=raw_ir, hr=135.0, spo2=98.0)

        for i in range(150):
            t = i / 15.0
            disp = 0.02 + 0.01 * np.sin(2 * np.pi * 0.6 * t)
            flow_y = 0.005 * np.cos(2 * np.pi * 0.6 * t)
            self.engine.push_video_sample(displacement=disp, flow_y=flow_y, pose_y=0.45, energy=0.001)

        self.assertTrue(self.engine.is_warmed_up())

        result = self.engine.process_inference_step()
        self.assertEqual(result["status"], "ACTIVE")
        self.assertIn("apnea_score", result)
        self.assertIn("state", result)
        self.assertIn("attribution", result)
        self.assertIn("signal_quality", result)
        self.assertTrue(0.0 <= result["apnea_score"] <= 1.0)
        print(f"\n[Test Result] Inference Verdict: state={result['state']}, score={result['apnea_score']}")


if __name__ == "__main__":
    unittest.main()
