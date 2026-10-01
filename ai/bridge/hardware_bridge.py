"""
AVENZA ESP32 Hardware Serial Bridge
Connects to ESP32 at 115200 baud over USB Serial.
Streams real-time physical telemetry to AI inference pipeline and relays actuator commands.
"""

import os
import sys
import time
import json
import threading
import logging
from typing import Dict, Any, Optional, Callable, List
import serial
import serial.tools.list_ports

logger = logging.getLogger("AVENZA_BRIDGE")
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(asctime)s - %(name)s: %(message)s")


class ESP32HardwareBridge:
    """
    Non-blocking, resilient serial bridge connecting ESP32 to AVENZA Python backend.
    """

    def __init__(self, port: Optional[str] = None, baud: int = 115200, timeout: float = 1.0):
        self.port = port
        self.baud = baud
        self.timeout = timeout
        self.ser: Optional[serial.Serial] = None

        self.is_connected = False
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()

        # Telemetry metrics
        self.packets_received = 0
        self.last_packet_time: float = 0.0
        self.last_error: Optional[str] = None

        # Latest validated sensor snapshot
        self.latest_telemetry: Dict[str, Any] = {
            "device": "AVENZA_ESP32",
            "connected": False,
            "ds18b20_temp": None,
            "dht_temp": None,
            "humidity": None,
            "chamber_temp": None,
            "fan": 0,
            "peltier": 0,
            "peltier_command": "OFF",
            "red_led": 0,
            "yellow_led": 1,
            "green_led": 0,
            "max30102_connected": False,
            "max30102_contact": False,
            "raw_red": 0,
            "raw_ir": 0,
            "heart_rate": None,
            "spo2": None,
            "uptime_ms": 0,
            "free_heap": 0,
            "timestamp": 0
        }

        # Registered packet callbacks
        self.callbacks: List[Callable[[Dict[str, Any]], None]] = []
        self.inference_engine_ref = None

    def set_inference_engine(self, engine):
        """Attaches the global RealtimeApneaInferenceEngine."""
        self.inference_engine_ref = engine

    def register_callback(self, callback: Callable[[Dict[str, Any]], None]):
        """Registers a listener function called on every valid packet."""
        with self.lock:
            if callback not in self.callbacks:
                self.callbacks.append(callback)

    def unregister_callback(self, callback: Callable[[Dict[str, Any]], None]):
        with self.lock:
            if callback in self.callbacks:
                self.callbacks.remove(callback)

    @staticmethod
    def list_available_ports() -> List[Dict[str, str]]:
        """Lists all serial COM ports on the system."""
        ports = serial.tools.list_ports.comports()
        result = []
        for p in ports:
            result.append({
                "device": p.device,
                "description": p.description,
                "hwid": p.hwid,
                "vid": hex(p.vid) if p.vid else None,
                "pid": hex(p.pid) if p.pid else None
            })
        return result

    def auto_detect_port(self) -> Optional[str]:
        """Auto-detects the ESP32 USB serial port."""
        if self.port:
            return self.port

        ports = serial.tools.list_ports.comports()
        logger.info(f"Scanning {len(ports)} available serial ports...")

        # Preferred hardware identifiers
        keywords = ["CH340", "CP210", "FTDI", "USB-SERIAL", "UART", "ESP32", "USB Serial"]
        for p in ports:
            desc = (p.description or "") + " " + (p.hwid or "")
            for kw in keywords:
                if kw.lower() in desc.lower():
                    logger.info(f"Auto-detected ESP32 port: {p.device} ({p.description})")
                    return p.device

        # Fallback to COM3 or first COM port if on Windows
        for p in ports:
            if "COM3" in p.device.upper():
                return p.device

        if ports:
            return ports[0].device

        return None

    def connect(self, port: Optional[str] = None) -> bool:
        """Opens serial connection to the ESP32."""
        if port:
            self.port = port
        elif not self.port:
            self.port = self.auto_detect_port()

        if not self.port:
            self.last_error = "No serial port found. Connect ESP32 via USB cable."
            logger.warning(self.last_error)
            return False

        try:
            logger.info(f"Opening serial connection to {self.port} at {self.baud} baud...")
            self.ser = serial.Serial(
                port=self.port,
                baudrate=self.baud,
                timeout=self.timeout,
                write_timeout=1.0
            )
            time.sleep(0.5)  # Allow DTR/RTS reset line to settle
            self.is_connected = True
            self.latest_telemetry["connected"] = True
            self.last_error = None
            logger.info(f"Connected successfully to ESP32 on {self.port}")

            # Start worker thread
            if not self.is_running:
                self.is_running = True
                self.thread = threading.Thread(target=self._read_worker, daemon=True, name="ESP32BridgeWorker")
                self.thread.start()

            return True
        except Exception as e:
            self.is_connected = False
            self.latest_telemetry["connected"] = False
            self.last_error = f"Failed to open {self.port}: {e}"
            logger.error(self.last_error)
            return False

    def disconnect(self):
        """Closes the serial connection."""
        self.is_running = False
        if self.ser:
            try:
                self.ser.close()
            except Exception as e:
                logger.debug(f"Serial close exception: {e}")
            self.ser = None
        self.is_connected = False
        self.latest_telemetry["connected"] = False
        logger.info("ESP32 serial connection closed.")

    def _read_worker(self):
        """Continuous background thread reading lines from ESP32."""
        reconnect_delay = 1.0

        while self.is_running:
            if not self.ser or not self.ser.is_open:
                self.is_connected = False
                self.latest_telemetry["connected"] = False
                time.sleep(reconnect_delay)
                reconnect_delay = min(5.0, reconnect_delay * 1.5)
                logger.info(f"Attempting to reconnect to {self.port or 'auto'}...")
                self.connect(self.port)
                continue

            try:
                line_bytes = self.ser.readline()
                if not line_bytes:
                    continue

                line_str = line_bytes.decode("utf-8", errors="ignore").strip()
                if not line_str:
                    continue

                if line_str.startswith("{") and line_str.endswith("}"):
                    self._parse_telemetry_packet(line_str)
                    reconnect_delay = 1.0
                elif line_str.startswith("[BOOT]") or line_str.startswith("[HEARTBEAT]"):
                    logger.debug(f"ESP32 Log: {line_str}")

            except serial.SerialException as e:
                logger.warning(f"Serial read error: {e}. Reconnecting...")
                self.is_connected = False
                self.latest_telemetry["connected"] = False
                if self.ser:
                    try:
                        self.ser.close()
                    except Exception:
                        pass
                    self.ser = None
                time.sleep(1.0)
            except Exception as e:
                logger.error(f"Unexpected bridge error: {e}")
                time.sleep(0.1)

    def _parse_telemetry_packet(self, json_str: str):
        """Parses and validates structured JSON telemetry."""
        try:
            packet = json.loads(json_str)
            self.packets_received += 1
            self.last_packet_time = time.time()

            # Extract fields handling both flat and nested keys
            sensors = packet.get("sensors", {})
            actuators = packet.get("actuators", {})
            max_obj = sensors.get("max30102", {})
            dht_obj = sensors.get("dht11", {})
            ds_obj = sensors.get("ds18b20", {})

            ds_temp = packet.get("ds18b20_temp")
            if ds_temp is None:
                ds_temp = ds_obj.get("temperature")

            dht_temp = packet.get("dht_temp")
            if dht_temp is None:
                dht_temp = dht_obj.get("temperature")

            humidity = packet.get("humidity")
            if humidity is None:
                humidity = dht_obj.get("humidity")

            raw_red = packet.get("raw_red", max_obj.get("red", 0))
            raw_ir = packet.get("raw_ir", max_obj.get("ir", 0))
            hr = packet.get("heart_rate", max_obj.get("heartRate"))
            spo2 = packet.get("spo2", max_obj.get("spo2"))

            fan = packet.get("fan")
            if fan is None:
                fan = 1 if actuators.get("fanCommand") else 0

            peltier = packet.get("peltier", 0)
            peltier_cmd = actuators.get("peltierCommand", "OFF")

            red_led = packet.get("red", 0)
            yellow_led = packet.get("yellow", 0)
            green_led = packet.get("green", 0)

            # Update cached snapshot
            with self.lock:
                self.is_connected = True
                self.latest_telemetry.update({
                    "device": packet.get("device", "AVENZA_ESP32"),
                    "connected": True,
                    "ds18b20_temp": ds_temp,
                    "dht_temp": dht_temp,
                    "humidity": humidity,
                    "chamber_temp": ds_temp if ds_temp is not None else dht_temp,
                    "fan": fan,
                    "peltier": peltier,
                    "peltier_command": peltier_cmd,
                    "red_led": red_led,
                    "yellow_led": yellow_led,
                    "green_led": green_led,
                    "max30102_connected": max_obj.get("connected", packet.get("max30102", 0) == 1),
                    "max30102_contact": max_obj.get("contact", False),
                    "raw_red": raw_red,
                    "raw_ir": raw_ir,
                    "heart_rate": hr,
                    "spo2": spo2,
                    "uptime_ms": packet.get("uptimeMs", 0),
                    "free_heap": packet.get("system", {}).get("freeHeap", 0),
                    "timestamp": packet.get("timestamp", int(time.time() * 1000))
                })

            # Forward to AI Inference Engine if attached
            if self.inference_engine_ref and raw_ir and raw_ir > 1000:
                self.inference_engine_ref.push_ppg_sample(
                    raw_red=float(raw_red),
                    raw_ir=float(raw_ir),
                    hr=float(hr if hr else 135.0),
                    spo2=float(spo2 if spo2 else 98.0)
                )

            # Dispatch to callbacks
            snapshot = dict(self.latest_telemetry)
            for cb in self.callbacks:
                try:
                    cb(snapshot)
                except Exception as ex:
                    logger.error(f"Callback error: {ex}")

        except json.JSONDecodeError:
            pass
        except Exception as e:
            logger.debug(f"Telemetry parse error: {e}")

    # =========================================================
    # ACTUATOR COMMAND SENDER METHODS
    # =========================================================

    def send_raw_command(self, payload: Dict[str, Any]) -> bool:
        """Sends a JSON command line to the ESP32 over serial."""
        if not self.ser or not self.ser.is_open:
            logger.warning("Cannot send command: ESP32 serial port not open.")
            return False

        try:
            cmd_str = json.dumps(payload) + "\n"
            self.ser.write(cmd_str.encode("utf-8"))
            self.ser.flush()
            logger.info(f"Sent command to ESP32: {payload}")
            return True
        except Exception as e:
            logger.error(f"Failed to write serial command: {e}")
            return False

    def send_fan(self, on: bool) -> bool:
        """Commands the relay fan ON or OFF."""
        return self.send_raw_command({
            "target": "fan",
            "action": "ON" if on else "OFF",
            "value": 1 if on else 0
        })

    def send_peltier(self, mode: str, pwm: int = 180) -> bool:
        """Commands Peltier mode (OFF, HEATING, COOLING) and PWM (0-255)."""
        mode_upper = mode.upper()
        return self.send_raw_command({
            "target": "peltier",
            "mode": mode_upper,
            "pwm": pwm
        })

    def send_auto(self) -> bool:
        """Resumes autonomous onboard hysteresis control."""
        return self.send_raw_command({
            "target": "auto",
            "value": True
        })

    def send_leds(self, red: int, yellow: int, green: int) -> bool:
        """Sets status LEDs manually."""
        return self.send_raw_command({
            "target": "led",
            "red": 1 if red else 0,
            "yellow": 1 if yellow else 0,
            "green": 1 if green else 0
        })

    def get_status(self) -> Dict[str, Any]:
        """Returns bridge operational status."""
        return {
            "is_connected": self.is_connected,
            "port": self.port,
            "baud": self.baud,
            "packets_received": self.packets_received,
            "last_packet_age_sec": round(time.time() - self.last_packet_time, 2) if self.last_packet_time > 0 else None,
            "last_error": self.last_error,
            "latest_telemetry": self.latest_telemetry
        }


# Global singleton instance
esp32_bridge = ESP32HardwareBridge()
