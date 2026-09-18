import React from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import {
  BarChart3, TrendingDown, Activity, Download
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
  const last60  = waveforms.slice(-60);

  // Apnea score distribution (bucketed)
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${i * 10 + 9}`,
    count: last120.filter(w => (w.aiProbability ?? 0) >= i * 10 && (w.aiProbability ?? 0) < (i + 1) * 10).length
  }));

  const apneaEventAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING');

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  const handleExportCSV = () => {
    if (!waveforms.length) return;
    const header = 'AVENZA Clinical Telemetry Export\nSubject,' + (session.subjectId || 'AVZ-001') + ',Session,' + (session.sessionId || 'SES-01') + '\nTimestamp,Heart Rate (BPM),SpO2 (%),AI Apnea Score (%),Camera Motion\n';
    const rows = waveforms.map(w => `${w.timestamp},${w.heartRate ?? ''},${w.spo2 ?? ''},${w.aiProbability ?? ''},${w.cameraMovement ?? ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AVENZA_Telemetry_${session.subjectId || 'AVZ-001'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        icon={BarChart3}
        title="Clinical Telemetry Analytics"
        subtitle="Session-level trends, apnea score distribution, and thermal stability analysis"
        badge={hasData ? 'LIVE SESSION STREAM' : 'NO DATA RECORDED'}
        badgeVariant={hasData ? 'emerald' : 'cyan'}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!hasData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-1 text-slate-300 border border-line-0 rounded-xl text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!hasData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-1 text-slate-300 border border-line-0 rounded-xl text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        }
      />

      {/* Session overview metrics — simple flex strip */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Session Duration', value: session.status === 'ACTIVE' ? formatDuration(session.durationSeconds) : '--:--:--', color: 'text-cyan-300' },
          { label: 'Total Events', value: String(apneaEventAlerts.length), color: 'text-rose-300' },
          { label: 'Unacknowledged', value: String(alerts.filter(a => !a.acknowledged).length), color: 'text-amber-300' },
          { label: 'Current AI Score', value: apnea.state !== 'NO_EVALUATION' ? `${apnea.probability}%` : '--', color: 'text-violet-300' },
        ].map(m => (
          <div key={m.label} className="flex-1 min-w-[120px] bg-surface-1 border border-line-0 rounded-card p-4 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{m.label}</div>
            <div className={`text-2xl font-mono font-extrabold tabular-nums ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="bg-surface-1 border border-line-0 rounded-2xl p-12 text-center space-y-4">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">NO ANALYTICS DATA AVAILABLE</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
              Live monitoring telemetry has not recorded historical frames yet. Connect the ESP32 hardware via USB Serial or start camera monitoring in Patient Setup.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* HR & SpO2 vital trends — full width area chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-sans font-bold text-slate-200">Heart Rate & SpO₂ Trends</h3>
              </div>
              <DataSourceBadge source="MEASURED" />
            </div>
            <div className="h-52 chart-container p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last120} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hrArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spo2Area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2d5a" />
                  <XAxis dataKey="timestamp" stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} interval={20} />
                  <YAxis domain={['auto', 'auto']} stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} />
                  <YAxis yAxisId="spo2" domain={[80, 100]} orientation="right" stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1c2d5a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                  <Area type="monotone" dataKey="heartRate" name="HR (BPM)" stroke="#38bdf8" fill="url(#hrArea)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Area yAxisId="spo2" type="monotone" dataKey="spo2" name="SpO₂ (%)" stroke="#10b981" fill="url(#spo2Area)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Score distribution + Camera motion — two charts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Score histogram */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-sans font-bold text-slate-200">Prototype Score Distribution</h3>
              </div>
              <div className="h-48 chart-container p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={buckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2d5a" vertical={false} />
                    <XAxis dataKey="range" stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} />
                    <YAxis stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1c2d5a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                    <Bar dataKey="count" name="Sample count" fill="#8b5cf6" fillOpacity={0.8} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] font-mono text-slate-500 italic">MODEL OUTPUT — NOT A DIAGNOSIS</div>
            </div>

            {/* Camera motion trend */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-sans font-bold text-slate-200">Camera-Derived Respiratory Motion</h3>
              </div>
              <div className="h-48 chart-container p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last60} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2d5a" />
                    <XAxis dataKey="timestamp" stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} interval={10} />
                    <YAxis domain={[0, 1]} stroke="#374151" tick={{ fontSize: 8, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1c2d5a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                    <Line type="monotone" dataKey="cameraMovement" name="Camera Motion (amp)" stroke="#a855f7" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="respiratoryMotionEst" name="Resp. Motion Est." stroke="#34d399" strokeWidth={1.5} strokeDasharray="3 2" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] font-mono text-slate-500 italic">Laptop Webcam → Chest/Abdomen ROI → Camera-Derived Respiratory Motion Evidence</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
