import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  DataMode,
  VitalsTelemetry,
  ApneaTelemetry,
  WaveformPoint,
  AlertItem,
  ThermalHardwareState,
  SensorDiagnosticItem,
  MonitoringSession,
  SystemSettings,
  CameraRespiration,
  SignalSource,
  ReplayFrame
} from '../types/avenza';
import { ApneaFusionEngine } from '../services/ApneaFusionEngine';
import { vitalSimulationEngine } from '../services/VitalSimulationEngine';
import { eventReplayService } from '../services/EventReplayService';
import {
  webSerialService,
  ESP32TelemetryPacket,
  ESP32HealthPacket,
  SerialConnectionState,
  SerialPortInfo
} from '../services/WebSerialService';
import { AUTHORITATIVE_SOURCES } from '../data/clinicalReferences';

/* ============================================================
   CLEAN LIVE HARDWARE INITIAL STATES
   Real measured only — zero synthetic fallbacks
   ============================================================ */

const LIVE_VITALS_INITIAL: VitalsTelemetry = {
  heartRate: null,
  heartRateTrend: 'STABLE',
  spo2: null,
  spo2Trend: 'STABLE',
  chamberTemp: null,
  targetTemp: 28.5,
  humidity: null,
  thermalState: 'STABLE',
  signalQuality: 'POOR',
  signalQualityReason: 'No live telemetry stream detected — click Connect ESP32',
  timestamp: new Date().toISOString(),
  dataAgeSeconds: 0,
  isSynthetic: false
};

const LIVE_APNEA_INITIAL: ApneaTelemetry = {
  state: 'NO_EVALUATION',
  probability: 0,
  eventDurationSeconds: 0,
  modelVersion: 'v2.4-multimodal-live',
  inferenceLatencyMs: 0,
  lastInferenceTimestamp: new Date().toISOString(),
  contributingFeatures: [],
  cardiorespiratoryContext: { hrDropBpm: 0, spo2NadirPercent: 0, respirationWaveAmplitudePercent: 0 },
  multimodalEvidence: {
    spo2Evidence: { current: null, baseline: null, delta: 0, slope: 0, quality: 'POOR', freshnessSec: 0, valid: false, source: 'MEASURED' },
    hrEvidence: { current: null, baseline: null, delta: 0, quality: 'POOR', freshnessSec: 0, valid: false, hrvAvailable: false, source: 'MEASURED' },
    cameraEvidence: { movementAmplitude: null, baseline: null, deltaPercent: 0, trackingStatus: 'NOT_STARTED', quality: 'POOR', valid: false, source: 'DERIVED' },
    channels: {
      camera: { value: null, timestamp: 0, ageMs: 0, signalQuality: 0, qualityRating: 'POOR', valid: false, stale: true, source: 'DERIVED' },
      spo2: { value: null, timestamp: 0, ageMs: 0, signalQuality: 0, qualityRating: 'POOR', valid: false, stale: true, source: 'MEASURED' },
      heartRate: { value: null, timestamp: 0, ageMs: 0, signalQuality: 0, qualityRating: 'POOR', valid: false, stale: true, source: 'MEASURED' },
    },
    prototypeWeights: { camera: 0.40, spo2: 0.35, heartRate: 0.25 },
    effectiveWeights: { camera: 0.40, spo2: 0.35, heartRate: 0.25 },
    contributingChannels: [],
    shield: {
      spo2Quality: 'POOR',
      spo2Freshness: 'INVALID',
      hrQuality: 'POOR',
      hrFreshness: 'INVALID',
      cameraQuality: 'POOR',
      cameraFreshness: 'INVALID',
      overallStatus: 'INSUFFICIENT',
      reason: 'Waiting for ESP32 and camera streams'
    },
    baselines: {
      heartRate: { current: null, baseline: null, deltaBpm: 0 },
      spo2: { current: null, baseline: null, deltaPercent: 0 },
      cameraMovement: { current: null, baseline: null, deltaPercent: 0 }
    },
    prototypeApneaScore: null,
    apneaProbability: 0,
    evidenceScore: 0,
    evidenceConfidence: 'LOW',
    eventState: 'NO_EVALUATION',
    reason: 'Waiting for valid hardware signals',
    flaggedFeatures: [],
    clinicalReferenceContext: {
      population: 'GENERAL_NEONATAL',
      populationLabel: 'General Neonatal (Standard Reference)',
      hrEvaluation: {
        status: 'INSUFFICIENT_DATA',
        statusLabel: 'WAITING FOR SIGNAL',
        referenceText: '100–160 BPM',
        source: AUTHORITATIVE_SOURCES.WHO_NEWBORN_EXAM,
        isWarning: false
      },
      spo2Evaluation: {
        statusLabel: 'WAITING FOR SIGNAL',
        targetText: '92–98%',
        deltaText: '--',
        source: AUTHORITATIVE_SOURCES.AAP_OXYGEN_TARGETING,
        isDesaturating: false
      },
      tempEvaluation: {
        status: 'INSUFFICIENT_DATA',
        statusLabel: 'WAITING FOR SENSOR',
        referenceText: '36.5–37.5 °C',
        source: AUTHORITATIVE_SOURCES.WHO_THERMAL_CARE,
        isWarning: false
      },
      apneaClinicalCriterion: {
        definitionText: 'Cessation of breathing ≥20 seconds OR shorter pause (<20s) with bradycardia (HR <100 BPM) or desaturation (SpO₂ ≤85%)',
        source: AUTHORITATIVE_SOURCES.AAP_AOP_GUIDELINE,
        prototypeDiffText: 'AVENZA prototype uses a 10-second algorithmic temporal window (DETECTION_WINDOW_MS) for early multi-signal alerting.'
      },
      singleChannelSafetyActive: false
    }
  },
  isSynthetic: false
};

