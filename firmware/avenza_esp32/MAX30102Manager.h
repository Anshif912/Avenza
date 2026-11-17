#ifndef MAX30102_MANAGER_H
#define MAX30102_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <MAX30105.h>
#include <heartRate.h>
#include "HardwareConfig.h"

/* ============================================================
   MAX30102 OPTICAL PPG & PULSE OXIMETRY MANAGER
   I2C Address: 0x57 (SDA: 32, SCL: 33)
   Features:
   - High-rate non-blocking FIFO acquisition (drain on every loop)
   - Real-time skin contact detection via IR amplitude threshold
   - Robust beat-by-beat physiological validation (45–220 BPM)
   - Dynamic AC/DC ratio extraction for calibrated SpO2 calculation
   - Complete debug telemetry pipeline: contact, sampleCount,
     bpmCandidate, spo2Candidate, invalidReason, qualityScore
   - Graceful recovery without false timeouts
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

  // Debug & diagnostic fields for real-time hardware telemetry
  String invalidReason;
  String heartRateReason;
  String spo2Reason;
  float bpmCandidate;
  float spo2Candidate;
  uint32_t sampleCount;
  float qualityScore;
  
  uint32_t lastBeatTime;
  uint32_t lastSampleTime;
  uint32_t lastDebugMs;

private:
  MAX30105 particleSensor;

  // Rolling averages for valid beat detection and SpO2
  static const uint8_t RATE_SIZE = 4;
  uint16_t rates[RATE_SIZE];
  float spo2Values[RATE_SIZE];
  uint8_t rateSpot;
  uint8_t spo2Spot;
  uint8_t consecutiveBeats;

  // Cycle min/max/sum accumulators for AC/DC ratio calculation
  uint32_t cycleMinIR;
  uint32_t cycleMaxIR;
  uint32_t cycleMinRed;
  uint32_t cycleMaxRed;
  uint32_t cycleSumIR;
  uint32_t cycleSumRed;
  uint16_t cycleSampleCount;

public:
  MAX30102Manager()
    : connected(false), contactDetected(false), rawIR(0), rawRed(0),
      heartRate(-1.0f), heartRateValid(false), heartRateQuality(0.0f),
      spo2(-1.0f), spo2Valid(false), spo2Quality(0.0f),
      invalidReason("NO_CONTACT"), heartRateReason("NO_CONTACT"), spo2Reason("NO_CONTACT"),
      bpmCandidate(0.0f), spo2Candidate(0.0f),
      sampleCount(0), qualityScore(0.0f),
      lastBeatTime(0), lastSampleTime(0), lastDebugMs(0),
      rateSpot(0), spo2Spot(0), consecutiveBeats(0),
      cycleMinIR(0xFFFFFFFF), cycleMaxIR(0),
      cycleMinRed(0xFFFFFFFF), cycleMaxRed(0),
      cycleSumIR(0), cycleSumRed(0), cycleSampleCount(0) {
    for (uint8_t i = 0; i < RATE_SIZE; i++) {
      rates[i] = 0;
      spo2Values[i] = 0.0f;
    }
  }

  bool begin() {
    // 1. Safe non-blocking probe on I2C address 0x57
    Wire.beginTransmission(MAX30102_I2C_ADDR);
    byte error = Wire.endTransmission();
    if (error != 0) {
      connected = false;
      invalidReason = "I2C_PROBE_FAILED";
      Serial.print(F("[MAX30102 DEBUG] I2C probe failed at 0x57, error code: "));
      Serial.println(error);
      return false;
    }

    if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
      connected = false;
      invalidReason = "SENSOR_BEGIN_FAILED";
      Serial.println(F("[MAX30102 DEBUG] particleSensor.begin() failed"));
      return false;
    }

    // Configure sensor parameters for optimal optical PPG reflection
    byte ledBrightness = 60; // Base configuration
    byte sampleAverage = 4;  // 4-sample moving average inside sensor DSP
    byte ledMode = 2;        // Mode 2 = Red + IR channels active
    int sampleRate = 100;    // 100 Hz sampling rate (25 Hz effective output)
    int pulseWidth = 411;    // 411 us pulse width (18-bit ADC resolution)
    int adcRange = 4096;      // 4096 nA full-scale range

    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
    particleSensor.setPulseAmplitudeRed(MAX30102_LED_PULSE_AMP); // Drive Red LED
    particleSensor.setPulseAmplitudeIR(MAX30102_LED_PULSE_AMP);  // Drive IR LED
    particleSensor.setPulseAmplitudeGreen(0);                   // Green LED off
    particleSensor.enableFIFORollover();                        // Prevent FIFO lockup on buffer wrap

    connected = true;
    invalidReason = "NO_CONTACT";
    Serial.println(F("[MAX30102 DEBUG] Optical sensor initialized successfully."));
    return true;
  }

  void update() {
    if (!connected) {
      contactDetected = false;
      heartRateValid = false;
      spo2Valid = false;
      heartRate = -1.0f;
      spo2 = -1.0f;
      invalidReason = "DISCONNECTED";
      heartRateReason = "DISCONNECTED";
      spo2Reason = "DISCONNECTED";
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
      sampleCount++;
      particleSensor.nextSample(); // Advance FIFO buffer read pointer

      // 2. Skin contact detection with HYSTERESIS
      // To establish contact: IR >= MAX30102_CONTACT_ENTER_THRESHOLD (25,000)
      // To maintain contact: IR >= MAX30102_CONTACT_EXIT_THRESHOLD (15,000)
      if (!contactDetected) {
        if (rawIR >= MAX30102_CONTACT_ENTER_THRESHOLD) {
          contactDetected = true;
          invalidReason = "ACQUIRING_PULSE";
          heartRateReason = "ACQUIRING";
          spo2Reason = "ACQUIRING";
          cycleMinIR = rawIR;
          cycleMaxIR = rawIR;
          cycleMinRed = rawRed;
          cycleMaxRed = rawRed;
          cycleSumIR = rawIR;
          cycleSumRed = rawRed;
          cycleSampleCount = 1;
        } else {
          // No skin contact
          heartRateValid = false;
          spo2Valid = false;
          heartRate = -1.0f;
          spo2 = -1.0f;
          heartRateQuality = 0.0f;
          spo2Quality = 0.0f;
          qualityScore = 0.0f;
          consecutiveBeats = 0;
          lastBeatTime = 0;
          invalidReason = "NO_CONTACT";
          heartRateReason = "NO_CONTACT";
          spo2Reason = "NO_CONTACT";
          continue;
        }
      } else {
        // Contact is currently established - check if lost (below exit threshold)
        if (rawIR < MAX30102_CONTACT_EXIT_THRESHOLD) {
          contactDetected = false;
          heartRateValid = false;
          spo2Valid = false;
          heartRate = -1.0f;
          spo2 = -1.0f;
          heartRateQuality = 0.0f;
          spo2Quality = 0.0f;
          qualityScore = 0.0f;
          consecutiveBeats = 0;
          lastBeatTime = 0;
          invalidReason = "NO_CONTACT";
          heartRateReason = "NO_CONTACT";
          spo2Reason = "NO_CONTACT";
          cycleMinIR = 0xFFFFFFFF;
          cycleMaxIR = 0;
          cycleMinRed = 0xFFFFFFFF;
          cycleMaxRed = 0;
          cycleSumIR = 0;
          cycleSumRed = 0;
          cycleSampleCount = 0;
          continue;
        }
      }

      // Contact is active. Accumulate AC and DC cycle values
      if (rawIR < cycleMinIR) cycleMinIR = rawIR;
      if (rawIR > cycleMaxIR) cycleMaxIR = rawIR;
      if (rawRed < cycleMinRed) cycleMinRed = rawRed;
      if (rawRed > cycleMaxRed) cycleMaxRed = rawRed;
      cycleSumIR += rawIR;
      cycleSumRed += rawRed;
      cycleSampleCount++;

      // 3. Heart Rate Peak Detection with Physiological Validation
      if (checkForBeat(rawIR)) {
        uint32_t now = millis();
        if (lastBeatTime == 0) {
          // First beat detected — anchor timestamp without triggering false timeout
          lastBeatTime = now;
          invalidReason = "ACQUIRING_PULSE";
          heartRateReason = "ACQUIRING";
          spo2Reason = "ACQUIRING";
          cycleMinIR = rawIR;
          cycleMaxIR = rawIR;
          cycleMinRed = rawRed;
          cycleMaxRed = rawRed;
          cycleSumIR = rawIR;
          cycleSumRed = rawRed;
          cycleSampleCount = 1;
        } else {
          uint32_t delta = now - lastBeatTime;
          lastBeatTime = now;

          // Physiological interval: 272ms (220 BPM) to 1333ms (45 BPM)
          if (delta >= 272 && delta <= 1333) {
            bpmCandidate = 60000.0f / (float)delta;
            rates[rateSpot++] = (uint16_t)bpmCandidate;
            rateSpot %= RATE_SIZE;
            if (consecutiveBeats < RATE_SIZE) consecutiveBeats++;

            // Calculate SpO2 using AC/DC ratio of ratios across cardiac cycle
            if (cycleSampleCount >= 4 && cycleMaxIR > cycleMinIR && cycleMaxRed > cycleMinRed) {
              float ir_ac = (float)(cycleMaxIR - cycleMinIR);
              float ir_dc = (float)cycleSumIR / cycleSampleCount;
              float red_ac = (float)(cycleMaxRed - cycleMinRed);
              float red_dc = (float)cycleSumRed / cycleSampleCount;

              if (ir_dc > 8000.0f && red_dc > 6000.0f && ir_ac >= 50.0f && red_ac >= 30.0f) {
                float r = (red_ac / red_dc) / (ir_ac / ir_dc);
                // Standard empirical curve: SpO2 = 104 - 17 * R
                float calcSpo2 = 104.0f - 17.0f * r;
                if (calcSpo2 > 100.0f) calcSpo2 = 99.4f;
                if (calcSpo2 >= 70.0f && calcSpo2 <= 100.0f) {
                  spo2Candidate = calcSpo2;
                  spo2Values[spo2Spot++] = calcSpo2;
                  spo2Spot %= RATE_SIZE;
                }
              }
            }

            // Reset cycle accumulators for next heartbeat
            cycleMinIR = rawIR;
            cycleMaxIR = rawIR;
            cycleMinRed = rawRed;
            cycleMaxRed = rawRed;
            cycleSumIR = rawIR;
            cycleSumRed = rawRed;
            cycleSampleCount = 1;

            if (consecutiveBeats >= 2) {
              uint16_t rateSum = 0;
              uint8_t validRates = 0;
              for (uint8_t x = 0; x < RATE_SIZE; x++) {
                if (rates[x] >= 45 && rates[x] <= 220) {
                  rateSum += rates[x];
                  validRates++;
                }
              }

              if (validRates >= 2) {
                heartRate = (float)rateSum / validRates;
                heartRateValid = (heartRate >= 45.0f && heartRate <= 220.0f);
                heartRateQuality = (consecutiveBeats >= 4) ? 0.94f : 0.72f;
                heartRateReason = "LOCKED";

                // SpO2 averaging
                float spo2Sum = 0;
                uint8_t validSpo2 = 0;
                for (uint8_t y = 0; y < RATE_SIZE; y++) {
                  if (spo2Values[y] >= 70.0f && spo2Values[y] <= 100.0f) {
                    spo2Sum += spo2Values[y];
                    validSpo2++;
                  }
                }

                if (validSpo2 >= 2) {
                  spo2 = spo2Sum / validSpo2;
                  spo2Valid = true;
                  spo2Quality = (consecutiveBeats >= 4) ? 0.92f : 0.70f;
                  spo2Reason = "VALID";
                } else if (spo2Candidate >= 70.0f && spo2Candidate <= 100.0f) {
                  spo2 = spo2Candidate;
                  spo2Valid = true;
                  spo2Quality = 0.65f;
                  spo2Reason = "VALID";
                } else {
                  spo2Valid = false;
                  spo2Reason = "ACQUIRING";
                }

                qualityScore = heartRateQuality;
                invalidReason = "READY_VALID";
              } else {
                invalidReason = "ACQUIRING_PULSE";
                heartRateReason = "ACQUIRING";
                spo2Reason = "ACQUIRING";
              }
            } else {
              invalidReason = "ACQUIRING_PULSE";
              heartRateReason = "ACQUIRING";
              spo2Reason = "ACQUIRING";
            }
          } else {
            // Irregular interval / motion artifact: gently decrement confidence without destroying accumulated history
            if (consecutiveBeats > 1) {
              consecutiveBeats--;
            }
            heartRateReason = "OUTLIER_INTERVAL";
            invalidReason = "INTERVAL_IRREGULAR";
          }
        }
      }
    }

    // Beat timeout (> 3.5 seconds) while contact is active
    if (contactDetected && lastBeatTime > 0 && (millis() - lastBeatTime > 3500)) {
      heartRateValid = false;
      spo2Valid = false;
      consecutiveBeats = 0;
      invalidReason = "TIMEOUT_AWAITING_PULSE";
      heartRateReason = "TIMEOUT";
      spo2Reason = "TIMEOUT";
      heartRateQuality = 0.20f;
      spo2Quality = 0.20f;
      qualityScore = 0.20f;
    }

    // Periodic sensor-level debug logging (every 2000 ms)
    uint32_t now = millis();
    if (now - lastDebugMs >= 2000) {
      lastDebugMs = now;
      Serial.print(F("[MAX30102 DEBUG] contact="));
      Serial.print(contactDetected ? F("true") : F("false"));
      Serial.print(F(" IR="));
      Serial.print(rawIR);
      Serial.print(F(" RED="));
      Serial.print(rawRed);
      Serial.print(F(" HR="));
      if (heartRateValid && heartRate > 0) {
        Serial.print(heartRate, 1);
        Serial.print(F(" ("));
        Serial.print(heartRateReason);
        Serial.print(F(")"));
      } else {
        Serial.print(F("null ["));
        Serial.print(heartRateReason);
        Serial.print(F("]"));
      }
      Serial.print(F(" SpO2="));
      if (spo2Valid && spo2 > 0) {
        Serial.print(spo2, 1);
        Serial.print(F(" ("));
        Serial.print(spo2Reason);
        Serial.print(F(")"));
      } else {
        Serial.print(F("null ["));
        Serial.print(spo2Reason);
        Serial.print(F("]"));
      }
      Serial.print(F(" status="));
      Serial.println(invalidReason);
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
