#ifndef ACTUATOR_MANAGER_H
#define ACTUATOR_MANAGER_H

#include <Arduino.h>
#include "HardwareConfig.h"

/* ============================================================
   ACTUATOR & THERMAL SAFETY CONTROLLER (DIAGNOSTIC MODE)
   - Relay Fan (GPIO 18) - Kept strictly OFF
   - L298N Peltier (ENA: 25, IN1: 26, IN2: 27) - Kept strictly OFF
   ============================================================ */

enum PeltierMode {
  PELTIER_OFF,
  PELTIER_HEATING,
  PELTIER_COOLING
};

class ActuatorManager {
public:
  bool fanCommand;
  PeltierMode peltierCommand;
  uint8_t peltierPwm;
  bool safetyCutoffActive;
  String driverStatus;

public:
  ActuatorManager()
    : fanCommand(false), peltierCommand(PELTIER_OFF), peltierPwm(0),
      safetyCutoffActive(false), driverStatus("READY_OFF") {}

  bool begin() {
    // 1. Configure Relay Pin (Safe OFF)
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
    fanCommand = false;

    // 2. Configure L298N H-Bridge Pins (Safe OFF)
    pinMode(PELTIER_ENA, OUTPUT);
    digitalWrite(PELTIER_ENA, LOW);
    pinMode(PELTIER_IN1, OUTPUT);
    digitalWrite(PELTIER_IN1, LOW);
    pinMode(PELTIER_IN2, OUTPUT);
    digitalWrite(PELTIER_IN2, LOW);
    
    peltierCommand = PELTIER_OFF;
    peltierPwm = 0;
    safetyCutoffActive = false;
    driverStatus = "READY_OFF";
    return true;
  }

  void setFan(bool on) {
    fanCommand = on;
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(RELAY_PIN, on ? LOW : HIGH);
    } else {
      digitalWrite(RELAY_PIN, on ? HIGH : LOW);
    }
  }

  void setPeltier(PeltierMode mode, uint8_t pwm) {
    // Kept safe during diagnostic test
    peltierCommand = PELTIER_OFF;
    peltierPwm = 0;
    digitalWrite(PELTIER_ENA, LOW);
    digitalWrite(PELTIER_IN1, LOW);
    digitalWrite(PELTIER_IN2, LOW);
    driverStatus = "READY_OFF";
  }

  void checkThermalSafety(float currentChamberTemp) {
    if (currentChamberTemp >= THERMAL_SAFETY_CUTOFF) {
      safetyCutoffActive = true;
      setPeltier(PELTIER_OFF, 0);
    }
  }

  const char* getPeltierCommandString() const {
    return "OFF";
  }
};

#endif // ACTUATOR_MANAGER_H
