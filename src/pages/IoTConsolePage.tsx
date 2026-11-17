import React from 'react';
import { Sliders, Cpu, ShieldCheck } from 'lucide-react';
import { ESP32IoTConsole } from '../components/iot/ESP32IoTConsole';

export const IoTConsolePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sliders className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold font-sans text-slate-900 tracking-tight">
              NeoNattle IoT Hardware Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            ESP32 Wi-Fi REST telemetry, sensor diagnostic matrix, and safe actuator regulation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            ESP32 DevKit
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Firmware v1.2.0
          </span>
        </div>
      </div>

      {/* Main Console Workspace */}
      <ESP32IoTConsole />
    </div>
  );
};

export default IoTConsolePage;