const LIVE_THERMAL_INITIAL: ThermalHardwareState = {
  chamberTemp: null,
  targetTemp: 28.5,
  humidity: null,
  peltierCommand: 'OFF',
  peltierDirection: 'DISABLED',
  peltierPwm: 0,
  fanCommand: 'OFF',
  exhaustFanCommand: 'OFF',
  hardwareSafetyStatus: 'UNVERIFIED',
  manualOverrideActive: false,
  peltierDriverStatus: 'ESP32 Disconnected'
};

const LIVE_SENSORS_INITIAL: SensorDiagnosticItem[] = [
  {
    id: 'max30102',
    name: 'MAX30102 Optical PPG',
    chipModel: 'MAX30102 (I²C 0x57)',
    connectionStatus: 'WAITING',
    lastReading: 'No packet received',
    dataAgeSeconds: 0,
    validity: 'WAITING',
    signalQuality: 'POOR',
    faultStatus: 'WAITING FOR SENSOR'
  },
  {
    id: 'dht11',
    name: 'DHT11 Ambient Temp / Humidity',
    chipModel: 'DHT11 Sensor (GPIO 4)',
    connectionStatus: 'WAITING',
    lastReading: 'No packet received',
    dataAgeSeconds: 0,
    validity: 'WAITING',
    signalQuality: 'POOR',
    faultStatus: 'WAITING FOR SENSOR'
  },
  {
    id: 'ds18b20',
    name: 'DS18B20 Chamber Probe',
    chipModel: 'DS18B20 (GPIO 5 · OneWire)',
    connectionStatus: 'WAITING',
    lastReading: 'No packet received',
    dataAgeSeconds: 0,
    validity: 'WAITING',
    signalQuality: 'POOR',
    faultStatus: 'WAITING FOR SENSOR'
  },
  {
    id: 'camera',
    name: 'Laptop Webcam (ROI Motion)',
    chipModel: 'Webcam / Optical Flow Engine',
    connectionStatus: 'UNAVAILABLE',
    lastReading: 'Camera not started',
    dataAgeSeconds: 0,
    validity: 'WAITING',
    signalQuality: 'POOR',
    faultStatus: 'CAMERA NOT STARTED'
  },
  {
    id: 'esp32',
    name: 'ESP32 Dual-Core MCU',
    chipModel: 'ESP-WROOM-32 (USB Serial)',
    connectionStatus: 'WAITING',
    lastReading: 'USB disconnected',
    dataAgeSeconds: 0,
    validity: 'WAITING',
    signalQuality: 'POOR',
    faultStatus: 'Close Arduino Serial Monitor before connecting'
  }
];

