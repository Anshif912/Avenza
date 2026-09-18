import {
  ClinicalPopulation,
  ClinicalParameter,
  AuthoritativeSource,
  ClinicalReferenceItem,
  PopulationProfile,
  ReferenceEvaluationStatus
} from '../data/clinicalReferences';

export type {
  ClinicalPopulation,
  ClinicalParameter,
  AuthoritativeSource,
  ClinicalReferenceItem,
  PopulationProfile,
  ReferenceEvaluationStatus
};

export type SignalQuality = 'GOOD' | 'FAIR' | 'POOR';
export type SignalValidity = 'VALID' | 'INVALID' | 'STALE';
export type CameraTrackingState = 'LOCKED' | 'CALIBRATING' | 'LOST' | 'INVALID' | 'NOT_STARTED';
export type AIApneaState = 'NORMAL' | 'WATCH' | 'SUSPECTED' | 'CONFIRMED' | 'RECOVERED' | 'INVALID_SIGNAL' | 'NO_EVALUATION';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'SENSOR' | 'RECOVERY';
export type DataMode = 'LIVE' | 'DEMO';
export type DataSourceMode = 'LIVE' | 'DEMO' | 'REAL_HARDWARE';
export type SignalSource = 'MEASURED' | 'DERIVED' | 'MODEL_OUTPUT' | 'SYNTHETIC_DEMO' | 'SIMULATED';
export type ReplayChannelSource = 'MEASURED' | 'SIMULATED';

export interface FusionWeights {
  camera: number;
  spo2: number;
  heartRate: number;
}

export interface SignalChannel<T> {
  value: T;
  timestamp: number;
  ageMs: number;
  signalQuality: number; // 0..1 numerical score
  qualityRating: SignalQuality;
  valid: boolean;
  stale: boolean;
  source: SignalSource;
}

export interface SignalQualityShield {
  spo2Quality: SignalQuality;
  spo2Freshness: 'FRESH' | 'STALE' | 'INVALID';
  hrQuality: SignalQuality;
  hrFreshness: 'FRESH' | 'STALE' | 'INVALID';
  cameraQuality: SignalQuality;
  cameraFreshness: 'FRESH' | 'STALE' | 'INVALID';
  overallStatus: 'OPTIMAL' | 'DEGRADED' | 'INSUFFICIENT' | 'INVALID';
  reason?: string;
}

export interface RollingBaselines {
  heartRate: { current: number | null; baseline: number | null; deltaBpm: number };
  spo2: { current: number | null; baseline: number | null; deltaPercent: number };
  cameraMovement: { current: number | null; baseline: number | null; deltaPercent: number };
}

export interface CameraRespiration {
  movementAmplitude: number | null; // 0 to 1, or null if ROI lost/invalid/not started
  movementBaseline: number;
  movementDeltaPercent: number;
  movementQuality: SignalQuality;
  movementPeriodicity: number;
  estimatedRespirationRate: number | null; // Breaths/min [DERIVED]
  trackingStatus: CameraTrackingState;
  signalQuality: SignalQuality;
  signalQualityReason?: string;
  timestamp: number;
  ageMs: number;
  source: SignalSource;
  isSynthetic: boolean;
}

