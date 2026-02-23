'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

export default function HeroSection() {
    const t = useTranslations('hero');

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden animated-bg">
            {/* Decorative orbs */}
            <div
                aria-hidden
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-violet/10 blur-[120px] pointer-events-none"
            />
            <div
                aria-hidden
                className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-brand-cyan/5 blur-[80px] pointer-events-none"
            />

            {/* Grid overlay */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                {/* Tagline pill */}
                <motion.div
                    custom={0}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-cyan/20 text-brand-cyan text-sm font-medium mb-8"
                >
                    <Sparkles size={14} />
                    {t('tagline')}
                </motion.div>

                {/* Main title */}
                <motion.h1
                    custom={1}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight mb-6"
                >
                    <span className="text-white gradient-text">{t('title')}</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    custom={2}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10"
                >
                    {t('subtitle')}
                </motion.p>

                {/* CTA */}
                <motion.div
                    custom={3}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col sm:flex-row gap-4 items-center justify-center"
                >
                    <a
                        href="#projets"
                        className="group flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-cyan text-brand-black font-semibold text-base hover:bg-brand-cyan/90 transition-all duration-300 glow-cyan"
                    >
                        {t('cta')}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </a>
                    <a
                        href="#vision"
                        className="px-7 py-3.5 rounded-2xl border border-white/10 text-white/70 font-medium text-base hover:border-white/20 hover:text-white transition-all duration-200"
                    >
                        Notre vision
                    </a>
                </motion.div>

                {/* Floating badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="mt-20 inline-flex items-center gap-6 glass rounded-2xl px-6 py-4"
                >
                    <div className="flex -space-x-2">
                        {['#22d3ee', '#7c3aed', '#a855f7'].map((color, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full border-2 border-brand-black"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-white/40 font-medium">Outils forgés avec</p>
                        <p className="text-sm text-white font-semibold">IA • Supabase • Next.js</p>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-xs text-white/20 font-medium tracking-widest uppercase">Scroll</span>
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-px h-8 bg-gradient-to-b from-brand-cyan/50 to-transparent"
                />
            </motion.div>
        </section>
    );
}
