import { ApneaFusionEngine, ApneaFusionInput } from '../src/services/ApneaFusionEngine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('============================================================');
console.log('  AVENZA AI APNEA PIPELINE & SHIELD TEST SUITE');
console.log('  Validates Quality Shield, Fusion Engine, & State Machine');
console.log('============================================================\n');

// TEST 1: No Sensor Contact / Waiting for Signal
console.log('[TEST 1] No Probe Contact -> WAITING_FOR_SIGNAL & Score Null');
{
  const engine = new ApneaFusionEngine();
  const now = Date.now();

  const input: ApneaFusionInput = {
    spo2: { value: null, timestamp: now, ageMs: 0, quality: 'POOR', valid: false, source: 'MEASURED', reason: 'NO_CONTACT' },
    heartRate: { value: null, timestamp: now, ageMs: 0, quality: 'POOR', valid: false, source: 'MEASURED', reason: 'NO_CONTACT' },
    camera: { movementAmplitude: null, timestamp: now, ageMs: 0, quality: 'POOR', trackingStatus: 'NOT_STARTED', valid: false, source: 'DERIVED', reason: 'NOT_STARTED' },
    config: { prototypeWeights: { camera: 0.40, spo2: 0.35, heartRate: 0.25 } }
  };

  const evidence = engine.evaluate(input);
  assert(evidence.eventState === 'WAITING_FOR_SIGNAL', `State is WAITING_FOR_SIGNAL (got ${evidence.eventState})`);
  assert(evidence.prototypeApneaScore === null, `Prototype Apnea Score is null (got ${evidence.prototypeApneaScore})`);
  assert(evidence.shield.overallStatus === 'INVALID', `Shield status is INVALID (got ${evidence.shield.overallStatus})`);
  assert(evidence.contributingChannels.length === 0, 'Zero contributing channels');
}

// TEST 2: Single Channel Active (Camera Only) -> INSUFFICIENT_EVIDENCE
console.log('\n[TEST 2] Single Channel Active (Camera GOOD, MAX30102 POOR) -> INSUFFICIENT_EVIDENCE');
{
  const engine = new ApneaFusionEngine();
  const now = Date.now();

  const input: ApneaFusionInput = {
    spo2: { value: null, timestamp: now, ageMs: 0, quality: 'POOR', valid: false, source: 'MEASURED', reason: 'ACQUIRING' },
    heartRate: { value: null, timestamp: now, ageMs: 0, quality: 'POOR', valid: false, source: 'MEASURED', reason: 'ACQUIRING' },
    camera: { movementAmplitude: 0.45, timestamp: now, ageMs: 50, quality: 'GOOD', trackingStatus: 'LOCKED', valid: true, source: 'DERIVED', reason: 'LOCKED' },
    config: { prototypeWeights: { camera: 0.40, spo2: 0.35, heartRate: 0.25 } }
  };

  const evidence = engine.evaluate(input);
  assert(evidence.eventState === 'INSUFFICIENT_EVIDENCE', `State is INSUFFICIENT_EVIDENCE (got ${evidence.eventState})`);
  assert(evidence.prototypeApneaScore === null, `Score is null: no false apnea score on single channel (got ${evidence.prototypeApneaScore})`);
  assert(evidence.effectiveWeights.camera === 1.0, `Camera dynamically renormalized to 100% (got ${evidence.effectiveWeights.camera})`);
  assert(evidence.effectiveWeights.spo2 === 0, 'SpO2 weight is 0%');
  assert(evidence.effectiveWeights.heartRate === 0, 'Heart Rate weight is 0%');
  assert(evidence.reason.includes('Single channel') || evidence.reason.includes('corroborating'), 'Reason documents single channel limitation');
}

