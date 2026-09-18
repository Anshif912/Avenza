import React from 'react';
import { BRAND } from '../../config/brand';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconOnly?: boolean;
  showTagline?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

export const AvenzaMark: React.FC<{ sizePx?: number; className?: string }> = ({
  sizePx = 32,
  className = ''
}) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`flex-shrink-0 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="avzGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
      <linearGradient id="avzGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
      </linearGradient>
    </defs>

    {/* Background Glow Container */}
    <rect width="32" height="32" rx="8" fill="#070b14" stroke="#1c2d5a" strokeWidth="1" />
    <rect width="32" height="32" rx="8" fill="url(#avzGlow)" />

    {/* Outer Geometric 'A' Apex & Legs */}
    <path
      d="M 6 25 L 16 6 L 26 25"
      stroke="url(#avzGrad)"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Precision Pulse Waveform Crossbar */}
    <path
      d="M 8 20 L 12.5 20 L 14.5 13 L 17 24 L 19 18.5 L 20.5 20 L 24 20"
      stroke="#38bdf8"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Active Telemetry Node (Apex) */}
    <circle cx="16" cy="6" r="1.8" fill="#38bdf8" />
  </svg>
);

export const AvenzaLogo: React.FC<Props> = ({
  size = 'md',
  iconOnly = false,
  showTagline = false,
  showBadge = false,
  badgeText = 'PROTOTYPE',
  className = ''
}) => {
  const sizeConfig = {
    sm: { iconPx: 26, titleCls: 'text-base', descCls: 'text-[9px]', badgeCls: 'text-[8px] px-1 py-0.2' },
    md: { iconPx: 34, titleCls: 'text-lg', descCls: 'text-[10px]', badgeCls: 'text-[9px] px-1.5 py-0.5' },
    lg: { iconPx: 44, titleCls: 'text-2xl', descCls: 'text-xs', badgeCls: 'text-[10px] px-2 py-0.5' },
    xl: { iconPx: 56, titleCls: 'text-4xl', descCls: 'text-sm', badgeCls: 'text-xs px-2.5 py-1' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <AvenzaMark sizePx={sizeConfig.iconPx} />

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span className={`font-sans font-extrabold tracking-tight text-slate-100 ${sizeConfig.titleCls}`}>
              AVEN<span className="text-medical-cyan">ZA</span>
            </span>
            {showBadge && (
              <span className={`font-mono font-bold rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider ${sizeConfig.badgeCls}`}>
                {badgeText}
              </span>
            )}
          </div>
          {showTagline && (
            <span className={`font-mono text-slate-400 mt-0.5 tracking-normal ${sizeConfig.descCls}`}>
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
