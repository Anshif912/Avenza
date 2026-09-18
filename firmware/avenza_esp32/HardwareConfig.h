#ifndef HARDWARE_CONFIG_H
#define HARDWARE_CONFIG_H

#include <Arduino.h>

/* ============================================================
   AVENZA ESP32 FIRMWARE CONFIGURATION
   Clinical Prototype Telemetry & Thermal Controller
   ============================================================ */

#define AVENZA_DEVICE_ID        "AVENZA-ESP32-01"
#define AVENZA_FIRMWARE_VERSION "1.0.0"

/* --- Hardware Pin Mapping --- */
#define DHT_PIN          4   // DHT11 Ambient Temperature & Humidity
#define DS18B20_PIN      5   // DS18B20 Chamber Probe (Requires 4.7k Pull-up to 3.3V)

#define I2C_SDA          21  // ESP32 Hardware I2C SDA
#define I2C_SCL          22  // ESP32 Hardware I2C SCL

#define RELAY_PIN        18  // 4-Channel Relay Channel 1 (Configurable active level)
#define RELAY_ACTIVE_LOW true

#define PELTIER_ENA      25  // L298N ENA (PWM Speed / Power)
#define PELTIER_IN1      26  // L298N IN1 (Direction 1)
#define PELTIER_IN2      27  // L298N IN2 (Direction 2)

/* --- I2C Addresses --- */
#define OLED_I2C_ADDR       0x3C // 0.96" SSD1306 128x64 OLED
#define MAX30102_I2C_ADDR   0x57 // Optical PPG Pulse Oximeter

/* --- Actuator Safety Parameters --- */
#define PELTIER_PWM_CHANNEL   0
#define PELTIER_PWM_FREQ      5000  // 5 kHz PWM
#define PELTIER_PWM_RES       8     // 8-bit resolution (0-255)
#define PELTIER_MAX_SAFE_PWM  180   // Conservative limit to protect L298N & power supply
#define THERMAL_SAFETY_CUTOFF 35.0f // Auto shutdown if chamber reaches 35.0°C

/* --- Timing & Sampling Intervals (millis) --- */
#define TELEMETRY_INTERVAL_MS      200   // 5 Hz Telemetry transmission to AVENZA
#define HEALTH_INTERVAL_MS         5000  // 5s Status Health Packet
#define DHT_SAMPLE_INTERVAL_MS     2000  // 2s DHT11 read cycle
#define DS18B20_SAMPLE_INTERVAL_MS 1000  // 1s DS18B20 read cycle
#define OLED_REFRESH_INTERVAL_MS   250   // 4 Hz Display refresh rate

/* --- MAX30102 Prototype Contact Detection Heuristic --- */
#define MAX30102_FINGER_THRESHOLD  50000 // Minimum IR raw reading for prototype skin contact

/* --- Serial Baud Rate --- */
#define SERIAL_BAUD_RATE 115200

#endif // HARDWARE_CONFIG_H
