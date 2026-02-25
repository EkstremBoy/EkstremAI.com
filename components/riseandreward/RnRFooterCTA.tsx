'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function RnRFooterCTA() {
    const t = useTranslations('riseandreward.footer_cta');
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
                        <Sparkles size={28} className="text-brand-violet-light" />
                    </div>

                    <div className="relative z-10 text-center max-w-4xl mx-auto py-16 md:py-24 px-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex p-3 rounded-2xl bg-brand-cyan/10 text-brand-cyan mb-8"
                        >
                            <Sparkles size={28} />
                        </motion.div>

                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-[1.1]">
                            {t('title')}
                        </h2>

                        <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
                            {t('subtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                href="/signup"
                                className="group flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all duration-300 glow-cyan"
                            >
                                {t('cta_free')}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/login"
                                className="group flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg text-white border border-white/10 hover:bg-white/5 transition-all duration-300"
                            >
                                <LogIn size={20} />
                                {t('cta_login')}
                            </Link>
                        </div>

                        <div className="mt-16 pt-8 border-t border-white/5">
                            <Link
                                href="/"
                                className="text-sm font-medium text-white/30 hover:text-brand-cyan transition-colors"
                            >
                                ← {t('back_to_site')}
                            </Link>
                        </div>
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
                        <Link href="/" className="hover:text-white/50 transition-colors">{t('back_to_site')}</Link>
                        <Link href="/login" className="hover:text-white/50 transition-colors">{t('cta_login')}</Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
