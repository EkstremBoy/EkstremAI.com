'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';

export default function RnRFooterCTA() {
    return (
        <section className="relative section-padding overflow-hidden">
            {/* Background */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(139,58,247,0.2) 0%, transparent 65%)',
                }}
            />

            {/* Top border line */}
            <div
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(139,58,247,0.4), rgba(0,212,255,0.4), transparent)',
                }}
            />

            <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.65 }}
                >
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-8"
                        style={{
                            background: 'linear-gradient(135deg, rgba(139,58,247,0.25), rgba(0,212,255,0.15))',
                            border: '1px solid rgba(139,58,247,0.25)',
                        }}
                    >
                        <Flame size={28} className="text-brand-violet-light" />
                    </div>

                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
                        Prêt à{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #C026D3, #8B3AF7, #00D4FF)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            relever le défi ?
                        </span>
                    </h2>

                    <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
                        Créez votre premier groupe en moins de 2 minutes. Gratuit. Sans frais cachés. Juste vous et votre gang.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/fr/signup"
                            className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all duration-300 glow-cyan"
                        >
                            Créer un compte gratuit
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                        </Link>

                        <Link
                            href="/fr/login"
                            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300"
                        >
                            Se connecter
                        </Link>
                    </div>
                </motion.div>

                {/* Footer links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25"
                >
                    <span>© 2026 EkstremAI — Rise & Reward</span>
                    <div className="flex gap-5">
                        <Link href="/" className="hover:text-white/50 transition-colors">Retour au site principal</Link>
                        <Link href="/fr/login" className="hover:text-white/50 transition-colors">Connexion</Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
