import React, { useState, useEffect } from 'react';
import { AlertItem } from '../../types/avenza';
import { X, Play, Pause, RotateCcw, Activity, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

interface Props {
  event: AlertItem;
  onClose: () => void;
}

export const EventReplayModal: React.FC<Props> = ({ event, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [stepIndex, setStepIndex] = useState(0);

  const snapshot = event.eventDetails?.waveformSnapshot || [];
  const maxSteps = snapshot.length > 0 ? snapshot.length - 1 : 29;

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setStepIndex(prev => (prev >= maxSteps ? 0 : prev + 1));
      }, 500 / speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, maxSteps]);

  const currentFrame = snapshot[stepIndex] || {
    time: '12:27:14',
    ppg: 0.8,
    resp: 0.8,
    camera: 0.42,
    hr: 138,
    spo2: 98,
    aiProb: 12
  };

  // Phase description based on step index
  const getPhaseDescription = (idx: number) => {
    if (idx < 5) return 'Phase 1: Baseline Normal (Camera: 0.42, SpO2: 98%, HR: 138 BPM)';
    if (idx < 10) return 'Phase 2: Camera Chest Movement Collapses (0.42 -> 0.08 amp)';
    if (idx < 15) return 'Phase 3: SpO2 Arterial Desaturation Slope Begins (98% -> 85%)';
    if (idx < 20) return 'Phase 4: Heart Rate Deceleration (138 -> 88 BPM, prototype threshold: 15 BPM)';
    if (idx < 25) return 'Phase 5: Prototype State = CONFIRMED BY PROTOTYPE EVENT CRITERIA (Score: 94%)';
    return 'Phase 6: Multimodal Recovery (Signals returning to baseline)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-fade-in">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl">
              <RotateCcw className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 font-mono">
                  MULTIMODAL EVENT REPLAY: <span className="text-blue-600">{event.id}</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  EVENT REPLAY: SYNTHETIC HISTORICAL DEMO
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Logged: {event.timestamp} • Duration: {event.durationSeconds || 11.2}s
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Replay Control Bar */}
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'PAUSE REPLAY' : 'PLAY REPLAY'}</span>
            </button>

            <button
              onClick={() => setStepIndex(0)}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 shadow-sm cursor-pointer"
              title="Restart Replay"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed Toggles */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-300 shadow-sm">
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                    speed === s ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Current Frame Readout */}
          <div className="flex items-center space-x-4 text-slate-700">
            <div>Timestamp: <strong className="text-blue-600">{currentFrame.time}</strong></div>
            <div>HR: <strong className="text-blue-700">{currentFrame.hr} BPM</strong></div>
            <div>SpO₂: <strong className="text-emerald-700">{currentFrame.spo2}%</strong></div>
            <div>AI Prob: <strong className="text-blue-700">{currentFrame.aiProb}%</strong></div>
          </div>

        </div>

        {/* Replay Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700">
          
          {/* Phase Banner */}
          <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs font-mono flex items-center space-x-3 text-blue-900">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="font-semibold">{getPhaseDescription(stepIndex)}</div>
          </div>

          {/* Synchronized Replay Multi-Signal Chart */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-800 uppercase flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Synchronized Multi-Signal Replay Timeline</span>
              </span>
              <span className="text-blue-700 font-bold">Step {stepIndex + 1} of {maxSteps + 1}</span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshot}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="time" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="hr" domain={[60, 160]} stroke="#2563EB" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="spo2" domain={[70, 100]} orientation="right" stroke="#059669" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                  />
                  {currentFrame.time && (
                    <ReferenceLine x={currentFrame.time} stroke="#2563EB" strokeWidth={2.5} label={{ value: 'REPLAY CURSOR', fill: '#2563EB', fontSize: 10 }} />
                  )}
                  <Line yAxisId="hr" type="monotone" dataKey="hr" name="Heart Rate (BPM)" stroke="#2563EB" strokeWidth={2} dot={false} />
                  <Line yAxisId="spo2" type="monotone" dataKey="spo2" name="SpO₂ (%)" stroke="#059669" strokeWidth={2} dot={false} />
                  <Line yAxisId="hr" type="monotone" dataKey="camera" name="Camera Movement" stroke="#6366F1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scrub Bar */}
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Event Start</span>
              <span className="font-semibold text-slate-700">Timeline Scrubber</span>
              <span>Event Recovery</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxSteps}
              value={stepIndex}
              onChange={e => setStepIndex(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold font-mono rounded-xl border border-slate-300 shadow-sm transition-colors cursor-pointer"
          >
            Close Replay
          </button>
        </div>

      </div>
    </div>
  );
};
