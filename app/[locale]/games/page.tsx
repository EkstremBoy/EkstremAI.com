'use client';

import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowRight, Dices, Trophy, Snowflake, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

type Categorie = 'educational' | 'arcade' | 'puzzle' | 'tech';

type Jeu = {
    id: string;
    category: Categorie;
    icon: typeof Gamepad2;
    /* Un jeu écrit en React vit sous /[locale]/games/... et se navigue sans
       rechargement. Un jeu autonome est un fichier statique servi HORS du
       préfixe de langue : il lui faut un lien direct, pas une route localisée. */
    href: string;
    external?: boolean;
    status: 'active' | 'soon';
    tags: string[];
};

const JEUX: Jeu[] = [
    {
        id: 'alpineschool',
        category: 'educational',
        icon: Snowflake,
        href: '/games/alpineschool/',
        external: true,
        status: 'active',
        tags: ['Three.js', 'WebGL', 'Audio synthétisé', 'Zéro dépendance', 'Bilingue']
    },
    {
        id: 'snake',
        category: 'arcade',
        icon: Gamepad2,
        href: '/games/snake',
        status: 'active',
        tags: ['React', 'Canvas 2D', 'Temps réel']
    },
    {
        id: 'coming_soon',
        category: 'puzzle',
        icon: Dices,
        href: '#',
        status: 'soon',
        tags: []
    }
];

/* L'ordre des rubriques. Une rubrique sans jeu ne s'affiche pas : une section
   vide donne l'impression d'un site inachevé. */
const ORDRE: Categorie[] = ['educational', 'arcade', 'puzzle', 'tech'];

export default function GamesHubPage() {
    const t = useTranslations('games');
    const locale = useLocale();

    const lien = (jeu: Jeu) => (jeu.external ? jeu.href : `/${locale}${jeu.href}`);

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
                        <Trophy size={14} /> {t('eyebrow')}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight italic">
                        {t('title')}
                    </h1>
                    <p className="text-white/40 text-xl max-w-2xl mx-auto leading-relaxed">
                        {t('subtitle')}
                    </p>
                </motion.div>

                {ORDRE.map((cat) => {
                    const dedans = JEUX.filter((j) => j.category === cat);
                    if (dedans.length === 0) return null;

                    return (
                        <section key={cat} className="mb-20">
                            <div className="flex items-baseline gap-4 mb-8">
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    {t(`category.${cat}`)}
                                </h2>
                                <span className="h-px flex-1 bg-white/10" />
                                <span className="text-white/30 text-xs font-bold uppercase tracking-widest">
                                    {dedans.length}
                                </span>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {dedans.map((jeu, idx) => (
                                    <motion.div
                                        key={jeu.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-80px' }}
                                        transition={{ delay: idx * 0.12 }}
                                    >
                                        <Link
                                            href={lien(jeu)}
                                            {...(jeu.external ? { target: '_blank', rel: 'noopener' } : {})}
                                            className={`group relative flex h-full flex-col p-8 glass rounded-3xl border border-white/5 hover:border-brand-cyan/30 transition-all overflow-hidden ${jeu.status === 'soon' ? 'grayscale opacity-60 pointer-events-none' : ''}`}
                                        >
                                            <div className="relative z-10 flex h-full flex-col">
                                                <div className={`p-4 rounded-2xl ${jeu.status === 'active' ? 'bg-brand-cyan/10 border-brand-cyan/20' : 'bg-white/5 border-white/10'} border w-fit mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                                    <jeu.icon className={jeu.status === 'active' ? 'text-brand-cyan' : 'text-white/40'} size={32} />
                                                </div>

                                                <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-brand-cyan transition-colors">
                                                    {t(`${jeu.id}.title`)}
                                                </h3>
                                                <p className="text-white/40 text-lg mb-6 leading-relaxed max-w-md">
                                                    {t(`${jeu.id}.description`)}
                                                </p>

                                                {/* Les étiquettes techniques : c'est ce qu'un employeur lit
                                                    en premier, avant même de lancer le jeu. */}
                                                {jeu.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-8">
                                                        {jeu.tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[11px] font-semibold tracking-wide"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-auto">
                                                    {jeu.status === 'active' ? (
                                                        <div className="flex items-center gap-2 text-brand-cyan font-bold group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                                                            {t('cta')}
                                                            {jeu.external ? <ExternalLink size={16} /> : <ArrowRight size={18} />}
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                                                            {t('forging')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hover effects */}
                                            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-brand-cyan/5 rounded-full blur-[64px] group-hover:bg-brand-cyan/20 transition-all duration-700 pointer-events-none" />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            <Footer />
        </main>
    );
}
