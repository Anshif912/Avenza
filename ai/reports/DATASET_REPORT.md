# AVENZA AI DATASET SPECIFICATION & RESEARCH INGESTION REPORT

## 1. Executive Overview & Dataset Portfolio
The **Avenza Intelligent Neonatal Monitoring & AI-Assisted Apnea Event Detection System** relies on a multi-tier dataset architecture designed to evaluate multimodal physiological and optical time series while maintaining scientific validity and clinical boundaries.

```
                    +--------------------------------------------------------+
                    |           AVENZA DATASET ARCHITECTURE PORTFOLIO        |
                    +--------------------------------------------------------+
                                                |
         +--------------------+-----------------+--------------------+--------------------+
         |                    |                                      |                    |
         v                    v                                      v                    v
+-----------------+  +------------------+                   +------------------+  +-------------------+
| PhysioNet PICS  |  | PhysioNet Apnea  |                   | babyPose & GMs   |  | Avenza Multimodal |
| (Preterm Infant |  | -ECG (Adult      |                   | (Infant Movement |  | Synchronized Suite|
| Baseline Signal)|  | Methodology)     |                   | Kinematics)      |  | (12 Subs / 96 Ses)|
+-----------------+  +------------------+                   +------------------+  +-------------------+
```

---

## 2. Dataset Roles & Boundaries

### 2.1 PhysioNet PICS (Preterm Infant Cardio-Respiratory Signals)
- **PhysioNet Database Identifier:** `picsdb`
- **Subjects:** 10 preterm infants monitored in the Neonatal Intensive Care Unit (NICU).
- **Channels Ingested:** Single/Multi-lead ECG (sampling rate: 250/500 Hz), Chest/Abdominal Impedance Respiration (sampling rate: 50/100 Hz).
- **Scientific Role:** Baseline preterm infant physiological representation learning, respiratory sinus arrhythmia (RSA) modeling, and infant respiratory rhythm dynamics.
- **Ethical & Clinical Boundary:** PICS does **NOT** contain gold-standard clinician apnea event labels. It is strictly utilized for self-supervised representation learning and baseline vital stability modeling.

### 2.2 PhysioNet Apnea-ECG Database
- **PhysioNet Database Identifier:** `apnea-ecg`
- **Subjects:** 70 single-lead continuous ECG recordings with minute-by-minute expert apnea annotations ('A' for Apnea, 'N' for Normal).
- **Scientific Role:** Methodological verification of QRS detection, RR-interval extraction, and temporal recurrent neural network architectures.
- **Scientific Boundary:** Adult sleep apnea dataset; physiology (apnea duration, baseline HR 60-80 BPM vs infant 120-160 BPM, desaturation speed) is markedly different from preterm neonates. Used exclusively for ECG algorithm verification prior to neonatal parameter scaling.

### 2.3 babyPose & Infant Movement Kinematics
- **Modality:** 2D/3D joint keypoints (nose, neck, chest midpoint, abdomen midpoint, shoulders, elbows, wrists, hips, knees, ankles).
- **Sampling Rate:** 15 FPS.
- **Scientific Role:** Tracking chest excursion vs spontaneous General Movements (fidgety movements, startle reflexes, limb twitches) to isolate respiratory chest wall expansion from whole-body motion.

### 2.4 Avenza Synchronized Multi-Channel Dataset Suite
- **Structure:** Standardized multi-channel session folder hierarchy.
- **Cohort Size:** 12 preterm infant profiles across 8 distinct clinical scenarios (96 total recording sessions, 10,656 sliding window segments).
- **Gestational Age Range:** 28.0 to 38.5 weeks.
- **Birth Weight Range:** 1,100g to 2,900g.

---

## 3. Synchronized Directory & File Schema
Every Avenza recording session adheres to the following directory layout:

```
data/sessions/sess_infant_sub_01_central_apnea/
|-- metadata.json               # Session header, infant demographics, sampling specs
|-- ppg/
|   `-- ppg.csv                 # 50 Hz MAX30102 RED, IR, HR, SpO2, AC/DC ratios
|-- movement/
|   `-- movement.csv            # 15 Hz Chest displacement, optical flow, pose coordinates
|-- quality/
|   `-- signal_quality.csv      # Real-time PPG SQI, Video SQI, Perfusion Index
`-- events/
    `-- events.json             # Annotated apnea event bounds, severity, confirmation
```

### 3.1 `metadata.json` Schema
```json
{
  "session_id": "sess_infant_sub_01_central_apnea",
  "subject_id": "infant_sub_01",
  "scenario": "central_apnea",
  "gestational_age_weeks": 29.5,
  "birth_weight_grams": 1280,
  "duration_sec": 180,
  "ppg_fs": 50,
  "video_fs": 15,
  "chamber_temp_c": 36.8,
  "created_at": "2026-09-28T01:23:00Z",
  "prototype_disclaimer": "SYNTHETIC / CALIBRATED PROTOTYPE DATASET — NOT CLINICAL DIAGNOSIS"
}
```

### 3.2 `ppg/ppg.csv` Schema
| Column Name | Data Type | Units | Description |
| :--- | :--- | :--- | :--- |
| `timestamp` | `float32` | seconds | Relative session elapsed time |
| `raw_red` | `float32` | ADC counts | MAX30102 raw Red Photoplethysmography count |
| `raw_ir` | `float32` | ADC counts | MAX30102 raw Infrared Photoplethysmography count |
| `filtered_red` | `float32` | normalized | Zero-phase bandpass filtered Red AC pulse |
| `filtered_ir` | `float32` | normalized | Zero-phase bandpass filtered IR AC pulse |
| `heart_rate` | `float32` | BPM | Current instantaneous pulse rate |
| `spo2` | `float32` | % | Arterial oxygen saturation percentage |
| `ac_dc_ratio` | `float32` | ratio | $R = \frac{AC_{red}/DC_{red}}{AC_{ir}/DC_{ir}}$ |

### 3.3 `movement/movement.csv` Schema
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `timestamp` | `float32` | Video frame timestamp |
| `chest_displacement` | `float32` | Normalized chest ROI excursion distance |
| `optical_flow_magnitude` | `float32` | Mean velocity magnitude across chest ROI |
| `pose_chest_y` | `float32` | Normalized vertical coordinate of chest keypoint |
| `movement_energy` | `float32` | Kinetic energy proxy ($\sum v^2$) |

---

## 4. Multi-Scenario Clinical Matrix

The dataset suite covers 8 distinct clinical scenarios:
1. **Normal Quiet Sleep:** Regular breathing (40-50 bpm), stable HR (135-150 bpm), SpO2 96-98%, clean movement waveforms.
2. **Central Apnea:** Complete cessation of chest movement (>10s), progressive SpO2 desaturation down to 82%, severe bradycardia deceleration (>15 BPM drop).
3. **Obstructive Apnea:** Paradoxical hyper-vigorous chest/abdomen effort with collapsing SpO2 (<82%) and HR deceleration due to airway obstruction.
4. **Mixed Apnea:** Initial central pause (>10s) followed by obstructed respiratory efforts before recovery.
5. **Motion Artifact:** Vigorous infant limb flailing, corrupted PPG waveform, degraded SQI, stable true vitals.
6. **Probe Detachment:** MAX30102 disconnected, zero/flatline counts, SQI drops to 0.0, triggers `SENSOR_ERROR`.
7. **Camera Occlusion:** Video covered/blank, video SQI drops to 0.0, zero-weights video channel, relies on PPG.
8. **Hypothermia / Cold Stress:** Chamber temp drops, low peripheral perfusion ($PI < 0.5\%$), shivering micro-tremors.

---

## 5. Subject-Wise Partitioning Strategy
To prevent data leakage across temporal sequences, all cross-validation and evaluation splits are partitioned using **Subject-Wise GroupKFold**:
- **Zero Subject Overlap:** Windows belonging to Subject $X$ never appear in both training and test sets.
- **Prevalence Preservation:** Stratified distribution across all 8 clinical scenarios.
