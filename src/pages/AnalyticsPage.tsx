import React from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import {
  BarChart3, Activity, Download
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { SectionHeader, DataSourceBadge } from '../components/design-system/DesignSystemComponents';

export const AnalyticsPage: React.FC = () => {
  const { waveforms, alerts, apnea, session } = useMonitoring();

  const hasData = waveforms.length > 0;
  const last120 = waveforms.slice(-120);

  // Apnea score distribution (bucketed)
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${i * 10 + 9}%`,
    count: last120.filter(w => (w.aiProbability ?? 0) >= i * 10 && (w.aiProbability ?? 0) < (i + 1) * 10).length
  }));

  const apneaEventAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING');

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  const handleExportCSV = () => {
    if (!waveforms.length) return;
    const header = 'NeoNattle Telemetry Export (Developed by Avenza)\nSubject,' + (session.subjectId || 'SUBJ-001') + ',Session,' + (session.sessionId || 'SES-01') + '\nTimestamp,Heart Rate (BPM),SpO2 (%),AI Apnea Score (%),Camera Motion\n';
    const rows = waveforms.map(w => `${w.timestamp},${w.heartRate ?? ''},${w.spo2 ?? ''},${w.aiProbability ?? ''},${w.cameraMovement ?? ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NeoNattle_Telemetry_${session.subjectId || 'SUBJ-001'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={BarChart3}
        title="Signal Analytics &amp; Session Reports"
        subtitle="Longitudinal telemetry trends, score distribution histograms, and CSV data export"
        badge={hasData ? 'TELEMETRY ACTIVE' : 'NO SAMPLES'}
        badgeVariant={hasData ? 'emerald' : 'blue'}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!hasData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-sans font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> CSV Export
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!hasData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-sans font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Print Report
            </button>
          </div>
        }
      />

      {/* Session overview metric strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Session Duration', value: session.status === 'ACTIVE' ? formatDuration(session.durationSeconds) : '—', color: 'text-blue-700' },
          { label: 'Candidate Incidents', value: String(apneaEventAlerts.length), color: 'text-rose-600' },
          { label: 'Unacknowledged', value: String(alerts.filter(a => !a.acknowledged).length), color: 'text-amber-700' },
          { label: 'Current Score', value: typeof apnea.probability === 'number' && apnea.state !== 'NO_EVALUATION' ? `${Math.round(apnea.probability)}%` : '—', color: 'text-violet-700' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <span className="text-[11px] text-slate-500 font-sans block">{m.label}</span>
            <div className={`text-2xl font-mono font-bold tabular-nums ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#172033]">No Analytics Data Recorded</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-sans">
              Historical analysis requires incoming telemetry frames. Connect your ESP32 hardware via USB Web Serial or start demonstration mode.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Pulse Rate Trend */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-xs font-semibold text-[#172033]">
              Heart Rate Trend (Last 120 Samples)
            </h3>
            <div className="h-56 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last120} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="timestamp" stroke="#CBD5E1" tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'IBM Plex Mono' }} />
                  <YAxis domain={['auto', 'auto']} stroke="#CBD5E1" tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'IBM Plex Mono' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', borderRadius: '6px' }}
                  />
                  <Area type="monotone" dataKey="heartRate" stroke="#2563EB" fill="#EFF6FF" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Apnea Score Histogram */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-xs font-semibold text-[#172033]">
              Prototype Apnea Score Distribution
            </h3>
            <div className="h-56 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="range" stroke="#CBD5E1" tick={{ fontSize: 8, fill: '#64748B', fontFamily: 'IBM Plex Mono' }} />
                  <YAxis stroke="#CBD5E1" tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'IBM Plex Mono' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
