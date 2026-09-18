import React, { useState } from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import { ChevronRight, Usb, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';
import { AvenzaLogo } from './AvenzaLogo';
import { ApneaStateBadge } from '../design-system/DesignSystemComponents';

export const Header: React.FC = () => {
  const {
    session,
    apnea,
    activeTab,
    setActiveTab,
    serialStatus,
    serialStats,
    serialError,
    isSerialSupported,
    connectSerial,
    disconnectSerial
  } = useMonitoring();

  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectSerial();
    } finally {
      setConnecting(false);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tabLabels: Record<string, string> = {
    landing: 'Overview & Introduction',
    login: 'Operator Authentication',
    sessionSetup: 'Patient Intake Setup',
    dashboard: 'Telemetry Command Center',
    aiApnea: 'Multimodal Apnea Evidence',
    liveMonitoring: '8-Signal Live Waveforms',
    alerts: 'Alerts & Clinical Triage',
    eventHistory: 'Event History Audit Log',
    eventReplay: 'Synchronized Event Replay',
    analytics: 'Clinical Telemetry Analytics',
    thermal: 'Thermal Micro-Climate',
    sensorHealth: 'Hardware & Sensor Matrix',
    session: 'Active Session Controls',
    settings: 'Console Configuration'
  };

  const isConnected = serialStatus === 'CONNECTED';

  return (
    <header className="bg-surface-1 border-b border-line-0 px-4 py-2.5 sticky top-0 z-30 shadow-card backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        
        {/* Brand & Breadcrumb Navigation */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('landing')}
            className="flex items-center text-left group focus:outline-none cursor-pointer"
          >
            <AvenzaLogo size="md" showBadge showTagline />
          </button>

          {/* Breadcrumb current view */}
          <div className="hidden xl:flex items-center space-x-1.5 text-xs font-mono text-slate-400 pl-3 border-l border-line-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-cyan-300 font-semibold">{tabLabels[activeTab] || activeTab}</span>
          </div>
        </div>

        {/* Center Telemetry Snapshot / Session Badge */}
        <div className="hidden lg:flex items-center space-x-3 bg-surface-0 px-3.5 py-1.5 rounded-xl border border-line-0 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Subject:</span>
            <span className={`font-semibold ${session.subjectId ? 'text-cyan-300' : 'text-slate-500'}`}>
              {session.subjectId || 'NO ACTIVE SESSION'}
            </span>
          </div>
          <div className="h-3.5 w-px bg-line-0" />
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Duration:</span>
            <span className={`font-semibold ${session.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-500'}`}>
              {session.status === 'ACTIVE' ? formatDuration(session.durationSeconds) : '--:--:--'}
            </span>
          </div>
          <div className="h-3.5 w-px bg-line-0" />
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">AI State:</span>
            <ApneaStateBadge state={apnea.state} size="sm" />
          </div>
        </div>

        {/* Right Action: Hardware Web Serial Quick-Connect Link */}
        <div className="flex items-center space-x-2.5 font-mono text-xs">
          {isConnected ? (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 font-bold text-xs">ESP32 LIVE</span>
              <span className="text-[10px] text-emerald-400/80 bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {serialStats.packetsReceived.toLocaleString()} pkts
              </span>
              <button
                onClick={disconnectSerial}
                className="ml-1 text-slate-400 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                title="Disconnect Serial"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : serialStatus === 'CONNECTING' || connecting ? (
            <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl text-amber-300">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="font-bold text-xs">Selecting Port...</span>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={!isSerialSupported}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-medical-cyan hover:brightness-110 text-black font-extrabold font-sans text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              title={isSerialSupported ? "Connect ESP32 Hardware via Web Serial" : "Web Serial not supported in this browser"}
            >
              <Usb className="w-3.5 h-3.5" />
              <span>CONNECT ESP32</span>
            </button>
          )}

          {/* Error Icon Indicator if any */}
          {serialError && (
            <div className="text-rose-400 hover:text-rose-300 cursor-pointer" title={serialError}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
