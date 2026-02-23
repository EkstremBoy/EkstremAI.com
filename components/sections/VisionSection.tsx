'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Minimize2, Zap, Gem } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const pillars = [
    {
        key: 'simplicity' as const,
        icon: <Minimize2 size={24} />,
        gradient: 'from-brand-cyan/20 to-brand-blue/10',
        iconColor: 'text-brand-cyan',
        borderHover: 'group-hover:border-brand-cyan/30',
    },
    {
        key: 'impact' as const,
        icon: <Zap size={24} />,
        gradient: 'from-brand-violet/20 to-brand-navy/10',
        iconColor: 'text-brand-violet-light',
        borderHover: 'group-hover:border-brand-violet/30',
    },
    {
        key: 'aesthetics' as const,
        icon: <Gem size={24} />,
        gradient: 'from-brand-cyan/10 to-brand-violet/20',
        iconColor: 'text-brand-violet-light',
        borderHover: 'group-hover:border-white/20',
    },
];

export default function VisionSection() {
    const t = useTranslations('vision');

    return (
        <section id="vision" className="section-padding relative overflow-hidden">
            {/* Background orb */}
            <div
                aria-hidden
                className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-brand-violet/8 blur-[120px] pointer-events-none"
            />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    className="text-center mb-16"
                >
                    <span className="text-brand-violet-light text-sm font-semibold tracking-widest uppercase mb-4 block">
                        {t('title')}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                        {t('subtitle')}
                    </h2>
                </motion.div>

                {/* Quote block */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="max-w-3xl mx-auto mb-20 text-center"
                >
                    <div className="relative glass rounded-3xl px-8 md:px-14 py-10 border border-brand-violet/20">
                        {/* Top accent */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-brand-violet/60 to-transparent" />

                        {/* Quote marks */}
                        <span
                            aria-hidden
                            className="absolute top-6 left-8 text-6xl font-black text-brand-violet/20 leading-none select-none"
                        >
                            "
                        </span>

                        <p className="text-xl md:text-2xl font-medium text-white/80 leading-relaxed italic relative z-10">
                            {t('quote')}
                        </p>
                        <p className="mt-5 text-sm text-brand-violet-light font-semibold tracking-wider">
                            — {t('quoteAuthor')}
                        </p>
                    </div>
                </motion.div>

                {/* Pillars grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pillars.map((pillar, i) => (
                        <motion.div
                            key={pillar.key}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ delay: i * 0.12 }}
                            className={`group relative glass rounded-2xl p-8 border border-white/8 transition-all duration-300 glass-hover ${pillar.borderHover}`}
                        >
                            {/* Gradient sheen on hover */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${pillar.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl glass mb-5 ${pillar.iconColor}`}>
                                    {pillar.icon}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3">
                                    {t(`pillars.${pillar.key}.title`)}
                                </h3>
                                <p className="text-sm text-white/50 leading-relaxed">
                                    {t(`pillars.${pillar.key}.desc`)}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
