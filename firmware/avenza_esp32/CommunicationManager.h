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
    json += "\"product\":\"NeoNattle\",";
    json += "\"device\":\"" + String(NEONATTLE_DEVICE_ID) + "\",";
    json += "\"deviceId\":\"" + String(NEONATTLE_DEVICE_ID) + "\",";
    json += "\"firmware\":\"" + String(NEONATTLE_FIRMWARE_VERSION) + "\",";
    json += "\"uptimeMs\":" + String(millis()) + ",";
    json += "\"sensors\":{";
    json += "\"max30102\":" + String(maxOk ? "true" : "false") + ",";
    json += "\"dht11\":" + String(dhtOk ? "true" : "false") + ",";
    json += "\"ds18b20\":" + String(dsOk ? "true" : "false");
    json += "},";
    json += "\"system\":{";
    json += "\"transport\":\"USB_SERIAL\",";
    json += "\"wifi\":false,";
    json += "\"connection\":\"connected\",";
    json += "\"freeHeap\":" + String(ESP.getFreeHeap()) + ",";
    json += "\"baud\":" + String(SERIAL_BAUD_RATE);
    json += "}";
    json += "}";
    Serial.println(json);
  }

  String buildTelemetryJson(MAX30102Manager& ppg, TemperatureManager& temp, ActuatorManager& act, HealthManager& health) {
    String json = "{";
    json += "\"type\":\"telemetry\",";
    json += "\"product\":\"NeoNattle\",";
    json += "\"device\":\"" + String(NEONATTLE_DEVICE_ID) + "\",";
    json += "\"deviceId\":\"" + String(NEONATTLE_DEVICE_ID) + "\",";
    json += "\"firmware\":\"" + String(NEONATTLE_FIRMWARE_VERSION) + "\",";
    json += "\"timestamp\":" + String(millis()) + ",";
    json += "\"timestampMs\":" + String(millis()) + ",";
    json += "\"uptimeMs\":" + String(health.getUptimeMs()) + ",";

    // --- Flat Telemetry Fields (for legacy compatibility) ---
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

    json += "\"fan\":" + String(act.fanState ? 1 : 0) + ",";
    json += "\"peltier\":" + String(act.peltierState ? 1 : 0) + ",";
    json += "\"red\":" + String(act.ledRed ? 1 : 0) + ",";
    json += "\"yellow\":" + String(act.ledYellow ? 1 : 0) + ",";
    json += "\"green\":" + String(act.ledGreen ? 1 : 0) + ",";
    json += "\"max30102\":" + String(ppg.connected ? (ppg.contactDetected ? 1 : 0) : 0) + ",";
    json += "\"raw_red\":" + String(ppg.rawRed) + ",";
    json += "\"raw_ir\":" + String(ppg.rawIR) + ",";

    // --- Nested Sensors Object ---
    json += "\"sensors\":{";
    
    // DS18B20 Chamber Probe
    json += "\"ds18b20\":{";
    json += "\"connected\":" + String(temp.ds18b20Connected ? "true" : "false") + ",";
    json += "\"unit\":\"C\",";
    if (temp.ds18b20Valid && temp.chamberTemperature > -50.0f) {
      json += "\"value\":" + String(temp.chamberTemperature, 2) + ",";
      json += "\"temperature\":" + String(temp.chamberTemperature, 2) + ",";
      json += "\"valid\":true";
    } else {
      json += "\"value\":null,";
      json += "\"temperature\":null,";
      json += "\"valid\":false";
    }
    json += "},";

    // DHT11 Environmental Sensor
    json += "\"dht11\":{";
    json += "\"connected\":" + String(temp.dhtConnected ? "true" : "false") + ",";
    json += "\"valid\":" + String(temp.dhtValid ? "true" : "false") + ",";
    json += "\"temperature\":{";
    if (temp.dhtValid && temp.dhtTemperature > 0.0f) {
      json += "\"value\":" + String(temp.dhtTemperature, 1) + ",";
      json += "\"unit\":\"C\",";
      json += "\"valid\":true";
    } else {
      json += "\"value\":null,";
      json += "\"unit\":\"C\",";
      json += "\"valid\":false";
    }
    json += "},";
    json += "\"humidity\":{";
    if (temp.dhtValid && temp.dhtHumidity >= 0.0f) {
      json += "\"value\":" + String(temp.dhtHumidity, 1) + ",";
      json += "\"unit\":\"%\",";
      json += "\"valid\":true";
    } else {
      json += "\"value\":null,";
      json += "\"unit\":\"%\",";
      json += "\"valid\":false";
    }
    json += "}";
    json += "},";

    // MAX30102 Optical PPG
    json += "\"max30102\":{";
    json += "\"connected\":" + String(ppg.connected ? "true" : "false") + ",";
    json += "\"contact\":" + String(ppg.contactDetected ? "true" : "false") + ",";
    json += "\"valid\":" + String((ppg.connected && ppg.contactDetected) ? "true" : "false") + ",";
    if (ppg.connected && ppg.rawIR > 0) {
      json += "\"ir\":" + String(ppg.rawIR) + ",";
      json += "\"red\":" + String(ppg.rawRed) + ",";
    } else {
      json += "\"ir\":null,";
      json += "\"red\":null,";
    }
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
    json += "\"invalidReason\":\"" + ppg.invalidReason + "\",";
    json += "\"heartRateReason\":\"" + ppg.heartRateReason + "\",";
    json += "\"spo2Reason\":\"" + ppg.spo2Reason + "\",";
    if (ppg.bpmCandidate > 0) {
      json += "\"bpmCandidate\":" + String(ppg.bpmCandidate, 1) + ",";
    } else {
      json += "\"bpmCandidate\":null,";
    }
    if (ppg.spo2Candidate > 0) {
      json += "\"spo2Candidate\":" + String(ppg.spo2Candidate, 1) + ",";
    } else {
      json += "\"spo2Candidate\":null,";
    }
    json += "\"sampleCount\":" + String(ppg.sampleCount) + ",";
    json += "\"qualityScore\":" + String(ppg.qualityScore, 2) + ",";
    json += "\"signalQuality\":\"" + String(ppg.getQualityLabel()) + "\",";
    json += "\"qualityRating\":\"" + String(ppg.getQualityLabel()) + "\"";
    json += "}";

    json += "},"; // End sensors

    // Actuators Object
    json += "\"actuators\":{";
    json += "\"fan\":{";
    json += "\"state\":" + String(act.fanState ? "true" : "false") + ",";
    json += "\"feedback\":\"" + act.fanReason + "\"";
    json += "},";
    json += "\"thermal\":{";
    json += "\"state\":" + String(act.peltierState ? "true" : "false") + ",";
    json += "\"feedback\":\"" + act.peltierReason + "\"";
    json += "},";
    json += "\"fanCommand\":" + String(act.fanState ? "true" : "false") + ",";
    json += "\"peltierCommand\":\"" + String(act.peltierState ? "HEATING" : "OFF") + "\",";
    json += "\"peltierPwm\":" + String(act.peltierState ? 255 : 0) + ",";
    json += "\"safetyCutoff\":" + String(act.safetyCutoffActive ? "true" : "false") + ",";
    json += "\"manualOverride\":" + String(act.mode == MODE_MANUAL ? "true" : "false") + ",";
    json += "\"driverStatus\":\"" + act.driverStatus + "\"";
    json += "},";

    // System Object
    json += "\"system\":{";
    json += "\"transport\":\"USB_SERIAL\",";
    json += "\"wifi\":false,";
    json += "\"connection\":\"connected\",";
    json += "\"freeHeap\":" + String(health.getFreeHeap()) + ",";
    json += "\"baud\":" + String(SERIAL_BAUD_RATE);
    json += "}";

    json += "}";
    return json;
  }

  void sendCommandAck(const String& cmd, bool accepted, const String& reason, const String& target, bool actualState, const String& mode) {
    String ack = "{\"type\":\"command_ack\",";
    ack += "\"command\":\"" + cmd + "\",";
    ack += "\"accepted\":" + String(accepted ? "true" : "false") + ",";
    if (reason.length() > 0) {
      ack += "\"reason\":\"" + reason + "\",";
    } else {
      ack += "\"reason\":null,";
    }
    ack += "\"target\":\"" + target + "\",";
    ack += "\"actualState\":" + String(actualState ? "true" : "false") + ",";
    ack += "\"mode\":\"" + mode + "\"";
    ack += "}";
    Serial.println(ack);
  }

  void parseAndExecuteCommand(const String& payload) {
    if (!pActuators) return;
    String err;
    String trimmed = payload;
    trimmed.trim();

    // 1. JSON Command Parsing
    if (trimmed.startsWith("{")) {
      // Fan command handling
      if (trimmed.indexOf("\"command\":\"SET_FAN\"") >= 0 || trimmed.indexOf("\"command\": \"SET_FAN\"") >= 0 ||
          trimmed.indexOf("\"target\":\"fan\"") >= 0 || trimmed.indexOf("\"target\": \"fan\"") >= 0) {
        bool turnOn = (trimmed.indexOf("\"state\":true") >= 0 || trimmed.indexOf("\"state\": true") >= 0 ||
                       trimmed.indexOf("\"action\":\"ON\"") >= 0 || trimmed.indexOf("\"action\": \"ON\"") >= 0 ||
                       trimmed.indexOf("\"value\":true") >= 0 || trimmed.indexOf("\"value\": true") >= 0 ||
                       trimmed.indexOf("\"value\":1") >= 0);
        bool success = pActuators->applyControlCommand("MANUAL", turnOn ? 1 : 0, -1, err);
        sendCommandAck("SET_FAN", success, err, "fan", pActuators->fanState, pActuators->getModeString());
        return;
      }

      // Peltier command handling
      if (trimmed.indexOf("\"command\":\"SET_PELTIER\"") >= 0 || trimmed.indexOf("\"command\": \"SET_PELTIER\"") >= 0 ||
          trimmed.indexOf("\"target\":\"peltier\"") >= 0 || trimmed.indexOf("\"target\": \"peltier\"") >= 0) {
        bool turnOff = (trimmed.indexOf("\"state\":false") >= 0 || trimmed.indexOf("\"state\": false") >= 0 ||
                        trimmed.indexOf("\"action\":\"OFF\"") >= 0 || trimmed.indexOf("\"action\": \"OFF\"") >= 0 ||
                        trimmed.indexOf("\"mode\":\"OFF\"") >= 0 || trimmed.indexOf("\"mode\": \"OFF\"") >= 0 ||
                        trimmed.indexOf("\"value\":0") >= 0 || trimmed.indexOf("\"value\":false") >= 0);
        bool success = pActuators->applyControlCommand("MANUAL", -1, turnOff ? 0 : 1, err);
        sendCommandAck("SET_PELTIER", success, err, "peltier", pActuators->peltierState, pActuators->getModeString());
        return;
      }

      // Mode command handling
      if (trimmed.indexOf("\"command\":\"SET_MODE\"") >= 0 || trimmed.indexOf("\"command\": \"SET_MODE\"") >= 0) {
        bool isAuto = (trimmed.indexOf("\"mode\":\"AUTO\"") >= 0 || trimmed.indexOf("\"mode\": \"AUTO\"") >= 0);
        bool success = pActuators->applyControlCommand(isAuto ? "AUTO" : "MANUAL", -1, -1, err);
        sendCommandAck("SET_MODE", success, err, "system", false, pActuators->getModeString());
        return;
      }

      // Target auto handling
      if (trimmed.indexOf("\"target\":\"auto\"") >= 0 || trimmed.indexOf("\"target\": \"auto\"") >= 0) {
        bool success = pActuators->applyControlCommand("AUTO", -1, -1, err);
        sendCommandAck("SET_MODE", success, err, "system", false, pActuators->getModeString());
        return;
      }

      // Reset safety handling
      if (trimmed.indexOf("\"command\":\"RESET_SAFETY\"") >= 0) {
        pActuators->safetyCutoffActive = false;
        pActuators->driverStatus = "READY_OFF";
        sendCommandAck("RESET_SAFETY", true, "", "safety", false, pActuators->getModeString());
        return;
      }
    } else {
      // 2. Plain Text Command Parsing
      String cmd = trimmed;
      cmd.toUpperCase();
      if (cmd == "FAN_ON") {
        bool success = pActuators->applyControlCommand("MANUAL", 1, -1, err);
        sendCommandAck("SET_FAN", success, err, "fan", pActuators->fanState, pActuators->getModeString());
      } else if (cmd == "FAN_OFF") {
        bool success = pActuators->applyControlCommand("MANUAL", 0, -1, err);
        sendCommandAck("SET_FAN", success, err, "fan", pActuators->fanState, pActuators->getModeString());
      } else if (cmd == "PELTIER_ON") {
        bool success = pActuators->applyControlCommand("MANUAL", -1, 1, err);
        sendCommandAck("SET_PELTIER", success, err, "peltier", pActuators->peltierState, pActuators->getModeString());
      } else if (cmd == "PELTIER_OFF") {
        bool success = pActuators->applyControlCommand("MANUAL", -1, 0, err);
        sendCommandAck("SET_PELTIER", success, err, "peltier", pActuators->peltierState, pActuators->getModeString());
      } else if (cmd == "AUTO") {
        bool success = pActuators->applyControlCommand("AUTO", -1, -1, err);
        sendCommandAck("SET_MODE", success, err, "system", false, pActuators->getModeString());
      } else if (cmd == "MANUAL") {
        bool success = pActuators->applyControlCommand("MANUAL", -1, -1, err);
        sendCommandAck("SET_MODE", success, err, "system", false, pActuators->getModeString());
      }
    }
  }
};

#endif // COMMUNICATION_MANAGER_H
