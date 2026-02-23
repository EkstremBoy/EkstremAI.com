import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Trophy, Users, Zap, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';

interface Props {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: 'Rise & Reward — Dashboard | EkstremAI',
        alternates: { canonical: `/${locale}/dashboard/rise-reward` },
    };
}

export default async function RiseRewardDashboard({ params }: Props) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/login`);
    }

    const t = await getTranslations('dashboard');

    const stats = [
        { icon: <Trophy className="text-brand-cyan" size={20} />, label: 'Points', value: '—' },
        { icon: <Users className="text-brand-violet-light" size={20} />, label: 'Équipe', value: '—' },
        { icon: <Zap className="text-brand-cyan" size={20} />, label: 'Streak', value: '—' },
        { icon: <TrendingUp className="text-brand-violet-light" size={20} />, label: 'Rang', value: '—' },
    ];

    return (
        <div className="min-h-screen animated-bg px-6 py-16">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <p className="text-sm text-brand-cyan font-semibold mb-1">
                        {t('welcome')}, {user.email}
                    </p>
                    <h1 className="text-4xl font-extrabold text-white">{t('title')}</h1>
                    <p className="text-white/40 mt-2">{t('subtitle')}</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {stats.map((stat) => (
                        <div key={stat.label} className="glass rounded-2xl p-5 border border-white/8 flex flex-col gap-2">
                            {stat.icon}
                            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                            <p className="text-xs text-white/40 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Coming soon banner */}
                <div className="glass rounded-3xl p-10 border border-dashed border-white/10 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-brand-violet/20 mb-5">
                        <Zap size={26} className="text-brand-cyan" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{t('comingSoon')}</h2>
                    <p className="text-sm text-white/30">Les fonctionnalités de gamification sont en cours de développement et seront disponibles très prochainement.</p>
                </div>
            </div>
        </div>
    );
}
