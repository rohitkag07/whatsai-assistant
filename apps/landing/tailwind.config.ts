import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Geist Mono', 'ui-monospace', 'monospace'],
        hindi: ['var(--font-hindi)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3.5rem, 7vw, 7.5rem)', { lineHeight: '0.9', letterSpacing: '-0.065em', fontWeight: '700' }],
        'display-lg': ['clamp(2.75rem, 5vw, 5rem)', { lineHeight: '0.96', letterSpacing: '-0.052em', fontWeight: '700' }],
        'title-xl': ['2rem', { lineHeight: '1.08', letterSpacing: '-0.035em', fontWeight: '650' }],
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.18em', fontWeight: '700' }],
      },
      colors: {
        'bg-obsidian': '#0A192F',
        'surface-card': '#112240',
        'surface-hover': '#1D3557',
        'accent-emerald': '#10B981',
        'accent-cyan': '#06B6D4',
        'text-platinum': '#F8FAFC',
        'text-slate': '#94A3B8',
        xerowa: {
          obsidian: '#0A192F',
          card: '#112240',
          hover: '#1D3557',
          emerald: '#10B981',
          cyan: '#06B6D4',
          platinum: '#F8FAFC',
          slate: '#94A3B8',
        },
      },
      borderRadius: {
        'brand-sm': '0.75rem',
        'brand-md': '1rem',
        'brand-lg': '1.5rem',
        'brand-xl': '2rem',
      },
      boxShadow: {
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.2)',
        'glow-emerald-lg': '0 0 60px rgba(16, 185, 129, 0.18)',
        'obsidian-card': '0 30px 100px rgba(2, 8, 23, 0.42)',
        'inner-line': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      keyframes: {
        'brand-enter': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'typing-dot': {
          '0%, 60%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-4px)' },
        },
        'signal-pulse': {
          '0%, 100%': { opacity: '0.45', transform: 'scale(0.92)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        'soft-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'border-sweep': {
          from: { backgroundPosition: '0% 50%' },
          to: { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        'brand-enter': 'brand-enter 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'typing-dot': 'typing-dot 1.1s ease-in-out infinite',
        'signal-pulse': 'signal-pulse 2s ease-in-out infinite',
        'soft-float': 'soft-float 5s ease-in-out infinite',
        'border-sweep': 'border-sweep 5s linear infinite',
      },
    },
  },
};

export default config;
