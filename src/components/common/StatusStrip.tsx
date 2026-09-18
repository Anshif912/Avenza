import React from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import { Camera, Heart, Activity, ShieldCheck, Usb, Clock } from 'lucide-react';
import { SignalQualityBadge, DataSourceBadge } from '../design-system/DesignSystemComponents';

export const StatusStrip: React.FC = () => {
  const { vitals, apnea, sensors, serialStatus, connectSerial, setActiveTab, activeTab, selectedReplayEvent } = useMonitoring();
  const shield = apnea.multimodalEvidence.shield;
  const channels = apnea.multimodalEvidence.channels;

  const esp32Sensor = sensors.find(s => s.id === 'esp32');
  const isEsp32Connected = serialStatus === 'CONNECTED' || esp32Sensor?.connectionStatus === 'CONNECTED';

  if (activeTab === 'eventReplay') {
    return (
      <div className="bg-amber-950/40 border-b border-amber-500/40 px-4 py-1.5 text-xs font-mono select-none backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              EVENT REPLAY MODE
            </span>
            <span className="text-slate-400 text-[11px]">
              Session: <strong className="text-amber-200">{selectedReplayEvent?.id || 'EVT-2026-0819-01'}</strong>
            </span>
            <span className="text-line-0 hidden sm:inline">|</span>
            <span className="text-slate-400 text-[11px]">
              Hardware Safety: <strong className="text-emerald-400">READ-ONLY ISOLATION</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-amber-300/80 uppercase font-mono">
              Provenance Preserved
            </span>
            <DataSourceBadge source="SIMULATED" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-0 border-b border-line-0 px-4 py-1.5 text-xs font-mono select-none backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
        
        {/* Left Status Indicators */}
        <div className="flex items-center space-x-3.5 flex-wrap gap-y-1">
          {/* System Mode */}
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isEsp32Connected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isEsp32Connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className={`font-bold tracking-wide text-[11px] ${isEsp32Connected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isEsp32Connected ? 'HYBRID PROTOTYPE' : 'WAITING FOR HARDWARE'}
            </span>
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* Telemetry Stream */}
          <div className="flex items-center space-x-1.5">
            <span className={`font-bold tracking-wide text-[11px] ${
              isEsp32Connected ? 'text-cyan-400' : 'text-slate-500'
            }`}>
              {isEsp32Connected ? '5 HZ USB SERIAL LINK' : 'SERIAL DISCONNECTED'}
            </span>
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* Camera Status */}
          <div className="flex items-center space-x-1.5">
            <Camera className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-slate-400">CAMERA:</span>
            <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
              channels.camera.valid
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border border-slate-700'
            }`}>
              {channels.camera.valid ? 'ROI LOCKED' : 'NOT STARTED'}
            </span>
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* SpO2 Status with explicit Provenance */}
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">SpO₂:</span>
            <span className="font-bold text-slate-200">
              {vitals.spo2 ? `${vitals.spo2.toFixed(0)}%` : '--'}
            </span>
            <DataSourceBadge source={vitals.spo2Source || 'SIMULATED'} />
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* HR Status with explicit Provenance */}
          <div className="flex items-center space-x-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400">HR:</span>
            <span className="font-bold text-slate-200">
              {vitals.heartRate ? `${vitals.heartRate.toFixed(0)} BPM` : '--'}
            </span>
            <DataSourceBadge source={vitals.heartRateSource || 'SIMULATED'} />
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* Signal Quality Shield */}
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-medical-cyan" />
            <span className="text-slate-400">SHIELD:</span>
            <span
              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                shield.overallStatus === 'OPTIMAL'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : shield.overallStatus === 'DEGRADED'
                  ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-700'
              }`}
            >
              {shield.overallStatus}
            </span>
          </div>
        </div>

        {/* Right Telemetry Indicators */}
        <div className="flex items-center space-x-3.5 flex-wrap gap-y-1">
          {/* ESP32 USB Connection Button / Badge */}
          <button
            type="button"
            onClick={() => {
              if (serialStatus === 'CONNECTED') {
                setActiveTab('sensorHealth');
              } else {
                connectSerial();
              }
            }}
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
              isEsp32Connected
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-surface-1 border-line-0 text-slate-400 hover:border-medical-cyan/40 hover:text-cyan-300'
            }`}
            title={isEsp32Connected ? 'ESP32 Connected via USB (Click to view matrix)' : 'Click to connect ESP32 via USB Serial'}
          >
            <Usb className="w-3 h-3 text-medical-cyan" />
            <span>USB:</span>
            <span className="font-bold text-[11px]">
              {isEsp32Connected ? '115.2K' : 'CONNECT'}
            </span>
          </button>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* Last Packet Delay */}
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>AGE: <strong className="text-slate-200">{vitals.dataAgeSeconds > 0 ? `${vitals.dataAgeSeconds.toFixed(1)}s` : '--'}</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
