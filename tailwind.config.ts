import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './i18n/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // Brand palette
                'brand-black': '#050505',
                'brand-dark': '#0a0a0f',
                'brand-navy': '#0d1b2a',
                'brand-cyan': '#22d3ee',
                'brand-cyan-dim': '#0891b2',
                'brand-violet': '#7c3aed',
                'brand-violet-light': '#a855f7',
                'brand-blue': '#1e3a5f',
                'brand-glass': 'rgba(255,255,255,0.05)',
                'brand-glass-border': 'rgba(255,255,255,0.1)',
            },
            fontFamily: {
                jakarta: ['var(--font-jakarta)', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-hero': 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.3) 0%, rgba(5,5,5,0) 70%)',
                'gradient-cyan-violet': 'linear-gradient(135deg, #22d3ee, #7c3aed)',
                'gradient-dark': 'linear-gradient(180deg, #050505 0%, #0d1b2a 100%)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(34,211,238,0.3)' },
                    '100%': { boxShadow: '0 0 40px rgba(34,211,238,0.7)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};

export default config;
