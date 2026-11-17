import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  const scrollToFirstSection = () => {
    const el = document.getElementById('environmental-sensing');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // Coherent easing curve
  const easeOut = [0.16, 1, 0.3, 1] as const;

  return (
    <div ref={containerRef} className="relative w-full text-[#172033] overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      
      {/* ── Imperceptible Atmospheric Light Field ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-[#EFF6FF] opacity-50 blur-3xl -z-10"
      />

      {/* ═══════════════════════════════════════════════════════
          HERO VIEWPORT — EDITORIAL, SPACIOUS, ART-DIRECTED
          ═══════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="min-h-[85vh] sm:min-h-[90vh] max-w-5xl mx-auto px-6 sm:px-10 flex flex-col justify-between pt-12 sm:pt-20 pb-10"
      >
        {/* Asymmetrical Top Brand & Headline Group */}
        <div className="space-y-6 sm:space-y-8 max-w-3xl">
          
          {/* Subtle Wordmark Identity */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="flex items-center gap-3"
          >
            <span className="text-xs font-semibold tracking-[0.2em] text-[#2563EB] uppercase font-sans">
              NeoNattle
            </span>
            <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
            <span className="text-[11px] text-[#64748B] font-sans">
              Developed by Avenza
            </span>
            <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
            <span className="text-[11px] text-[#94A3B8] font-sans">
              Research Prototype
            </span>
          </motion.div>

          {/* Staggered Line-by-Line Headline Reveal */}
          <div className="space-y-1">
            <div className="overflow-hidden">
              <motion.h1
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-[-0.025em] text-[#172033] leading-[1.12]"
              >
                Intelligent neonatal monitoring
              </motion.h1>
            </div>
            <div className="overflow-hidden">
              <motion.h1
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22, ease: easeOut }}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-[-0.025em] text-[#172033] leading-[1.12]"
              >
                &amp; environmental control prototype.
              </motion.h1>
            </div>
          </div>

          {/* Restrained Hairline Blue Accent Line */}
          <motion.div
            initial={shouldReduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.65, delay: 0.35, ease: easeOut }}
            style={{ transformOrigin: 'left' }}
            className="w-12 h-[1.5px] bg-[#2563EB]"
          />

          {/* Supporting Copy */}
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: easeOut }}
            className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-xl font-sans font-normal pt-1"
          >
            An educational research platform combining environmental sensing, physiological signals and explainable event analysis.
          </motion.p>

          {/* Primary Action Row with Micro-Interactions */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.58, ease: easeOut }}
            className="flex flex-wrap items-center gap-6 pt-3"
          >
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2.5 px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Enter Monitoring Console</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <button
              onClick={scrollToFirstSection}
              className="group inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#172033] font-medium py-2 transition-colors cursor-pointer relative"
            >
              <span>Explore the project</span>
              <span className="text-[#94A3B8] group-hover:translate-y-0.5 transition-transform duration-200">↓</span>
              <span className="absolute bottom-1.5 left-0 w-0 h-[1px] bg-[#172033] transition-all duration-200 group-hover:w-full" />
            </button>
          </motion.div>

        </div>

        {/* Quiet Bottom Alignment & Disclaimer */}
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="pt-12 sm:pt-16 flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#94A3B8]"
        >
          <span>Educational research prototype · Not for clinical use</span>
          <span className="text-[11px] text-[#94A3B8] font-sans">Scroll to explore</span>
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          EDITORIAL SCROLL STORYTELLING
          5 Distinct Asymmetric Compositions — Zero Cards
          ═══════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 space-y-36 sm:space-y-48 py-20 sm:py-32">

        {/* ── 01. ENVIRONMENTAL SENSING: Left-Weighted Asymmetric ── */}
        <section id="environmental-sensing" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-baseline">
            
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, ease: easeOut }}
              className="lg:col-span-7 space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#172033]">
                Environmental Sensing
              </h2>
              <p className="text-base text-[#475569] leading-relaxed max-w-md">
                Continuous ambient thermal equilibrium and relative humidity surveillance within the neonatal micro-climate chamber.
              </p>
            </motion.div>

            {/* Restrained Visual Gesture: Fine Equilibrium Datum Line */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
              className="lg:col-span-5 flex flex-col justify-end"
            >
              <div className="space-y-2">
                <svg className="w-full h-8 overflow-visible" viewBox="0 0 240 24" fill="none">
                  <motion.line
                    x1="0"
                    y1="12"
                    x2="240"
                    y2="12"
                    stroke="#CBD5E1"
                    strokeWidth="1"
                    initial={shouldReduceMotion ? false : { pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: easeOut }}
                  />
                  <motion.circle
                    cx="120"
                    y="12"
                    r="3"
                    fill="#2563EB"
                    initial={shouldReduceMotion ? false : { scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.5, ease: easeOut }}
                  />
                </svg>
                <div className="flex justify-between text-[11px] font-mono text-[#94A3B8]">
                  <span>36.0°C</span>
                  <span className="text-[#2563EB] font-medium">36.5°C Equilibrium</span>
                  <span>37.0°C</span>
                </div>
              </div>
            </motion.div>

          </div>
        </section>


        {/* ── 02. PHYSIOLOGICAL SIGNALS: Right-Offset Composition ── */}
        <section id="physiological-signals" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-baseline">
            
            {/* Left Visual Gesture: Delicate Single Pulse Cycle */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.7, ease: easeOut }}
              className="lg:col-span-5 order-2 lg:order-1 flex items-center"
            >
              <svg className="w-full h-16 overflow-visible" viewBox="0 0 240 60" fill="none">
                <motion.path
                  d="M 0 30 L 70 30 L 85 10 L 100 50 L 115 25 L 125 32 L 135 30 L 240 30"
                  stroke="#2563EB"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={shouldReduceMotion ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, ease: easeOut }}
                />
              </svg>
            </motion.div>

            {/* Right Offset Typographic Content */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}
              className="lg:col-span-7 order-1 lg:order-2 space-y-4 lg:pl-8"
            >
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#172033]">
                Physiological Signals
              </h2>
              <p className="text-base text-[#475569] leading-relaxed max-w-md">
                Dual-wavelength optical photoplethysmography synchronized with non-contact thoracic movement differencing.
              </p>
            </motion.div>

          </div>
        </section>


        {/* ── 03. SIGNAL QUALITY: Split Rhythm & Coherence Datum ── */}
        <section id="signal-quality" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, ease: easeOut }}
              className="lg:col-span-7 space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#172033]">
                Signal Quality
              </h2>
              <p className="text-base text-[#475569] leading-relaxed max-w-md">
                Real-time integrity gating evaluating perfusion index, motion noise, and packet timing before feature fusion.
              </p>
            </motion.div>

            {/* Restrained Visual Gesture: Calibrated Cross-Datum */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
              className="lg:col-span-5 flex justify-start lg:justify-center"
            >
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Horizontal axis */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#E2E8F0]" />
                {/* Vertical axis */}
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#E2E8F0]" />
                {/* Calibration markers */}
                <div className="absolute w-16 h-16 rounded-full border border-dashed border-[#CBD5E1]" />
                {/* Active focal node */}
                <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              </div>
            </motion.div>

          </div>
        </section>


        {/* ── 04. EVENT ANALYSIS: Wide Pacing & Triad Convergence ── */}
        <section id="event-analysis" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-baseline">
            
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, ease: easeOut }}
              className="lg:col-span-7 space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#172033]">
                Event Analysis
              </h2>
              <p className="text-base text-[#475569] leading-relaxed max-w-lg">
                Deterministic correlation linking thoracic pauses, desaturation slope, and reflex bradycardia into an explainable audit dossier.
              </p>
            </motion.div>

            {/* Restrained Visual Gesture: Three Converging Line Rays */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
              className="lg:col-span-5 flex items-center justify-start lg:justify-end"
            >
              <svg className="w-48 h-20 overflow-visible" viewBox="0 0 180 80" fill="none">
                <motion.line
                  x1="0"
                  y1="15"
                  x2="160"
                  y2="40"
                  stroke="#94A3B8"
                  strokeWidth="1"
                  initial={shouldReduceMotion ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: easeOut }}
                />
                <motion.line
                  x1="0"
                  y1="40"
                  x2="160"
                  y2="40"
                  stroke="#2563EB"
                  strokeWidth="1.5"
                  initial={shouldReduceMotion ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, ease: easeOut }}
                />
                <motion.line
                  x1="0"
                  y1="65"
                  x2="160"
                  y2="40"
                  stroke="#94A3B8"
                  strokeWidth="1"
                  initial={shouldReduceMotion ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
                />
                <circle cx="160" cy="40" r="3.5" fill="#2563EB" />
              </svg>
            </motion.div>

          </div>
        </section>


        {/* ── 05. WORKING CONSOLE ENTRY: Quiet, Confident Close ── */}
        <section className="pt-8 pb-16 text-center space-y-6">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="space-y-3 max-w-md mx-auto"
          >
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#172033]">
              Explore the working console
            </h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Direct access to real-time multi-channel telemetry, thermal regulation, and incident review dossiers.
            </p>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
            className="pt-2"
          >
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Enter Monitoring Console</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <p className="text-[11px] text-[#94A3B8] font-sans pt-4">
            Educational research prototype · Not for clinical use
          </p>
        </section>

      </div>

    </div>
  );
};

export default LandingPage;
