import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import RnRCreateChallenge from '@/components/riseandreward/RnRCreateChallenge';

export const metadata: Metadata = {
    title: 'Nouveau défi — Rise & Reward',
};

export default async function NouveauDefiPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/login`);
    }

    return (
        <main className="bg-[#030712]">
            <RnRNavbar minimal />
            <RnRCreateChallenge />
        </main>
    );
}
