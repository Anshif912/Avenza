/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Surface Hierarchy ── */
        base: '#070b14',
        surface: {
          0: '#0a0f1e',
          1: '#0d1527',
          2: '#111c38',
        },
        /* ── Border Hierarchy ── */
        line: {
          0: '#1c2d5a',
          1: '#263d7a',
          active: '#0e4d8a',
        },
        /* ── Navy alias (backward compat) ── */
        navy: {
          950: '#070b14',
          900: '#0a0f1e',
          850: '#0d1527',
          800: '#111c38',
          750: '#1c2d5a',
          700: '#263d7a',
          600: '#2d4a9a',
        },
        /* ── Clinical Signal Palette ── */
        medical: {
          cyan:   '#06b6d4',
          teal:   '#14b8a6',
          violet: '#8b5cf6',
          blue:   '#3b82f6',
          green:  '#10b981',
          amber:  '#f59e0b',
          red:    '#ef4444',
          slate:  '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      animation: {
        /* Status indicators */
        'ping-slow':   'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ping-fast':   'ping 0.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-fast':  'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        /* Ambient glow on active card borders */
        'glow-pulse':  'glowPulse 2s ease-in-out infinite alternate',
        /* Page reveal */
        'fade-in-up':  'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        glowPulse: {
          '0%':   { boxShadow: '0 0 5px rgba(6,182,212,0.15)' },
          '100%': { boxShadow: '0 0 18px rgba(6,182,212,0.45)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'card': '14px',
        'chip': '6px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.5)',
        'overlay': '0 8px 32px rgba(0,0,0,0.7)',
        'inset-border': 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
}
