/* ============================================================
   NEONATTLE — Educational Neonatal-Environment Monitoring Prototype
   Developed by Avenza
   ESP32 FIRMWARE · USB SERIAL TELEMETRY & CONTROLLER
   ============================================================
   SAFETY NOTICE:
   This software is for an academic, educational IoT prototype only.
   It is NOT a certified medical device and must NEVER be used for
   actual neonatal or clinical patient care.
   ============================================================
   Hardware Pin Map:
   - DHT11 DATA:       GPIO 5
   - DS18B20 DATA:     GPIO 4 (4.7k Pull-up to 3.3V)
   - I2C SDA:          GPIO 32 (MAX30102 Optical PPG 0x57)
   - I2C SCL:          GPIO 33
   - Relay IN1 (Fan):  GPIO 18
   - Relay IN2 (Pel):  GPIO 25
   - Status LEDs:      Red: 13, Yellow: 14, Green: 23

   Transport Mode:
   - USB Serial @ 115,200 baud
   - Line-delimited JSON telemetry stream
   - Zero network / Wi-Fi dependencies in active runtime path
   ============================================================ */

#include <Arduino.h>
#include <Wire.h>

// Sensor & Peripheral Drivers
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

// ============================================================
// SYSTEM SUBSYSTEMS
// ============================================================

MAX30102Manager      max30102;
TemperatureManager   tempSensors;
ActuatorManager      actuators;
HealthManager        health;
CommunicationManager comms;

// ============================================================
// GLOBAL STATE
// ============================================================

uint32_t lastSerialHeartbeatMs = 0;
bool systemReady = false;

// ============================================================
// DIAGNOSTIC I2C BUS SCANNER
// ============================================================

void performI2CScan() {
  Serial.println(F("\n[I2C] Scanning I2C bus (SDA=32, SCL=33)..."));

  byte count = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();
    if (error == 0) {
      Serial.print(F("[I2C] Device detected at address 0x"));
      if (address < 16) Serial.print(F("0"));
      Serial.print(address, HEX);

      if (address == MAX30102_I2C_ADDR) {
        Serial.println(F(" -> MAX30102 Optical PPG Sensor"));
      } else {
        Serial.println(F(" -> Unknown I2C Peripheral"));
      }
      count++;
    }
  }

  if (count == 0) {
    Serial.println(F("[I2C] WARNING: No I2C devices responded! Check pull-ups, SDA (32) and SCL (33) connections."));
  } else {
    Serial.print(F("[I2C] Scan complete. Found "));
    Serial.print(count);
    Serial.println(F(" device(s).\n"));
  }
}

// ============================================================
// SETUP
// ============================================================

