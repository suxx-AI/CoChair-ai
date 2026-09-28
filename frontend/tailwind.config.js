/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090d16',
          900: '#0d1322',
          850: '#121a2d',
          800: '#18233c',
          750: '#1f2d4d',
          700: '#28395f',
          600: '#384d7d',
        },
        cochair: {
          blue: '#2b66ff',
          'blue-bright': '#3b82f6',
          'blue-light': '#60a5fa',
          'blue-dark': '#1d4ed8',
          'blue-glow': 'rgba(43, 102, 255, 0.25)',
          white: '#ffffff',
          slate: '#94a3b8',
          card: '#101728',
          surface: '#0b101b',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        brand: {
          primary: '#2b66ff',
          secondary: '#60a5fa',
          accent: '#818cf8',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b'
        }
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1.0)' },
        },
      }
    },
  },
  plugins: [],
}
