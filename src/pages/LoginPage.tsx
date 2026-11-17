import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitoring } from '../context/MonitoringContext';
import { Lock, User, Shield, ChevronRight, Cpu, Radio, Play } from 'lucide-react';
import { NeoNattleLogo } from '../components/common/AvenzaLogo';

const OPERATOR_ROLES = [
  {
    id: 'researcher',
    label: 'Research Evaluator',
    desc: 'Full prototype telemetry, multimodal algorithm weights, and event triage',
    color: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50/80',
    badge: 'FULL ACCESS'
  },
  {
    id: 'operator',
    label: 'Hardware & Sensor Operator',
    desc: 'ESP32 Web Serial link, I²C calibration, and thermal actuator diagnostics',
    color: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/80',
    badge: 'HARDWARE'
  },
  {
    id: 'guest',
    label: 'Demonstration & Academic Review',
    desc: 'Interactive demo telemetry, event replay review, and system architecture',
    color: 'text-violet-700',
    border: 'border-violet-200',
    bg: 'bg-violet-50/80',
    badge: 'DEMO'
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setMode } = useMonitoring();
  const [selectedRole, setSelectedRole] = React.useState('researcher');
  const [operatorId, setOperatorId] = React.useState('operator@lab.local');
  const [sessionPin, setSessionPin] = React.useState('••••••••');

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'guest') {
      setMode('DEMO');
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">

      {/* Two-column layout */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">

        {/* LEFT: System Overview & Architecture */}
        <div className="lg:col-span-2 bg-slate-50 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 space-y-8">
          <div className="space-y-6">
            <div>
              <NeoNattleLogo size="lg" showBadge badgeText="PROTOTYPE" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-[#172033] leading-snug">
                Intelligent Neonatal Monitoring &amp; Environmental Control Prototype
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Academic engineering demonstration console for real-time ESP32 physiological telemetry and multimodal algorithm validation.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              {[
                { icon: Shield, text: 'Local in-browser inference · Zero external transmission' },
                { icon: Cpu,    text: 'ESP32 Web Serial API link (115,200 baud)' },
                { icon: Radio,  text: 'Dual-mode: Live USB hardware or interactive simulation' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2.5 text-xs text-slate-600 font-sans">
                  <item.icon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>SYSTEM READY</span>
            </span>
            <span>v2.4 Prototype</span>
          </div>
        </div>

        {/* RIGHT: Operator Authentication & Role Selection */}
        <div className="lg:col-span-3 p-8 lg:p-10 space-y-6 bg-white">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#172033] tracking-tight">
                Operator Authorization
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                LAB SESSION
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select an operator profile to initialize the monitoring session.
            </p>
          </div>

          <form onSubmit={handleStartSession} className="space-y-5">
            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Session Profile
              </label>
              <div className="space-y-2">
                {OPERATOR_ROLES.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === role.id
                        ? `${role.bg} ${role.border} ring-1 ring-blue-500/20 shadow-sm`
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${selectedRole === role.id ? role.color : 'text-slate-800'}`}>
                          {role.label}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/80 border border-slate-200 text-slate-500 font-semibold">
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                        {role.desc}
                      </p>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      selectedRole === role.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}>
                      {selectedRole === role.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Operator Identifier */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Operator Identifier
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={operatorId}
                  onChange={e => setOperatorId(e.target.value)}
                  placeholder="operator@lab.local"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Session PIN */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Session Access PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={sessionPin}
                  onChange={e => setSessionPin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Initialize Monitoring Console</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
