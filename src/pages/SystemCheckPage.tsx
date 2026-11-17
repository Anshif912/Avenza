import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Activity, Camera, Cpu, Thermometer, Wifi, ShieldCheck, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';
import { SectionHeader, StepIndicator } from '../components/design-system/DesignSystemComponents';

const CHECKS = [
  { id: 'cam',     icon: Camera,    label: 'Laptop Webcam',        detail: 'USB/integrated camera driver, ROI calibration readiness', target: 'Chest/Abdomen ROI lock achievable' },
  { id: 'ppg',     icon: Activity,  label: 'MAX30102 PPG Sensor',  detail: 'I²C address 0x57 · SpO₂ & Heart Rate channels', target: 'Signal noise < 8% · Perfusion index > 0.5' },
  { id: 'thermal', icon: Thermometer,label: 'MLX90614 Thermal',    detail: 'I²C address 0x5A · contactless skin temperature', target: 'Range 20–42°C · Error < 0.5°C' },
  { id: 'esp32',   icon: Cpu,       label: 'ESP32 Firmware',       detail: 'Firmware v1.2 · WebSocket endpoint', target: 'Roundtrip latency < 50ms' },
  { id: 'ws',      icon: Wifi,      label: 'WebSocket Stream',     detail: '100 Hz telemetry pipeline · packet integrity', target: '< 2ms jitter · No packet loss' },
  { id: 'peltier', icon: ShieldCheck,label: 'Peltier Thermal Control', detail: 'L298N driver · PID loop calibration', target: 'Temperature setpoint ±0.5°C achievable' },
  { id: 'safety',  icon: ShieldCheck,label: 'Hardware Safety Interlock', detail: 'Bimetallic relay · independent cutoff circuit', target: 'Cutoff at 35.0°C · Relay normally open' },
];

type CheckState = 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL';

export const SystemCheckPage: React.FC = () => {
  const navigate = useNavigate();
  const [states, setStates] = useState<Record<string, CheckState>>(
    Object.fromEntries(CHECKS.map(c => [c.id, 'PENDING']))
  );
  const [running, setRunning] = useState(false);

  const runChecks = async () => {
    setRunning(true);
    setStates(Object.fromEntries(CHECKS.map(c => [c.id, 'PENDING'])));

    for (const check of CHECKS) {
      setStates(prev => ({ ...prev, [check.id]: 'RUNNING' }));
      await new Promise(res => setTimeout(res, 600 + Math.random() * 400));
      // Simulate: camera and ppg always pass in demo; others have small random pass rate
      const pass = check.id === 'cam' || check.id === 'ppg' || Math.random() > 0.15;
      setStates(prev => ({ ...prev, [check.id]: pass ? 'PASS' : 'FAIL' }));
    }
    setRunning(false);
  };

  const allDone = Object.values(states).every(s => s === 'PASS' || s === 'FAIL');
  const allPass = allDone && Object.values(states).every(s => s === 'PASS');
  const failCount = Object.values(states).filter(s => s === 'FAIL').length;
  const passCount = Object.values(states).filter(s => s === 'PASS').length;

  const stepStates = CHECKS.map(c => states[c.id]);
  const completedSteps = stepStates.filter(s => s === 'PASS' || s === 'FAIL').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        icon={ShieldCheck}
        title="Pre-Flight System Diagnostic"
        subtitle="7-point hardware verification before activating live monitoring"
        badge="PRE-FLIGHT CHECK"
        badgeVariant="blue"
        action={
          <button
            onClick={runChecks}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold rounded-xl shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running Diagnostics...' : 'Run All Checks'}
          </button>
        }
      />

      {/* Step progress indicator */}
      <StepIndicator
        steps={CHECKS.map(c => c.label.split(' ')[0])}
        current={completedSteps}
      />

      {/* Summary bar (once complete) */}
      {allDone && (
        <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
          allPass
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {allPass
            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          }
          <span className="text-sm font-sans font-semibold">
            {allPass
              ? `All ${passCount} checks passed: system ready for live monitoring.`
              : `${passCount} of ${CHECKS.length} passed · ${failCount} failed: review hardware before proceeding.`
            }
          </span>
        </div>
      )}

      {/* Vertical timeline checklist */}
      <div className="relative space-y-0">
        {/* Timeline spine */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

        {CHECKS.map((check, i) => {
          const state = states[check.id];
          const Icon = check.icon;
          return (
            <div key={check.id} className="relative flex gap-4 pb-5 last:pb-0">
              {/* Timeline node */}
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                state === 'PASS'    ? 'bg-emerald-50 border-emerald-500' :
                state === 'FAIL'   ? 'bg-rose-50 border-rose-500' :
                state === 'RUNNING'? 'bg-blue-50 border-blue-500 animate-pulse' :
                                     'bg-white border-slate-200'
              }`}>
                {state === 'PASS'    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                 state === 'FAIL'   ? <AlertCircle className="w-4 h-4 text-rose-600" /> :
                 state === 'RUNNING'? <RotateCcw className="w-4 h-4 text-blue-600 animate-spin" /> :
                                      <span className="text-xs font-mono font-bold text-slate-500">{i + 1}</span>
                }
              </div>

              {/* Content */}
              <div className={`flex-1 pb-2.5 pt-2 px-4 rounded-xl border transition-all duration-300 ${
                state === 'PASS'    ? 'bg-white border-slate-200 hover:border-emerald-300' :
                state === 'FAIL'   ? 'bg-rose-50/40 border-rose-200' :
                state === 'RUNNING'? 'bg-blue-50/30 border-blue-200' :
                                     'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      state === 'PASS' ? 'text-emerald-600' : state === 'FAIL' ? 'text-rose-600' :
                      state === 'RUNNING' ? 'text-blue-600' : 'text-slate-400'
                    }`} />
                    <span className="text-sm font-sans font-semibold text-slate-900">{check.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    state === 'PASS'    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    state === 'FAIL'   ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    state === 'RUNNING'? 'bg-blue-50 text-blue-700 border-blue-200' :
                                         'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {state === 'RUNNING' ? 'CHECKING...' : state}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-slate-500">
                  <span>Protocol: <span className="text-slate-700 font-medium">{check.detail}</span></span>
                  <span>Target: <span className="text-slate-700 font-medium">{check.target}</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Proceed button */}
      {allPass && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold font-sans text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>Proceed to Monitoring</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
