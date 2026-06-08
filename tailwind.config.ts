import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        telegram: {
          bg: '#e8ecef',
          darkBg: '#1a1a2e',
          sidebar: '#ffffff',
          darkSidebar: '#16213e',
          bubble: '#ffffff',
          darkBubble: '#0f3460',
          ownBubble: '#d1e7ff',
          darkOwnBubble: '#1a5276',
          accent: '#3390ec',
          darkAccent: '#3f8ae0',
          text: '#000000',
          darkText: '#e4e4e4',
          secondary: '#707579',
          darkSecondary: '#8b8b9e',
          input: '#ffffff',
          darkInput: '#16213e',
          border: '#e0e0e0',
          darkBorder: '#2a2a4a',
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-dot': 'bounceDot 1.4s ease-in-out infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceDot: {
          '0%, 60%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-6px)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(2)' },
        }
      }
    },
  },
  plugins: [],
}
export default config
