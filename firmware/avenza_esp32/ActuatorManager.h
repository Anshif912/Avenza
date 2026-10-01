#ifndef ACTUATOR_MANAGER_H
#define ACTUATOR_MANAGER_H

#include <Arduino.h>
#include "HardwareConfig.h"

/* ============================================================
   ACTUATOR & STATUS CONTROLLER
   - Fan Relay (GPIO 18, Active LOW)
   - Status LEDs (Red: 13, Yellow: 14, Green: 23)
   - Peltier L298N (IN1: 25, IN2: 26, ENA: 27)
   ============================================================ */

enum PeltierMode {
  PELTIER_OFF,
  PELTIER_HEATING,
  PELTIER_COOLING
};

class ActuatorManager {
public:
  // Actuator states
  bool fanCommand;
  PeltierMode peltierCommand;
  uint8_t peltierPwm;
  bool safetyCutoffActive;
  bool manualOverrideActive;
  String driverStatus;

  // Status LED states
  bool ledRed;
  bool ledYellow;
  bool ledGreen;

public:
  ActuatorManager()
    : fanCommand(false), peltierCommand(PELTIER_OFF), peltierPwm(0),
      safetyCutoffActive(false), manualOverrideActive(false), driverStatus("READY_OFF"),
      ledRed(false), ledYellow(true), ledGreen(false) {}

  bool begin() {
    // 1. Configure Relay Pin (Safe OFF)
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
    fanCommand = false;

    // 2. Configure Status LED Pins
    pinMode(LED_RED_PIN, OUTPUT);
    pinMode(LED_YELLOW_PIN, OUTPUT);
    pinMode(LED_GREEN_PIN, OUTPUT);
    
    // Initial state: YELLOW on while booting/initializing
    setLeds(false, true, false);

    // 3. Configure L298N H-Bridge Pins (Safe OFF)
    pinMode(PELTIER_ENA, OUTPUT);
    digitalWrite(PELTIER_ENA, LOW);
    pinMode(PELTIER_IN1, OUTPUT);
    digitalWrite(PELTIER_IN1, LOW);
    pinMode(PELTIER_IN2, OUTPUT);
    digitalWrite(PELTIER_IN2, LOW);
    
    peltierCommand = PELTIER_OFF;
    peltierPwm = 0;
    safetyCutoffActive = false;
    manualOverrideActive = false;
    driverStatus = "READY_OFF";
    return true;
  }

  void setLeds(bool red, bool yellow, bool green) {
    ledRed = red;
    ledYellow = yellow;
    ledGreen = green;

    digitalWrite(LED_RED_PIN, red ? HIGH : LOW);
    digitalWrite(LED_YELLOW_PIN, yellow ? HIGH : LOW);
    digitalWrite(LED_GREEN_PIN, green ? HIGH : LOW);
  }

  void setFan(bool on) {
    fanCommand = on;
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(RELAY_PIN, on ? LOW : HIGH);
    } else {
      digitalWrite(RELAY_PIN, on ? HIGH : LOW);
    }
  }

  void setPeltier(PeltierMode mode, uint8_t pwm = 180) {
    if (safetyCutoffActive && mode != PELTIER_OFF) {
      driverStatus = "SAFETY_CUTOFF";
      return;
    }

    peltierCommand = mode;
    peltierPwm = min(pwm, (uint8_t)PELTIER_MAX_SAFE_PWM);

    switch (mode) {
      case PELTIER_HEATING:
        // Heating: IN1 HIGH, IN2 LOW, ENA PWM/HIGH
        digitalWrite(PELTIER_IN1, HIGH);
        digitalWrite(PELTIER_IN2, LOW);
        analogWrite(PELTIER_ENA, peltierPwm);
        driverStatus = "HEATING_ACTIVE";
        break;

      case PELTIER_COOLING:
        // Cooling: IN1 LOW, IN2 HIGH, ENA PWM/HIGH (Reverse direction)
        digitalWrite(PELTIER_IN1, LOW);
        digitalWrite(PELTIER_IN2, HIGH);
        analogWrite(PELTIER_ENA, peltierPwm);
        driverStatus = "COOLING_ACTIVE";
        break;

      case PELTIER_OFF:
      default:
        digitalWrite(PELTIER_IN1, LOW);
        digitalWrite(PELTIER_IN2, LOW);
        analogWrite(PELTIER_ENA, 0);
        digitalWrite(PELTIER_ENA, LOW);
        peltierPwm = 0;
        driverStatus = "READY_OFF";
        break;
    }
  }

  // Autonomous Hysteresis Control according to specification
  void updateAutonomous(float currentTemp, bool isTempValid) {
    // Check thermal emergency safety cutoff first
    if (isTempValid && currentTemp >= THERMAL_SAFETY_CUTOFF) {
      safetyCutoffActive = true;
      setPeltier(PELTIER_OFF, 0);
      setFan(true); // Maximum venting on thermal hazard
      setLeds(true, false, false); // RED alarm
      return;
    } else if (safetyCutoffActive && isTempValid && currentTemp < (THERMAL_SAFETY_CUTOFF - 3.0f)) {
      safetyCutoffActive = false;
    }

    // 1. Status LEDs Control
    if (!isTempValid) {
      // Invalid temperature -> YELLOW
      setLeds(false, true, false);
    } else if (currentTemp < LED_TEMP_WARN_THRESH) {
      // Temperature < 29°C -> GREEN
      setLeds(false, false, true);
    } else if (currentTemp >= LED_TEMP_WARN_THRESH && currentTemp < LED_TEMP_CRIT_THRESH) {
      // 29°C <= temperature < 30°C -> YELLOW
      setLeds(false, true, false);
    } else {
      // Temperature >= 30°C -> RED
      setLeds(true, false, false);
    }

    // If manual override is active, do not overwrite fan/peltier states
    if (manualOverrideActive) return;

    // 2. Fan Hysteresis Control
    if (!isTempValid) {
      setFan(false);
    } else if (currentTemp >= FAN_TEMP_ON_THRESH) {
      // Temp >= 30°C -> Fan ON
      setFan(true);
    } else if (currentTemp <= FAN_TEMP_OFF_THRESH) {
      // Temp <= 29°C -> Fan OFF
      setFan(false);
    }
    // Between 29°C and 30°C -> retain previous fan state

    // 3. Peltier Prototype Heating Hysteresis Control
    if (!isTempValid) {
      setPeltier(PELTIER_OFF, 0);
    } else if (currentTemp <= PELTIER_HEAT_ON_THRESH) {
      // Temp <= 27°C -> Heating ON
      setPeltier(PELTIER_HEATING, 180);
    } else if (currentTemp >= PELTIER_HEAT_OFF_THRESH) {
      // Temp >= 28°C -> Heating OFF
      setPeltier(PELTIER_OFF, 0);
    }
    // Between 27°C and 28°C -> retain previous state
  }

  const char* getPeltierCommandString() const {
    switch (peltierCommand) {
      case PELTIER_HEATING: return "HEATING";
      case PELTIER_COOLING: return "COOLING";
      default: return "OFF";
    }
  }
};

#endif // ACTUATOR_MANAGER_H
