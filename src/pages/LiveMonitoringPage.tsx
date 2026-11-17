import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { Activity, Play, Pause, RefreshCw, Target, Sliders } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { SectionHeader, SignalQualityBadge, DataSourceBadge, SubTopbar } from '../components/design-system/DesignSystemComponents';

type ChannelKey =
  | 'heartRate'
  | 'spo2'
  | 'cameraMovement'
  | 'respiratorySignal'
  | 'rawPPG'
  | 'filteredPPG'
  | 'aiProbability'
  | 'respiratoryMotionEst';

interface ChannelDef {
  key: ChannelKey;
  label: string;
  unit: string;
  yRange: [any, any];
  stroke: string;
  yId: 'left' | 'right';
  source: 'MEASURED' | 'DERIVED' | 'MODEL_OUTPUT' | 'SIMULATED' | 'SYNTHETIC_DEMO';
  group: 'ppg' | 'derived' | 'quality' | 'env';
}

const ALL_CHANNELS: ChannelDef[] = [
  // PPG & Optical Channels
  { key: 'heartRate',          label: 'Heart Rate',           unit: 'BPM',    yRange: [60, 200],        stroke: '#38BDF8', yId: 'left',  source: 'MEASURED',      group: 'ppg' },
  { key: 'spo2',               label: 'Optical SpO₂',         unit: '%',      yRange: [70, 100],        stroke: '#10B981', yId: 'right', source: 'MEASURED',      group: 'ppg' },
  { key: 'rawPPG',             label: 'Raw Infrared PPG',     unit: 'counts', yRange: ['auto', 'auto'], stroke: '#F59E0B', yId: 'left',  source: 'MEASURED',      group: 'ppg' },
  { key: 'filteredPPG',        label: 'Filtered Red PPG',     unit: 'counts', yRange: ['auto', 'auto'], stroke: '#FB923C', yId: 'left',  source: 'MEASURED',      group: 'ppg' },

  // Derived Metrics (Camera & Respiration)
  { key: 'cameraMovement',     label: 'Camera Thoracic Flow', unit: 'amp',    yRange: [0, 1],           stroke: '#A855F7', yId: 'left',  source: 'DERIVED',       group: 'derived' },
  { key: 'respiratorySignal',  label: 'Respiratory Signal',   unit: 'au',     yRange: [-1, 1],          stroke: '#06B6D4', yId: 'left',  source: 'DERIVED',       group: 'derived' },
  { key: 'respiratoryMotionEst', label: 'Resp. Rate Est.',    unit: 'Br/min', yRange: [0, 80],          stroke: '#34D399', yId: 'left',  source: 'DERIVED',       group: 'derived' },

  // Signal Quality & Algorithm
  { key: 'aiProbability',      label: 'Prototype Apnea Score', unit: '%',     yRange: [0, 100],         stroke: '#C084FC', yId: 'right', source: 'MODEL_OUTPUT',  group: 'quality' },
];

const SUBTOPBAR_TABS = [
  { id: 'ppg',         label: 'PPG & Vitals' },
  { id: 'derived',     label: 'Derived Metrics' },
  { id: 'quality',     label: 'Signal Quality' },
  { id: 'environment', label: 'Environment' },
  { id: 'all',         label: 'All Channels' },
];