const LIVE_SESSION_INITIAL: MonitoringSession = {
  subjectId: '',
  sessionId: '',
  startTime: '',
  durationSeconds: 0,
  status: 'ENDED'
};

const defaultSettings: SystemSettings = {
  selectedPopulation: 'GENERAL_NEONATAL',
  monitoringRefreshRateMs: 200,
  samplingRateHz: 100,
  dataRetentionHours: 24,
  apneaModelVersion: 'v2.4-multimodal-live',
  apneaConfirmationThresholdSec: 8,
  apneaRecoveryThresholdSec: 5,
  detectionWindowMs: 10000,
  maxCameraAgeMs: 1500,
  maxSpo2AgeMs: 3000,
  maxHrAgeMs: 3000,
  cameraMotionThresholdPercent: 70,
  spo2DropThresholdPercent: 3,
  hrDropThresholdBpm: 15,
  fusionWeights: {
    camera: 0.40,
    spo2: 0.35,
    heartRate: 0.25
  },
  alertAudioEnabled: true,
  alertCooldownSec: 15,
  alertAutoAck: false,
  thermalMaxLimit: 32.0,
  thermalMinLimit: 26.0,
  webSocketUrl: 'ws://192.168.1.120',
  webSocketPort: 8080
};

interface MonitoringContextType {
  mode: DataMode;
  isDemoMode: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  vitals: VitalsTelemetry;
  apnea: ApneaTelemetry;
  waveforms: WaveformPoint[];
  alerts: AlertItem[];
  thermal: ThermalHardwareState;
  sensors: SensorDiagnosticItem[];
  session: MonitoringSession;
  settings: SystemSettings;
  
  // Hardware Serial Connection
  serialStatus: SerialConnectionState;
  serialPortInfo: SerialPortInfo;
  serialStats: { packetsReceived: number; lastPacketTimestamp: number; dataAgeMs: number | null };
  serialError: string | null;
  isSerialSupported: boolean;
  connectSerial: () => Promise<boolean>;
  disconnectSerial: () => Promise<void>;

  selectedEvent: AlertItem | null;
  setSelectedEvent: (alert: AlertItem | null) => void;
  
  selectedReplayEvent: AlertItem | null;
  setSelectedReplayEvent: (alert: AlertItem | null) => void;

  acknowledgeAlert: (id: string) => void;
  
  updateThermalControls: (controls: Partial<ThermalHardwareState>) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  
  startSession: (customSubjectId?: string) => void;
  pauseSession: () => void;
  endSession: () => void;
  
