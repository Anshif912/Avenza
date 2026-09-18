import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { Activity, Play, Pause, RefreshCw, Target } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { SectionHeader, SignalQualityBadge, DataSourceBadge } from '../components/design-system/DesignSystemComponents';

export const LiveMonitoringPage: React.FC = () => {
  const { waveforms, vitals, apnea } = useMonitoring();
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null);

  const channelsList = [
    { key: 'heartRate',          label: 'Heart Rate',           unit: 'BPM',    yRange: ['auto', 'auto'],  stroke: '#38bdf8', yId: 'left',  source: vitals.heartRateSource || 'SIMULATED' },
    { key: 'spo2',               label: 'SpO₂ Saturation',      unit: '%',      yRange: [70, 100],  stroke: '#10b981', yId: 'right', source: vitals.spo2Source || 'SIMULATED' },
    { key: 'cameraMovement',     label: 'Camera Motion',        unit: 'amp',    yRange: [0, 1],     stroke: '#a855f7', yId: 'left',  source: 'DERIVED' as const },
    { key: 'respiratorySignal',  label: 'Respiratory Signal',   unit: 'au',     yRange: [-1, 1],    stroke: '#06b6d4', yId: 'left',  source: 'DERIVED' as const },
    { key: 'rawPPG',             label: 'Raw IR PPG',           unit: 'counts', yRange: ['auto', 'auto'], stroke: '#f59e0b', yId: 'left', source: 'MEASURED' as const },
    { key: 'filteredPPG',        label: 'Filtered Red PPG',     unit: 'counts', yRange: ['auto', 'auto'], stroke: '#fb923c', yId: 'left', source: 'MEASURED' as const },
    { key: 'aiProbability',      label: 'AI Score',             unit: '%',      yRange: [0, 100],   stroke: '#c084fc', yId: 'right', source: 'MODEL_OUTPUT' as const },
    { key: 'respiratoryMotionEst', label: 'Resp. Motion Est.',  unit: 'Br/min', yRange: [0, 80],    stroke: '#34d399', yId: 'left',  source: 'DERIVED' as const },
  ];

  const displayData = isPaused ? waveforms : waveforms.slice(-80);
  const isApneaActive = apnea.state === 'SUSPECTED' || apnea.state === 'CONFIRMED';
  const hasData = displayData.length > 0;

  const handleChartClick = (e: any) => {
    if (e?.activeLabel) setSelectedTimestamp(e.activeLabel);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <SectionHeader
        icon={Activity}
        title="8-Channel Synchronized Telemetry Console"
        subtitle="Shared time-axis oscilloscope view · PPG, SpO₂, Heart Rate, Camera Thoracic Motion, Respiratory Signal, AI Probability"
        badge={hasData ? 'LIVE TELEMETRY STREAM' : 'WAITING FOR HARDWARE'}
        badgeVariant={hasData ? 'emerald' : 'amber'}
        action={
          <div className="flex items-center gap-2">
            {selectedTimestamp && (
              <button
                onClick={() => setSelectedTimestamp(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-1 text-slate-300 border border-line-0 text-xs font-mono transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Clear Cursor
              </button>
            )}
            <button
              onClick={() => setIsPaused(!isPaused)}
              disabled={!hasData}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono font-bold border text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isPaused
                  ? 'bg-amber-950 text-amber-300 border-amber-500/40 hover:bg-amber-900'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'RESUME' : 'FREEZE FRAME'}
            </button>
          </div>
        }
      />

      {/* Telemetry status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-1 border border-line-0 rounded-card">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isApneaActive ? 'bg-rose-400 animate-pulse' :
              isPaused ? 'bg-amber-400' :
              hasData ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`} />
            <span className={`text-xs font-mono font-bold ${
              isApneaActive ? 'text-rose-400' :
              isPaused ? 'text-amber-400' :
              hasData ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {isApneaActive ? 'APNEA ACTIVE' :
               isPaused ? 'FREEZE FRAME' :
               hasData ? 'HARDWARE STREAM LIVE' : 'WAITING FOR TELEMETRY'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span>Signal:</span>
            <SignalQualityBadge quality={vitals.signalQuality} />
          </div>
          {selectedTimestamp && (
            <div className="flex items-center gap-1.5 text-xs font-mono bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/40">
              <Target className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-300 font-bold">Cursor: {selectedTimestamp}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <span>Buffer: <strong className="text-slate-200">{displayData.length} samples</strong></span>
          <DataSourceBadge source="MEASURED" />
        </div>
      </div>

      {/* Oscilloscope-style multi-channel view */}
      <div className="bg-[#050910] border border-line-0 rounded-card overflow-hidden space-y-0 divide-y divide-line-0">
        {channelsList.map((ch) => (
          <div key={ch.key} className="flex items-stretch min-h-[50px]">
            {/* Channel label column */}
            <div className="w-36 flex-shrink-0 flex flex-col justify-center px-3 py-2 bg-surface-0 border-r border-line-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: ch.stroke }} />
                <span className="text-[10px] font-mono font-bold text-slate-300 leading-tight">{ch.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-slate-500">{ch.unit}</span>
                <DataSourceBadge source={ch.source} className="text-[7px]" />
              </div>
            </div>

            {/* Channel waveform */}
            <div className="flex-1 h-12 flex items-center">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData} margin={{ top: 2, right: 4, left: 0, bottom: 2 }} onClick={handleChartClick}>
                    <CartesianGrid strokeDasharray="1 6" stroke="#1c2d5a" strokeOpacity={0.4} />
                    <YAxis domain={ch.yRange as [any, any]} stroke="transparent" tick={false} width={0} />
                    {selectedTimestamp && (
                      <ReferenceLine x={selectedTimestamp} stroke="#06b6d4" strokeWidth={1} strokeDasharray="2 2" />
                    )}
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1c2d5a', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                      cursor={{ stroke: '#06b6d4', strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={ch.key}
                      stroke={isApneaActive && (ch.key === 'aiProbability' || ch.key === 'heartRate') ? '#ef4444' : ch.stroke}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full flex items-center justify-center text-[10px] font-mono text-slate-600">
                  <span>- - - - - - - - WAITING FOR TELEMETRY STREAM - - - - - - - -</span>
                </div>
              )}
            </div>

            {/* Live value */}
            <div className="w-20 flex-shrink-0 flex flex-col justify-center items-end px-3 border-l border-line-0 bg-surface-0">
              <span className="text-sm font-mono font-extrabold tabular-nums" style={{ color: hasData ? ch.stroke : '#64748b' }}>
                {(() => {
                  if (!hasData) return '--';
                  const val = (displayData[displayData.length - 1] as any)?.[ch.key];
                  if (val == null) return '--';
                  if (ch.key === 'heartRate' || ch.key === 'aiProbability') return Math.round(val);
                  if (ch.key === 'spo2') return `${Math.round(val)}`;
                  if (typeof val === 'number') return val.toFixed(1);
                  return String(val);
                })()}
              </span>
              <span className="text-[9px] font-mono text-slate-500">{ch.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-400">
        {channelsList.map(ch => (
          <div key={ch.key} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: ch.stroke }} />
            <span>{ch.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
