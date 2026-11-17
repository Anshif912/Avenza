import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useMonitoring } from '../../context/MonitoringContext';
import { ChevronRight, Usb, RefreshCw, XCircle, AlertTriangle, Play, Radio, Cpu } from 'lucide-react';
import { NeoNattleLogo } from './AvenzaLogo';

const ROUTE_CONTEXTS: Record<string, { title: string; category?: string }> = {
  '/dashboard':       { title: 'Command Center', category: 'Overview' },
  '/live-monitoring': { title: 'Live Signal Streams', category: 'Monitoring' },
  '/event-review':    { title: 'Event Triage & Review', category: 'Events' },
  '/ai-apnea':        { title: 'AI Event Analysis', category: 'Evaluation' },
  '/environment':     { title: 'Environmental Control', category: 'Actuation' },
  '/device-health':   { title: 'Device & Sensor Health', category: 'Hardware' },
  '/history':         { title: 'Event History Log', category: 'Audit' },
  '/settings':        { title: 'System Configuration', category: 'Config' },
  '/event-replay':    { title: 'Synchronized Event Replay', category: 'Studio' },
  '/analytics':       { title: 'Signal Analytics', category: 'Reports' },
  '/session':         { title: 'Session Controls', category: 'Active' },
  '/session/setup':   { title: 'Session Configuration', category: 'Setup' },
  '/login':           { title: 'Operator Access', category: 'Session' }
};

export const Header: React.FC = () => {
  const location = useLocation();
  const {
    mode,
    setMode,
    serialStatus,
    serialStats,
    serialError,
    isSerialSupported,
    connectSerial,
    disconnectSerial,
    telemetryFreshness
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

  const isConnected = serialStatus === 'CONNECTED';
  const currentContext = ROUTE_CONTEXTS[location.pathname] || {
    title: location.pathname.replace('/', '').replace(/-/g, ' ') || 'Console',
    category: 'Console'
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] select-none">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        
        {/* Left: Brand mark & Clear Page Context */}
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="flex items-center text-left focus:outline-none cursor-pointer group"
            title="Return to Overview"
          >
            <NeoNattleLogo size="md" showBadge badgeText="PROTOTYPE" />
          </Link>

          <div className="h-5 w-px bg-slate-200" />

          {/* Breadcrumb / Current View title */}
          <div className="flex items-center space-x-2 text-sm">
            {currentContext.category && (
              <span className="text-slate-400 text-xs font-normal hidden sm:inline">
                {currentContext.category}
              </span>
            )}
            {currentContext.category && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
            )}
            <span className="text-[#172033] font-semibold tracking-tight capitalize">
              {currentContext.title}
            </span>
          </div>
        </div>

        {/* Right: Clean, uncrowded controls: Mode Toggle + ESP32 Status + Action */}
        <div className="flex items-center space-x-3 text-xs">
          
          {/* Data Mode Switch (LIVE / DEMO) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode('LIVE')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === 'LIVE'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Real-time telemetry from physical ESP32 via USB Web Serial"
            >
              <Radio className="w-3 h-3 text-blue-600" />
              <span>LIVE</span>
            </button>
            <button
              onClick={() => setMode('DEMO')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === 'DEMO'
                  ? 'bg-white text-amber-800 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Demonstration simulation mode without physical hardware"
            >
              <Play className="w-3 h-3 text-amber-600" />
              <span>DEMO</span>
            </button>
          </div>

          {/* Hardware Connection Status Indicator */}
          {isConnected ? (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${telemetryFreshness === 'STALE' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-900 font-bold text-xs">ESP32 CONNECTED</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                    telemetryFreshness === 'STALE'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {telemetryFreshness === 'STALE' ? 'STALE' : 'LIVE'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700">
                  USB SERIAL · 115200 · {serialStats.packetsReceived.toLocaleString()} pkts
                </span>
              </div>
              <button
                onClick={disconnectSerial}
                className="ml-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                title="Disconnect Serial"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : serialStatus === 'CONNECTING' || connecting ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-800">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span className="font-semibold text-xs">CONNECTING...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {serialStats.packetsReceived > 0 && (
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                  ESP32 DISCONNECTED
                </span>
              )}
              <button
                onClick={handleConnect}
                disabled={!isSerialSupported}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50"
                title={isSerialSupported ? "Connect ESP32 Hardware via Web Serial (115200 baud)" : "Web Serial not supported in this browser"}
              >
                <Usb className="w-3.5 h-3.5" />
                <span>CONNECT ESP32</span>
              </button>
            </div>
          )}

          {/* Device Health Shortcut Link */}
          <Link
            to="/device-health"
            className={`p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer ${
              location.pathname === '/device-health' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
            }`}
            title="View Device & Sensor Matrix"
          >
            <Cpu className="w-4 h-4" />
          </Link>

          {/* Error Indicator if any */}
          {serialError && (
            <div className="text-red-600 hover:text-red-700 cursor-pointer" title={serialError}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
