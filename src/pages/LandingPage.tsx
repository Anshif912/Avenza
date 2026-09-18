import React from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import {
  Activity, Camera, Heart, Thermometer, ShieldCheck, ShieldAlert,
  Zap, ArrowRight, Play, RotateCcw, BrainCircuit, Lock, Eye,
  Cpu, CheckCircle2, ChevronRight, Sparkles, Layers, Info, FileText
} from 'lucide-react';
import { SpotlightCard, DataSourceBadge, ClinicalDisclaimer, ApneaStateBadge } from '../components/design-system/DesignSystemComponents';

export const LandingPage: React.FC = () => {
  const { setActiveTab } = useMonitoring();

  const handleStartMonitoring = () => {
    setActiveTab('login');
  };

  const handleViewDashboard = () => {
    setActiveTab('dashboard');
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-24 pb-20 max-w-6xl mx-auto font-sans animate-fade-in">

      {/* ================================================================
          SECTION 1 — HERO
          Intelligent Neonatal Monitoring & AI-Assisted Apnea Event Detection
          ================================================================ */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-1 border border-line-0 shadow-2xl p-8 lg:p-14">
        {/* Ambient background glow and grid */}
        <div className="absolute inset-0 bg-grid-subtle pointer-events-none opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.14),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Prototype Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>INTELLIGENT NEONATAL MONITORING PROTOCOL</span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight leading-[1.08]">
                AVEN<span className="text-medical-cyan">ZA</span>
              </h1>
              <p className="text-lg sm:text-xl font-semibold text-slate-200 tracking-tight">
                AI-Assisted Neonatal Apnea Event Detection & Cardiorespiratory Fusion
              </p>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                Multimodal prototype monitoring combining physiological signals with camera-derived chest and abdomen movement evidence.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleStartMonitoring}
                className="flex items-center gap-2 px-7 py-3.5 bg-medical-cyan hover:brightness-110 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>START MONITORING</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('how-it-works')}
                className="px-5 py-3.5 bg-surface-2 hover:bg-surface-0 text-slate-200 border border-line-0 hover:border-line-1 font-semibold text-sm rounded-xl transition-all cursor-pointer"
              >
                EXPLORE PLATFORM
              </button>

              <button
                onClick={handleViewDashboard}
                className="flex items-center gap-2 px-5 py-3.5 bg-surface-2 hover:bg-surface-0 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>COMMAND CENTER</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-mono flex items-center gap-2 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safe local client evaluation · No PHI transmission</span>
            </div>
          </div>

          {/* Right Column: Stylized Live-Monitoring Product Preview (INTERFACE PREVIEW) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-surface-0 border border-line-0 p-5 shadow-2xl space-y-4">
              {/* Product Preview Tag */}
              <div className="flex items-center justify-between border-b border-line-0 pb-3">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  INTERFACE PREVIEW
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-surface-2 text-slate-400 border border-line-0">
                  SIMULATED TELEMETRY
                </span>
              </div>

              {/* Sample Fused Vitals */}
              <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
                <div className="p-2.5 bg-surface-1 border border-rose-500/20 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400" /> HR
                  </div>
                  <div className="text-xl font-extrabold text-slate-100">138</div>
                  <div className="text-[9px] text-slate-500">BPM</div>
                </div>

                <div className="p-2.5 bg-surface-1 border border-cyan-500/20 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" /> SpO₂
                  </div>
                  <div className="text-xl font-extrabold text-slate-100">98%</div>
                  <div className="text-[9px] text-slate-500">SAT</div>
                </div>

                <div className="p-2.5 bg-surface-1 border border-purple-500/20 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Camera className="w-3 h-3 text-purple-400" /> ROI
                  </div>
                  <div className="text-xl font-extrabold text-slate-100">0.42</div>
                  <div className="text-[9px] text-slate-500">AMP</div>
                </div>
              </div>

              {/* Prototype Score Mockup */}
              <div className="p-3 bg-surface-1 border border-violet-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-violet-300 font-bold">PROTOTYPE APNEA SCORE</span>
                  <span className="text-emerald-400 font-extrabold">12%</span>
                </div>
                <div className="w-full h-2 bg-surface-0 rounded-full overflow-hidden">
                  <div className="w-[12%] h-full bg-emerald-400 rounded-full" />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>State: NORMAL</span>
                  <span>Shield: OPTIMAL</span>
                </div>
              </div>

              {/* Micro Signal Stream Visualization */}
              <div className="h-14 bg-surface-1 rounded-xl border border-line-0 p-2 flex items-center justify-center text-xs font-mono text-slate-500">
                <div className="w-full flex items-center justify-between px-2 text-cyan-400/80 text-[10px]">
                  <span>~ ~ ~ 100 Hz SYNCHRONIZED MULTIMODAL STREAM ~ ~ ~</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 2 — MULTIMODAL MONITORING
          Three channels: Camera, SpO2, Heart Rate
          ================================================================ */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold text-medical-cyan uppercase tracking-widest">
            THREE-CHANNEL CLINICAL TELEMETRY
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Multimodal Sensor Fusion Architecture
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Combining non-invasive optical motion evidence with arterial blood oxygenation and pulse telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Channel 1: Camera */}
          <SpotlightCard glowColor="purple" className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">CHANNEL 1 · VISION</span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">Laptop Webcam Motion</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Non-contact optical flow over calibrated thoracic & abdominal ROI. Measures respiratory motion amplitude without skin contact.
              </p>
            </div>
            <div className="pt-3 border-t border-line-0 flex items-center justify-between text-xs font-mono">
              <DataSourceBadge source="DERIVED" />
              <span className="text-slate-300">Weight: <strong className="text-purple-300">40%</strong></span>
            </div>
          </SpotlightCard>

          {/* Channel 2: SpO2 */}
          <SpotlightCard glowColor="cyan" className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">CHANNEL 2 · OXIMETRY</span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">Optical SpO₂ Saturation</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Continuous MAX30102 arterial saturation sampling. Evaluates desaturation slope velocity and nadir severity during respiratory cessations.
              </p>
            </div>
            <div className="pt-3 border-t border-line-0 flex items-center justify-between text-xs font-mono">
              <DataSourceBadge source="MEASURED" />
              <span className="text-slate-300">Weight: <strong className="text-cyan-300">35%</strong></span>
            </div>
          </SpotlightCard>

          {/* Channel 3: Heart Rate */}
          <SpotlightCard glowColor="rose" className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">CHANNEL 3 · CARDIAC</span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">Pulse Telemetry (HR)</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Reflex bradycardia detection via rolling baseline tracking. Detects abrupt deceleration triggered by hypoxic chemoreceptor reflexes.
              </p>
            </div>
            <div className="pt-3 border-t border-line-0 flex items-center justify-between text-xs font-mono">
              <DataSourceBadge source="DERIVED" />
              <span className="text-slate-300">Weight: <strong className="text-rose-300">25%</strong></span>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* ================================================================
          SECTION 3 — HOW IT WORKS
          Pipeline: Hardware → DSP → Shield → Fusion → Decision
          ================================================================ */}
      <section id="how-it-works" className="space-y-8 pt-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold text-medical-cyan uppercase tracking-widest">
            ENGINEERING PIPELINE
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            How Signal Fusion Works
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            From raw photons and frames to reliable, explainable event classification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { step: '01', title: 'Telemetry Ingestion', desc: '100 Hz I²C sampling from MAX30102 + MLX90614 combined with 30 FPS client-side webcam frames.', icon: Cpu, color: 'text-cyan-400' },
            { step: '02', title: 'Digital Filtering & DSP', desc: 'Butterworth bandpass filtering, optical flow diffing, and rolling baseline derivation over 30s windows.', icon: Activity, color: 'text-teal-400' },
            { step: '03', title: 'Signal Quality Shield', desc: 'Continuous verification of perfusion index, probe attachment, and camera lighting to prevent false alarms.', icon: ShieldCheck, color: 'text-emerald-400' },
            { step: '04', title: 'Dynamic Renormalization', desc: 'If a sensor degrades or detaches, the fusion engine automatically shifts weights to remaining healthy channels.', icon: Layers, color: 'text-violet-400' },
            { step: '05', title: 'Temporal Hysteresis', desc: 'Multi-phase state machine (Normal → Watch → Suspected → Confirmed) requiring sustained evidence before alarm.', icon: RotateCcw, color: 'text-amber-400' },
            { step: '06', title: 'Explainable Event Output', desc: 'Generates Prototype Apnea Score with comprehensive feature attribution and evidence logging.', icon: BrainCircuit, color: 'text-rose-400' },
          ].map(item => (
            <div key={item.step} className="bg-surface-1 border border-line-0 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-extrabold text-slate-600">{item.step}</span>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <h3 className="text-base font-bold text-slate-100">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          SECTION 4 — EXPLAINABLE AI
          "Why was this event flagged?"
          ================================================================ */}
      <section className="bg-surface-1 border border-line-0 rounded-3xl p-8 lg:p-12 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest">
              TRANSPARENT DECISION SUPPORT
            </span>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Explainable AI: Why Was This Event Flagged?
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              AVENZA provides full forensic attribution for every evaluated event. Clinicians can immediately inspect which physiological signals contributed to the alert, their relative weights, and baseline deltas.
            </p>

            <div className="space-y-2.5 pt-2">
              {[
                { text: 'Thoracic motion amplitude dropped -81% below rolling baseline', tag: 'CAMERA' },
                { text: 'Arterial SpO₂ desaturation slope reached 85% nadir', tag: 'SPO2' },
                { text: 'Concomitant reflex bradycardia deceleration to 88 BPM', tag: 'HR' },
                { text: 'Signal Quality Shield confirmed valid perfusion lock', tag: 'SHIELD' }
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 p-2.5 bg-surface-0 border border-line-0 rounded-xl text-xs font-mono text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span className="flex-1">{item.text}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fused Evidence Visual Card */}
          <div className="bg-surface-0 border border-violet-500/30 rounded-2xl p-6 space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-line-0 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-violet-400" />
                <span className="font-bold text-slate-100">EVENT ATTRIBUTION AUDIT</span>
              </div>
              <ApneaStateBadge state="CONFIRMED" size="sm" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Prototype Apnea Score:</span>
                <span className="text-rose-400 font-extrabold text-sm">94%</span>
              </div>
              <div className="w-full h-2.5 bg-surface-1 rounded-full overflow-hidden">
                <div className="w-[94%] h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
                <div className="text-slate-500 text-[9px]">CAMERA</div>
                <div className="font-bold text-violet-300 mt-0.5">40% Wt</div>
                <div className="text-rose-400 text-[10px]">-81% Δ</div>
              </div>
              <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
                <div className="text-slate-500 text-[9px]">SPO₂</div>
                <div className="font-bold text-cyan-300 mt-0.5">35% Wt</div>
                <div className="text-rose-400 text-[10px]">-13% Δ</div>
              </div>
              <div className="p-2 bg-surface-1 rounded-lg border border-line-0">
                <div className="text-slate-500 text-[9px]">HR</div>
                <div className="font-bold text-rose-300 mt-0.5">25% Wt</div>
                <div className="text-rose-400 text-[10px]">-50 BPM</div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 italic">
              MODEL OUTPUT — NOT A DIAGNOSIS. Evaluated by prototype event criteria.
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 5 — LIVE MONITORING
          Product UI Preview
          ================================================================ */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold text-medical-cyan uppercase tracking-widest">
            SYNCHRONIZED OSCILLOSCOPE
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            8-Channel Real-Time Telemetry
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Raw PPG, filtered pulse waveforms, SpO₂ saturation, optical flow camera amplitude, and thermal regulation streams sharing a unified timestamp.
          </p>
        </div>

        <div className="bg-surface-1 border border-line-0 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono border-b border-line-0 pb-3">
            <span className="text-slate-300 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>LIVE TELEMETRY STREAM CONSOLE</span>
            </span>
            <span className="text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-500/30">
              ● 100 HZ SAMPLING
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-surface-0 rounded-xl border border-line-0">
              <span className="text-slate-400 text-[10px]">1. Heart Rate</span>
              <div className="text-lg font-extrabold text-sky-400 mt-1">138 BPM</div>
            </div>
            <div className="p-3 bg-surface-0 rounded-xl border border-line-0">
              <span className="text-slate-400 text-[10px]">2. SpO₂ Saturation</span>
              <div className="text-lg font-extrabold text-emerald-400 mt-1">98%</div>
            </div>
            <div className="p-3 bg-surface-0 rounded-xl border border-line-0">
              <span className="text-slate-400 text-[10px]">3. Camera Motion</span>
              <div className="text-lg font-extrabold text-purple-400 mt-1">0.42 amp</div>
            </div>
            <div className="p-3 bg-surface-0 rounded-xl border border-line-0">
              <span className="text-slate-400 text-[10px]">4. Chamber Temp</span>
              <div className="text-lg font-extrabold text-amber-400 mt-1">29.1°C</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 6 — EVENT REPLAY
          Synchronized event timeline
          ================================================================ */}
      <section className="bg-surface-1 border border-line-0 rounded-3xl p-8 lg:p-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              POST-EVENT CLINICAL AUDIT
            </span>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
              Synchronized Event Replay Studio
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('eventReplay')}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold rounded-xl transition-all w-fit cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Open Event Replay Studio</span>
          </button>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
          Frame-accurate timeline inspection of historical and simulated cardiorespiratory apnea episodes. Scrub through each stage of the 6-phase physiological cascade with synchronized multi-channel playback.
        </p>

        {/* 6-Phase Bar Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-[10px] text-center">
          {[
            { phase: 'P1', title: 'Baseline Normal', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
            { phase: 'P2', title: 'Motion Collapse', color: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
            { phase: 'P3', title: 'Desaturation', color: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
            { phase: 'P4', title: 'Bradycardia', color: 'bg-orange-500/20 border-orange-500/40 text-orange-300' },
            { phase: 'P5', title: 'Confirmed Event', color: 'bg-rose-500/20 border-rose-500/40 text-rose-300' },
            { phase: 'P6', title: 'Recovery', color: 'bg-teal-500/20 border-teal-500/40 text-teal-300' },
          ].map(p => (
            <div key={p.phase} className={`p-3 rounded-xl border ${p.color} space-y-1`}>
              <div className="font-extrabold">{p.phase}</div>
              <div className="text-[9px] text-slate-300">{p.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          SECTION 7 — PRIVACY-FIRST CAMERA
          Client-side execution, no face recognition, no video storage
          ================================================================ */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold text-medical-cyan uppercase tracking-widest">
            PATIENT PRIVACY BY DESIGN
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Privacy-First Non-Contact Vision
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Engineered from the ground up for strict NICU privacy and regulatory compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: 'Local Client Processing', desc: 'All optical flow calculations execute locally in the browser. Zero raw frames are transmitted.', icon: Cpu },
            { title: 'No Facial Recognition', desc: 'Only normalized thoracic & abdominal ROIs are evaluated. No facial or biometric identification.', icon: Eye },
            { title: 'Zero Video Storage', desc: 'Frames are processed in volatile RAM buffers and immediately discarded after delta extraction.', icon: Lock },
            { title: 'Explicit Operator Control', desc: 'Camera streaming begins only when the clinician explicitly clicks "Start Real Webcam".', icon: ShieldCheck },
          ].map(item => (
            <div key={item.title} className="bg-surface-1 border border-line-0 rounded-2xl p-5 space-y-3">
              <div className="p-2.5 rounded-xl bg-surface-0 border border-line-0 text-medical-cyan w-fit">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          SECTION 8 — PROTOTYPE NOTICE & FINAL CTA
          Educational / Prototype System Notice
          ================================================================ */}
      <section className="space-y-6">
        <ClinicalDisclaimer />

        <div className="rounded-3xl bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 border border-line-0 p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Ready to initialize clinical monitoring?
            </h2>
            <p className="text-sm text-slate-400">
              Start with live ESP32 hardware streaming and local non-contact camera vision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleStartMonitoring}
              className="flex items-center gap-2 px-6 py-3 bg-medical-cyan hover:brightness-110 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <span>START MONITORING</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleViewDashboard}
              className="flex items-center gap-2 px-5 py-3 bg-surface-0 hover:bg-surface-2 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>COMMAND CENTER</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
