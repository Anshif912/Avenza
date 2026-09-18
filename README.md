# AVENZA

**Intelligent Neonatal Monitoring & AI-Assisted Apnea Event Detection**

> **AI-ASSISTED APNEA EVENT DETECTION — PROTOTYPE**  
> *Multimodal neonatal monitoring and prototype apnea-event detection.*

---

## Overview

**AVENZA** is an advanced neonatal intensive care monitoring and research prototype designed to assist clinicians in detecting apnea events through real-time multimodal sensor fusion. 

By integrating optical photoplethysmography (PPG), contactless infrared thermometry, closed-loop thermal microclimate regulation, and computer-vision thoracic movement tracking, AVENZA provides continuous, non-invasive surveillance with full algorithmic explainability and data provenance.

---

## Key Capabilities & Architecture

### 1. Multimodal Sensor Fusion
- **MAX30102 Optical PPG**: Real-time pulse oximetry (SpO2) and heart rate (HR) monitoring with signal quality index (SQI) and perfusion validation.
- **MLX90614 Contactless IR**: Continuous skin and incubator micro-environment ambient temperature monitoring.
- **Laptop / Clinical Webcam Thoracic Tracking**: Non-contact optical flow motion vector analysis over region-of-interest (ROI) bounding boxes (Chest Standard, Abdominal Prone, Wide Thoracic).
- **Algorithmic Weighting**: Calibrated 40% Camera Motion Evidence + 35% SpO2 Desaturation + 25% Heart Rate Deceleration.

### 2. Clinical Reference vs. Prototype Detection Layer
- **Clinical Reference Layer**: Evidence-informed normative ranges stratified by gestational maturity (Term, Late Preterm, Preterm, Extremely Low Birth Weight) derived from authoritative clinical guidelines (AAP, WHO, NIH).
- **Prototype Algorithmic Temporal Window**: Evaluates a 10-second rolling multi-signal window (`DETECTION_WINDOW_MS = 10,000ms`) for early awareness, clearly distinguished from the standard >= 20s diagnostic cessation threshold.
- **Single-Channel Safety Interlock**: Requires >= 2 corroborating physiological channels before advancing to `CONFIRMED` apnea state.

### 3. Strict Operating Mode Separation
- **LIVE MODE**: Default operational mode. Displays real incoming sensor data, authentic zero-states, and connection health metrics. **Zero synthetic data leakage** into clinical screens.
- **EXPLICIT DEMO MODE**: 12-phase deterministic cardiorespiratory simulation engine with full event injection (bradycardia, central/obstructive apnea, motion artifacts, thermal overheating, sensor disconnects). Distinct purple HUD badge indicates simulation active.

### 4. Transparent Decision Support & Forensic Replay
- **Why Was This Event Flagged?**: Real-time attribution matrix breaking down exact sensor contributions, baseline deltas, and quality shield validation for every alert.
- **Synchronized Event Replay**: Frame-by-frame scrubbing through 8 physiological telemetry channels across pre-apnea, onset, nadir, and recovery phases.

### 5. Closed-Loop Thermal Microclimate Control
- Embedded PID controller managing Peltier thermoelectric elements (Heating/Cooling) and variable-speed fan aeration with a hardware safety cutoff at 35.0°C.

---

## Project Structure

```
c:/games/NEONATTLE/
├── public/
│   ├── favicon.svg                # AVENZA medical-tech SVG favicon
│   └── index.html                 # App container with AVENZA metadata
├── src/
│   ├── components/
│   │   ├── camera/                # Webcam ROI tracker & motion estimator
│   │   ├── common/                # AvenzaLogo, Header, Sidebar, Modals, Disclaimers
│   │   └── design-system/         # Calibrated HUD cards, gauges, badges, weight bars
│   ├── config/
│   │   └── brand.ts               # Centralized AVENZA brand definition & storage keys
│   ├── context/
│   │   └── MonitoringContext.tsx  # Central state management (LIVE vs DEMO separation)
│   ├── data/
│   │   └── clinicalReferences.ts  # Stratified reference ranges & guideline citations
│   ├── pages/                     # Full clinical workflow pages
│   │   ├── LandingPage.tsx        # Public product overview & entry point
│   │   ├── LoginPage.tsx          # Operator intake authentication
│   │   ├── SessionSetupPage.tsx   # Patient intake & sensor ROI setup
│   │   ├── DashboardPage.tsx      # Command Center HUD & telemetry snapshot
│   │   ├── AIApneaPage.tsx        # Multimodal fusion & evidence attribution
│   │   ├── LiveMonitoringPage.tsx # 8-channel synchronized live waveforms
│   │   ├── AlertsPage.tsx         # Severity triage & acknowledgement log
│   │   ├── EventHistoryPage.tsx   # Historical audit trail & provenance
│   │   ├── EventReplayPage.tsx    # 12-phase synchronized scrubber
│   │   ├── AnalyticsPage.tsx      # Trend analysis, distributions, CSV/PDF export
│   │   ├── ThermalControlPage.tsx # PID thermal microclimate console
│   │   ├── SensorHealthPage.tsx   # Diagnostic matrix (I2C, GPIO, USB ROI)
│   │   ├── BabySessionPage.tsx    # Subject profile & active session lifecycle
│   │   └── SettingsPage.tsx       # Fusion weights & threshold configuration
│   ├── services/
│   │   ├── ApneaFusionEngine.ts   # Core multimodal evidence fusion engine
│   │   ├── CameraService.ts       # Computer-vision optical motion tracker
│   │   └── SyntheticDataEngine.ts # 12-phase simulation & event generator
│   ├── types/
│   │   ├── avenza.ts              # Primary TypeScript definitions
│   │   └── neonattle.ts           # Backward-compatibility alias layer
│   ├── App.tsx                    # Route controller & shell
│   ├── index.css                  # Dark-first medical HUD CSS design tokens
│   └── main.tsx                   # React root entry
└── package.json                   # Project configuration
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation
```bash
# Clone repository
git clone <repository-url>
cd avenza

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```

---

## Clinical & Regulatory Disclaimer

> **PROTOTYPE & DEMO DISCLAIMER**  
> **AVENZA IS AN EDUCATIONAL AND RESEARCH PROTOTYPE.**  
> The Prototype Apnea Score and algorithmic classifications are evidence-derived model outputs and are **NOT A CLINICAL DIAGNOSIS**.  
> Sensor measurements may be affected by patient motion, poor perfusion, anatomical probe placement, and ambient lighting. This system is **not FDA/CE cleared** and is not a substitute for a clinically validated, certified medical monitor or standard neonatal care protocols.

---

## License

MIT License. Copyright © 2026 AVENZA Health Technologies.
