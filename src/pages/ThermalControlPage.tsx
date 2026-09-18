import React from 'react';
import { Thermometer, Wind, ShieldCheck, ShieldAlert, AlertTriangle, Zap, ToggleLeft } from 'lucide-react';
import { useMonitoring } from '../context/MonitoringContext';
import {
  SectionHeader,
  SpotlightCard,
  ThermalGauge,
  ClinicalDisclaimer,
} from '../components/design-system/DesignSystemComponents';

/* =============================================================
   THERMAL CONTROL PAGE
   Hardware control panel aesthetic -- PID micro-climate command
   ============================================================= */

export const ThermalControlPage: React.FC = () => {
  const { thermal, updateThermalControls } = useMonitoring();

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
      desc: 'All hardware interlocks nominal. PID loop active.',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      icon: ShieldCheck,
    },
    CUTOFF_ACTIVE: {
      label: 'CUTOFF ACTIVE',
      desc: 'Thermal safety cutoff engaged. Peltier disabled. Chamber cooling to safe range.',
      border: 'border-rose-500/60',
      bg: 'bg-rose-950/50',
      text: 'text-rose-300',
      icon: ShieldAlert,
    },
    FAULT: {
      label: 'HARDWARE FAULT',
      desc: 'Driver fault detected. Manual inspection required before resuming operation.',
      border: 'border-amber-500/60',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      icon: AlertTriangle,
    },
    UNVERIFIED: {
      label: 'NOT VERIFIED',
      desc: 'Hardware sensor feedback unverified. Hardware standby mode active.',
      border: 'border-slate-700',
      bg: 'bg-surface-0',
      text: 'text-slate-400',
      icon: ShieldCheck,
    },
  };
  const safety = safetyConfig[hardwareSafetyStatus] ?? safetyConfig.UNVERIFIED;
  const SafetyIcon = safety.icon;

  /* -- Peltier command button configs -- */
  const peltierBtns: {
    cmd: typeof peltierCommand;
    label: string;
    active: string;
    idle: string;
  }[] = [
    {
      cmd: 'HEATING',
      label: 'HEATING',
      active: 'bg-amber-500 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
      idle: 'bg-surface-1 text-slate-400 border-line-0 hover:border-amber-500/50 hover:text-amber-300',
    },
    {
      cmd: 'COOLING',
      label: 'COOLING',
      active: 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]',
      idle: 'bg-surface-1 text-slate-400 border-line-0 hover:border-cyan-500/50 hover:text-cyan-300',
    },
    {
      cmd: 'OFF',
      label: 'OFF',
      active: 'bg-slate-600 text-white border-slate-500',
      idle: 'bg-surface-1 text-slate-400 border-line-0 hover:border-slate-500/50 hover:text-slate-300',
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
    if (cmd === 'OFF')    return 'bg-slate-600 text-white border-slate-500';
    if (cmd === 'LOW')    return 'bg-sky-700 text-white border-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.3)]';
    if (cmd === 'MEDIUM') return 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.35)]';
    if (cmd === 'HIGH')   return 'bg-violet-600 text-white border-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.35)]';
    /* MAX */              return 'bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
  };

  /* -- 2x2 key values -- */
  const keyValues: { label: string; value: string; unit?: string }[] = [
    { label: 'Chamber Temp',  value: chamberTemp !== null ? chamberTemp.toFixed(1) : '--',  unit: '°C' },
    { label: 'Target Temp',   value: targetTemp.toFixed(1),   unit: '°C' },
    { label: 'Humidity',      value: humidity !== null ? humidity.toFixed(0) : '--',     unit: '%'  },
    { label: 'Safety Status', value: hardwareSafetyStatus },
  ];

  const pwmPercent = Math.round((peltierPwm / 255) * 100);

  const fanWidthMap: Record<typeof fanCommand, string> = {
    OFF: '0%', LOW: '20%', MEDIUM: '50%', HIGH: '80%', MAX: '100%',
  };
  const fanColorMap: Record<typeof fanCommand, string> = {
    OFF: 'transparent', LOW: '#0ea5e9', MEDIUM: '#06b6d4', HIGH: '#8b5cf6', MAX: '#ef4444',
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <SectionHeader
        icon={Thermometer}
        title="Thermal Micro-Climate Control"
        badge="PID HARDWARE"
        badgeVariant="cyan"
      />

      {/* -- Top row: gauge + key values -- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ThermalGauge card */}
        <SpotlightCard glowColor="cyan" className="p-6 flex flex-col items-center justify-center gap-4">
          <ThermalGauge
            current={chamberTemp}
            target={targetTemp}
            min={20}
            max={40}
            label="CHAMBER TEMP"
          />
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-line-0 pt-3">
            <span>
              Driver: <span className="text-slate-200">{peltierDriverStatus}</span>
            </span>
            {manualOverrideActive && (
              <span className="flex items-center gap-1 text-amber-400">
                <ToggleLeft className="w-3 h-3" />
                MANUAL OVERRIDE
              </span>
            )}
          </div>
        </SpotlightCard>

        {/* 2x2 key values grid */}
        <div className="grid grid-cols-2 gap-3">
          {keyValues.map(({ label, value, unit }) => (
            <SpotlightCard key={label} glowColor="cyan" className="p-4 flex flex-col gap-1 justify-center">
              <span className="text-[11px] font-sans text-slate-400 uppercase tracking-wide">
                {label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-bold tabular-nums text-slate-100">
                  {value}
                </span>
                {unit && (
                  <span className="text-sm font-mono text-slate-500">{unit}</span>
                )}
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>

      {/* -- Peltier controls -- */}
      <div className="bg-surface-1 border border-line-0 rounded-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold font-sans text-slate-200">Peltier Module Control</h3>
        </div>

        {/* Current state row */}
        <div className="grid grid-cols-3 gap-3 text-[11px]">
          <div className="space-y-0.5">
            <span className="text-slate-500 font-sans">Command</span>
            <div className="font-mono font-bold text-slate-100">{peltierCommand}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 font-sans">Direction</span>
            <div className="font-mono font-bold text-slate-100">{peltierDirection}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 font-sans">PWM Duty</span>
            <div className="font-mono font-bold text-slate-100">
              {peltierPwm} <span className="text-slate-400">({pwmPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Command buttons */}
        <div className="flex flex-wrap gap-2">
          {peltierBtns.map(({ cmd, label, active, idle }) => (
            <button
              key={cmd}
              onClick={() => updateThermalControls({ peltierCommand: cmd })}
              disabled={hardwareSafetyStatus === 'FAULT'}
              className={`px-5 py-2 rounded-lg text-sm font-mono font-bold border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                peltierCommand === cmd ? active : idle
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* PWM slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-sans text-slate-400">
            <span>PWM Duty Cycle</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {peltierPwm} / 255 ({pwmPercent}%)
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={255}
            step={1}
            value={peltierPwm}
            className="clinical-slider w-full"
            onChange={(e) => updateThermalControls({ peltierPwm: Number(e.target.value) })}
            disabled={hardwareSafetyStatus === 'FAULT' || peltierCommand === 'OFF'}
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-600">
            <span>0</span>
            <span>128</span>
            <span>255</span>
          </div>
        </div>
      </div>

      {/* -- Fan controls -- */}
      <div className="bg-surface-1 border border-line-0 rounded-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold font-sans text-slate-200">Circulation Fan Speed</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Current: <span className="text-slate-200 font-bold">{fanCommand}</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {fanBtns.map(({ cmd, label }) => (
            <button
              key={cmd}
              onClick={() => updateThermalControls({ fanCommand: cmd })}
              className={`px-5 py-2 rounded-lg text-sm font-mono font-bold border transition-all duration-150 ${
                fanCommand === cmd
                  ? fanActiveColor(cmd)
                  : 'bg-surface-1 text-slate-400 border-line-0 hover:border-slate-500/50 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Speed bar */}
        <div className="w-full h-1.5 bg-surface-0 rounded-full overflow-hidden border border-line-0">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: fanWidthMap[fanCommand],
              background: fanColorMap[fanCommand],
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-600">
          <span>OFF</span>
          <span>LOW</span>
          <span>MEDIUM</span>
          <span>HIGH</span>
          <span>MAX</span>
        </div>
      </div>

      {/* -- Safety interlock status -- */}
      <div className={`rounded-card border p-5 ${safety.bg} ${safety.border}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-surface-0 border ${safety.border} flex-shrink-0`}>
            <SafetyIcon className={`w-6 h-6 ${safety.text}`} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-base font-mono font-extrabold tracking-widest ${safety.text}`}>
                INTERLOCK: {safety.label}
              </span>
              {hardwareSafetyStatus === 'CUTOFF_ACTIVE' && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-500/30 animate-pulse">
                  PELTIER DISABLED
                </span>
              )}
            </div>
            <p className="text-xs font-sans text-slate-300 leading-relaxed">{safety.desc}</p>
            <div className="flex flex-wrap gap-4 pt-1 text-[11px] font-mono text-slate-400">
              <span>
                Chamber: <span className="text-slate-200 tabular-nums font-bold">{chamberTemp !== null ? `${chamberTemp.toFixed(1)}°C` : '--'}</span>
              </span>
              <span>
                Target: <span className="text-slate-200 tabular-nums font-bold">{targetTemp.toFixed(1)}°C</span>
              </span>
              <span>
                Delta:{' '}
                <span className={`tabular-nums font-bold ${
                  chamberTemp === null
                    ? 'text-slate-400'
                    : Math.abs(chamberTemp - targetTemp) < 0.5
                    ? 'text-emerald-400'
                    : Math.abs(chamberTemp - targetTemp) < 1.5
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {chamberTemp !== null ? `${(chamberTemp - targetTemp).toFixed(1)}°C` : '--'}
                </span>
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
