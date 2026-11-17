import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitoring } from '../context/MonitoringContext';
import { History, Search, Clock, Filter, ArrowRight, Play, RotateCcw } from 'lucide-react';
import { SectionHeader, DataSourceBadge, SignalQualityBadge } from '../components/design-system/DesignSystemComponents';
import { eventReplayService } from '../services/EventReplayService';
import { ReplaySession } from '../types/avenza';

export const EventHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { alerts, setSelectedEvent, setSelectedReplayEvent } = useMonitoring();
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
      navigate('/event-replay');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={History}
        title="Event History &amp; Replay Library"
        subtitle="Chronological incident log, synchronized multi-channel replay sessions, and provenance audit"
        badge={`${replaySessions.length} REPLAY SESSIONS`}
        badgeVariant="blue"
      />

      {/* Synchronized Replay Sessions Library */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
              Recorded Incident Replay Library
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Click to launch deterministic timeline playback
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {replaySessions.map((session) => (
            <div
              key={session.eventId}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-5 space-y-3 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-700">{session.eventId}</span>
                    <DataSourceBadge source="SIMULATED" />
                    <DataSourceBadge source="MEASURED" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#172033] mt-1">
                    {session.sessionTitle}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  {session.totalDurationSec}s replay
                </span>
              </div>

              <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-2">
                {session.notes}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                <span>Recorded: <strong className="text-slate-700">{session.recordedAt}</strong></span>
                <button
                  type="button"
                  onClick={() => handleLaunchReplay(session.eventId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch Replay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by ID or trigger..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-sans">Filter:</span>
          {['ALL', 'CRITICAL', 'WARNING', 'SENSOR'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-full text-xs font-sans font-medium border transition-colors cursor-pointer ${
                severityFilter === sev
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incident Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
            Chronological Incident Log
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredAlerts.length} Recorded Episodes
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs font-sans text-slate-400">
            No events match the search or filter query
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-700">{alert.id}</span>
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                      alert.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                      alert.severity === 'WARNING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs font-semibold text-[#172033] font-sans">{alert.type}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {alert.evidenceSummary}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.timestamp}</span>
                    <span>Duration: {alert.durationSeconds || 12}s</span>
                    <SignalQualityBadge quality={alert.signalQuality} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(alert)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer self-start sm:self-center"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
