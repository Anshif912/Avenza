import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMonitoring } from '../../context/MonitoringContext';
import { Camera, Heart, Activity, ShieldCheck, Usb, Clock } from 'lucide-react';
import { DataSourceBadge } from '../design-system/DesignSystemComponents';

export const StatusStrip: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vitals, apnea, sensors, serialStatus, connectSerial, selectedReplayEvent, isDemoMode } = useMonitoring();
  const shield = apnea.multimodalEvidence.shield;
  const channels = apnea.multimodalEvidence.channels;

  const esp32Sensor = sensors.find(s => s.id === 'esp32');
  const isEsp32Connected = serialStatus === 'CONNECTED' || esp32Sensor?.connectionStatus === 'CONNECTED';

  if (location.pathname === '/event-replay') {
    return (
      <div className="bg-amber-50/80 border-b border-amber-200 px-4 py-1.5 text-xs font-mono select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              EVENT REPLAY MODE
            </span>
            <span className="text-slate-600 text-[11px]">
              Session: <strong className="text-amber-900">{selectedReplayEvent?.id || 'EVT-2026-0819-01'}</strong>
            </span>
            <span className="text-line-0 hidden sm:inline">|</span>
            <span className="text-slate-600 text-[11px]">
              Hardware Safety: <strong className="text-emerald-700">READ-ONLY ISOLATION</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-amber-800 uppercase font-mono">
              Provenance Preserved
            </span>
            <DataSourceBadge source="SIMULATED" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border-b border-line-0 px-4 py-1.5 text-xs font-mono select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
        
        {/* Left Status Indicators */}
        <div className="flex items-center space-x-3.5 flex-wrap gap-y-1">
          {/* System Mode */}
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isEsp32Connected ? 'bg-emerald-400' : isDemoMode ? 'bg-amber-400' : 'bg-slate-300'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isEsp32Connected ? 'bg-emerald-500' : isDemoMode ? 'bg-amber-500' : 'bg-slate-400'}`} />
            </span>
            <span className={`font-bold tracking-wide text-[11px] ${isEsp32Connected ? 'text-emerald-700' : isDemoMode ? 'text-amber-800' : 'text-slate-600'}`}>
              {isEsp32Connected ? 'ESP32 TELEMETRY ACTIVE' : isDemoMode ? 'SIMULATED DEMO STREAM' : 'WAITING FOR HARDWARE'}
            </span>
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* Telemetry Stream */}
          <div className="flex items-center space-x-1.5">
            <span className={`font-bold tracking-wide text-[11px] ${
              isEsp32Connected ? 'text-blue-700' : 'text-slate-500'
            }`}>
              {isEsp32Connected ? '5 HZ USB LINK' : isDemoMode ? 'SIMULATED 5 HZ' : 'SERIAL OFF'}
            </span>
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* Camera Status */}
          <div className="flex items-center space-x-1.5">
            <Camera className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-slate-500">CAMERA:</span>
            <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
              channels.camera.valid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              {channels.camera.valid ? 'ROI LOCKED' : 'STANDBY'}
            </span>
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* SpO2 Status with explicit Provenance */}
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">SpO₂:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {vitals.spo2 ? `${vitals.spo2.toFixed(0)}%` : '--'}
            </span>
            <DataSourceBadge source={vitals.spo2Source || (isDemoMode ? 'SIMULATED' : 'MEASURED')} />
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* HR Status with explicit Provenance */}
          <div className="flex items-center space-x-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-slate-500">HR:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {vitals.heartRate ? `${vitals.heartRate.toFixed(0)} BPM` : '--'}
            </span>
            <DataSourceBadge source={vitals.heartRateSource || (isDemoMode ? 'SIMULATED' : 'MEASURED')} />
          </div>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* Signal Quality Shield */}
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">SHIELD:</span>
            <span
              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                shield.overallStatus === 'OPTIMAL'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : shield.overallStatus === 'DEGRADED'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
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
                navigate('/device-health');
              } else {
                connectSerial();
              }
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg border transition-colors cursor-pointer ${
              isEsp32Connected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-surface-0 border-line-0 text-slate-600 hover:border-blue-300 hover:text-blue-700'
            }`}
            title={isEsp32Connected ? 'ESP32 Connected via USB (Click to view matrix)' : 'Click to connect ESP32 via USB Serial'}
          >
            <Usb className="w-3 h-3 text-blue-600" />
            <span>USB:</span>
            <span className="font-bold text-[11px]">
              {isEsp32Connected ? '115.2K' : 'CONNECT'}
            </span>
          </button>

          <span className="text-line-0 hidden sm:inline">|</span>

          {/* Last Packet Delay */}
          <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>AGE: <strong className="text-slate-800 tabular-nums">{vitals.dataAgeSeconds > 0 ? `${vitals.dataAgeSeconds.toFixed(1)}s` : '--'}</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
