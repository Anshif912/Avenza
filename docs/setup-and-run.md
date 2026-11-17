# AVENZA Setup & Execution Guide

## Quick Start Summary
- **Frontend Dev Server**: `npm run dev` (runs on `http://localhost:3000`)
- **ESP32 Mock Server**: `npm run mock:esp32` (runs on `http://localhost:8080`)
- **API Verification Tests**: `npm test` (verifies all 41 API constraints)
- **Firmware Sketch**: `firmware/avenza_esp32/avenza_esp32.ino` (Arduino IDE)

---

## 1. Prerequisites

1. **Software**:
   - **Node.js**: v18.0.0 or higher
   - **Arduino IDE**: v2.2.0 or higher (with ESP32 board package installed)
   - **Modern Web Browser**: Google Chrome or Microsoft Edge (recommended for Web Serial & full standard compliance)
2. **Hardware (Physical Mode)**:
   - ESP32-WROOM-32 / ESP32 DevKit module
   - Micro-USB cable capable of data transfer (not charge-only)
   - 12V 5A regulated DC power supply
   - DHT11 sensor, DS18B20 waterproof probe with 4.7kΩ resistor, MAX30102 PPG module, 2-channel relay board, 12V fan, TEC1-12706 Peltier.

---

## 2. Option A: Running with Physical ESP32 Hardware

### Step 1: Install Arduino IDE Libraries
In Arduino IDE, open **Tools → Manage Libraries...** (`Ctrl+Shift+I`) and install:
1. `DallasTemperature` (by Miles Burton)
2. `OneWire` (by Paul Stoffregen)
3. `DHT sensor library` (by Adafruit)
4. `SparkFun MAX3010x Pulse and Proximity Sensor Library` (by SparkFun)

### Step 2: Configure Wi-Fi Credentials
Open `firmware/avenza_esp32/HardwareConfig.h`:
```cpp
#define WIFI_SSID_DEFAULT     "Your_WiFi_Name"
#define WIFI_PASSWORD_DEFAULT "Your_WiFi_Password"
```
*(Leave other pins at their tested defaults: DHT=5, DS18B20=4, I2C=32/33, Fan=18, Peltier=25).*

### Step 3: Flash the Firmware
1. Connect ESP32 via USB cable.
2. Select **Tools → Board → ESP32 Arduino → ESP32 Dev Module**.
3. Select your serial COM port (e.g. `COM3` on Windows or `/dev/ttyUSB0` on Linux/Mac).
4. Click **Upload** (`Ctrl+U`).

### Step 4: Obtain the ESP32 IP Address
1. Open **Tools → Serial Monitor** at **115200 baud**.
2. Press the **EN / RST** button on the ESP32 to restart.
3. Observe the output:
   ```
   [I2C] Scanning I2C bus (SDA=32, SCL=33)...
   [I2C] Device detected at address 0x57 -> MAX30102 Optical PPG Sensor
   [WIFI] Connecting to Wi-Fi SSID: Your_WiFi_Name...
   [WIFI] Successfully connected!
   [WIFI] Assigned IP: 192.168.1.150
   [WIFI] REST API available at: http://192.168.1.150/api/data
   ```
4. Note the assigned IP address (e.g. `192.168.1.150`).

### Step 5: Launch the Dashboard & Connect
1. In the project root, start the frontend:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000` in Google Chrome or Microsoft Edge.
3. Navigate to **IoT Hardware** in the sidebar (or click the **ESP32 IoT Console & Controls** tab on the Dashboard).
4. Click **Configure Target** and enter your ESP32 IP (e.g. `http://192.168.1.150`).
5. Click **Save & Connect**. The status badge will change to **CONNECTED (green)**, and real sensor telemetry will populate immediately.

---

## 3. Option B: Running in Offline / Mock Simulation Mode (No Hardware Needed)

You can run and test the complete end-to-end system without physical hardware using the included mock ESP32 server:

### Step 1: Start the Mock Server
In a terminal, run:
```bash
npm run mock:esp32
```
Output:
```
[MOCK-ESP32] Avenza Mock ESP32 server running at http://localhost:8080
[MOCK-ESP32] Endpoints:
   - GET  http://localhost:8080/api/health
   - GET  http://localhost:8080/api/data
   - GET  http://localhost:8080/api/history
   - GET  http://localhost:8080/api/config
   - POST http://localhost:8080/api/control
```

### Step 2: Run Automated API Verification Tests
In a second terminal, execute:
```bash
npm test
```
This tests all 41 REST endpoints, JSON schemas, heatsink interlocks, error codes, and CORS headers.

### Step 3: Start the Web Dashboard
```bash
npm run dev
```
Open `http://localhost:3000`. The Vite proxy automatically routes `/api/esp32` to the mock server at `http://localhost:8080`. Telemetry will stream smoothly into the UI.

---

## 4. Reverse Proxy Setup for CORS & Remote Hosting

If you host the frontend on a remote domain or HTTPS, browsers will block direct requests to `http://192.168.x.x` due to **Mixed-Content** security rules.

To resolve this during local development, use the built-in Vite reverse proxy:
1. Create a `.env.local` file:
   ```env
   VITE_ESP32_TARGET=http://192.168.1.150
   ```
2. Restart `npm run dev`.
3. In the dashboard's URL configuration, select the preset **Vite Proxy (/api/esp32)**. The browser now communicates through `http://localhost:3000/api/esp32`, which Vite securely forwards to the ESP32.
