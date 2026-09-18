#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "HardwareConfig.h"

/* ============================================================
   LOCAL HARDWARE OLED DISPLAY MANAGER (0.96" SSD1306 128x64)
   - I2C Address: 0x3C (SDA: 21, SCL: 22)
   - Non-fatal initialization with pre-flight address probe
   - 4 Hz Non-blocking telemetry renderer
   ============================================================ */

#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64

class DisplayManager {
public:
  bool connected;
  uint32_t lastRefreshMs;

private:
  Adafruit_SSD1306 display;

public:
  DisplayManager()
    : connected(false), lastRefreshMs(0),
      display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1)
  {}

  bool begin() {
    // 1. Safe non-blocking probe on I2C address 0x3C
    Wire.beginTransmission(OLED_I2C_ADDR);
    byte error = Wire.endTransmission();
    if (error != 0) {
      connected = false;
      return false; // Hardware not responding on 0x3C
    }

    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
      connected = false;
      return false;
    }

    connected = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(16, 12);
    display.println(F("AVENZA DIAGNOSTIC"));
    display.setCursor(16, 28);
    display.println(F("ESP32 HUB ACTIVE"));
    display.setCursor(16, 44);
    display.println(F("Checking sensors..."));
    display.display();
    return true;
  }

  void renderTelemetry(float hr, bool hrValid,
                       float spo2, bool spo2Valid,
                       float temp, bool tempValid,
                       float hum, bool humValid,
                       bool fanOn, const char* peltierState) {
    if (!connected) return;

    uint32_t now = millis();
    if (now - lastRefreshMs < OLED_REFRESH_INTERVAL_MS) return;
    lastRefreshMs = now;

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print(F("AVENZA [DIAGNOSTIC]"));
    display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

    display.setCursor(0, 16);
    display.print(F("HR:  "));
    if (hrValid && hr > 0) {
      display.print((int)hr);
      display.print(F(" BPM"));
    } else {
      display.print(F("-- BPM"));
    }

    display.setCursor(68, 16);
    display.print(F("O2: -- %"));

    display.setCursor(0, 32);
    display.print(F("TMP: "));
    if (tempValid && temp > -50.0f) {
      display.print(temp, 1);
      display.print(F(" C"));
    } else {
      display.print(F("-- C"));
    }

    display.setCursor(68, 32);
    display.print(F("HUM:"));
    if (humValid && hum >= 0) {
      display.print((int)hum);
      display.print(F(" %"));
    } else {
      display.print(F("-- %"));
    }

    display.drawLine(0, 48, 127, 48, SSD1306_WHITE);
    display.setCursor(0, 52);
    display.print(F("ESP32 HARDWARE ALIVE"));
    display.display();
  }
};

#endif // DISPLAY_MANAGER_H
