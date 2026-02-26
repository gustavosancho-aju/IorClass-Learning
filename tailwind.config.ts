import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Master Speaking Brand Colors ───────────────────────────
      colors: {
        ms: {
          dark:   '#023d52',   // Primary dark teal
          medium: '#267189',   // Primary medium teal
          light:  '#5e96a7',   // Primary light teal
          brown:  '#69432b',   // Secondary brown
          gold:   '#cea66f',   // Secondary gold / CTA
          beige:  '#f3eee7',   // Background soft
          'gold-light': '#e8c99a',
          'dark-90': '#023d52e6',
        },
      },
      // ─── Typography ─────────────────────────────────────────────
      fontFamily: {
        display: ['"Big Shoulders Display"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // ─── Gradients ──────────────────────────────────────────────
      backgroundImage: {
        'ms-gradient': 'linear-gradient(135deg, #023d52 0%, #267189 100%)',
        'ms-gold-gradient': 'linear-gradient(135deg, #cea66f 0%, #e8c99a 100%)',
        'ms-soft': 'linear-gradient(180deg, #f3eee7 0%, #ffffff 100%)',
      },
      // ─── Box Shadows ────────────────────────────────────────────
      boxShadow: {
        'ms-card': '0 4px 24px 0 rgba(2,61,82,0.10)',
        'ms-float': '0 8px 40px 0 rgba(2,61,82,0.15)',
        'ms-gold': '0 4px 20px 0 rgba(206,166,111,0.35)',
      },
      // ─── Border Radius ──────────────────────────────────────────
      borderRadius: {
        'ms': '16px',
        'ms-lg': '24px',
      },
      // ─── Animations ─────────────────────────────────────────────
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(206,166,111,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(206,166,111,0)' },
        },
        'wave': {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'pulse-gold': 'pulse-gold 2s infinite',
        'wave': 'wave 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
