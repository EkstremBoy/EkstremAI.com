'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import {
    Users, Target, Shield, Heart,
    Home, Briefcase, Zap, ArrowRight,
    LogIn, UserPlus, Flame, Star
} from 'lucide-react';

interface Challenge {
    id: string;
    name: string;
    challenge_type: 'collective' | 'individual';
    penalty_amount: number;
    goal_amount: number;
    reward: string;
    group_type: string;
    is_strict_mode: boolean;
}

export default function JoinChallengePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [memberCount, setMemberCount] = useState(0);
    const [creatorName, setCreatorName] = useState('');

    const inviteCode = params.invite_code as string;

    useEffect(() => {
        async function loadChallenge() {
            // Fetch challenge by invite_code
            const { data: challengeData, error } = await supabase
                .from('challenges')
                .select(`
                    *,
                    profiles:created_by (first_name)
                `)
                .eq('invite_code', inviteCode)
                .single();

            if (challengeData) {
                setChallenge(challengeData);
                // @ts-ignore
                setCreatorName(challengeData.profiles?.first_name || 'Un membre');

                // Fetch member count
                const { count } = await supabase
                    .from('challenge_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('challenge_id', challengeData.id);

                setMemberCount(count ?? 0);
            }
            setLoading(false);
        }
        loadChallenge();
    }, [inviteCode]);

    const handleJoin = async () => {
        setJoining(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not logged in -> Redirect to signup with state
                router.push(`/fr/signup?invite=${inviteCode}`);
                return;
            }

            // Check if already a member
            const { data: existingMember } = await supabase
                .from('challenge_members')
                .select('id')
                .eq('challenge_id', challenge?.id)
                .eq('user_id', user.id)
                .single();

            if (existingMember) {
                router.push('/riseandreward');
                return;
            }

            // Join the challenge
            const { error: joinError } = await supabase
                .from('challenge_members')
                .insert({
                    challenge_id: challenge?.id,
                    user_id: user.id
                });

            if (joinError) throw joinError;

            // Success -> Dashboard
            router.push('/riseandreward');
        } catch (err) {
            console.error('Erreur lors de l\'adhésion:', err);
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin" />
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-6">
                <p className="text-white/40 mb-4">Code d&apos;invitation invalide ou expiré.</p>
                <button
                    onClick={() => router.push('/')}
                    className="text-brand-cyan hover:underline"
                >
                    Retour à l&apos;accueil
                </button>
            </div>
        );
    }

    const GroupIcon = () => {
        switch (challenge.group_type) {
            case 'Famille': return <Home size={18} />;
            case 'Collègues': return <Briefcase size={18} />;
            case 'Autre': return <Heart size={18} />;
            default: return <Users size={18} />;
        }
    };

    return (
        <main className="relative min-h-screen bg-[#030712] text-[#f0f9ff] font-jakarta overflow-x-hidden">
            <RnRNavbar />

            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-cyan/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-violet/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">

                    {/* Left Column — Info & Preview */}
                    <div className="lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-bold mb-6">
                                <Zap size={12} /> Invitation reçue
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                                {creatorName} t&apos;invite à rejoindre <span className="text-brand-cyan text-glow-cyan">{challenge.name}</span>
                            </h1>

                            <p className="text-white/50 text-lg mb-8 leading-relaxed max-w-lg">
                                On s&apos;est donné un défi quotidien pour financer notre projet : <strong className="text-white">{challenge.reward}</strong>. Es-tu prêt à relever le défi ?
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="glass p-4 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Cible</p>
                                    <p className="text-xl font-bold text-white">{challenge.goal_amount}$</p>
                                </div>
                                <div className="glass p-4 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Amende</p>
                                    <p className="text-xl font-bold text-red-400">{challenge.penalty_amount}$</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 text-white/60">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                        <GroupIcon />
                                    </div>
                                    <span className="text-sm font-medium">Groupe {challenge.group_type}</span>
                                </div>
                                <div className="flex items-center gap-4 text-white/60">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                        <Shield size={16} />
                                    </div>
                                    <span className="text-sm font-medium">Mode {challenge.is_strict_mode ? 'Strict' : 'Flexible'}</span>
                                </div>
                                <div className="flex items-center gap-4 text-white/60">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                        <Users size={16} />
                                    </div>
                                    <span className="text-sm font-medium">{memberCount} membres déjà inscrits</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column — Action Card */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="glass rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden shadow-2xl shadow-brand-cyan/10"
                        >
                            {/* Animated background element inside card */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <div className="relative">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-violet p-px mx-auto mb-4">
                                        <div className="w-full h-full bg-[#030712] rounded-[inherit] flex items-center justify-center">
                                            <Flame size={24} className="text-brand-cyan" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Prêt à commencer ?</h3>
                                    <p className="text-white/40 text-xs">Rejoins le groupe en une seconde.</p>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handleJoin}
                                        disabled={joining}
                                        className="w-full h-14 rounded-2xl bg-brand-cyan text-brand-black font-black text-base flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {joining ? (
                                            <div className="w-5 h-5 border-2 border-brand-black/20 border-t-brand-black rounded-full animate-spin" />
                                        ) : (
                                            <>REJOINDRE LE DÉFI <ArrowRight size={18} /></>
                                        )}
                                    </button>

                                    <p className="text-[10px] text-white/20 text-center uppercase tracking-widest leading-relaxed">
                                        En rejoignant, tu acceptes les règles de validation du groupe.
                                    </p>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Star size={10} className="text-yellow-500/50" />
                                        Propulsé par Rise & Reward
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {inviteCode}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </main>
    );
}
