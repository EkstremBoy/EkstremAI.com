'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, HandCoins, Users } from 'lucide-react';

const highlights = [
    { icon: ShieldCheck, label: 'Zéro frais cachés', color: '#00D4FF' },
    { icon: HandCoins, label: 'Zéro transaction sur le site', color: '#8B3AF7' },
    { icon: Users, label: 'Votre groupe, vos règles', color: '#C026D3' },
];

export default function RnRReassurance() {
    return (
        <section id="transparence" className="relative section-padding overflow-hidden">
            {/* Background */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)',
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(0,212,255,0.12)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    {/* Inner glows */}
                    <div
                        aria-hidden
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{
                            background:
                                'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,212,255,0.07), transparent)',
                        }}
                    />
                    <div
                        aria-hidden
                        className="absolute bottom-0 right-0 w-full h-full pointer-events-none"
                        style={{
                            background:
                                'radial-gradient(ellipse 60% 40% at 100% 100%, rgba(139,58,247,0.06), transparent)',
                        }}
                    />

                    {/* Badge */}
                    <div className="relative z-10 flex justify-center mb-8">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.18em] uppercase border border-brand-cyan/25 text-brand-cyan/80">
                            <ShieldCheck size={13} />
                            Transparence totale
                        </span>
                    </div>

                    {/* Main message */}
                    <div className="relative z-10 text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-6">
                            Votre argent reste{' '}
                            <span
                                style={{
                                    background: 'linear-gradient(135deg, #00D4FF, #8B3AF7)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                entre vos mains.
                            </span>
                        </h2>
                        <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                            Vous gérez votre cagnotte entre amis via{' '}
                            <strong className="text-white/85 font-semibold">virement Interac</strong> ou{' '}
                            <strong className="text-white/85 font-semibold">argent comptant</strong>.
                            Nous fournissons uniquement la plateforme de suivi — le reste vous appartient.
                        </p>
                    </div>

                    {/* 3 highlight pills */}
                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
                        {highlights.map(({ icon: Icon, label, color }) => (
                            <div
                                key={label}
                                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl flex-1 sm:flex-none justify-center"
                                style={{
                                    background: `${color}0D`,
                                    border: `1px solid ${color}22`,
                                }}
                            >
                                <Icon size={18} style={{ color }} />
                                <span className="text-sm font-semibold text-white/80">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Decorative corner accents */}
                    <div
                        aria-hidden
                        className="absolute top-0 left-0 w-24 h-24 pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, transparent 60%)',
                            borderRadius: '0 0 100% 0',
                        }}
                    />
                    <div
                        aria-hidden
                        className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
                        style={{
                            background: 'linear-gradient(315deg, rgba(139,58,247,0.12) 0%, transparent 60%)',
                            borderRadius: '100% 0 0 0',
                        }}
                    />
                </motion.div>
            </div>
        </section>
    );
}
