#ifndef MAX30102_MANAGER_H
#define MAX30102_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <MAX30105.h>
#include <heartRate.h>
#include "HardwareConfig.h"

/* ============================================================
   MAX30102 OPTICAL PPG & PULSE OXIMETRY MANAGER
   I2C Address: 0x57 (SDA: 21, SCL: 22)
   Features:
   - High-rate non-blocking FIFO acquisition (drain on every loop)
   - Prototype skin/contact heuristic (IR >= 50,000)
   - Beat detection with physiological sanity filtering (45–220 BPM)
   - Strict SpO2 honesty: marked null/invalid until clinically calibrated
   - Separate state flags: connected, contactDetected, heartRateValid, reading fresh
   - Periodic non-flooding serial diagnostics
   ============================================================ */

class MAX30102Manager {
public:
  bool connected;
  bool contactDetected;
  uint32_t rawIR;
  uint32_t rawRed;
  
  float heartRate;
  bool heartRateValid;
  float heartRateQuality;
  
  float spo2;
  bool spo2Valid;
  float spo2Quality;
  
  uint32_t lastBeatTime;
  uint32_t lastSampleTime;
  uint32_t lastDebugMs;

private:
  MAX30105 particleSensor;

  // Rolling average for valid beat detection
  static const uint8_t RATE_SIZE = 4;
  uint16_t rates[RATE_SIZE];
  uint8_t rateSpot;
  uint8_t consecutiveBeats;

public:
  MAX30102Manager()
    : connected(false), contactDetected(false), rawIR(0), rawRed(0),
      heartRate(-1.0f), heartRateValid(false), heartRateQuality(0.0f),
      spo2(-1.0f), spo2Valid(false), spo2Quality(0.0f),
      lastBeatTime(0), lastSampleTime(0), lastDebugMs(0), rateSpot(0), consecutiveBeats(0) {
    for (uint8_t i = 0; i < RATE_SIZE; i++) rates[i] = 0;
  }

  bool begin() {
    // 1. Safe non-blocking probe on I2C address 0x57
    Wire.beginTransmission(MAX30102_I2C_ADDR);
    byte error = Wire.endTransmission();
    if (error != 0) {
      connected = false;
      Serial.print(F("[MAX30102 DEBUG] I2C probe failed at 0x57, error code: "));
      Serial.println(error);
      return false;
    }

    if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
      connected = false;
      Serial.println(F("[MAX30102 DEBUG] particleSensor.begin() failed"));
      return false;
    }

    // Configure sensor parameters:
    byte ledBrightness = 60; // 0x3C (~12mA) provides strong optical reflection for PPG
    byte sampleAverage = 4;
    byte ledMode = 2; // Mode 2 = Red + IR
    int sampleRate = 100; // 100 Hz
    int pulseWidth = 411; // 411 us (18-bit resolution)
    int adcRange = 4096; // 4096 nA full-scale

    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
    particleSensor.setPulseAmplitudeRed(0x1F); // Red LED active
    particleSensor.setPulseAmplitudeIR(0x1F);  // IR LED active
    particleSensor.setPulseAmplitudeGreen(0);  // Green LED off
    particleSensor.enableFIFORollover();       // Prevent FIFO stall if buffer fills

    connected = true;
    Serial.println(F("[MAX30102 DEBUG] initialized=true"));
    return true;
  }

  void update() {
    if (!connected) {
      contactDetected = false;
      heartRateValid = false;
      spo2Valid = false;
      heartRate = -1.0f;
      spo2 = -1.0f;
      return;
    }

    // 1. Check sensor FIFO for fresh samples
    particleSensor.check();

    bool sampleAvailable = false;
    while (particleSensor.available()) {
      sampleAvailable = true;
      rawRed = particleSensor.getFIFORed();
      rawIR = particleSensor.getFIFOIR();
      lastSampleTime = millis();
      particleSensor.nextSample(); // Advance FIFO buffer read pointer

      // 2. Contact detection heuristic
      if (rawIR >= MAX30102_FINGER_THRESHOLD) {
        contactDetected = true;

        // 3. Heart Rate Peak Detection with Physiological Validation
        if (checkForBeat(rawIR)) {
          uint32_t now = millis();
          uint32_t delta = now - lastBeatTime;
          lastBeatTime = now;

          // Physiological interval: 272ms (220 BPM) to 1333ms (45 BPM)
          if (delta >= 272 && delta <= 1333) {
            float beatsPerMinute = 60.0f / (delta / 1000.0f);
            rates[rateSpot++] = (uint16_t)beatsPerMinute;
            rateSpot %= RATE_SIZE;
            if (consecutiveBeats < RATE_SIZE) consecutiveBeats++;

            if (consecutiveBeats >= 2) {
              uint16_t rateSum = 0;
              uint8_t validCount = 0;
              for (uint8_t x = 0; x < RATE_SIZE; x++) {
                if (rates[x] >= 45 && rates[x] <= 220) {
                  rateSum += rates[x];
                  validCount++;
                }
              }
              if (validCount >= 2) {
                heartRate = (float)rateSum / validCount;
                heartRateValid = (heartRate >= 45.0f && heartRate <= 220.0f);
                heartRateQuality = (consecutiveBeats >= 4) ? 0.92f : 0.70f;
              }
            }
          } else {
            // Noise artifact / irregular timing
            consecutiveBeats = 0;
          }
        }
      } else {
        contactDetected = false;
        heartRateValid = false;
        heartRate = -1.0f;
        heartRateQuality = 0.0f;
        consecutiveBeats = 0;
      }
    }

    // Contact loss or beat timeout (> 3.5 seconds)
    if (rawIR < MAX30102_FINGER_THRESHOLD) {
      contactDetected = false;
      heartRateValid = false;
      heartRate = -1.0f;
      heartRateQuality = 0.0f;
      consecutiveBeats = 0;
    } else if (millis() - lastBeatTime > 3500) {
      heartRateValid = false;
      heartRateQuality = 0.0f;
      consecutiveBeats = 0;
    }

    // SpO2 Honesty: Marked invalid until calibrated
    spo2 = -1.0f;
    spo2Valid = false;
    spo2Quality = 0.0f;

    // Periodic sensor-level debug logging (every 2000 ms)
    uint32_t now = millis();
    if (now - lastDebugMs >= 2000) {
      lastDebugMs = now;
      Serial.print(F("[MAX30102 DEBUG] initialized="));
      Serial.print(connected ? F("true") : F("false"));
      Serial.print(F(" sampleAvailable="));
      Serial.print(sampleAvailable ? F("true") : F("false"));
      Serial.print(F(" contact="));
      Serial.print(contactDetected ? F("true") : F("false"));
      Serial.print(F(" IR="));
      Serial.print(rawIR);
      Serial.print(F(" RED="));
      Serial.print(rawRed);
      Serial.print(F(" HR="));
      if (heartRateValid && heartRate > 0) {
        Serial.print(heartRate, 1);
      } else {
        Serial.print(F("null"));
      }
      Serial.println();
    }
  }

  const char* getQualityLabel() const {
    if (!connected || !contactDetected) return "POOR";
    if (heartRateValid && heartRateQuality >= 0.80f) return "GOOD";
    if (heartRateValid && heartRateQuality >= 0.50f) return "FAIR";
    if (contactDetected) return "FAIR";
    return "POOR";
  }
};

#endif // MAX30102_MANAGER_H
