#ifndef ACTUATOR_MANAGER_H
#define ACTUATOR_MANAGER_H

#include <Arduino.h>
#include "HardwareConfig.h"

/* ============================================================
   ACTUATOR & RELAY CONTROLLER WITH HARDWARE SAFETY INTERLOCKS
   - Relay IN1 (Fan): GPIO 18 (Configurable Active-LOW / Active-HIGH)
   - Relay IN2 (Peltier): GPIO 25 (Configurable Active-LOW / Active-HIGH)
   - Diagnostic LEDs: Red (13), Yellow (14), Green (23)
   - Heatsink Fan Interlock: Fan forced ON whenever Peltier is energized
   - Break-before-make switching dead-time (100 ms)
   - Manual command timeout failsafe (60s reverting to AUTO)
   - Emergency thermal shutdown at >= 38.0°C
   ============================================================ */

enum SystemControlMode {
  MODE_AUTO,
  MODE_MANUAL
};

class ActuatorManager {
public:
  // Control Mode
  SystemControlMode mode;
  uint32_t lastManualCommandMs;

  // Actuator States
  bool fanState;       // true = energized, false = de-energized
  bool peltierState;   // true = energized, false = de-energized
  bool safetyCutoffActive;
  String driverStatus;
  String fanReason;
  String peltierReason;

  // LED states
  bool ledRed;
  bool ledYellow;
  bool ledGreen;

public:
  ActuatorManager()
    : mode(MODE_AUTO),
      lastManualCommandMs(0),
      fanState(false),
      peltierState(false),
      safetyCutoffActive(false),
      driverStatus("IDLE_OFF"),
      fanReason("System initialization"),
      peltierReason("System initialization"),
      ledRed(false),
      ledYellow(true),
      ledGreen(false)
  {}

  void begin() {
    // 1. Initialize Relay Pins IMMEDIATELY to safe de-energized state
    pinMode(RELAY_FAN_PIN, OUTPUT);
    pinMode(RELAY_PELTIER_PIN, OUTPUT);
    
    // De-energize relays (respecting active-LOW vs active-HIGH)
    writeRelayPin(RELAY_FAN_PIN, false);
    writeRelayPin(RELAY_PELTIER_PIN, false);
    fanState = false;
    peltierState = false;

    // 2. Initialize Status LEDs
    #if LEDS_ENABLED
    pinMode(LED_RED_PIN, OUTPUT);
    pinMode(LED_YELLOW_PIN, OUTPUT);
    pinMode(LED_GREEN_PIN, OUTPUT);
    setLeds(false, true, false); // Booting indication: Yellow ON
    #endif

    driverStatus = "READY_OFF";
    fanReason = "Standby";
    peltierReason = "Standby";
  }

  // Low-level safe relay write with configurable polarity & serial logging
  void writeRelayPin(uint8_t pin, bool energized) {
    uint8_t level;
    if (RELAY_ACTIVE_LOW) {
      level = energized ? LOW : HIGH;
    } else {
      level = energized ? HIGH : LOW;
    }
    digitalWrite(pin, level);
    Serial.print(F("[RELAY] GPIO "));
    Serial.print(pin);
    Serial.print(F(" write: "));
    Serial.print(level == LOW ? F("LOW") : F("HIGH"));
    Serial.print(F(" ("));
    Serial.print(energized ? F("ENERGIZED") : F("DE-ENERGIZED"));
    Serial.println(F(")"));
  }

  void setLeds(bool red, bool yellow, bool green) {
    ledRed = red;
    ledYellow = yellow;
    ledGreen = green;
    #if LEDS_ENABLED
    digitalWrite(LED_RED_PIN, red ? HIGH : LOW);
    digitalWrite(LED_YELLOW_PIN, yellow ? HIGH : LOW);
    digitalWrite(LED_GREEN_PIN, green ? HIGH : LOW);
    #endif
  }

  // Sets fan with interlock verification and logging
  void setFan(bool on, const char* reason = "Manual") {
    Serial.print(F("[ACTION] FAN REQUEST "));
    Serial.println(on ? F("ON") : F("OFF"));
    fanState = on;
    fanReason = reason;
    writeRelayPin(RELAY_FAN_PIN, on);
    Serial.print(F("[STATE] FAN = "));
    Serial.println(on ? F("ON") : F("OFF"));
  }

