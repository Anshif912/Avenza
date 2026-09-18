import React from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { BrainCircuit, Activity, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { SignalQualityShield } from '../components/common/SignalQualityShield';
import { WhyEventFlaggedPanel } from '../components/common/WhyEventFlaggedPanel';
import { ClinicalReferencePanel } from '../components/common/ClinicalReferencePanel';
import { CameraRespirationMonitor } from '../components/camera/CameraRespirationMonitor';
import { SignalSource } from '../types/avenza';
import {
  SectionHeader, SpotlightCard, ApneaStateBadge, DataSourceBadge,
  ArcGauge, FusionWeightBar, ClinicalDisclaimer
} from '../components/design-system/DesignSystemComponents';

export const AIApneaPage: React.FC = () => {
  const { apnea, waveforms } = useMonitoring();
  const evidence = apnea.multimodalEvidence;
  const isEvaluating = apnea.state !== 'NO_EVALUATION';

  return (
    <div className="space-y-6 animate-fade-in-up">

      <SectionHeader
        icon={BrainCircuit}
        title="AI Apnea Detection — Evidence Console"
        subtitle="Laptop Webcam → Chest/Abdomen ROI → Camera Movement → Camera-Derived Respiratory Motion Evidence"
        badge="AI-ASSISTED APNEA EVENT DETECTION — PROTOTYPE"
        badgeVariant="violet"
      />

      <ClinicalDisclaimer />

      {/* ─── ROW 1: Arc Gauge + Fusion Weights + Signal Shield ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Arc Gauge + State + Duration */}
        <SpotlightCard
          glowColor={apnea.state === 'CONFIRMED' ? 'rose' : apnea.state === 'SUSPECTED' ? 'amber' : 'violet'}
          className="p-6 space-y-5"
        >
          {/* Prototype Score Gauge */}
          <div className="flex flex-col items-center space-y-4">
            <ArcGauge
              value={isEvaluating ? apnea.probability : null}
              size={200}
              critical={apnea.state === 'CONFIRMED'}
            />
            <ApneaStateBadge state={apnea.state} size="lg" />
            <p className="text-xs font-mono text-slate-300 text-center">{evidence.reason}</p>
          </div>

          {/* Duration */}
          <div className="p-3 bg-surface-0 border border-line-0 rounded-chip flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Event Duration:</span>
            </div>
            <span className={`font-bold ${apnea.eventDurationSeconds > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {apnea.eventDurationSeconds > 0 ? `${apnea.eventDurationSeconds.toFixed(1)}s` : '0.0s — No Event'}
            </span>
          </div>

          {/* Inference metadata */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-400">
            <div className="bg-surface-0 border border-line-0 rounded-chip p-2 space-y-0.5">
              <div className="text-slate-500">Model</div>
              <div className="text-violet-300 font-bold text-xs truncate">{apnea.modelVersion}</div>
            </div>
            <div className="bg-surface-0 border border-line-0 rounded-chip p-2 space-y-0.5">
              <div className="text-slate-500">Latency</div>
              <div className="text-cyan-300 font-bold text-xs">{apnea.inferenceLatencyMs > 0 ? `${apnea.inferenceLatencyMs}ms` : '--'}</div>
            </div>
          </div>
        </SpotlightCard>

        {/* Center: Fusion Attribution */}
        <SpotlightCard glowColor="violet" className="p-6 space-y-5">
          <div>
            <h3 className="text-sm font-sans font-bold text-slate-200">Dynamic Fusion Weights</h3>
            <p className="text-xs font-sans text-slate-400 mt-0.5">
              Effective weights after Signal Quality Shield renormalization
            </p>
          </div>

          <FusionWeightBar
            weights={evidence.prototypeWeights}
            effectiveWeights={evidence.effectiveWeights}
          />

          {/* Per-channel contribution detail */}
          <div className="space-y-2">
            {[
              {
                label: 'Laptop Webcam → Camera Movement',
                source: 'DERIVED' as SignalSource,
                value: evidence.cameraEvidence.movementAmplitude !== null ? `${((evidence.cameraEvidence.movementAmplitude) * 100).toFixed(1)}%` : '--',
                baseline: evidence.cameraEvidence.baseline !== null ? `${(evidence.cameraEvidence.baseline * 100).toFixed(1)}%` : '--',
                quality: evidence.channels.camera.qualityRating,
                delta: evidence.cameraEvidence.deltaPercent,
                weight: evidence.effectiveWeights.camera,
                color: 'text-violet-300',
                active: evidence.cameraEvidence.movementAmplitude !== null
              },
              {
                label: 'Optical SpO₂ (Arterial Saturation)',
                source: evidence.spo2Evidence.source || 'SIMULATED',
                value: evidence.spo2Evidence.current !== null ? `${evidence.spo2Evidence.current}%` : '--',
                baseline: evidence.spo2Evidence.baseline !== null ? `${evidence.spo2Evidence.baseline}%` : '--',
                quality: evidence.spo2Evidence.quality,
                delta: evidence.spo2Evidence.delta,
                weight: evidence.effectiveWeights.spo2,
                color: 'text-cyan-300',
                active: evidence.spo2Evidence.current !== null
              },
              {
                label: 'Pulse Telemetry (Heart Rate)',
                source: evidence.hrEvidence.source || 'SIMULATED',
                value: evidence.hrEvidence.current !== null ? `${evidence.hrEvidence.current} BPM` : '--',
                baseline: evidence.hrEvidence.baseline !== null ? `${evidence.hrEvidence.baseline} BPM` : '--',
                quality: evidence.hrEvidence.quality,
                delta: evidence.hrEvidence.delta,
                weight: evidence.effectiveWeights.heartRate,
                color: 'text-rose-300',
                active: evidence.hrEvidence.current !== null
              },
            ].map(ch => (
              <div key={ch.label} className="p-2.5 bg-surface-0 border border-line-0 rounded-chip space-y-1 font-mono text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-300 leading-tight">{ch.label}</span>
                  <DataSourceBadge source={ch.source} className="flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Val: <strong className={ch.active ? ch.color : 'text-slate-500'}>{ch.value}</strong></span>
                  <span>Base: <strong className="text-slate-200">{ch.baseline}</strong></span>
                  <span>Δ: <strong className={ch.active ? (ch.delta < 0 ? 'text-rose-400' : 'text-emerald-400') : 'text-slate-500'}>{ch.active ? `${ch.delta > 0 ? '+' : ''}${ch.delta.toFixed(1)}` : '--'}</strong></span>
                  <span className="text-[10px]">w: <strong className={ch.color}>{(ch.weight * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {/* Right: Signal Quality Shield */}
        <div className="space-y-5">
          <SignalQualityShield shield={evidence.shield} />
        </div>
      </div>

      {/* ─── CLINICAL REFERENCE LAYER CONTEXT ─────────────────────── */}
      <ClinicalReferencePanel />

      {/* ─── ROW 2: Why Flagged (full width) ─────────────────────── */}
      <WhyEventFlaggedPanel evidence={evidence} durationSec={apnea.eventDurationSeconds} />

      {/* ─── ROW 3: Camera Monitor ───────────────────────────────── */}
      <CameraRespirationMonitor />

      {/* ─── ROW 4: Synchronized Timeline ───────────────────────── */}
      <SpotlightCard glowColor="cyan" className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-sans font-bold text-slate-200">Synchronized Multimodal Timeline</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{waveforms.length > 0 ? `Shared time axis · latest ${Math.min(waveforms.length, 40)} samples` : '0 samples'}</span>
        </div>

        <div className="h-56 chart-container p-3">
          {waveforms.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waveforms.slice(-40)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2d5a" />
                <XAxis dataKey="timestamp" stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} />
                <YAxis yAxisId="hr"   domain={['auto', 'auto']}  stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} />
                <YAxis yAxisId="spo2" domain={[70, 100]} orientation="right" stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1c2d5a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  labelStyle={{ color: '#06b6d4' }}
                />
                {apnea.state === 'CONFIRMED' && <ReferenceLine yAxisId="hr" y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'THRESHOLD', fill: '#ef4444', fontSize: 9 }} />}
                <Line yAxisId="hr"   type="monotone" dataKey="heartRate"     name="HR (BPM)"        stroke="#38bdf8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line yAxisId="spo2" type="monotone" dataKey="spo2"          name="SpO₂ (%)"        stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line yAxisId="hr"   type="monotone" dataKey="cameraMovement" name="Camera Motion"  stroke="#a855f7" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-500 font-sans">
              <Activity className="w-8 h-8 text-slate-600 animate-pulse" />
              <span className="text-xs font-mono font-semibold">WAITING FOR SYNCHRONIZED TIMELINE TELEMETRY</span>
              <span className="text-[10px] text-slate-600 font-mono">Stream inactive until ESP32 and camera transmit live data</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-5 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sky-400 inline-block" /> Heart Rate (BPM)</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block" /> SpO₂ (%)</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-400 inline-block" /> Camera Motion (derived)</div>
        </div>
      </SpotlightCard>
    </div>
  );
};
