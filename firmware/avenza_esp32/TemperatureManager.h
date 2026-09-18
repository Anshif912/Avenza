#ifndef TEMPERATURE_MANAGER_H
#define TEMPERATURE_MANAGER_H

#include <Arduino.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "HardwareConfig.h"

/* ============================================================
   TEMPERATURE & HUMIDITY MANAGER (DHT11 & DS18B20)
   - DHT11 (GPIO 4): Ambient Temperature & Humidity
   - DS18B20 (GPIO 5): Incubator Chamber Probe (4.7k pull-up)
   Features:
   - Non-blocking millis() read cycles
   - Separate state flags: connected, valid, fresh
   - Strictly reports null/invalid on read failure (never fakes values)
   - Periodic sensor-level debug logging
   ============================================================ */

class TemperatureManager {
public:
  // DHT11 Readings
  bool dhtConnected;
  float dhtTemperature;
  float dhtHumidity;
  bool dhtValid;
  uint32_t dhtLastReadMs;

  // DS18B20 Chamber Probe Readings
  bool ds18b20Connected;
  float chamberTemperature;
  bool ds18b20Valid;
  uint32_t ds18b20LastReadMs;

private:
  DHT dht;
  OneWire oneWire;
  DallasTemperature dsSensors;

public:
  TemperatureManager()
    : dhtConnected(false), dhtTemperature(-999.0f), dhtHumidity(-999.0f), dhtValid(false), dhtLastReadMs(0),
      ds18b20Connected(false), chamberTemperature(-999.0f), ds18b20Valid(false), ds18b20LastReadMs(0),
      dht(DHT_PIN, DHT11),
      oneWire(DS18B20_PIN),
      dsSensors(&oneWire)
  {}

  bool begin() {
    bool allOk = true;

    // 1. Initialize DHT11
    dht.begin();
    dhtConnected = true;
    dhtValid = false;
    dhtLastReadMs = millis(); // Offset so first read occurs after warmup

    // 2. Initialize DS18B20 (Non-blocking conversion mode)
    dsSensors.begin();
    dsSensors.setWaitForConversion(false); // Asynchronous non-blocking conversion
    uint8_t count = dsSensors.getDeviceCount();
    
    Serial.print(F("[DS18B20 DEBUG] probe device count="));
    Serial.println(count);

    if (count > 0) {
      ds18b20Connected = true;
      ds18b20Valid = false;
      dsSensors.requestTemperatures(); // Kick off first conversion
      ds18b20LastReadMs = millis();
    } else {
      ds18b20Connected = false;
      ds18b20Valid = false;
      allOk = false;
    }

    return allOk;
  }

  void update() {
    uint32_t now = millis();

    // 1. Update DHT11 (2000ms sampling interval)
    if (now - dhtLastReadMs >= DHT_SAMPLE_INTERVAL_MS) {
      dhtLastReadMs = now;
      Serial.println(F("[DHT11 DEBUG] read attempted"));

      float t = dht.readTemperature();
      float h = dht.readHumidity();

      if (!isnan(t) && !isnan(h) && t >= 0.0f && t <= 70.0f && h >= 0.0f && h <= 100.0f) {
        dhtTemperature = t;
        dhtHumidity = h;
        dhtValid = true;
        dhtConnected = true;
      } else {
        dhtValid = false;
        dhtTemperature = -999.0f;
        dhtHumidity = -999.0f;
      }

      Serial.print(F("[DHT11 DEBUG] temperature="));
      if (dhtValid) Serial.print(dhtTemperature, 1); else Serial.print(F("null"));
      Serial.print(F(" humidity="));
      if (dhtValid) Serial.print(dhtHumidity, 1); else Serial.print(F("null"));
      Serial.print(F(" valid="));
      Serial.println(dhtValid ? F("true") : F("false"));
    }

    // 2. Update DS18B20 (1000ms sampling interval)
    if (now - ds18b20LastReadMs >= DS18B20_SAMPLE_INTERVAL_MS) {
      ds18b20LastReadMs = now;

      // If probe was not detected at boot, retry scan
      if (!ds18b20Connected) {
        uint8_t count = dsSensors.getDeviceCount();
        if (count > 0) {
          ds18b20Connected = true;
          dsSensors.requestTemperatures();
          return;
        }
      }

      float rawTemp = dsSensors.getTempCByIndex(0);

      // Check conversion validity:
      // -127.0°C = DEVICE_DISCONNECTED_C
      // 85.0°C = Power-on reset register state (before conversion finishes)
      bool valid = (rawTemp > -50.0f && rawTemp < 84.0f && rawTemp != -127.0f);

      if (valid) {
        chamberTemperature = rawTemp;
        ds18b20Valid = true;
        ds18b20Connected = true;
      } else {
        chamberTemperature = -999.0f;
        ds18b20Valid = false;
      }

      // Request next conversion asynchronously
      Serial.println(F("[DS18B20 DEBUG] conversion requested"));
      dsSensors.requestTemperatures();

      Serial.print(F("[DS18B20 DEBUG] raw temperature="));
      if (rawTemp == -127.0f) {
        Serial.print(F("DISCONNECTED (-127C)"));
      } else if (rawTemp == 85.0f) {
        Serial.print(F("RESET_DEFAULT (85C)"));
      } else {
        Serial.print(rawTemp, 2);
      }
      Serial.print(F(" valid="));
      Serial.println(ds18b20Valid ? F("true") : F("false"));
    }
  }

  float getBestTemperature() const {
    if (ds18b20Valid) return chamberTemperature;
    if (dhtValid) return dhtTemperature;
    return -999.0f;
  }
};

#endif // TEMPERATURE_MANAGER_H
