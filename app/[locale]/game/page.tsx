'use client';

import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowRight, Dices, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function GameHubPage() {
    const t = useTranslations('game');
    const locale = useLocale();

    const games = [
        {
            id: 'snake',
            title: t('snake.title'),
            description: t('snake.description'),
            icon: Gamepad2,
            href: `/${locale}/game/snake`,
            status: 'active',
            color: 'brand-cyan'
        },
        {
            id: 'coming-soon',
            title: t('coming_soon.title'),
            description: t('coming_soon.description'),
            icon: Dices,
            href: '#',
            status: 'soon',
            color: 'white/20'
        }
    ];

    return (
        <main className="min-h-screen relative bg-brand-black overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-cyan/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none" />

            <Navbar />

            <div className="max-w-6xl mx-auto pt-40 pb-20 px-6 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-bold uppercase tracking-widest mb-6">
                        <Trophy size={14} /> Arcades Expérimentales
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight italic">
                        {t('title')}
                    </h1>
                    <p className="text-white/40 text-xl max-w-2xl mx-auto leading-relaxed">
                        {t('subtitle')}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8">
                    {games.map((game, idx) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.2 }}
                        >
                            <Link
                                href={game.href}
                                className={`group relative block p-8 glass rounded-3xl border border-white/5 hover:border-${game.color === 'brand-cyan' ? 'brand-cyan' : 'white'}/30 transition-all overflow-hidden ${game.status === 'soon' ? 'grayscale opacity-60' : ''}`}
                            >
                                <div className="relative z-10">
                                    <div className={`p-4 rounded-2xl ${game.status === 'active' ? 'bg-brand-cyan/10 border-brand-cyan/20' : 'bg-white/5 border-white/10'} border w-fit mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                        <game.icon className={game.status === 'active' ? 'text-brand-cyan' : 'text-white/40'} size={32} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-brand-cyan transition-colors">
                                        {game.title}
                                    </h3>
                                    <p className="text-white/40 text-lg mb-10 leading-relaxed max-w-md">
                                        {game.description}
                                    </p>

                                    {game.status === 'active' ? (
                                        <div className="flex items-center gap-2 text-brand-cyan font-bold group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                                            {t('snake.cta')} <ArrowRight size={18} />
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                                            Forge en cours...
                                        </div>
                                    )}
                                </div>

                                {/* Hover effects */}
                                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-brand-cyan/5 rounded-full blur-[64px] group-hover:bg-brand-cyan/20 transition-all duration-700 pointer-events-none" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            <Footer />
        </main>
    );
}
