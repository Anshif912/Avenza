import React from 'react';
import { motion } from 'motion/react';
import { SignalQuality, SignalSource, AIApneaState } from '../../types/avenza';
import { ArrowDown, ArrowUp, Minus, Check, Info } from 'lucide-react';

/* ============================================================
   NEONATTLE: DESIGN SYSTEM COMPONENTS (DEVELOPED BY AVENZA)
   Medical-tech Precision Identity · Clean White + Clinical Blue
   ============================================================ */

/* ─────────────────────────────────────────────────────────────
   1. DATA SOURCE BADGE
   Clinical provenance tag: MEASURED | DERIVED | MODEL OUTPUT | SYNTHETIC DEMO
   ───────────────────────────────────────────────────────────── */
export const DataSourceBadge: React.FC<{ source: SignalSource; className?: string }> = ({
  source,
  className = ''
}) => {
  const styles: Record<SignalSource, { label: string; cls: string }> = {
    MEASURED:       { label: 'MEASURED',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    DERIVED:        { label: 'DERIVED',        cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    MODEL_OUTPUT:   { label: 'MODEL OUTPUT',   cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    SYNTHETIC_DEMO: { label: 'SYNTHETIC DEMO', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    SIMULATED:      { label: 'SIMULATED',      cls: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' }
  };
  const s = styles[source] ?? styles.DERIVED;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${s.cls} ${className}`}>
      {s.label}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   2. SIGNAL QUALITY BADGE
   Live sensor health indicator
   ───────────────────────────────────────────────────────────── */
export const SignalQualityBadge: React.FC<{
  quality: SignalQuality;
  freshness?: 'FRESH' | 'STALE' | 'INVALID';
  showLabel?: boolean;
}> = ({ quality, freshness = 'FRESH', showLabel = true }) => {
  const isOk = quality === 'GOOD' && freshness === 'FRESH';
  const isWarn = quality === 'FAIR' || freshness === 'STALE';
  const dotCls = isOk ? 'bg-emerald-500' : isWarn ? 'bg-amber-500' : 'bg-slate-400';
  const badgeCls = isOk
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isWarn
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${badgeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      {showLabel && <span>{freshness === 'INVALID' ? 'INVALID' : freshness === 'STALE' ? 'STALE' : quality}</span>}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   3. APNEA STATE BADGE
   Clinical state machine status indicator
   ───────────────────────────────────────────────────────────── */
export const ApneaStateBadge: React.FC<{ state: AIApneaState; size?: 'sm' | 'md' | 'lg' }> = ({
  state,
  size = 'md'
}) => {
  const configs: Record<AIApneaState, { label: string; cls: string; dot: string; pulse?: boolean }> = {
    NORMAL:                { label: 'NORMAL STABILITY',                    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    WATCH:                 { label: 'WATCH / OBSERVATION',                 cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500' },
    SUSPECTED:             { label: 'SUSPECTED APNEA',                     cls: 'bg-amber-50 text-amber-800 border-amber-300',      dot: 'bg-amber-500', pulse: true },
    CONFIRMED:             { label: 'CONFIRMED: PROTOTYPE EVENT CRITERIA', cls: 'bg-red-50 text-red-700 border-red-300',            dot: 'bg-red-500',   pulse: true },
    RECOVERED:             { label: 'RECOVERED',                           cls: 'bg-teal-50 text-teal-700 border-teal-200',        dot: 'bg-teal-500' },
    WAITING_FOR_SIGNAL:    { label: 'WAITING FOR SENSOR SIGNAL',           cls: 'bg-slate-100 text-slate-600 border-slate-200',     dot: 'bg-slate-400' },
    SIGNAL_ACQUISITION:    { label: 'SIGNAL ACQUISITION / LOCKING',        cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500', pulse: true },
    INSUFFICIENT_EVIDENCE: { label: 'INSUFFICIENT EVIDENCE (SINGLE-CHANNEL)', cls: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
    INVALID_SIGNAL:        { label: 'INVALID SIGNAL / SHIELD ACTIVE',      cls: 'bg-slate-100 text-slate-600 border-slate-200',     dot: 'bg-slate-400' },
    NO_EVALUATION:         { label: 'NO VALID EVALUATION',                 cls: 'bg-slate-100 text-slate-500 border-slate-200',     dot: 'bg-slate-400' }
  };
  const c = configs[state] ?? configs.NO_EVALUATION;
  const sz = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-2.5 py-1 text-xs', lg: 'px-3.5 py-1.5 text-sm' }[size];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg font-mono font-bold tracking-wide border ${c.cls} ${sz} ${c.pulse ? 'animate-pulse' : ''}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   4. INSTRUMENT CARD
   Refined white medical surface with hairline border and subtle elevation.
   No radial-gradient cursor spotlights or holographic effects.
   ───────────────────────────────────────────────────────────── */
export const InstrumentCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  disabled?: boolean;
}> = ({ children, className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150 hover:border-slate-300 ${className}`}
    >
      {children}
    </div>
  );
};

export const SpotlightCard = InstrumentCard;

/* ─────────────────────────────────────────────────────────────
   5. VITAL METRIC CARD
   High-density real-time vital display with delta, quality, and provenance
   ───────────────────────────────────────────────────────────── */
export const VitalMetricCard: React.FC<{
  title: string;
  value: string | number | null;
  unit: string;
  baseline?: string | number | null;
  delta?: number;
  deltaUnit?: string;
  signalQuality?: SignalQuality;
  source: SignalSource;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: 'cyan' | 'rose' | 'violet' | 'amber' | 'emerald' | 'blue';
  dataAgeSec?: number;
  isCritical?: boolean;
  waitingLabel?: string;
  referenceRangeText?: string;
  referenceStatusLabel?: string;
  referenceStatusWarning?: boolean;
}> = ({
  title, value, unit, baseline, delta, deltaUnit = '',
  signalQuality = 'GOOD', source, icon: Icon,
  accentColor = 'blue', dataAgeSec = 0, isCritical = false,
  waitingLabel = 'WAITING FOR SIGNAL',
  referenceRangeText, referenceStatusLabel, referenceStatusWarning = false
}) => {
  const colorMap: Record<string, { iconBg: string; iconText: string; border: string }> = {
    blue:    { iconBg: 'bg-blue-50',    iconText: 'text-blue-600',    border: 'border-blue-100' },
    cyan:    { iconBg: 'bg-sky-50',     iconText: 'text-sky-600',     border: 'border-sky-100' },
    rose:    { iconBg: 'bg-rose-50',    iconText: 'text-rose-600',    border: 'border-rose-100' },
    violet:  { iconBg: 'bg-purple-50',  iconText: 'text-purple-600',  border: 'border-purple-100' },
    amber:   { iconBg: 'bg-amber-50',   iconText: 'text-amber-600',   border: 'border-amber-100' },
    emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', border: 'border-emerald-100' },
  };
  const col = colorMap[accentColor] ?? colorMap.blue;
  const isNoData = value === null || value === undefined || value === '--';

  return (
    <SpotlightCard
      className={`p-4 space-y-2.5 ${col.border} ${isCritical ? 'border-red-300 ring-2 ring-red-100' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${col.iconBg} border border-line-subtle`}>
            <Icon className={`w-4 h-4 ${col.iconText}`} />
          </div>
          <span className="text-[11px] font-sans font-bold text-slate-700 uppercase tracking-wider">{title}</span>
        </div>
        <DataSourceBadge source={source} />
      </div>

      {/* Value row */}
      <div className="flex items-baseline justify-between min-h-11">
        {isNoData ? (
          <div>
            <span className="text-3xl font-mono font-extrabold text-slate-300 tracking-tight">--</span>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{waitingLabel}</div>
          </div>
        ) : (
          <div>
            <span className="text-3xl lg:text-4xl font-mono font-extrabold text-slate-900 tracking-tight tabular-nums">{value}</span>
            <span className="text-xs font-mono text-slate-500 ml-1">{unit}</span>
          </div>
        )}
        <div className="text-right font-mono">
          {baseline !== undefined && baseline !== null && (
            <div className="text-[11px] text-slate-500">Base: <strong className="text-slate-800 tabular-nums">{baseline}</strong></div>
          )}
          {delta !== undefined && !isNoData && (
            <div className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
              delta === 0 ? 'text-slate-500' : delta < 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {delta < 0 ? <ArrowDown className="w-3 h-3" /> : delta > 0 ? <ArrowUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              <span className="tabular-nums">{delta > 0 ? `+${delta}` : delta}{deltaUnit}</span>
            </div>
          )}
        </div>
      </div>

      {/* Clinical Reference Context Strip */}
      {referenceRangeText && (
        <div className="pt-1.5 border-t border-line-0 flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-500">Ref: <strong className="text-slate-700">{referenceRangeText}</strong></span>
          {referenceStatusLabel && (
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
              isNoData
                ? 'text-slate-500 bg-slate-100'
                : referenceStatusWarning
                ? 'text-amber-800 bg-amber-50 border border-amber-200'
                : 'text-emerald-800 bg-emerald-50 border border-emerald-200'
            }`}>
              {isNoData ? 'WAITING' : referenceStatusLabel}
            </span>
          )}
        </div>
      )}

      {/* Footer row */}
      <div className="pt-1.5 clinical-divider flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <span>Signal:</span>
          {isNoData ? (
            <span className="text-slate-400">NO SIGNAL</span>
          ) : (
            <>
              <SignalQualityBadge quality={signalQuality} showLabel={false} />
              <span className={signalQuality === 'GOOD' ? 'text-emerald-700 font-semibold' : signalQuality === 'FAIR' ? 'text-amber-700 font-semibold' : 'text-rose-700 font-semibold'}>
                {signalQuality}
              </span>
            </>
          )}
        </div>
        <span>Age: <strong className="text-slate-700 tabular-nums">{dataAgeSec > 0 ? `${dataAgeSec.toFixed(1)}s` : '--'}</strong></span>
      </div>
    </SpotlightCard>
  );
};

/* ─────────────────────────────────────────────────────────────
   6. SECTION HEADER
   Standardized page/panel section header with icon, title, badge, action slot
   ───────────────────────────────────────────────────────────── */
export const SectionHeader: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'cyan' | 'violet' | 'amber' | 'rose' | 'emerald' | 'blue';
  action?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, badge, badgeVariant = 'blue', action }) => {
  const badgeMap: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    cyan:    'bg-sky-50 text-sky-700 border-sky-200',
    violet:  'bg-purple-50 text-purple-700 border-purple-200',
    amber:   'bg-amber-50 text-amber-800 border-amber-200',
    rose:    'bg-red-50 text-red-700 border-red-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 font-sans tracking-tight">{title}</h2>
            {badge && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeMap[badgeVariant] ?? badgeMap.blue}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-sans">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   7. ARC GAUGE
   Semicircular SVG gauge for PROTOTYPE APNEA SCORE display.
   ───────────────────────────────────────────────────────────── */
export const ArcGauge: React.FC<{
  value: number | null;
  label?: string;
  size?: number;
  critical?: boolean;
}> = ({ value, label = 'Prototype Apnea Score', size = 180, critical = false }) => {
  const r = 62;
  const cx = size / 2;
  const cy = size / 2 + 14;
  const circumference = Math.PI * r;
  const isNoData = value === null || value === undefined;
  const numericVal = isNoData ? 0 : Math.round(value);
  const progress = Math.min(Math.max(numericVal, 0), 100) / 100;
  const offset = circumference * (1 - progress);

  const color = isNoData ? '#94A3B8' : numericVal < 30 ? '#16A34A' : numericVal < 70 ? '#D97706' : '#DC2626';
  const trackColor = '#E2E8F0';

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={trackColor}
          strokeWidth={8}
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isNoData ? circumference : offset}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        {/* Numeric value */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="30"
          fontWeight="700"
          fill={isNoData ? '#94A3B8' : '#172033'}
        >
          {isNoData ? '—' : numericVal}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontFamily="'IBM Plex Sans', sans-serif"
          fontSize="11"
          fontWeight="500"
          fill="#64748B"
        >
          {isNoData ? 'Waiting for signal' : '/ 100 score'}
        </text>
      </svg>
      <div className="text-xs font-sans font-semibold text-[#172033] tracking-normal text-center">
        {label}
      </div>
      <div className="text-[11px] font-sans text-slate-400 text-center">
        {isNoData ? 'Awaiting multimodal corroboration' : 'Algorithm output · Not a clinical diagnosis'}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   8. FUSION WEIGHT BAR
   Animated stacked bar showing dynamic channel contributions.
   ───────────────────────────────────────────────────────────── */
export const FusionWeightBar: React.FC<{
  weights: { camera: number; spo2: number; heartRate: number };
  effectiveWeights?: { camera: number; spo2: number; heartRate: number };
}> = ({ weights, effectiveWeights }) => {
  const eff = effectiveWeights ?? weights;
  const total = eff.camera + eff.spo2 + eff.heartRate;
  const pct = (v: number) => ((v / total) * 100).toFixed(0);

  const segments = [
    { label: 'Camera Motion', value: eff.camera, pct: pct(eff.camera), color: 'bg-violet-600', text: 'text-violet-700' },
    { label: 'Optical SpO₂',  value: eff.spo2,   pct: pct(eff.spo2),   color: 'bg-blue-600',   text: 'text-blue-700' },
    { label: 'Heart Rate',    value: eff.heartRate, pct: pct(eff.heartRate), color: 'bg-rose-500', text: 'text-rose-700' },
  ];

  return (
    <div className="space-y-3">
      {/* Attribution Bar */}
      <div className="w-full h-3 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex">
        {segments.map(seg => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500`}
            style={{ width: `${seg.pct}%` }}
            title={`${seg.label}: ${seg.pct}%`}
          />
        ))}
      </div>
      {/* Clean Attribution Legend */}
      <div className="grid grid-cols-3 gap-2">
        {segments.map(seg => (
          <div key={seg.label} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${seg.color} flex-shrink-0`} />
              <span className="text-[11px] font-sans text-slate-600 truncate">{seg.label}</span>
            </div>
            <div className="font-mono text-xs font-semibold text-[#172033] tabular-nums">
              {seg.pct}% <span className="text-[10px] text-slate-400 font-normal">weight</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[11px] font-sans text-slate-400 leading-relaxed">
        Weights dynamically renormalize if any channel experiences noise or motion artifacts.
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   9. STEP INDICATOR
   Multi-step progress indicator for setup/onboarding flows
   ───────────────────────────────────────────────────────────── */
export const StepIndicator: React.FC<{
  steps: string[];
  current: number;
}> = ({ steps, current }) => (
  <div className="flex items-center gap-0">
    {steps.map((step, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition-all ${
              done    ? 'bg-emerald-500 border-emerald-500 text-white' :
              active  ? 'bg-blue-50 border-blue-600 text-blue-600' :
                        'bg-surface-0 border-line-0 text-slate-400'
            }`}>
              {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-[10px] font-mono whitespace-nowrap hidden sm:block ${
              active ? 'text-blue-600 font-bold' : done ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 min-w-[24px] transition-all ${done ? 'bg-emerald-500' : 'bg-line-0'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   10. SENSOR HEALTH ROW
   Single sensor status row with ping latency and health bar
   ───────────────────────────────────────────────────────────── */
export const SensorHealthRow: React.FC<{
  name: string;
  protocol: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'STANDBY' | 'WAITING' | 'UNAVAILABLE';
  latencyMs?: number;
  healthPct?: number;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ name, protocol, status, latencyMs, healthPct = 100, icon: Icon }) => {
  const statusCfg: Record<string, { dot: string; text: string; bg: string }> = {
    ONLINE:      { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/70 border-emerald-200' },
    DEGRADED:    { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-800', bg: 'bg-amber-50/70 border-amber-200' },
    OFFLINE:     { dot: 'bg-rose-500 animate-pulse', text: 'text-rose-700', bg: 'bg-rose-50/70 border-rose-200' },
    STANDBY:     { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
    WAITING:     { dot: 'bg-blue-500 animate-pulse', text: 'text-blue-700', bg: 'bg-blue-50/60 border-blue-200' },
    UNAVAILABLE: { dot: 'bg-slate-300', text: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' },
  };
  const cfg = statusCfg[status] ?? statusCfg.WAITING;
  const barColor = status === 'ONLINE' ? 'bg-emerald-500' : status === 'DEGRADED' ? 'bg-amber-500' : status === 'WAITING' ? 'bg-blue-500' : 'bg-slate-300';

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border ${cfg.bg}`}>
      <div className="p-1.5 rounded-lg bg-surface-0 border border-line-0 flex-shrink-0">
        <Icon className={`w-4 h-4 ${cfg.text}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-sans font-semibold text-slate-800 truncate">{name}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-mono font-bold ${cfg.text}`}>{status}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span>{protocol}</span>
          {latencyMs !== undefined && <span>Latency: <strong className="text-slate-700 tabular-nums">{latencyMs}ms</strong></span>}
          <span>Health: <strong className="text-slate-700 tabular-nums">{healthPct}%</strong></span>
        </div>
        {/* Health bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${healthPct}%` }} />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   11. INLINE CLINICAL DISCLAIMER
   Compact, embeddable prototype disclaimer for AI output panels
   ───────────────────────────────────────────────────────────── */
export const ClinicalDisclaimer: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={`bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3 ${compact ? 'p-3' : 'p-4'}`}>
    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
    <div>
      <div className={`font-sans font-semibold text-blue-900 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        Prototype Algorithm Evaluation Notice
      </div>
      <div className={`font-sans text-slate-600 mt-0.5 leading-relaxed ${compact ? 'text-[10px]' : 'text-xs'}`}>
        This system calculates a <strong className="text-blue-700 font-semibold">Prototype Apnea Score</strong> by fusing non-contact camera thoracic motion, optical SpO₂ slope, and pulse rate deceleration. Output is <strong className="text-rose-700 font-semibold">model evaluation (not a clinical diagnosis)</strong>.
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   12. SUB TOPBAR
   Instrument-style horizontal tab navigator for page sub-sections.
   Renders a smooth animated active-indicator bar via Motion layoutId.
   ───────────────────────────────────────────────────────────── */
export const SubTopbar: React.FC<{
  tabs: Array<{ id: string; label: string; count?: number }>;
  active: string;
  onChange: (id: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="flex items-end gap-1 border-b border-slate-200 overflow-x-auto select-none">
    {tabs.map(tab => {
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-sans font-medium whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 ${
            isActive
              ? 'text-blue-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
              isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {tab.count}
            </span>
          )}
          {/* Active indicator bar with Motion layoutId */}
          {isActive && (
            <motion.div
              layoutId="subtopbar-active"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </button>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   13. THERMAL GAUGE
   Circular temperature display for thermal control page
   ───────────────────────────────────────────────────────────── */
export const ThermalGauge: React.FC<{
  current: number | null;
  target: number;
  min?: number;
  max?: number;
  label?: string;
}> = ({ current, target, min = 20, max = 40, label = 'CHAMBER TEMP' }) => {
  const isNoData = current === null || current === undefined;
  const numCurrent = isNoData ? min : current;
  const range = max - min;
  const pct = Math.min(Math.max((numCurrent - min) / range, 0), 1);
  const tPct = Math.min(Math.max((target - min) / range, 0), 1);

  const size = 120;
  const r = 44;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const circ = Math.PI * r;

  const deviation = isNoData ? 0 : Math.abs(numCurrent - target);
  const color = isNoData ? '#94A3B8' : deviation < 0.5 ? '#16A34A' : deviation < 1.5 ? '#D97706' : '#DC2626';
  const targetColor = '#2563EB';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#E2E8F0" strokeWidth={8} strokeLinecap="round"
        />
        {/* Current */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={isNoData ? circ : circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Target tick */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={targetColor} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={`2 ${circ - 2}`}
          strokeDashoffset={circ * (1 - tPct)}
        />
        <text x={cx} y={cy - 10} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="20" fontWeight="800" fill={color}>
          {isNoData ? '--' : numCurrent.toFixed(1)}
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="10" fill="#64748B">
          {isNoData ? 'WAITING' : '°C'}
        </text>
      </svg>
      <div className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">{label}</div>
      <div className="text-[10px] font-mono text-blue-600 font-semibold">Target: {target.toFixed(1)}°C</div>
    </div>
  );
};
