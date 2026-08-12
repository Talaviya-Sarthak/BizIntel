/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#111111',
        content: '#171717',
        card: '#1C1C1C',
        sidebar: '#161616',
        topbar: '#181818',
        border: 'rgba(255, 255, 255, 0.06)',
        hover: 'rgba(255, 255, 255, 0.05)',
        surface: {
          DEFAULT: '#1C1C1C',
          elevated: '#171717',
          deep: '#111111',
        },
        primary: {
          DEFAULT: '#FFFFFF',
          foreground: '#111111',
        },
        muted: {
          DEFAULT: '#262626',
          foreground: '#A3A3A3',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.3s ease-out both',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
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
