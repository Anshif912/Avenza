# Design System — AVENZA Prototype

<!-- impeccable:design-schema 1 -->

## Mode

**Operate** — The operator completes tasks: connecting hardware, reviewing telemetry, acknowledging alerts, navigating to event details. Scanability and clarity outrank expression.

## Visual World

**Medical-research instrumentation software** — Clean, precise, engineered. Feels like Figma × hospital monitor × Linear. Light mode with intentional blue accents. Not a dark-theme hacker dashboard, not a generic SaaS template.

Reference aesthetics (not literal copies):
- Philips IntelliVue patient monitors (calm signal display, discrete alarm hierarchy)
- Linear (typography precision, whitespace discipline, focused state)
- Vercel Dashboard (surface hierarchy, crisp mono data, blue primary)
- Notion (clean white surface, clear section breaks, no gradient noise)

Anti-references (explicitly banned directions):
- Generic AI purple gradient dark theme
- Glassmorphism as decoration
- Three equal feature cards on white with drop shadow
- Cyan-on-black hacker aesthetic (the OLD AVENZA look — superseded)
- Center-heavy eyebrow + H2 + subtitle every section

## Color Palette

```
Background:  #F8FAFC  — Soft clinical white (bg-surface-1)
Surface 0:   #FFFFFF  — Pure white panels/cards
Surface 2:   #F1F5F9  — Subtle inset / grouped fields
Surface 3:   #E2E8F0  — Elevated control row

Border 0:    #E2E8F0  — Primary hairline (border-line-0)
Border 1:    #CBD5E1  — Focus / hover border

Primary:     #2563EB  — Medical blue (actions, active states, links)
Primary bg:  #EFF6FF  — Blue-tinted panel backgrounds
Primary dark:#1D4ED8  — Button hover

Text primary:   #0F172A — Main headings and values
Text secondary: #475569 — Labels, metadata
Text tertiary:  #94A3B8 — Placeholder, inactive

Semantic:
  Success green:  #16A34A / bg #F0FDF4
  Warning amber:  #D97706 / bg #FFFBEB
  Critical red:   #DC2626 / bg #FEF2F2
  Signal cyan:    #0284C7 (PPG/SpO₂ channel color)
  Signal violet:  #7C3AED (AI/Camera channel color)
  Signal rose:    #E11D48 (HR channel color)
  Signal amber:   #D97706 (Thermal channel color)
  Signal teal:    #0D9488 (Respiratory signal color)
```

## Typography

```
Font family:
  Display/body:  Inter (system fallback acceptable for prototype; Geist if self-hosting)
  Monospace:     JetBrains Mono (data, telemetry values, codes, badges)

Type scale (Tailwind):
  Display H1:   text-4xl / font-bold / tracking-tight / text-slate-900
  Page H1:      text-2xl / font-semibold / text-slate-900
  Section H2:   text-lg / font-semibold / text-slate-800
  Card title:   text-sm / font-semibold / text-slate-700
  Body:         text-sm / text-slate-600 / leading-relaxed
  Caption:      text-xs / text-slate-500
  Mono data:    font-mono / text-sm / text-slate-800 (live values)
  Mono label:   font-mono / text-xs / text-slate-500 (channel labels, badges)
  Mono large:   font-mono / text-2xl / font-bold (primary metric values)
```

## Spacing & Radius

```
Page padding:    px-6 py-6 (desktop), px-4 py-4 (mobile)
Section gaps:    space-y-6
Card inner:      p-4 (compact), p-5 (standard), p-6 (feature)
Stack gaps:      gap-3 (tight), gap-4 (standard), gap-6 (loose)

Border radius:
  Cards:         rounded-xl (12px) — primary card unit
  Compact cards: rounded-lg (8px) — inline chips, badges
  Buttons:       rounded-lg (8px)
  Badges/chips:  rounded-md (6px) or rounded-full (pills)
  Modals:        rounded-2xl (16px)
  Rule: NO MIXING — pick the scale and lock it per surface
```

## Elevation & Borders

```
Cards: border border-line-0 (E2E8F0) + shadow-card (0 1px 3px rgba(0,0,0,0.05))
Hover: border-line-1 (CBD5E1) + shadow-card-hover
Active/Selected: border-blue-200 + bg-blue-50
Focus rings: ring-2 ring-blue-500/40
Header: sticky, bg-white, border-b border-line-0, shadow-subtle
```

## Component Design Conventions

### SectionHeader (page-level title area)
- Title: text-lg font-semibold text-slate-900
- Subtitle: text-sm text-slate-500 max-w-prose
- NO eyebrow labels above the heading (craft-floor ban)
- Companion badge: inline pill to the right (colored by state)
- Action buttons: right-aligned

### Metric Cards (VitalMetricCard)
- White surface, border hairline
- Value: font-mono text-2xl font-bold (colored by channel)
- Unit: text-xs font-mono text-slate-400
- Label: text-xs font-medium text-slate-600
- Source badge: bottom-right corner
- Freshness indicator: colored dot top-right corner

