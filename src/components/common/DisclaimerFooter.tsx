import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export const DisclaimerFooter: React.FC = () => {
  return (
    <footer className="bg-[#050810] border-t border-navy-750/80 px-4 py-3 text-[11px] text-slate-400 font-mono">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-200">PROTOTYPE & DEMO DISCLAIMER:</strong> AVENZA IS AN EDUCATIONAL / RESEARCH PROTOTYPE. PROTOTYPE APNEA SCORE IS AN EVIDENCE-DERIVED MODEL OUTPUT AND IS <strong className="text-amber-400">NOT A CLINICAL DIAGNOSIS</strong>. SENSOR MEASUREMENTS MAY BE AFFECTED BY MOTION, PERFUSION, PLACEMENT AND SIGNAL QUALITY. THIS SYSTEM IS NOT A SUBSTITUTE FOR A CLINICALLY VALIDATED MEDICAL MONITOR.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-[10px] text-slate-500 whitespace-nowrap">
          <span>AVENZA INTELLIGENCE v2.4</span>
          <span>•</span>
          <span>LOCAL RAM PROCESSING</span>
        </div>
      </div>
    </footer>
  );
};