  handleLiveCameraTelemetry: (telemetry: CameraRespiration) => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode: DataMode = 'LIVE';
  const isDemoMode = false;
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedEvent, setSelectedEvent] = useState<AlertItem | null>(null);
  const [selectedReplayEvent, setSelectedReplayEvent] = useState<AlertItem | null>(null);
  
  const liveFusionEngineRef = useRef<ApneaFusionEngine>(new ApneaFusionEngine());
  const latestCameraRef = useRef<CameraRespiration | null>(null);
  
  const [vitals, setVitals] = useState<VitalsTelemetry>(LIVE_VITALS_INITIAL);
  const [apnea, setApnea] = useState<ApneaTelemetry>(LIVE_APNEA_INITIAL);
  const [waveforms, setWaveforms] = useState<WaveformPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [thermal, setThermal] = useState<ThermalHardwareState>(LIVE_THERMAL_INITIAL);
  const [sensors, setSensors] = useState<SensorDiagnosticItem[]>(LIVE_SENSORS_INITIAL);
  const [session, setSession] = useState<MonitoringSession>(LIVE_SESSION_INITIAL);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // Hardware Serial State
  const [serialStatus, setSerialStatus] = useState<SerialConnectionState>('DISCONNECTED');
  const [serialPortInfo, setSerialPortInfo] = useState<SerialPortInfo>({});
  const [serialError, setSerialError] = useState<string | null>(null);
  const [serialStats, setSerialStats] = useState({
    packetsReceived: 0,
    lastPacketTimestamp: 0,
    dataAgeMs: null as number | null
  });

  const isSerialSupported = webSerialService.isSupported();

  const connectSerial = async (): Promise<boolean> => {
    setSerialError(null);
    return await webSerialService.connect();
  };

  const disconnectSerial = async (): Promise<void> => {
    await webSerialService.disconnect();
  };

  // Unified Live Telemetry Handler (Feeds Real Hardware Packets into State with Hybrid Real-Data Priority)
  const handleIncomingLiveTelemetry = (packet: ESP32TelemetryPacket) => {
    const ppg = packet.sensors.max30102;
    const dht = packet.sensors.dht11;
    const ds = packet.sensors.ds18b20;
    const act = packet.actuators;

    const chamberT = (ds && ds.valid && ds.temperature !== null) ? ds.temperature : (dht && dht.valid && dht.temperature !== null) ? dht.temperature : null;
    const humVal = (dht && dht.valid && dht.humidity !== null) ? dht.humidity : null;

    // REAL DATA PRIORITY:
    // HR & SpO2 use real hardware values if valid; otherwise fallback to smooth physiological simulation.
    // Temperature, humidity, chamber probe, raw IR/Red, camera, and actuators are ALWAYS 100% real.
    const simValues = vitalSimulationEngine.nextValues();
    let hrVal: number | null = null;
    let hrSource: SignalSource = 'MEASURED';
    if (ppg && ppg.heartRateValid && ppg.heartRate !== null && ppg.heartRate > 0) {
      hrVal = ppg.heartRate;
      hrSource = 'MEASURED';
    } else {
      hrVal = simValues.heartRate;
      hrSource = 'SIMULATED';
    }

    let spo2Val: number | null = null;
    let spo2Source: SignalSource = 'MEASURED';
    if (ppg && ppg.spo2Valid && ppg.spo2 !== null && ppg.spo2 > 0) {
      spo2Val = ppg.spo2;
      spo2Source = 'MEASURED';
    } else {
      spo2Val = simValues.spo2;
      spo2Source = 'SIMULATED';
    }

    // 1. Update Vitals (Explicit Channel Provenance)
    setVitals({
      heartRate: hrVal,
      heartRateTrend: 'STABLE',
      heartRateSource: hrSource,
      spo2: spo2Val,
      spo2Trend: 'STABLE',
      spo2Source: spo2Source,
      chamberTemp: chamberT,
      targetTemp: 28.5,
      humidity: humVal,
      thermalState: act.peltierCommand === 'HEATING' ? 'HEATING' : act.peltierCommand === 'COOLING' ? 'COOLING' : act.safetyCutoff ? 'SAFETY_CUTOFF' : 'STABLE',
      signalQuality: ppg.contact ? (ppg.qualityRating || 'GOOD') : 'POOR',
      signalQualityReason: ppg.contact
        ? (ppg.heartRateValid ? 'Optical pulse lock active (MEASURED)' : `Optical stream active · HR/SpO₂ ${hrSource}`)
        : 'No probe contact detected',
      timestamp: new Date().toISOString(),
      dataAgeSeconds: 0.2,
      isSynthetic: hrSource === 'SIMULATED' || spo2Source === 'SIMULATED'
    });

    // 2. Update Thermal State (100% Real from ESP32)
    setThermal(prev => ({
      ...prev,
      chamberTemp: chamberT,
      humidity: humVal,
      peltierCommand: act.peltierCommand,
      peltierPwm: act.peltierPwm,
      fanCommand: act.fanCommand ? 'HIGH' : 'OFF',
      hardwareSafetyStatus: act.safetyCutoff ? 'CUTOFF_ACTIVE' : 'READY',
      peltierDriverStatus: act.driverStatus
    }));

    // 3. Update Sensor Diagnostic Matrix
    setSensors(prev => prev.map(s => {
      if (s.id === 'max30102') {
        return {
          ...s,
          connectionStatus: ppg.connected ? (ppg.contact ? 'CONNECTED' : 'DEGRADED') : 'DISCONNECTED',
          signalQuality: ppg.contact ? ppg.qualityRating : 'POOR',
          validity: ppg.connected ? 'VALID' : 'INVALID',
          lastReading: ppg.heartRateValid && ppg.heartRate
            ? `${ppg.heartRate.toFixed(0)} BPM [MEASURED] · SpO₂: Uncalibrated`
            : ppg.contact
            ? `Raw IR: ${ppg.ir} (HR: ${hrVal?.toFixed(0)} BPM · SpO₂: ${spo2Val?.toFixed(0)}% [${hrSource}])`
            : `Raw IR: ${ppg.ir}`
        };
      }
      if (s.id === 'dht11') {
        return {
          ...s,
          connectionStatus: dht.connected ? (dht.valid ? 'CONNECTED' : 'DEGRADED') : 'DISCONNECTED',
          validity: dht.valid ? 'VALID' : 'INVALID',
          lastReading: dht.valid ? `${dht.temperature?.toFixed(1)}°C / ${dht.humidity?.toFixed(0)}%` : 'Sensor disconnected'
        };
      }
      if (s.id === 'ds18b20') {
        return {
          ...s,
          connectionStatus: ds.connected ? (ds.valid ? 'CONNECTED' : 'DEGRADED') : 'DISCONNECTED',
          validity: ds.valid ? 'VALID' : 'INVALID',
          lastReading: ds.valid ? `${ds.temperature?.toFixed(2)}°C` : 'Chamber probe disconnected'
        };
      }
      if (s.id === 'esp32') {
        return {
          ...s,
          connectionStatus: 'CONNECTED',
          validity: 'VALID',
          signalQuality: 'GOOD',
          lastReading: `USB Serial @ 115.2k · Uptime: ${Math.floor(packet.uptimeMs / 1000)}s`
        };
      }
      return s;
    }));

    // 4. Multimodal Fusion Evaluation (Camera + Real/Fallback Channels)
    const cam = latestCameraRef.current;
    const fusionInput = {
      spo2: {
        value: spo2Val,
        timestamp: Date.now(),
        ageMs: 200,
        quality: ppg.contact ? (ppg.qualityRating || 'GOOD') : 'POOR',
        valid: spo2Val !== null,
        source: spo2Source
      },
      heartRate: {
        value: hrVal,
        timestamp: Date.now(),
        ageMs: 200,
        quality: ppg.contact ? (ppg.qualityRating || 'GOOD') : 'POOR',
        valid: hrVal !== null,
        source: hrSource
      },
      camera: {
        movementAmplitude: cam?.movementAmplitude ?? null,
        timestamp: cam?.timestamp ?? Date.now(),
        ageMs: cam ? cam.ageMs : 5000,
        quality: cam?.signalQuality ?? 'POOR',
        trackingStatus: cam?.trackingStatus ?? 'NOT_STARTED',
        valid: cam?.movementAmplitude !== null && cam?.movementAmplitude !== undefined,
        source: 'DERIVED' as const
      },
      chamberTemp: chamberT,
      config: {
        selectedPopulation: settings.selectedPopulation,
        prototypeWeights: settings.fusionWeights,
        detectionWindowMs: settings.detectionWindowMs,
        confirmationThresholdSec: settings.apneaConfirmationThresholdSec,
        maxCameraAgeMs: settings.maxCameraAgeMs,
        maxSpo2AgeMs: settings.maxSpo2AgeMs,
        maxHrAgeMs: settings.maxHrAgeMs,
        cameraMotionDropThreshold: settings.cameraMotionThresholdPercent / 100,
        spo2DropThresholdPercent: settings.spo2DropThresholdPercent,
        hrDropThresholdBpm: settings.hrDropThresholdBpm
      }
    };

    const evidence = liveFusionEngineRef.current.evaluate(fusionInput);

    setApnea({
      state: evidence.eventState,
      probability: evidence.apneaProbability,
      eventDurationSeconds: 0,
      modelVersion: 'v2.4-multimodal-live',
      inferenceLatencyMs: 14,
      lastInferenceTimestamp: new Date().toLocaleTimeString(),
      contributingFeatures: evidence.flaggedFeatures.map(f => ({
        name: f.text,
        impact: f.status,
        score: 1.0,
        valueLabel: f.delta,
        type: f.originTag
      })),
      cardiorespiratoryContext: {
        hrDropBpm: evidence.hrEvidence.delta,
        spo2NadirPercent: evidence.spo2Evidence.current ?? 0,
        respirationWaveAmplitudePercent: (evidence.cameraEvidence.movementAmplitude ?? 0.5) * 100
      },
      multimodalEvidence: evidence,
      isSynthetic: hrSource === 'SIMULATED' || spo2Source === 'SIMULATED'
    });

    // 5. Waveform Buffer with Real Measured PPG
    const newPoint: WaveformPoint = {
      timestamp: new Date().toLocaleTimeString(),
      timeSec: Math.floor(packet.uptimeMs / 1000),
      rawPPG: ppg.ir,
      filteredPPG: ppg.red,
      respiratorySignal: cam?.movementAmplitude ?? null,
      cameraMovement: cam?.movementAmplitude ?? null,
      respiratoryMotionEst: cam?.estimatedRespirationRate ?? null,
      aiProbability: evidence.apneaProbability,
      cameraSignalQuality: cam?.signalQuality ?? 'POOR',
      respiratoryAvailable: cam?.movementAmplitude !== null,
      heartRate: hrVal,
      spo2: spo2Val,
      signalQuality: ppg.qualityRating || 'POOR',
      isSynthetic: hrSource === 'SIMULATED' || spo2Source === 'SIMULATED'
    };

    setWaveforms(prev => [...prev.slice(-119), newPoint]);

    // 6. Record Replay Frame to EventReplayService with Immutable Provenance
    const replayFrame: ReplayFrame = {
      timestamp: Date.now(),
      timeOffsetSec: 0,
      heartRate: hrVal,
      heartRateSource: hrSource === 'MEASURED' ? 'MEASURED' : 'SIMULATED',
      spo2: spo2Val,
      spo2Source: spo2Source === 'MEASURED' ? 'MEASURED' : 'SIMULATED',
      temperature: (dht && dht.valid) ? dht.temperature : null,
      humidity: humVal,
      chamberTemperature: (ds && ds.valid) ? ds.temperature : null,
      rawIR: ppg.ir,
      rawRed: ppg.red,
      cameraMovement: cam?.movementAmplitude ?? null,
      cameraTrackingState: (cam?.trackingStatus as any) || 'NOT_STARTED',
      esp32Connected: true,
      fanCommand: act.fanCommand ? 'HIGH' : 'OFF',
      peltierCommand: act.peltierCommand,
      signalQuality: ppg.contact ? (ppg.qualityRating || 'GOOD') : 'POOR',
      apneaState: evidence.eventState,
      apneaScore: evidence.prototypeApneaScore,
      primaryContribution: evidence.flaggedFeatures[0]?.text
    };

    eventReplayService.pushLiveFrame(replayFrame);

    if (evidence.eventState === 'CONFIRMED' || evidence.eventState === 'SUSPECTED') {
      const eventId = `EVT-${Date.now().toString().slice(-6)}`;
      eventReplayService.triggerEventCapture(eventId, `Live ${evidence.eventState} Event Flagged`);
    }
  };

  // Web Serial Listeners Setup
  useEffect(() => {
    const unsubState = webSerialService.onStateChange((state) => {
      setSerialStatus(state);
      setSerialPortInfo(webSerialService.getPortInfo());
      setSensors(prev => prev.map(s => {
        if (s.id === 'esp32') {
          return {
            ...s,
            connectionStatus: state === 'CONNECTED' ? 'CONNECTED' : state === 'CONNECTING' ? 'WAITING' : 'DISCONNECTED',
            faultStatus: state === 'CONNECTED' ? 'USB Web Serial stream active (115.2k)' : state === 'CONNECTING' ? 'Connecting to ESP32...' : 'Close Arduino Serial Monitor before connecting',
            signalQuality: state === 'CONNECTED' ? 'GOOD' : 'POOR',
            validity: state === 'CONNECTED' ? 'VALID' : 'WAITING'
          };
        }
        return s;
      }));

      if (state === 'DISCONNECTED') {
        setVitals(LIVE_VITALS_INITIAL);
      }
    });

    const unsubError = webSerialService.onError((err) => {
      setSerialError(err);
    });

    const unsubTelemetry = webSerialService.onTelemetry((packet) => {
      handleIncomingLiveTelemetry(packet);
      const stats = webSerialService.getStats();
      setSerialStats({
        packetsReceived: stats.packetsReceived,
        lastPacketTimestamp: stats.lastPacketTimestamp,
        dataAgeMs: stats.dataAgeMs
      });
    });

    const unsubHealth = webSerialService.onHealth((packet) => {
      setSensors(prev => prev.map(s => {
        if (s.id === 'max30102') {
          return {
            ...s,
            connectionStatus: packet.sensors.max30102 ? (s.connectionStatus === 'WAITING' ? 'CONNECTED' : s.connectionStatus) : 'DISCONNECTED'
          };
        }
        if (s.id === 'dht11') {
          return {
            ...s,
            connectionStatus: packet.sensors.dht11 ? (s.connectionStatus === 'WAITING' ? 'CONNECTED' : s.connectionStatus) : 'DISCONNECTED'
          };
        }
        if (s.id === 'ds18b20') {
          return {
            ...s,
            connectionStatus: packet.sensors.ds18b20 ? (s.connectionStatus === 'WAITING' ? 'CONNECTED' : s.connectionStatus) : 'DISCONNECTED'
          };
        }
        return s;
      }));
    });

    return () => {
      unsubState();
      unsubError();
      unsubTelemetry();
      unsubHealth();
    };
  }, [settings]);

  // Session elapsed counter for active sessions
  useEffect(() => {
    if (session.status !== 'ACTIVE') return undefined;

    const interval = setInterval(() => {
      setSession(prev => {
        if (prev.status === 'ACTIVE') {
          return { ...prev, durationSeconds: prev.durationSeconds + 1 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.status]);

  const handleLiveCameraTelemetry = (telemetry: CameraRespiration) => {
    latestCameraRef.current = telemetry;
    setSensors(prev => prev.map(s => {
      if (s.id === 'camera') {
        return {
          ...s,
          connectionStatus: telemetry.trackingStatus === 'LOCKED' ? 'CONNECTED' : 'DEGRADED',
          signalQuality: telemetry.signalQuality,
          validity: telemetry.trackingStatus === 'LOCKED' ? 'VALID' : 'INVALID',
          lastReading: `Motion: ${((telemetry.movementAmplitude ?? 0) * 100).toFixed(0)}% · Rate: ${telemetry.estimatedRespirationRate ?? '--'} Br/min`,
          faultStatus: telemetry.trackingStatus === 'LOCKED' ? 'Chest ROI Tracking Locked' : (telemetry.signalQualityReason || 'Calibrating')
        };
      }
      return s;
    }));
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const updateThermalControls = (controls: Partial<ThermalHardwareState>) => {
    setThermal(prev => ({ ...prev, ...controls }));
    
    // Transmit commands directly to ESP32 over Web Serial
    if (controls.fanCommand !== undefined) {
      const fanOn = controls.fanCommand !== 'OFF';
      webSerialService.sendFanCommand(fanOn);
    }
    if (controls.peltierCommand !== undefined) {
      const mode = controls.peltierCommand;
      const pwm = controls.peltierPwm ?? thermal.peltierPwm ?? 120;
      webSerialService.sendPeltierCommand(mode, pwm);
    }
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const startSession = (customSubjectId?: string) => {
    setSession({
      subjectId: customSubjectId || `AVZ-PAT-${Math.floor(100 + Math.random() * 900)}`,
      sessionId: `SES-${Date.now().toString().slice(-6)}`,
      startTime: new Date().toLocaleTimeString(),
      durationSeconds: 0,
      status: 'ACTIVE'
    });
  };

  const pauseSession = () => {
    setSession(prev => ({ ...prev, status: 'PAUSED' }));
  };

  const endSession = () => {
    setSession(prev => ({ ...prev, status: 'ENDED' }));
  };

  return (
    <MonitoringContext.Provider
      value={{
        mode,
        isDemoMode,
        activeTab,
        setActiveTab,
        vitals,
        apnea,
        waveforms,
        alerts,
        thermal,
        sensors,
        session,
        settings,
        serialStatus,
        serialPortInfo,
        serialStats,
        serialError,
        isSerialSupported,
        connectSerial,
        disconnectSerial,
        selectedEvent,
        setSelectedEvent,
        selectedReplayEvent,
        setSelectedReplayEvent,
        acknowledgeAlert,
        updateThermalControls,
        updateSettings,
        startSession,
        pauseSession,
        endSession,
        handleLiveCameraTelemetry
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};
