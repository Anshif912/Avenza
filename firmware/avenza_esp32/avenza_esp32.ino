/* ============================================================
   AVENZA — Intelligent Neonatal Monitoring & AI-Assisted Apnea
   ESP32 FIRMWARE · HARDWARE TELEMETRY & THERMAL CONTROLLER
   ============================================================
   Pin Configuration:
   - DHT11:        GPIO 5
   - DS18B20:      GPIO 4 (4.7k Pull-up to 3.3V)
   - I2C SDA:      GPIO 32 (MAX30102 0x57)
   - I2C SCL:      GPIO 33
   - Relay (Fan):  GPIO 18 (Active-LOW: LOW=ON, HIGH=OFF)
   - LED RED:      GPIO 13
   - LED YELLOW:   GPIO 14
   - LED GREEN:    GPIO 23
   - Peltier IN1:  GPIO 25
   - Peltier IN2:  GPIO 26
   - Peltier ENA:  GPIO 27 (PWM Speed / Enable)
   ============================================================ */

#include <Arduino.h>
#include <Wire.h>

// Sensor & Peripheral Libraries
#include <MAX30105.h>
#include <heartRate.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#include "HardwareConfig.h"
#include "MAX30102Manager.h"
#include "TemperatureManager.h"
#include "ActuatorManager.h"
#include "HealthManager.h"
#include "CommunicationManager.h"

// System Managers
MAX30102Manager     max30102;
TemperatureManager  tempSensors;
ActuatorManager     actuators;
HealthManager       health;
CommunicationManager comms;

uint32_t lastAliveMs = 0;

void setup() {
  // 1. Serial Initialization
  Serial.begin(SERIAL_BAUD_RATE);
  delay(300); // Allow UART / USB buffer to stabilize
  Serial.println(F("\n[BOOT] AVENZA ESP32 FIRMWARE INITIALIZING..."));
  Serial.println(F("[BOOT] Serial link: 115200 baud"));

  // 2. Hardware I2C Bus Initialization (with bus timeout protection)
  Serial.println(F("[BOOT] Initializing I2C (SDA=32, SCL=33)..."));
  Wire.begin(I2C_SDA, I2C_SCL, 100000);
  Wire.setTimeOut(50); // 50ms timeout prevents hang if I2C bus is stuck
  Serial.println(F("[BOOT] I2C Bus Ready"));

  // 3. Actuator & Relay & LED Initialization (Safe initial state)
  Serial.println(F("[BOOT] Initializing Relays, LEDs, and Peltier Actuators..."));
  actuators.begin();
  Serial.println(F("[BOOT] Actuators Ready (Safe Standby)"));

  // 4. MAX30102 Optical PPG Initialization (Non-fatal, address 0x57)
  Serial.println(F("[BOOT] Initializing MAX30102 (0x57)..."));
  bool maxOk = max30102.begin();
  if (maxOk) {
    Serial.println(F("[BOOT] MAX30102 Optical Sensor Ready"));
  } else {
    Serial.println(F("[BOOT] MAX30102 Init Failed or Not Detected"));
  }

  // 5. Temperature Sensors (DHT11 @ GPIO5 & DS18B20 @ GPIO4) Initialization
  Serial.println(F("[BOOT] Initializing DHT11 (GPIO 5)..."));
  tempSensors.begin();
  if (tempSensors.dhtConnected) {
    Serial.println(F("[BOOT] DHT11 Ready"));
  } else {
    Serial.println(F("[BOOT] DHT11 Not Detected"));
  }

  Serial.println(F("[BOOT] Initializing DS18B20 (GPIO 4)..."));
  if (tempSensors.ds18b20Connected) {
    Serial.println(F("[BOOT] DS18B20 Chamber Probe Ready"));
  } else {
    Serial.println(F("[BOOT] DS18B20 Probe Not Detected (Check 4.7k Pullup)"));
  }

  // 6. Diagnostics & Communication Subsystems
  health.begin();
  comms.begin(&actuators);

  Serial.println(F("[BOOT] Setup complete. Streaming telemetry.\n"));
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
        } else if (cmd == "FAN_ON") {
          actuators.setFan(true);
        } else if (cmd == "FAN_OFF") {
          actuators.setFan(false);
        } else if (cmd == "AUTO") {
          actuators.manualOverrideActive = false;
        }
      }
    }
  }

  // 3. Environmental Sensing (DHT11 & DS18B20 scheduled reads)
  tempSensors.update();

  // 4. Autonomous Actuator, Hysteresis & Status LED Update
  float activeTemp = tempSensors.getBestTemperature();
  bool tempValid = tempSensors.isAnyTempValid();
  actuators.updateAutonomous(activeTemp, tempValid);

  // 5. Non-blocking JSON Telemetry Transmission over Serial (5 Hz / 200 ms)
  comms.update(max30102, tempSensors, actuators, health);

  // 6. Periodic Diagnostic Heartbeat (every 5000 ms)
  uint32_t now = millis();
  if (now - lastAliveMs >= 5000) {
    lastAliveMs = now;
    Serial.print(F("[HEARTBEAT] FreeHeap="));
    Serial.print(ESP.getFreeHeap());
    Serial.print(F(" Temp="));
    if (tempValid) Serial.print(activeTemp, 2); else Serial.print(F("INVALID"));
    Serial.print(F(" Fan="));
    Serial.print(actuators.fanCommand ? F("ON") : F("OFF"));
    Serial.print(F(" Peltier="));
    Serial.println(actuators.getPeltierCommandString());
  }
}
