import type { Metadata } from 'next';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import RnRHero from '@/components/riseandreward/RnRHero';
import RnRHowItWorks from '@/components/riseandreward/RnRHowItWorks';
import RnRReassurance from '@/components/riseandreward/RnRReassurance';
import RnRCalendarPreview from '@/components/riseandreward/RnRCalendarPreview';
import RnRFooterCTA from '@/components/riseandreward/RnRFooterCTA';

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

export default function RiseAndRewardPage() {
    return (
        <main className="relative bg-[#030712] text-[#f0f9ff] font-jakarta overflow-x-hidden">
            <RnRNavbar />
            <RnRHero />
            <RnRHowItWorks />
            <RnRReassurance />
            <RnRCalendarPreview />
            <RnRFooterCTA />
        </main>
    );
}