// TEST 3: Multi-Channel Normal Telemetry (Camera + HR + SpO2)
console.log('\n[TEST 3] Multi-Channel Valid Telemetry -> NORMAL & Distributed Weights');
{
  const engine = new ApneaFusionEngine();
  const now = Date.now();

  let evidence;
  // Feed 10 normal baseline windows
  for (let i = 0; i < 10; i++) {
    const t = now + i * 1000;
    evidence = engine.evaluate({
      spo2: { value: 98, timestamp: t, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'VALID' },
      heartRate: { value: 140, timestamp: t, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'LOCKED' },
      camera: { movementAmplitude: 0.50, timestamp: t, ageMs: 20, quality: 'GOOD', trackingStatus: 'LOCKED', valid: true, source: 'DERIVED', reason: 'LOCKED' },
      config: { prototypeWeights: { camera: 0.40, spo2: 0.35, heartRate: 0.25 } }
    });
  }

  assert(evidence!.eventState === 'NORMAL', `Event state is NORMAL (got ${evidence!.eventState})`);
  assert(evidence!.shield.overallStatus === 'OPTIMAL', `Shield status is OPTIMAL (got ${evidence!.shield.overallStatus})`);
  assert(typeof evidence!.prototypeApneaScore === 'number', `Score is numeric (got ${evidence!.prototypeApneaScore})`);
  assert(evidence!.prototypeApneaScore! < 15, `Normal score is low (got ${evidence!.prototypeApneaScore})`);
  assert(evidence!.effectiveWeights.camera === 0.40, 'Camera weight is 40%');
  assert(evidence!.effectiveWeights.spo2 === 0.35, 'SpO2 weight is 35%');
  assert(evidence!.effectiveWeights.heartRate === 0.25, 'Heart Rate weight is 25%');
  assert(evidence!.contributingChannels.length === 3, 'All 3 channels contributing');
}

// TEST 4: Timestamp Desynchronization / Skew Detection
console.log('\n[TEST 4] Timestamp Skew (>3500ms) -> DESYNCHRONIZED Shield & Score Null');
{
  const engine = new ApneaFusionEngine();
  const now = Date.now();

  const evidence = engine.evaluate({
    spo2: { value: 98, timestamp: now - 5000, ageMs: 5000, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'VALID' },
    heartRate: { value: 140, timestamp: now, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'LOCKED' },
    camera: { movementAmplitude: 0.50, timestamp: now, ageMs: 20, quality: 'GOOD', trackingStatus: 'LOCKED', valid: true, source: 'DERIVED', reason: 'LOCKED' },
    config: { prototypeWeights: { camera: 0.40, spo2: 0.35, heartRate: 0.25 } }
  });

  assert(evidence.shield.channelDiagnostics?.syncStatus === 'DESYNCHRONIZED', `Sync status is DESYNCHRONIZED (got ${evidence.shield.channelDiagnostics?.syncStatus})`);
  assert(evidence.prototypeApneaScore === null, `Score is null during desynchronization (got ${evidence.prototypeApneaScore})`);
  assert(evidence.eventState === 'WAITING_FOR_SIGNAL', `Event state is WAITING_FOR_SIGNAL (got ${evidence.eventState})`);
}

