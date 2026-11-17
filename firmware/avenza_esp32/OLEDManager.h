
#ifndef OLED_MANAGER_H
#define OLED_MANAGER_H

#include <Arduino.h>

/*
   NEONATTLE - OLED DISABLED
   OLED hardware and display libraries are not used.
   Empty manager retained for compatibility with main firmware.
*/

class OLEDManager {
public:
  bool connected;
  uint32_t lastRefreshMs;

  OLEDManager()
    : connected(false), lastRefreshMs(0)
  {}

  bool begin() {
    connected = false;
    Serial.println(F("[OLED] Disabled. Running without display."));
    return false;
  }

  void update(
    const String& ipStr,
    float tempVal,
    bool tempValid,
    float humVal,
    bool humValid,
    bool fanOn,
    bool peltierOn,
    const char* modeStr
  ) {
    // OLED disabled: no display updates.
  }
};

#endif // OLED_MANAGER_H