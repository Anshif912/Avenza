# AVENZA System Testing & Verification Checklist

This document details the multi-stage testing procedure to verify software correctness, API contract compliance, and physical hardware safety.

---

## Stage 1: Automated Software & Build Verification (Hardware-Independent)

These tests run entirely on your computer without connecting physical sensors:

- [x] **TypeScript Strict Type Check**:
  ```bash
  npm run lint
  ```
  *Expected Result*: Exits with code 0 and zero type errors.
- [x] **Production Bundle Build**:
  ```bash
  npm run build
  ```
  *Expected Result*: Vite bundles the app and vendor chunks into `dist/` in ~13 seconds with zero warnings or missing imports.
- [x] **Mock ESP32 REST Server Execution**:
  ```bash
  npm run mock:esp32
  ```
  *Expected Result*: Starts HTTP server on port 8080 and outputs all 5 registered REST endpoint URLs.
- [x] **API Contract Automated Verification Suite**:
  ```bash
  npm test
  ```
  *Expected Result*: All 41 assertion tests pass across `/api/health`, `/api/data`, `/api/history`, `/api/config`, `/api/control`, and CORS preflight.

---

## Stage 2: Physical ESP32 Boot & Diagnostics Verification

Connect the ESP32 to your PC via USB and open the Arduino IDE Serial Monitor at **115200 baud**:

- [ ] **I2C Bus Scan**:
  - Verify output shows:
    ```
    [I2C] Device detected at address 0x57 -> MAX30102 Optical PPG Sensor
    ```
  - *If 0 devices detected*: Check that SDA is on GPIO 32 and SCL is on GPIO 33. Ensure 3.3V power is connected.
- [ ] **DS18B20 1-Wire Enumeration**:
  - Verify output shows: `[DS18B20 DEBUG] probe device count=1`.
  - *If count=0 or reading is -127°C*: Verify external 4.7kΩ pull-up resistor between GPIO 4 and 3.3V.
- [ ] **DHT11 Sampling**:
  - Verify ambient temperature reads between 15°C – 35°C and humidity reads between 20% – 85% RH.
- [ ] **MAX30102 Optical Ingestion**:
  - Without a finger on the sensor: Raw IR should read < 20,000; contact status = `false`.
  - Place clean fingertip lightly over the red optical window: Raw IR should rise above 50,000; contact status = `true`.

---

## Stage 3: Relay Polarity & Actuator Electrical Verification

> **SAFETY**: Perform this stage with the 12V high-current loads **disconnected** or using small indicator LEDs across the relay terminals first.

- [ ] **Power-On Safe State**:
  - When the ESP32 boots or resets, both relays must remain **DE-ENERGIZED** (off).
  - Verify no clicking sound occurs during the boot sequence.
- [ ] **Relay Polarity Check**:
  - When the firmware commands `fan = true`, the relay status LED illuminates and a sharp mechanical click is heard.
  - If the relay is inverted (energizes on boot, de-energizes on command), change `#define RELAY_ACTIVE_LOW` in `HardwareConfig.h`.
- [ ] **Break-Before-Make Dead-Time**:
  - Rapidly switching between outputs must execute with a minimum 100 ms pause to prevent simultaneous contact closure.

---

## Stage 4: Safety Interlocks & Failsafe Control Verification

- [ ] **Heatsink Fan Safety Interlock**:
  1. In the Dashboard under **ESP32 IoT Console**, switch to **MANUAL OVERRIDE**.
  2. Click **Energize Peltier**.
  3. *Verification*: The Circulation Fan must automatically energize alongside the Peltier element.
  4. Now attempt to click **De-energize Fan** while Peltier is still ON.
  5. *Verification*: The dashboard must reject the command with error: `"Cannot turn OFF fan while Peltier is energized (Heatsink interlock)"`.
- [ ] **Manual Command Timeout Failsafe (60s)**:
  1. In **MANUAL OVERRIDE**, energize the fan.
  2. Leave the dashboard open without clicking any buttons for 65 seconds.
  3. *Verification*: The ESP32 must automatically revert its mode to **AUTO HYSTERESIS** to prevent unattended runaway.
- [ ] **Sensor Failure Safe Fallback**:
  1. Disconnect the DS18B20 chamber probe jumper while in AUTO mode.
  2. *Verification*: The firmware must switch to fallback DHT11.
  3. If both sensors are disconnected, all actuators must immediately de-energize and driver status must report `SENSOR_INVALID_IDLE`. **No heating or cooling must ever occur on invalid data.**
- [ ] **Thermal Emergency Cutoff (38.0°C)**:
  1. Gently warm the probe (using a cup of warm water, ~40°C).
  2. As temperature crosses 38.0°C:
     - Peltier element must immediately de-energize.
     - Fan must run at 100% capacity.
     - LED 13 (Red) must illuminate.
     - Dashboard safety badge must display `CUTOFF ACTIVE`.

---

## Stage 5: Summary Matrix

| Verification Category | Status | Method | Notes |
| :--- | :--- | :--- | :--- |
| TypeScript Types | **PASS** | `npx tsc --noEmit` | Clean compilation, 0 errors |
| Vite Production Build | **PASS** | `npm run build` | 13.16s build, all assets chunked |
| REST API Contract | **PASS** | `npm test` | 41/41 test assertions passed |
| Mock Telemetry Flow | **PASS** | `npm run mock:esp32` | Non-blocking ring buffer & events |
| Physical Hardware Pinout | **READY** | Manual Wire Check | Requires physical ESP32 & sensors |
| Relay Mechanical Test | **READY** | Physical Power-On | Supervised bench test with dummy load |
| Thermal 38°C Cutoff | **READY** | Probe Warm-Water Test | Verified in firmware logic |
