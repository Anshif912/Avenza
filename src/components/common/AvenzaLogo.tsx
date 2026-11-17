import React from 'react';
import { BRAND } from '../../config/brand';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconOnly?: boolean;
  showTagline?: boolean;
  showAttribution?: boolean;
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
    {/* Background Container: Soft crisp clinical blue surface */}
    <rect width="32" height="32" rx="8" fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="1" />

    {/* Outer Geometric Apex & Legs: Solid Medical Blue */}
    <path
      d="M 6 25 L 16 6 L 26 25"
      stroke="#2563EB"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Precision Pulse Waveform Crossbar */}
    <path
      d="M 8 20 L 12.5 20 L 14.5 13 L 17 24 L 19 18.5 L 20.5 20 L 24 20"
      stroke="#2563EB"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Active Telemetry Node (Apex) */}
    <circle cx="16" cy="6" r="1.8" fill="#1D4ED8" />
  </svg>
);

export const NeoNattleMark = AvenzaMark;

export const AvenzaLogo: React.FC<Props> = ({
  size = 'md',
  iconOnly = false,
  showTagline = false,
  showAttribution = true,
  showBadge = false,
  badgeText = 'PROTOTYPE',
  className = ''
}) => {
  const sizeConfig = {
    sm: { iconPx: 26, titleCls: 'text-base', descCls: 'text-[9px]', badgeCls: 'text-[8px] px-1 py-0.2', attrCls: 'text-[9px]' },
    md: { iconPx: 34, titleCls: 'text-lg', descCls: 'text-[10px]', badgeCls: 'text-[9px] px-1.5 py-0.5', attrCls: 'text-[10px]' },
    lg: { iconPx: 44, titleCls: 'text-2xl', descCls: 'text-xs', badgeCls: 'text-[10px] px-2 py-0.5', attrCls: 'text-xs' },
    xl: { iconPx: 56, titleCls: 'text-4xl', descCls: 'text-sm', badgeCls: 'text-xs px-2.5 py-1', attrCls: 'text-xs' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <AvenzaMark sizePx={sizeConfig.iconPx} />

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span className={`font-sans font-bold tracking-tight text-[#172033] ${sizeConfig.titleCls}`}>
              NeoNattle
            </span>
            {showBadge && (
              <span className={`font-mono font-bold rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider ${sizeConfig.badgeCls}`}>
                {badgeText}
              </span>
            )}
          </div>
          {showAttribution && !showTagline && (
            <span className={`font-sans text-slate-400 mt-0.5 font-normal tracking-tight ${sizeConfig.attrCls}`}>
              by Avenza
            </span>
          )}
          {showTagline && (
            <span className={`font-mono text-slate-500 mt-0.5 tracking-normal ${sizeConfig.descCls}`}>
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const NeoNattleLogo = AvenzaLogo;
export default NeoNattleLogo;
