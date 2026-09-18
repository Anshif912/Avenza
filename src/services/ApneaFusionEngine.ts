import {
  MultimodalApneaEvidence,
  AIApneaState,
  SignalQuality,
  SignalQualityShield,
  RollingBaselines,
  FusionWeights,
  SignalChannel,
  SignalSource
} from '../types/avenza';
import {
  ClinicalPopulation,
  CLINICAL_POPULATION_PROFILES,
  AUTHORITATIVE_SOURCES,
  evaluateHeartRateReference,
  evaluateTemperatureReference,
  evaluateSpO2Reference
} from '../data/clinicalReferences';

export interface ApneaFusionInput {
  spo2: {
    value: number | null;
    timestamp: number;
    ageMs: number;
    quality: SignalQuality;
    valid: boolean;
    source: SignalSource;
  };
  heartRate: {
    value: number | null;
    timestamp: number;
    ageMs: number;
    quality: SignalQuality;
    valid: boolean;
    source: SignalSource;
  };
  camera: {
    movementAmplitude: number | null;
    timestamp: number;
    ageMs: number;
    quality: SignalQuality;
    trackingStatus: string;
    valid: boolean;
    source: SignalSource;
  };
  chamberTemp?: number | null;
  config: {
    selectedPopulation?: ClinicalPopulation;
    prototypeWeights?: FusionWeights;
    detectionWindowMs?: number;
    confirmationThresholdSec?: number;
    maxCameraAgeMs?: number;
    maxSpo2AgeMs?: number;
    maxHrAgeMs?: number;
    cameraMotionDropThreshold?: number; // e.g. 0.70
    spo2DropThresholdPercent?: number; // e.g. 3
    hrDropThresholdBpm?: number; // e.g. 15
  };
}

export class ApneaFusionEngine {
  private eventDurationBufferSec = 0;
  private currentEventState: AIApneaState = 'NORMAL';

  // Rolling baseline estimates
  private hrBaseline = 138;
  private spo2Baseline = 98;
  private cameraBaseline = 0.45;
  private baselineSamplesCount = 0;

  // Default prototype weights: 40% Camera + 35% SpO2 + 25% HR
  private defaultWeights: FusionWeights = {
    camera: 0.40,
    spo2: 0.35,
    heartRate: 0.25
  };

