import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { Settings, Save, RefreshCw, Cpu, BrainCircuit, Thermometer, Wifi, CheckCircle2, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { SystemSettings, ClinicalPopulation } from '../types/avenza';
import { CLINICAL_POPULATION_PROFILES } from '../data/clinicalReferences';
import { ClinicalSourcesModal } from '../components/common/ClinicalSourcesModal';
import { SectionHeader, FusionWeightBar } from '../components/design-system/DesignSystemComponents';

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
    <div className="space-y-6 max-w-4xl mx-auto">
      <SectionHeader
        icon={Settings}
        title="System Parameters &amp; Algorithm Configuration"
        subtitle="Clinical reference profiles, AI fusion weights, signal freshness windows, and hardware transport endpoints"
        badge="CONFIGURATION"
        badgeVariant="blue"
        action={
          savedSuccess ? (
            <span className="flex items-center gap-1.5 text-xs font-sans font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settings Saved
            </span>
          ) : null
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 space-y-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          
          {/* Section 1: Clinical Population Reference Profile */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-semibold text-[#172033]">1. Population Reference Profile</h3>
                  <p className="text-xs text-slate-500 font-sans">Authoritative vital sign reference bounds by gestational age</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Guidelines &amp; Sources</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Reference Neonatal Cohort
                </label>
                <select
                  value={formData.selectedPopulation || 'GENERAL_NEONATAL'}
                  onChange={e => setFormData({ ...formData, selectedPopulation: e.target.value as ClinicalPopulation })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer"
                >
                  <option value="GENERAL_NEONATAL">General Neonatal (Standard Reference · WHO Newborn Exam)</option>
                  <option value="TERM_NEWBORN">Term Newborn Infant (≥ 37 Weeks Gestation)</option>
                  <option value="LATE_PRETERM">Late Preterm Infant (34 to &lt; 37 Weeks Gestation)</option>
                  <option value="PRETERM">Preterm Infant (28 to &lt; 34 Weeks Gestation)</option>
                  <option value="VERY_PRETERM">Very / Extremely Preterm Infant (&lt; 28 Weeks Gestation)</option>
                </select>
              </div>

              {/* Active Profile Summary Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold text-blue-800">{selectedPopProfile.label}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{selectedPopProfile.gestationalWeeksLabel}</span>
                </div>
                <p className="text-[11px] font-sans text-slate-500 leading-relaxed">{selectedPopProfile.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">HR Range</span>
                    <strong className="text-slate-800">{selectedPopProfile.heartRateRange.min}–{selectedPopProfile.heartRateRange.max} BPM</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">RR Range</span>
                    <strong className="text-slate-800">{selectedPopProfile.respiratoryRateRange.min}–{selectedPopProfile.respiratoryRateRange.max} /min</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Target SpO₂</span>
                    <strong className="text-slate-800">{selectedPopProfile.spo2TargetRange.min}–{selectedPopProfile.spo2TargetRange.max}%</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Thermal Band</span>
                    <strong className="text-slate-800">{selectedPopProfile.temperatureRange.min}–{selectedPopProfile.temperatureRange.max}°C</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Multimodal Algorithm Weights */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-violet-600" />
              <div>
                <h3 className="text-sm font-semibold text-[#172033]">2. Multimodal Fusion Weights Configuration</h3>
                <p className="text-xs text-slate-500 font-sans">Baseline channel weights before dynamic Signal Quality Shield adjustment</p>
              </div>
            </div>

            <FusionWeightBar weights={formData.fusionWeights} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="text-xs font-semibold text-slate-700 block">
                  Camera Motion Weight
                </label>
                <input
                  type="number"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={formData.fusionWeights.camera}
                  onChange={e => setFormData({
                    ...formData,
                    fusionWeights: { ...formData.fusionWeights, camera: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="text-xs font-semibold text-slate-700 block">
                  Optical SpO₂ Weight
                </label>
                <input
                  type="number"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={formData.fusionWeights.spo2}
                  onChange={e => setFormData({
                    ...formData,
                    fusionWeights: { ...formData.fusionWeights, spo2: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="text-xs font-semibold text-slate-700 block">
                  Heart Rate Weight
                </label>
                <input
                  type="number"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={formData.fusionWeights.heartRate}
                  onChange={e => setFormData({
                    ...formData,
                    fusionWeights: { ...formData.fusionWeights, heartRate: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Configuration
            </button>
          </div>
        </div>
      </form>

      {showSourcesModal && (
        <ClinicalSourcesModal isOpen={showSourcesModal} onClose={() => setShowSourcesModal(false)} />
      )}
    </div>
  );
};