### Status Badges
- All text ALL_CAPS font-mono text-[10px] font-bold
- Critical: bg-red-50 text-red-700 border border-red-200
- Warning: bg-amber-50 text-amber-700 border border-amber-200
- Normal: bg-emerald-50 text-emerald-700 border border-emerald-200
- Info/Prototype: bg-blue-50 text-blue-700 border border-blue-200

### Data Tables / Lists
- bg-white border border-line-0 rounded-xl overflow-hidden
- divide-y divide-line-0 (NOT cards — divide-y pattern)
- Row hover: bg-surface-2
- No alternating row stripes

### Charts (Recharts)
- Grid: strokeDasharray="3 3" stroke="#E2E8F0"
- Axis text: fill="#94A3B8" fontSize=11
- Tooltip: bg-white border border-line-0 shadow-modal
- Lines: strokeWidth=1.5, no dots, no animation on live channels

### Disclaimer / Prototype Notice
- bg-amber-50 border border-amber-200 rounded-xl p-4
- Icon: AlertTriangle amber-600
- Text: text-xs text-amber-800

## Motion System

```
Philosophy: CSS for micro-interactions, Motion library (motion/react) for
page transitions and state changes. Every animation must be motivated.

Micro-interactions (CSS):
  Hover: transition-colors duration-150
  Active: scale-[0.98] duration-75
  Focus ring: ring-2 ring-blue-500/40

Page-level (Motion):
  Page enter: opacity 0→1, y 6→0, duration 0.25s, ease [0.16,1,0.3,1]
  Drawer/Sheet: x slide from right, spring stiffness 400 damping 40
  
Live data (NO animation): isAnimationActive={false} on all recharts Lines

Pulse indicators: animate-ping-slow (2s) for live hardware connection dots

Banned:
  - Infinite loop animations on every card
  - ScrollTrigger/pinning (no scroll-driven content in Operate mode)
  - Stagger on every section enter (save for landing page only)
  - Motion on live chart data
```

## Surface-Specific Notes

### Landing Page (/landing tab)
- Mode: Persuade
- Will receive a hero transformation with Motion-based text reveals
- 3D element: lightweight, lazy-loaded, NOT React Three Fiber (no R3F dep installed)
  → Use CSS 3D transforms + SVG illustration OR Spline embed (iframe, no npm)
  → Must have a "Skip → Dashboard" path
- Dark mode sections allowed ONLY if the user's brief calls for it (currently dark)
- Key cleanup: remove hardcoded fusion weight percentages from channel cards

### Dashboard Overview (/dashboard tab)
- Mode: Operate
- 5-section calm command center (already built in previous session)
- Continue refining; do not add more sections

### AI Apnea Page (/aiApnea tab)
- Mode: Operate
- ArcGauge: KEEP — it shows the prototype apnea score, which IS implemented
  (The user directive said remove from OVERVIEW — not from the dedicated AI page)
- FusionWeightBar: KEEP — it shows dynamic effective weights (IS implemented)
- The "Prototype Apnea Score" label is accurate for this page
- Needs white/blue theme update (currently uses dark surface tokens)

### Live Monitoring (/liveMonitoring tab)
- Mode: Operate
- 8-channel oscilloscope — keep the channel strip layout
- Needs white/blue theme update
- Add subtopbar: Environment | PPG | Derived | Signal Quality

### Alerts / Event Review (/alerts tab)
- Mode: Operate
- Rename/label as "Event Review" or "Alerts & Triage"
- Keep divide-y list pattern (correct, non-card)
- Needs white/blue theme update (uses surface/line dark tokens)

### Device Health / Sensor Health (/sensorHealth tab)
- Already updated to light theme

### Thermal Control (/thermal tab)
- Already updated to light theme

## Tailwind Token Map (Current → Target)

Dark-era tokens still present in un-updated pages:
  bg-surface-0    → bg-white          (was dark surface)
  bg-surface-1    → bg-slate-50 / bg-surface-1 (F8FAFC — already correct in tw config)
  bg-surface-2    → bg-slate-100 / bg-surface-2 (F1F5F9 — already correct)
  border-line-0   → border-slate-200 / border-line-0 (E2E8F0 — correct in tw config)
  border-line-1   → border-slate-300 / border-line-1 (correct)
  text-medical-cyan → text-blue-600 or text-cyan-600 (context-dependent)
  bg-medical-cyan   → bg-blue-600
  text-slate-100    → text-slate-900 (dark → light inversion)
  text-slate-400 (on dark) → text-slate-600 (on light)

NOTE: The tailwind.config.js already defines the WHITE surface tokens.
      The issue is legacy pages were written with dark token SEMANTICS.
      bg-surface-0 = #FFFFFF (correct), bg-surface-1 = #F8FAFC (correct).
      However Tailwind won't know old class names map to right colors —
      in the config they DO — so bg-surface-0 is white, bg-surface-1 is #F8FAFC.
      The problem is VISUAL: dark context classes like text-slate-100 on bg-surface-1
      (now light) will render near-white text on a white background.
      Fix: swap text-slate-1xx → text-slate-8xx on all updated pages.