  // Sets Peltier with interlock, break-before-make and diagnostic logging
  bool setPeltier(bool on, const char* reason = "Manual") {
    Serial.print(F("[ACTION] PELTIER REQUEST "));
    Serial.println(on ? F("ON") : F("OFF"));
    Serial.print(F("[SAFETY] CUTOFF = "));
    Serial.println(safetyCutoffActive ? F("ACTIVE (BLOCKED)") : F("INACTIVE (OK)"));

    if (safetyCutoffActive && on) {
      driverStatus = "CUTOFF_ACTIVE";
      peltierReason = "Blocked by thermal emergency cutoff (>= 38.0C)";
      Serial.println(F("[SAFETY] Peltier blocked by safety cutoff!"));
      return false;
    }

    // Heatsink Fan Interlock:
    // If Peltier is being energized and heatsink fan interlock is enabled,
    // ensure fan is energized FIRST!
    if (on && HEATSINK_FAN_INTERLOCK) {
      if (!fanState) {
        Serial.println(F("[SAFETY] FAN INTERLOCK = ENFORCING (Starting fan first)"));
        setFan(true, "Heatsink fan forced ON for Peltier cooling");
        delay(BREAK_BEFORE_MAKE_DELAY_MS); // Break-before-make settling delay
      } else {
        Serial.println(F("[SAFETY] FAN INTERLOCK = SATISFIED"));
      }
    }

    // Simultaneous lockout check:
    if (on && SIMULTANEOUS_LOCKOUT && fanState) {
      setFan(false, "Lockout: Fan stopped for Peltier heating");
      delay(BREAK_BEFORE_MAKE_DELAY_MS);
    }

    peltierState = on;
    peltierReason = reason;
    writeRelayPin(RELAY_PELTIER_PIN, on);

    driverStatus = on ? "PELTIER_ENERGIZED" : "PELTIER_IDLE";
    Serial.print(F("[STATE] PELTIER = "));
    Serial.println(on ? F("ON") : F("OFF"));
    return true;
  }

  // Emergency safe shutdown: all actuators OFF
  void emergencyShutdown(const char* reason) {
    safetyCutoffActive = true;
    peltierState = false;
    writeRelayPin(RELAY_PELTIER_PIN, false);
    // Keep fan ON to dissipate excess heat!
    fanState = true;
    writeRelayPin(RELAY_FAN_PIN, true);
    driverStatus = "EMERGENCY_SHUTDOWN";
    fanReason = "Emergency heat dissipation";
    peltierReason = reason;
    setLeds(true, false, false); // RED alarm
  }

