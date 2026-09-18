import React from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import {
  Compass, Lock, Baby, LayoutDashboard, BrainCircuit,
  Activity, AlertTriangle, History, RotateCcw, BarChart3, Thermometer,
  Cpu, Settings
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'cyan' | 'violet' | 'amber' | 'rose' | 'emerald';
  count?: number;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts } = useMonitoring();
  const criticalUnackCount = alerts.filter(a => !a.acknowledged && a.severity === 'CRITICAL').length;

  // Primary clinical workflow
  const primaryNav: NavItem[] = [
    { id: 'landing',       label: 'Overview',          icon: Compass },
    { id: 'login',         label: 'Operator Login',    icon: Lock },
    { id: 'sessionSetup',  label: 'Patient Setup',     icon: Baby },
    { id: 'dashboard',     label: 'Command Center',    icon: LayoutDashboard },
    { id: 'aiApnea',       label: 'AI Apnea Evidence', icon: BrainCircuit, badge: 'PROTOTYPE', badgeVariant: 'violet' },
    { id: 'liveMonitoring',label: '8-Channel Streams', icon: Activity },
    { id: 'alerts',        label: 'Alerts & Triage',   icon: AlertTriangle, count: criticalUnackCount },
    { id: 'eventHistory',  label: 'Event History',     icon: History },
    { id: 'eventReplay',   label: 'Event Replay',      icon: RotateCcw },
    { id: 'analytics',     label: 'Analytics',         icon: BarChart3 },
  ];

  // Secondary: hardware & configuration
  const secondaryNav: NavItem[] = [
    { id: 'thermal',       label: 'Thermal Control',   icon: Thermometer },
    { id: 'sensorHealth',  label: 'Sensor Matrix',     icon: Cpu },
    { id: 'session',       label: 'Session Profile',   icon: Baby },
    { id: 'settings',      label: 'Configuration',     icon: Settings },
  ];

  const badgeClsMap: Record<string, string> = {
    cyan:    'bg-cyan-950 text-cyan-300 border-cyan-500/30',
    violet:  'bg-violet-950 text-violet-300 border-violet-500/30',
    amber:   'bg-amber-950 text-amber-300 border-amber-500/30',
    rose:    'bg-rose-950 text-rose-300 border-rose-500/30',
    emerald: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans font-medium transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-medical-cyan/10 text-medical-cyan border border-medical-cyan/30 shadow-sm'
            : 'text-slate-300 hover:bg-surface-2 hover:text-slate-100 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-medical-cyan' : 'text-slate-500'}`} />
          <span className="truncate">{item.label}</span>
        </div>

        {item.badge && !isActive && (
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${badgeClsMap[item.badgeVariant ?? 'cyan']}`}>
            {item.badge}
          </span>
        )}

        {item.count !== undefined && item.count > 0 && (
          <span className="flex-shrink-0 text-[10px] font-mono font-bold w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
            {item.count > 9 ? '9+' : item.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-full md:w-60 bg-surface-1 border-r border-line-0 flex-shrink-0 flex flex-col justify-between select-none h-full overflow-hidden">
      <div className="py-4 px-2.5 space-y-5 overflow-y-auto flex-1 min-h-0">

        {/* Primary Clinical Workflow */}
        <div className="space-y-0.5">
          <div className="px-3 pb-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.15em] flex items-center justify-between">
            <span>Clinical Telemetry</span>
            {criticalUnackCount > 0 && (
              <span className="text-rose-400 text-[9px]">{criticalUnackCount} CRIT</span>
            )}
          </div>
          <nav className="space-y-0.5">
            {primaryNav.map(renderNavItem)}
          </nav>
        </div>

        {/* Secondary */}
        <div className="space-y-0.5 pt-2 border-t border-line-0">
          <div className="px-3 pb-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.15em]">
            Hardware & Controls
          </div>
          <nav className="space-y-0.5">
            {secondaryNav.map(renderNavItem)}
          </nav>
        </div>
      </div>

      {/* Sidebar footer */}
      <div className="p-3 border-t border-line-0 bg-surface-0 font-mono text-[10px] space-y-1.5">
        <div className="flex items-center justify-between text-slate-500">
          <span>Firmware</span>
          <span className="text-cyan-400 font-bold">ESP32-v1.0</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>AI Engine</span>
          <span className="text-violet-400 font-bold">v2.4-Fusion</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Data Link</span>
          <span className="text-emerald-400 font-bold">USB SERIAL</span>
        </div>
      </div>
    </aside>
  );
};
