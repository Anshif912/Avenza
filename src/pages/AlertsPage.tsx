import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useMonitoring } from '../context/MonitoringContext';
import {
  AlertTriangle, CheckCircle2, Clock, Filter, History, Play,
  ShieldAlert, ChevronDown, ChevronUp, Activity, Heart, Camera
} from 'lucide-react';
import { SectionHeader, DataSourceBadge } from '../components/design-system/DesignSystemComponents';
import { AlertItem } from '../types/avenza';

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, WARNING: 1, SENSOR: 2, RECOVERY: 3 };

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { alerts, acknowledgeAlert, setSelectedEvent, setSelectedReplayEvent } = useMonitoring();
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'UNACK'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unackCount = alerts.filter(a => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'WARNING')).length;

  const filtered = [...alerts]
    .sort((a, b) => {
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

  const severityConfig: Record<string, { dot: string; badge: string; stripe: string; bg: string }> = {
    CRITICAL: {
      dot:    'bg-rose-500 animate-pulse',
      badge:  'bg-red-50 text-red-700 border-red-200',
      stripe: 'bg-rose-500',
      bg:     'bg-red-50/20',
    },
    WARNING: {
      dot:    'bg-amber-500',
      badge:  'bg-amber-50 text-amber-700 border-amber-200',
      stripe: 'bg-amber-400',
      bg:     'bg-amber-50/20',
    },
    SENSOR: {
      dot:    'bg-blue-500',
      badge:  'bg-blue-50 text-blue-700 border-blue-200',
      stripe: 'bg-blue-400',
      bg:     '',
    },
    RECOVERY: {
      dot:    'bg-emerald-500',
      badge:  'bg-emerald-50 text-emerald-700 border-emerald-200',
      stripe: 'bg-emerald-500',
      bg:     '',
    },
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={AlertTriangle}
        title="Event Triage & Incident Evidence"
        subtitle="Severity-ordered triage inbox · Expand incident records for multi-channel evidence and synchronized waveform replay"
        badge={unackCount > 0 ? `${unackCount} UNREVIEWED INCIDENTS` : 'ALL CLEAR'}
        badgeVariant={unackCount > 0 ? 'rose' : 'emerald'}
      />

      {/* Critical Alert Warning Banner */}
      {unackCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-red-900 font-sans">
            {unackCount} unacknowledged incident{unackCount > 1 ? 's' : ''} require operator review and verification
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 flex items-center gap-1.5 font-sans">
          <Filter className="w-3.5 h-3.5" /> Filter by:
        </span>
        {(['ALL', 'CRITICAL', 'WARNING', 'UNACK'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-sans font-medium border transition-all cursor-pointer ${
              filter === f
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f === 'ALL' ? 'All Incidents' : f === 'UNACK' ? 'Unacknowledged' : f}
            {f === 'UNACK' && unackCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-mono font-bold">
                {unackCount}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono text-slate-400">{filtered.length} total events</span>
      </div>

      {/* Evidence Timeline List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-sans text-slate-500">No events found matching this filter criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(alert => {
              const cfg = severityConfig[alert.severity] ?? severityConfig.SENSOR;
              const isExpanded = expandedId === alert.id;

              return (
                <motion.div
                  layout
                  key={alert.id}
                  className={`flex flex-col transition-colors ${!alert.acknowledged && alert.severity === 'CRITICAL' ? cfg.bg : ''}`}
                >
                  {/* Primary Row */}
                  <div className="flex items-stretch gap-0">
                    {/* Severity colored left hairline */}
                    <div className={`w-1 flex-shrink-0 ${cfg.stripe}`} />

                    <div className="flex-1 p-4 flex items-center gap-4 min-w-0">
                      {/* Status Dot */}
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

                      {/* Event Core Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-[#172033]">{alert.type}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${cfg.badge}`}>
                            {alert.severity}
                          </span>
                          <DataSourceBadge source={alert.isSynthetic ? 'SYNTHETIC_DEMO' : 'MEASURED'} />
                        </div>
                        <p className="text-xs text-slate-600 font-sans leading-relaxed truncate">
                          {alert.evidenceSummary}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.timestamp}</span>
                          <span>ID: {alert.id}</span>
                          {alert.durationSeconds && <span>Duration: {alert.durationSeconds}s</span>}
                        </div>
                      </div>

                      {/* Row Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleExpand(alert.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isExpanded
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span>{isExpanded ? 'Collapse' : 'Evidence'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {!alert.acknowledged ? (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ACK</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-mono text-slate-400 font-medium">
                            REVIEWED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Engineering Incident Record Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden bg-slate-50/80 border-t border-slate-200/80 p-5 space-y-4 text-xs font-sans"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-semibold text-slate-700">
                            Incident Evidence Audit Breakdown
                          </span>
                          {alert.eventDetails && (
                            <button
                              onClick={() => { setSelectedReplayEvent(alert); navigate('/event-replay'); }}
                              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Open Synchronized Replay Studio</span>
                            </button>
                          )}
                        </div>

                        {/* Tri-channel Evidence Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <Camera className="w-3.5 h-3.5 text-blue-600" />
                              <span>Camera Thoracic Motion</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Before: <strong className="text-slate-800">{alert.eventDetails?.cameraBefore !== null && alert.eventDetails?.cameraBefore !== undefined ? `${(alert.eventDetails.cameraBefore * 100).toFixed(0)}%` : '—'}</strong>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              During: <strong className="text-rose-600">{alert.eventDetails?.cameraDuring !== null && alert.eventDetails?.cameraDuring !== undefined ? `${(alert.eventDetails.cameraDuring * 100).toFixed(0)}%` : '—'}</strong>
                            </div>
                          </div>

                          <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <Activity className="w-3.5 h-3.5 text-blue-600" />
                              <span>Optical SpO₂ Saturation</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Baseline: <strong className="text-slate-800">{alert.eventDetails?.spo2Before || 98}%</strong>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Nadir: <strong className="text-rose-600">{alert.eventDetails?.spo2Nadir || 85}%</strong>
                            </div>
                          </div>

                          <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <Heart className="w-3.5 h-3.5 text-rose-600" />
                              <span>Pulse Telemetry</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Baseline: <strong className="text-slate-800">{alert.eventDetails?.hrBefore || 140} BPM</strong>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Nadir: <strong className="text-rose-600">{alert.eventDetails?.hrDuring || 92} BPM</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                          <span>Quality: {alert.signalQuality}</span>
                          <button
                            onClick={() => setSelectedEvent(alert)}
                            className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          >
                            View Full Incident Dossier →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
