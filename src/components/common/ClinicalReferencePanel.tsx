import React, { useState } from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import { BookOpen, ShieldCheck, ExternalLink, Info, Heart, Activity, Thermometer, Wind } from 'lucide-react';
import { CLINICAL_POPULATION_PROFILES, ClinicalPopulation } from '../../data/clinicalReferences';
import { ClinicalSourcesModal } from './ClinicalSourcesModal';

interface Props {
  compact?: boolean;
  className?: string;
}

export const ClinicalReferencePanel: React.FC<Props> = ({ compact = false, className = '' }) => {
  const { settings, apnea } = useMonitoring();
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  const population: ClinicalPopulation = settings.selectedPopulation || 'GENERAL_NEONATAL';
  const profile = CLINICAL_POPULATION_PROFILES[population] || CLINICAL_POPULATION_PROFILES.GENERAL_NEONATAL;

  return (
    <>
      <div className={`bg-surface-0 border border-line-0 rounded-2xl overflow-hidden shadow-card ${className}`}>
        {/* Header Bar */}
        <div className="p-4 border-b border-line-0 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans font-bold text-slate-900 uppercase tracking-wide">
                  Clinical Evidence Reference Layer
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {profile.label}
                </span>
              </div>
              <p className="text-[11px] font-sans text-slate-500">
                Authoritative reference ranges (WHO 2015/1997 · AAP 2016/2018 · Nelson Pediatrics)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSourcesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-sans font-semibold transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>VIEW CLINICAL SOURCES</span>
            </button>
          </div>
        </div>

        {/* Reference Metrics Grid */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {/* Heart Rate */}
            <div className="p-3 bg-slate-50 border border-line-0 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                <Heart className="w-3.5 h-3.5 text-rose-600" />
                <span>RESTING HEART RATE</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {profile.heartRateRange.min}–{profile.heartRateRange.max} <span className="text-[10px] text-slate-500 font-normal">BPM</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">WHO Newborn Exam (2015)</div>
            </div>

            {/* Respiratory Rate */}
            <div className="p-3 bg-slate-50 border border-line-0 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                <Wind className="w-3.5 h-3.5 text-purple-600" />
                <span>RESPIRATORY RATE</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {profile.respiratoryRateRange.min}–{profile.respiratoryRateRange.max} <span className="text-[10px] text-slate-500 font-normal">breaths/min</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">Counted over 60s (WHO)</div>
            </div>

            {/* Temperature */}
            <div className="p-3 bg-slate-50 border border-line-0 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                <span>THERMAL NEUTRAL</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {profile.temperatureRange.min}–{profile.temperatureRange.max} <span className="text-[10px] text-slate-500 font-normal">°C</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">WHO Thermal Care (1997)</div>
            </div>

            {/* SpO2 Target */}
            <div className="p-3 bg-slate-50 border border-line-0 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>SpO₂ TARGET RANGE</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {profile.spo2TargetRange.min}–{profile.spo2TargetRange.max} <span className="text-[10px] text-slate-500 font-normal">%</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">AAP Oxygen Guideline</div>
            </div>
          </div>

          {/* Clinical Definition vs Prototype Window Callout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-50 border border-line-0 rounded-xl space-y-1">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>AAP Clinical Apnea Definition (2016)</span>
              </div>
              <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
                Cessation of breathing <strong>≥20 seconds</strong> OR shorter pause (&lt;20s) accompanied by bradycardia (HR &lt;100 BPM) or desaturation (SpO₂ ≤85%).
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-line-0 rounded-xl space-y-1">
              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Prototype Detection Temporal Window</span>
              </div>
              <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
                NeoNattle evaluates a <strong>10-second algorithmic temporal window</strong> (40% Camera + 35% SpO₂ + 25% HR). Single-channel safety enforces multi-channel corroboration before confirmed state.
              </p>
            </div>
          </div>

          {/* Safety Rule Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-line-0 rounded-xl text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-700">
                Single-Channel Safety Guard: <strong className="text-emerald-700">ACTIVE</strong> (Requires ≥2 corroborating channels for Confirmed Apnea)
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              Stratification: {profile.gestationalWeeksLabel}
            </span>
          </div>
        </div>
      </div>

      <ClinicalSourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
      />
    </>
  );
};
