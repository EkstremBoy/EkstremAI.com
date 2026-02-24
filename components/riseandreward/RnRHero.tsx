'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.14, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

export default function RnRHero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
            {/* Background gradient orbs */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(139,58,247,0.38) 0%, transparent 65%), radial-gradient(ellipse 45% 35% at 85% 25%, rgba(0,212,255,0.12) 0%, transparent 55%), radial-gradient(ellipse 35% 25% at 15% 75%, rgba(192,38,211,0.1) 0%, transparent 55%), #030712',
                }}
            />

            {/* Subtle grid */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    aria-hidden
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: `${4 + i * 2}px`,
                        height: `${4 + i * 2}px`,
                        left: `${10 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                        background: i % 2 === 0 ? 'rgba(0,212,255,0.5)' : 'rgba(139,58,247,0.5)',
                        filter: 'blur(1px)',
                    }}
                    animate={{
                        y: [-12, 12, -12],
                        opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                        duration: 3.5 + i * 0.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.4,
                    }}
                />
            ))}

            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                {/* Badge pill */}
                <motion.div
                    custom={0}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-violet/30 text-brand-violet-light text-sm font-semibold mb-8 tracking-wide"
                >
                    <Zap size={14} className="text-brand-cyan" />
                    Gamification · Discipline · Communauté
                </motion.div>

                {/* Title */}
                <motion.h1
                    custom={1}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="text-6xl md:text-8xl lg:text-9xl font-extrabold leading-[1.02] tracking-tight mb-4"
                >
                    <span
                        className="block"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 40%, #00D4FF 70%, #8B3AF7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Rise
                    </span>
                    <span
                        className="block"
                        style={{
                            background: 'linear-gradient(135deg, #8B3AF7 0%, #C026D3 50%, #00D4FF 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        & Reward
                    </span>
                </motion.h1>

                {/* Slogan */}
                <motion.p
                    custom={2}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed mb-12"
                >
                    Où l&apos;évolution personnelle et le bon temps entre amis se <span className="text-white/80 font-medium">rejoignent.</span>
                </motion.p>

                {/* CTA buttons */}
                <motion.div
                    custom={3}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col sm:flex-row gap-4 items-center justify-center"
                >
                    {/* Primary — Se connecter */}
                    <Link
                        href="/fr/login"
                        className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all duration-300 glow-cyan"
                    >
                        Se connecter
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>

                    {/* Secondary — Créer un compte */}
                    <Link
                        href="/fr/signup"
                        className="group relative flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base text-white border border-white/10 hover:border-brand-violet/50 hover:bg-brand-violet/10 transition-all duration-300"
                    >
                        <span
                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                                background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(139,58,247,0.15), transparent)',
                            }}
                        />
                        <span className="relative z-10">Créer un compte</span>
                    </Link>
                </motion.div>

                {/* Social proof pill */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="mt-14 inline-flex items-center gap-4 glass rounded-2xl px-6 py-3.5 border border-white/5"
                >
                    <div className="flex -space-x-2.5">
                        {['#22d3ee', '#7c3aed', '#a855f7', '#ec4899', '#f59e0b'].map((color, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full border-2 border-brand-black flex items-center justify-center text-xs font-bold text-brand-black"
                                style={{ backgroundColor: color }}
                            >
                                {String.fromCharCode(65 + i)}
                            </div>
                        ))}
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-white/35 font-medium">Rejoins des groupes actifs</p>
                        <p className="text-sm text-white/80 font-semibold">Déjà des centaines de défis lancés</p>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-xs text-white/20 font-medium tracking-widest uppercase">Découvrir</span>
                <motion.div
                    animate={{ y: [0, 7, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-px h-8 bg-gradient-to-b from-brand-cyan/40 to-transparent"
                />
            </motion.div>
        </section>
    );
}
