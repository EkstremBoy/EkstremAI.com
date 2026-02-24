import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import RnRCreateChallenge from '@/components/riseandreward/RnRCreateChallenge';

export const metadata: Metadata = {
    title: 'Nouveau défi — Rise & Reward',
};

export default async function NouveauDefiPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/fr/login');
    }

    return (
        <main className="relative bg-[#030712] text-[#f0f9ff] font-jakarta min-h-screen overflow-x-hidden">
            <RnRNavbar />
            <RnRCreateChallenge />
        </main>
    );
}
