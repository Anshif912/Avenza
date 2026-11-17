import React, { useState } from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import {
  Cpu, Thermometer, Droplets, Activity, Zap,
  ArrowRight, ShieldCheck, CheckCircle2, ChevronRight,
  Radio, HardDrive, Sliders, Layers
} from 'lucide-react';

export interface HardwareNode {
  id: string;
  name: string;
  shortName: string;
  role: string;
  bus: string;
  pin: string;
  rate: string;
  status: 'Active' | 'Nominal' | 'Ready';
  telemetryKey: string;
  telemetryValue: string;
  telemetryUnit: string;
  telemetryDetail: string;
  description: string;
  actionTab: string;
  actionLabel: string;
}

export const HARDWARE_NODES: HardwareNode[] = [
  {
    id: 'esp32',
    name: 'ESP32-WROOM-32D',
    shortName: 'Host Controller',
    role: 'Real-Time Edge Telemetry Node',
    bus: 'USB-UART Serial',
    pin: 'USB-C Bridge',
    rate: '115,200 Baud',
    status: 'Nominal',
    telemetryKey: 'Core Clock',
    telemetryValue: '240',
    telemetryUnit: 'MHz',
    telemetryDetail: 'Local ring-buffer telemetry dispatcher · 100 Hz dispatch loop',
    description: 'Dual-core Xtensa MCU orchestrating 1-Wire, I²C, and PWM peripheral buses with zero cloud dependency.',
    actionTab: 'sensorHealth',
    actionLabel: 'Inspect Host Health',
  },
  {
    id: 'ds18b20',
    name: 'DS18B20 Chamber Probe',
    shortName: 'Chamber Temp',
    role: 'Chamber Air Temperature',
    bus: 'Dallas 1-Wire',
    pin: 'GPIO 4',
    rate: '1 Hz Sampling',
    status: 'Active',
    telemetryKey: 'Chamber Temp',
    telemetryValue: '36.5',
    telemetryUnit: '°C',
    telemetryDetail: '±0.5°C calibrated accuracy · Target: 36.5°C (Stable band)',
    description: 'Stainless steel sealed probe providing primary closed-loop feedback to the thermal regulation driver.',
    actionTab: 'thermal',
    actionLabel: 'Thermal Regulation',
  },
  {
    id: 'dht11',
    name: 'DHT11 Sensor',
    shortName: 'Chamber Humidity',
    role: 'Micro-Climate Relative Humidity',
    bus: 'Single-Wire GPIO',
    pin: 'GPIO 15',
    rate: '0.5 Hz Sampling',
    status: 'Active',
    telemetryKey: 'Relative Humidity',
    telemetryValue: '58',
    telemetryUnit: '% RH',
    telemetryDetail: 'Optimal neonatal range (50–60% RH) · Guard against TEWL',
    description: 'Vented chamber sensor tracking ambient moisture to prevent neonatal transepidermal water loss.',
    actionTab: 'thermal',
    actionLabel: 'Humidity Controls',
  },
  {
    id: 'max30102',
    name: 'MAX30102 Oximeter',
    shortName: 'PPG & SpO₂',
    role: 'Optical Pulse & Saturation',
    bus: 'I²C Fast Mode',
    pin: 'I²C 0x57 (GPIO 21/22)',
    rate: '100 Hz Sampling',
    status: 'Active',
    telemetryKey: 'Optical SpO₂ / HR',
    telemetryValue: '98% / 138',
    telemetryUnit: 'BPM',
    telemetryDetail: 'Dual Red/IR photoplethysmogram · Perfusion Index: 1.4% (Good)',
    description: 'Optical absorption sensor extracting arterial oxygen saturation and beat-to-beat cardiac timing.',
    actionTab: 'liveMonitoring',
    actionLabel: 'View Live Waveforms',
  },
  {
    id: 'actuator',
    name: 'Actuator Stage Driver',
    shortName: 'Thermal Actuator',
    role: 'Micro-Climate Thermal Stage',
    bus: 'Hardware PWM',
    pin: 'GPIO 18',
    rate: '25 kHz PWM',
    status: 'Active',
    telemetryKey: 'PWM Duty Cycle',
    telemetryValue: '42',
    telemetryUnit: '% Duty',
    telemetryDetail: 'Closed-loop proportional control · Active thermal stabilization',
    description: 'PWM power driver regulating neonatal micro-climate heating element from DS18B20 feedback.',
    actionTab: 'thermal',
    actionLabel: 'Adjust Actuator',
  },
];

