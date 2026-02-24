'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Trophy, Users, CalendarDays, ArrowRight,
    TrendingUp, CheckCircle, Clock, Plus
} from 'lucide-react';

interface Challenge {
    challenge_id: string;
    challenges: {
        id: string;
        name: string;
        challenge_type: string;
        penalty_amount: number;
        goal_amount: number;
        created_at: string;
    };
}

export default function RnRDashboard() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [firstName, setFirstName] = useState('');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setFirstName(user.user_metadata?.first_name ?? user.email?.split('@')[0] ?? '');

            const { data } = await supabase
                .from('challenge_members')
                .select('challenge_id, challenges(*)')
                .eq('user_id', user.id);

            setChallenges((data as unknown as Challenge[]) ?? []);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-6">
            {/* Background */}
            <div
                aria-hidden
                className="fixed inset-0 pointer-events-none -z-10"
                style={{
                    background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(139,58,247,0.2) 0%, transparent 60%), #030712',
                }}
            />

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <p className="text-sm text-brand-cyan font-semibold mb-1">
                        Bon retour,{' '}
                        <span className="text-white">{firstName} 👋</span>
                    </p>
                    <h1 className="text-4xl font-extrabold text-white">
                        Rise{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #8B3AF7, #00D4FF)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            &amp; Reward
                        </span>
                    </h1>
                    <p className="text-white/40 mt-1 text-sm">
                        {challenges.length} défi{challenges.length > 1 ? 's' : ''} actif{challenges.length > 1 ? 's' : ''}
                    </p>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
                >
                    {[
                        { icon: <Trophy size={18} className="text-brand-cyan" />, label: 'Défis actifs', value: challenges.length },
                        { icon: <CheckCircle size={18} className="text-green-400" />, label: 'Complétés', value: '—' },
                        { icon: <TrendingUp size={18} className="text-brand-violet-light" />, label: 'Streak actuel', value: '—' },
                        { icon: <Users size={18} className="text-brand-cyan" />, label: 'Co-membres', value: '—' },
                    ].map((stat) => (
                        <div key={stat.label} className="glass rounded-2xl p-5 border border-white/8 flex flex-col gap-2">
                            {stat.icon}
                            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                            <p className="text-xs text-white/40 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Challenges list */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-white">Mes défis</h2>
                        <Link
                            href="/riseandreward/nouveau"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all glow-cyan"
                        >
                            <Plus size={13} />
                            Nouveau défi
                        </Link>
                    </div>

                    <div className="flex flex-col gap-4">
                        {challenges.map((cm, i) => {
                            const c = cm.challenges;
                            return (
                                <motion.div
                                    key={cm.challenge_id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                                    className="glass rounded-2xl p-6 border border-white/8 hover:border-brand-violet/30 transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-violet/15 text-brand-violet-light border border-brand-violet/20">
                                                    {c.challenge_type === 'collective' ? 'Collectif' : 'Individuel'}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-green-400/80">
                                                    <Clock size={11} />
                                                    En cours
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1">{c.name}</h3>
                                            <div className="flex items-center gap-4 text-xs text-white/40">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays size={11} />
                                                    Depuis {new Date(c.created_at).toLocaleDateString('fr-CA')}
                                                </span>
                                                <span>{c.penalty_amount}$/échec · Cagnotte {c.goal_amount}$</span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/riseandreward/nouveau`}
                                            className="flex items-center gap-1 text-xs text-white/40 hover:text-brand-cyan transition-colors group-hover:text-white/70 mt-1"
                                        >
                                            Voir
                                            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Coming soon banner */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-8 glass rounded-2xl p-6 border border-dashed border-white/8 text-center"
                >
                    <p className="text-white/20 text-sm">
                        ✦ Calendrier de groupe, chat et classement — bientôt disponibles
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
