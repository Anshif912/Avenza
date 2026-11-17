import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitoring } from '../context/MonitoringContext';
import { User, Activity, Camera, Thermometer, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SectionHeader, StepIndicator } from '../components/design-system/DesignSystemComponents';
import { ClinicalPopulation } from '../types/avenza';

const STEPS = ['Subject Profile', 'Probe Placement', 'Camera Region', 'Thermal Baseline'];
const PROBE_LOCATIONS = ['RIGHT_FOOT', 'LEFT_FOOT', 'RIGHT_PALM', 'LEFT_PALM'] as const;
const ROI_PRESETS = ['CHEST_STANDARD', 'ABDOMINAL_PRONE', 'WIDE_THORACIC'] as const;
const ROI_LABELS: Record<string, string> = {
  CHEST_STANDARD: 'Chest Standard (Supine orientation, thoracic landmarks T4–T8)',
  ABDOMINAL_PRONE: 'Abdominal Prone (Prone position, diaphragmatic excursion tracking)',
  WIDE_THORACIC: 'Wide Thoracic (Combined chest and abdomen ROI)',
};

type ProbeLocation = typeof PROBE_LOCATIONS[number];
type RoiPreset = typeof ROI_PRESETS[number];

export const SessionSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, updateThermalControls, updateSettings, startSession } = useMonitoring();

  const [step, setStep] = useState(0);
  const [subjectId, setSubjectId] = useState(session.subjectId || 'SUBJ-2026-01');
  const [gestationWeeks, setGestationWeeks] = useState(30);
  const [gestationDays, setGestationDays] = useState(4);
  const [birthWeight, setBirthWeight] = useState(1350);
  const [probeLocation, setProbeLocation] = useState<ProbeLocation>('RIGHT_FOOT');
  const [targetTemp, setTargetTemp] = useState(36.5);
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
    startSession(subjectId || 'SUBJ-101');
    updateThermalControls({ targetTemp });
    updateSettings({ selectedPopulation: pop });
    setSaved(true);
    setTimeout(() => navigate('/dashboard'), 400);
  };

  const inputCls = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all';
  const labelCls = 'text-xs font-semibold text-slate-700 block mb-1';

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <SectionHeader
        icon={User}
        title="Session Configuration & Setup"
        subtitle="Configure research subject parameters, sensor probe site, camera vision ROI, and thermal baseline"
        badge="SESSION SETUP"
        badgeVariant="blue"
      />

      <StepIndicator steps={STEPS} current={step} />

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

        {/* STEP 0: Subject Profile */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-semibold text-[#172033]">
                Subject Demographic Baseline
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Pseudonymous Subject ID</label>
                <input
                  type="text"
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className={inputCls}
                  placeholder="SUBJ-2026-01"
                />
                <p className="text-[10px] text-slate-400 font-mono">No real personal health data is recorded</p>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Reference Weight (g)</label>
                <input
                  type="number"
                  value={birthWeight}
                  onChange={e => setBirthWeight(Number(e.target.value))}
                  className={inputCls}
                  min={400}
                  max={5000}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className={labelCls}>Gestational Age Profile</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={gestationWeeks}
                    onChange={e => setGestationWeeks(Number(e.target.value))}
                    className={inputCls}
                    min={23}
                    max={42}
                    placeholder="Weeks"
                  />
                  <span className="text-xs text-slate-400">weeks +</span>
                  <input
                    type="number"
                    value={gestationDays}
                    onChange={e => setGestationDays(Number(e.target.value))}
                    className={inputCls}
                    min={0}
                    max={6}
                    placeholder="Days"
                  />
                  <span className="text-xs text-slate-400">days</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Probe Placement */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-semibold text-[#172033]">
                MAX30102 Optical Sensor Placement Site
              </h3>
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Optical Probe Attachment Site</label>
              <div className="grid grid-cols-2 gap-3">
                {PROBE_LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setProbeLocation(loc)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      probeLocation === loc
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-sans">{loc.replace('_', ' ')}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-1">
                Wrap the optical probe securely. Verify perfusion index on the live monitor before starting baseline evaluation.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Camera Region */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Camera className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-semibold text-[#172033]">
                Laptop Webcam ROI Preset
              </h3>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
              Camera optical flow measures relative pixel motion deltas, not direct spirometric respiration volume.
            </div>

            <div className="space-y-2">
              {ROI_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCameraRoiPreset(preset)}
                  className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    cameraRoiPreset === preset
                      ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-xs font-semibold ${cameraRoiPreset === preset ? 'text-blue-900' : 'text-slate-800'}`}>
                    {preset.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5">{ROI_LABELS[preset]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Thermal Baseline */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Thermometer className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-semibold text-[#172033]">
                Thermal Micro-Climate Setpoint
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Target Temperature Setpoint</label>
                <span className="text-xl font-mono font-bold text-amber-700 tabular-nums">
                  {targetTemp.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min={26}
                max={38}
                step={0.5}
                value={targetTemp}
                onChange={e => setTargetTemp(Number(e.target.value))}
                className="clinical-slider"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>26.0°C</span>
                <span>Target: 36.5°C</span>
                <span>38.0°C</span>
              </div>
            </div>
          </div>
        )}

        {/* Multi-step Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            ← Previous
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={saved}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configuring Session...</span>
                </>
              ) : (
                <>
                  <span>Initialize &amp; Start Monitoring</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
