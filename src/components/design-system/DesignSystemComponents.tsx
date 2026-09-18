import React from 'react';
import { SignalQuality, SignalSource, AIApneaState } from '../../types/avenza';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

/* ============================================================
   AVENZA — DESIGN SYSTEM COMPONENTS v2
   Medical-tech Command Center · Calibrated precision aesthetic
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
    MEASURED:       { label: 'MEASURED',       cls: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30' },
    DERIVED:        { label: 'DERIVED',        cls: 'bg-blue-950/80 text-sky-300 border-sky-500/30' },
    MODEL_OUTPUT:   { label: 'MODEL OUTPUT',   cls: 'bg-violet-950/80 text-violet-300 border-violet-500/30' },
    SYNTHETIC_DEMO: { label: 'SYNTHETIC DEMO', cls: 'bg-amber-950/80 text-amber-300 border-amber-500/30' },
    SIMULATED:      { label: 'SIMULATED',      cls: 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-sm' }
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
  const dotCls = isOk ? 'bg-emerald-400' : isWarn ? 'bg-amber-400' : 'bg-slate-500';
  const badgeCls = isOk
    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
    : isWarn
    ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
    : 'bg-slate-900/80 text-slate-400 border-slate-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${badgeCls}`}>
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
    NORMAL:         { label: 'NORMAL',                              cls: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400' },
    WATCH:          { label: 'WATCH',                               cls: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40',         dot: 'bg-cyan-400' },
    SUSPECTED:      { label: 'SUSPECTED APNEA',                     cls: 'bg-amber-950/90 text-amber-200 border-amber-500/50',      dot: 'bg-amber-400', pulse: true },
    CONFIRMED:      { label: 'CONFIRMED — PROTOTYPE EVENT CRITERIA',cls: 'bg-rose-950/90 text-rose-200 border-rose-500/60',        dot: 'bg-rose-400',  pulse: true },
    RECOVERED:      { label: 'RECOVERED',                           cls: 'bg-teal-950/90 text-teal-300 border-teal-500/40',        dot: 'bg-teal-400' },
    INVALID_SIGNAL: { label: 'INVALID SIGNAL / SHIELD ACTIVE',      cls: 'bg-slate-900 text-slate-400 border-slate-700',           dot: 'bg-slate-500' },
    NO_EVALUATION:  { label: 'NO VALID EVALUATION',                 cls: 'bg-slate-900/90 text-slate-400 border-slate-700',        dot: 'bg-slate-500' }
  };
  const c = configs[state] ?? configs.NO_EVALUATION;
  const sz = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-3 py-1 text-xs', lg: 'px-4 py-1.5 text-sm' }[size];
  return (
    <span className={`inline-flex items-center gap-2 rounded-xl font-mono font-bold tracking-wide border ${c.cls} ${sz} ${c.pulse ? 'animate-pulse' : ''}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   4. SPOTLIGHT CARD
   React Bits-inspired mouse-tracking radial gradient card.
   Reserve for PRIMARY data panels — not decorative elements.
   ───────────────────────────────────────────────────────────── */
