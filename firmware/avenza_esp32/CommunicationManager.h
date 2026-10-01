#ifndef COMMUNICATION_MANAGER_H
#define COMMUNICATION_MANAGER_H

#include <Arduino.h>
#include "HardwareConfig.h"
#include "MAX30102Manager.h"
#include "TemperatureManager.h"
#include "ActuatorManager.h"
#include "HealthManager.h"

/* ============================================================
   COMMUNICATION MANAGER (USB SERIAL PROTOCOL)
   - 115,200 baud USB Serial
   - Non-blocking JSON-lines Telemetry Stream
   - Dual-format JSON (Flat + Nested for backend and frontend)
   - Bi-directional Command Parsing
   ============================================================ */

class CommunicationManager {
public:
  uint32_t lastTelemetryMs;
  uint32_t lastHealthMs;
  uint32_t packetsSent;

private:
  ActuatorManager* pActuators;

public:
  CommunicationManager()
    : lastTelemetryMs(0), lastHealthMs(0), packetsSent(0), pActuators(nullptr) {}

  void begin(ActuatorManager* actuators) {
    pActuators = actuators;
    sendHealthPacket(true);
  }

  void update(MAX30102Manager& ppg, TemperatureManager& temp, ActuatorManager& act, HealthManager& health) {
    uint32_t now = millis();

    // Periodic Telemetry Stream (5 Hz / 200 ms)
    if (now - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
      lastTelemetryMs = now;
      String telemetryJson = buildTelemetryJson(ppg, temp, act, health);
      Serial.println(telemetryJson);
      packetsSent++;
    }

    // Periodic Health Heartbeat (5000 ms)
    if (now - lastHealthMs >= HEALTH_INTERVAL_MS) {
      lastHealthMs = now;
      sendHealthPacket(ppg.connected, temp.dhtConnected, temp.ds18b20Connected);
    }
  }

  void sendHealthPacket(bool maxOk = true, bool dhtOk = true, bool dsOk = true) {
    String json = "{";
    json += "\"type\":\"health\",";
    json += "\"device\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"deviceId\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"firmware\":\"" + String(AVENZA_FIRMWARE_VERSION) + "\",";
    json += "\"uptimeMs\":" + String(millis()) + ",";
    json += "\"sensors\":{";
    json += "\"max30102\":" + String(maxOk ? "true" : "false") + ",";
    json += "\"dht11\":" + String(dhtOk ? "true" : "false") + ",";
    json += "\"ds18b20\":" + String(dsOk ? "true" : "false");
    json += "},";
    json += "\"system\":{";
    json += "\"freeHeap\":" + String(ESP.getFreeHeap()) + ",";
    json += "\"baud\":" + String(SERIAL_BAUD_RATE);
    json += "}";
    json += "}";
    Serial.println(json);
  }

  String buildTelemetryJson(MAX30102Manager& ppg, TemperatureManager& temp, ActuatorManager& act, HealthManager& health) {
    String json = "{";
    json += "\"type\":\"telemetry\",";
    json += "\"device\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"deviceId\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"firmware\":\"" + String(AVENZA_FIRMWARE_VERSION) + "\",";
    json += "\"timestamp\":" + String(millis()) + ",";
    json += "\"uptimeMs\":" + String(health.getUptimeMs()) + ",";

    // --- Flat Telemetry Fields ---
    if (temp.ds18b20Valid && temp.chamberTemperature > -50.0f) {
      json += "\"ds18b20_temp\":" + String(temp.chamberTemperature, 2) + ",";
    } else {
      json += "\"ds18b20_temp\":null,";
    }

    if (temp.dhtValid && temp.dhtTemperature > 0.0f) {
      json += "\"dht_temp\":" + String(temp.dhtTemperature, 1) + ",";
      json += "\"humidity\":" + String(temp.dhtHumidity, 1) + ",";
    } else {
      json += "\"dht_temp\":null,";
      json += "\"humidity\":null,";
    }

    json += "\"fan\":" + String(act.fanCommand ? 1 : 0) + ",";
    json += "\"peltier\":" + String(act.peltierCommand == PELTIER_HEATING ? 1 : (act.peltierCommand == PELTIER_COOLING ? 2 : 0)) + ",";
    json += "\"red\":" + String(act.ledRed ? 1 : 0) + ",";
    json += "\"yellow\":" + String(act.ledYellow ? 1 : 0) + ",";
    json += "\"green\":" + String(act.ledGreen ? 1 : 0) + ",";
    json += "\"max30102\":" + String(ppg.connected ? (ppg.contactDetected ? 1 : 0) : 0) + ",";
    json += "\"raw_red\":" + String(ppg.rawRed) + ",";
    json += "\"raw_ir\":" + String(ppg.rawIR) + ",";

    // --- Nested Sensors Object (Frontend & AI pipeline integration) ---
    json += "\"sensors\":{";
    
    // MAX30102
    json += "\"max30102\":{";
    json += "\"connected\":" + String(ppg.connected ? "true" : "false") + ",";
    json += "\"contact\":" + String(ppg.contactDetected ? "true" : "false") + ",";
    if (ppg.heartRateValid && ppg.heartRate > 0) {
      json += "\"heartRate\":" + String(ppg.heartRate, 1) + ",";
      json += "\"heartRateValid\":true,";
      json += "\"heartRateQuality\":" + String(ppg.heartRateQuality, 2) + ",";
    } else {
      json += "\"heartRate\":null,";
      json += "\"heartRateValid\":false,";
      json += "\"heartRateQuality\":0.0,";
    }
    if (ppg.spo2Valid && ppg.spo2 > 0) {
      json += "\"spo2\":" + String(ppg.spo2, 1) + ",";
      json += "\"spo2Valid\":true,";
      json += "\"spo2Quality\":" + String(ppg.spo2Quality, 2) + ",";
    } else {
      json += "\"spo2\":null,";
      json += "\"spo2Valid\":false,";
      json += "\"spo2Quality\":null,";
    }
    json += "\"ir\":" + String(ppg.rawIR) + ",";
    json += "\"red\":" + String(ppg.rawRed) + ",";
    json += "\"qualityRating\":\"" + String(ppg.getQualityLabel()) + "\"";
    json += "},";

    // DHT11
    json += "\"dht11\":{";
    json += "\"connected\":" + String(temp.dhtConnected ? "true" : "false") + ",";
    if (temp.dhtValid && temp.dhtTemperature > 0.0f) {
      json += "\"temperature\":" + String(temp.dhtTemperature, 1) + ",";
      json += "\"humidity\":" + String(temp.dhtHumidity, 1) + ",";
      json += "\"valid\":true";
    } else {
      json += "\"temperature\":null,";
      json += "\"humidity\":null,";
      json += "\"valid\":false";
    }
    json += "},";

    // DS18B20
    json += "\"ds18b20\":{";
    json += "\"connected\":" + String(temp.ds18b20Connected ? "true" : "false") + ",";
    if (temp.ds18b20Valid && temp.chamberTemperature > -50.0f) {
      json += "\"temperature\":" + String(temp.chamberTemperature, 2) + ",";
      json += "\"valid\":true";
    } else {
      json += "\"temperature\":null,";
      json += "\"valid\":false";
    }
    json += "}";

    json += "},"; // End sensors

    // Actuators Object
    json += "\"actuators\":{";
    json += "\"fanCommand\":" + String(act.fanCommand ? "true" : "false") + ",";
    json += "\"peltierCommand\":\"" + String(act.getPeltierCommandString()) + "\",";
    json += "\"peltierPwm\":" + String(act.peltierPwm) + ",";
    json += "\"safetyCutoff\":" + String(act.safetyCutoffActive ? "true" : "false") + ",";
    json += "\"manualOverride\":" + String(act.manualOverrideActive ? "true" : "false") + ",";
    json += "\"driverStatus\":\"" + act.driverStatus + "\"";
    json += "},";

    // System Object
    json += "\"system\":{";
    json += "\"freeHeap\":" + String(health.getFreeHeap()) + ",";
    json += "\"baud\":" + String(SERIAL_BAUD_RATE);
    json += "}";

    json += "}";
    return json;
  }

