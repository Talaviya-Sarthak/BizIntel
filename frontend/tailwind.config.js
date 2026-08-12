/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Neo-Brutalist palette ──────────────────────────────
        ink: {
          DEFAULT: '#000000',
          soft: '#0A0A0A',
          card: '#111111',
          raised: '#1A1A1A',
          medium: '#222222',
        },
        lime: {
          DEFAULT: '#C6FF00',
          dark: '#A8D800',
        },
        pink: {
          DEFAULT: '#FF4D8D',
        },
        yellow: {
          DEFAULT: '#FFD600',
        },
        muted: '#A3A3A3',

        // Legacy surface tokens mapped to Neo-Brutalist values
        // so existing classes don't break during migration
        surface: {
          DEFAULT: '#0A0A0A',
          elevated: '#111111',
          deep: '#000000',
        },
      },
      boxShadow: {
        // Neo-brutalist hard offset shadows (zero blur)
        brutal: '6px 6px 0px #FFFFFF',
        'brutal-sm': '4px 4px 0px #FFFFFF',
        'brutal-xs': '2px 2px 0px #FFFFFF',
        'brutal-lime': '6px 6px 0px #C6FF00',
        'brutal-lime-sm': '4px 4px 0px #C6FF00',
        'brutal-press': '2px 2px 0px #FFFFFF',
        'brutal-pink': '4px 4px 0px #FF4D8D',
      },
      fontFamily: {
        sans: [
          'Space Grotesk',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderWidth: {
        3: '3px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
