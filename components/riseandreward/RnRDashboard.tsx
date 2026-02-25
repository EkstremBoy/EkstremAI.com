'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
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
    const t = useTranslations('riseandreward.dashboard');
    const locale = useLocale();

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
                        {t('welcome')},{' '}
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
                        {challenges.length} {challenges.length > 1 ? t('active_challenges') : t('active_challenge')}
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
                        { icon: <Trophy size={18} className="text-brand-cyan" />, label: t('stats.active'), value: challenges.length },
                        { icon: <CheckCircle size={18} className="text-green-400" />, label: t('stats.completed'), value: '—' },
                        { icon: <TrendingUp size={18} className="text-brand-violet-light" />, label: t('stats.streak'), value: '—' },
                        { icon: <Users size={18} className="text-brand-cyan" />, label: t('stats.members'), value: '—' },
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
                        <h2 className="text-lg font-bold text-white">{t('my_challenges')}</h2>
                        <Link
                            href="/riseandreward/nouveau"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all glow-cyan"
                        >
                            <Plus size={13} />
                            {t('new_challenge')}
                        </Link>
                    </div>

                    <div className="flex flex-col gap-4">
                        {challenges.map((cm, i) => {
                            const c = cm.challenges;
                            return (
                                <Link
                                    key={cm.challenge_id}
                                    href={`/riseandreward/${cm.challenge_id}`}
                                    className="block"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                                        className="glass rounded-3xl p-8 border border-white/8 hover:border-brand-cyan/40 hover:bg-brand-cyan/5 transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between relative z-10">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-violet/15 text-brand-violet-light border border-brand-violet/20 uppercase tracking-wider">
                                                        {c.challenge_type === 'collective' ? t('type_collective') : t('type_individual')}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-400/80 uppercase tracking-wider">
                                                        <Clock size={10} />
                                                        {t('status_ongoing')}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-brand-cyan transition-colors">{c.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/40">
                                                    <span className="flex items-center gap-1.5 font-medium">
                                                        <CalendarDays size={14} />
                                                        {t('since')} {new Date(c.created_at).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US')}
                                                    </span>
                                                    <span className="font-semibold text-white/60">
                                                        {c.penalty_amount}$ <span className="text-white/20 font-medium">/ {t('view') === 'Voir' ? 'échec' : 'fail'}</span>
                                                        <span className="mx-2 text-white/10">•</span>
                                                        {t('view') === 'Voir' ? 'Objectif' : 'Goal'} {c.goal_amount}$
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-brand-cyan/20 group-hover:text-brand-cyan text-white/20 transition-all self-center">
                                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>

                                        {/* Hover decoration */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </motion.div>
                                </Link>
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
                        {t('coming_soon')}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