  // Autonomous Incubator Hysteresis Control Loop
  void updateAutonomous(float currentTemp, bool isTempValid) {
    uint32_t now = millis();

    // 1. Check Thermal Emergency Cutoff first (independent of mode)
    if (isTempValid && currentTemp >= EMERGENCY_CUTOFF_TEMP_C) {
      emergencyShutdown("Temperature >= 38.0°C hard cutoff");
      return;
    } else if (safetyCutoffActive && isTempValid && currentTemp < (EMERGENCY_CUTOFF_TEMP_C - 2.0f)) {
      safetyCutoffActive = false; // Auto-recovery once cooled
      driverStatus = "READY_OFF";
    }

    // 2. Failsafe Manual Mode Timeout Check:
    // If in MANUAL mode and timeout expired, revert to AUTO
    if (mode == MODE_MANUAL) {
      if (now - lastManualCommandMs > MANUAL_COMMAND_TIMEOUT_MS) {
        mode = MODE_AUTO;
        Serial.println(F("[SAFETY] Manual command timeout expired (60s). Reverted to AUTO."));
      }
    }

    // 3. Status LED Management
    if (!isTempValid) {
      setLeds(false, true, false); // Sensor error / warming up -> Yellow
    } else if (currentTemp >= FAN_ON_TEMP_THRESHOLD_C) {
      setLeds(true, false, false); // Over threshold (>= 30.0°C) -> Red
    } else if (currentTemp >= (FAN_ON_TEMP_THRESHOLD_C - 1.0f)) {
      setLeds(false, true, false); // Close to threshold (29.0 - 29.9°C) -> Yellow
    } else {
      setLeds(false, false, true); // Nominal (< 29.0°C) -> Green
    }

    // 4. In MANUAL mode, skip automatic hysteresis logic
    if (mode == MODE_MANUAL) {
      return;
    }

    // 5. AUTO Mode Logic (Incubator Regulation Loop)
    // If temperature sensor is invalid / unavailable:
    // DO NOT automatically heat or cool based on invalid data! Revert to safe idle.
    if (!isTempValid) {
      if (peltierState) setPeltier(false, "Safe fallback: sensor invalid");
      if (fanState) setFan(false, "Safe fallback: sensor invalid");
      driverStatus = "SENSOR_INVALID_IDLE";
      return;
    }

    // A. Autonomous Heating Regulation:
    // Turn Peltier ON at <= PELTIER_ON_TEMP_THRESHOLD_C (28.0°C)
    // Turn Peltier OFF at >= PELTIER_OFF_TEMP_THRESHOLD_C (28.5°C)
    if (currentTemp <= PELTIER_ON_TEMP_THRESHOLD_C) {
      if (!peltierState) {
        setPeltier(true, "Auto: Chamber temp below target setpoint");
      }
    } else if (currentTemp >= PELTIER_OFF_TEMP_THRESHOLD_C) {
      if (peltierState) {
        setPeltier(false, "Auto: Chamber temp reached target setpoint");
      }
    }

    // B. Autonomous Cooling Fan Regulation:
    // Turn ON at >= 30.0°C, turn OFF at <= 29.5°C
    if (currentTemp >= FAN_ON_TEMP_THRESHOLD_C) {
      if (!fanState) {
        setFan(true, "Auto: Temp >= 30.0°C threshold");
      }
    } else if (currentTemp <= FAN_OFF_TEMP_THRESHOLD_C) {
      // Only turn fan OFF if Peltier does not require heatsink fan!
      if (!peltierState || !HEATSINK_FAN_INTERLOCK) {
        if (fanState) {
          setFan(false, "Auto: Temp <= 29.5°C threshold");
        }
      }
    }
  }

  // Handle validated manual control command from HTTP/Serial
  bool applyControlCommand(const String& newMode, int fanCmd, int peltierCmd, String& outError) {
    lastManualCommandMs = millis();

    // Mode handling
    if (newMode.length() > 0) {
      String upper = newMode;
      upper.toUpperCase();
      if (upper == "AUTO") {
        mode = MODE_AUTO;
      } else if (upper == "MANUAL") {
        mode = MODE_MANUAL;
      } else {
        outError = "Invalid mode. Allowed: 'AUTO' or 'MANUAL'";
        return false;
      }
    }

    // If command specified actuators, mode must be MANUAL
    if (fanCmd >= 0 || peltierCmd >= 0) {
      mode = MODE_MANUAL;
    }

    if (mode == MODE_MANUAL) {
      // Validate fan command
      if (fanCmd >= 0) {
        bool targetFan = (fanCmd == 1);
        // If Peltier is currently ON and heatsink fan is required, reject turning fan OFF
        if (!targetFan && peltierState && HEATSINK_FAN_INTERLOCK) {
          outError = "FAN_INTERLOCK_REQUIRED";
          Serial.println(F("[SAFETY] Fan OFF rejected: Peltier is energized (Heatsink interlock required)"));
          return false;
        }
        setFan(targetFan, "Manual command");
      }

      // Validate Peltier command
      if (peltierCmd >= 0) {
        bool targetPeltier = (peltierCmd == 1);
        if (targetPeltier && SIMULTANEOUS_LOCKOUT && fanState) {
          outError = "SIMULTANEOUS_LOCKOUT";
          return false;
        }
        if (!setPeltier(targetPeltier, "Manual command")) {
          outError = safetyCutoffActive ? "SAFETY_CUTOFF_ACTIVE" : "COMMAND_REJECTED";
          return false;
        }
      }
    }

    return true;
  }

  const char* getModeString() const {
    return (mode == MODE_AUTO) ? "AUTO" : "MANUAL";
  }
};

#endif // ACTUATOR_MANAGER_H
