# AVENZA Hardware & Network Troubleshooting Guide

## 1. COM Port & Firmware Flashing Issues

### Issue: "Access denied" / "Serial port COM[x] is busy"
- **Cause**: Another application is currently holding the COM port open.
- **Fix**:
  1. Close the **Arduino IDE Serial Monitor** before attempting to upload firmware or before opening Web Serial in Chrome.
  2. If using the browser Web Serial API, click **Disconnect Serial Link** before flashing in Arduino IDE.
  3. Close any running Python or Putty serial terminal windows.

### Issue: "A fatal error occurred: Failed to connect to ESP32: Timed out waiting for packet header"
- **Cause**: ESP32 bootloader did not enter download mode automatically.
- **Fix**:
  1. While Arduino IDE displays `Connecting........_____.....`, press and hold the **BOOT** (or **IO0**) button on the ESP32 for 2 seconds, then release.
  2. If uploading still fails, solder a 10µF electrolytic capacitor between the **EN** pin and **GND** to stabilize the auto-reset circuit.

---

## 2. Wi-Fi & REST API Connectivity

### Issue: ESP32 fails to connect to Wi-Fi router
- **Cause 1**: ESP32 only supports **2.4 GHz Wi-Fi**. It does not support 5 GHz Wi-Fi bands.
  - *Fix*: In your home/lab router settings, ensure a separate 2.4 GHz SSID is enabled.
- **Cause 2**: Typo in SSID or password in `HardwareConfig.h`.
  - *Fix*: Check quotes and special characters in `WIFI_SSID_DEFAULT` and reflash.
- **Fallback**: If the router is unavailable, connect your phone or laptop directly to the ESP32 Soft-AP:
  - SSID: `AVENZA-ESP32-SETUP`
  - Password: `avenza1234`
  - Base URL: `http://192.168.4.1`

### Issue: Dashboard displays "ESP32 target unreachable" or CORS / Mixed-Content Block
- **Cause**: Browsers running under HTTPS block plain HTTP requests to local IP addresses (`http://192.168.x.x`).
- **Fix**:
  - In local development, use the built-in Vite proxy:
    In the Dashboard's **Configure Target** field, select the preset **Vite Proxy (/api/esp32)**.
    Ensure `VITE_ESP32_TARGET=http://<esp32-ip>` is set in `.env.local`.

---

## 3. Sensor Debugging & Fault Codes

### DS18B20 Chamber Probe returns `-127.0°C`
- **Meaning**: `DEVICE_DISCONNECTED_C`. The ESP32 cannot communicate with the Dallas 1-Wire sensor.
- **Causes & Fixes**:
  1. **Missing 4.7kΩ pull-up resistor**: Ensure a 4.7kΩ resistor is firmly connected between the DATA line (GPIO 4) and 3.3V.
  2. **Loose wiring**: Check breadboard connections for the probe's yellow/white signal wire.
  3. **Faulty probe address**: Check Serial Monitor output; `device count` must be at least `1`.

### DS18B20 Chamber Probe returns `85.0°C`
- **Meaning**: Power-on reset default register value. The sensor has not completed its temperature conversion before being read.
- **Fix**: The firmware uses non-blocking asynchronous requests (`setWaitForConversion(false)`). Ensure `DS18B20_SAMPLE_INTERVAL_MS >= 750` so conversion finishes before reading.

### DHT11 returns `null` or NaN
- **Cause 1**: Read frequency is too fast (DHT11 requires at least 1500 ms between reads).
  - *Fix*: Leave `DHT_SAMPLE_INTERVAL_MS` set to 2000 ms.
- **Cause 2**: Signal degradation over long wires.
  - *Fix*: Keep DHT11 lead wires under 30 cm, or add a 10kΩ external pull-up between GPIO 5 and 3.3V.

### I2C Bus Hangs / Scan finds 0 devices
- **Cause 1**: SDA (GPIO 32) and SCL (GPIO 33) wires are swapped.
- **Cause 2**: Bus capacitance from long wires.
- **Fix**:
  - The firmware incorporates a 50 ms timeout protection: `Wire.setTimeOut(50)`.
  - Check that VCC on the MAX30102 is connected to 3.3V, and GND is securely grounded.

---

## 4. Actuator, Relay & Power Supply Issues

### Relay chattered rapidly or ESP32 resets when relay turns ON
- **Cause**: **Power Supply Brownout**.
  - When the relay coil or Peltier energizes, it draws an inrush surge current. If the 12V or 5V rail dips below ~4.5V, the ESP32 brownout detector triggers a hardware reboot.
- **Fixes**:
  1. Add a **470µF – 1000µF 25V electrolytic capacitor** across the 12V power supply output terminals.
  2. Add a **100µF capacitor** across the 5V input to the ESP32 VIN pin.
  3. Ensure the ESP32 is powered via a dedicated step-down buck converter (or USB cable) rather than drawing logic current through the relay board traces.

### Relay operates backwards (Turns ON when dashboard says OFF)
- **Cause**: Active-HIGH vs Active-LOW inversion.
- **Fix**: Open `HardwareConfig.h` and change:
  ```cpp
  #define RELAY_ACTIVE_LOW false
  ```
  Reflash the firmware.

### Peltier module gets hot on both sides
- **Cause**: Lack of heat dissipation.
  - Heat from the hot side is conducting through the ceramic substrate to the cold side.
- **Fix**:
  - Turn off Peltier immediately.
  - Ensure thermal grease is applied between the module and heatsink.
  - Confirm the 12V fan is spinning and blowing directly through the heatsink fins.
