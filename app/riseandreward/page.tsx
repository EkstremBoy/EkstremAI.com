import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import RnRHero from '@/components/riseandreward/RnRHero';
import RnRHowItWorks from '@/components/riseandreward/RnRHowItWorks';
import RnRReassurance from '@/components/riseandreward/RnRReassurance';
import RnRCalendarPreview from '@/components/riseandreward/RnRCalendarPreview';
import RnRFooterCTA from '@/components/riseandreward/RnRFooterCTA';
import RnRDashboard from '@/components/riseandreward/RnRDashboard';

export const metadata: Metadata = {
    title: 'Rise & Reward — EkstremAI',
    description:
        'Où l\'évolution personnelle et le bon temps entre amis se rejoignent. Créez des défis de groupe avec pénalités financières et récompenses collectives.',
    openGraph: {
        title: 'Rise & Reward — EkstremAI',
        description: 'Lancez des défis entre amis, gérez vos amendes et célébrez ensemble.',
        url: 'https://ekstrem.ai/riseandreward',
    },
};

export default async function RiseAndRewardPage() {
    const supabase = await createClient();

    // 1. Vérifier l'état de connexion
    const { data: { user } } = await supabase.auth.getUser();

    // ─── Cas A : Non connecté ─────────────────────────────────
    if (!user) {
        return (
            <main className="relative bg-[#030712] text-[#f0f9ff] font-jakarta overflow-x-hidden">
                <RnRNavbar />
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
                <RnRNavbar />
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
            <RnRNavbar />
            <RnRDashboard />
        </main>
    );
}
