import React, { useState, useEffect } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import {
  RotateCcw, Play, Pause, ChevronLeft, ChevronRight, Rewind, FastForward,
  Activity, Camera, Heart, BrainCircuit, ShieldAlert, Layers, Thermometer,
  Info, AlertTriangle, ShieldCheck, Cpu
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, AreaChart, Area
} from 'recharts';
import {
  SpotlightCard, SectionHeader, DataSourceBadge, ApneaStateBadge,
  ArcGauge, SignalQualityBadge, ClinicalDisclaimer
} from '../components/design-system/DesignSystemComponents';
import {
  eventReplayService,
  PlaybackSpeed
} from '../services/EventReplayService';
import { ReplayFrame, ReplaySession } from '../types/avenza';

const PHASES = [
  { range: [-30, -5],  label: 'Pre-Event Baseline', desc: 'Nominal physiological status & steady chest motion', color: 'bg-emerald-500', textColor: 'text-emerald-300' },
  { range: [-4.9, 0],  label: 'Onset / Motion Loss', desc: 'Thoracic excursion attenuation detected by webcam ROI', color: 'bg-violet-500', textColor: 'text-violet-300' },
  { range: [0.1, 10],  label: 'Physiological Drop', desc: 'Corroborating desaturation and pulse deceleration slope', color: 'bg-amber-500', textColor: 'text-amber-300' },
  { range: [10.1, 20], label: 'Confirmed Apnea Window', desc: 'Multimodal criteria sustained across temporal window', color: 'bg-rose-500', textColor: 'text-rose-300' },
  { range: [20.1, 99], label: 'Recovery & Baseline Restabilization', desc: 'Respiratory resumption & vital parameter normalization', color: 'bg-teal-500', textColor: 'text-teal-300' },
];

const SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1.0, 2.0, 4.0];

