#ifndef HEALTH_MANAGER_H
#define HEALTH_MANAGER_H

#include <Arduino.h>
#include "HardwareConfig.h"

/* ============================================================
   HEALTH & DIAGNOSTICS MANAGER
   Aggregates status across all hardware subsystems:
   - ESP32 Core (Uptime, Free Heap, WiFi RSSI)
   - Sensor Validities (MAX30102, DHT11, DS18B20)
   - Display & Actuators (OLED, Relay, L298N)
   ============================================================ */

class HealthManager {
public:
  uint32_t bootTimestampMs;

public:
  HealthManager() : bootTimestampMs(0) {}

  void begin() {
    bootTimestampMs = millis();
  }

  uint32_t getUptimeMs() const {
    return millis() - bootTimestampMs;
  }

  uint32_t getFreeHeap() const {
    return ESP.getFreeHeap();
  }

  const char* evaluateOverallHealth(bool maxOk, bool dhtOk, bool dsOk, bool wifiOk) const {
    if (maxOk && dhtOk && dsOk && wifiOk) return "ONLINE";
    if (maxOk || dsOk || dhtOk) return "DEGRADED";
    return "FAULT";
  }
};

#endif // HEALTH_MANAGER_H
