import React from 'react';
import { X, ExternalLink, BookOpen, Shield, FileText } from 'lucide-react';
import { AUTHORITATIVE_SOURCES, CLINICAL_REFERENCE_DATABASE, AuthoritativeSource } from '../../data/clinicalReferences';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalSourcesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sourcesList: AuthoritativeSource[] = Object.values(AUTHORITATIVE_SOURCES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-fade-in">
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-sans font-bold text-slate-900 flex items-center gap-2">
                Authoritative Clinical Reference Citations
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                  PEER-REVIEWED & GUIDELINE DATABASE
                </span>
              </h2>
              <p className="text-xs font-sans text-slate-500 mt-0.5">
                Evidence-informed neonatal reference standards (WHO, AAP, Nelson Pediatrics)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Key Distinction Alert */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-mono font-bold text-xs">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>CLINICAL REFERENCE LAYER VS PROTOTYPE DETECTION LAYER</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              The clinical reference ranges displayed in NeoNattle are derived from internationally recognized neonatal care guidelines.
              These ranges serve as clinical context for clinicians and researchers. The NeoNattle algorithmic prototype uses a distinct
              <strong> 10-second multimodal temporal window</strong> (40% Camera + 35% SpO₂ + 25% HR) for early pattern awareness, which is not a replacement
              for diagnostic clinical apnea criteria (≥20s cessation of airflow or shorter pause with bradycardia/desaturation).
            </p>
          </div>

          {/* Primary Guidelines List */}
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Primary Cited Clinical Guidelines</span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {sourcesList.map((src, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl space-y-2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-mono font-bold text-blue-700 uppercase">
                        {src.organization} · {src.year}
                      </div>
                      <h4 className="text-sm font-sans font-bold text-slate-900 mt-0.5 leading-snug">
                        {src.title}
                      </h4>
                      {src.guidelineSection && (
                        <div className="text-xs font-mono text-slate-500 mt-1">
                          Ref: <span className="text-slate-800 font-semibold">{src.guidelineSection}</span>
                        </div>
                      )}
                    </div>

                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-mono font-semibold transition-all flex-shrink-0 cursor-pointer shadow-xs"
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
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
              Parameter Clinical Evidence Details
            </div>
            <div className="space-y-2 text-xs font-sans text-slate-700">
              {CLINICAL_REFERENCE_DATABASE.map(item => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-900 font-bold">
                    <span className="text-blue-700">{item.parameter.replace(/_/g, ' ')}</span>
                    <span className="text-slate-600 text-[11px]">
                      {item.normalRange ? `${item.normalRange.min}–${item.normalRange.max} ${item.normalRange.unit}` : `${item.durationCriterionSec}s threshold`}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-600">{item.clinicalContext}</p>
                  <p className="text-[10px] text-slate-400 italic">Notes: {item.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Disclaimer */}
          <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl text-[11px] font-sans text-slate-600 leading-relaxed">
            <strong className="text-slate-900">Educational & Research Software Notice:</strong> Clinical reference values are context-dependent (gestational age, postnatal age, sleep state, body position, medications) and do not constitute individual medical advice or diagnostic thresholds.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close Source Directory
          </button>
        </div>
      </div>
    </div>
  );
};
