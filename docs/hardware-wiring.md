# AVENZA Hardware Wiring, Pin Map & Power Distribution

## 1. Safety & Electrical Warning
> **CAUTION — HIGH CURRENT & THERMAL HAZARD**  
> 1. **Never connect 12V directly to ESP32 GPIOs, 3.3V, or GND pins.** The ESP32 operates at **3.3V logic**; exposing any pin to 12V will permanently destroy the microcontroller.  
> 2. **Peltier modules (TEC1-12706) draw up to 4.5A at 12V.** The hot side heats up within 2 seconds. Operating a Peltier without a securely clamped aluminum heatsink and thermal paste will cause immediate thermal runaway and permanent element destruction.  
> 3. **Verify all wiring with a digital multimeter before applying 12V power.**

---

## 2. Pin Mapping Table

| Peripheral | Component Pin | ESP32 Connection | Operating Voltage | Resistor / Protection Required |
| :--- | :--- | :--- | :--- | :--- |
| **DHT11** | VCC | `3.3V` | 3.3V | — |
| | GND | `GND` | 0V | Common GND |
| | DATA | `GPIO 5` | 3.3V | Internal pull-up enabled (optional 10k external) |
| **DS18B20** | VDD (Red) | `3.3V` | 3.3V | — |
| | GND (Black) | `GND` | 0V | Common GND |
| | DATA (Yellow/White)| `GPIO 4` | 3.3V | **CRITICAL: 4.7kΩ pull-up resistor between DATA and 3.3V** |
| **MAX30102** | VIN | `3.3V` | 3.3V | Power from 3.3V rail only |
| | GND | `GND` | 0V | Common GND |
| | SDA | `GPIO 32` | 3.3V | I2C Data (on-board 4.7k pull-up on breakout) |
| | SCL | `GPIO 33` | 3.3V | I2C Clock (on-board 4.7k pull-up on breakout) |
| **Relay Board** | VCC | `5V` (or Buck 5V) | 5V | Powers optocoupler input stage |
| | GND | `GND` | 0V | Common GND |
| | IN1 (Fan) | `GPIO 18` | 3.3V Logic | Active-LOW trigger |
| | IN2 (Peltier) | `GPIO 25` | 3.3V Logic | Active-LOW trigger |
| **Status LEDs** | Anodes | `GPIO 13, 14, 23`| 3.3V | **220Ω – 330Ω series resistor** on each LED to GND |

---

## 3. Power Distribution Diagram

```
+---------------------------------------------------------------------------------+
|                    12V 5A DC REGULATED POWER SUPPLY                             |
+------------------------+------------------------------------+-------------------+
                         |                                    |
                    [ 5A Main Fuse ]                          |
                         |                                    |
          +--------------+-------------+                      |
          |                            |                      |
          v                            v                      v
+--------------------+       +--------------------+      +------------------------+
| 12V->5V DC-DC BUCK |       | RELAY 1 (FAN)      |      | RELAY 2 (PELTIER)      |
| Step-Down Module   |       | COM -> 12V Rail    |      | COM -> 12V Rail        |
+---------+----------+       | NO  -> [1A Fuse]   |      | NO  -> Peltier (+)     |
          |                  +---------+----------+      +-----------+------------+
        5V Out                         |                             |
          |                            v                             v
          v                     +--------------+              +--------------+
+--------------------+          | 12V DC Fan   |              | TEC1-12706   |
| ESP32 DevKit VIN   |          | Negative (-) |              | Negative (-) |
| (Regulates to 3.3V)|          +-------+------+              +-------+------+
+---------+----------+                  |                             |
          |                             |                             |
     3.3V | GND                         |                             |
          +-----------------------------+-----------------------------+
                                        |
                                        v
                               COMMON 12V/GND RAIL
```

---

## 4. Relay Active-LOW Polarity Verification Procedure

Most standard Arduino 2-channel relay modules use opto-isolated inputs that are **active-LOW**:
- Input `LOW` (0V): Current flows through optocoupler LED -> Relay **ENERGIZES** (click sound, status LED on board lights up, COM connects to NO).
- Input `HIGH` (3.3V/5V): Optocoupler de-energized -> Relay **DE-ENERGIZES** (COM connects to NC).

### How to verify your relay board polarity with a multimeter:
1. Disconnect the 12V power supply completely. Keep only the 5V and GND powering the relay board logic.
2. Connect a jumper from `IN1` to `GND`.
   - If the relay clicks and the board LED illuminates, the board is **active-LOW** (`RELAY_ACTIVE_LOW true` in `HardwareConfig.h`).
3. Connect the jumper from `IN1` to `3.3V`.
   - If the relay turns off, active-LOW operation is confirmed.
4. Set your multimeter to **Continuity mode** (beeper).
   - Place probes across `COM` and `NO` (Normally Open).
   - When energized (`IN1` to `GND`), continuity should beep (0Ω resistance).
   - When de-energized, continuity must be open circuit (OL / infinite resistance).

---

## 5. DS18B20 1-Wire Pull-Up Wiring

The DS18B20 1-Wire protocol requires a pull-up resistor to pull the line high during bus idle:
```
           +3.3V
             |
             +---+
             |   |
            [ 4.7kΩ ]
             |   |
             +---+
             |
ESP32 GPIO 4 ----+---- DS18B20 DATA (Yellow wire)
```
- **Symptom of missing pull-up**: Probe returns `-127.0°C` (`DEVICE_DISCONNECTED_C`).
- **Symptom of swapped VDD/GND**: Probe sensor body becomes extremely hot to the touch; disconnect immediately.

---

## 6. Peltier (TEC1-12706) Mounting & Thermal Sizing

1. **Orientation**:
   - The side with printed text (`TEC1-12706`) is generally the **cold side**.
   - The opposite plain ceramic surface is the **hot side**.
2. **Heatsink Clamping**:
   - Mount the **hot side** to a finned aluminum heatsink with thermal compound (thermal grease).
   - Attach the **12V circulation/exhaust fan** directly against the heatsink fins.
   - **Never operate the Peltier module without the fan running.**
3. **Current Capacity**:
   - At 12V, TEC1-12706 draws ~4.2A steady-state.
   - Combined with a 0.25A fan and 0.2A ESP32/relay logic, total system draw is ~4.7A.
   - A **12V 5A regulated power supply** operates near its 95% capacity limit. Keep manual test cycles short (under 60 seconds) and ensure heatsink stays warm, not boiling.