// TEST 5: Multimodal Apnea Event Progression
console.log('\n[TEST 5] Multimodal Apnea Event: NORMAL -> WATCH -> SUSPECTED -> CONFIRMED -> RECOVERED');
{
  const engine = new ApneaFusionEngine();
  const now = Date.now();

  // 1. Establish stable baseline
  for (let i = 0; i < 15; i++) {
    const t = now + i * 1000;
    engine.evaluate({
      spo2: { value: 98, timestamp: t, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'VALID' },
      heartRate: { value: 142, timestamp: t, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'LOCKED' },
      camera: { movementAmplitude: 0.50, timestamp: t, ageMs: 20, quality: 'GOOD', trackingStatus: 'LOCKED', valid: true, source: 'DERIVED', reason: 'LOCKED' },
      config: { confirmationThresholdSec: 6 }
    });
  }

  // 2a. Mild respiratory reduction (-40%) -> triggers WATCH
  let currentEvidence;
  let reachedWatch = false;
  let reachedSuspected = false;
  let reachedConfirmed = false;

  const watchEvidence = engine.evaluate({
    spo2: { value: 96, timestamp: now + 15000, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'VALID' },
    heartRate: { value: 135, timestamp: now + 15000, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'LOCKED' },
    camera: { movementAmplitude: 0.25, timestamp: now + 15000, ageMs: 20, quality: 'GOOD', trackingStatus: 'LOCKED', valid: true, source: 'DERIVED', reason: 'LOCKED' },
    config: { confirmationThresholdSec: 6 }
  });
  if (watchEvidence.eventState === 'WATCH') reachedWatch = true;

  // 2b. Severe cessation of respiratory motion (-90%) with desaturation and bradycardia
  for (let i = 16; i < 30; i++) {
    const t = now + i * 1000;
    currentEvidence = engine.evaluate({
      spo2: { value: 87, timestamp: t, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'VALID' },
      heartRate: { value: 105, timestamp: t, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'LOCKED' },
      camera: { movementAmplitude: 0.04, timestamp: t, ageMs: 20, quality: 'GOOD', trackingStatus: 'LOCKED', valid: true, source: 'DERIVED', reason: 'LOCKED' },
      config: { confirmationThresholdSec: 6 }
    });

    if (currentEvidence.eventState === 'WATCH') reachedWatch = true;
    if (currentEvidence.eventState === 'SUSPECTED') reachedSuspected = true;
    if (currentEvidence.eventState === 'CONFIRMED') reachedConfirmed = true;
  }

  assert(reachedWatch, 'State machine transitioned through WATCH');
  assert(reachedSuspected, 'State machine transitioned through SUSPECTED');
  assert(reachedConfirmed, 'State machine reached CONFIRMED after 6 seconds of multi-channel evidence');
  assert(currentEvidence!.prototypeApneaScore! > 75, `Confirmed score is high (>75%, got ${currentEvidence!.prototypeApneaScore})`);

  // 3. Recovery: normal respiration resumes
  for (let i = 30; i < 35; i++) {
    const t = now + i * 1000;
    currentEvidence = engine.evaluate({
      spo2: { value: 97, timestamp: t, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'VALID' },
      heartRate: { value: 138, timestamp: t, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED', reason: 'LOCKED' },
      camera: { movementAmplitude: 0.48, timestamp: t, ageMs: 20, quality: 'GOOD', trackingStatus: 'LOCKED', valid: true, source: 'DERIVED', reason: 'LOCKED' },
      config: { confirmationThresholdSec: 6 }
    });
  }

  assert(currentEvidence!.eventState === 'RECOVERED' || currentEvidence!.eventState === 'NORMAL', `Event recovered (got ${currentEvidence!.eventState})`);
}

// TEST 6: Artifact Resistance (PPG Disconnect does NOT cause Apnea)
console.log('\n[TEST 6] Artifact Resistance: Sudden Sensor Detachment Does NOT Trigger Apnea');
{
  const engine = new ApneaFusionEngine();
  const now = Date.now();

  // Baseline
  for (let i = 0; i < 10; i++) {
    engine.evaluate({
      spo2: { value: 98, timestamp: now + i * 1000, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED' },
      heartRate: { value: 140, timestamp: now + i * 1000, ageMs: 10, quality: 'GOOD', valid: true, source: 'MEASURED' },
      camera: { movementAmplitude: 0.50, timestamp: now + i * 1000, ageMs: 20, quality: 'GOOD', trackingStatus: 'LOCKED', valid: true, source: 'DERIVED' }
    });
  }

  // Sudden finger pull-off
  const detachmentEvidence = engine.evaluate({
    spo2: { value: null, timestamp: now + 11000, ageMs: 10, quality: 'POOR', valid: false, source: 'MEASURED', reason: 'NO_CONTACT' },
    heartRate: { value: null, timestamp: now + 11000, ageMs: 10, quality: 'POOR', valid: false, source: 'MEASURED', reason: 'NO_CONTACT' },
    camera: { movementAmplitude: 0.50, timestamp: now + 11000, ageMs: 20, quality: 'GOOD', trackingStatus: 'LOCKED', valid: true, source: 'DERIVED' }
  });

  assert(detachmentEvidence.eventState !== 'SUSPECTED' && detachmentEvidence.eventState !== 'CONFIRMED', `Detachment safely handled without false apnea (got ${detachmentEvidence.eventState})`);
  assert(detachmentEvidence.prototypeApneaScore === null, `Score is null during detachment (got ${detachmentEvidence.prototypeApneaScore})`);
}

console.log('\n============================================================');
console.log(`  PIPELINE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
}
