# AVENZA System Architecture & IoT Dataflow

## 1. High-Level System Overview

AVENZA is an educational IoT and environmental monitoring research prototype consisting of three primary layers:
1. **Embedded Layer (ESP32-WROOM-32)**: Direct physical interface to micro-climate sensors (DHT11, DS18B20), optical photoplethysmography sensor (MAX30102), and dual relay actuators (Circulation Fan, Thermal Element). Exposes a non-blocking HTTP REST API over local Wi-Fi.
2. **Proxy & Gateway Layer (Vite Reverse Proxy / Local Mock Gateway)**: Bridges browser HTTP requests to the ESP32 IP on the local subnet (`/api/esp32` -> `http://<esp32-ip>:80`), resolving browser mixed-content restrictions and CORS security boundaries.
3. **Frontend Application Layer (React 18 + TypeScript + Vite + TailwindCSS)**: Responsive single-page application providing live telemetry visualization, bounded temperature history charts (Recharts), bidirectional actuator control with safety confirmation, and audit event logs.

```
+------------------------------------------------------------------------------------+
|                                FRONTEND DASHBOARD                                  |
|  - React 18 + TypeScript + Tailwind CSS                                            |
|  - Recharts Temperature Trend (DS18B20 vs DHT11 vs 30°C Demo Setpoint)             |
|  - ESP32 IoT Console: Mode Toggle (AUTO / MANUAL), Fan & Peltier Override          |
|  - Prototype Event & Incident Audit Timeline                                       |
+------------------------------------+-----------------------------------------------+
                                     |
                         HTTP REST Fetch / JSON
                                     |
                                     v
+------------------------------------+-----------------------------------------------+
|                      PROXY / LOCAL NETWORK GATEWAY                                  |
|  - Development: Vite Proxy (/api/esp32 -> Target IP / Local Mock :8080)            |
|  - Standalone: Direct Browser HTTP Fetch to ESP32 IP (with CORS enabled)          |
|  - Automated CI / Offline: Node.js Mock ESP32 Server (scripts/mock_esp32_server.js)|
+------------------------------------+-----------------------------------------------+
                                     |
                       Wi-Fi 802.11 b/g/n (Port 80)
                                     |
                                     v
+------------------------------------+-----------------------------------------------+
|                          ESP32-WROOM-32 FIRMWARE                                   |
|  +------------------------------------------------------------------------------+  |
|  | WebServerManager: GET /api/health, GET /api/data, GET /api/history,          |  |
|  |                   GET /api/config, POST /api/control (CORS enabled)          |  |
|  +------------------------------------------------------------------------------+  |
|  | ActuatorManager:                                                             |  |
|  |   - Break-before-make transition dead-time (100ms)                           |  |
|  |   - Heatsink Fan Safety Interlock (Fan forced ON when Peltier energized)     |  |
|  |   - Autonomous Hysteresis (>= 30.0°C Fan ON, <= 29.5°C Fan OFF)             |  |
|  |   - 38.0°C Emergency Thermal Shutdown Hard-Limit                             |  |
|  |   - 60s Manual Command Timeout Failsafe                                      |  |
|  +------------------------------------------------------------------------------+  |
|  | Sensor Subsystems:                                                           |  |
|  |   - DS18B20 Chamber Probe (GPIO 4, 1-Wire, 4.7kΩ pull-up)                    |  |
|  |   - DHT11 Air Temp & Humidity (GPIO 5)                                       |  |
|  |   - MAX30102 Optical PPG (I2C SDA=32, SCL=33, Addr 0x57)                    |  |
|  +------------------------------------------------------------------------------+  |
+------------------------------------+-----------------------------------------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
+-----------------------------+               +-----------------------------+
|    RELAY IN1 (GPIO 18)      |               |     RELAY IN2 (GPIO 25)     |
|   Circulation / Exhaust     |               |   Thermoelectric Peltier    |
|   12V DC Brushless Fan      |               |   12V DC Element (TEC1)     |
+-----------------------------+               +-----------------------------+
```

---

## 2. Firmware Task Scheduling & Non-Blocking Design

The ESP32 loop runs non-blockingly without thread-blocking `delay()` statements during active sensing:
1. **HTTP Server Dispatch**: `webServer.update()` processes incoming socket connections and dispatches JSON requests (`handleClient()`).
2. **Optical FIFO Drain**: `max30102.update()` flushes the hardware FIFO buffer (100 Hz sampling), reading raw IR and raw Red values.
3. **Thermal Conversions**:
   - DS18B20 utilizes asynchronous conversion (`setWaitForConversion(false)`). Temperatures are sampled every 1000 ms without stalling the CPU.
   - DHT11 is sampled every 2000 ms via non-blocking millis timers.
4. **Autonomous Regulation Loop**: Every iteration of `loop()` evaluates active temperature against the 30.0°C hysteresis thresholds and the 38.0°C emergency cutoff.
5. **History Ring Buffer**: Bounded circular buffer storing the last 30 samples (1 every 2s) directly in ESP32 RAM (~1.5 KB RAM footprint).

---

## 3. Frontend Architecture & State Management

The frontend uses React Context (`MonitoringContext`) to coordinate streaming telemetry across multiple views:
- **`ESP32HttpService`**: Singleton service handling URL configuration, dynamic polling interval, exponential error backoff, and event generation.
- **Real-Time Stream Sync**: When Wi-Fi HTTP polling is active, incoming packets update:
  - `vitals.chamberTemp` (DS18B20 measured probe value)
  - `vitals.humidity` (DHT11 measured relative humidity)
  - `thermal.fanCommand` (`HIGH` or `OFF`)
  - `thermal.peltierCommand` (`HEATING` or `OFF`)
  - `thermal.hardwareSafetyStatus` (`CUTOFF_ACTIVE` or `READY`)
  - `sensors` diagnostic items (connection and fault states)
- **Bidirectional Control**: UI actions dispatch validated POST requests to `/api/control`. While requests are pending, buttons are disabled to prevent duplicate submissions.

---

## 4. Multi-Layer Safety Architecture

1. **Hardware Boot Default**: Relays are initialized to safe de-energized states (`HIGH` on active-LOW modules) in `setup()` **before** Wi-Fi radios or sensors are initialized.
2. **Heatsink Interlock**: Firmware enforces that if the Peltier element is energized, the circulation/heatsink fan MUST run. Commands attempting to deactivate the fan while the Peltier is hot are rejected with HTTP 400.
3. **Hard Temperature Cutoff**: If chamber temperature exceeds 38.0°C, the Peltier element is de-energized immediately regardless of manual or auto mode.
4. **Manual Failsafe Timeout**: If the dashboard commands manual mode and ceases sending heartbeats/commands for 60 seconds, the firmware automatically reverts to autonomous mode.
