'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Target, AlertTriangle, PartyPopper } from 'lucide-react';

const steps: { number: string; icon: React.ElementType; title: string; description: ReactNode; color: string; glow: string; border: string }[] = [
    {
        number: '01',
        icon: Target,
        title: 'Fixez un but quotidien',
        description: (
            <>
                <strong className="text-white/75">Défi collectif</strong> — tout le monde relève le même challenge.<br />
                <strong className="text-white/75">Défi individuel</strong> — chaque membre inscrit son propre objectif personnel.<br />
                Dans les deux cas, l&apos;engagement est quotidien et la récompense est du plaisir en bonne compagnie.
            </>
        ),
        color: '#00D4FF',
        glow: 'rgba(0,212,255,0.2)',
        border: 'rgba(0,212,255,0.15)',
    },
    {
        number: '02',
        icon: AlertTriangle,
        title: 'Payez l\'amende en cas d\'échec',
        description: 'Vous n\'avez pas validé votre défi du jour ? Une pénalité fixée à l\'avance par le groupe s\'applique et alimente la cagnotte commune.',
        color: '#C026D3',
        glow: 'rgba(192,38,211,0.2)',
        border: 'rgba(192,38,211,0.15)',
    },
    {
        number: '03',
        icon: PartyPopper,
        title: 'Célébrez ensemble',
        description: 'Quand la cagnotte atteint le montant préétabli pour votre récompense — souper, activité, voyage — il ne vous reste qu\'à choisir la date avec notre calendrier interactif, puis à célébrer votre progression.',
        color: '#8B3AF7',
        glow: 'rgba(139,58,247,0.2)',
        border: 'rgba(139,58,247,0.15)',
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.18, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

export default function RnRHowItWorks() {
    return (
        <section id="comment-ca-marche" className="relative section-padding overflow-hidden">
            {/* Background glow */}
            <div
                aria-hidden
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,58,247,0.08), transparent)' }}
            />

            <div className="relative z-10 max-w-6xl mx-auto px-6">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-center mb-16"
                >
                    <p className="text-sm font-semibold tracking-[0.2em] uppercase text-brand-cyan/70 mb-3">
                        Comment ça marche
                    </p>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                        Simple,{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #C026D3, #8B3AF7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            motivant,
                        </span>{' '}
                        efficace.
                    </h2>
                    <p className="mt-4 text-white/45 text-lg max-w-xl mx-auto">
                        Trois étapes pour transformer vos habitudes en victoires collectives.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={step.number}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: '-40px' }}
                                whileHover={{ y: -6, scale: 1.01 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                                className="relative group rounded-3xl p-8 cursor-default"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${step.border}`,
                                    backdropFilter: 'blur(12px)',
                                }}
                            >
                                {/* Hover glow overlay */}
                                <div
                                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{ background: `radial-gradient(ellipse 70% 50% at 50% 100%, ${step.glow}, transparent)` }}
                                />

                                {/* Step number */}
                                <div className="flex items-start justify-between mb-6">
                                    <span
                                        className="text-6xl font-black leading-none select-none"
                                        style={{ color: `${step.color}15` }}
                                    >
                                        {step.number}
                                    </span>
                                    <div
                                        className="flex items-center justify-center w-12 h-12 rounded-2xl"
                                        style={{
                                            background: `${step.color}15`,
                                            border: `1px solid ${step.color}30`,
                                            boxShadow: `0 0 20px ${step.glow}`,
                                        }}
                                    >
                                        <Icon size={22} style={{ color: step.color }} />
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-white mb-3 leading-snug">
                                    {step.title}
                                </h3>
                                <div className="text-white/50 text-sm leading-relaxed">
                                    {step.description}
                                </div>

                                {/* Bottom accent line */}
                                <div
                                    className="absolute bottom-0 left-8 right-8 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{ background: `linear-gradient(90deg, transparent, ${step.color}60, transparent)` }}
                                />
                            </motion.div>
                        );
                    })}
                </div>

                {/* Connector lines (desktop) */}
                <div className="hidden md:flex items-center justify-center gap-0 mt-4 -translate-y-[calc(50%+2rem)] pointer-events-none" aria-hidden>
                    {/* decorative arrows between cards — purely visual, kept minimal */}
                </div>
            </div>
        </section>
    );
}
