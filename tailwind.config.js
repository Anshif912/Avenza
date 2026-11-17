/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Medical White + Blue Surface Hierarchy ── */
        background: '#F8FAFC',
        surface: {
          0: '#FFFFFF', // Pure clinical white surface
          1: '#F8FAFC', // Soft elevated surface
          2: '#F1F5F9', // Subtle inset / hover surface
          3: '#E2E8F0', // Elevated control surface
        },
        /* ── Medical Border Hierarchy ── */
        line: {
          0: '#E2E8F0', // Primary crisp hairline border
          1: '#CBD5E1', // Focused / hover border
          subtle: '#F1F5F9',
          active: '#2563EB', // Active medical blue border
        },
        /* ── Medical Blue Hierarchy ── */
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // Primary medical blue
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        /* ── Clinical Signal & Semantic Status Palette ── */
        clinical: {
          blue:    '#2563EB',
          deepBlue:'#1E40AF',
          softBlue:'#EFF6FF',
          cyan:    '#0284C7',
          teal:    '#0D9488',
          violet:  '#7C3AED',
          green:   '#16A34A',
          amber:   '#D97706',
          red:     '#DC2626',
          slate:   '#64748B',
        },
        /* ── Backward compatibility aliases ── */
        navy: {
          950: '#0F172A',
          900: '#1E293B',
          850: '#334155',
          800: '#475569',
          750: '#64748B',
          700: '#94A3B8',
          600: '#CBD5E1',
        },
        medical: {
          cyan:   '#0284C7',
          teal:   '#0D9488',
          violet: '#7C3AED',
          blue:   '#2563EB',
          green:  '#16A34A',
          amber:  '#D97706',
          red:    '#DC2626',
        },
        /* ── Research Instrument Typography Palette ── */
        text: {
          primary:   '#172033', // Deep clinical navy
          body:      '#334155', // Readable slate body
          secondary: '#64748B', // Metadata & subtle labels
          muted:     '#94A3B8', // Inactive & placeholders
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      animation: {
        'ping-slow':   'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ping-fast':   'ping 0.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-fast':  'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up':  'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'card': '12px',
        'chip': '6px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px rgba(37, 99, 235, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