export const EventReplayPage: React.FC = () => {
  const { selectedReplayEvent } = useMonitoring();
  const [sessions, setSessions] = useState<ReplaySession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [activeSession, setActiveSession] = useState<ReplaySession | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [currentFrame, setCurrentFrame] = useState<ReplayFrame | null>(null);

  // Initialize and load sessions
  useEffect(() => {
    const recorded = eventReplayService.getRecordedSessions();
    setSessions(recorded);

    let initialId = recorded[0]?.eventId || '';
    if (selectedReplayEvent?.id) {
      const match = recorded.find(s => s.eventId === selectedReplayEvent.id);
      if (match) initialId = match.eventId;
    }

    if (initialId) {
      setSelectedSessionId(initialId);
      const session = eventReplayService.getSession(initialId);
      if (session) {
        eventReplayService.loadSession(session);
        setActiveSession(session);
      }
    }
  }, [selectedReplayEvent]);

  // Subscribe to replay service state and frame updates
  useEffect(() => {
    const unsubState = eventReplayService.onStateChange((playing, frameIdx, total, sess) => {
      setIsPlaying(playing);
      setCurrentFrameIndex(frameIdx);
      setTotalFrames(total);
      if (sess) setActiveSession(sess);
    });

    const unsubFrame = eventReplayService.onFrameUpdate((frame) => {
      setCurrentFrame(frame);
    });

    // Set initial frame if available
    const initialFrame = eventReplayService.getCurrentFrame();
    if (initialFrame) {
      setCurrentFrame(initialFrame);
    }

    return () => {
      unsubState();
      unsubFrame();
    };
  }, []);

  const handleSelectSession = (eventId: string) => {
    setSelectedSessionId(eventId);
    const session = eventReplayService.getSession(eventId);
    if (session) {
      eventReplayService.loadSession(session);
      setActiveSession(session);
    }
  };

  const handleSpeedChange = (spd: PlaybackSpeed) => {
    setPlaybackSpeed(spd);
    eventReplayService.setPlaybackSpeed(spd);
  };

  const frames = activeSession?.frames || [];
  const maxIndex = Math.max(0, frames.length - 1);
  const progressPct = maxIndex > 0 ? (currentFrameIndex / maxIndex) * 100 : 0;
  const currentOffset = currentFrame?.timeOffsetSec ?? 0;

  // Determine current active phase
  const currentPhase = PHASES.find(p => currentOffset >= p.range[0] && currentOffset <= p.range[1]) ?? PHASES[0];

  // Slice historical playback window for chart visualization
  const historicalFrames = frames.slice(0, currentFrameIndex + 1);

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Header */}
      <SectionHeader
        icon={RotateCcw}
        title="Synchronized Event Replay Console"
        subtitle="Frame-accurate deterministic playback of cardiorespiratory apnea episodes with strict immutable data provenance"
        badge="READ-ONLY ISOLATED REPLAY"
        badgeVariant="amber"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Select Event:</span>
            <select
              value={selectedSessionId}
              onChange={e => handleSelectSession(e.target.value)}
              className="bg-surface-0 border border-line-0 text-cyan-300 font-mono font-bold text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-medical-cyan cursor-pointer"
            >
              {sessions.map(s => (
                <option key={s.eventId} value={s.eventId}>
                  {s.eventId} — {s.sessionTitle.slice(0, 45)}... ({s.totalDurationSec}s)
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* ─── PERSISTENT PROVENANCE & SAFETY DISCLAIMER BANNER ─────── */}
      <div className="bg-amber-950/30 border border-amber-500/40 rounded-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono shadow-card">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-300 text-sm">HYBRID PROTOTYPE REPLAY MODE</span>
              <DataSourceBadge source="SIMULATED" />
              <DataSourceBadge source="MEASURED" />
            </div>
            <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
              Channels marked <strong className="text-cyan-300">MEASURED</strong> (ambient temp, chamber temp, raw IR/Red waveforms, camera vision) originated 100% from physical ESP32 sensors and optics. Channels marked <strong className="text-amber-300">SIMULATED</strong> (Heart Rate, SpO₂) retain their original prototype mathematical fallback state. <strong>REPLAY MODE IS STRICTLY READ-ONLY AND TRANSMITS ZERO ACTUATOR COMMANDS TO HARDWARE.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ─── PHASE PROGRESSION TRACKER ────────────────────────────── */}
      <div className="space-y-1.5 bg-surface-1 border border-line-0 rounded-card p-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="font-bold text-slate-200">Event Phase Progression</span>
          <span className={currentPhase.textColor}>
            Offset: <strong>{currentOffset >= 0 ? `+${currentOffset.toFixed(1)}s` : `${currentOffset.toFixed(1)}s`}</strong> ({currentPhase.label})
          </span>
        </div>

        <div className="flex w-full h-4 rounded-full overflow-hidden gap-1 bg-surface-0 p-0.5 border border-line-0">
          {PHASES.map((phase) => {
            const isActive = currentPhase.label === phase.label;
            return (
              <div
                key={phase.label}
                className={`flex-1 ${phase.color} rounded-full transition-all duration-300 flex items-center justify-center text-[8px] font-mono font-bold text-white ${
                  isActive ? 'brightness-125 ring-2 ring-white/60 shadow-lg' : 'opacity-30'
                }`}
                title={`${phase.label}: ${phase.desc}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
          <span className="text-slate-300">Active Phase: <strong className={currentPhase.textColor}>{currentPhase.label}</strong> — {currentPhase.desc}</span>
          <span>Frame: <strong className="text-cyan-300">{currentFrameIndex + 1}</strong> of {totalFrames}</span>
        </div>
      </div>

      {/* ─── ROW 1: AI Apnea Score & Live Replay Frame Telemetry ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Prototype Apnea Gauge */}
        <SpotlightCard
          glowColor={currentFrame?.apneaState === 'CONFIRMED' ? 'rose' : currentFrame?.apneaState === 'SUSPECTED' ? 'amber' : 'violet'}
          className="p-5 flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Replay Apnea Probability
          </div>
          <ArcGauge
            value={currentFrame?.apneaScore ?? 0}
            size={160}
            critical={currentFrame?.apneaState === 'CONFIRMED'}
          />
          <ApneaStateBadge state={currentFrame?.apneaState ?? 'NORMAL'} size="md" />
          <p className="text-[11px] font-mono text-slate-300 max-w-[190px]">
            {currentFrame?.primaryContribution || 'Nominal Status'}
          </p>
        </SpotlightCard>

        {/* Replay 6-Channel Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">

          {/* Heart Rate */}
          <div className="bg-surface-1 border border-line-0 rounded-chip p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" /> Heart Rate
              </span>
              <DataSourceBadge source={currentFrame?.heartRateSource || 'SIMULATED'} />
            </div>
            <div className="text-xl font-extrabold text-rose-300 tabular-nums">
              {currentFrame?.heartRate !== null && currentFrame?.heartRate !== undefined ? `${currentFrame.heartRate.toFixed(1)} BPM` : '--'}
            </div>
            <div className="text-[9px] text-slate-500">Ref: 100–160 BPM</div>
          </div>

          {/* SpO2 */}
          <div className="bg-surface-1 border border-line-0 rounded-chip p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" /> SpO₂ Saturation
              </span>
              <DataSourceBadge source={currentFrame?.spo2Source || 'SIMULATED'} />
            </div>
            <div className="text-xl font-extrabold text-cyan-300 tabular-nums">
              {currentFrame?.spo2 !== null && currentFrame?.spo2 !== undefined ? `${currentFrame.spo2.toFixed(1)}%` : '--'}
            </div>
            <div className="text-[9px] text-slate-500">Target: 92–98%</div>
          </div>

          {/* Camera Motion */}
          <div className="bg-surface-1 border border-line-0 rounded-chip p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Camera className="w-3 h-3 text-violet-400" /> Thoracic Motion
              </span>
              <DataSourceBadge source="MEASURED" />
            </div>
            <div className="text-xl font-extrabold text-violet-300 tabular-nums">
              {currentFrame?.cameraMovement !== null && currentFrame?.cameraMovement !== undefined
                ? `${((currentFrame.cameraMovement) * 100).toFixed(0)}%`
                : '--'}
            </div>
            <div className="text-[9px] text-slate-500">Tracking: {currentFrame?.cameraTrackingState || 'LOCKED'}</div>
          </div>

          {/* Raw IR PPG */}
          <div className="bg-surface-1 border border-line-0 rounded-chip p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-400" /> Raw IR PPG
              </span>
              <DataSourceBadge source="MEASURED" />
            </div>
            <div className="text-xl font-extrabold text-amber-300 tabular-nums">
              {currentFrame?.rawIR ? currentFrame.rawIR.toLocaleString() : '--'}
            </div>
            <div className="text-[9px] text-slate-500">MAX30102 ADC Counts</div>
          </div>

          {/* Chamber Temperature */}
          <div className="bg-surface-1 border border-line-0 rounded-chip p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-emerald-400" /> Chamber Probe
              </span>
              <DataSourceBadge source="MEASURED" />
            </div>
            <div className="text-xl font-extrabold text-emerald-300 tabular-nums">
              {currentFrame?.chamberTemperature !== null && currentFrame?.chamberTemperature !== undefined
                ? `${currentFrame.chamberTemperature.toFixed(2)}°C`
                : '--'}
            </div>
            <div className="text-[9px] text-slate-500">DS18B20 OneWire</div>
          </div>

          {/* Ambient Temp & Humidity */}
          <div className="bg-surface-1 border border-line-0 rounded-chip p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-teal-400" /> Ambient (DHT11)
              </span>
              <DataSourceBadge source="MEASURED" />
            </div>
            <div className="text-lg font-extrabold text-teal-300 tabular-nums">
              {currentFrame?.temperature !== null ? `${currentFrame?.temperature?.toFixed(1)}°C` : '--'} / {currentFrame?.humidity !== null ? `${currentFrame?.humidity?.toFixed(0)}%` : '--'}
            </div>
            <div className="text-[9px] text-slate-500">Actuators: {currentFrame?.peltierCommand || 'OFF'}</div>
          </div>

        </div>
      </div>

      {/* ─── ROW 2: Synchronized Multi-Channel Timeline Chart ──────── */}
      <SpotlightCard glowColor="cyan" className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-sans font-bold text-slate-200">
              7-Channel Synchronized Oscilloscope Playback
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span>Offset: <strong className="text-cyan-300">{currentOffset >= 0 ? `+${currentOffset.toFixed(1)}s` : `${currentOffset.toFixed(1)}s`}</strong></span>
            <span>Elapsed: <strong className="text-slate-200">{((currentFrameIndex * 0.2)).toFixed(1)}s</strong> / {activeSession?.totalDurationSec || 0}s</span>
          </div>
        </div>

        <div className="h-72 chart-container p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalFrames} margin={{ top: 8, right: 12, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2d5a" />
              <XAxis dataKey="timeOffsetSec" stroke="#374151" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => `${v}s`} />
              <YAxis yAxisId="hr"   domain={[60, 160]}  stroke="#374151" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis yAxisId="spo2" domain={[70, 100]} orientation="right" stroke="#374151" tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1c2d5a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                labelStyle={{ color: '#06b6d4' }}
                formatter={(val: any, name: string) => [val, name]}
                labelFormatter={(label) => `Time Offset: ${label}s`}
              />

              {/* Event onset and critical thresholds */}
              <ReferenceLine yAxisId="hr" x={0} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" label={{ value: 'EVENT ONSET (t=0)', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
              <ReferenceLine yAxisId="spo2" y={90} stroke="#f59e0b" strokeDasharray="2 2" />

              <Line yAxisId="hr"   type="monotone" dataKey="heartRate"     name="Heart Rate (BPM) [SIMULATED]" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="spo2" type="monotone" dataKey="spo2"          name="SpO₂ (%) [SIMULATED]"          stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="spo2" type="monotone" dataKey="apneaScore"    name="Apnea Score (%) [MODEL]"      stroke="#c084fc" strokeWidth={1.5} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline Scrubber Slider */}
        <div className="space-y-1.5 pt-2">
          <input
            type="range"
            min={0}
            max={maxIndex}
            value={currentFrameIndex}
            onChange={e => eventReplayService.seekToIndex(Number(e.target.value))}
            className="w-full clinical-slider cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>-30.0s (Pre-Event)</span>
            <span className="text-cyan-400 font-bold">{Math.round(progressPct)}% of Recording</span>
            <span>+30.0s (Recovery Window)</span>
          </div>
        </div>
      </SpotlightCard>

      {/* ─── ROW 3: Transport Controls & Speed Selector ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Transport Controls */}
        <div className="bg-surface-1 border border-line-0 rounded-card p-5 space-y-4">
          <h3 className="text-sm font-sans font-bold text-slate-200">Replay Transport Controls</h3>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => eventReplayService.restart()}
              className="p-2.5 rounded-xl bg-surface-0 hover:bg-surface-2 border border-line-0 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Restart from beginning"
            >
              <Rewind className="w-4 h-4" />
            </button>
            <button
              onClick={() => eventReplayService.stepBackward()}
              className="p-2.5 rounded-xl bg-surface-0 hover:bg-surface-2 border border-line-0 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Step frame back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => eventReplayService.togglePlayPause()}
              className={`px-8 py-2.5 rounded-xl font-mono font-bold text-xs flex items-center gap-2 border transition-colors cursor-pointer shadow-md ${
                isPlaying
                  ? 'bg-amber-950 hover:bg-amber-900 text-amber-300 border-amber-500/40'
                  : 'bg-medical-cyan hover:brightness-110 text-black border-cyan-400 font-extrabold'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'PAUSE REPLAY' : 'PLAY REPLAY'}
            </button>
            <button
              onClick={() => eventReplayService.stepForward()}
              className="p-2.5 rounded-xl bg-surface-0 hover:bg-surface-2 border border-line-0 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Step frame forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => eventReplayService.jumpToEnd()}
              className="p-2.5 rounded-xl bg-surface-0 hover:bg-surface-2 border border-line-0 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Jump to end of recovery"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          {/* Playback speed buttons */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Playback Speed</span>
            <div className="flex gap-2">
              {SPEEDS.map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-surface-0 text-slate-400 border-line-0 hover:border-line-1'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Channel Provenance Audit Table */}
        <div className="bg-surface-1 border border-line-0 rounded-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-sans font-bold text-slate-200">Session Channel Provenance</h3>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">IMMUTABLE LOG</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {[
              { channel: 'Heart Rate Pulse Telemetry', origin: 'VitalSimulationEngine (Bounded Random Walk)', status: activeSession?.channelProvenance.heartRate || 'SIMULATED' },
              { channel: 'SpO₂ Arterial Oxygen Saturation', origin: 'VitalSimulationEngine (Bounded Random Walk)', status: activeSession?.channelProvenance.spo2 || 'SIMULATED' },
              { channel: 'MAX30102 Raw IR / Red Waveform', origin: 'ESP32 Hardware I²C Bus (0x57)', status: 'MEASURED' as const },
              { channel: 'DS18B20 Chamber Probe Temp', origin: 'ESP32 GPIO 5 OneWire Bus', status: 'MEASURED' as const },
              { channel: 'DHT11 Ambient Temp / Humidity', origin: 'ESP32 GPIO 4 Digital Pin', status: 'MEASURED' as const },
              { channel: 'Webcam Thoracic Motion Evidence', origin: 'Browser Optical Flow Engine (Chest ROI)', status: 'MEASURED' as const },
              { channel: 'Hardware Actuator Command Log', origin: 'ESP32 L298N & Relay Controllers', status: 'MEASURED' as const },
            ].map((item) => (
              <div key={item.channel} className="p-2 bg-surface-0 border border-line-0 rounded-chip flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-slate-200 font-medium truncate">{item.channel}</div>
                  <div className="text-[10px] text-slate-500 truncate">{item.origin}</div>
                </div>
                <DataSourceBadge source={item.status} className="shrink-0" />
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