export interface MultimodalApneaEvidence {
  spo2Evidence: {
    current: number | null;
    baseline: number | null;
    delta: number;
    slope: number;
    quality: SignalQuality;
    freshnessSec: number;
    valid: boolean;
    source: SignalSource;
  };
  hrEvidence: {
    current: number | null;
    baseline: number | null;
    delta: number;
    quality: SignalQuality;
    freshnessSec: number;
    valid: boolean;
    hrvAvailable: boolean;
    hrvMs?: number;
    source: SignalSource;
  };
  cameraEvidence: {
    movementAmplitude: number | null;
    baseline: number | null;
    deltaPercent: number;
    trackingStatus: CameraTrackingState;
    quality: SignalQuality;
    valid: boolean;
    source: SignalSource;
  };
  channels: {
    camera: SignalChannel<number | null>;
    spo2: SignalChannel<number | null>;
    heartRate: SignalChannel<number | null>;
  };
  prototypeWeights: FusionWeights;
  effectiveWeights: FusionWeights;
  contributingChannels: Array<'CAMERA' | 'SPO2' | 'HR'>;
  shield: SignalQualityShield;
  baselines: RollingBaselines;
  prototypeApneaScore: number | null; // 0 to 100 or null if no evaluation
  apneaProbability: number; // 0 to 100 (for backward compatibility)
  evidenceScore: number; // 0 to 1
  evidenceConfidence: 'HIGH' | 'MODERATE' | 'LOW';
  eventState: AIApneaState;
  reason: string;
  flaggedFeatures: Array<{
    source: 'CAMERA' | 'SPO2' | 'HR' | 'SHIELD';
    text: string;
    delta: string;
    originTag: SignalSource;
    status: 'CONTRIBUTING' | 'SUPPORTING' | 'UNAVAILABLE';
  }>;
  clinicalReferenceContext: {
    population: ClinicalPopulation;
    populationLabel: string;
    hrEvaluation: {
      status: ReferenceEvaluationStatus;
      statusLabel: string;
      referenceText: string;
      source: AuthoritativeSource;
      isWarning: boolean;
    };
    spo2Evaluation: {
      statusLabel: string;
      targetText: string;
      deltaText: string;
      source: AuthoritativeSource;
      isDesaturating: boolean;
    };
    tempEvaluation: {
      status: ReferenceEvaluationStatus;
      statusLabel: string;
      referenceText: string;
      source: AuthoritativeSource;
      isWarning: boolean;
    };
    apneaClinicalCriterion: {
      definitionText: string;
      source: AuthoritativeSource;
      prototypeDiffText: string;
    };
    singleChannelSafetyActive: boolean;
  };
}

export interface VitalsTelemetry {
  heartRate: number | null;
  heartRateTrend: 'UP' | 'DOWN' | 'STABLE';
  heartRateSource?: SignalSource;
  spo2: number | null;
  spo2Trend: 'UP' | 'DOWN' | 'STABLE';
  spo2Source?: SignalSource;
  chamberTemp: number | null;
  targetTemp: number;
  humidity: number | null;
  thermalState: 'STABLE' | 'HEATING' | 'COOLING' | 'SAFETY_CUTOFF';
  signalQuality: SignalQuality;
  signalQualityReason?: string;
  timestamp: string;
  dataAgeSeconds: number;
  isSynthetic: boolean;
}

export interface ReplayFrame {
  timestamp: number; // ISO timestamp in ms
  timeOffsetSec: number; // relative to event trigger (e.g. -30s to +30s)
  // HR & SpO2 with strict provenance
  heartRate: number | null;
  heartRateSource: ReplayChannelSource;
  spo2: number | null;
  spo2Source: ReplayChannelSource;
  // Environment & Actuator (100% Real from Hardware)
  temperature: number | null;
  humidity: number | null;
  chamberTemperature: number | null;
  rawIR: number | null;
  rawRed: number | null;
  // Camera
  cameraMovement: number | null;
  cameraTrackingState: CameraTrackingState;
  // Hardware status
  esp32Connected: boolean;
  fanCommand: string;
  peltierCommand: string;
  signalQuality: SignalQuality;
  // AI Apnea evaluation
  apneaState: AIApneaState;
  apneaScore: number | null;
  primaryContribution?: string;
}

export interface ReplaySession {
  eventId: string;
  sessionTitle: string;
  recordedAt: string;
  totalDurationSec: number;
  preEventDurationSec: number;
  postEventDurationSec: number;
  triggerTimestamp: number;
  frames: ReplayFrame[];
  channelProvenance: {
    heartRate: ReplayChannelSource;
    spo2: ReplayChannelSource;
    dht11Temperature: 'MEASURED';
    dht11Humidity: 'MEASURED';
    ds18b20ChamberTemp: 'MEASURED';
    rawPPGIR: 'MEASURED';
    rawPPGRed: 'MEASURED';
    cameraMovement: 'MEASURED';
    actuatorStates: 'MEASURED';
  };
  notes?: string;
}

export interface ContributingFeature {
  name: string;
  impact: string;
  score: number;
  valueLabel: string;
  type: SignalSource;
}

