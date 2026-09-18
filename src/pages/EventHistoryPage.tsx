import React, { useState, useEffect } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { History, Search, Clock, Filter, ArrowRight, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { SectionHeader, DataSourceBadge, SignalQualityBadge } from '../components/design-system/DesignSystemComponents';
import { eventReplayService } from '../services/EventReplayService';
import { ReplaySession } from '../types/avenza';

export const EventHistoryPage: React.FC = () => {
  const { alerts, setSelectedEvent, setActiveTab, setSelectedReplayEvent } = useMonitoring();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [replaySessions, setReplaySessions] = useState<ReplaySession[]>([]);

  useEffect(() => {
    setReplaySessions(eventReplayService.getRecordedSessions());
  }, []);

  const filteredAlerts = alerts.filter(a => {
    const matchSearch = search === '' ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchSearch && matchSev;
  });

  const handleLaunchReplay = (sessionId: string) => {
    const session = eventReplayService.getSession(sessionId);
    if (session) {
      eventReplayService.loadSession(session);
      setSelectedReplayEvent({
        id: session.eventId,
        timestamp: session.recordedAt,
        type: session.sessionTitle,
        severity: 'CRITICAL',
        durationSeconds: session.totalDurationSec,
        evidenceSummary: session.notes || 'Recorded prototype episode',
        signalQuality: 'GOOD',
        acknowledged: true,
        isSynthetic: false
      });
      setActiveTab('eventReplay');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        icon={History}
        title="Event History & Replay Library"
        subtitle="Comprehensive clinical audit log, synchronized replay sessions, and immutable provenance tracking"
        badge={`${replaySessions.length} REPLAY SESSIONS AVAILABLE`}
        badgeVariant="cyan"
      />

      {/* ─── RECORDED REPLAY SESSIONS SECTION ───────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-sans font-bold text-slate-200">
              Synchronized Event Replay Library
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Click to launch deterministic timeline playback
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {replaySessions.map((session) => (
            <div
              key={session.eventId}
              className="bg-surface-1 border border-line-0 hover:border-medical-cyan/50 rounded-card p-4 space-y-3 transition-all shadow-card group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{session.eventId}</span>
                    <DataSourceBadge source="SIMULATED" />
                    <DataSourceBadge source="MEASURED" />
                  </div>
                  <h4 className="text-sm font-sans font-bold text-slate-100 mt-1 line-clamp-1">
                    {session.sessionTitle}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-surface-0 px-2 py-0.5 rounded border border-line-0 shrink-0">
                  {session.totalDurationSec}s replay
                </span>
              </div>

              <p className="text-xs font-mono text-slate-400 text-left line-clamp-2">
                {session.notes}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-line-0 text-[10px] font-mono text-slate-400">
                <span>Recorded: <strong className="text-slate-200">{session.recordedAt}</strong></span>
                <button
                  type="button"
                  onClick={() => handleLaunchReplay(session.eventId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-lg font-bold transition-colors cursor-pointer group-hover:bg-medical-cyan group-hover:text-black group-hover:border-transparent"
                >
                  <Play className="w-3 h-3" />
                  <span>LAUNCH REPLAY</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CLINICAL ALERT AUDIT LOG SECTION ───────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-sans font-bold text-slate-200">
              Live Patient Event Audit Log
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {alerts.length} live alerts recorded
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-surface-1 border border-line-0 rounded-2xl p-8 text-center space-y-3">
            <Clock className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-200">NO LIVE MONITORING ALERTS RECORDED YET</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
                The live monitoring stream is nominal or waiting for patient events. You can explore the Replay Library above.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Search & Filter toolbar */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search event ID or type..."
                  className="w-full pl-9 pr-4 py-2 bg-surface-0 border border-line-0 focus:border-medical-cyan rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                {(['ALL', 'CRITICAL', 'WARNING', 'SENSOR', 'RECOVERY'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                      severityFilter === s
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                        : 'bg-surface-1 text-slate-400 border-line-0 hover:border-line-1'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Data table */}
            <div className="bg-surface-1 border border-line-0 rounded-card overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[680px]">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-surface-0 border-b border-line-0 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-1">Sev.</div>
                    <div className="col-span-2">Event ID</div>
                    <div className="col-span-3">Type</div>
                    <div className="col-span-2">Timestamp</div>
                    <div className="col-span-1">Dur.</div>
                    <div className="col-span-1">Signal</div>
                    <div className="col-span-1">Source</div>
                    <div className="col-span-1">Status</div>
                  </div>

                  <div className="divide-y divide-line-0">
                    {filteredAlerts.length === 0 ? (
                      <div className="py-8 text-center text-xs font-mono text-slate-500">No events match the current filter</div>
                    ) : (
                      filteredAlerts.map(alert => (
                        <button
                          key={alert.id}
                          onClick={() => setSelectedEvent(alert)}
                          className="w-full grid grid-cols-12 gap-2 px-4 py-3 text-left hover:bg-surface-2 transition-colors group cursor-pointer"
                        >
                          <div className="col-span-1 flex items-center">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              alert.severity === 'CRITICAL' ? 'bg-rose-400 animate-pulse' :
                              alert.severity === 'WARNING'  ? 'bg-amber-400' :
                              alert.severity === 'SENSOR'   ? 'bg-cyan-400' : 'bg-emerald-400'
                            }`} />
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className="text-[11px] font-mono font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">{alert.id}</span>
                          </div>
                          <div className="col-span-3 flex items-center">
                            <span className="text-[11px] font-sans text-slate-300 truncate">{alert.type}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
                          </div>
                          <div className="col-span-1 flex items-center">
                            <span className="text-[11px] font-mono text-slate-300 tabular-nums">
                              {alert.durationSeconds ? `${alert.durationSeconds}s` : '—'}
                            </span>
                          </div>
                          <div className="col-span-1 flex items-center">
                            <SignalQualityBadge quality={alert.signalQuality} showLabel={false} />
                          </div>
                          <div className="col-span-1 flex items-center">
                            <DataSourceBadge source="MEASURED" />
                          </div>
                          <div className="col-span-1 flex items-center">
                            <span className={`text-[10px] font-mono font-bold ${alert.acknowledged ? 'text-slate-500' : 'text-rose-400'}`}>
                              {alert.acknowledged ? 'ACK' : 'NEW'}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
