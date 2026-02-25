import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import RnRHero from '@/components/riseandreward/RnRHero';
import RnRHowItWorks from '@/components/riseandreward/RnRHowItWorks';
import RnRReassurance from '@/components/riseandreward/RnRReassurance';
import RnRCalendarPreview from '@/components/riseandreward/RnRCalendarPreview';
import RnRFooterCTA from '@/components/riseandreward/RnRFooterCTA';
import RnRDashboard from '@/components/riseandreward/RnRDashboard';

import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'riseandreward.meta' });
    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: 'https://ekstrem.ai/riseandreward',
        },
    };
}

export default async function RiseAndRewardPage({ params }: { params: Promise<{ locale: string }> }) {
    await params; // Accessing params even if not used to satisfy Next.js 15 requirements
    const supabase = await createClient();

    // 1. Vérifier l'état de connexion
    const { data: { user } } = await supabase.auth.getUser();

    // ─── Cas A : Non connecté ─────────────────────────────────
    if (!user) {
        return (
            <main className="relative bg-[#030712] text-[#f0f9ff] font-jakarta overflow-x-hidden">
                <RnRHero ctaMode="guest" />
                <RnRHowItWorks />
                <RnRReassurance />
                <RnRCalendarPreview />
                <RnRFooterCTA />
            </main>
        );
    }

    // 2. Connecté — compter le nombre de défis
    const { count } = await supabase
        .from('challenge_members')
        .select('challenge_id', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const challengeCount = count ?? 0;

    // ─── Cas B : Connecté, 0 défi ────────────────────────────
    if (challengeCount === 0) {
        return (
            <main className="relative bg-[#030712] text-[#f0f9ff] font-jakarta overflow-x-hidden">
                <RnRHero ctaMode="new-user" />
                <RnRHowItWorks />
                <RnRReassurance />
                <RnRCalendarPreview />
                <RnRFooterCTA />
            </main>
        );
    }

    // ─── Cas C : Connecté, >= 1 défi → Dashboard ─────────────
    return (
        <main className="relative bg-[#030712] text-[#f0f9ff] font-jakarta overflow-x-hidden">
            <RnRDashboard />
        </main>
    );
}
