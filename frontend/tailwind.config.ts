import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F5F0E8',
          light: '#FDFBF7',
          dark: '#E8E0D0',
        },
        ink: {
          DEFAULT: '#2C2416',
          light: '#6B5D4F',
          muted: '#9B8B7A',
        },
        accent: {
          DEFAULT: '#8B4513',
          gold: '#D4A574',
          warm: '#A0522D',
        },
        sealed: '#8B2500',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Lora"', '"Source Serif Pro"', 'Georgia', 'serif'],
        ui: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'chapter-num': ['2rem', { lineHeight: '1.2', letterSpacing: '0.02em' }],
        'chapter-title': ['1rem', { lineHeight: '1.4' }],
        prose: ['0.9375rem', { lineHeight: '1.8' }],
        'pull-quote': ['0.9375rem', { lineHeight: '1.7' }],
        label: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.2em' }],
      },
      spacing: {
        'page-x': '2rem',
        'page-y': '2.5rem',
      },
      boxShadow: {
        book: '0 2px 20px rgba(44, 36, 22, 0.12)',
        'book-hover': '0 4px 28px rgba(44, 36, 22, 0.18)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'page-turn': 'pageTurn 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pageTurn: {
          '0%': { transform: 'rotateY(0deg)', opacity: '1' },
          '50%': { transform: 'rotateY(-5deg)', opacity: '0.7' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
