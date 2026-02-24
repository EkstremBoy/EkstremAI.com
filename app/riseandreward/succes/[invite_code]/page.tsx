'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import {
    CheckCircle, Copy, Share2, Users,
    ArrowRight, MessageCircle, Send,
    PartyPopper, Sparkles
} from 'lucide-react';

interface Challenge {
    id: string;
    name: string;
    invite_code: string;
}

export default function RnRSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [memberCount, setMemberCount] = useState(1);

    const inviteCodeParam = params.invite_code as string;

    useEffect(() => {
        async function loadChallenge() {
            const { data, error } = await supabase
                .from('challenges')
                .select('id, name, invite_code')
                .eq('invite_code', inviteCodeParam)
                .single();

            if (data) {
                setChallenge(data);

                // Compter les membres
                const { count } = await supabase
                    .from('challenge_members')
                    .select('user_id', { count: 'exact', head: true })
                    .eq('challenge_id', data.id);

                setMemberCount(count ?? 1);
            }
            setLoading(false);
        }
        loadChallenge();
    }, [inviteCodeParam]);

    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/join/${challenge?.invite_code}`
        : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const text = `Rejoins mon groupe "${challenge?.name}" sur EkstremAI ! Ensemble, on vise la récompense. Voici le lien : ${inviteLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareMessenger = () => {
        // Lien direct Messenger n'est pas possible sans SDK, on utilise le partage générique
        if (navigator.share) {
            navigator.share({
                title: `Rejoins le défi ${challenge?.name}`,
                text: `On a un objectif commun sur EkstremAI !`,
                url: inviteLink,
            });
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
                <p className="text-white/40 mb-4">Défi introuvable.</p>
                <button
                    onClick={() => router.push('/riseandreward')}
                    className="text-brand-cyan hover:underline"
                >
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#030712] text-[#f0f9ff] font-jakarta overflow-x-hidden">
            <RnRNavbar />

            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-violet/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-brand-cyan/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-xl mx-auto pt-32 pb-20 px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-12"
                >
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                        <CheckCircle size={32} className="text-green-400" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">
                        Défi créé avec succès !
                    </h1>
                    <p className="text-white/40">
                        Il est temps de recruter tes coéquipiers pour remplir la cagnotte.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass rounded-3xl p-8 border border-white/10 relative overflow-hidden"
                >
                    {/* Floating icons decoration */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <PartyPopper size={80} className="rotate-12 translate-x-8 -translate-y-4" />
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center">
                                <Users size={20} className="text-brand-cyan" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">{challenge.name}</h2>
                                <p className="text-brand-cyan text-xs font-semibold">
                                    {memberCount} / 8 membres inscrits
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-white/30 uppercase tracking-widest block mb-3 pl-1">
                                    Lien de recrutement unique
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60 truncate font-mono">
                                        {inviteLink}
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${copied
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-brand-cyan text-brand-black hover:scale-105 active:scale-95'
                                            }`}
                                    >
                                        {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={shareWhatsApp}
                                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-bold text-sm hover:bg-[#25D366]/20 transition-all"
                                >
                                    <MessageCircle size={18} />
                                    WhatsApp
                                </button>
                                <button
                                    onClick={shareMessenger}
                                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#0084FF]/10 border border-[#0084FF]/20 text-[#0084FF] font-bold text-sm hover:bg-[#0084FF]/20 transition-all"
                                >
                                    <Send size={18} />
                                    Messenger
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10 flex flex-col gap-4 text-center"
                >
                    <button
                        onClick={() => router.push('/riseandreward')}
                        className="group flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors"
                    >
                        Accéder au tableau de bord
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-white/10 uppercase tracking-[0.2em]">
                        <Sparkles size={10} />
                        Propulsé par EkstremAI
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