void setup() {
  // 1. High-Speed Serial Initialization (115200 baud)
  Serial.begin(SERIAL_BAUD_RATE);
  Serial.setTimeout(50); // Prevent Serial.readStringUntil() from blocking
  delay(200);

  Serial.println();
  Serial.println(F("============================================================"));
  Serial.println(F("  NEONATTLE ESP32 FIRMWARE v1.2.0"));
  Serial.println(F("  Developed by Avenza"));
  Serial.println(F("  USB SERIAL TELEMETRY MODE"));
  Serial.println(F("  Educational Neonatal-Environment Monitoring Prototype"));
  Serial.println(F("============================================================"));

  // 2. Actuators & Relays: Initialize safe de-energized state FIRST
  Serial.println(F("[BOOT] Step 1: Initializing Relays & Safety States (OFF)..."));
  actuators.begin();
  Serial.println(F("[BOOT] Actuators locked in safe standby state."));

  // 3. Hardware I2C Bus Initialization
  Serial.println(F("[BOOT] Step 2: Initializing I2C bus (SDA=32, SCL=33)..."));
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, I2C_BUS_FREQ);
  Wire.setTimeOut(50); // Prevent bus hang on missing ACK

  performI2CScan();

  // 4. MAX30102 Optical PPG Initialization
  Serial.println(F("[BOOT] Step 3: Initializing MAX30102 (0x57)..."));
  bool maxOk = max30102.begin();
  if (maxOk) {
    Serial.println(F("[BOOT] MAX30102 Optical Sensor initialized successfully."));
  } else {
    Serial.println(F("[BOOT] MAX30102 not detected. Raw optical channels will be null."));
  }

  // 5. Environmental Temperature & Humidity Sensors
  Serial.println(F("[BOOT] Step 4: Initializing DHT11 (GPIO 5) & DS18B20 (GPIO 4)..."));
  tempSensors.begin();
  if (tempSensors.dhtConnected) {
    Serial.println(F("[BOOT] DHT11 ambient sensor online."));
  } else {
    Serial.println(F("[BOOT] DHT11 not responding."));
  }

  if (tempSensors.ds18b20Connected) {
    Serial.println(F("[BOOT] DS18B20 chamber probe detected and conversion initiated."));
  } else {
    Serial.println(F("[BOOT] DS18B20 probe not detected. Verify 4.7k pull-up between GPIO 4 and 3.3V."));
  }

  // 6. Health & Telemetry Subsystems
  Serial.println(F("[BOOT] Step 5: Initializing Health & Telemetry Subsystems..."));
  health.begin();
  comms.begin(&actuators);

  Serial.println(F("[USB] Serial telemetry active."));
  Serial.print(F("[USB] Baud rate: "));
  Serial.println(SERIAL_BAUD_RATE);
  Serial.println(F("[USB] Waiting for host..."));

  // 7. System Ready
  systemReady = true;

  Serial.println();
  Serial.println(F("============================================================"));
  Serial.println(F("[BOOT] SYSTEM INITIALIZATION COMPLETE"));
  Serial.println(F("[BOOT] USB SERIAL TELEMETRY MODE ACTIVE"));
  Serial.println(F("============================================================\n"));
}

// ============================================================
// LOOP
// ============================================================

void loop() {
  // Give FreeRTOS background tasks CPU time
  yield();

  // 1. High-Rate MAX30102 FIFO Drain
  max30102.update();

  // 2. Environmental Sensor Sampling
  tempSensors.update();

  // 3. Autonomous Actuator & Hardware Safety Loop
  if (systemReady) {
    float activeTemp = tempSensors.getBestTemperature();
    bool tempValid = tempSensors.isAnyTempValid();
    actuators.updateAutonomous(activeTemp, tempValid);
  }

  // 4. USB Serial Command Handling
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      if (line.equalsIgnoreCase("HEALTH") || line.equalsIgnoreCase("STATUS")) {
        comms.sendHealthPacket(
          max30102.connected,
          tempSensors.dhtConnected,
          tempSensors.ds18b20Connected
        );
      } else {
        comms.parseAndExecuteCommand(line);
      }
    }
  }

  // 5. Non-Blocking Serial Telemetry Stream (1 Hz)
  comms.update(max30102, tempSensors, actuators, health);

  // 6. Periodic Diagnostic Heartbeat (Every 5 seconds)
  uint32_t now = millis();
  if (now - lastSerialHeartbeatMs >= 5000) {
    lastSerialHeartbeatMs = now;
    Serial.print(F("[HEARTBEAT] FreeHeap="));
    Serial.print(ESP.getFreeHeap());
    Serial.print(F(" Temp="));
    if (tempSensors.isAnyTempValid()) {
      Serial.print(tempSensors.getBestTemperature(), 2);
      Serial.print(F("C ("));
      Serial.print(tempSensors.getBestTemperatureSource());
      Serial.print(F(")"));
    } else {
      Serial.print(F("INVALID"));
    }
    Serial.print(F(" Fan="));
    Serial.print(actuators.fanState ? F("ON") : F("OFF"));
    Serial.print(F(" Peltier="));
    Serial.print(actuators.peltierState ? F("ON") : F("OFF"));
    Serial.print(F(" Mode="));
    Serial.print(actuators.getModeString());
    Serial.println(F(" Link=USB_SERIAL"));
  }
}