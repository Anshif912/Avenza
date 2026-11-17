# AVENZA — Educational IoT Neonatal-Environment Monitoring Prototype

> ### **CRITICAL EDUCATIONAL & ACADEMIC DISCLAIMER**  
> **AVENZA is a student educational and engineering research prototype developed for IoT environmental monitoring and experimental multi-sensor telemetry visualization.**  
> - **IT IS NOT A CERTIFIED MEDICAL DEVICE.**  
> - **IT MUST NEVER BE USED FOR MONITORING, DIAGNOSING, OR REGULATING ACTUAL NEONATAL INFANTS OR CLINICAL PATIENTS.**  
> - **Raw optical readings (MAX30102) and temperature setpoints are experimental demonstration values, not clinical vital signs.**

---

## Overview

AVENZA integrates an **ESP32-WROOM-32 microcontroller** with a **modern web dashboard (React 18 + TypeScript + Vite + TailwindCSS)** to monitor simulated micro-climate environmental conditions (chamber temperature, ambient air temperature, relative humidity, raw optical reflectance) and manage thermal actuators with strict hardware safety interlocks.

### Key Capabilities
- **Local Wi-Fi REST API**: ESP32 runs an in-memory HTTP server (`/api/health`, `/api/data`, `/api/history`, `/api/config`, `/api/control`) with full CORS preflight.
- **Micro-Climate Sensing**: DS18B20 1-Wire chamber probe (GPIO 4 with 4.7kΩ pull-up) + DHT11 ambient air temperature and humidity (GPIO 5).
- **Raw Optical Reflectance**: MAX30102 PPG sensor over hardware I2C (SDA=32, SCL=33, address 0x57) labeled strictly as uncalibrated experimental data.
- **Autonomous Thermal Regulation**: Configurable demonstration hysteresis setpoint (30.0°C Fan ON, 29.5°C Fan OFF).
- **Safety Interlocks & Failsafes**:
  - Heatsink Fan Interlock: Circulation fan is forced ON whenever the Peltier element is energized.
  - Thermal Emergency Shutdown: Hard-limit shutoff at ≥ 38.0°C.
  - Manual Failsafe Timeout: Reverts manual override to safe AUTO mode after 60 seconds of inactivity.
  - Break-Before-Make: 100 ms dead-time to protect relay contacts.
- **Offline / Mock Simulation Engine**: Full-fidelity Node.js mock ESP32 server (`scripts/mock_esp32_server.js`) allowing complete software development and testing without physical hardware.

---

## Hardware Pin Mapping

| Component | ESP32 GPIO | Operating Voltage | Notes |
| :--- | :--- | :--- | :--- |
| **DHT11 Air Sensor** | `GPIO 5` | 3.3V | Single-bus data line (temperature & humidity) |
| **DS18B20 Chamber Probe** | `GPIO 4` | 3.3V | 1-Wire bus. **Requires external 4.7kΩ pull-up to 3.3V** |
| **MAX30102 Optical PPG** | `GPIO 32 (SDA), GPIO 33 (SCL)` | 3.3V | Hardware I2C (Address `0x57`). Raw IR/Red channels |
| **SSD1306 OLED (128x64)** | `GPIO 32 (SDA), GPIO 33 (SCL)` | 3.3V | Shared I2C (Address `0x3C`). Headless fallback if absent |
| **Relay IN1 (Circulation Fan)**| `GPIO 18` | 5V Coil / 3.3V Logic | Active-LOW trigger (`LOW = ON`, `HIGH = OFF`) |
| **Relay IN2 (Peltier Element)**| `GPIO 25` | 5V Coil / 3.3V Logic | Active-LOW trigger. Interlocked with Fan |
| **LEDs (Red, Yellow, Green)** | `GPIO 13, 14, 23` | 3.3V Logic | 220Ω series resistors to GND |

*Power Supply*: 12V 5A DC regulated power supply with a 5A main fuse on the 12V line and a 1A branch fuse on the fan line. Step-down buck converter (12V → 5V) powers the ESP32 VIN pin. **Never connect 12V directly to ESP32 pins.**

---

## Quick Start: Exact Execution Steps

### 1. Running the Web Dashboard
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in Google Chrome or Microsoft Edge.

### 2. Running the Mock ESP32 Server (Offline Testing)
In a separate terminal:
```bash
npm run mock:esp32
```
Starts the mock HTTP REST server at `http://localhost:8080`. The dashboard's built-in Vite proxy transparently routes `/api/esp32` requests to this mock server.

### 3. Running Automated API Tests
```bash
npm test
```
Executes `tests/esp32-api.test.mjs`, running 41 assertion tests against the API schema, error handling, heatsink interlocks, and CORS headers.

### 4. Flashing Physical ESP32 Firmware
1. Open `firmware/avenza_esp32/avenza_esp32.ino` in **Arduino IDE 2.x**.
2. Open `HardwareConfig.h` and enter your Wi-Fi credentials:
   ```cpp
   #define WIFI_SSID_DEFAULT     "Your_WiFi_SSID"
   #define WIFI_PASSWORD_DEFAULT "Your_WiFi_Password"
   ```
3. In Arduino IDE, select board **ESP32 Dev Module**, select your COM port, and click **Upload**.
4. Open the Serial Monitor at **115200 baud** to view the I2C scan and copy the assigned IP address (e.g. `http://192.168.1.150`).
5. In the web dashboard, open the **IoT Hardware** workspace (or the **ESP32 IoT Console & Controls** tab), click **Configure Target**, enter `http://192.168.1.150`, and click **Save & Connect**.

---

## Documentation Directory (`docs/`)

Comprehensive technical guides are available in the [`docs/`](file:///c:/Avenza/docs/) directory:

- [**docs/architecture.md**](file:///c:/Avenza/docs/architecture.md): End-to-end architecture diagram, data pipelines, non-blocking task scheduler, and multi-layer safety design.
- [**docs/api-contract.md**](file:///c:/Avenza/docs/api-contract.md): Complete JSON request/response schemas for `/api/health`, `/api/data`, `/api/history`, `/api/config`, and `/api/control`.
- [**docs/hardware-wiring.md**](file:///c:/Avenza/docs/hardware-wiring.md): Electrical schematic, 12V 5A power distribution, branch fusing, active-LOW relay verification, and heatsink mounting.
- [**docs/setup-and-run.md**](file:///c:/Avenza/docs/setup-and-run.md): Step-by-step setup guide for both physical hardware and offline simulation modes.
- [**docs/testing-checklist.md**](file:///c:/Avenza/docs/testing-checklist.md): Multi-stage verification checklist (software builds, physical I2C scan, relay bench tests, 38°C cutoff test).
- [**docs/troubleshooting.md**](file:///c:/Avenza/docs/troubleshooting.md): Solutions for COM port busy errors, Wi-Fi connectivity, CORS/mixed content, DS18B20 `-127°C` errors, and power supply brownouts.
- [**docs/safety-and-limitations.md**](file:///c:/Avenza/docs/safety-and-limitations.md): Detailed academic non-clinical disclaimer, sensor scope boundaries, and high-current electrical safety protocols.
- [**firmware/README.md**](file:///c:/Avenza/firmware/README.md): Dedicated ESP32 firmware guide, library installation steps, and hardware configuration.
