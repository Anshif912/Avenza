/* ============================================================
   AVENZA — Intelligent Neonatal Monitoring & AI-Assisted Apnea
   ESP32 FIRMWARE · HARDWARE BOOT DIAGNOSTIC & TELEMETRY CONTROLLER
   ============================================================
   Pin Configuration:
   - DHT11:        GPIO 4
   - DS18B20:      GPIO 5 (4.7k Pull-up to 3.3V)
   - I2C SDA:      GPIO 21 (MAX30102 0x57, OLED 0x3C)
   - I2C SCL:      GPIO 22
   - Relay (Fan):  GPIO 18 (Configurable Active-LOW / Active-HIGH)
   - Peltier ENA:  GPIO 25 (PWM 5kHz)
   - Peltier IN1:  GPIO 26
   - Peltier IN2:  GPIO 27
   ============================================================ */

#include <Arduino.h>
#include <Wire.h>

// Explicit Library Includes for Arduino IDE Dependency Discovery
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#include "HardwareConfig.h"
#include "MAX30102Manager.h"
#include "TemperatureManager.h"
#include "ActuatorManager.h"
#include "DisplayManager.h"
#include "HealthManager.h"
#include "CommunicationManager.h"

// System Managers
MAX30102Manager     max30102;
TemperatureManager  tempSensors;
ActuatorManager     actuators;
DisplayManager      display;
HealthManager       health;
CommunicationManager comms;

uint32_t lastAliveMs = 0;

void setup() {
  // 1. Serial Initialization
  Serial.begin(SERIAL_BAUD_RATE);
  delay(500); // Allow UART / USB buffer to stabilize
  Serial.println(F("\n[BOOT] setup start"));
  Serial.println(F("[BOOT] Serial OK"));

  // 2. Hardware I2C Bus Initialization (with bus timeout protection)
  Serial.println(F("[BOOT] I2C init..."));
  Wire.begin(I2C_SDA, I2C_SCL, 100000);
  Wire.setTimeOut(50); // 50ms timeout prevents infinite hang if I2C bus is stuck
  Serial.println(F("[BOOT] I2C OK"));

  // 3. Actuator & Relay Initialization (Safe OFF state)
  Serial.println(F("[BOOT] Relay init..."));
  actuators.begin();
  Serial.println(F("[BOOT] Relay OK (SAFE OFF)"));
  Serial.println(F("[BOOT] Actuator init..."));
  Serial.println(F("[BOOT] Actuator OK (SAFE OFF)"));

  // 4. OLED Display Initialization (Non-fatal, safe address probe)
  Serial.println(F("[BOOT] OLED init..."));
  bool oledOk = display.begin();
  if (oledOk) {
    Serial.println(F("[BOOT] OLED OK"));
  } else {
    Serial.println(F("[BOOT] OLED FAILED"));
  }

  // 5. MAX30102 Optical PPG Initialization (Non-fatal, safe address probe)
  Serial.println(F("[BOOT] MAX30102 init..."));
  bool maxOk = max30102.begin();
  if (maxOk) {
    Serial.println(F("[BOOT] MAX30102 OK"));
  } else {
    Serial.println(F("[BOOT] MAX30102 FAILED"));
  }

  // 6. Temperature Sensors (DHT11 & DS18B20) Initialization (Non-fatal)
  Serial.println(F("[BOOT] DHT11 init..."));
  tempSensors.begin();
  if (tempSensors.dhtConnected) {
    Serial.println(F("[BOOT] DHT11 OK"));
  } else {
    Serial.println(F("[BOOT] DHT11 FAILED"));
  }

  Serial.println(F("[BOOT] DS18B20 init..."));
  if (tempSensors.ds18b20Connected) {
    Serial.println(F("[BOOT] DS18B20 OK"));
  } else {
    Serial.println(F("[BOOT] DS18B20 FAILED"));
  }

  // 7. Diagnostics & Communication Subsystems
  health.begin();
  comms.begin(&actuators);

  Serial.println(F("[BOOT] setup complete\n"));
}

void loop() {
  // Service FreeRTOS watchdog & background scheduler
  yield();

  // 1. High-Rate Optical PPG Acquisition (Continuous FIFO Drain)
  max30102.update();

  // 2. Continuous Serial Command Processing
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      if (line.startsWith("{")) {
        comms.parseAndExecuteCommand(line);
      } else {
        String cmd = line;
        cmd.toUpperCase();
        if (cmd == "HEALTH" || cmd == "STATUS") {
          comms.sendHealthPacket(max30102.connected, tempSensors.dhtConnected, tempSensors.ds18b20Connected);
        }
      }
    }
  }

  // 3. Low-Rate Environmental Sensing (DHT11 & DS18B20 scheduled)
  tempSensors.update();

  // 4. Local OLED Telemetry Render (4 Hz Non-blocking)
  float activeChamberTemp = tempSensors.getBestTemperature();
  display.renderTelemetry(
    max30102.heartRate, max30102.heartRateValid,
    max30102.spo2, max30102.spo2Valid,
    activeChamberTemp, (activeChamberTemp > -50.0f),
    tempSensors.dhtHumidity, tempSensors.dhtValid,
    actuators.fanCommand, actuators.getPeltierCommandString()
  );

  // 5. Non-blocking JSON-lines Telemetry Transmission over Serial (5 Hz / 200 ms)
  comms.update(max30102, tempSensors, actuators, health);

  // 6. Periodic Diagnostic Heartbeat (every 2000 ms)
  uint32_t now = millis();
  if (now - lastAliveMs >= 2000) {
    lastAliveMs = now;
    Serial.println(F("[LOOP] firmware alive"));
  }
}
