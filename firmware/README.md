# NeoNattle ESP32 Firmware Guide
*Developed by Avenza*

## Overview
This firmware turns an **ESP32 DevKit / ESP32-WROOM-32** into an IoT telemetry and environmental control unit for the NeoNattle Educational Prototype developed by Avenza. It reads environmental and optical sensors, executes autonomous thermal regulation with hardware safety interlocks, and exposes a real-time HTTP REST API and USB serial stream.

> **CRITICAL EDUCATIONAL & SAFETY NOTICE**  
> NeoNattle is an academic engineering and educational research prototype developed by Avenza. It is **NOT** a certified medical device and must **NEVER** be used for actual neonatal or clinical patient care. Raw optical and temperature readings are uncalibrated and intended solely for IoT prototyping and demonstration.

---

## Hardware Pin Mapping

| Component | ESP32 GPIO | Electrical Requirements & Notes |
| :--- | :--- | :--- |
| **DHT11 Ambient Sensor** | `GPIO 5` | Single-bus data line. 3.3V VCC. Measures air temp & relative humidity. |
| **DS18B20 Chamber Probe** | `GPIO 4` | 1-Wire bus. **Requires external 4.7kΩ pull-up resistor** between DATA and 3.3V. |
| **MAX30102 Optical PPG (SDA)**| `GPIO 32` | Hardware I2C data. Address `0x57`. Powered via 3.3V. |
| **MAX30102 Optical PPG (SCL)**| `GPIO 33` | Hardware I2C clock. |
| **Relay IN1 (Circulation Fan)**| `GPIO 18` | Active-LOW relay trigger (`LOW = ON`, `HIGH = OFF`). Configurable polarity. |
| **Relay IN2 (Peltier Element)**| `GPIO 25` | Active-LOW relay trigger. Heatsink fan interlock enforced. |
| **Status LED - RED (Crit/High)**| `GPIO 13` | 220Ω series resistor to GND. Active-HIGH. Illuminates if temp ≥ 30°C or emergency cutoff. |
| **Status LED - YELLOW (Warn/Boot)**| `GPIO 14` | 220Ω series resistor to GND. Active-HIGH. Illuminates during boot or standby. |
| **Status LED - GREEN (Nominal)**| `GPIO 23` | 220Ω series resistor to GND. Active-HIGH. Illuminates when temp < 29°C. |

---

## Power Supply & Electrical Wiring Guidelines

1. **Power Supply Capacity**:
   - The prototype uses a **12V 5A DC regulated power supply**.
   - A typical TEC1-12706 Peltier module draws **3.5A – 4.5A** at 12V.
   - A 12V DC circulation fan draws **0.15A – 0.35A**.
   - **Combined Peak Load**: Can reach ~4.8A at startup. Do NOT add secondary high-current loads without upgrading the supply.
2. **ESP32 Power Isolation**:
   - **NEVER** connect 12V directly to the ESP32 GPIO pins or 3.3V rail.
   - Use an isolated step-down buck converter (12V → 5V) to power the ESP32 VIN pin, or power the ESP32 via its micro-USB port while sharing GND with the 12V supply.
3. **Fuse Protection**:
   - Install a **5A fast-blow inline fuse** on the 12V main positive rail.
   - Install a **1A fuse** on the fan branch.
4. **Thermal Safety & Heatsink Fan Interlock**:
   - Peltier modules generate intense heat on their hot side within seconds.
   - **Firmware Safety**: The firmware enforces `HEATSINK_FAN_INTERLOCK = true`, which guarantees the fan is energized whenever the Peltier is commanded ON.
   - **Hard Cutoff**: The firmware implements a 38.0°C hard cutoff (`EMERGENCY_CUTOFF_TEMP_C`). If the chamber probe reads ≥ 38.0°C, the Peltier is immediately de-energized and the fan runs at full capacity.

---

## Required Arduino IDE Libraries

Install the following libraries via the **Arduino Library Manager** (`Ctrl+Shift+I`):

1. **DallasTemperature** (by Miles Burton) — for DS18B20.
2. **OneWire** (by Paul Stoffregen) — 1-Wire communication for DS18B20.
3. **DHT sensor library** (by Adafruit) — for DHT11.
4. **Adafruit Unified Sensor** (dependency for DHT).
5. **SparkFun MAX3010x Pulse and Proximity Sensor Library** (by SparkFun).

---

## Configuration & Flashing Steps

1. Open `firmware/avenza_esp32/avenza_esp32.ino` in Arduino IDE.
2. Open `HardwareConfig.h` and configure:
   ```cpp
   #define WIFI_SSID_DEFAULT     "Your_WiFi_Network"
   #define WIFI_PASSWORD_DEFAULT "Your_WiFi_Password"
   ```
3. Connect the ESP32 to your PC via USB cable.
4. In Arduino IDE:
   - Select **Tools → Board → ESP32 Dev Module**.
   - Select **Tools → Upload Speed → 921600** (or 115200).
   - Select **Tools → Port → COM[x]** (e.g. COM3 or COM4).
5. Click **Upload** (`Ctrl+U`).
6. Open **Tools → Serial Monitor** at **115200 baud**.
7. Observe the boot sequence:
   - I2C diagnostic scan will list detected addresses (`0x57` for MAX30102).
   - Relay outputs will be set to safe OFF.
   - Wi-Fi connection will be established and the assigned IP address (e.g. `192.168.1.150`) will be printed.
   - If the router is unreachable, the ESP32 starts its own Soft-AP named `AVENZA-ESP32-SETUP` with IP `192.168.4.1`.

---

## REST API Endpoints

All endpoints support CORS and return JSON:

- `GET /api/health` — Subsystem statuses, Wi-Fi info, uptime, free heap.
- `GET /api/data` — Latest sensor readings, mode, actuator states.
- `GET /api/history` — Last 30 telemetry points (every 2s).
- `GET /api/config` — Pinout map, thresholds, and safety settings.
- `POST /api/control` — Send mode and actuator commands:
  ```json
  {
    "mode": "MANUAL",
    "fan": true,
    "peltier": false
  }
  ```
