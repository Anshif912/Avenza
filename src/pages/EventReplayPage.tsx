import React, { useState, useEffect } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import {
  RotateCcw, Play, Pause, ChevronLeft, ChevronRight, Rewind, FastForward,
  Activity, Camera, Heart, ShieldAlert, Thermometer, ShieldCheck, Cpu
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine
} from 'recharts';
import {
  SectionHeader, DataSourceBadge, ApneaStateBadge,
  ArcGauge, SignalQualityBadge
} from '../components/design-system/DesignSystemComponents';
import {
  eventReplayService,
  PlaybackSpeed
} from '../services/EventReplayService';
import { ReplayFrame, ReplaySession } from '../types/avenza';

const PHASES = [
  { range: [-30, -5],  label: 'Pre-Event Baseline', desc: 'Nominal physiological status & steady chest motion', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  { range: [-4.9, 0],  label: 'Onset / Motion Loss', desc: 'Thoracic excursion attenuation detected by webcam ROI', color: 'bg-violet-500', textColor: 'text-violet-700' },
  { range: [0.1, 10],  label: 'Physiological Drop', desc: 'Corroborating desaturation and pulse deceleration slope', color: 'bg-amber-500', textColor: 'text-amber-700' },
  { range: [10.1, 20], label: 'Confirmed Apnea Window', desc: 'Multimodal criteria sustained across temporal window', color: 'bg-rose-500', textColor: 'text-rose-700' },
  { range: [20.1, 99], label: 'Recovery Restabilization', desc: 'Respiratory resumption & vital parameter normalization', color: 'bg-teal-500', textColor: 'text-teal-700' },
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

  // Subscribe to replay service
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
  const currentOffset = currentFrame?.timeOffsetSec ?? 0;
  const currentPhase = PHASES.find(p => currentOffset >= p.range[0] && currentOffset <= p.range[1]) ?? PHASES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        icon={RotateCcw}
        title="Synchronized Event Replay Studio"
        subtitle="Frame-accurate deterministic playback of cardiorespiratory apnea episodes with strict immutable data provenance"
        badge="READ-ONLY REPLAY MODE"
        badgeVariant="amber"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans text-slate-500">Episode:</span>
            <select
              value={selectedSessionId}
              onChange={e => handleSelectSession(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 font-mono text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-600 cursor-pointer shadow-xs"
            >
              {sessions.map(s => (
                <option key={s.eventId} value={s.eventId}>
                  {s.eventId}: {s.sessionTitle.slice(0, 35)}... ({s.totalDurationSec}s)
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Safety Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed font-sans space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="font-semibold text-amber-950">Isolated Replay Environment</strong>
            <DataSourceBadge source="MEASURED" />
            <DataSourceBadge source="SIMULATED" />
          </div>
          <p className="text-slate-600">
            Replay mode is strictly read-only and transmits zero actuator commands to the physical ESP32. Physical sensor channels retain original recorded data.
          </p>
        </div>
      </div>

      {/* Phase Progression Tracker */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="font-semibold text-[#172033]">Event Phase Cascade</span>
          <span className="font-mono font-semibold">
            Offset: <strong className={currentPhase.textColor}>{currentOffset >= 0 ? `+${currentOffset.toFixed(1)}s` : `${currentOffset.toFixed(1)}s`}</strong> ({currentPhase.label})
          </span>
        </div>

        <div className="flex w-full h-3 rounded-full overflow-hidden gap-1 bg-slate-100 p-0.5 border border-slate-200">
          {PHASES.map((phase) => {
            const isActive = currentPhase.label === phase.label;
            return (
              <div
                key={phase.label}
                className={`flex-1 ${phase.color} rounded-full transition-all duration-300 ${
                  isActive ? 'ring-2 ring-blue-500' : 'opacity-25'
                }`}
                title={`${phase.label}: ${phase.desc}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] font-sans text-slate-500 pt-1">
          <span>Active Phase: <strong className={currentPhase.textColor}>{currentPhase.label}</strong>: {currentPhase.desc}</span>
          <span className="font-mono">Frame: <strong>{currentFrameIndex + 1}</strong> of {totalFrames}</span>
        </div>
      </div>

      {/* Main Replay Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Prototype Apnea Score Gauge */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-semibold text-slate-700">
            Replay Apnea Score
          </span>
          <ArcGauge
            value={currentFrame?.apneaScore ?? 0}
            size={170}
            critical={currentFrame?.apneaState === 'CONFIRMED'}
          />
          <ApneaStateBadge state={currentFrame?.apneaState ?? 'NORMAL'} size="md" />
          <p className="text-xs font-sans text-slate-500 max-w-[200px]">
            {currentFrame?.primaryContribution || 'Nominal Physiological Baseline'}
          </p>
        </div>

        {/* 6 Replay Channels */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Heart Rate */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-slate-600 flex items-center gap-1.5 font-medium">
                <Heart className="w-3.5 h-3.5 text-rose-600" /> Pulse Rate
              </span>
              <DataSourceBadge source={currentFrame?.heartRateSource || 'SIMULATED'} />
            </div>
            <div className="text-2xl font-mono font-bold text-[#172033] tabular-nums">
              {currentFrame?.heartRate !== null && currentFrame?.heartRate !== undefined ? Math.round(currentFrame.heartRate) : '—'}
              <span className="text-xs text-slate-400 font-normal ml-1 font-sans">BPM</span>
            </div>
          </div>

          {/* SpO2 */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-slate-600 flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-blue-600" /> Optical SpO₂
              </span>
              <DataSourceBadge source={currentFrame?.spo2Source || 'SIMULATED'} />
            </div>
            <div className="text-2xl font-mono font-bold text-blue-700 tabular-nums">
              {currentFrame?.spo2 !== null && currentFrame?.spo2 !== undefined ? Math.round(currentFrame.spo2) : '—'}
              <span className="text-xs text-slate-400 font-normal ml-1 font-sans">%</span>
            </div>
          </div>

          {/* Camera Motion */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-slate-600 flex items-center gap-1.5 font-medium">
                <Camera className="w-3.5 h-3.5 text-violet-600" /> Camera Motion
              </span>
              <DataSourceBadge source="DERIVED" />
            </div>
            <div className="text-2xl font-mono font-bold text-violet-700 tabular-nums">
              {currentFrame?.cameraMovement !== null && currentFrame?.cameraMovement !== undefined ? (currentFrame.cameraMovement * 100).toFixed(0) : '—'}
              <span className="text-xs text-slate-400 font-normal ml-1 font-sans">%</span>
            </div>
          </div>

          {/* Chamber Temp */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-slate-600 flex items-center gap-1.5 font-medium">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" /> Chamber Temp
              </span>
              <DataSourceBadge source="MEASURED" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#172033] tabular-nums">
              {currentFrame?.chamberTemperature !== null && currentFrame?.chamberTemperature !== undefined ? currentFrame.chamberTemperature.toFixed(1) : '—'}
              <span className="text-xs text-slate-400 font-normal ml-1 font-sans">°C</span>
            </div>
          </div>

          {/* Relative Humidity */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-slate-600 flex items-center gap-1.5 font-medium">
                <Thermometer className="w-3.5 h-3.5 text-teal-600" /> Humidity
              </span>
              <DataSourceBadge source="MEASURED" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#172033] tabular-nums">
              {currentFrame?.humidity !== null && currentFrame?.humidity !== undefined ? Math.round(currentFrame.humidity) : '—'}
              <span className="text-xs text-slate-400 font-normal ml-1 font-sans">%</span>
            </div>
          </div>

          {/* Hardware Actuator Safety */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-slate-600 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Actuator State
              </span>
              <DataSourceBadge source="MEASURED" />
            </div>
            <div className="text-lg font-mono font-bold text-[#172033] pt-1">
              Fan: <span className="text-blue-700">{currentFrame?.fanCommand || 'OFF'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Replay Scrubbing & Playback Controller */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Timeline Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>-30s Baseline</span>
            <span className="font-bold text-[#172033]">
              {currentOffset >= 0 ? `+${currentOffset.toFixed(1)}s` : `${currentOffset.toFixed(1)}s`} relative to onset
            </span>
            <span>+30s Recovery</span>
          </div>
          <input
            type="range"
            min={0}
            max={maxIndex}
            value={currentFrameIndex}
            onChange={(e) => eventReplayService.seekToIndex(Number(e.target.value))}
            className="clinical-slider"
          />
        </div>

        {/* Transport Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => eventReplayService.stepBackward()}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Previous Frame"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => eventReplayService.togglePlayPause()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
            <button
              onClick={() => eventReplayService.stepForward()}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Next Frame"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => eventReplayService.restart()}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Rewind to Start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 font-sans">Speed:</span>
            {SPEEDS.map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
