# AVENZA Safety, Operational Constraints & Prototype Limitations

## 1. Academic & Educational Prototype Disclaimer

> ### **CRITICAL NOTICE — NOT A MEDICAL DEVICE**
> **AVENZA is an academic engineering and educational research prototype designed solely for embedded systems learning, IoT architecture exploration, and experimental multi-sensor telemetry visualization.**
> 
> - **IT IS NOT A MEDICAL DEVICE.**
> - **IT IS NOT CLEARED BY THE FDA, CE, OR ANY REGULATORY BODY FOR CLINICAL USE.**
> - **IT MUST NEVER BE USED FOR MONITORING, DIAGNOSING, TREATING, OR REGULATING ACTUAL NEONATAL INFANTS OR HUMAN PATIENTS.**
> - **DO NOT RELY ON THIS SYSTEM FOR LIFE-CRITICAL DECISIONS.**

---

## 2. Sensor Capabilities & Scope Limitations

### MAX30102 Optical PPG Sensor
1. **Uncalibrated Optical Sensor**:
   - The MAX30102 exposes raw Photoplethysmogram (PPG) infrared and red optical reflection values (ADC counts).
   - In this prototype, derived pulse rate or SpO2 values are **purely experimental demonstration metrics** and have not undergone clinical calibration against arterial blood gas standards or commercial pulse oximeters.
2. **Motion & Perfusion Sensitivity**:
   - Optical readings are heavily degraded by ambient light leaks, motion artifacts, loose skin contact, and low peripheral perfusion.
3. **No Apnea Detection Representation**:
   - The sensor readings must **never** be interpreted as clinical apnea, bradycardia, hypoxia, or respiratory distress detection in any real subject.

### Environmental Temperature Sensors (DS18B20 & DHT11)
1. **Demonstration Threshold (30.0°C)**:
   - The default 30.0°C threshold configured in the firmware and dashboard is an **arbitrary engineering demonstration value** selected so benchtop heat sources can easily trigger the relay.
   - It is **NOT** a clinically recommended incubator setpoint (standard neonatal neutral thermal zones typically range from 36.5°C to 37.5°C with specialized humidity controls).
2. **Sensor Disconnect Safe Behavior**:
   - The firmware is programmed to **never heat or cool based on invalid sensor data**.
   - If the chamber probe reads `-127.0°C` or disconnects, the actuators immediately revert to a safe standby state.

---

## 3. Electrical & Thermal Safety Constraints

### Peltier Thermoelectric Element (TEC1-12706)
1. **Thermal Runaway Risk**:
   - Peltier elements transfer heat from one side to the other. Without adequate heatsink heat extraction, the hot side will rapidly reach temperatures exceeding **100°C within seconds**, which can melt plastic enclosures, ignite nearby flammable materials, and cause severe skin burns.
2. **Mandatory Heatsink Fan Operation**:
   - The firmware enforces an automated software interlock (`HEATSINK_FAN_INTERLOCK = true`) ensuring the circulation/exhaust fan is running whenever the Peltier element is energized.
3. **Hardware-Level Thermal Cutoff Required**:
   - **Never rely exclusively on microcontroller software for thermal protection.** Microcontrollers can hang, experience brownouts, or lock up.
   - For an unattended prototype, an independent **bimetallic thermal cutoff switch (e.g. 50°C Normally Closed)** must be wired in series with the 12V positive power line to physically break the circuit if the heatsink overheats.

### Power Supply & High-Current Wiring
1. **12V 5A Supply Sizing**:
   - The combined load of a TEC1-12706 (~4.2A) and a 12V DC fan (~0.25A) approaches 4.5A – 4.7A.
   - Using undersized wiring (e.g. standard thin 28 AWG jumper wires) for the Peltier power lines will cause the wires to melt.
   - Use minimum **18 AWG copper wire** for the 12V supply, ground, and relay load connections.
2. **Branch Fusing**:
   - Install a **5A fast-acting inline fuse** directly at the 12V power supply output.
   - Install a **1A fuse** on the branch line supplying the circulation fan.
3. **Galvanic Isolation**:
   - 12V high-power lines must remain physically isolated from the ESP32 3.3V logic pins. Use opto-isolated relay boards.

---

## 4. Operational Protocols

1. **Supervised Operation Only**: Always operate the prototype under active human supervision. Never leave the system running unattended while connected to 12V power.
2. **Dry Run Testing**: When testing control commands, verify relay actuation with low-power indicator LEDs or a multimeter continuity tester before connecting the high-current Peltier module.
3. **Emergency Disconnect**: Ensure the 12V power supply cord is easily accessible so it can be unplugged immediately if overheating, smoke, or abnormal behavior occurs.
