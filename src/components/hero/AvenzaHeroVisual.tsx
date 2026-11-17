import React, { useState } from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import { ArrowRight, Thermometer, Cpu, Activity } from 'lucide-react';

interface PrototypeZone {
  id: 'chamber' | 'core' | 'sensors';
  title: string;
  subtitle: string;
  summary: string;
  targetTab: string;
}

const ZONES: Record<string, PrototypeZone> = {
  chamber: {
    id: 'chamber',
    title: 'Neonatal Micro-Climate Chamber',
    subtitle: 'Chamber Environment',
    summary: 'Closed-loop thermal regulation maintaining 36.5°C with continuous humidity surveillance.',
    targetTab: 'thermal',
  },
  core: {
    id: 'core',
    title: 'Edge Telemetry Controller',
    subtitle: 'Processing Core',
    summary: 'Local deterministic 100 Hz signal acquisition with zero cloud latency.',
    targetTab: 'sensorHealth',
  },
  sensors: {
    id: 'sensors',
    title: 'Optical & Physiological Stage',
    subtitle: 'Signal Acquisition',
    summary: 'Dual-wavelength optical absorption and non-contact camera motion differencing.',
    targetTab: 'liveMonitoring',
  },
};

export const AvenzaHeroVisual: React.FC = () => {
  const { setActiveTab } = useMonitoring();
  const [activeZone, setActiveZone] = useState<'chamber' | 'core' | 'sensors' | null>(null);

  const selected = activeZone ? ZONES[activeZone] : null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* ── Main Central Visual Surface ── */}
      <div className="relative w-full h-[360px] sm:h-[400px] bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden flex flex-col items-center justify-between p-6 transition-all">
        
        {/* Subtle Ambient Background Grid & Radial Softness */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Quiet System Label */}
        <div className="w-full flex items-center justify-between z-10 text-xs text-[#64748B]">
          <span className="font-medium tracking-tight text-[#172033]">
            NeoNattle Prototype · Physical Architecture
          </span>
          <span className="text-[11px] text-[#94A3B8]">
            Click any section to inspect
          </span>
        </div>

        {/* ── Central Hardware Elevation Illustration ── */}
        <div className="relative w-full max-w-lg flex-1 flex items-center justify-center z-10 py-4">
          <svg
            className="w-full h-full max-h-[240px] drop-shadow-sm select-none"
            viewBox="0 0 540 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Base Table / Ground Plane Shadow */}
            <ellipse cx="270" cy="205" rx="230" ry="12" fill="#E2E8F0" fillOpacity="0.5" />

            {/* Stage 1: Base Chassis Platform */}
            <rect
              x="60"
              y="160"
              width="420"
              height="36"
              rx="8"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            {/* Chassis Mounting Details */}
            <line x1="80" y1="178" x2="460" y2="178" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="80" cy="178" r="3" fill="#94A3B8" />
            <circle cx="460" cy="178" r="3" fill="#94A3B8" />

            {/* ── ZONE 1: Chamber Canopy & Thermal Stage (Left) ── */}
            <g
              onClick={() => setActiveZone(activeZone === 'chamber' ? null : 'chamber')}
              className="cursor-pointer transition-all group"
            >
              {/* Chamber Dome Enclosure */}
              <path
                d="M 90 160 C 90 90, 230 90, 230 160 Z"
                fill={activeZone === 'chamber' ? '#EFF6FF' : '#FFFFFF'}
                stroke={activeZone === 'chamber' ? '#2563EB' : '#94A3B8'}
                strokeWidth={activeZone === 'chamber' ? '2' : '1.5'}
                className="transition-colors duration-200"
              />
              {/* Internal Thermal Sensor Capsule & Probe */}
              <line x1="160" y1="105" x2="160" y2="148" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
              <circle cx="160" cy="150" r="5" fill="#D97706" />
              <circle cx="160" cy="105" r="3" fill="#B45309" />

              {/* Chamber Internal Setpoint Atmosphere Indicator */}
              <text x="160" y="132" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="IBM Plex Sans" fontWeight="500">
                36.5°C
              </text>

              {/* Direct Adjacent Label */}
              <text
                x="160"
                y="80"
                textAnchor="middle"
                fill={activeZone === 'chamber' ? '#2563EB' : '#475569'}
                fontSize="11"
                fontFamily="IBM Plex Sans"
                fontWeight="600"
                className="group-hover:fill-[#2563EB] transition-colors"
              >
                Chamber Environment
              </text>
            </g>

            {/* Bus Cable Conduit between Chamber & Core */}
            <path d="M 230 160 L 255 160" stroke="#CBD5E1" strokeWidth="2" />

            {/* ── ZONE 2: Core Processing Unit (Center) ── */}
            <g
              onClick={() => setActiveZone(activeZone === 'core' ? null : 'core')}
              className="cursor-pointer transition-all group"
            >
              {/* MCU Enclosure Box */}
              <rect
                x="245"
                y="115"
                width="70"
                height="45"
                rx="6"
                fill={activeZone === 'core' ? '#EFF6FF' : '#FFFFFF'}
                stroke={activeZone === 'core' ? '#2563EB' : '#64748B'}
                strokeWidth={activeZone === 'core' ? '2' : '1.5'}
                className="transition-colors duration-200"
              />
              {/* Xtensa Core Chip Representation */}
              <rect x="260" y="125" width="40" height="25" rx="3" fill="#172033" />
              <circle cx="280" cy="137.5" r="2.5" fill="#2563EB" />

              {/* Direct Adjacent Label */}
              <text
                x="280"
                y="102"
                textAnchor="middle"
                fill={activeZone === 'core' ? '#2563EB' : '#475569'}
                fontSize="11"
                fontFamily="IBM Plex Sans"
                fontWeight="600"
                className="group-hover:fill-[#2563EB] transition-colors"
              >
                Processing Core
              </text>
            </g>

            {/* Bus Cable Conduit between Core & Optical Sensor */}
            <path d="M 315 160 L 340 160" stroke="#CBD5E1" strokeWidth="2" />

            {/* ── ZONE 3: Optical & Physiological Sensing Stage (Right) ── */}
            <g
              onClick={() => setActiveZone(activeZone === 'sensors' ? null : 'sensors')}
              className="cursor-pointer transition-all group"
            >
              {/* Sensor Bed Platform */}
              <path
                d="M 330 160 C 330 110, 450 110, 450 160 Z"
                fill={activeZone === 'sensors' ? '#EFF6FF' : '#FFFFFF'}
                stroke={activeZone === 'sensors' ? '#2563EB' : '#94A3B8'}
                strokeWidth={activeZone === 'sensors' ? '2' : '1.5'}
                className="transition-colors duration-200"
              />

              {/* Optical Emitters (Dual Red / IR LEDs) */}
              <circle cx="380" cy="142" r="4" fill="#DC2626" />
              <circle cx="400" cy="142" r="4" fill="#E11D48" />

              {/* Pulsing Light Guide */}
              <circle cx="390" cy="142" r="14" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" className="animate-pulse" />

              {/* Direct Adjacent Label */}
              <text
                x="390"
                y="80"
                textAnchor="middle"
                fill={activeZone === 'sensors' ? '#2563EB' : '#475569'}
                fontSize="11"
                fontFamily="IBM Plex Sans"
                fontWeight="600"
                className="group-hover:fill-[#2563EB] transition-colors"
              >
                Optical PPG &amp; Motion
              </text>
            </g>
          </svg>
        </div>

        {/* ── Bottom Dock: Progressive Disclosure Bar ── */}
        <div className="w-full h-11 border-t border-[#E2E8F0] pt-2 flex items-center justify-between z-10 text-xs">
          {selected ? (
            <div className="w-full flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-left min-w-0">
                <span className="font-semibold text-[#172033] whitespace-nowrap">
                  {selected.title}:
                </span>
                <span className="text-[#475569] truncate">
                  {selected.summary}
                </span>
              </div>
              <button
                onClick={() => setActiveTab(selected.targetTab)}
                className="text-[#2563EB] hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <span>Inspect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between text-[#94A3B8] text-[11px]">
              <span>Three integrated physical subsystems: Chamber, Edge Controller, Optical PPG</span>
              <span className="text-[#64748B]">Integrated Hardware Platform</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export const NeoNattleHeroVisual = AvenzaHeroVisual;
export default AvenzaHeroVisual;
