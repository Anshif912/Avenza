import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { Baby, Play, Pause, Square, Clock, ShieldCheck, UserCheck, Activity, Calendar, MapPin, Scale, ArrowRight } from 'lucide-react';
import { SectionHeader, SpotlightCard, ClinicalDisclaimer } from '../components/design-system/DesignSystemComponents';

import { CLINICAL_POPULATION_PROFILES } from '../data/clinicalReferences';

export const BabySessionPage: React.FC = () => {
  const { session, settings, startSession, pauseSession, endSession, setActiveTab } = useMonitoring();
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasActiveSession = session.status === 'ACTIVE' || session.status === 'PAUSED';
  const population = settings.selectedPopulation || 'GENERAL_NEONATAL';
  const popProfile = CLINICAL_POPULATION_PROFILES[population] || CLINICAL_POPULATION_PROFILES.GENERAL_NEONATAL;

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      <SectionHeader
        icon={Baby}
        title="Active Patient Monitoring Session & Lifecycle"
        subtitle="Subject demographics, telemetry session state machine, and clinician handover audit"
        badge={hasActiveSession ? `SESSION: ${session.status}` : 'NO ACTIVE SESSION'}
        badgeVariant={session.status === 'ACTIVE' ? 'emerald' : session.status === 'PAUSED' ? 'amber' : 'cyan'}
      />

      {!hasActiveSession ? (
        <div className="bg-surface-1 border border-line-0 rounded-2xl p-12 text-center space-y-4">
          <Baby className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">NO ACTIVE MONITORING SESSION</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No neonatal patient is currently assigned to this telemetry node. Start a new intake session to begin recording.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('sessionSetup')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-medical-cyan hover:brightness-110 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <span>START NEW SESSION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Main Profile & State Card */
        <SpotlightCard glowColor="cyan" className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line-0 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-surface-0 border border-line-0 rounded-2xl text-medical-cyan flex-shrink-0">
                <Baby className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Active Subject</span>
                <h2 className="text-2xl font-mono font-extrabold text-slate-100">{session.subjectId}</h2>
                <div className="text-xs font-mono text-slate-400">
                  Session ID: <span className="text-medical-cyan">{session.sessionId}</span> · Profile: <strong className="text-cyan-300">{popProfile.label}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border flex items-center gap-2 ${
                session.status === 'ACTIVE' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 animate-pulse' :
                'bg-amber-950/80 text-amber-300 border-amber-500/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  session.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                SESSION: {session.status}
              </span>
            </div>
          </div>

          {/* Demographics & Admission Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gestational Age', value: popProfile.gestationalWeeksLabel, icon: Calendar, color: 'text-medical-cyan' },
              { label: 'Current Weight', value: '1,350 g', icon: Scale, color: 'text-teal-300' },
              { label: 'NICU Location', value: 'Pod 3 · Bay B', icon: MapPin, color: 'text-violet-300' },
              { label: 'Clinical Profile', value: popProfile.id, icon: UserCheck, color: 'text-amber-300' },
            ].map(item => (
              <div key={item.label} className="p-3 bg-surface-0 border border-line-0 rounded-chip space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
                <div className="text-sm font-sans font-bold text-slate-100">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Duration & Start Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-0 border border-line-0 rounded-card font-mono text-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-medical-cyan flex-shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Session Elapsed Time</div>
                <div className="text-xl font-extrabold text-slate-100 tracking-tight tabular-nums">
                  {formatDuration(session.durationSeconds)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Monitoring Initialized</div>
                <div className="text-sm font-bold text-slate-200">{session.startTime || '--:--:--'}</div>
              </div>
            </div>
          </div>

          {/* Session Lifecycle Action Controls */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Session State Controls</div>
            <div className="flex flex-wrap gap-3">
              {session.status === 'ACTIVE' ? (
                <button
                  onClick={pauseSession}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/40 rounded-card text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4" /> Pause Monitoring
                </button>
              ) : (
                <button
                  onClick={() => startSession()}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 rounded-card text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Resume Monitoring
                </button>
              )}

              {!showConfirmEnd ? (
                <button
                  onClick={() => setShowConfirmEnd(true)}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 rounded-card text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4" /> Terminate Session
                </button>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <button
                    onClick={() => {
                      endSession();
                      setShowConfirmEnd(false);
                    }}
                    className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-card text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    Confirm Discharge / End
                  </button>
                  <button
                    onClick={() => setShowConfirmEnd(false)}
                    className="py-3 px-4 bg-surface-0 hover:bg-surface-2 text-slate-300 border border-line-0 rounded-card text-xs font-mono transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </SpotlightCard>
      )}

      <ClinicalDisclaimer />
    </div>
  );
};