export const LiveMonitoringPage: React.FC = () => {
  const { waveforms, vitals, thermal, apnea } = useMonitoring();
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null);
  const [selectedSubtab, setSelectedSubtab] = useState('ppg');

  const channelsList = ALL_CHANNELS.map(ch => ({
    ...ch,
    source: (ch.key === 'heartRate' ? (vitals.heartRateSource || 'SIMULATED') :
             ch.key === 'spo2'       ? (vitals.spo2Source || 'SIMULATED') :
             ch.source) as ChannelDef['source'],
  }));

  const visibleChannels = selectedSubtab === 'all'
    ? channelsList
    : channelsList.filter(ch => ch.group === selectedSubtab);

  const displayData = isPaused ? waveforms : waveforms.slice(-80);
  const isApneaActive = apnea.state === 'SUSPECTED' || apnea.state === 'CONFIRMED';
  const hasData = displayData.length > 0;

  const handleChartClick = (e: any) => {
    if (e?.activeLabel) setSelectedTimestamp(e.activeLabel);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Activity}
        title="Live Signal Streams & Oscilloscope"
        subtitle="Shared time-axis telemetry: optical PPG, pulse rate, non-contact camera respiratory flow, and multi-channel synchronization"
        badge={hasData ? 'LIVE 1 HZ STREAM' : 'WAITING FOR HARDWARE'}
        badgeVariant={hasData ? 'emerald' : 'amber'}
        action={
          <div className="flex items-center gap-2">
            {selectedTimestamp && (
              <button
                onClick={() => setSelectedTimestamp(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-mono transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear Cursor
              </button>
            )}
            <button
              onClick={() => setIsPaused(!isPaused)}
              disabled={!hasData}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isPaused
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'RESUME STREAM' : 'FREEZE FRAME'}
            </button>
          </div>
        }
      />

      {/* Real-time Telemetry Overview Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isApneaActive ? 'bg-red-500 animate-pulse' :
              isPaused ? 'bg-amber-400' :
              hasData ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
            }`} />
            <span className="text-xs font-semibold text-[#172033]">
              {isApneaActive ? 'Event Cascade Detected' :
               isPaused ? 'Freeze Frame Inspection Active' :
               hasData ? 'Continuous Hardware Telemetry Stream' : 'Awaiting Hardware Telemetry'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Quality:</span>
            <SignalQualityBadge quality={vitals.signalQuality} />
          </div>

          {selectedTimestamp && (
            <div className="flex items-center gap-1.5 text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 font-semibold">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              <span>Cursor: {selectedTimestamp}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <span>Buffer: <strong className="text-slate-800 tabular-nums">{displayData.length} samples</strong></span>
          <DataSourceBadge source="MEASURED" />
        </div>
      </div>

      {/* SubTopbar & Console Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-5 pt-3">
          <SubTopbar
            tabs={SUBTOPBAR_TABS}
            active={selectedSubtab}
            onChange={setSelectedSubtab}
          />
        </div>

        {/* Special Environment Subtab View */}
        {selectedSubtab === 'environment' ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-sans text-slate-500">Chamber Temperature</span>
                <div className="text-3xl font-mono font-bold text-[#172033] tabular-nums">
                  {thermal.chamberTemp !== null ? `${thermal.chamberTemp.toFixed(1)}°C` : '—'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Target: {thermal.targetTemp.toFixed(1)}°C</span>
                  <DataSourceBadge source="MEASURED" />
                </div>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-sans text-slate-500">Chamber Relative Humidity</span>
                <div className="text-3xl font-mono font-bold text-[#172033] tabular-nums">
                  {thermal.humidity !== null ? `${thermal.humidity.toFixed(0)}%` : '—'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>DHT11 Sensor</span>
                  <DataSourceBadge source="MEASURED" />
                </div>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-sans text-slate-500">Actuator Stage Driver</span>
                <div className="text-3xl font-mono font-bold text-[#172033] tabular-nums">
                  {thermal.peltierPwm}%
                </div>
                <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>PWM Duty Cycle</span>
                  <span className="font-semibold text-amber-700">{thermal.peltierCommand}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Oscilloscope Console: Deliberate, High-Fidelity Dark Instrument Surface */
          <div className="bg-slate-950 border-t border-slate-800 divide-y divide-slate-800/70">
            {/* Console Bar */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900/90 text-xs font-mono">
              <span className="text-slate-400 font-semibold tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                OSCILLOSCOPE WAVEFORM CONSOLE
              </span>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
                {visibleChannels.map(ch => (
                  <div key={ch.key} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: ch.stroke }} />
                    <span>{ch.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channels Strip */}
            {visibleChannels.map(ch => (
              <div key={ch.key} className="flex items-stretch min-h-14">
                {/* Channel Label & Provenance Column */}
                <div className="w-44 flex-shrink-0 flex flex-col justify-center px-4 py-2 bg-slate-900 border-r border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ch.stroke }} />
                    <span className="text-xs font-mono font-semibold text-slate-200 truncate">{ch.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pl-4">
                    <span>{ch.unit}</span>
                    <DataSourceBadge source={ch.source} className="text-[8px] py-0" />
                  </div>
                </div>

                {/* Oscilloscope Waveform Display */}
                <div className="flex-1 h-14 flex items-center bg-slate-950/95">
                  {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={displayData} margin={{ top: 4, right: 8, left: 4, bottom: 4 }} onClick={handleChartClick}>
                        <CartesianGrid strokeDasharray="1 6" stroke="#1e293b" strokeOpacity={0.6} />
                        <YAxis domain={ch.yRange} stroke="transparent" tick={false} width={0} />
                        {selectedTimestamp && (
                          <ReferenceLine x={selectedTimestamp} stroke="#3B82F6" strokeWidth={1} strokeDasharray="2 2" />
                        )}
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', borderRadius: '6px' }}
                          labelStyle={{ color: '#60a5fa' }}
                          cursor={{ stroke: '#3B82F6', strokeWidth: 1 }}
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
                    <div className="w-full flex items-center justify-center text-xs font-mono text-slate-600">
                      <span>Awaiting telemetry stream packets</span>
                    </div>
                  )}
                </div>

                {/* Live Numerical Readout */}
                <div className="w-24 flex-shrink-0 flex flex-col justify-center items-end px-4 border-l border-slate-800 bg-slate-900">
                  <span className="text-base font-mono font-bold tabular-nums" style={{ color: hasData ? ch.stroke : '#64748B' }}>
                    {(() => {
                      if (!hasData) return '—';
                      const val = (displayData[displayData.length - 1] as any)?.[ch.key];
                      if (val == null) return '—';
                      if (ch.key === 'heartRate' || ch.key === 'aiProbability') return Math.round(val);
                      if (ch.key === 'spo2') return Math.round(val);
                      if (typeof val === 'number') return val.toFixed(1);
                      return String(val);
                    })()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{ch.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
