import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useMonitoring } from '../../context/MonitoringContext';
import {
  LayoutDashboard, Activity, BrainCircuit, Thermometer,
  Cpu, History, Settings, ChevronLeft, ChevronRight, ShieldAlert, Sliders
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export const Sidebar: React.FC = () => {
  const { alerts, serialStatus } = useMonitoring();
  const [collapsed, setCollapsed] = useState(false);
  const unackAlerts = alerts.filter(a => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'WARNING')).length;

  // Streamlined research-instrument navigation with locked routes
  const navItems: NavItem[] = [
    { path: '/dashboard',       label: 'Overview',        icon: LayoutDashboard },
    { path: '/live-monitoring',  label: 'Live Monitoring', icon: Activity },
    { path: '/event-review',     label: 'Event Review',    icon: ShieldAlert, count: unackAlerts },
    { path: '/ai-apnea',         label: 'AI Analysis',     icon: BrainCircuit },
    { path: '/environment',      label: 'Environment',     icon: Thermometer },
    { path: '/iot',              label: 'IoT Hardware',    icon: Sliders },
    { path: '/device-health',    label: 'Device Health',   icon: Cpu },
    { path: '/history',          label: 'History',         icon: History },
    { path: '/settings',         label: 'Settings',        icon: Settings },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-56'
      } bg-white border-r border-slate-200 flex-shrink-0 flex flex-col justify-between select-none h-full overflow-hidden transition-all duration-200 z-20`}
    >
      {/* Top: Navigation List */}
      <div className="py-4 px-2.5 space-y-4 overflow-y-auto flex-1 min-h-0">
        {!collapsed && (
          <div className="px-3 pt-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Workspaces
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `w-full flex items-center ${
                    collapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2 rounded-lg text-xs transition-colors cursor-pointer group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!collapsed && item.count !== undefined && item.count > 0 && (
                      <span className="flex-shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Hardware status snippet + Collapse Button */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60 text-xs space-y-2">
        {!collapsed && (
          <NavLink
            to="/device-health"
            className="flex items-center justify-between text-[11px] text-slate-500 font-mono hover:text-blue-700 transition-colors cursor-pointer"
            title="Inspect ESP32 & Sensors"
          >
            <span>Link:</span>
            <span
              className={`font-semibold ${
                serialStatus === 'CONNECTED' ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {serialStatus === 'CONNECTED' ? 'ESP32 (115k)' : 'Disconnected'}
            </span>
          </NavLink>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-1.5 py-1 text-slate-400 hover:text-slate-700 text-xs rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px]">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
