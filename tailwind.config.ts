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
                // Brand palette — extrait du logo EkstremAI
                'brand-black': '#030712',        // fond très sombre, bleu-nuit profond
                'brand-dark': '#080c18',         // couche sombre secondaire
                'brand-navy': '#0d1525',         // bleu marine profond du logo
                'brand-cyan': '#00D4FF',         // cyan néon vif du texte EKSTREM AI
                'brand-cyan-dim': '#0891b2',     // cyan atténué pour les variantes
                'brand-violet': '#8B3AF7',       // violet principal des montagnes
                'brand-violet-light': '#B06EFF', // violet clair pour highlights
                'brand-magenta': '#C026D3',      // magenta des pics du logo
                'brand-blue': '#1a2744',         // bleu profond de l'anneau
                'brand-glass': 'rgba(255,255,255,0.04)',
                'brand-glass-border': 'rgba(0,212,255,0.12)',
            },
            fontFamily: {
                jakarta: ['var(--font-jakarta)', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-hero': 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(139,58,247,0.35) 0%, rgba(3,7,18,0) 70%)',
                'gradient-cyan-violet': 'linear-gradient(135deg, #00D4FF, #8B3AF7)',
                'gradient-mountains': 'linear-gradient(135deg, #C026D3, #8B3AF7, #00D4FF)',
                'gradient-dark': 'linear-gradient(180deg, #030712 0%, #0d1525 100%)',
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
                    '0%': { boxShadow: '0 0 20px rgba(0,212,255,0.3)' },
                    '100%': { boxShadow: '0 0 40px rgba(0,212,255,0.7)' },
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
