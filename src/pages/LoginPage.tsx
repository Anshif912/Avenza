import React from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { Lock, User, Shield, ChevronRight, AlertTriangle } from 'lucide-react';
import { AvenzaLogo } from '../components/common/AvenzaLogo';

const ROLES = [
  { id: 'neonatologist', label: 'Neonatologist', desc: 'Full clinical access · AI evidence · Discharge authority', color: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-950/30 hover:bg-cyan-950/50' },
  { id: 'nurse', label: 'NICU Nurse', desc: 'Live monitoring · Alerts · Session management', color: 'text-teal-400', border: 'border-teal-500/40', bg: 'bg-teal-950/30 hover:bg-teal-950/50' },
  { id: 'biomedical', label: 'Biomedical Engineer', desc: 'Hardware diagnostics · Firmware · Sensor calibration', color: 'text-violet-400', border: 'border-violet-500/40', bg: 'bg-violet-950/30 hover:bg-violet-950/50' },
];

export const LoginPage: React.FC = () => {
  const { setActiveTab } = useMonitoring();
  const [selectedRole, setSelectedRole] = React.useState('neonatologist');
  const [username, setUsername] = React.useState('staff@nicu.local');
  const [password, setPassword] = React.useState('••••••••');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('sessionSetup');
  };

  return (
    <div className="min-h-[75vh] flex items-start justify-center pt-6 animate-fade-in-up">

      {/* Asymmetric two-column layout */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-card overflow-hidden border border-line-0 shadow-overlay">

        {/* LEFT — Brand identity ambient panel */}
        <div className="lg:col-span-2 bg-surface-0 bg-grid-subtle border-b lg:border-b-0 lg:border-r border-line-0 p-8 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Brand mark */}
            <div>
              <AvenzaLogo size="lg" showBadge />
            </div>

            {/* Clinical context statement */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold font-sans text-slate-100 leading-snug">
                AI-Assisted Neonatal<br />Monitoring Console
              </h2>
              <p className="text-sm font-sans text-slate-400 leading-relaxed">
                Clinical-grade telemetry for neonatal intensive care. Multimodal fusion of non-contact vision, optical PPG, and thermal regulation.
              </p>
            </div>

            {/* Security markers */}
            <div className="space-y-2.5">
              {[
                { icon: Shield, text: 'Local evaluation — No PHI transmitted' },
                { icon: Lock, text: 'Role-based access controls' },
                { icon: AlertTriangle, text: 'Prototype Authentication' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2.5 text-xs font-sans text-slate-400">
                  <item.icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: status */}
          <div className="pt-6 border-t border-line-0 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-300 font-bold">READY FOR INTAKE</span>
            <span className="text-slate-500 ml-auto">v2.4</span>
          </div>
        </div>

        {/* RIGHT — Authentication form */}
        <div className="lg:col-span-3 bg-surface-1 p-8 lg:p-10 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-sans text-slate-100">Operator Authentication</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-0 text-slate-400 border border-line-0">
                PROTOTYPE AUTH
              </span>
            </div>
            <p className="text-sm font-sans text-slate-400 mt-1">
              Select your clinical role to initialize session intake.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Clinical Role</label>
              <div className="space-y-2">
                {ROLES.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                      selectedRole === role.id
                        ? `${role.bg} ${role.border}`
                        : 'bg-surface-0 border-line-0 hover:border-line-1'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selectedRole === role.id ? role.border + ' bg-current' : 'border-line-1'
                    }`}>
                      {selectedRole === role.id && <div className={`w-2 h-2 rounded-full ${role.color.replace('text-', 'bg-')}`} />}
                    </div>
                    <div>
                      <div className={`text-sm font-sans font-semibold ${selectedRole === role.id ? role.color : 'text-slate-300'}`}>
                        {role.label}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{role.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Operator ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="staff@nicu.local"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-0 border border-line-0 focus:border-medical-cyan rounded-xl text-sm font-sans text-slate-200 placeholder:text-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Access Code</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-0 border border-line-0 focus:border-medical-cyan rounded-xl text-sm font-sans text-slate-200 placeholder:text-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Primary Submit */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-medical-cyan hover:brightness-110 text-black font-extrabold font-sans text-sm rounded-card shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Sign In & Begin Session Setup</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