export interface ApneaTelemetry {
  state: AIApneaState;
  probability: number; // 0 to 100 (Prototype Apnea Score)
  eventDurationSeconds: number;
  lastEventTimestamp?: string;
  modelVersion: string;
  inferenceLatencyMs: number;
  lastInferenceTimestamp: string;
  contributingFeatures: ContributingFeature[];
  cardiorespiratoryContext: {
    hrDropBpm: number;
    spo2NadirPercent: number;
    respirationWaveAmplitudePercent: number;
  };
  multimodalEvidence: MultimodalApneaEvidence;
  isSynthetic: boolean;
}

export interface WaveformPoint {
  timestamp: string;
  timeSec: number;
  rawPPG: number | null;
  filteredPPG: number | null;
  respiratorySignal: number | null;
  cameraMovement: number | null;
  respiratoryMotionEst: number | null;
  aiProbability: number | null;
  cameraSignalQuality: SignalQuality;
  respiratoryAvailable: boolean;
  heartRate: number | null;
  spo2: number | null;
  signalQuality: SignalQuality;
  isSynthetic: boolean;
}

export interface SnapshotPoint {
  time: string;
  ppg: number;
  resp: number | null;
  camera: number | null;
  hr: number;
  spo2: number;
  aiProb: number;
}

export interface EventDetailData {
  eventId: string;
  startTime: string;
  endTime?: string;
  duration: string;
  hrBefore: number;
  hrDuring: number;
  hrRecovery: number;
  spo2Before: number;
  spo2Nadir: number;
  spo2Recovery: number;
  cameraBefore: number | null;
  cameraDuring: number | null;
  respiratoryAvailable: boolean;
  aiProbability: number;
  signalQuality: SignalQuality;
  eventState: AIApneaState;
  waveformSnapshot: SnapshotPoint[];
  contributingFeatures: { feature: string; weight: string; description: string; tag: SignalSource }[];
  dataOrigin: SignalSource;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  type: string;
  severity: AlertSeverity;
  durationSeconds?: number;
  evidenceSummary: string;
  signalQuality: SignalQuality;
  valueConfig?: string;
  acknowledged: boolean;
  isSynthetic: boolean;
  eventDetails?: EventDetailData;
}

export interface ThermalHardwareState {
  chamberTemp: number | null;
  targetTemp: number;
  humidity: number | null;
  peltierCommand: 'OFF' | 'HEATING' | 'COOLING';
  peltierDirection: 'FORWARD' | 'REVERSE' | 'DISABLED';
  peltierPwm: number;
  fanCommand: 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH' | 'MAX';
  exhaustFanCommand: 'OFF' | 'ON';
  hardwareSafetyStatus: 'READY' | 'CUTOFF_ACTIVE' | 'FAULT' | 'UNVERIFIED';
  manualOverrideActive: boolean;
  peltierDriverStatus: string;
}

export interface SensorDiagnosticItem {
  id: string;
  name: string;
  chipModel: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'WAITING' | 'UNAVAILABLE';
  lastReading: string;
  dataAgeSeconds: number;
  validity: 'VALID' | 'INVALID' | 'FAULT' | 'WAITING';
  signalQuality: SignalQuality;
  faultStatus: string;
  gpioPins?: string;
  i2cAddress?: string;
  cameraDetails?: {
    fps: number;
    roiStatus: string;
    motionQuality: SignalQuality;
    lightingQuality: string;
    lastFrameAgeMs: number;
  };
}

export interface MonitoringSession {
  subjectId: string;
  sessionId: string;
  startTime: string;
  durationSeconds: number;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
}

export interface SystemSettings {
  selectedPopulation: ClinicalPopulation;
  monitoringRefreshRateMs: number;
  samplingRateHz: number;
  dataRetentionHours: number;
  apneaModelVersion: string;
  apneaConfirmationThresholdSec: number;
  apneaRecoveryThresholdSec: number;
  detectionWindowMs: number;
  maxCameraAgeMs: number;
  maxSpo2AgeMs: number;
  maxHrAgeMs: number;
  cameraMotionThresholdPercent: number;
  spo2DropThresholdPercent: number;
  hrDropThresholdBpm: number;
  fusionWeights: FusionWeights;
  alertAudioEnabled: boolean;
  alertCooldownSec: number;
  alertAutoAck: boolean;
  thermalMaxLimit: number;
  thermalMinLimit: number;
  webSocketUrl: string;
  webSocketPort: number;
}