export const AvenzaSystemHub: React.FC = () => {
  const { setActiveTab } = useMonitoring();
  const [selectedId, setSelectedId] = useState<string>('max30102');

  const selectedNode = HARDWARE_NODES.find((n) => n.id === selectedId) || HARDWARE_NODES[0];

  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* ── Top Hub Control & Protocol Bar ── */}
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]" />
            </span>
            <span className="font-semibold text-[#172033] tracking-tight text-[11px] sm:text-xs">
              NEONATTLE SYSTEM PROTOTYPE HUB
            </span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:inline">|</span>
          <span className="text-[#475569] hidden md:inline text-[11px]">
            Interactive System Map &amp; Hardware Telemetry Bus
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#475569]">
            <span className="px-2 py-0.5 bg-white border border-[#E2E8F0] rounded font-mono">
              100 Hz Loop
            </span>
            <span className="px-2 py-0.5 bg-white border border-[#E2E8F0] rounded font-mono">
              I²C Fast-Mode
            </span>
            <span className="px-2 py-0.5 bg-white border border-[#E2E8F0] rounded font-mono">
              1-Wire Dallas
            </span>
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-[#2563EB] hover:text-blue-800 font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors text-xs"
          >
            <span>Open Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Strict 3-Column Aligned Hub Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-80 lg:min-h-96 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0]">
        
        {/* Left Support Column (Hardware Subsystems) */}
        <div className="lg:col-span-4 p-3.5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="font-semibold text-[#172033] uppercase tracking-wider text-[10px]">
                Hardware Subsystems
              </span>
              <span className="text-[10px] text-[#94A3B8]">Select to inspect</span>
            </div>

            <div className="space-y-1">
              {HARDWARE_NODES.map((node) => {
                const isSelected = node.id === selectedId;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedId(node.id)}
                    className={`w-full text-left p-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50/70 border-[#2563EB] ring-1 ring-[#2563EB] shadow-xs'
                        : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold truncate text-[11px] ${isSelected ? 'text-[#172033]' : 'text-[#334155]'}`}>
                          {node.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#475569] block truncate mt-0.5">
                        {node.role}
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[9px] font-mono text-[#64748B] block">
                        {node.bus}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-[#475569] border border-slate-200 mt-0.5 inline-block">
                        {node.pin}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] px-1 flex items-center justify-between text-[10px] text-[#64748B]">
            <span>Serial Telemetry Rate</span>
            <span className="font-mono text-[#172033] font-semibold">115,200 Baud</span>
          </div>
        </div>

        {/* Center Stage: Interactive Prototype Architecture & Flow Schematic */}
        <div className="lg:col-span-5 p-3.5 bg-[#F8FAFC] flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Schematic Header */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-[#172033] uppercase tracking-wider text-[10px]">
              System Architecture &amp; Signal Conduits
            </span>
            <span className="text-[9px] font-mono text-[#2563EB] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
              Active Map
            </span>
          </div>

          {/* Interactive Schematic Diagram */}
          <div className="w-full flex-1 flex flex-col justify-center py-1 space-y-2">
            {/* Top Row: Environmental Chamber Node */}
            <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-[#172033] flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                  Chamber Micro-Climate Node
                </span>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Target 36.5°C
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <button
                  onClick={() => setSelectedId('ds18b20')}
                  className={`p-1 rounded-lg border transition-all cursor-pointer ${
                    selectedId === 'ds18b20'
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'bg-slate-50 border-[#E2E8F0] text-[#334155] hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-[9px] text-[#64748B]">1-Wire Temp</span>
                  <span className="font-mono text-[10px]">36.5°C</span>
                </button>
                <button
                  onClick={() => setSelectedId('dht11')}
                  className={`p-1 rounded-lg border transition-all cursor-pointer ${
                    selectedId === 'dht11'
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'bg-slate-50 border-[#E2E8F0] text-[#334155] hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-[9px] text-[#64748B]">GPIO RH</span>
                  <span className="font-mono text-[10px]">58%</span>
                </button>
                <button
                  onClick={() => setSelectedId('actuator')}
                  className={`p-1 rounded-lg border transition-all cursor-pointer ${
                    selectedId === 'actuator'
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'bg-slate-50 border-[#E2E8F0] text-[#334155] hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-[9px] text-[#64748B]">PWM Driver</span>
                  <span className="font-mono text-[10px]">42% Duty</span>
                </button>
              </div>
            </div>

            {/* Middle Row: Central ESP32 Host Node */}
            <div className="flex items-center justify-center">
              <div className="w-0.5 h-2 bg-[#CBD5E1]" />
            </div>

            <button
              onClick={() => setSelectedId('esp32')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left w-full shadow-xs ${
                selectedId === 'esp32'
                  ? 'bg-blue-50/80 border-[#2563EB] ring-1 ring-[#2563EB]'
                  : 'bg-white border-[#E2E8F0] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">
                      ESP32-WROOM-32D Core Dispatcher
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      On-device deterministic capture · Zero cloud latency
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#2563EB] bg-blue-100/60 px-2 py-0.5 rounded">
                  240 MHz
                </span>
              </div>
            </button>

            {/* Middle Row: Conduit to Physiological Site */}
            <div className="flex items-center justify-center">
              <div className="w-0.5 h-2 bg-[#CBD5E1]" />
            </div>

            {/* Bottom Row: Physiological & Optical Capture Site */}
            <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-[#172033] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-600" />
                  Physiological &amp; Optical Signal Site
                </span>
                <span className="text-[9px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  100 Hz I²C
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-center text-xs">
                <button
                  onClick={() => setSelectedId('max30102')}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    selectedId === 'max30102'
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'bg-slate-50 border-[#E2E8F0] text-[#334155] hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-[9px] text-[#64748B]">MAX30102 PPG &amp; SpO₂</span>
                  <span className="font-mono text-[10px] text-emerald-700">98% SpO₂ · 138 BPM</span>
                </button>
                <div className="p-1.5 rounded-lg border bg-slate-50 border-[#E2E8F0] text-[#334155]">
                  <span className="block text-[9px] text-[#64748B]">Camera ROI Differencing</span>
                  <span className="font-mono text-[10px] text-[#2563EB]">30 FPS Flow Tracking</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[#64748B] flex items-center justify-between pt-1.5 border-t border-[#E2E8F0]">
            <span>Click any node to inspect channel specifications</span>
            <span className="font-mono text-[#2563EB]">Live Map Linked</span>
          </div>
        </div>

        {/* Right Support Column: Contextual Telemetry & Channel Inspector */}
        <div className="lg:col-span-3 p-3.5 bg-white flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <span className="font-semibold text-[#172033] uppercase tracking-wider text-[10px]">
                Channel Inspector
              </span>
              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                {selectedNode.status}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-mono uppercase text-[#64748B] block">Selected Subsystem</span>
              <h4 className="text-xs font-bold text-[#172033] mt-0.5">
                {selectedNode.name}
              </h4>
              <p className="text-[10px] text-[#475569] mt-0.5 leading-relaxed">
                {selectedNode.description}
              </p>
            </div>

            {/* Telemetry Metric Tile */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-0.5">
              <span className="text-[9px] text-[#64748B] font-mono block">
                {selectedNode.telemetryKey}
              </span>
              <div className="flex items-baseline gap-1 text-xl font-mono font-bold text-[#172033]">
                {selectedNode.telemetryValue}
                <span className="text-[11px] font-normal text-[#64748B]">
                  {selectedNode.telemetryUnit}
                </span>
              </div>
              <p className="text-[9px] text-[#64748B]">
                {selectedNode.telemetryDetail}
              </p>
            </div>

            {/* Technical Specs List */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between py-0.5 border-b border-slate-100 text-[10px]">
                <span className="text-[#64748B]">Bus Protocol</span>
                <span className="font-mono text-[#172033]">{selectedNode.bus}</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-slate-100 text-[10px]">
                <span className="text-[#64748B]">Hardware Pin</span>
                <span className="font-mono text-[#172033]">{selectedNode.pin}</span>
              </div>
              <div className="flex items-center justify-between py-0.5 text-[10px]">
                <span className="text-[#64748B]">Acquisition Rate</span>
                <span className="font-mono text-[#172033]">{selectedNode.rate}</span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab(selectedNode.actionTab)}
              className="w-full py-2 px-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
            >
              <span>{selectedNode.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ── Bottom Hub Strip: Topology & Flow Summary ── */}
      <div className="px-5 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#475569]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#172033]">Physical Bus Topology:</span>
          <span className="font-mono text-[#64748B]">
            1-Wire (GPIO 4) · I²C (GPIO 21/22) · PWM (GPIO 18) · USB-UART (115,200 Baud)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Local ring-buffer telemetry active</span>
        </div>
      </div>
    </div>
  );
};

export const NeoNattleSystemHub = AvenzaSystemHub;
export default AvenzaSystemHub;
