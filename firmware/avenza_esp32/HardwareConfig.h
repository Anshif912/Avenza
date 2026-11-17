#ifndef HARDWARE_CONFIG_H
#define HARDWARE_CONFIG_H

#include <Arduino.h>

/* ============================================================
   NEONATTLE ESP32 HARDWARE CONFIGURATION & PIN MAP
   Developed by Avenza
   Educational IoT Prototype for Environmental Monitoring
   ============================================================
   SAFETY NOTICE:
   This is an educational research and demonstration prototype.
   It is NOT a medical device and must NEVER be used for actual
   neonatal or clinical patient care.
   ============================================================ */

#define NEONATTLE_DEVICE_NAME      "NeoNattle Educational Prototype"
#define NEONATTLE_DEVICE_ID        "NEONATTLE_ESP32_01"
#define NEONATTLE_FIRMWARE_VERSION "1.2.0"

// Backward-compatibility aliases for legacy tools
#define AVENZA_DEVICE_NAME         NEONATTLE_DEVICE_NAME
#define AVENZA_DEVICE_ID           NEONATTLE_DEVICE_ID
#define AVENZA_FIRMWARE_VERSION    NEONATTLE_FIRMWARE_VERSION

/* ============================================================
   USB Serial Telemetry Mode (Wi-Fi / REST Disabled)
   Direct USB connection to browser via Chrome Web Serial API @ 115200
   ============================================================ */

/* ============================================================
   Hardware Pin Mapping (ESP32-WROOM-32 / DevKit)
   ============================================================ */

// 1. DHT11 Ambient Temperature & Humidity Sensor
#define DHT_PIN               5    // DHT11 DATA -> GPIO 5
#define DHT_TYPE              DHT11

// 2. DS18B20 Chamber Probe (Requires 4.7k pull-up between DATA and 3.3V)
#define DS18B20_PIN           4    // DS18B20 DATA -> GPIO 4

// 3. I2C Bus (Shared or Dedicated)
// MAX30102 Optical PPG Sensor (Address 0x57)
#define I2C_SDA_PIN           32   // I2C SDA -> GPIO 32
#define I2C_SCL_PIN           33   // I2C SCL -> GPIO 33
#define I2C_BUS_FREQ          100000 // 100 kHz standard mode
#define MAX30102_I2C_ADDR     0x57

// (OLED Display removed per specification - headless operation)

// 5. Relays (Actuators)
// Relay IN1: Circulation / Heatsink Fan
#define RELAY_FAN_PIN         18   // Fan Relay IN1 -> GPIO 18

// Relay IN2: Thermal Element / Peltier (or L298N IN1)
#define RELAY_PELTIER_PIN     25   // Peltier Relay IN2 -> GPIO 25

// Relay Polarity Configuration:
// Most Arduino relay boards are active-LOW: LOW turns relay ON, HIGH turns relay OFF.
// If your relay module is active-HIGH, change this to false.
#define RELAY_ACTIVE_LOW      true

// Optional L298N H-Bridge Support (if using DC PWM motor driver instead of direct relay)
#define USE_L298N_DRIVER      false
#define L298N_IN1_PIN         25   // L298N IN1 -> GPIO 25
#define L298N_IN2_PIN         26   // L298N IN2 -> GPIO 26
#define L298N_ENA_PIN         27   // L298N ENA (PWM) -> GPIO 27

// 6. Optional Diagnostic Status LEDs (Active-HIGH with 220-330 ohm resistors)
#define LEDS_ENABLED          true
#define LED_RED_PIN           13   // Over-threshold / Alert -> GPIO 13
#define LED_YELLOW_PIN        14   // Standby / Warning -> GPIO 14
#define LED_GREEN_PIN         23   // Nominal operation -> GPIO 23

/* ============================================================
   Control Thresholds, Hysteresis & Safety Constraints
   ============================================================ */
// Demonstration Incubator Temperature Setpoints (Educational Prototype)
#define DEFAULT_TARGET_TEMP_C       28.5f // Default chamber setpoint
#define INCUBATOR_TARGET_TEMP_C     28.5f // Setpoint target
#define HEATER_HYSTERESIS_C         0.5f  // Heat when temp < (target - 0.5°C) -> 28.0°C
#define PELTIER_ON_TEMP_THRESHOLD_C 28.0f // Turn Peltier ON at or below 28.0°C
#define PELTIER_OFF_TEMP_THRESHOLD_C 28.5f // Turn Peltier OFF at or above 28.5°C
#define FAN_ON_TEMP_THRESHOLD_C     30.0f // Turn cooling fan ON at or above 30.0°C
#define FAN_OFF_TEMP_THRESHOLD_C    29.5f // Turn cooling fan OFF at or below 29.5°C (hysteresis)

// Thermal Safety Hard-Limit:
// If chamber temperature exceeds this, immediately de-energize heating and activate cooling/fan!
#define EMERGENCY_CUTOFF_TEMP_C  38.0f 

// Manual Control Failsafe Timeout:
// If manual mode is active and no command is received within this time,
// the system automatically reverts to safe AUTO mode to prevent runaway states.
#define MANUAL_COMMAND_TIMEOUT_MS 60000 // 60 seconds

// Break-Before-Make Dead-Time:
// Prevents relay contact arc / short-circuit during rapid state transitions.
#define BREAK_BEFORE_MAKE_DELAY_MS 100 // 100 ms

// Heatsink Fan Safety Interlock:
// When true, the fan MUST run whenever the Peltier element is energized,
// preventing thermal damage to the Peltier module.
#define HEATSINK_FAN_INTERLOCK   true

// Simultaneous Lockout:
// If the fan is a chamber cooling fan (not a heatsink fan), this prevents
// running both heating and cooling simultaneously.
#define SIMULTANEOUS_LOCKOUT     false

/* ============================================================
   Sensor Sampling & Task Intervals (Milliseconds)
   ============================================================ */
#define DHT_SAMPLE_INTERVAL_MS      2000  // 2.0s DHT11 read cycle
#define DS18B20_SAMPLE_INTERVAL_MS  1000  // 1.0s DS18B20 conversion cycle
#define HISTORY_SAMPLE_INTERVAL_MS  2000  // Record history point every 2s
#define HISTORY_BUFFER_CAPACITY     30    // Keep last 30 samples (60 seconds)
#define TELEMETRY_INTERVAL_MS       1000  // 1.0s (1 Hz) non-blocking serial telemetry stream
#define HEALTH_INTERVAL_MS          5000  // 5.0s health heartbeat
#define SERIAL_BAUD_RATE            115200

/* ============================================================
   MAX30102 Optical Configuration
   ============================================================ */
#define MAX30102_CONTACT_ENTER_THRESHOLD 25000 // Minimum raw IR to establish skin contact
#define MAX30102_CONTACT_EXIT_THRESHOLD  15000 // Minimum raw IR to maintain skin contact (hysteresis)
#define MAX30102_CONTACT_THRESHOLD       25000 // Backward compatibility alias
#define MAX30102_LED_PULSE_AMP           0x28  // ~8.0 mA LED drive (ideal PPG signal amplitude)

#endif // HARDWARE_CONFIG_H
