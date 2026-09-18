import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { Settings, Save, RefreshCw, Cpu, BrainCircuit, Thermometer, Wifi, CheckCircle2, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { SystemSettings, ClinicalPopulation } from '../types/avenza';
import { CLINICAL_POPULATION_PROFILES } from '../data/clinicalReferences';
import { ClinicalSourcesModal } from '../components/common/ClinicalSourcesModal';
import { SectionHeader, SpotlightCard, FusionWeightBar, ClinicalDisclaimer } from '../components/design-system/DesignSystemComponents';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useMonitoring();
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  const selectedPopProfile = CLINICAL_POPULATION_PROFILES[formData.selectedPopulation || 'GENERAL_NEONATAL'];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setFormData({ ...settings });
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      <SectionHeader
        icon={Settings}
        title="System Configuration & Fusion Parameters"
        subtitle="Clinical population reference profiles, AI fusion weights, signal freshness windows, alert thresholds, and ESP32 endpoints"
        badge="SYSTEM CONFIG"
        badgeVariant="cyan"
        action={
          savedSuccess ? (
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved
            </span>
          ) : null
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        <SpotlightCard glowColor="cyan" className="p-6 space-y-8">
          
          {/* Section 1: Clinical Population Reference Profile */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-sans font-bold text-slate-100">1. Clinical Reference Layer — Population Profile</h3>
                  <p className="text-xs font-sans text-slate-400">Authoritative evidence-informed vital sign bounds by gestational age</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Guidelines & Sources</span>
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Target Neonatal Population
                </label>
                <select
                  value={formData.selectedPopulation || 'GENERAL_NEONATAL'}
                  onChange={e => setFormData({ ...formData, selectedPopulation: e.target.value as ClinicalPopulation })}
                  className="w-full px-3 py-2.5 bg-surface-0 border border-line-0 focus:border-medical-cyan rounded-xl text-xs font-mono text-slate-200 outline-none cursor-pointer"
                >
                  <option value="GENERAL_NEONATAL">General Neonatal (Standard Reference · WHO Newborn Exam)</option>
                  <option value="TERM_NEWBORN">Term Newborn Infant (≥ 37 Weeks Gestation)</option>
                  <option value="LATE_PRETERM">Late Preterm Infant (34 to &lt; 37 Weeks Gestation)</option>
                  <option value="PRETERM">Preterm Infant (28 to &lt; 34 Weeks Gestation)</option>
                  <option value="VERY_PRETERM">Very / Extremely Preterm Infant (&lt; 28 Weeks Gestation)</option>
                </select>
              </div>

              {/* Active Profile Summary Box */}
              <div className="p-4 bg-surface-0 border border-line-0 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold text-cyan-300">{selectedPopProfile.label}</span>
                  <span className="text-slate-400 text-[11px]">{selectedPopProfile.gestationalWeeksLabel}</span>
                </div>
                <p className="text-[11px] font-sans text-slate-400">{selectedPopProfile.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
                    <span className="text-slate-500 block">HR Range</span>
                    <strong className="text-slate-200">{selectedPopProfile.heartRateRange.min}–{selectedPopProfile.heartRateRange.max} BPM</strong>
                  </div>
                  <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
                    <span className="text-slate-500 block">RR Range</span>
                    <strong className="text-slate-200">{selectedPopProfile.respiratoryRateRange.min}–{selectedPopProfile.respiratoryRateRange.max} /min</strong>
                  </div>
                  <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
                    <span className="text-slate-500 block">Thermal Neutral</span>
                    <strong className="text-slate-200">{selectedPopProfile.temperatureRange.min}–{selectedPopProfile.temperatureRange.max} °C</strong>
                  </div>
                  <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
                    <span className="text-slate-500 block">SpO₂ Target</span>
                    <strong className="text-slate-200">{selectedPopProfile.spo2TargetRange.min}–{selectedPopProfile.spo2TargetRange.max}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Multimodal Prototype Apnea Detection Criteria */}
          <div className="pt-6 border-t border-line-0 space-y-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-violet-400" />
              <div>
                <h3 className="text-sm font-sans font-bold text-slate-100">2. Prototype Multimodal Apnea Detection Criteria</h3>
                <p className="text-xs font-sans text-slate-400">Algorithmic temporal accumulation window & Single-Channel Safety configuration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Confirmation Threshold</span>
                  <span className="text-violet-300 font-bold">{formData.apneaConfirmationThresholdSec}s</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={1}
                  value={formData.apneaConfirmationThresholdSec}
                  onChange={e => setFormData({ ...formData, apneaConfirmationThresholdSec: Number(e.target.value) })}
                  className="clinical-slider"
                />
                <span className="text-[10px] font-mono text-slate-500">Sustained multi-signal duration required for CONFIRMED state</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Recovery Threshold</span>
                  <span className="text-emerald-300 font-bold">{formData.apneaRecoveryThresholdSec}s</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={1}
                  value={formData.apneaRecoveryThresholdSec}
                  onChange={e => setFormData({ ...formData, apneaRecoveryThresholdSec: Number(e.target.value) })}
                  className="clinical-slider"
                />
                <span className="text-[10px] font-mono text-slate-500">Sustained normal signals required for RECOVERED</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Camera Motion Drop Trigger</span>
                  <span className="text-purple-300 font-bold">-{formData.cameraMotionThresholdPercent}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={90}
                  step={5}
                  value={formData.cameraMotionThresholdPercent}
                  onChange={e => setFormData({ ...formData, cameraMotionThresholdPercent: Number(e.target.value) })}
                  className="clinical-slider"
                />
                <span className="text-[10px] font-mono text-slate-500">Thoracic ROI motion reduction vs rolling baseline</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">SpO₂ Desaturation Drop Trigger</span>
                  <span className="text-cyan-300 font-bold">-{formData.spo2DropThresholdPercent}%</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={formData.spo2DropThresholdPercent}
                  onChange={e => setFormData({ ...formData, spo2DropThresholdPercent: Number(e.target.value) })}
                  className="clinical-slider"
                />
                <span className="text-[10px] font-mono text-slate-500">Arterial oxygen drop from baseline required</span>
              </div>
            </div>
          </div>

          {/* Section 3: Fusion Weights (Prototype Attributions) */}
          <div className="pt-6 border-t border-line-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-medical-cyan" />
                <div>
                  <h3 className="text-sm font-sans font-bold text-slate-100">3. Prototype Multimodal Fusion Weights</h3>
                  <p className="text-xs font-sans text-slate-400">Dynamic baseline channel contributions (40% Camera + 35% SpO₂ + 25% HR)</p>
                </div>
              </div>
            </div>

            <FusionWeightBar weights={formData.fusionWeights} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-violet-300">Camera ROI Weight</span>
                  <span className="font-bold">{Math.round(formData.fusionWeights.camera * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={formData.fusionWeights.camera}
                  onChange={e => setFormData({
                    ...formData,
                    fusionWeights: { ...formData.fusionWeights, camera: Number(e.target.value) }
                  })}
                  className="clinical-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-cyan-300">SpO₂ Weight</span>
                  <span className="font-bold">{Math.round(formData.fusionWeights.spo2 * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={formData.fusionWeights.spo2}
                  onChange={e => setFormData({
                    ...formData,
                    fusionWeights: { ...formData.fusionWeights, spo2: Number(e.target.value) }
                  })}
                  className="clinical-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-rose-300">Heart Rate Weight</span>
                  <span className="font-bold">{Math.round(formData.fusionWeights.heartRate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={formData.fusionWeights.heartRate}
                  onChange={e => setFormData({
                    ...formData,
                    fusionWeights: { ...formData.fusionWeights, heartRate: Number(e.target.value) }
                  })}
                  className="clinical-slider"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Signal Freshness Windows (Shield) */}
          <div className="pt-6 border-t border-line-0 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-sans font-bold text-slate-100">4. Signal Quality Shield Max Age Limits</h3>
                <p className="text-xs font-sans text-slate-400">Maximum allowable telemetry latency before channel is flagged STALE</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Camera Frame Age</span>
                  <span className="text-slate-100 font-bold">{formData.maxCameraAgeMs} ms</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={4000}
                  step={100}
                  value={formData.maxCameraAgeMs}
                  onChange={e => setFormData({ ...formData, maxCameraAgeMs: Number(e.target.value) })}
                  className="clinical-slider"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">SpO₂ Packet Age</span>
                  <span className="text-slate-100 font-bold">{formData.maxSpo2AgeMs} ms</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={6000}
                  step={200}
                  value={formData.maxSpo2AgeMs}
                  onChange={e => setFormData({ ...formData, maxSpo2AgeMs: Number(e.target.value) })}
                  className="clinical-slider"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Heart Rate Age</span>
                  <span className="text-slate-100 font-bold">{formData.maxHrAgeMs} ms</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={6000}
                  step={200}
                  value={formData.maxHrAgeMs}
                  onChange={e => setFormData({ ...formData, maxHrAgeMs: Number(e.target.value) })}
                  className="clinical-slider"
                />
              </div>
            </div>
          </div>

          {/* Section 5: ESP32 Hardware Network */}
          <div className="pt-6 border-t border-line-0 space-y-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-sans font-bold text-slate-100">5. ESP32 WebSocket Interface</h3>
                <p className="text-xs font-sans text-slate-400">Microcontroller network streaming socket address</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">Endpoint URL</label>
                <input
                  type="text"
                  value={formData.webSocketUrl}
                  onChange={e => setFormData({ ...formData, webSocketUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-0 border border-line-0 focus:border-medical-cyan rounded-xl text-xs font-mono text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">Socket Port</label>
                <input
                  type="number"
                  value={formData.webSocketPort}
                  onChange={e => setFormData({ ...formData, webSocketPort: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-surface-0 border border-line-0 focus:border-medical-cyan rounded-xl text-xs font-mono text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit & Reset Bar */}
          <div className="pt-6 border-t border-line-0 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-0 hover:bg-surface-2 text-slate-300 border border-line-0 rounded-card text-xs font-mono transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Revert
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-medical-cyan hover:brightness-110 text-black font-extrabold font-sans text-xs rounded-card shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </SpotlightCard>
      </form>

      <ClinicalDisclaimer />

      <ClinicalSourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
      />
    </div>
  );
};

