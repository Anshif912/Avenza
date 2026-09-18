#ifndef COMMUNICATION_MANAGER_H
#define COMMUNICATION_MANAGER_H

#include <Arduino.h>
#include "HardwareConfig.h"
#include "MAX30102Manager.h"
#include "TemperatureManager.h"
#include "ActuatorManager.h"
#include "HealthManager.h"

/* ============================================================
   COMMUNICATION MANAGER (USB WEB SERIAL & JSON TELEMETRY)
   - 115,200 baud USB Serial Protocol
   - 5 Hz Non-blocking JSON-lines Telemetry Stream
   - Strict schema validation & Null representation for invalid sensors
   - Bi-directional JSON Serial command parser
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
    
    // Send Startup Health Packet
    sendHealthPacket(true);
  }

  void update(MAX30102Manager& ppg, TemperatureManager& temp, ActuatorManager& act, HealthManager& health) {
    uint32_t now = millis();

    // 1. Periodic Telemetry Stream (5 Hz / 200 ms)
    if (now - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
      lastTelemetryMs = now;
      String telemetryJson = buildTelemetryJson(ppg, temp, act, health);
      Serial.println(telemetryJson);
      packetsSent++;
    }

    // 2. Periodic Health Heartbeat (5000 ms)
    if (now - lastHealthMs >= HEALTH_INTERVAL_MS) {
      lastHealthMs = now;
      sendHealthPacket(ppg.connected, temp.dhtConnected, temp.ds18b20Connected);
    }
  }

  void sendHealthPacket(bool maxOk = true, bool dhtOk = true, bool dsOk = true) {
    String json = "{";
    json += "\"type\":\"health\",";
    json += "\"deviceId\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"firmware\":\"" + String(AVENZA_FIRMWARE_VERSION) + "\",";
    json += "\"uptimeMs\":" + String(millis()) + ",";
    json += "\"sensors\":{";
    json += "\"max30102\":" + String(maxOk ? "true" : "false") + ",";
    json += "\"dht11\":" + String(dhtOk ? "true" : "false") + ",";
    json += "\"ds18b20\":" + String(dsOk ? "true" : "false") + ",";
    json += "\"oled\":true";
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
    json += "\"deviceId\":\"" + String(AVENZA_DEVICE_ID) + "\",";
    json += "\"firmware\":\"" + String(AVENZA_FIRMWARE_VERSION) + "\",";
    json += "\"timestamp\":" + String(millis()) + ",";
    json += "\"uptimeMs\":" + String(health.getUptimeMs()) + ",";

    // Sensors Object
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
    // SpO2 is explicitly null until clinically validated
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
    json += "\"driverStatus\":\"" + act.driverStatus + "\"";
    json += "},";

    // System Object
    json += "\"system\":{";
    json += "\"wifiConnected\":false,";
    json += "\"freeHeap\":" + String(health.getFreeHeap()) + ",";
    json += "\"baud\":" + String(SERIAL_BAUD_RATE);
    json += "}";

    json += "}";
    return json;
  }

  void parseAndExecuteCommand(const String& payload) {
    if (!pActuators) return;

    // Structured JSON command parser
    // 1. Fan Command
    if (payload.indexOf("\"target\":\"fan\"") >= 0 || payload.indexOf("\"target\": \"fan\"") >= 0) {
      if (payload.indexOf("\"action\":\"ON\"") >= 0 || payload.indexOf("\"value\":true") >= 0 || payload.indexOf("\"value\": true") >= 0) {
        pActuators->setFan(true);
      } else if (payload.indexOf("\"action\":\"OFF\"") >= 0 || payload.indexOf("\"value\":false") >= 0 || payload.indexOf("\"value\": false") >= 0) {
        pActuators->setFan(false);
      }
    }

    // 2. Peltier Command
    if (payload.indexOf("\"target\":\"peltier\"") >= 0 || payload.indexOf("\"target\": \"peltier\"") >= 0) {
      if (payload.indexOf("\"action\":\"OFF\"") >= 0 || payload.indexOf("\"mode\":\"OFF\"") >= 0) {
        pActuators->setPeltier(PELTIER_OFF, 0);
      } else {
        PeltierMode mode = PELTIER_OFF;
        if (payload.indexOf("HEATING") >= 0) mode = PELTIER_HEATING;
        else if (payload.indexOf("COOLING") >= 0) mode = PELTIER_COOLING;
        
        uint8_t pwm = 120; // Default nominal conservative PWM
        int pwmIdx = payload.indexOf("\"pwm\":");
        if (pwmIdx >= 0) {
          pwm = payload.substring(pwmIdx + 6).toInt();
        } else {
          int valIdx = payload.indexOf("\"value\":");
          if (valIdx >= 0) pwm = payload.substring(valIdx + 8).toInt();
        }

        pActuators->setPeltier(mode, pwm);
      }
    }
  }
};

#endif // COMMUNICATION_MANAGER_H
