import React from 'react';
import { Thermometer, Wind, ShieldCheck, ShieldAlert, AlertTriangle, Zap, ToggleLeft, Info } from 'lucide-react';
import { useMonitoring } from '../context/MonitoringContext';
import {
  SectionHeader,
  InstrumentCard,
  ThermalGauge,
  ClinicalDisclaimer,
} from '../components/design-system/DesignSystemComponents';

export const ThermalControlPage: React.FC = () => {
  const { thermal, updateThermalControls, resetSafety } = useMonitoring();

  const {
    chamberTemp,
    targetTemp,
    humidity,
    peltierCommand,
    peltierDirection,
    peltierPwm,
    fanCommand,
    hardwareSafetyStatus,
    peltierDriverStatus,
    manualOverrideActive,
    commandedPeltier,
    actualPeltier,
    commandedFan,
    actualFan,
    interlockStatus,
    blockedReason,
  } = thermal;

  /* -- Safety interlock config -- */
  const safetyConfig: Record<
    typeof hardwareSafetyStatus,
    {
      label: string;
      desc: string;
      border: string;
      bg: string;
      text: string;
      icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    READY: {
      label: 'READY',
      desc: 'All hardware safety interlocks nominal. Open-loop PWM / relay driver active.',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      icon: ShieldCheck,
    },
    CUTOFF_ACTIVE: {
      label: 'CUTOFF ACTIVE',
      desc: 'Thermal safety cutoff engaged. Actuators disabled. Chamber cooling to ambient.',
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      icon: ShieldAlert,
    },
    FAULT: {
      label: 'HARDWARE FAULT',
      desc: 'Driver fault detected. Manual hardware check required before resuming.',
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      icon: AlertTriangle,
    },
    UNVERIFIED: {
      label: 'NOT VERIFIED',
      desc: 'Hardware sensor feedback unverified. Standby mode active.',
      border: 'border-slate-200',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      icon: ShieldCheck,
    },
  };
  const safety = safetyConfig[hardwareSafetyStatus] ?? safetyConfig.UNVERIFIED;
  const SafetyIcon = safety.icon;

  /* -- Thermal Actuator command button configs -- */
  const actuatorBtns: {
    cmd: typeof peltierCommand;
    label: string;
    active: string;
    idle: string;
  }[] = [
    {
      cmd: 'HEATING',
      label: 'HEATING',
      active: 'bg-amber-600 text-white border-amber-600 shadow-sm',
      idle: 'bg-white text-slate-700 border-slate-300 hover:border-amber-400 hover:text-amber-800',
    },
    {
      cmd: 'COOLING',
      label: 'COOLING',
      active: 'bg-blue-600 text-white border-blue-600 shadow-sm',
      idle: 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:text-blue-800',
    },
    {
      cmd: 'OFF',
      label: 'OFF',
      active: 'bg-slate-700 text-white border-slate-700 shadow-sm',
      idle: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50',
    },
  ];

  /* -- Fan command configs -- */
  const fanBtns: { cmd: typeof fanCommand; label: string }[] = [
    { cmd: 'OFF',    label: 'OFF' },
    { cmd: 'LOW',    label: 'LOW' },
    { cmd: 'MEDIUM', label: 'MED' },
    { cmd: 'HIGH',   label: 'HIGH' },
    { cmd: 'MAX',    label: 'MAX' },
  ];

  const fanActiveColor = (cmd: typeof fanCommand): string => {
    if (cmd === 'OFF')    return 'bg-slate-700 text-white border-slate-700';
    if (cmd === 'LOW')    return 'bg-blue-600 text-white border-blue-600 shadow-xs';
    if (cmd === 'MEDIUM') return 'bg-blue-700 text-white border-blue-700 shadow-xs';
    if (cmd === 'HIGH')   return 'bg-indigo-600 text-white border-indigo-600 shadow-xs';
    /* MAX */              return 'bg-rose-600 text-white border-rose-600 shadow-xs';
  };

  /* -- 2x2 key values -- */
  const keyValues: { label: string; value: string; unit?: string; note?: string }[] = [
    { label: 'Chamber Temp (DS18B20)', value: chamberTemp !== null ? chamberTemp.toFixed(2) : '--', unit: '°C', note: 'Measured' },
    { label: 'Reference Setpoint', value: targetTemp.toFixed(1), unit: '°C', note: 'Demo Config' },
    { label: 'Relative Humidity (DHT11)', value: humidity !== null ? humidity.toFixed(0) : '--', unit: '% RH', note: 'Measured' },
    { label: 'Safety Interlock', value: hardwareSafetyStatus, note: 'Relay Protection' },
  ];

  const pwmPercent = Math.round((peltierPwm / 255) * 100);

  const fanWidthMap: Record<typeof fanCommand, string> = {
    OFF: '0%', LOW: '20%', MEDIUM: '50%', HIGH: '80%', MAX: '100%',
  };
  const fanColorMap: Record<typeof fanCommand, string> = {
    OFF: 'transparent', LOW: '#2563EB', MEDIUM: '#1D4ED8', HIGH: '#4F46E5', MAX: '#E11D48',
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <SectionHeader
        icon={Thermometer}
        title="Thermal Micro-Climate Control"
        subtitle="DS18B20 chamber sensor, DHT11 air telemetry, and thermal actuator command"
        badge="OPEN-LOOP PWM"
        badgeVariant="blue"
      />

      {/* Actuator Type Verification Notice */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 font-sans">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Hardware Verification Note:</span> Physical thermal actuator type is currently under verification (PTC element vs Peltier TEC1-12706). Output PWM controls the L298N driver / relay stage.
        </div>
      </div>

      {/* Blocked Command Alert Banner */}
      {blockedReason && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-rose-800">Command Rejected by Safety Interlock: </span>
            <span>
              {blockedReason === 'FAN_INTERLOCK_REQUIRED'
                ? 'Heatsink Circulation Fan must be active (ON) before Peltier heating can be enabled to prevent thermal runaway.'
                : blockedReason === 'SAFETY_CUTOFF_ACTIVE'
                ? 'Chamber temperature exceeded 38.0°C safety cutoff. Actuators remain locked out until cooled.'
                : blockedReason}
            </span>
          </div>
        </div>
      )}

      {/* -- Top row: gauge + key values -- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ThermalGauge card */}
        <InstrumentCard className="p-6 flex flex-col items-center justify-center gap-4">
          <ThermalGauge
            current={chamberTemp}
            target={targetTemp}
            min={20}
            max={40}
            label="CHAMBER TEMP"
          />
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-200 pt-3">
            <span>
              Driver Status: <span className="text-slate-800 font-semibold">{peltierDriverStatus}</span>
            </span>
            {manualOverrideActive && (
              <span className="flex items-center gap-1 text-amber-700 font-bold">
                <ToggleLeft className="w-3.5 h-3.5" />
                MANUAL OVERRIDE
              </span>
            )}
          </div>
        </InstrumentCard>

        {/* 2x2 key values grid */}
        <div className="grid grid-cols-2 gap-3">
          {keyValues.map(({ label, value, unit, note }) => (
            <InstrumentCard key={label} className="p-4 flex flex-col gap-1 justify-center">
              <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wide font-medium">
                {label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-bold tabular-nums text-slate-900">
                  {value}
                </span>
                {unit && (
                  <span className="text-xs font-mono text-slate-500">{unit}</span>
                )}
              </div>
              {note && (
                <span className="text-[10px] font-mono text-slate-400">{note}</span>
              )}
            </InstrumentCard>
          ))}
        </div>
      </div>

      {/* -- Thermal Actuator controls -- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold font-sans text-slate-800">Thermal Actuator (PWM Driver)</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">TYPE: NOT CONFIRMED (PTC/Peltier)</span>
        </div>

        {/* Current state row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="space-y-0.5">
            <span className="text-slate-500 font-sans text-[11px]">Commanded</span>
            <div className="font-mono font-bold text-slate-800">{commandedPeltier || peltierCommand}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 font-sans text-[11px]">Actual State</span>
            <div className={`font-mono font-bold ${actualPeltier === 'HEATING' ? 'text-amber-700' : actualPeltier === 'COOLING' ? 'text-blue-700' : 'text-slate-800'}`}>
              {actualPeltier || peltierCommand}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 font-sans text-[11px]">Direction</span>
            <div className="font-mono font-bold text-slate-800">{peltierDirection}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 font-sans text-[11px]">PWM Duty</span>
            <div className="font-mono font-bold text-slate-800">
              {peltierPwm} <span className="text-slate-500">({pwmPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Command buttons */}
        <div className="flex flex-wrap gap-2">
          {actuatorBtns.map(({ cmd, label, active, idle }) => (
            <button
              key={cmd}
              onClick={() => updateThermalControls({ peltierCommand: cmd })}
              disabled={hardwareSafetyStatus === 'FAULT'}
              className={`px-5 py-2 rounded-xl text-xs font-mono font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                peltierCommand === cmd ? active : idle
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* PWM slider */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-sans text-slate-600">
            <span>PWM Power Duty Cycle</span>
            <span className="font-mono text-slate-900 font-bold tabular-nums">
              {peltierPwm} / 255 ({pwmPercent}%)
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={255}
            step={1}
            value={peltierPwm}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            onChange={(e) => updateThermalControls({ peltierPwm: Number(e.target.value) })}
            disabled={hardwareSafetyStatus === 'FAULT' || peltierCommand === 'OFF'}
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>0 (0%)</span>
            <span>128 (50%)</span>
            <span>255 (100%)</span>
          </div>
        </div>
      </div>

      {/* -- Fan controls -- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold font-sans text-slate-800">Circulation Fan (Relay / PWM)</h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Cmd: <strong className="text-slate-800">{commandedFan || fanCommand}</strong></span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">Actual: <strong className={actualFan === 'HIGH' ? 'text-blue-700' : 'text-slate-800'}>{actualFan || (fanCommand !== 'OFF' ? 'HIGH' : 'OFF')}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {fanBtns.map(({ cmd, label }) => (
            <button
              key={cmd}
              onClick={() => updateThermalControls({ fanCommand: cmd })}
              className={`px-5 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                fanCommand === cmd
                  ? fanActiveColor(cmd)
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Speed bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: fanWidthMap[fanCommand],
              background: fanColorMap[fanCommand],
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>OFF</span>
          <span>LOW</span>
          <span>MED</span>
          <span>HIGH</span>
          <span>MAX</span>
        </div>
      </div>

      {/* -- Safety interlock status -- */}
      <div className={`rounded-2xl border p-5 ${safety.bg} ${safety.border}`}>
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex-shrink-0 shadow-xs">
            <SafetyIcon className={`w-5 h-5 ${safety.text}`} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`text-sm font-mono font-extrabold tracking-wider ${safety.text}`}>
                HARDWARE INTERLOCK: {safety.label}
              </span>
              {hardwareSafetyStatus === 'CUTOFF_ACTIVE' && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                    ACTUATORS DISABLED
                  </span>
                  <button
                    type="button"
                    onClick={() => resetSafety()}
                    className="px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-mono text-[10px] font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    RESET SAFETY INTERLOCK
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs font-sans text-slate-600 leading-relaxed">{safety.desc}</p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs font-mono text-slate-600">
              <span>
                Chamber: <strong className="text-slate-800 tabular-nums">{chamberTemp !== null ? `${chamberTemp.toFixed(2)}°C` : '--'}</strong>
              </span>
              <span>
                Setpoint: <strong className="text-slate-800 tabular-nums">{targetTemp.toFixed(1)}°C</strong>
              </span>
              <span>
                Offset:{' '}
                <strong className={`tabular-nums ${
                  chamberTemp === null
                    ? 'text-slate-400'
                    : Math.abs(chamberTemp - targetTemp) < 0.5
                    ? 'text-emerald-700'
                    : Math.abs(chamberTemp - targetTemp) < 1.5
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}>
                  {chamberTemp !== null ? `${(chamberTemp - targetTemp).toFixed(2)}°C` : '--'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical disclaimer */}
      <ClinicalDisclaimer compact />
    </div>
  );
};
