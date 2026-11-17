import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { BrainCircuit, Activity, Clock, ShieldAlert, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { SignalQualityShield } from '../components/common/SignalQualityShield';
import { WhyEventFlaggedPanel } from '../components/common/WhyEventFlaggedPanel';
import { ClinicalReferencePanel } from '../components/common/ClinicalReferencePanel';
import { CameraRespirationMonitor } from '../components/camera/CameraRespirationMonitor';
import { SignalSource } from '../types/avenza';
import {
  SectionHeader, ApneaStateBadge, DataSourceBadge,
  ArcGauge, FusionWeightBar
} from '../components/design-system/DesignSystemComponents';

export const AIApneaPage: React.FC = () => {
  const { apnea, waveforms } = useMonitoring();
  const evidence = apnea.multimodalEvidence;
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const isEvaluating =
    apnea.state !== 'NO_EVALUATION' &&
    apnea.state !== 'WAITING_FOR_SIGNAL' &&
    apnea.state !== 'INSUFFICIENT_EVIDENCE' &&
    apnea.state !== 'INVALID_SIGNAL';

  return (
    <div className="space-y-6">

      <SectionHeader
        icon={BrainCircuit}
        title="AI Event Analysis & Evidence Review"
        subtitle="Tri-channel multimodal fusion: Non-contact camera respiratory motion, optical SpO₂ desaturation, and pulse deceleration telemetry"
        badge="PROTOTYPE ALGORITHM EVALUATION"
        badgeVariant="blue"
        action={
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono transition-colors shadow-2xs cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-600" />
            <span>Developer Diagnostics</span>
            {showDebugPanel ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        }
      />

      {/* Developer Diagnostic Trace Panel (Debug Item 15) */}
      {showDebugPanel && (
        <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-5 font-mono text-xs shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white tracking-wider text-xs">AI PIPELINE DIAGNOSTIC TRACE (REAL-TIME ENGINE TELEMETRY)</span>
            </div>
            <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              DEV MODE ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. INPUT CHANNELS */}
            <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Input Channels</div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Camera:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${evidence.cameraEvidence.valid ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                    {evidence.cameraEvidence.valid ? 'VALID' : 'INVALID'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Optical SpO₂:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${evidence.spo2Evidence.valid ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                    {evidence.spo2Evidence.valid ? 'VALID' : 'INVALID'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Heart Rate (HR):</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${evidence.hrEvidence.valid ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                    {evidence.hrEvidence.valid ? 'VALID' : 'INVALID'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. QUALITY */}
            <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Signal Quality</div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Camera:</span>
                  <span className="text-emerald-400 font-semibold">{evidence.channels.camera.signalQuality.toFixed(2)} ({evidence.cameraEvidence.quality})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Optical SpO₂:</span>
                  <span className="text-blue-400 font-semibold">{evidence.channels.spo2.signalQuality.toFixed(2)} ({evidence.spo2Evidence.quality})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Heart Rate (HR):</span>
                  <span className="text-rose-400 font-semibold">{evidence.channels.heartRate.signalQuality.toFixed(2)} ({evidence.hrEvidence.quality})</span>
                </div>
              </div>
            </div>

            {/* 3. EFFECTIVE WEIGHTS */}
            <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Effective Weights</div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Camera:</span>
                  <span className="text-purple-300 font-bold">{(evidence.effectiveWeights.camera * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Optical SpO₂:</span>
                  <span className="text-blue-300 font-bold">{(evidence.effectiveWeights.spo2 * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Heart Rate (HR):</span>
                  <span className="text-rose-300 font-bold">{(evidence.effectiveWeights.heartRate * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* 4. TEMPORAL WINDOW & SYNC */}
            <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Temporal Window</div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Duration:</span>
                  <span className="text-slate-100 font-semibold">{apnea.eventDurationSeconds.toFixed(1)}s / 8.0s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Samples Buffer:</span>
                  <span className="text-slate-100 font-semibold">{waveforms.length} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Sync:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${evidence.shield.channelDiagnostics?.syncStatus === 'SYNCHRONIZED' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                    {evidence.shield.channelDiagnostics?.syncStatus === 'SYNCHRONIZED' ? 'OK (SYNCHRONIZED)' : (evidence.shield.channelDiagnostics?.syncStatus || 'STALE')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Engine State & Rejection Reason Readout */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">EVENT ENGINE STATE:</span>
                <span className="text-white font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{apnea.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">SCORE:</span>
                <span className="text-amber-400 font-bold">{evidence.prototypeApneaScore !== null ? `${evidence.prototypeApneaScore} / 100` : '— (NO EVALUATION)'}</span>
              </div>
            </div>
            <div className="text-slate-400">
              <span className="text-slate-500">ENGINE REASON: </span>
              <span className="text-slate-200">{evidence.reason}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 border-t border-slate-900 text-[10px] text-slate-400">
              <div>Camera: <span className="text-slate-200">{evidence.shield.channelDiagnostics?.cameraReason || 'NOT_STARTED'}</span> (age: {evidence.channels.camera.ageMs}ms)</div>
              <div>SpO₂: <span className="text-slate-200">{evidence.shield.channelDiagnostics?.spo2Reason || 'NO_CONTACT'}</span> (age: {evidence.channels.spo2.ageMs}ms)</div>
              <div>Heart Rate: <span className="text-slate-200">{evidence.shield.channelDiagnostics?.hrReason || 'NO_CONTACT'}</span> (age: {evidence.channels.heartRate.ageMs}ms)</div>
            </div>
          </div>
        </div>
      )}

      {/* Honest Prototype Notice */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-blue-900 font-semibold">Educational & Research Prototype:</strong> The score below is a mathematical fusion index combining optical respiratory motion, SpO₂ slope, and heart rate deceleration. It is <strong className="text-rose-700 font-semibold">not a medical diagnosis</strong> and MAX30102 sensor telemetry is uncalibrated.
        </div>
      </div>

      {/* ─── ROW 1: Arc Gauge + Fusion Weights + Signal Shield ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

        {/* Column 1: Prototype Apnea Score */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <ArcGauge
              value={isEvaluating ? apnea.probability : null}
              size={190}
              critical={apnea.state === 'CONFIRMED'}
            />
            <ApneaStateBadge state={apnea.state} size="md" />
            <p className="text-xs font-sans text-slate-600 text-center leading-relaxed">
              {evidence.reason || 'Monitoring active across verified sensor channels.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-sans">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Event Duration:</span>
              </div>
              <span className={`font-mono font-semibold ${apnea.eventDurationSeconds > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                {apnea.eventDurationSeconds > 0 ? `${apnea.eventDurationSeconds.toFixed(1)}s` : '0.0s'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-slate-400 block text-[10px]">Model</span>
                <span className="text-[#172033] font-semibold truncate block">{apnea.modelVersion}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-slate-400 block text-[10px]">Latency</span>
                <span className="text-[#172033] font-semibold block">{apnea.inferenceLatencyMs > 0 ? `${apnea.inferenceLatencyMs}ms` : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Dynamic Fusion Weights Attribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-[#172033] tracking-tight">
              Dynamic Fusion Weights
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Effective channel attribution after quality shield validation
            </p>
          </div>

          <FusionWeightBar
            weights={evidence.prototypeWeights}
            effectiveWeights={evidence.effectiveWeights}
          />

          {/* Per-channel contribution detail */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {[
              {
                label: 'Camera Respiratory Motion',
                source: 'DERIVED' as SignalSource,
                value: evidence.cameraEvidence.movementAmplitude !== null ? `${((evidence.cameraEvidence.movementAmplitude) * 100).toFixed(1)}%` : '—',
                baseline: evidence.cameraEvidence.baseline !== null ? `${(evidence.cameraEvidence.baseline * 100).toFixed(1)}%` : '—',
                delta: evidence.cameraEvidence.deltaPercent,
                weight: evidence.effectiveWeights.camera,
                color: 'text-violet-700',
                active: evidence.cameraEvidence.movementAmplitude !== null
              },
              {
                label: 'Optical SpO₂ Saturation',
                source: evidence.spo2Evidence.source || 'SIMULATED',
                value: evidence.spo2Evidence.current !== null ? `${evidence.spo2Evidence.current}%` : '—',
                baseline: evidence.spo2Evidence.baseline !== null ? `${evidence.spo2Evidence.baseline}%` : '—',
                delta: evidence.spo2Evidence.delta,
                weight: evidence.effectiveWeights.spo2,
                color: 'text-blue-700',
                active: evidence.spo2Evidence.current !== null
              },
              {
                label: 'Pulse Telemetry (Heart Rate)',
                source: evidence.hrEvidence.source || 'SIMULATED',
                value: evidence.hrEvidence.current !== null ? `${evidence.hrEvidence.current} BPM` : '—',
                baseline: evidence.hrEvidence.baseline !== null ? `${evidence.hrEvidence.baseline} BPM` : '—',
                delta: evidence.hrEvidence.delta,
                weight: evidence.effectiveWeights.heartRate,
                color: 'text-rose-700',
                active: evidence.hrEvidence.current !== null
              },
            ].map(ch => (
              <div key={ch.label} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-800 font-medium truncate">{ch.label}</span>
                  <DataSourceBadge source={ch.source} />
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                  <span>Val: <strong className={ch.active ? ch.color : 'text-slate-400'}>{ch.value}</strong></span>
                  <span>Base: <strong className="text-slate-700">{ch.baseline}</strong></span>
                  <span>Δ: <strong className={ch.active ? (ch.delta < 0 ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-400'}>{ch.active ? `${ch.delta > 0 ? '+' : ''}${ch.delta.toFixed(1)}` : '—'}</strong></span>
                  <span>w: <strong className={ch.color}>{(ch.weight * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Signal Quality Shield */}
        <div>
          <SignalQualityShield shield={evidence.shield} />
        </div>
      </div>

      {/* ─── ROW 2: Why Flagged (full width) ─────────────────────── */}
      <WhyEventFlaggedPanel evidence={evidence} durationSec={apnea.eventDurationSeconds} />

      {/* ─── ROW 3: Clinical Reference Context ───────────────────── */}
      <ClinicalReferencePanel />

      {/* ─── ROW 4: Camera Monitor ───────────────────────────────── */}
      <CameraRespirationMonitor />

      {/* ─── ROW 5: Synchronized Timeline ───────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-[#172033]">
              Synchronized Multi-Channel Telemetry Stream
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {waveforms.length > 0 ? `Shared time axis · latest ${Math.min(waveforms.length, 40)} samples` : 'Awaiting stream'}
          </span>
        </div>

        <div className="h-56 p-3 bg-slate-50 rounded-lg border border-slate-200">
          {waveforms.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waveforms.slice(-40)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="timestamp" stroke="#CBD5E1" tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'IBM Plex Mono' }} />
                <YAxis yAxisId="hr" domain={['auto', 'auto']} stroke="#CBD5E1" tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'IBM Plex Mono' }} />
                <YAxis yAxisId="spo2" domain={[70, 100]} orientation="right" stroke="#CBD5E1" tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'IBM Plex Mono' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  labelStyle={{ color: '#2563EB' }}
                />
                {apnea.state === 'CONFIRMED' && <ReferenceLine yAxisId="hr" y={80} stroke="#DC2626" strokeDasharray="4 4" label={{ value: 'THRESHOLD', fill: '#DC2626', fontSize: 9 }} />}
                <Line yAxisId="hr" type="monotone" dataKey="heartRate" name="HR (BPM)" stroke="#2563EB" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line yAxisId="spo2" type="monotone" dataKey="spo2" name="SpO₂ (%)" stroke="#16A34A" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line yAxisId="hr" type="monotone" dataKey="cameraMovement" name="Camera Motion" stroke="#7C3AED" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Activity className="w-8 h-8 text-slate-300 animate-pulse" />
              <span className="text-xs font-medium text-slate-600">Awaiting Telemetry Stream</span>
              <span className="text-[11px] text-slate-400 font-mono">Connect ESP32 hardware or toggle DEMO mode in header</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 text-[11px] font-sans text-slate-600">
          <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-600 inline-block rounded" /> Heart Rate (BPM)</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-600 inline-block rounded" /> SpO₂ (%)</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-600 inline-block rounded" /> Camera Motion (derived)</div>
        </div>
      </div>
    </div>
  );
};
