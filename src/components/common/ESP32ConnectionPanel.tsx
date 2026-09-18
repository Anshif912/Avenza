import React, { useState } from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import {
  Cpu,
  Usb,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  Fan,
  Activity,
  ShieldAlert,
  Info,
  Layers
} from 'lucide-react';

interface ESP32ConnectionPanelProps {
  compact?: boolean;
}

export const ESP32ConnectionPanel: React.FC<ESP32ConnectionPanelProps> = ({ compact = false }) => {
  const {
    serialStatus,
    serialPortInfo,
    serialStats,
    serialError,
    isSerialSupported,
    connectSerial,
    disconnectSerial,
    updateThermalControls,
    thermal,
    mode
  } = useMonitoring();

  const [connecting, setConnecting] = useState(false);
  const [testActionFeedback, setTestActionFeedback] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectSerial();
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectSerial();
  };

  const handleFanTest = () => {
    const nextState = thermal.fanCommand === 'OFF' ? 'HIGH' : 'OFF';
    updateThermalControls({ fanCommand: nextState });
    setTestActionFeedback(`Fan commanded ${nextState}`);
    setTimeout(() => setTestActionFeedback(null), 2500);
  };

  const handlePeltierTest = (mode: 'OFF' | 'HEATING' | 'COOLING') => {
    updateThermalControls({ peltierCommand: mode, peltierPwm: mode === 'OFF' ? 0 : 120 });
    setTestActionFeedback(`Peltier commanded ${mode}`);
    setTimeout(() => setTestActionFeedback(null), 2500);
  };

  const isConnected = serialStatus === 'CONNECTED';

  return (
    <div className="bg-surface-1 border border-line-0 rounded-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-0 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-medical-cyan/10 border border-medical-cyan/30 flex items-center justify-center">
            <Usb className="w-4 h-4 text-medical-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-sans font-bold text-slate-100 flex items-center gap-2">
              ESP32 USB Serial Telemetry Link
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-surface-0 border border-line-0 text-slate-400">
                115,200 BAUD
              </span>
            </h3>
            <p className="text-[11px] font-sans text-slate-400">
              Direct physical connection via Chrome Web Serial API (No bridge server required)
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              HARDWARE CONNECTED
            </span>
          ) : serialStatus === 'CONNECTING' || connecting ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              CONNECTING...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              WAITING FOR CONNECTION
            </span>
          )}
        </div>
      </div>

      {/* Browser Compatibility Notice if Unsupported */}
      {!isSerialSupported && (
        <div className="flex items-start gap-2.5 p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-sans">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-rose-200">Web Serial API Unavailable in this Browser</strong>
            The Web Serial protocol requires <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>. If you are using Firefox, Safari, or an embedded browser, please switch to Chrome/Edge to stream real hardware telemetry.
          </div>
        </div>
      )}

      {/* Port Conflict Caution Notice */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-950/20 border border-amber-500/25 rounded-xl text-xs text-amber-300/90 font-mono">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">IMPORTANT: </span>
          Close the <strong>Arduino IDE Serial Monitor</strong> before clicking connect. A COM port cannot be accessed simultaneously by two applications.
        </div>
      </div>

      {/* Error Banner */}
      {serialError && (
        <div className="flex items-center justify-between gap-2 p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-mono">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{serialError}</span>
          </div>
        </div>
      )}

      {/* Connect / Disconnect Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {!isConnected ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={!isSerialSupported || connecting}
            className="flex items-center gap-2 px-5 py-2.5 bg-medical-cyan hover:brightness-110 text-black font-extrabold font-sans text-sm rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {connecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Selecting COM Port...
              </>
            ) : (
              <>
                <Usb className="w-4 h-4" />
                CONNECT ESP32 (USB)
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-4 py-2 bg-surface-0 hover:bg-rose-950 text-rose-300 hover:text-rose-200 border border-line-0 hover:border-rose-500/40 font-bold font-sans text-xs rounded-xl transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            Disconnect Serial Link
          </button>
        )}

        {testActionFeedback && (
          <span className="text-xs font-mono font-semibold text-cyan-300 animate-fade-in">
            ✓ {testActionFeedback}
          </span>
        )}
      </div>

      {/* Telemetry Diagnostics Telemetry Box (Active when connected) */}
      {isConnected && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-surface-0 border border-line-0 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Device Identifier</div>
            <div className="text-xs font-mono font-bold text-cyan-300">AVENZA-ESP32-01</div>
          </div>

          <div className="bg-surface-0 border border-line-0 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Packets Streamed</div>
            <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {serialStats.packetsReceived.toLocaleString()} pkts
            </div>
          </div>

          <div className="bg-surface-0 border border-line-0 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Telemetry Rate</div>
            <div className="text-xs font-mono font-bold text-emerald-400">5 Hz (200ms)</div>
          </div>

          <div className="bg-surface-0 border border-line-0 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Serial Protocol</div>
            <div className="text-xs font-mono font-bold text-violet-300">JSON-lines @ 115.2k</div>
          </div>
        </div>
      )}

      {/* Actuator Direct Command Testing (Available when connected) */}
      {isConnected && !compact && (
        <div className="bg-surface-0 border border-line-0 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Bidirectional Hardware Command Verification
            </span>
            <span className="text-[10px] font-mono text-slate-500">SAFE OPERATIONAL LIMITS</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleFanTest}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                thermal.fanCommand !== 'OFF'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                  : 'bg-surface-1 text-slate-400 border-line-0 hover:text-slate-200'
              }`}
            >
              <Fan className={`w-3.5 h-3.5 ${thermal.fanCommand !== 'OFF' ? 'animate-spin text-cyan-400' : ''}`} />
              Fan: {thermal.fanCommand !== 'OFF' ? 'ACTIVE (HIGH)' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => handlePeltierTest(thermal.peltierCommand === 'HEATING' ? 'OFF' : 'HEATING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                thermal.peltierCommand === 'HEATING'
                  ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                  : 'bg-surface-1 text-slate-400 border-line-0 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Peltier Heating: {thermal.peltierCommand === 'HEATING' ? `ON (${thermal.peltierPwm})` : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => handlePeltierTest('OFF')}
              disabled={thermal.peltierCommand === 'OFF'}
              className="px-3 py-1.5 bg-surface-1 hover:bg-surface-2 text-slate-400 hover:text-slate-200 border border-line-0 rounded-lg text-xs font-mono font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              All Actuators OFF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