export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'violet' | 'emerald' | 'amber' | 'rose';
  disabled?: boolean;
}> = ({ children, className = '', glowColor = 'cyan', disabled = false }) => {
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const glowMap: Record<string, string> = {
    cyan:    'rgba(6,182,212,0.1)',
    purple:  'rgba(139,92,246,0.1)',
    violet:  'rgba(139,92,246,0.1)',
    emerald: 'rgba(16,185,129,0.1)',
    amber:   'rgba(245,158,11,0.1)',
    rose:    'rgba(239,68,68,0.1)',
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || disabled) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => !disabled && setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-card bg-surface-1 border border-line-0 transition-colors duration-200 hover:border-line-1 shadow-card ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{ opacity, background: `radial-gradient(360px circle at ${pos.x}px ${pos.y}px, ${glowMap[glowColor] ?? glowMap.cyan}, transparent 70%)` }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

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
  accentColor?: 'cyan' | 'rose' | 'violet' | 'amber' | 'emerald';
  dataAgeSec?: number;
  isCritical?: boolean;
  waitingLabel?: string;
  referenceRangeText?: string;
  referenceStatusLabel?: string;
  referenceStatusWarning?: boolean;
}> = ({
  title, value, unit, baseline, delta, deltaUnit = '',
  signalQuality = 'GOOD', source, icon: Icon,
  accentColor = 'cyan', dataAgeSec = 0, isCritical = false,
  waitingLabel = 'WAITING FOR SIGNAL',
  referenceRangeText, referenceStatusLabel, referenceStatusWarning = false
}) => {
  const colorMap: Record<string, { icon: string; border: string; glow: string }> = {
    cyan:    { icon: 'text-cyan-400',    border: 'border-cyan-500/20',    glow: 'cyan' },
    rose:    { icon: 'text-rose-400',    border: 'border-rose-500/20',    glow: 'rose' },
    violet:  { icon: 'text-violet-400',  border: 'border-violet-500/20',  glow: 'purple' },
    amber:   { icon: 'text-amber-400',   border: 'border-amber-500/20',   glow: 'amber' },
    emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'emerald' },
  };
  const col = colorMap[accentColor] ?? colorMap.cyan;
  const isNoData = value === null || value === undefined || value === '--';

  return (
    <SpotlightCard
      glowColor={col.glow as any}
      className={`p-4 space-y-2.5 ${col.border} ${isCritical ? 'border-rose-500/50 glow-red' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-surface-0 border border-line-0">
            <Icon className={`w-4 h-4 ${col.icon}`} />
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">{title}</span>
        </div>
        <DataSourceBadge source={source} />
      </div>

      {/* Value row */}
      <div className="flex items-baseline justify-between min-h-[42px]">
        {isNoData ? (
          <div>
            <span className="text-3xl font-mono font-extrabold text-slate-500 tracking-tight">--</span>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">{waitingLabel}</div>
          </div>
        ) : (
          <div>
            <span className="text-3xl lg:text-4xl font-mono font-extrabold text-slate-100 tracking-tight tabular-nums">{value}</span>
            <span className="text-xs font-mono text-slate-500 ml-1">{unit}</span>
          </div>
        )}
        <div className="text-right font-mono">
          {baseline !== undefined && baseline !== null && (
            <div className="text-[11px] text-slate-400">Base: <strong className="text-slate-200 tabular-nums">{baseline}</strong></div>
          )}
          {delta !== undefined && !isNoData && (
            <div className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
              delta === 0 ? 'text-slate-400' : delta < 0 ? 'text-rose-400' : 'text-emerald-400'
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
          <span className="text-slate-400">Ref: <strong className="text-slate-300">{referenceRangeText}</strong></span>
          {referenceStatusLabel && (
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
              isNoData
                ? 'text-slate-500 bg-slate-900'
                : referenceStatusWarning
                ? 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                : 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/30'
            }`}>
              {isNoData ? 'WAITING' : referenceStatusLabel}
            </span>
          )}
        </div>
      )}

      {/* Footer row */}
      <div className="pt-1.5 clinical-divider flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span>Signal:</span>
          {isNoData ? (
            <span className="text-slate-500">NO SIGNAL</span>
          ) : (
            <>
              <SignalQualityBadge quality={signalQuality} showLabel={false} />
              <span className={signalQuality === 'GOOD' ? 'text-emerald-400' : signalQuality === 'FAIR' ? 'text-amber-400' : 'text-rose-400'}>
                {signalQuality}
              </span>
            </>
          )}
        </div>
        <span>Age: <strong className="text-slate-300 tabular-nums">{dataAgeSec > 0 ? `${dataAgeSec.toFixed(1)}s` : '--'}</strong></span>
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
  badgeVariant?: 'cyan' | 'violet' | 'amber' | 'rose' | 'emerald';
  action?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, badge, badgeVariant = 'cyan', action }) => {
  const badgeMap: Record<string, string> = {
    cyan:    'bg-cyan-950 text-cyan-300 border-cyan-500/30',
    violet:  'bg-violet-950 text-violet-300 border-violet-500/30',
    amber:   'bg-amber-950 text-amber-300 border-amber-500/30',
    rose:    'bg-rose-950 text-rose-300 border-rose-500/30',
    emerald: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-surface-0 border border-line-0 text-medical-cyan flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 font-sans tracking-tight">{title}</h2>
            {badge && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeMap[badgeVariant] ?? badgeMap.cyan}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-sans">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   7. ARC GAUGE
   Semicircular SVG gauge for PROTOTYPE APNEA SCORE display.
   Replaces linear progress bar — much stronger visual hierarchy.
   ───────────────────────────────────────────────────────────── */
export const ArcGauge: React.FC<{
  value: number | null;    // 0–100 or null if no signal
  label?: string;
  size?: number;    // px
  critical?: boolean;
}> = ({ value, label = 'PROTOTYPE APNEA SCORE', size = 160, critical = false }) => {
  const r = 54;
  const cx = size / 2;
  const cy = size / 2 + 12;
  const circumference = Math.PI * r;
  const isNoData = value === null || value === undefined;
  const numericVal = isNoData ? 0 : value;
  const progress = Math.min(Math.max(numericVal, 0), 100) / 100;
  const offset = circumference * (1 - progress);

  const color = isNoData ? '#334155' : numericVal < 30 ? '#10b981' : numericVal < 70 ? '#f59e0b' : '#ef4444';
  const trackColor = '#1c2d5a';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={trackColor}
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isNoData ? circumference : offset}
          style={{ filter: critical && !isNoData ? `drop-shadow(0 0 6px ${color})` : undefined }}
        />
        {/* Center value */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="26" fontWeight="800" fill={isNoData ? '#64748b' : '#f1f5f9'}>
          {isNoData ? '--' : numericVal}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#64748b">
          {isNoData ? 'WAITING' : '/ 100'}
        </text>
      </svg>
      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider text-center">{label}</div>
      <div className="text-[9px] font-mono text-slate-500 italic">
        {isNoData ? 'WAITING FOR VALID MULTIMODAL SIGNAL' : 'MODEL OUTPUT — NOT A DIAGNOSIS'}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   8. FUSION WEIGHT BAR
   Animated stacked bar showing dynamic channel contributions.
   Used in AI Apnea page and Dashboard.
   ───────────────────────────────────────────────────────────── */
export const FusionWeightBar: React.FC<{
  weights: { camera: number; spo2: number; heartRate: number };
  effectiveWeights?: { camera: number; spo2: number; heartRate: number };
}> = ({ weights, effectiveWeights }) => {
  const eff = effectiveWeights ?? weights;
  const total = eff.camera + eff.spo2 + eff.heartRate;
  const pct = (v: number) => ((v / total) * 100).toFixed(1);

  const segments = [
    { label: 'Camera ROI', value: eff.camera, pct: pct(eff.camera), color: 'bg-violet-500', text: 'text-violet-300' },
    { label: 'SpO₂',       value: eff.spo2,   pct: pct(eff.spo2),   color: 'bg-cyan-500',   text: 'text-cyan-300' },
    { label: 'Heart Rate', value: eff.heartRate, pct: pct(eff.heartRate), color: 'bg-rose-500', text: 'text-rose-300' },
  ];

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="w-full h-5 rounded-full overflow-hidden bg-surface-0 border border-line-0 flex">
        {segments.map(seg => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500 flex items-center justify-center text-[9px] font-mono font-bold text-white`}
            style={{ width: `${seg.pct}%` }}
          >
            {Number(seg.pct) > 15 ? `${seg.pct}%` : ''}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${seg.color} flex-shrink-0`} />
            <span className="text-[11px] font-mono text-slate-300">{seg.label}</span>
            <span className={`text-[11px] font-mono font-bold ${seg.text} tabular-nums`}>{seg.pct}%</span>
          </div>
        ))}
      </div>
      {/* Prototype weight disclaimer */}
      <div className="text-[10px] font-mono text-slate-500">
        Prototype weights — renormalized by Signal Quality Shield when channels degrade
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
              done    ? 'bg-medical-green border-emerald-500 text-white' :
              active  ? 'bg-surface-1 border-medical-cyan text-medical-cyan' :
                        'bg-surface-0 border-line-0 text-slate-500'
            }`}>
              {done ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-mono whitespace-nowrap hidden sm:block ${
              active ? 'text-cyan-400 font-bold' : done ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 min-w-[24px] transition-all ${done ? 'bg-emerald-600' : 'bg-line-0'}`} />
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
    ONLINE:      { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-500/20' },
    DEGRADED:    { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-500/20' },
    OFFLINE:     { dot: 'bg-rose-400 animate-pulse', text: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-500/20' },
    STANDBY:     { dot: 'bg-slate-500', text: 'text-slate-400', bg: 'bg-slate-900/60 border-slate-700' },
    WAITING:     { dot: 'bg-cyan-400 animate-pulse', text: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-500/20' },
    UNAVAILABLE: { dot: 'bg-slate-600', text: 'text-slate-500', bg: 'bg-slate-950/40 border-slate-800' },
  };
  const cfg = statusCfg[status] ?? statusCfg.WAITING;
  const barColor = status === 'ONLINE' ? 'bg-emerald-500' : status === 'DEGRADED' ? 'bg-amber-500' : status === 'WAITING' ? 'bg-cyan-500' : 'bg-slate-700';

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border ${cfg.bg}`}>
      <div className="p-1.5 rounded-lg bg-surface-0 border border-line-0 flex-shrink-0">
        <Icon className={`w-4 h-4 ${cfg.text}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-sans font-semibold text-slate-200 truncate">{name}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-mono font-bold ${cfg.text}`}>{status}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>{protocol}</span>
          {latencyMs !== undefined && <span>Latency: <strong className="text-slate-200 tabular-nums">{latencyMs}ms</strong></span>}
          <span>Health: <strong className="text-slate-200 tabular-nums">{healthPct}%</strong></span>
        </div>
        {/* Health bar */}
        <div className="w-full h-1 bg-surface-0 rounded-full overflow-hidden">
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
  <div className={`bg-violet-950/30 border border-violet-500/25 rounded-xl flex items-start gap-3 ${compact ? 'p-3' : 'p-4'}`}>
    <div className="w-1 self-stretch rounded-full bg-violet-500/60 flex-shrink-0" />
    <div>
      <div className={`font-mono font-bold text-violet-300 uppercase tracking-wide ${compact ? 'text-[10px]' : 'text-xs'}`}>
        AI-ASSISTED APNEA EVENT DETECTION — PROTOTYPE
      </div>
      <div className={`font-sans text-slate-300 mt-0.5 leading-relaxed ${compact ? 'text-[10px]' : 'text-xs'}`}>
        This system produces a <strong className="text-violet-300">PROTOTYPE APNEA SCORE</strong> from
        non-contact camera thoracic motion, SpO₂ desaturation slopes, and pulse deceleration telemetry.
        Output is <strong className="text-rose-400">MODEL OUTPUT — NOT A MEDICAL DIAGNOSIS.</strong>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   12. THERMAL GAUGE
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
  const color = isNoData ? '#64748b' : deviation < 0.5 ? '#10b981' : deviation < 1.5 ? '#f59e0b' : '#ef4444';
  const targetColor = '#06b6d4';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#1c2d5a" strokeWidth={8} strokeLinecap="round"
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
        <text x={cx} y={cy - 10} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="20" fontWeight="800" fill={color}>
          {isNoData ? '--' : numCurrent.toFixed(1)}
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="10" fill="#64748b">
          {isNoData ? 'WAITING' : '°C'}
        </text>
      </svg>
      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-[10px] font-mono text-cyan-400">Target: {target.toFixed(1)}°C</div>
    </div>
  );
};
