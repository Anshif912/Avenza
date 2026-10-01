#ifndef HARDWARE_CONFIG_H
#define HARDWARE_CONFIG_H

#include <Arduino.h>

/* ============================================================
   AVENZA ESP32 FIRMWARE CONFIGURATION
   Clinical Prototype Telemetry & Thermal Controller
   ============================================================ */

#define AVENZA_DEVICE_ID        "AVENZA_ESP32"
#define AVENZA_FIRMWARE_VERSION "1.0.0"

/* --- Hardware Pin Mapping --- */
// 1. DHT11 Ambient Temperature & Humidity
#define DHT_PIN          5   // DHT11 DATA -> GPIO 5

// 2. DS18B20 Chamber Probe (Requires 4.7k Pull-up to 3.3V)
#define DS18B20_PIN      4   // DS18B20 DATA -> GPIO 4

// 3. MAX30102 Hardware I2C (Address 0x57)
#define I2C_SDA          32  // MAX30102 SDA -> GPIO 32
#define I2C_SCL          33  // MAX30102 SCL -> GPIO 33
#define MAX30102_I2C_ADDR 0x57

// 4. Fan Relay (Active LOW: GPIO 18 LOW = ON, HIGH = OFF)
#define RELAY_PIN        18  // Relay IN1 -> GPIO 18
#define RELAY_ACTIVE_LOW true

// 5. Status LEDs (Active HIGH, 220 ohm resistors to GND)
#define LED_RED_PIN      13  // RED LED -> GPIO 13
#define LED_YELLOW_PIN   14  // YELLOW LED -> GPIO 14
#define LED_GREEN_PIN    23  // GREEN LED -> GPIO 23

// 6. Peltier + L298N H-Bridge
#define PELTIER_IN1      25  // L298N IN1 -> GPIO 25
#define PELTIER_IN2      26  // L298N IN2 -> GPIO 26
#define PELTIER_ENA      27  // L298N ENA -> GPIO 27 (PWM Speed / Enable)

/* --- Actuator PWM & Safety Parameters --- */
#define PELTIER_PWM_CHANNEL   0
#define PELTIER_PWM_FREQ      5000  // 5 kHz PWM
#define PELTIER_PWM_RES       8     // 8-bit resolution (0-255)
#define PELTIER_MAX_SAFE_PWM  200   // Conservative limit
#define THERMAL_SAFETY_CUTOFF 38.0f // Auto emergency shutdown if chamber reaches 38.0°C

/* --- Autonomous Hysteresis Thresholds (°C) --- */
// Fan hysteresis: >= 30°C ON, <= 29°C OFF
#define FAN_TEMP_ON_THRESH    30.0f
#define FAN_TEMP_OFF_THRESH   29.0f

// LED thresholds: < 29°C GREEN, 29-30°C YELLOW, >= 30°C RED
#define LED_TEMP_WARN_THRESH  29.0f
#define LED_TEMP_CRIT_THRESH  30.0f

// Peltier heating hysteresis: <= 27°C ON, >= 28°C OFF
#define PELTIER_HEAT_ON_THRESH  27.0f
#define PELTIER_HEAT_OFF_THRESH 28.0f

/* --- Timing & Sampling Intervals (millis) --- */
#define TELEMETRY_INTERVAL_MS      200   // 5 Hz Telemetry transmission to AVENZA
#define HEALTH_INTERVAL_MS         5000  // 5s Status Health Packet
#define DHT_SAMPLE_INTERVAL_MS     1500  // 1.5s DHT11 read cycle
#define DS18B20_SAMPLE_INTERVAL_MS 500   // 500ms DS18B20 read cycle

/* --- MAX30102 Optical Contact Detection Heuristic --- */
#define MAX30102_FINGER_THRESHOLD  40000 // Minimum IR raw reading for skin contact

/* --- Serial Baud Rate --- */
#define SERIAL_BAUD_RATE 115200

#endif // HARDWARE_CONFIG_H
