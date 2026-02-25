import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import RnRChallengeDetails from '@/components/riseandreward/RnRChallengeDetails';

export default async function ChallengeDetailsPage({
    params
}: {
    params: Promise<{ locale: string; id: string }>
}) {
    const { id, locale } = await params;
    const supabase = await createClient();

    // 1. Fetch Challenge basic info
    const { data: challenge, error: cError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

    if (cError || !challenge) {
        return notFound();
    }

    // 2. Fetch Members and their profiles
    const { data: members, error: mError } = await supabase
        .from('challenge_members')
        .select(`
            *,
            profiles (
                id,
                username,
                first_name,
                color
            )
        `)
        .eq('challenge_id', id)
        .order('joined_at', { ascending: true });

    if (mError) {
        console.error('Error fetching members:', mError);
    }

    // 3. Fetch all daily logs to calculate streaks and badges
    const { data: allLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('challenge_id', id);

    return (
        <main className="min-h-screen bg-[#030712] text-[#f0f9ff] font-jakarta overflow-x-hidden">
            <RnRChallengeDetails
                challenge={challenge}
                members={members || []}
                initialLogs={allLogs || []}
            />
        </main>
    );
}
