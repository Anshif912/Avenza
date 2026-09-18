import React from 'react';
import { MultimodalApneaEvidence } from '../../types/avenza';
import { BrainCircuit, Camera, Activity, Heart, ArrowDown, Layers, ShieldCheck } from 'lucide-react';

interface Props {
  evidence: MultimodalApneaEvidence;
  durationSec: number;
}

export const WhyEventFlaggedPanel: React.FC<Props> = ({ evidence, durationSec }) => {
  const { channels, baselines, effectiveWeights, prototypeWeights } = evidence;

  return (
    <div className="bg-navy-800 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-5 font-mono">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-navy-750 pb-3">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-100 tracking-tight uppercase">
            WHY THIS EVENT WAS FLAGGED
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Prototype Apnea Score:</span>
          <span className="text-lg font-extrabold text-purple-300">
            {evidence.prototypeApneaScore}%
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 font-bold">
            CONFIDENCE: {evidence.evidenceConfidence}
          </span>
        </div>
      </div>

      {/* Multimodal 3-Channel Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        
        {/* Camera Movement Evidence */}
        <div className={`p-3 rounded-xl border space-y-1.5 ${
          channels.camera.valid ? 'bg-navy-900/90 border-navy-750' : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1 font-semibold text-slate-200">
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              <span>Camera Movement</span>
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-navy-800 text-amber-300">
              {channels.camera.source}
            </span>
          </div>

          {channels.camera.valid && channels.camera.value !== null ? (
            <>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-rose-400 flex items-center">
                  <ArrowDown className="w-4 h-4 mr-0.5" />
                  {Math.abs(baselines.cameraMovement.deltaPercent)}%
                </span>
                <span className="text-[11px] text-slate-400">from baseline</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Current: <strong className="text-slate-200">{channels.camera.value.toFixed(2)}</strong> • Base: <strong className="text-slate-200">{baselines.cameraMovement.baseline !== null ? baselines.cameraMovement.baseline.toFixed(2) : '--'}</strong>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-navy-800">
                <span className="text-slate-400">Quality: <strong className="text-emerald-400">{channels.camera.qualityRating}</strong></span>
                <span className="text-cyan-400 font-semibold">CONTRIBUTING</span>
              </div>
            </>
          ) : (
            <div className="py-2 text-[11px] text-rose-400 space-y-1">
              <div className="font-bold">UNAVAILABLE</div>
              <div className="text-[10px] text-slate-400">ROI lost or stream offline. Excluded from fusion.</div>
            </div>
          )}
        </div>

        {/* SpO2 Desaturation Evidence */}
        <div className={`p-3 rounded-xl border space-y-1.5 ${
          channels.spo2.valid ? 'bg-navy-900/90 border-navy-750' : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1 font-semibold text-slate-200">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>SpO₂ Desaturation</span>
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-navy-800 text-emerald-300">
              {channels.spo2.source}
            </span>
          </div>

          {channels.spo2.valid && channels.spo2.value !== null ? (
            <>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-rose-400 flex items-center">
                  <ArrowDown className="w-4 h-4 mr-0.5" />
                  {Math.abs(baselines.spo2.deltaPercent)}%
                </span>
                <span className="text-[11px] text-slate-400">desaturation</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Current: <strong className="text-slate-200">{channels.spo2.value}%</strong> • Base: <strong className="text-slate-200">{baselines.spo2.baseline !== null ? `${baselines.spo2.baseline}%` : '--'}</strong>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-navy-800">
                <span className="text-slate-400">Quality: <strong className="text-emerald-400">{channels.spo2.qualityRating}</strong></span>
                <span className="text-cyan-400 font-semibold">CONTRIBUTING</span>
              </div>
            </>
          ) : (
            <div className="py-2 text-[11px] text-rose-400 space-y-1">
              <div className="font-bold">UNAVAILABLE</div>
              <div className="text-[10px] text-slate-400">MAX30102 lead off or stale. Excluded.</div>
            </div>
          )}
        </div>

        {/* Heart Rate Deceleration Evidence */}
        <div className={`p-3 rounded-xl border space-y-1.5 ${
          channels.heartRate.valid ? 'bg-navy-900/90 border-navy-750' : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1 font-semibold text-slate-200">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Heart Rate Decel</span>
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-navy-800 text-cyan-300">
              {channels.heartRate.source}
            </span>
          </div>

          {channels.heartRate.valid && channels.heartRate.value !== null ? (
            <>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-rose-400 flex items-center">
                  <ArrowDown className="w-4 h-4 mr-0.5" />
                  {Math.abs(baselines.heartRate.deltaBpm)} BPM
                </span>
                <span className="text-[11px] text-slate-400">deceleration</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Current: <strong className="text-slate-200">{channels.heartRate.value} BPM</strong> • Base: <strong className="text-slate-200">{baselines.heartRate.baseline !== null ? `${baselines.heartRate.baseline} BPM` : '--'}</strong>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-navy-800">
                <span className="text-slate-400">Quality: <strong className="text-emerald-400">{channels.heartRate.qualityRating}</strong></span>
                <span className="text-purple-400 font-semibold">SUPPORTING</span>
              </div>
            </>
          ) : (
            <div className="py-2 text-[11px] text-rose-400 space-y-1">
              <div className="font-bold">UNAVAILABLE</div>
              <div className="text-[10px] text-slate-400">Telemetry stale or detached. Excluded.</div>
            </div>
          )}
        </div>

      </div>

      {/* Quality-Aware Fusion Weights Breakdown */}
      <div className="p-3.5 bg-navy-950/80 border border-navy-750 rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-bold uppercase flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Prototype Multimodal Fusion Weights</span>
          </span>
          <span className="text-[10px] text-slate-400 italic">Prototype fusion configuration — not clinically validated.</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
          <div>
            <span className="text-slate-400">Camera Weight:</span>{' '}
            <strong className="text-purple-300">{(effectiveWeights.camera * 100).toFixed(0)}%</strong>
            <span className="text-[10px] text-slate-500 block">Config: {(prototypeWeights.camera * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-400">SpO₂ Weight:</span>{' '}
            <strong className="text-cyan-300">{(effectiveWeights.spo2 * 100).toFixed(0)}%</strong>
            <span className="text-[10px] text-slate-500 block">Config: {(prototypeWeights.spo2 * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-400">Heart Rate Weight:</span>{' '}
            <strong className="text-rose-300">{(effectiveWeights.heartRate * 100).toFixed(0)}%</strong>
            <span className="text-[10px] text-slate-500 block">Config: {(prototypeWeights.heartRate * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Clinical Reference Context vs Prototype Criteria */}
      {evidence.clinicalReferenceContext && (
        <div className="p-3.5 bg-surface-0 border border-line-0 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-200 font-bold uppercase">
            <span className="flex items-center gap-1.5 text-medical-cyan">
              <ShieldCheck className="w-4 h-4" />
              <span>Clinical Reference Context ({evidence.clinicalReferenceContext.populationLabel})</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
              evidence.clinicalReferenceContext.singleChannelSafetyActive
                ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
            }`}>
              {evidence.clinicalReferenceContext.singleChannelSafetyActive
                ? 'SINGLE-CHANNEL SAFETY: ACTIVE (LOCKED)'
                : 'MULTI-CHANNEL CORROBORATION READY'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
              <span className="text-slate-400 block">Heart Rate Ref:</span>
              <strong className="text-slate-200">{evidence.clinicalReferenceContext.hrEvaluation.referenceText}</strong>
              <div className={`text-[10px] mt-0.5 font-bold ${
                evidence.clinicalReferenceContext.hrEvaluation.isWarning ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {evidence.clinicalReferenceContext.hrEvaluation.statusLabel}
              </div>
            </div>

            <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
              <span className="text-slate-400 block">SpO₂ Target Ref:</span>
              <strong className="text-slate-200">{evidence.clinicalReferenceContext.spo2Evaluation.targetText}</strong>
              <div className={`text-[10px] mt-0.5 font-bold ${
                evidence.clinicalReferenceContext.spo2Evaluation.isDesaturating ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {evidence.clinicalReferenceContext.spo2Evaluation.statusLabel}
              </div>
            </div>

            <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
              <span className="text-slate-400 block">AAP Apnea Criterion:</span>
              <strong className="text-slate-200">≥20s (or with brady/desat)</strong>
              <div className="text-[10px] text-slate-400 mt-0.5">Prototype: 10s Window</div>
            </div>
          </div>
        </div>
      )}

      {/* Flagged Features Attribution List */}
      <div className="space-y-2">
        <div className="text-[11px] text-slate-400 uppercase font-semibold">
          Flagged Multimodal Evidence Elements
        </div>
        <div className="space-y-1.5 text-xs">
          {evidence.flaggedFeatures.map((feat, idx) => (
            <div key={idx} className="p-2 bg-navy-900/60 border border-navy-750 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  feat.status === 'CONTRIBUTING' ? 'bg-rose-400' :
                  feat.status === 'SUPPORTING' ? 'bg-cyan-400' : 'bg-slate-500'
                }`}></span>
                <span className="text-slate-200 font-semibold">{feat.text}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-rose-300 font-bold">{feat.delta}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-navy-800 border border-navy-700 text-amber-300">
                  {feat.originTag}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-navy-850 text-slate-400 border border-navy-750">
                  {feat.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Boundary Reminder */}
      <div className="text-[10px] text-purple-300/80 italic pt-1 border-t border-navy-750">
        PROTOTYPE APNEA SCORE — NOT A CLINICAL PROBABILITY. Evidence-derived model output based on weighted quality-aware fusion (Camera 40%, SpO₂ 35%, HR 25%). Not a clinical diagnosis.
      </div>
    </div>
  );
};
