import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { Baby, Activity, Camera, Thermometer, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SectionHeader, StepIndicator, ClinicalDisclaimer } from '../components/design-system/DesignSystemComponents';

import { ClinicalPopulation } from '../types/avenza';

const STEPS = ['Subject ID', 'Vital Config', 'Camera ROI', 'Thermal'];
const PROBE_LOCATIONS = ['RIGHT_FOOT', 'LEFT_FOOT', 'RIGHT_PALM', 'LEFT_PALM'] as const;
const ROI_PRESETS = ['CHEST_STANDARD', 'ABDOMINAL_PRONE', 'WIDE_THORACIC'] as const;
const ROI_LABELS: Record<string, string> = {
  CHEST_STANDARD: 'Chest Standard — neonatal supine, Thoracic landmarks T4–T8',
  ABDOMINAL_PRONE: 'Abdominal Prone — prone position, abdominal excursion monitoring',
  WIDE_THORACIC: 'Wide Thoracic — covers both chest and abdomen, lower signal fidelity',
};

type ProbeLocation = typeof PROBE_LOCATIONS[number];
type RoiPreset = typeof ROI_PRESETS[number];

export const SessionSetupPage: React.FC = () => {
  const { session, updateThermalControls, updateSettings, setActiveTab, startSession } = useMonitoring();

  const [step, setStep] = useState(0);
  const [subjectId, setSubjectId] = useState(session.subjectId || 'AVZ-001');
  const [gestationWeeks, setGestationWeeks] = useState(30);
  const [gestationDays, setGestationDays] = useState(4);
  const [birthWeight, setBirthWeight] = useState(1350);
  const [probeLocation, setProbeLocation] = useState<ProbeLocation>('RIGHT_FOOT');
  const [targetTemp, setTargetTemp] = useState(28.5);
  const [cameraRoiPreset, setCameraRoiPreset] = useState<RoiPreset>('CHEST_STANDARD');
  const [saved, setSaved] = useState(false);

  const getClinicalPopulation = (weeks: number): ClinicalPopulation => {
    if (weeks >= 37) return 'TERM_NEWBORN';
    if (weeks >= 34) return 'LATE_PRETERM';
    if (weeks >= 28) return 'PRETERM';
    return 'VERY_PRETERM';
  };

  const handleFinalSubmit = () => {
    const pop = getClinicalPopulation(gestationWeeks);
    startSession(subjectId || 'AVZ-101');
    updateThermalControls({ targetTemp });
    updateSettings({ selectedPopulation: pop });
    setSaved(true);
    setTimeout(() => setActiveTab('dashboard'), 500);
  };

  const inputCls = 'w-full px-3 py-2 bg-surface-0 border border-line-0 focus:border-medical-cyan rounded-xl text-sm font-sans text-slate-200 placeholder:text-slate-600 outline-none transition-colors';
  const labelCls = 'text-xs font-mono font-bold text-slate-400 uppercase tracking-wider';

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 animate-fade-in-up">
      <SectionHeader
        icon={Baby}
        title="Patient Intake & Monitoring Setup"
        subtitle="Configure subject parameters, sensor sites, camera ROI, and thermal baseline"
        badge="PATIENT INTAKE"
        badgeVariant="cyan"
      />

      {/* Multi-step indicator */}
      <StepIndicator steps={STEPS} current={step} />

      {/* Step panels */}
      <div className="bg-surface-1 border border-line-0 rounded-card p-6 space-y-5">

        {/* STEP 0: Subject ID */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-line-0">
              <Baby className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-sans font-bold text-slate-200">Anonymous Subject Intake</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Subject ID</label>
                <input type="text" value={subjectId} onChange={e => setSubjectId(e.target.value)} className={inputCls} placeholder="AVZ-001" />
                <p className="text-[10px] font-mono text-slate-500">Pseudonymous ID only — no PHI stored</p>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Birth Weight (g)</label>
                <input type="number" value={birthWeight} onChange={e => setBirthWeight(Number(e.target.value))} className={inputCls} min={400} max={5000} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Gestational Age</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={gestationWeeks} onChange={e => setGestationWeeks(Number(e.target.value))} className={inputCls} min={23} max={42} placeholder="Weeks" />
                  <span className="text-xs font-mono text-slate-400">+</span>
                  <input type="number" value={gestationDays} onChange={e => setGestationDays(Number(e.target.value))} className={inputCls} min={0} max={6} placeholder="Days" />
                </div>
                <p className="text-[10px] font-mono text-slate-300">{gestationWeeks}w{gestationDays}d</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Vital config / probe site */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-line-0">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-sans font-bold text-slate-200">SpO₂ & Heart Rate Probe Placement</h3>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Probe Attachment Site</label>
              <div className="grid grid-cols-2 gap-2">
                {PROBE_LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setProbeLocation(loc)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      probeLocation === loc
                        ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                        : 'bg-surface-0 border-line-0 text-slate-300 hover:border-line-1'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{loc.replace('_', ' ')}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-sans text-slate-500">
                Neonatal SpO₂ probe (MAX30102) — wrap around digit with velcro tab. Ensure good contact. Avoid over-tightening.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Camera ROI */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-line-0">
              <Camera className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-sans font-bold text-slate-200">Laptop Webcam → Chest ROI Configuration</h3>
            </div>
            <div className="p-3 bg-violet-950/30 border border-violet-500/25 rounded-xl text-xs font-mono text-violet-300">
              ⚠ Camera-Derived Respiratory Motion Evidence — not direct respiration measurement
            </div>
            <div className="space-y-2">
              {ROI_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCameraRoiPreset(preset)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    cameraRoiPreset === preset
                      ? 'bg-purple-950/60 border-purple-500/40'
                      : 'bg-surface-0 border-line-0 hover:border-line-1'
                  }`}
                >
                  <div className={`text-xs font-mono font-bold mb-1 ${cameraRoiPreset === preset ? 'text-purple-300' : 'text-slate-300'}`}>
                    {preset.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] font-sans text-slate-400">{ROI_LABELS[preset]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Thermal */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-line-0">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-sans font-bold text-slate-200">Thermal Chamber Baseline</h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Target Temperature</label>
                <span className="text-lg font-mono font-extrabold text-amber-300 tabular-nums">{targetTemp.toFixed(1)}°C</span>
              </div>
              <input
                type="range"
                min={24}
                max={37}
                step={0.5}
                value={targetTemp}
                onChange={e => setTargetTemp(Number(e.target.value))}
                className="clinical-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>24.0°C (Cool)</span>
                <span>37.0°C (Warm)</span>
              </div>
              <p className="text-[10px] font-sans text-slate-400">
                Recommended 28–33°C for VLBW neonates. PID controller with hardware safety interlock at 35.0°C.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-line-0">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 bg-surface-0 hover:bg-surface-2 text-slate-300 border border-line-0 rounded-xl text-sm font-sans transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2 bg-medical-cyan hover:brightness-110 text-black font-extrabold font-sans text-sm rounded-card transition-all"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={saved}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold font-sans text-sm rounded-card transition-all disabled:opacity-70"
            >
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Initializing...</> : <>Confirm & Start Monitoring <ArrowRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      </div>

      <ClinicalDisclaimer compact />
    </div>
  );
};
