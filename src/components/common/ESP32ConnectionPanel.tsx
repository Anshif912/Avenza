import React, { useState } from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import {
  Usb,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  Fan,
  Info,
  Check
} from 'lucide-react';

interface ESP32ConnectionPanelProps {
  compact?: boolean;
}

export const ESP32ConnectionPanel: React.FC<ESP32ConnectionPanelProps> = ({ compact = false }) => {
  const {
    serialStatus,
    serialStats,
    serialError,
    isSerialSupported,
    connectSerial,
    disconnectSerial,
    updateThermalControls,
    resetSafety,
    thermal,
    vitals,
    sensors,
    deviceId
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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Usb className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-sans font-bold text-slate-900 flex items-center gap-2">
              ESP32 USB Serial Telemetry Link
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-bold">
                115,200 BAUD
              </span>
            </h3>
            <p className="text-[11px] font-sans text-slate-500">
              Direct physical connection via Chrome Web Serial API (No bridge server required)
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              HARDWARE CONNECTED
            </span>
          ) : serialStatus === 'CONNECTING' || connecting ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-300">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
              CONNECTING...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              WAITING FOR CONNECTION
            </span>
          )}
        </div>
      </div>

      {/* Browser Compatibility Notice if Unsupported */}
      {!isSerialSupported && (
        <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-sans">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-rose-900">Web Serial API Unavailable in this Browser</strong>
            The Web Serial protocol requires <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>. If you are using Firefox, Safari, or an embedded browser, please switch to Chrome/Edge to stream real hardware telemetry.
          </div>
        </div>
      )}

      {/* Port Conflict Caution Notice */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-mono">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-800">IMPORTANT: </span>
          Close the <strong>Arduino IDE Serial Monitor</strong> before clicking connect. A COM port cannot be accessed simultaneously by two applications.
        </div>
      </div>

      {/* Error Banner */}
      {serialError && (
        <div className="flex items-center justify-between gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-mono">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
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
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold font-sans text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 font-bold font-sans text-xs rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            Disconnect Serial Link
          </button>
        )}

        {testActionFeedback && (
          <span className="text-xs font-mono font-semibold text-blue-700 animate-fade-in inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-blue-700" />
            <span>{testActionFeedback}</span>
          </span>
        )}
      </div>

      {/* Telemetry Diagnostics Telemetry Box (Active when connected) */}
      {isConnected && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Device Identifier</div>
            <div className="text-xs font-mono font-bold text-blue-700">{deviceId || 'NEONATTLE_ESP32_01'}</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Packets Streamed</div>
            <div className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {serialStats.packetsReceived.toLocaleString()} pkts
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Telemetry Rate</div>
            <div className="text-xs font-mono font-bold text-emerald-700">5 Hz (200ms)</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Serial Protocol</div>
            <div className="text-xs font-mono font-bold text-purple-700">JSON-lines @ 115.2k</div>
          </div>
        </div>
      )}

      {/* MAX30102 Pulse Acquisition Pipeline Status */}
      {isConnected && (() => {
        const max30102 = sensors.find(s => s.id === 'max30102');
        const hasPulse = vitals.heartRate !== null && vitals.heartRate > 0;
        const hasContact = max30102?.connectionStatus === 'CONNECTED' || (max30102?.validity === 'VALID');
        return (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${hasPulse ? 'bg-emerald-500' : hasContact ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                MAX30102 Optical Stage:
                <span className={hasPulse ? 'text-emerald-700 font-bold' : hasContact ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                  {hasPulse ? 'OPTICAL PULSE LOCK ACTIVE' : hasContact ? 'ACQUIRING PULSE SIGNAL' : 'WAITING FOR CONTACT'}
                </span>
              </span>
              <span className="text-[10px] text-slate-500">
                {max30102?.invalidReason ? `Status: ${max30102.invalidReason}` : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
              <div>Probe Contact: <strong className={hasContact ? 'text-emerald-700' : 'text-slate-500'}>{hasContact ? 'DETECTED' : 'NONE'}</strong></div>
              <div>Quality: <strong className={vitals.signalQuality === 'GOOD' ? 'text-emerald-700' : vitals.signalQuality === 'FAIR' ? 'text-amber-700' : 'text-slate-500'}>{vitals.signalQuality}</strong></div>
              <div>BPM Candidate: <strong className="text-slate-800">{max30102?.bpmCandidate ? `${max30102.bpmCandidate.toFixed(0)} BPM` : '—'}</strong></div>
              <div>SpO₂ Candidate: <strong className="text-slate-800">{max30102?.spo2Candidate ? `${max30102.spo2Candidate.toFixed(0)}%` : '—'}</strong></div>
            </div>
          </div>
        );
      })()}

      {/* Blocked Command Alert / Safety Cutoff */}
      {isConnected && (thermal.blockedReason || thermal.hardwareSafetyStatus === 'CUTOFF_ACTIVE') && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs font-mono text-rose-900 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {thermal.hardwareSafetyStatus === 'CUTOFF_ACTIVE' ? 'HARDWARE SAFETY CUTOFF ACTIVE' : 'COMMAND REJECTED BY FIRMWARE'}
            </span>
            {thermal.hardwareSafetyStatus === 'CUTOFF_ACTIVE' && (
              <button
                type="button"
                onClick={() => resetSafety()}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
              >
                RESET SAFETY INTERLOCK
              </button>
            )}
          </div>
          <div className="text-[11px] text-rose-800">
            {thermal.blockedReason === 'FAN_INTERLOCK_REQUIRED'
              ? 'Peltier heating blocked: Circulation Fan must be active (ON) before heating to prevent heatsink thermal runaway.'
              : thermal.blockedReason === 'SAFETY_CUTOFF_ACTIVE'
              ? 'Actuators disabled: Chamber exceeded 38.0°C safety cutoff threshold. Allow chamber to cool below 37.0°C, then reset safety.'
              : thermal.blockedReason || 'Command blocked by firmware safety policy.'}
          </div>
        </div>
      )}

      {/* Actuator Direct Command Testing (Available when connected) */}
      {isConnected && !compact && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Bidirectional Hardware Command Verification
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-slate-500">
                Fan: [Cmd: <strong>{thermal.commandedFan || thermal.fanCommand}</strong> / Actual: <strong>{thermal.actualFan || (thermal.fanCommand !== 'OFF' ? 'HIGH' : 'OFF')}</strong>]
              </span>
              <span className="text-slate-500">
                Peltier: [Cmd: <strong>{thermal.commandedPeltier || thermal.peltierCommand}</strong> / Actual: <strong>{thermal.actualPeltier || thermal.peltierCommand}</strong>]
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleFanTest}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                thermal.fanCommand !== 'OFF'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 shadow-xs'
              }`}
            >
              <Fan className={`w-3.5 h-3.5 ${thermal.fanCommand !== 'OFF' ? 'animate-spin text-blue-600' : ''}`} />
              Fan: {thermal.fanCommand !== 'OFF' ? 'ACTIVE (HIGH)' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => handlePeltierTest(thermal.peltierCommand === 'HEATING' ? 'OFF' : 'HEATING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                thermal.peltierCommand === 'HEATING'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 shadow-xs'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Peltier Heating: {thermal.peltierCommand === 'HEATING' ? `ON (${thermal.peltierPwm})` : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => handlePeltierTest('OFF')}
              disabled={thermal.peltierCommand === 'OFF'}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-mono font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              All Actuators OFF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