  void parseAndExecuteCommand(const String& payload) {
    if (!pActuators) return;

    // 1. Fan Command
    if (payload.indexOf("\"target\":\"fan\"") >= 0 || payload.indexOf("\"target\": \"fan\"") >= 0) {
      pActuators->manualOverrideActive = true;
      if (payload.indexOf("\"action\":\"ON\"") >= 0 || payload.indexOf("\"value\":true") >= 0 || payload.indexOf("\"value\": true") >= 0 || payload.indexOf("\"value\":1") >= 0) {
        pActuators->setFan(true);
      } else if (payload.indexOf("\"action\":\"OFF\"") >= 0 || payload.indexOf("\"value\":false") >= 0 || payload.indexOf("\"value\": false") >= 0 || payload.indexOf("\"value\":0") >= 0) {
        pActuators->setFan(false);
      }
    }

    // 2. Peltier Command
    if (payload.indexOf("\"target\":\"peltier\"") >= 0 || payload.indexOf("\"target\": \"peltier\"") >= 0) {
      pActuators->manualOverrideActive = true;
      if (payload.indexOf("\"action\":\"OFF\"") >= 0 || payload.indexOf("\"mode\":\"OFF\"") >= 0 || payload.indexOf("\"value\":0") >= 0) {
        pActuators->setPeltier(PELTIER_OFF, 0);
      } else {
        PeltierMode mode = PELTIER_OFF;
        if (payload.indexOf("HEATING") >= 0 || payload.indexOf("\"value\":1") >= 0) mode = PELTIER_HEATING;
        else if (payload.indexOf("COOLING") >= 0 || payload.indexOf("\"value\":2") >= 0) mode = PELTIER_COOLING;
        
        uint8_t pwm = 180;
        int pwmIdx = payload.indexOf("\"pwm\":");
        if (pwmIdx >= 0) {
          pwm = payload.substring(pwmIdx + 6).toInt();
        }
        pActuators->setPeltier(mode, pwm);
      }
    }

    // 3. Resume Autonomous Mode
    if (payload.indexOf("\"target\":\"auto\"") >= 0 || payload.indexOf("\"target\": \"auto\"") >= 0) {
      pActuators->manualOverrideActive = false;
    }

    // 4. Manual LED Command
    if (payload.indexOf("\"target\":\"led\"") >= 0 || payload.indexOf("\"target\": \"led\"") >= 0) {
      bool r = payload.indexOf("\"red\":1") >= 0 || payload.indexOf("\"red\": 1") >= 0;
      bool y = payload.indexOf("\"yellow\":1") >= 0 || payload.indexOf("\"yellow\": 1") >= 0;
      bool g = payload.indexOf("\"green\":1") >= 0 || payload.indexOf("\"green\": 1") >= 0;
      pActuators->setLeds(r, y, g);
    }
  }
};

#endif // COMMUNICATION_MANAGER_H
