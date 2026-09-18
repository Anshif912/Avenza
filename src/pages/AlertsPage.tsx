import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { AlertTriangle, CheckCircle2, Clock, Filter, History, Play, ShieldAlert, X } from 'lucide-react';
import { SectionHeader, DataSourceBadge, ApneaStateBadge } from '../components/design-system/DesignSystemComponents';
import { AlertItem } from '../types/avenza';

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, WARNING: 1, SENSOR: 2, RECOVERY: 3 };

export const AlertsPage: React.FC = () => {
  const { alerts, acknowledgeAlert, setSelectedEvent, setSelectedReplayEvent, setActiveTab } = useMonitoring();
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'UNACK'>('ALL');

  const unackCount = alerts.filter(a => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'WARNING')).length;

  const filtered = [...alerts]
    .sort((a, b) => {
      // Unack first, then by severity, then by time
      if (!a.acknowledged && b.acknowledged) return -1;
      if (a.acknowledged && !b.acknowledged) return 1;
      return (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
    })
    .filter(a => {
      if (filter === 'CRITICAL') return a.severity === 'CRITICAL';
      if (filter === 'WARNING')  return a.severity === 'WARNING';
      if (filter === 'UNACK')    return !a.acknowledged;
      return true;
    });

  const severityConfig: Record<string, { dot: string; ring: string; text: string; bg: string }> = {
    CRITICAL: { dot: 'bg-rose-400 animate-pulse', ring: 'ring-rose-500/40',   text: 'text-rose-400',   bg: 'bg-rose-950/20' },
    WARNING:  { dot: 'bg-amber-400',              ring: 'ring-amber-500/30',  text: 'text-amber-400',  bg: 'bg-amber-950/15' },
    SENSOR:   { dot: 'bg-cyan-400',               ring: 'ring-cyan-500/30',   text: 'text-cyan-400',   bg: '' },
    RECOVERY: { dot: 'bg-emerald-400',             ring: 'ring-emerald-500/30',text: 'text-emerald-400',bg: '' },
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <SectionHeader
        icon={AlertTriangle}
        title="Alerts & Clinical Triage"
        subtitle="Severity-ordered alarm inbox · Acknowledge and navigate to event replay"
        badge={unackCount > 0 ? `${unackCount} UNACKNOWLEDGED` : 'ALL CLEAR'}
        badgeVariant={unackCount > 0 ? 'rose' : 'emerald'}
      />

      {/* Unacknowledged critical banner */}
      {unackCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-rose-950/40 border border-rose-500/30 rounded-card animate-pulse-fast">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span className="text-sm font-sans font-semibold text-rose-200">
            {unackCount} unacknowledged alert{unackCount > 1 ? 's' : ''} — clinical review required
          </span>
        </div>
      )}

      {/* Filter controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {(['ALL', 'CRITICAL', 'WARNING', 'UNACK'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all ${
              filter === f
                ? f === 'ALL'      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : f === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : f === 'WARNING'  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                :                   'bg-violet-500/20 text-violet-300 border-violet-500/50'
                : 'bg-surface-1 text-slate-400 border-line-0 hover:border-line-1'
            }`}
          >
            {f}
            {f === 'UNACK' && unackCount > 0 && (
              <span className="ml-1.5 px-1 bg-rose-500 text-white rounded-full text-[9px]">{unackCount}</span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono text-slate-500">{filtered.length} events</span>
      </div>

      {/* Alert list — divide-y pattern, NOT card grid */}
      <div className="bg-surface-1 border border-line-0 rounded-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-sans text-slate-400">No alerts match the current filter</p>
          </div>
        ) : (
          <div className="divide-y divide-line-0">
            {filtered.map(alert => {
              const cfg = severityConfig[alert.severity] ?? severityConfig.SENSOR;
              return (
                <div
                  key={alert.id}
                  className={`flex items-stretch gap-0 ${!alert.acknowledged && alert.severity === 'CRITICAL' ? cfg.bg : ''}`}
                >
                  {/* Severity stripe */}
                  <div className={`w-1 flex-shrink-0 ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-500' :
                    alert.severity === 'WARNING'  ? 'bg-amber-500' :
                    alert.severity === 'SENSOR'   ? 'bg-cyan-500' : 'bg-emerald-500'
                  }`} />

                  <div className="flex-1 p-4 flex items-center gap-4 min-w-0">
                    {/* Status dot */}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 ${cfg.dot} ${cfg.ring}`} />

                    {/* Alert body */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-sm font-sans font-semibold text-slate-200">{alert.type}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          alert.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border-rose-500/30' :
                          alert.severity === 'WARNING'  ? 'bg-amber-950 text-amber-300 border-amber-500/30' :
                          alert.severity === 'SENSOR'   ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30' :
                                                         'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {alert.severity}
                        </span>
                        <DataSourceBadge source={alert.isSynthetic ? 'SYNTHETIC_DEMO' : 'MEASURED'} />
                      </div>
                      <p className="text-xs font-sans text-slate-400 leading-relaxed truncate">{alert.evidenceSummary}</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.timestamp}</span>
                        <span>{alert.id}</span>
                        {alert.durationSeconds && <span>Duration: {alert.durationSeconds}s</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {alert.eventDetails && (
                        <button
                          onClick={() => { setSelectedReplayEvent(alert); setActiveTab('eventReplay'); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-950/80 hover:bg-violet-900 text-violet-300 border border-violet-500/30 rounded-lg text-[11px] font-mono font-bold transition-colors"
                        >
                          <Play className="w-3 h-3" /> Replay
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedEvent(alert)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-2 hover:bg-surface-1 text-slate-300 border border-line-0 rounded-lg text-[11px] font-mono transition-colors"
                      >
                        <History className="w-3 h-3" /> Details
                      </button>
                      {!alert.acknowledged ? (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-mono font-bold transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" /> ACK
                        </button>
                      ) : (
                        <span className="px-2.5 py-1.5 text-[11px] font-mono text-slate-500 font-bold">ACKNOWLEDGED</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
