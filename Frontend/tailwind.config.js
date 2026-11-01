/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ice: {
          base: '#E6EDF5',
          card: '#F2F6FA',
          well: '#DFE7F0',
          border: '#D0DCE8',
          100: '#F8FAFC',
          200: '#E6EDF5',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
        },
        aubergine: {
          950: '#0E0914',
          900: '#160C24',
          850: '#1B1228',
          800: '#231438',
          700: '#3A2852',
          600: '#523B72',
          500: '#6E5D85',
          400: '#8E7FA4',
          300: '#B5AAC7',
          200: '#DCD5E6',
        },
        marigold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          coral: '#EA580C',
          orange: '#FF5722',
        },
      },
      boxShadow: {
        'neumorph-card': '12px 12px 28px rgba(166,180,200,0.45), -10px -10px 24px rgba(255,255,255,0.9)',
        'neumorph-card-sm': '6px 6px 16px rgba(166,180,200,0.35), -6px -6px 14px rgba(255,255,255,0.9)',
        'neumorph-card-hover': '16px 16px 36px rgba(166,180,200,0.55), -12px -12px 28px rgba(255,255,255,0.95)',
        'neumorph-well': 'inset 4px 4px 8px rgba(166,180,200,0.45), inset -4px -4px 8px rgba(255,255,255,0.85)',
        'neumorph-well-sm': 'inset 2px 2px 5px rgba(166,180,200,0.4), inset -2px -2px 5px rgba(255,255,255,0.85)',
        'neumorph-btn': '5px 5px 12px rgba(166,180,200,0.4), -4px -4px 10px rgba(255,255,255,0.9)',
        'neumorph-btn-pressed': 'inset 3px 3px 6px rgba(166,180,200,0.5), inset -3px -3px 6px rgba(255,255,255,0.8)',
        'glow-marigold': '0 0 25px -4px rgba(245, 158, 11, 0.45)',
        'glow-marigold-intense': '0 0 35px -5px rgba(245, 158, 11, 0.6), 0 0 70px -10px rgba(234, 88, 12, 0.35)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'float': 'float 3.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.2' },
          '50%': { transform: 'scale(1.15)', opacity: '0.45' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
