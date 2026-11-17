#ifndef WEB_SERVER_MANAGER_H
#define WEB_SERVER_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include "HardwareConfig.h"
#include "TemperatureManager.h"
#include "MAX30102Manager.h"
#include "ActuatorManager.h"
#include "HealthManager.h"

/* ============================================================
   NEONATTLE ESP32 REST API WEB SERVER
   Developed by Avenza
   Port: 80 (HTTP)
   Endpoints:
   - GET  /api/health   : System health, WiFi, uptime, sensor statuses
   - GET  /api/data     : Latest sensor telemetry, actuators, mode
   - GET  /api/history  : Bounded in-memory telemetry sample history
   - GET  /api/config   : Non-secret threshold settings and pinout map
   - POST /api/control  : Validated mode/output actuator commands
   - OPTIONS /api/*     : CORS preflight headers
   ============================================================ */

struct HistorySample {
  uint32_t uptimeSec;
  float probeTemp;
  bool probeValid;
  float airTemp;
  bool airValid;
  float humidity;
  bool humValid;
  bool fan;
  bool peltier;
};

class WebServerManager {
public:
  WebServer server;
  uint32_t lastHistorySampleMs;
  
  // Ring buffer for bounded in-memory history
  HistorySample history[HISTORY_BUFFER_CAPACITY];
  uint8_t historyHead;
  uint8_t historyCount;

private:
  TemperatureManager* pTemp;
  MAX30102Manager*    pPPG;
  ActuatorManager*    pAct;
  HealthManager*      pHealth;

public:
  WebServerManager()
    : server(80), lastHistorySampleMs(0), historyHead(0), historyCount(0),
      pTemp(nullptr), pPPG(nullptr), pAct(nullptr), pHealth(nullptr)
  {}

  void begin(TemperatureManager* temp, MAX30102Manager* ppg, ActuatorManager* act, HealthManager* health) {
    pTemp = temp;
    pPPG = ppg;
    pAct = act;
    pHealth = health;

    // Register routes
    server.on("/api/health", HTTP_GET, [this]() { handleGetHealth(); });
    server.on("/api/health", HTTP_OPTIONS, [this]() { handleCORS(); });

    server.on("/api/data", HTTP_GET, [this]() { handleGetData(); });
    server.on("/api/data", HTTP_OPTIONS, [this]() { handleCORS(); });

    server.on("/api/history", HTTP_GET, [this]() { handleGetHistory(); });
    server.on("/api/history", HTTP_OPTIONS, [this]() { handleCORS(); });

    server.on("/api/config", HTTP_GET, [this]() { handleGetConfig(); });
    server.on("/api/config", HTTP_OPTIONS, [this]() { handleCORS(); });

    server.on("/api/control", HTTP_POST, [this]() { handlePostControl(); });
    server.on("/api/control", HTTP_OPTIONS, [this]() { handleCORS(); });

    // Catch-all 404 handler
    server.onNotFound([this]() {
      if (server.method() == HTTP_OPTIONS) {
        handleCORS();
      } else {
        setCorsHeaders();
        server.send(404, "application/json", "{\"error\":\"Endpoint not found\",\"device\":\"" + String(AVENZA_DEVICE_ID) + "\"}");
      }
    });

    server.begin();
    Serial.println(F("[HTTP] REST API server started on port 80"));
  }

