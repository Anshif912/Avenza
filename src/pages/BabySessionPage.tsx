import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMonitoring } from '../context/MonitoringContext';
import { User, Play, Pause, Square, Clock, Activity, Calendar, Scale, ArrowRight } from 'lucide-react';
import { SectionHeader } from '../components/design-system/DesignSystemComponents';
import { CLINICAL_POPULATION_PROFILES } from '../data/clinicalReferences';

export const BabySessionPage: React.FC = () => {
  const { session, settings, startSession, pauseSession, endSession } = useMonitoring();
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <SectionHeader
        icon={User}
        title="Active Research Session Lifecycle"
        subtitle="Subject session baseline parameters, recording state controls, and duration tracking"
        badge={hasActiveSession ? `STATUS: ${session.status}` : 'INACTIVE'}
        badgeVariant={session.status === 'ACTIVE' ? 'emerald' : session.status === 'PAUSED' ? 'amber' : 'blue'}
      />

      {!hasActiveSession ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <User className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#172033]">No Active Monitoring Session</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Initialize a new research session to start recording telemetry signals and baseline event detection.
            </p>
          </div>
          <Link
            to="/session/setup"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <span>Configure New Session</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Subject Reference</span>
                <h2 className="text-xl font-mono font-bold text-[#172033]">{session.subjectId}</h2>
                <div className="text-xs text-slate-500">
                  Session ID: <span className="font-mono text-blue-700 font-semibold">{session.sessionId}</span> · Reference: <strong>{popProfile.label}</strong>
                </div>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 ${
              session.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${session.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              SESSION: {session.status}
            </span>
          </div>

          {/* Demographic Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Gestational Profile', value: popProfile.gestationalWeeksLabel, icon: Calendar },
              { label: 'Baseline Weight',     value: '1,350 g',                         icon: Scale },
              { label: 'Reference Population',value: popProfile.id,                     icon: Activity },
            ].map(item => (
              <div key={item.label} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-sans">
                  <item.icon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{item.label}</span>
                </div>
                <div className="text-xs font-semibold text-[#172033]">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Duration & Start Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Session Elapsed Time</span>
                <span className="text-xl font-bold text-[#172033] tabular-nums">
                  {formatDuration(session.durationSeconds)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Started At</span>
                <span className="text-sm font-semibold text-slate-800">{session.startTime || '—'}</span>
              </div>
            </div>
          </div>

          {/* State Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block">Session Controls</span>
            <div className="flex flex-wrap gap-3">
              {session.status === 'ACTIVE' ? (
                <button
                  onClick={pauseSession}
                  className="flex items-center gap-2 py-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4" /> Pause Recording
                </button>
              ) : (
                <button
                  onClick={() => startSession()}
                  className="flex items-center gap-2 py-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Resume Recording
                </button>
              )}

              {!showConfirmEnd ? (
                <button
                  onClick={() => setShowConfirmEnd(true)}
                  className="flex items-center gap-2 py-2 px-4 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" /> End Session
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { endSession(); setShowConfirmEnd(false); }}
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Confirm End Session
                  </button>
                  <button
                    onClick={() => setShowConfirmEnd(false)}
                    className="py-2 px-3 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