  public evaluate(input: ApneaFusionInput): MultimodalApneaEvidence {
    const {
      spo2,
      heartRate,
      camera,
      chamberTemp,
      config
    } = input;

    const selectedPop: ClinicalPopulation = config.selectedPopulation || 'GENERAL_NEONATAL';
    const popProfile = CLINICAL_POPULATION_PROFILES[selectedPop] || CLINICAL_POPULATION_PROFILES.GENERAL_NEONATAL;
    const weightsConfig = config.prototypeWeights || this.defaultWeights;
    const maxCamAge = config.maxCameraAgeMs ?? 1500;
    const maxSpo2Age = config.maxSpo2AgeMs ?? 3000;
    const maxHrAge = config.maxHrAgeMs ?? 3000;
    const confirmThresholdSec = config.confirmationThresholdSec ?? 8;
    const camDropThresh = config.cameraMotionDropThreshold ?? 0.70;

    // 1. Freshness & Validity Checks
    const camFresh = camera.ageMs <= maxCamAge;
    const spo2Fresh = spo2.ageMs <= maxSpo2Age;
    const hrFresh = heartRate.ageMs <= maxHrAge;

    const camValid = camera.valid && camFresh && camera.movementAmplitude !== null && camera.trackingStatus === 'LOCKED';
    const spo2Valid = spo2.valid && spo2Fresh && spo2.quality !== 'POOR' && spo2.value !== null && spo2.value > 0;
    const hrValid = heartRate.valid && hrFresh && heartRate.quality !== 'POOR' && heartRate.value !== null && heartRate.value > 0;

    // 2. Baseline Management (Only adapt baselines during normal, non-event, fresh & valid data)
    const isNonEvent = this.currentEventState === 'NORMAL' || this.currentEventState === 'RECOVERED';
    if (isNonEvent) {
      if (camValid && camera.movementAmplitude !== null && camera.quality === 'GOOD') {
        this.cameraBaseline = Math.round((this.cameraBaseline * 0.95 + camera.movementAmplitude * 0.05) * 100) / 100;
      }
      if (spo2Valid && spo2.value !== null && spo2.quality === 'GOOD') {
        this.spo2Baseline = Math.round((this.spo2Baseline * 0.98 + spo2.value * 0.02) * 10) / 10;
      }
      if (hrValid && heartRate.value !== null && heartRate.quality === 'GOOD') {
        this.hrBaseline = Math.round(this.hrBaseline * 0.98 + heartRate.value * 0.02);
      }
      this.baselineSamplesCount++;
    }

    // 3. Signal Quality Shield Evaluation
    const camQualityRating = !camValid ? 'POOR' : camera.quality;
    const spo2QualityRating = !spo2Valid ? 'POOR' : spo2.quality;
    const hrQualityRating = !hrValid ? 'POOR' : heartRate.quality;

    const camFreshnessState: 'FRESH' | 'STALE' | 'INVALID' = !camera.valid ? 'INVALID' : camFresh ? 'FRESH' : 'STALE';
    const spo2FreshnessState: 'FRESH' | 'STALE' | 'INVALID' = !spo2.valid ? 'INVALID' : spo2Fresh ? 'FRESH' : 'STALE';
    const hrFreshnessState: 'FRESH' | 'STALE' | 'INVALID' = !heartRate.valid ? 'INVALID' : hrFresh ? 'FRESH' : 'STALE';

    const validChannelCount = [camValid, spo2Valid, hrValid].filter(Boolean).length;
    let shieldStatus: 'OPTIMAL' | 'DEGRADED' | 'INSUFFICIENT' | 'INVALID' = 'OPTIMAL';
    let shieldReason = 'All 3 evidence channels (Camera, SpO2, HR) optimal and fresh';

    if (validChannelCount === 3) {
      shieldStatus = 'OPTIMAL';
    } else if (validChannelCount === 2) {
      shieldStatus = 'DEGRADED';
      shieldReason = !camValid
        ? 'CAMERA EVIDENCE UNAVAILABLE (Webcam offline or ROI lost). Re-weighting physiological sensors.'
        : !spo2Valid
        ? 'SpO2 signal uncalibrated or unavailable. Re-weighting camera motion and pulse rate.'
        : 'Heart rate telemetry degraded or stale. Re-weighting camera motion and SpO2.';
    } else if (validChannelCount === 1) {
      shieldStatus = 'INSUFFICIENT';
      shieldReason = 'INSUFFICIENT SIGNAL FOR APNEA EVALUATION (Multiple channels unavailable or uncalibrated)';
    } else {
      shieldStatus = 'INVALID';
      shieldReason = 'NO VALID SIGNALS AVAILABLE (Sensors detached / streams stopped)';
    }

    // 4. Compute Physiological Deltas vs Rolling Baselines
    const spo2Delta = spo2Valid && spo2.value !== null ? Math.round((spo2.value - this.spo2Baseline) * 10) / 10 : 0;
    const hrDelta = hrValid && heartRate.value !== null ? Math.round(heartRate.value - this.hrBaseline) : 0;
    const cameraDeltaPercent =
      camValid && camera.movementAmplitude !== null && this.cameraBaseline > 0
        ? Math.round(((camera.movementAmplitude - this.cameraBaseline) / this.cameraBaseline) * 100)
        : 0;

    // 5. Individual Channel Evidence Scores (0..1)
    let cameraScore = 0;
    if (camValid && camera.movementAmplitude !== null) {
      const dropFraction = Math.abs(Math.min(0, cameraDeltaPercent)) / 100;
      if (dropFraction >= camDropThresh) {
        cameraScore = 0.95;
      } else if (dropFraction >= 0.50) {
        cameraScore = 0.65;
      } else if (dropFraction >= 0.30) {
        cameraScore = 0.35;
      } else {
        cameraScore = 0.05;
      }
    }

    let spo2Score = 0;
    if (spo2Valid) {
      if (spo2Delta <= -10) spo2Score = 0.95;
      else if (spo2Delta <= -5) spo2Score = 0.75;
      else if (spo2Delta <= -2) spo2Score = 0.40;
      else spo2Score = 0.05;
    }

    let hrScore = 0;
    if (hrValid) {
      if (hrDelta <= -40) hrScore = 0.95;
      else if (hrDelta <= -20) hrScore = 0.70;
      else if (hrDelta <= -10) hrScore = 0.35;
      else hrScore = 0.05;
    }

    // 6. Quality-Aware Weight Renormalization
    const contributingChannels: Array<'CAMERA' | 'SPO2' | 'HR'> = [];
    let weightSum = 0;

    if (camValid) {
      weightSum += weightsConfig.camera;
      contributingChannels.push('CAMERA');
    }
    if (spo2Valid) {
      weightSum += weightsConfig.spo2;
      contributingChannels.push('SPO2');
    }
    if (hrValid) {
      weightSum += weightsConfig.heartRate;
      contributingChannels.push('HR');
    }

    const effectiveWeights: FusionWeights = {
      camera: camValid && weightSum > 0 ? Math.round((weightsConfig.camera / weightSum) * 100) / 100 : 0,
      spo2: spo2Valid && weightSum > 0 ? Math.round((weightsConfig.spo2 / weightSum) * 100) / 100 : 0,
      heartRate: hrValid && weightSum > 0 ? Math.round((weightsConfig.heartRate / weightSum) * 100) / 100 : 0
    };

    let fusionScore = 0;
    if (shieldStatus === 'INSUFFICIENT' || shieldStatus === 'INVALID') {
      fusionScore = 0.05;
    } else {
      fusionScore =
        (camValid ? cameraScore * effectiveWeights.camera : 0) +
        (spo2Valid ? spo2Score * effectiveWeights.spo2 : 0) +
        (hrValid ? hrScore * effectiveWeights.heartRate : 0);
    }

    const prototypeApneaScore = Math.min(99, Math.round(fusionScore * 100));

    // 7. Single-Channel Safety Rule & Event State Machine
    const cameraEvidenceActive = camValid && cameraScore >= 0.50; // >= 50% drop in motion
    const spo2EvidenceActive = spo2Valid && spo2Score >= 0.40;   // >= 2% desaturation
    const hrEvidenceActive = hrValid && hrScore >= 0.35;        // >= 10 BPM deceleration
    const activeEvidenceCount = [cameraEvidenceActive, spo2EvidenceActive, hrEvidenceActive].filter(Boolean).length;
    const singleChannelSafetyActive = activeEvidenceCount === 1;

    if (shieldStatus === 'INSUFFICIENT' || shieldStatus === 'INVALID') {
      this.currentEventState = 'INVALID_SIGNAL';
      this.eventDurationBufferSec = 0;
    } else {
      const hasPrimaryEvidence = (camValid && cameraScore >= 0.65) || (spo2Valid && spo2Score >= 0.70);

      // Single-Channel Safety Rule:
      // Single channel anomaly CANNOT trigger CONFIRMED. Multi-channel corroboration (activeEvidenceCount >= 2) required.
      if (prototypeApneaScore >= 80 && hasPrimaryEvidence && activeEvidenceCount >= 2) {
        this.eventDurationBufferSec += 0.2;
        if (this.eventDurationBufferSec >= confirmThresholdSec) {
          this.currentEventState = 'CONFIRMED';
        } else {
          this.currentEventState = 'SUSPECTED';
        }
      } else if (prototypeApneaScore >= 50 && (hasPrimaryEvidence || activeEvidenceCount >= 1)) {
        this.eventDurationBufferSec += 0.2;
        this.currentEventState = 'SUSPECTED';
      } else if (prototypeApneaScore >= 25 || (camValid && cameraDeltaPercent <= -40) || (spo2Valid && spo2Delta <= -2)) {
        this.currentEventState = 'WATCH';
      } else {
        if (this.currentEventState === 'CONFIRMED' || this.currentEventState === 'SUSPECTED') {
          this.currentEventState = 'RECOVERED';
        } else {
          this.currentEventState = 'NORMAL';
        }
        this.eventDurationBufferSec = 0;
      }
    }

    // 8. Explainability Features Attribution
    const flaggedFeatures: MultimodalApneaEvidence['flaggedFeatures'] = [];

    // Camera feature
    if (camValid && camera.movementAmplitude !== null) {
      flaggedFeatures.push({
        source: 'CAMERA',
        text: 'Camera-derived chest/abdomen motion amplitude',
        delta: `${cameraDeltaPercent}% change (${camera.movementAmplitude.toFixed(2)} vs ${this.cameraBaseline.toFixed(2)} base)`,
        originTag: camera.source,
        status: cameraDeltaPercent < -30 ? 'CONTRIBUTING' : 'SUPPORTING'
      });
    } else {
      flaggedFeatures.push({
        source: 'CAMERA',
        text: 'Camera ROI Movement Evidence',
        delta: 'UNAVAILABLE (Webcam stream inactive or ROI lost)',
        originTag: 'DERIVED',
        status: 'UNAVAILABLE'
      });
    }

    // SpO2 feature
    if (spo2Valid) {
      flaggedFeatures.push({
        source: 'SPO2',
        text: 'Arterial Oxygen Saturation (SpO₂)',
        delta: `${spo2Delta >= 0 ? '+' : ''}${spo2Delta}% delta (${spo2.value}% vs ${this.spo2Baseline}% base)`,
        originTag: spo2.source,
        status: spo2Delta <= -2 ? 'CONTRIBUTING' : 'SUPPORTING'
      });
    } else {
      flaggedFeatures.push({
        source: 'SPO2',
        text: 'Arterial Oxygen Saturation (SpO₂)',
        delta: 'UNAVAILABLE (Sensor detached or signal stale)',
        originTag: 'MEASURED',
        status: 'UNAVAILABLE'
      });
    }

    // Heart rate feature
    if (hrValid) {
      flaggedFeatures.push({
        source: 'HR',
        text: 'Heart Rate Pulse Telemetry',
        delta: `${hrDelta >= 0 ? '+' : ''}${hrDelta} BPM delta (${heartRate.value} vs ${this.hrBaseline} BPM base)`,
        originTag: heartRate.source,
        status: hrDelta <= -10 ? 'CONTRIBUTING' : 'SUPPORTING'
      });
    } else {
      flaggedFeatures.push({
        source: 'HR',
        text: 'Heart Rate Pulse Telemetry',
        delta: 'UNAVAILABLE (Sensor detached or signal stale)',
        originTag: 'MEASURED',
        status: 'UNAVAILABLE'
      });
    }

    // Shield feature
    flaggedFeatures.push({
      source: 'SHIELD',
      text: `Signal Quality Shield: ${shieldStatus}`,
      delta: shieldReason,
      originTag: 'DERIVED',
      status: shieldStatus === 'OPTIMAL' ? 'SUPPORTING' : 'CONTRIBUTING'
    });

    const shield: SignalQualityShield = {
      spo2Quality: spo2QualityRating,
      spo2Freshness: spo2FreshnessState,
      hrQuality: hrQualityRating,
      hrFreshness: hrFreshnessState,
      cameraQuality: camQualityRating,
      cameraFreshness: camFreshnessState,
      overallStatus: shieldStatus,
      reason: shieldReason
    };

    const baselines: RollingBaselines = {
      heartRate: { current: heartRate.value, baseline: this.hrBaseline, deltaBpm: hrDelta },
      spo2: { current: spo2.value, baseline: this.spo2Baseline, deltaPercent: Math.round(spo2Delta) },
      cameraMovement: { current: camera.movementAmplitude, baseline: this.cameraBaseline, deltaPercent: cameraDeltaPercent }
    };

    let reasonSummary = 'Cardiorespiratory & camera movement signals nominal';
    if (this.currentEventState === 'CONFIRMED') {
      reasonSummary = 'Sustained multimodal evidence: Chest motion reduction corroborated by desaturation / bradycardia';
    } else if (this.currentEventState === 'SUSPECTED') {
      reasonSummary = singleChannelSafetyActive
        ? 'Single-channel movement reduction detected (Single-channel safety active; awaiting physiological corroboration)'
        : 'Chest movement reduction + supporting physiological vitals changes detected';
    } else if (this.currentEventState === 'WATCH') {
      reasonSummary = 'Transient chest movement reduction observed; monitoring temporal window';
    } else if (this.currentEventState === 'INVALID_SIGNAL') {
      reasonSummary = shieldReason;
    }

    const evidenceConfidence: 'HIGH' | 'MODERATE' | 'LOW' =
      shieldStatus === 'OPTIMAL' && validChannelCount === 3
        ? 'HIGH'
        : shieldStatus === 'DEGRADED' && validChannelCount === 2
        ? 'MODERATE'
        : 'LOW';

    const cameraChannel: SignalChannel<number | null> = {
      value: camera.movementAmplitude,
      timestamp: camera.timestamp,
      ageMs: camera.ageMs,
      signalQuality: camValid ? (camera.quality === 'GOOD' ? 1.0 : 0.5) : 0,
      qualityRating: camQualityRating,
      valid: camValid,
      stale: !camFresh,
      source: camera.source
    };

    const spo2Channel: SignalChannel<number | null> = {
      value: spo2.value,
      timestamp: spo2.timestamp,
      ageMs: spo2.ageMs,
      signalQuality: spo2Valid ? (spo2.quality === 'GOOD' ? 1.0 : 0.5) : 0,
      qualityRating: spo2QualityRating,
      valid: spo2Valid,
      stale: !spo2Fresh,
      source: spo2.source
    };

    const hrChannel: SignalChannel<number | null> = {
      value: heartRate.value,
      timestamp: heartRate.timestamp,
      ageMs: heartRate.ageMs,
      signalQuality: hrValid ? (heartRate.quality === 'GOOD' ? 1.0 : 0.5) : 0,
      qualityRating: hrQualityRating,
      valid: hrValid,
      stale: !hrFresh,
      source: heartRate.source
    };

    // 9. Evaluate Authoritative Clinical Reference Context
    const hrEval = evaluateHeartRateReference(hrValid ? heartRate.value : null, selectedPop);
    const spo2Eval = evaluateSpO2Reference(spo2Valid ? spo2.value : null, this.spo2Baseline, selectedPop);
    const tempEval = evaluateTemperatureReference(chamberTemp ?? null, selectedPop);

    const clinicalReferenceContext = {
      population: selectedPop,
      populationLabel: popProfile.label,
      hrEvaluation: hrEval,
      spo2Evaluation: spo2Eval,
      tempEvaluation: tempEval,
      apneaClinicalCriterion: {
        definitionText: 'Cessation of breathing ≥20 seconds OR shorter pause (<20s) with bradycardia (HR <100 BPM) or desaturation (SpO₂ ≤85%)',
        source: AUTHORITATIVE_SOURCES.AAP_AOP_GUIDELINE,
        prototypeDiffText: 'AVENZA prototype uses a 10-second algorithmic temporal window (DETECTION_WINDOW_MS) for early multi-signal alerting, distinct from the ≥20s diagnostic guideline.'
      },
      singleChannelSafetyActive
    };

    return {
      spo2Evidence: {
        current: spo2.value,
        baseline: this.spo2Baseline,
        delta: spo2Delta,
        slope: Math.round((spo2Delta / 10) * 10) / 10,
        quality: spo2QualityRating,
        freshnessSec: Math.round((spo2.ageMs / 1000) * 10) / 10,
        valid: spo2Valid,
        source: spo2.source
      },
      hrEvidence: {
        current: heartRate.value,
        baseline: this.hrBaseline,
        delta: hrDelta,
        quality: hrQualityRating,
        freshnessSec: Math.round((heartRate.ageMs / 1000) * 10) / 10,
        valid: hrValid,
        hrvAvailable: false,
        source: heartRate.source
      },
      cameraEvidence: {
        movementAmplitude: camera.movementAmplitude,
        baseline: this.cameraBaseline,
        deltaPercent: cameraDeltaPercent,
        trackingStatus: (camera.trackingStatus as any) || 'INVALID',
        quality: camQualityRating,
        valid: camValid,
        source: camera.source
      },
      channels: {
        camera: cameraChannel,
        spo2: spo2Channel,
        heartRate: hrChannel
      },
      prototypeWeights: weightsConfig,
      effectiveWeights,
      contributingChannels,
      shield,
      baselines,
      prototypeApneaScore,
      apneaProbability: prototypeApneaScore,
      evidenceScore: Math.round(fusionScore * 100) / 100,
      evidenceConfidence,
      eventState: this.currentEventState,
      reason: reasonSummary,
      flaggedFeatures,
      clinicalReferenceContext
    };
  }
}
