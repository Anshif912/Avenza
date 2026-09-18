import React from 'react';
import { X, ExternalLink, BookOpen, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { AUTHORITATIVE_SOURCES, CLINICAL_REFERENCE_DATABASE, AuthoritativeSource } from '../../data/clinicalReferences';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalSourcesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sourcesList: AuthoritativeSource[] = Object.values(AUTHORITATIVE_SOURCES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-surface-1 border border-line-0 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-line-0 flex items-center justify-between bg-surface-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-sans font-bold text-slate-100 flex items-center gap-2">
                Authoritative Clinical Reference Citations
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  PEER-REVIEWED & GUIDELINE DATABASE
                </span>
              </h2>
              <p className="text-xs font-sans text-slate-400">
                Evidence-informed neonatal reference standards (WHO, AAP, Nelson Pediatrics)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-surface-2 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Key Distinction Alert */}
          <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs">
              <Shield className="w-4 h-4" />
              <span>CLINICAL REFERENCE LAYER VS PROTOTYPE DETECTION LAYER</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              The clinical reference ranges displayed in AVENZA are derived from internationally recognized neonatal care guidelines.
              These ranges serve as clinical context for clinicians and researchers. The AVENZA algorithmic prototype uses a distinct
              <strong> 10-second multimodal temporal window</strong> (40% Camera + 35% SpO₂ + 25% HR) for early pattern awareness, which is not a replacement
              for diagnostic clinical apnea criteria (≥20s cessation of airflow or shorter pause with bradycardia/desaturation).
            </p>
          </div>

          {/* Primary Guidelines List */}
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-medical-cyan" />
              <span>Primary Cited Clinical Guidelines</span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {sourcesList.map((src, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface-0 border border-line-0 hover:border-line-1 rounded-xl space-y-2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-mono font-bold text-medical-cyan uppercase">
                        {src.organization} · {src.year}
                      </div>
                      <h4 className="text-sm font-sans font-bold text-slate-100 mt-0.5 leading-snug">
                        {src.title}
                      </h4>
                      {src.guidelineSection && (
                        <div className="text-xs font-mono text-slate-400 mt-1">
                          Ref: <span className="text-slate-300">{src.guidelineSection}</span>
                        </div>
                      )}
                    </div>

                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono font-semibold transition-all flex-shrink-0 cursor-pointer"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reference Items Breakdown */}
          <div className="space-y-3 pt-2 border-t border-line-0">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Parameter Clinical Evidence Details
            </div>
            <div className="space-y-2 text-xs font-sans text-slate-300">
              {CLINICAL_REFERENCE_DATABASE.map(item => (
                <div key={item.id} className="p-3 bg-surface-0 border border-line-0 rounded-xl space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-200 font-bold">
                    <span className="text-cyan-300">{item.parameter.replace(/_/g, ' ')}</span>
                    <span className="text-slate-400 text-[11px]">
                      {item.normalRange ? `${item.normalRange.min}–${item.normalRange.max} ${item.normalRange.unit}` : `${item.durationCriterionSec}s threshold`}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-300">{item.clinicalContext}</p>
                  <p className="text-[10px] text-slate-400 italic">Notes: {item.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Disclaimer */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-[11px] font-sans text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Educational & Research Software Notice:</strong> Clinical reference values are context-dependent (gestational age, postnatal age, sleep state, body position, medications) and do not constitute individual medical advice or diagnostic thresholds.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line-0 flex justify-end bg-surface-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-2 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Close Source Directory
          </button>
        </div>
      </div>
    </div>
  );
};
