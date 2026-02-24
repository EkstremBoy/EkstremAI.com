'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, Database, Trophy, Users, Zap } from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

export default function ProjectsSection() {
    const t = useTranslations('projects');
    const locale = useLocale();

    return (
        <section id="projets" className="section-padding relative">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    className="text-center mb-16"
                >
                    <span className="text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-4 block">
                        {t('title')}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                        {t('subtitle')}
                    </h2>
                </motion.div>

                {/* Rise & Reward card — featured */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="relative max-w-4xl mx-auto"
                >
                    {/* Glow behind card */}
                    <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-brand-cyan/20 via-brand-violet/20 to-brand-cyan/10 blur-xl opacity-60" />

                    <div className="relative glass rounded-3xl p-8 md:p-12 border border-brand-glass-border overflow-hidden glass-hover group">
                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent" />

                        <div className="flex flex-col md:flex-row gap-10 items-start">
                            {/* Left: Content */}
                            <div className="flex-1">
                                {/* Badge */}
                                <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-cyan/80 border border-brand-cyan/20 rounded-full px-3 py-1.5 mb-5 bg-brand-cyan/5">
                                    <Zap size={11} />
                                    {t('rr.badge')}
                                </span>

                                <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                                    {t('rr.title')}
                                </h3>

                                <p className="text-white/50 text-base leading-relaxed mb-8 max-w-lg">
                                    {t('rr.description')}
                                </p>

                                {/* Feature list */}
                                <motion.ul variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-wrap gap-3 mb-8">
                                    {[
                                        { icon: <Trophy size={14} />, label: 'Gamification' },
                                        { icon: <Users size={14} />, label: 'Collectif' },
                                        { icon: <Database size={14} />, label: 'Supabase' },
                                        { icon: <Zap size={14} />, label: 'Temps réel' },
                                    ].map((feat) => (
                                        <motion.li
                                            key={feat.label}
                                            variants={fadeUp}
                                            className="flex items-center gap-2 text-xs font-medium text-white/60 glass rounded-full px-3 py-1.5"
                                        >
                                            <span className="text-brand-cyan">{feat.icon}</span>
                                            {feat.label}
                                        </motion.li>
                                    ))}
                                </motion.ul>

                                <Link
                                    href="/riseandreward"
                                    className="group/btn inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-cyan text-brand-black font-semibold text-sm hover:bg-brand-cyan/90 transition-all duration-200 glow-cyan"
                                >
                                    {t('rr.cta')}
                                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            {/* Right: Visual */}
                            <div className="flex-shrink-0 w-full md:w-64">
                                <div className="relative">
                                    {/* Mock UI card */}
                                    <div className="rounded-2xl bg-gradient-to-br from-brand-navy to-brand-black border border-white/5 p-5 space-y-3">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-semibold text-white/40">Classement</span>
                                            <span className="text-xs text-brand-cyan font-medium">Cette semaine</span>
                                        </div>
                                        {[
                                            { rank: 1, name: 'Alex M.', pts: 2840, color: '#22d3ee' },
                                            { rank: 2, name: 'Sofia K.', pts: 2650, color: '#a855f7' },
                                            { rank: 3, name: 'Lucas P.', pts: 2410, color: '#7c3aed' },
                                        ].map((user) => (
                                            <div key={user.rank} className="flex items-center gap-3 py-2 border-b border-white/5">
                                                <span className="text-xs font-bold w-5" style={{ color: user.color }}>#{user.rank}</span>
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: user.color + '30', border: `1px solid ${user.color}40` }}>
                                                    {user.name[0]}
                                                </div>
                                                <span className="flex-1 text-xs font-medium text-white/70">{user.name}</span>
                                                <span className="text-xs font-bold" style={{ color: user.color }}>{user.pts.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="pt-2 flex items-center justify-center">
                                            <div className="h-1 rounded-full flex overflow-hidden w-full gap-1">
                                                <div className="flex-[3] bg-brand-cyan/60 rounded-full" />
                                                <div className="flex-[2] bg-brand-violet/60 rounded-full" />
                                                <div className="flex-[2] bg-brand-violet-light/40 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Glow under mock */}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-brand-cyan/20 blur-2xl rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* "Coming soon" placeholder for future projects */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="mt-8 max-w-4xl mx-auto"
                >
                    <div className="glass rounded-2xl p-6 border border-dashed border-white/10 flex items-center justify-center">
                        <p className="text-white/20 text-sm font-medium">✦ Nouveaux projets en cours de développement</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
