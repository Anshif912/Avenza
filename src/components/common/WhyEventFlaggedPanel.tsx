import React from 'react';
import { MultimodalApneaEvidence } from '../../types/avenza';
import { BrainCircuit, Camera, Activity, Heart, ArrowDown, Layers, ShieldCheck } from 'lucide-react';

interface Props {
  evidence: MultimodalApneaEvidence;
  durationSec: number;
}

export const WhyEventFlaggedPanel: React.FC<Props> = ({ evidence }) => {
  const { channels, baselines, effectiveWeights, prototypeWeights } = evidence;

  return (
    <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-sm space-y-5 font-mono">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
            WHY THIS EVENT WAS FLAGGED
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Prototype Apnea Score:</span>
          <span className="text-lg font-extrabold text-purple-700">
            {evidence.prototypeApneaScore}%
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 font-bold">
            CONFIDENCE: {evidence.evidenceConfidence}
          </span>
        </div>
      </div>

      {/* Multimodal 3-Channel Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        
        {/* Camera Movement Evidence */}
        <div className={`p-3.5 rounded-xl border space-y-1.5 ${
          channels.camera.valid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center space-x-1 font-bold text-slate-800">
              <Camera className="w-3.5 h-3.5 text-purple-600" />
              <span>Camera Movement</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-bold">
              {channels.camera.source}
            </span>
          </div>

          {channels.camera.valid && channels.camera.value !== null ? (
            <>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-rose-600 flex items-center">
                  <ArrowDown className="w-4 h-4 mr-0.5" />
                  {Math.abs(baselines.cameraMovement.deltaPercent)}%
                </span>
                <span className="text-[11px] text-slate-500">from baseline</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Current: <strong className="text-slate-800">{channels.camera.value.toFixed(2)}</strong> • Base: <strong className="text-slate-800">{baselines.cameraMovement.baseline !== null ? baselines.cameraMovement.baseline.toFixed(2) : '--'}</strong>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200">
                <span className="text-slate-500">Quality: <strong className="text-emerald-700">{channels.camera.qualityRating}</strong></span>
                <span className="text-blue-700 font-bold">CONTRIBUTING</span>
              </div>
            </>
          ) : (
            <div className="py-2 text-[11px] text-rose-700 space-y-1">
              <div className="font-bold">UNAVAILABLE</div>
              <div className="text-[10px] text-slate-500">ROI lost or stream offline. Excluded from fusion.</div>
            </div>
          )}
        </div>

        {/* SpO2 Desaturation Evidence */}
        <div className={`p-3.5 rounded-xl border space-y-1.5 ${
          channels.spo2.valid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center space-x-1 font-bold text-slate-800">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>SpO₂ Desaturation</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
              {channels.spo2.source}
            </span>
          </div>

          {channels.spo2.valid && channels.spo2.value !== null ? (
            <>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-rose-600 flex items-center">
                  <ArrowDown className="w-4 h-4 mr-0.5" />
                  {Math.abs(baselines.spo2.deltaPercent)}%
                </span>
                <span className="text-[11px] text-slate-500">desaturation</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Current: <strong className="text-slate-800">{channels.spo2.value}%</strong> • Base: <strong className="text-slate-800">{baselines.spo2.baseline !== null ? `${baselines.spo2.baseline}%` : '--'}</strong>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200">
                <span className="text-slate-500">Quality: <strong className="text-emerald-700">{channels.spo2.qualityRating}</strong></span>
                <span className="text-blue-700 font-bold">CONTRIBUTING</span>
              </div>
            </>
          ) : (
            <div className="py-2 text-[11px] text-rose-700 space-y-1">
              <div className="font-bold">UNAVAILABLE</div>
              <div className="text-[10px] text-slate-500">MAX30102 lead off or stale. Excluded.</div>
            </div>
          )}
        </div>

        {/* Heart Rate Deceleration Evidence */}
        <div className={`p-3.5 rounded-xl border space-y-1.5 ${
          channels.heartRate.valid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center space-x-1 font-bold text-slate-800">
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span>Heart Rate Decel</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-bold">
              {channels.heartRate.source}
            </span>
          </div>

          {channels.heartRate.valid && channels.heartRate.value !== null ? (
            <>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-rose-600 flex items-center">
                  <ArrowDown className="w-4 h-4 mr-0.5" />
                  {Math.abs(baselines.heartRate.deltaBpm)} BPM
                </span>
                <span className="text-[11px] text-slate-500">deceleration</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Current: <strong className="text-slate-800">{channels.heartRate.value} BPM</strong> • Base: <strong className="text-slate-800">{baselines.heartRate.baseline !== null ? `${baselines.heartRate.baseline} BPM` : '--'}</strong>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200">
                <span className="text-slate-500">Quality: <strong className="text-emerald-700">{channels.heartRate.qualityRating}</strong></span>
                <span className="text-purple-700 font-bold">SUPPORTING</span>
              </div>
            </>
          ) : (
            <div className="py-2 text-[11px] text-rose-700 space-y-1">
              <div className="font-bold">UNAVAILABLE</div>
              <div className="text-[10px] text-slate-500">Telemetry stale or detached. Excluded.</div>
            </div>
          )}
        </div>

      </div>

      {/* Quality-Aware Fusion Weights Breakdown */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-800 font-bold uppercase flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Prototype Multimodal Fusion Weights</span>
          </span>
          <span className="text-[10px] text-slate-500 italic">Prototype fusion configuration (not clinically validated).</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
          <div>
            <span className="text-slate-500">Camera Weight:</span>{' '}
            <strong className="text-blue-700 font-bold">{(effectiveWeights.camera * 100).toFixed(0)}%</strong>
            <span className="text-[10px] text-slate-400 block">Config: {(prototypeWeights.camera * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-500">SpO₂ Weight:</span>{' '}
            <strong className="text-blue-700 font-bold">{(effectiveWeights.spo2 * 100).toFixed(0)}%</strong>
            <span className="text-[10px] text-slate-400 block">Config: {(prototypeWeights.spo2 * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-500">Heart Rate Weight:</span>{' '}
            <strong className="text-rose-700 font-bold">{(effectiveWeights.heartRate * 100).toFixed(0)}%</strong>
            <span className="text-[10px] text-slate-400 block">Config: {(prototypeWeights.heartRate * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Clinical Reference Context vs Prototype Criteria */}
      {evidence.clinicalReferenceContext && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between text-slate-900 font-bold uppercase">
            <span className="flex items-center gap-1.5 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Clinical Reference Context ({evidence.clinicalReferenceContext.populationLabel})</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
              evidence.clinicalReferenceContext.singleChannelSafetyActive
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {evidence.clinicalReferenceContext.singleChannelSafetyActive
                ? 'SINGLE-CHANNEL SAFETY: ACTIVE (LOCKED)'
                : 'MULTI-CHANNEL CORROBORATION READY'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Heart Rate Ref:</span>
              <strong className="text-slate-800">{evidence.clinicalReferenceContext.hrEvaluation.referenceText}</strong>
              <div className={`text-[10px] mt-0.5 font-bold ${
                evidence.clinicalReferenceContext.hrEvaluation.isWarning ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {evidence.clinicalReferenceContext.hrEvaluation.statusLabel}
              </div>
            </div>

            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">SpO₂ Target Ref:</span>
              <strong className="text-slate-800">{evidence.clinicalReferenceContext.spo2Evaluation.targetText}</strong>
              <div className={`text-[10px] mt-0.5 font-bold ${
                evidence.clinicalReferenceContext.spo2Evaluation.isDesaturating ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {evidence.clinicalReferenceContext.spo2Evaluation.statusLabel}
              </div>
            </div>

            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">AAP Apnea Criterion:</span>
              <strong className="text-slate-800">≥20s (or with brady/desat)</strong>
              <div className="text-[10px] text-slate-400 mt-0.5">Prototype: 10s Window</div>
            </div>
          </div>
        </div>
      )}

      {/* Flagged Features Attribution List */}
      <div className="space-y-2">
        <div className="text-[11px] text-slate-500 uppercase font-semibold">
          Flagged Multimodal Evidence Elements
        </div>
        <div className="space-y-1.5 text-xs">
          {evidence.flaggedFeatures.map((feat, idx) => (
            <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  feat.status === 'CONTRIBUTING' ? 'bg-rose-500' :
                  feat.status === 'SUPPORTING' ? 'bg-blue-500' : 'bg-slate-400'
                }`}></span>
                <span className="text-slate-800 font-semibold">{feat.text}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-rose-600 font-bold">{feat.delta}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                  {feat.originTag}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-300 font-medium">
                  {feat.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Boundary Reminder */}
      <div className="text-[10px] text-slate-600 font-sans leading-relaxed pt-2 border-t border-slate-200">
        <strong className="text-slate-900">PROTOTYPE APNEA SCORE: NOT A CLINICAL PROBABILITY:</strong> Evidence-derived model output based on weighted quality-aware fusion (Camera 40%, SpO₂ 35%, HR 25%). Not a clinical diagnosis.
      </div>
    </div>
  );
};