  void update() {
    server.handleClient();

    // Sample history periodically
    uint32_t now = millis();
    if (now - lastHistorySampleMs >= HISTORY_SAMPLE_INTERVAL_MS) {
      lastHistorySampleMs = now;
      recordHistorySample();
    }
  }

private:
  void setCorsHeaders() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  }

  void handleCORS() {
    setCorsHeaders();
    server.send(204, "text/plain", "");
  }

  void recordHistorySample() {
    if (!pTemp || !pAct) return;

    HistorySample& s = history[historyHead];
    s.uptimeSec = millis() / 1000;
    s.probeTemp = pTemp->chamberTemperature;
    s.probeValid = pTemp->ds18b20Valid;
    s.airTemp = pTemp->dhtTemperature;
    s.airValid = pTemp->dhtValid;
    s.humidity = pTemp->dhtHumidity;
    s.humValid = pTemp->dhtValid;
    s.fan = pAct->fanState;
    s.peltier = pAct->peltierState;

    historyHead = (historyHead + 1) % HISTORY_BUFFER_CAPACITY;
    if (historyCount < HISTORY_BUFFER_CAPACITY) {
      historyCount++;
    }
  }

  /* ------------------------------------------------------------
     1. GET /api/health
     ------------------------------------------------------------ */
  void handleGetHealth() {
    setCorsHeaders();
    String json = "{";
    json += "\"status\":\"ok\",";
    json += "\"device_id\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"device_name\":\"" + String(AVENZA_DEVICE_NAME) + "\",";
    json += "\"firmware_version\":\"" + String(AVENZA_FIRMWARE_VERSION) + "\",";
    json += "\"uptime_ms\":" + String(millis()) + ",";
    json += "\"uptime_sec\":" + String(millis() / 1000) + ",";

    // WiFi Info
    json += "\"wifi\":{";
    json += "\"connected\":" + String((WiFi.status() == WL_CONNECTED) ? "true" : "false") + ",";
    json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
    json += "\"ssid\":\"" + WiFi.SSID() + "\",";
    json += "\"rssi\":" + String(WiFi.RSSI());
    json += "},";

    // Sensors availability
    json += "\"sensors\":{";
    json += "\"dht11\":{\"available\":" + String(pTemp && pTemp->dhtConnected ? "true" : "false") + "},";
    json += "\"ds18b20\":{\"available\":" + String(pTemp && pTemp->ds18b20Connected ? "true" : "false") + "},";
    json += "\"max30102\":{\"available\":" + String(pPPG && pPPG->connected ? "true" : "false") + "}";
    json += "},";

    // Actuators status
    json += "\"actuators\":{";
    json += "\"fan_relay\":{\"gpio\":" + String(RELAY_FAN_PIN) + ",\"active_low\":" + String(RELAY_ACTIVE_LOW ? "true" : "false") + "},";
    json += "\"peltier_relay\":{\"gpio\":" + String(RELAY_PELTIER_PIN) + ",\"active_low\":" + String(RELAY_ACTIVE_LOW ? "true" : "false") + "}";
    json += "},";

    // System metrics
    json += "\"system\":{";
    json += "\"free_heap\":" + String(ESP.getFreeHeap()) + ",";
    json += "\"min_free_heap\":" + String(ESP.getMinFreeHeap());
    json += "}";

    json += "}";
    server.send(200, "application/json", json);
  }

  /* ------------------------------------------------------------
     2. GET /api/data
     ------------------------------------------------------------ */
  void handleGetData() {
    setCorsHeaders();
    String json = "{";
    json += "\"device\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"timestamp\":" + String(millis()) + ",";
    json += "\"uptime_ms\":" + String(millis()) + ",";
    json += "\"uptime_sec\":" + String(millis() / 1000) + ",";
    json += "\"mode\":\"" + String(pAct ? pAct->getModeString() : "AUTO") + "\",";

    // Sensors object
    json += "\"sensors\":{";

    // DS18B20 Probe
    if (pTemp && pTemp->ds18b20Valid && pTemp->chamberTemperature > -50.0f) {
      json += "\"temperature_probe\":" + String(pTemp->chamberTemperature, 2) + ",";
    } else {
      json += "\"temperature_probe\":null,";
    }

    // DHT11 Air Temp & Humidity
    if (pTemp && pTemp->dhtValid && pTemp->dhtTemperature > 0.0f) {
      json += "\"air_temperature\":" + String(pTemp->dhtTemperature, 1) + ",";
      json += "\"humidity\":" + String(pTemp->dhtHumidity, 1) + ",";
    } else {
      json += "\"air_temperature\":null,";
      json += "\"humidity\":null,";
    }

    // Active temperature & selection
    float bestT = pTemp ? pTemp->getBestTemperature() : -999.0f;
    const char* source = pTemp ? pTemp->getBestTemperatureSource() : "none";
    if (bestT > -50.0f) {
      json += "\"active_temperature\":" + String(bestT, 2) + ",";
      json += "\"active_temperature_source\":\"" + String(source) + "\",";
    } else {
      json += "\"active_temperature\":null,";
      json += "\"active_temperature_source\":\"none\",";
    }

    // MAX30102 Optical readings (Strictly raw & labeled uncalibrated/experimental)
    json += "\"max30102\":{";
    json += "\"available\":" + String(pPPG && pPPG->connected ? "true" : "false") + ",";
    json += "\"contact\":" + String(pPPG && pPPG->contactDetected ? "true" : "false") + ",";
    json += "\"raw_ir\":" + String(pPPG ? pPPG->rawIR : 0) + ",";
    json += "\"raw_red\":" + String(pPPG ? pPPG->rawRed : 0) + ",";
    json += "\"experimental_note\":\"Raw photoplethysmogram data only. Not calibrated vital signs.\"";
    json += "}";

    json += "},"; // End sensors

    // Actuators
    json += "\"actuators\":{";
    json += "\"fan\":" + String(pAct && pAct->fanState ? "true" : "false") + ",";
    json += "\"peltier\":" + String(pAct && pAct->peltierState ? "true" : "false") + ",";
    json += "\"fan_reason\":\"" + String(pAct ? pAct->fanReason : "Unknown") + "\",";
    json += "\"peltier_reason\":\"" + String(pAct ? pAct->peltierReason : "Unknown") + "\",";
    json += "\"driver_status\":\"" + String(pAct ? pAct->driverStatus : "IDLE") + "\"";
    json += "},";

    // Safety Interlock Status
    json += "\"safety\":{";
    json += "\"emergency_cutoff_active\":" + String(pAct && pAct->safetyCutoffActive ? "true" : "false") + ",";
    json += "\"heatsink_fan_interlock\":" + String(HEATSINK_FAN_INTERLOCK ? "true" : "false") + ",";
    json += "\"emergency_cutoff_threshold_c\":" + String(EMERGENCY_CUTOFF_TEMP_C, 1) + ",";
    json += "\"failsafe_status\":\"" + String(pAct && pAct->safetyCutoffActive ? "CUTOFF_ENGAGED" : "NOMINAL") + "\"";
    json += "}";

    json += "}";
    server.send(200, "application/json", json);
  }

  /* ------------------------------------------------------------
     3. GET /api/history
     ------------------------------------------------------------ */
  void handleGetHistory() {
    setCorsHeaders();
    String json = "{";
    json += "\"device\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"count\":" + String(historyCount) + ",";
    json += "\"capacity\":" + String(HISTORY_BUFFER_CAPACITY) + ",";
    json += "\"sample_interval_ms\":" + String(HISTORY_SAMPLE_INTERVAL_MS) + ",";
    json += "\"samples\":[";

    // Chronological output: oldest to newest
    uint8_t startIdx = (historyHead + HISTORY_BUFFER_CAPACITY - historyCount) % HISTORY_BUFFER_CAPACITY;
    for (uint8_t i = 0; i < historyCount; i++) {
      uint8_t idx = (startIdx + i) % HISTORY_BUFFER_CAPACITY;
      const HistorySample& s = history[idx];
      if (i > 0) json += ",";
      json += "{";
      json += "\"uptime_sec\":" + String(s.uptimeSec) + ",";
      json += "\"probe_temp\":" + String(s.probeValid ? String(s.probeTemp, 2) : "null") + ",";
      json += "\"air_temp\":" + String(s.airValid ? String(s.airTemp, 1) : "null") + ",";
      json += "\"humidity\":" + String(s.humValid ? String(s.humidity, 1) : "null") + ",";
      json += "\"fan\":" + String(s.fan ? "true" : "false") + ",";
      json += "\"peltier\":" + String(s.peltier ? "true" : "false");
      json += "}";
    }

    json += "]}";
    server.send(200, "application/json", json);
  }

  /* ------------------------------------------------------------
     4. GET /api/config
     ------------------------------------------------------------ */
  void handleGetConfig() {
    setCorsHeaders();
    String json = "{";
    json += "\"device_name\":\"" + String(AVENZA_DEVICE_NAME) + "\",";
    json += "\"device_id\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"firmware_version\":\"" + String(AVENZA_FIRMWARE_VERSION) + "\",";
    json += "\"mode\":\"" + String(pAct ? pAct->getModeString() : "AUTO") + "\",";
    json += "\"target_threshold_c\":" + String(FAN_ON_TEMP_THRESHOLD_C, 1) + ",";
    json += "\"hysteresis_c\":" + String(FAN_ON_TEMP_THRESHOLD_C - FAN_OFF_TEMP_THRESHOLD_C, 2) + ",";
    json += "\"emergency_cutoff_c\":" + String(EMERGENCY_CUTOFF_TEMP_C, 1) + ",";
    json += "\"manual_timeout_sec\":" + String(MANUAL_COMMAND_TIMEOUT_MS / 1000) + ",";
    json += "\"primary_temp_sensor\":\"ds18b20\",";
    json += "\"fallback_temp_sensor\":\"dht11\",";
    json += "\"heatsink_fan_interlock\":" + String(HEATSINK_FAN_INTERLOCK ? "true" : "false") + ",";
    json += "\"relay_active_low\":" + String(RELAY_ACTIVE_LOW ? "true" : "false") + ",";

    // Pinout mapping
    json += "\"pinout\":{";
    json += "\"dht11_gpio\":" + String(DHT_PIN) + ",";
    json += "\"ds18b20_gpio\":" + String(DS18B20_PIN) + ",";
    json += "\"max30102_sda\":" + String(I2C_SDA_PIN) + ",";
    json += "\"max30102_scl\":" + String(I2C_SCL_PIN) + ",";
    json += "\"relay_fan_gpio\":" + String(RELAY_FAN_PIN) + ",";
    json += "\"relay_peltier_gpio\":" + String(RELAY_PELTIER_PIN);
    json += "},";

    json += "\"disclaimer\":\"Educational prototype only. Not for clinical care or diagnostic use.\"";
    json += "}";
    server.send(200, "application/json", json);
  }

  /* ------------------------------------------------------------
     5. POST /api/control
     Body: {"mode":"MANUAL"|"AUTO", "fan":true|false, "peltier":true|false}
     ------------------------------------------------------------ */
  void handlePostControl() {
    setCorsHeaders();

    if (!pAct) {
      server.send(500, "application/json", "{\"error\":\"Actuator subsystem not initialized\"}");
      return;
    }

    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{\"error\":\"Missing JSON request body\"}");
      return;
    }

    String body = server.arg("plain");
    body.trim();

    if (!body.startsWith("{") || !body.endsWith("}")) {
      server.send(400, "application/json", "{\"error\":\"Invalid JSON format. Expected object {...}\"}");
      return;
    }

    // Simple, robust zero-dependency JSON extraction for embedded safety
    String modeCmd = "";
    int fanCmd = -1;     // -1: unspecified, 0: false, 1: true
    int peltierCmd = -1; // -1: unspecified, 0: false, 1: true

    // Parse mode
    int modeIdx = body.indexOf("\"mode\"");
    if (modeIdx >= 0) {
      int colonIdx = body.indexOf(':', modeIdx);
      if (colonIdx >= 0) {
        String sub = body.substring(colonIdx + 1);
        sub.trim();
        if (sub.indexOf("AUTO") >= 0 || sub.indexOf("\"auto\"") >= 0 || sub.indexOf("\"AUTO\"") >= 0) {
          modeCmd = "AUTO";
        } else if (sub.indexOf("MANUAL") >= 0 || sub.indexOf("\"manual\"") >= 0 || sub.indexOf("\"MANUAL\"") >= 0) {
          modeCmd = "MANUAL";
        } else {
          server.send(400, "application/json", "{\"error\":\"Invalid mode specified. Allowed: 'AUTO' or 'MANUAL'\"}");
          return;
        }
      }
    }

    // Parse fan
    int fanIdx = body.indexOf("\"fan\"");
    if (fanIdx >= 0) {
      int colonIdx = body.indexOf(':', fanIdx);
      if (colonIdx >= 0) {
        String sub = body.substring(colonIdx + 1, colonIdx + 10);
        sub.toLowerCase();
        if (sub.indexOf("true") >= 0 || sub.indexOf("1") >= 0 || sub.indexOf("\"on\"") >= 0) {
          fanCmd = 1;
        } else if (sub.indexOf("false") >= 0 || sub.indexOf("0") >= 0 || sub.indexOf("\"off\"") >= 0) {
          fanCmd = 0;
        }
      }
    }

    // Parse peltier
    int pelIdx = body.indexOf("\"peltier\"");
    if (pelIdx >= 0) {
      int colonIdx = body.indexOf(':', pelIdx);
      if (colonIdx >= 0) {
        String sub = body.substring(colonIdx + 1, colonIdx + 10);
        sub.toLowerCase();
        if (sub.indexOf("true") >= 0 || sub.indexOf("1") >= 0 || sub.indexOf("\"on\"") >= 0) {
          peltierCmd = 1;
        } else if (sub.indexOf("false") >= 0 || sub.indexOf("0") >= 0 || sub.indexOf("\"off\"") >= 0) {
          peltierCmd = 0;
        }
      }
    }

    String errorMsg = "";
    bool success = pAct->applyControlCommand(modeCmd, fanCmd, peltierCmd, errorMsg);

    if (!success) {
      String resp = "{\"error\":\"" + errorMsg + "\",\"mode\":\"" + String(pAct->getModeString()) + "\"}";
      server.send(400, "application/json", resp);
      return;
    }

    // Return updated state
    String resp = "{";
    resp += "\"success\":true,";
    resp += "\"mode\":\"" + String(pAct->getModeString()) + "\",";
    resp += "\"fan\":" + String(pAct->fanState ? "true" : "false") + ",";
    resp += "\"peltier\":" + String(pAct->peltierState ? "true" : "false") + ",";
    resp += "\"driver_status\":\"" + String(pAct->driverStatus) + "\"";
    resp += "}";
    server.send(200, "application/json", resp);
  }
};

#endif // WEB_SERVER_MANAGER_H
