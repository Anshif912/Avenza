# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Engineering students, academic researchers, embedded-systems students building and demonstrating the AVENZA prototype. Used in lab/classroom/demo environments where the operator is present and technically proficient.

**Secondary:** Healthcare faculty and judges evaluating the prototype's UI/UX and feasibility as a research instrument.

**Not the user:** Clinical nurses, neonatologists, or any bedside healthcare staff. AVENZA is not deployed in any clinical setting.

## Product Purpose

AVENZA is an intelligent neonatal monitoring and environmental control **prototype**. It monitors physiological signals (heart rate, SpO₂ via MAX30102, chamber temperature via DS18B20/MLX90614, humidity via DHT11) from an ESP32 microcontroller via Web Serial API, fuses them with laptop-webcam–derived chest/abdomen respiratory motion evidence, and runs an on-device multimodal apnea detection algorithm. The software is used for **educational demonstration and prototype evaluation** — not clinical care.

Success = the operator can connect ESP32 hardware, observe real-time synchronized telemetry, review detected event candidates with full evidence trails, and demonstrate the prototype's architecture to an evaluating audience.

## Positioning

The only feature that cannot be truthfully copied: **explainability of the multimodal event decision** — every flagged event shows the exact channel contributions, delta values, signal quality ratings, baseline comparisons, and state machine reasoning that produced it. Not a black box.

## Operating Context

- Desktop/laptop browser (Chrome/Edge required for Web Serial API)
- DEMO mode available — synthetic telemetry with no hardware required
- ESP32 connected via USB→Serial when in LIVE mode
- Operator uses the app while standing next to hardware in a lab or demonstration space
- Presentation audience may be watching alongside

## Capabilities and Constraints

### Hardware confirmed
- ESP32 microcontroller (USB Web Serial, 115200 baud)
- MAX30102 optical pulse oximeter — **uncalibrated; HR and SpO₂ NOT medically validated**
- DS18B20 temperature sensor
- DHT11 temperature + humidity sensor
- MLX90614 IR thermometer (presence assumed, integration status: in firmware)
- Actuator hardware: PWM-controlled actuator stage driver — **exact actuator type NOT CONFIRMED** (referred to as "Thermal Actuator, Type: NOT CONFIRMED")
- Laptop webcam for non-contact chest/abdomen motion estimation

### Algorithm
- Multimodal apnea detection fusing 3 channels (Camera, SpO₂, HR) via prototype weights
- "Prototype Apnea Score" is a prototype signal score — NOT a clinical apnea index
- Weights (Camera 40% / SpO₂ 35% / HR 25%) are prototype defaults — dynamic renormalization is implemented when a channel degrades
- Signal Quality Shield validates sensor integrity before accepting evidence
- State machine: NORMAL → WATCH → SUSPECTED → CONFIRMED

### What does NOT exist
- "Peltier Thermal Engine" — actuator type unconfirmed
- "Prototype Apnea Index" as a 0–100% arc gauge on the Overview — removed
- Hardcoded fusion weights displayed as validated on Overview — removed
- WHO RH target language — removed (not validated)
- Any PHI storage or transmission
- Clinical validation, FDA clearance, or medical regulatory approval of any kind

### Navigation
- Single-page tab-based (no React Router); tab names: landing, login, sessionSetup, dashboard, aiApnea, liveMonitoring, alerts, eventHistory, eventReplay, analytics, thermal, sensorHealth, session, settings

## Brand Commitments

- **Name:** AVENZA (all caps in logo lockup; "Avenza" in prose)
- **Identity:** White + Blue (not dark mode — the dark theme has been superseded)
- **Primary blue:** #2563EB (medical blue)
- **Background:** #F8FAFC
- **Text:** #0F172A
- **The product is called:** "AVENZA Prototype" or "AVENZA Prototype Visualization" — NOT "Medical Incubator Model"
- **Voice:** precise, engineering-honest, calm, non-clinical
- No fabricated clinical claims, no impersonation of medical devices

## Evidence on Hand

- Working React 18 + TypeScript + Vite + TailwindCSS codebase at `c:\Avenza`
- Functional ESP32 serial parsing in `MonitoringContext.tsx`
- Working multimodal apnea detection algorithm in context
- Working recharts waveform visualization (8 channels in LiveMonitoringPage)
- DEMO mode with synthetic data generators
- Initial bundle: 116.5 kB (index chunk) after code splitting

## Product Principles

1. **Honest engineering** — never claim more than the hardware and algorithm can deliver. All experimental/prototype labels are non-negotiable.
2. **Explainability first** — every alert or event decision must show its full evidence chain. Black boxes are banned.
3. **Calm command center** — the primary dashboard must reduce cognitive load, not increase it. Complexity lives in drill-down surfaces.
4. **Hardware-first reality** — design must reflect what the ESP32 actually sends. No fabricated sensor data presented as live.
5. **Prototype clarity** — educational non-clinical status must be clearly visible at all times, especially to an evaluating audience.

## Accessibility & Inclusion

No specific WCAG level mandated; aim for WCAG AA contrast ratios on all text. Prototype used by sighted, technically literate operators in a controlled lab environment.
