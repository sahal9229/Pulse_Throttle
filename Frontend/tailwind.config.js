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
          base: '#EAF0F6',
          card: '#FFFFFF',
          well: '#F1F5F9',
          border: '#E2E8F0',
          100: '#F8FAFC',
          200: '#EAF0F6',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
        },
        aubergine: {
          950: '#0E0717',
          900: '#140C22',
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
          700: '#B45309',
        },
        telemetry: {
          tss: '#F59E0B',
          fpe: '#10B981',
          compute: '#4F46E5',
          storage: '#0284C7',
        },
      },
      boxShadow: {
        'lab-card': '0 12px 32px -4px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'lab-card-sm': '0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'lab-card-hover': '0 20px 40px -6px rgba(15, 23, 42, 0.1), 0 8px 16px -3px rgba(15, 23, 42, 0.05)',
        'lab-well': 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.04)',
        'glow-marigold': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'glow-marigold-intense': '0 0 35px -5px rgba(245, 158, 11, 0.5), 0 0 70px -10px rgba(217, 119, 6, 0.3)',
      },
      fontFamily: {
        sans: ['"Outfit"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
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
