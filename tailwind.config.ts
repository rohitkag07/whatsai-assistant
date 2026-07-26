import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Geist', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Geist Mono', 'ui-monospace', 'monospace'],
        hindi: ['var(--font-noto-devanagari)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3.5rem, 7vw, 7.5rem)', { lineHeight: '0.9', letterSpacing: '-0.065em', fontWeight: '700' }],
        'display-lg': ['clamp(2.75rem, 5vw, 5rem)', { lineHeight: '0.96', letterSpacing: '-0.052em', fontWeight: '700' }],
        'title-xl': ['2rem', { lineHeight: '1.08', letterSpacing: '-0.035em', fontWeight: '650' }],
        'eyebrow': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.18em', fontWeight: '700' }],
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
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        // Lead-temperature semantic colors used across pipeline UI
        hot:  '#EF4444',
        warm: '#F59E0B',
        cold: '#3B82F6',
      },
      borderRadius: {
        'brand-sm': '0.75rem',
        'brand-md': '1rem',
        'brand-lg': '1.5rem',
        'brand-xl': '2rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'brand-enter': 'brand-enter 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'typing-dot': 'typing-dot 1.1s ease-in-out infinite',
        'signal-pulse': 'signal-pulse 2s ease-in-out infinite',
        'soft-float': 'soft-float 5s ease-in-out infinite',
        'border-sweep': 'border-sweep 5s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
      boxShadow: {
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.2)',
        'glow-emerald-lg': '0 0 60px rgba(16, 185, 129, 0.18)',
        'obsidian-card': '0 30px 100px rgba(2, 8, 23, 0.42)',
        'inner-line': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
