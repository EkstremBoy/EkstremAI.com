'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import {
    CheckCircle, Copy, Share2, Users,
    ArrowRight, MessageCircle, Send,
    PartyPopper, Sparkles, Zap
} from 'lucide-react';

interface Challenge {
    id: string;
    name: string;
    invite_code: string;
    reward: string;
    max_members: number;
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
                .select('id, name, invite_code, reward, max_members')
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

    const inviteLink = `https://www.ekstremai.com/join/${challenge?.invite_code || inviteCodeParam}`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const text = `🚀 Rejoins mon défi "${challenge?.name}" sur EkstremAI ! Ensemble, on gagne : ${challenge?.reward}. Voici le lien : ${inviteLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareMessenger = () => {
        const text = `🚀 Rejoins mon défi "${challenge?.name}" sur EkstremAI !`;
        if (navigator.share) {
            navigator.share({
                title: `Défi ${challenge?.name}`,
                text: `Objectif : ${challenge?.reward}. Rejoins-nous !`,
                url: inviteLink,
            });
        } else {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`, '_blank');
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
            <RnRNavbar minimal />

            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-violet/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-brand-cyan/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-xl mx-auto pt-32 pb-20 px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-10"
                >
                    <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/30 rotate-3">
                        <CheckCircle size={32} className="text-green-400" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2 leading-tight">
                        Défi lancé ! 🎉
                    </h1>
                    <p className="text-white/40 text-sm max-w-[300px] mx-auto">
                        Votre défi <span className="text-white/70 font-bold">{challenge.name}</span> est désormais en ligne.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass rounded-[2rem] p-8 border border-white/10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <PartyPopper size={120} className="rotate-12 translate-x-12 -translate-y-6" />
                    </div>

                    <div className="relative space-y-8">
                        {/* Récompense Card */}
                        <div className="bg-brand-violet/10 border border-brand-violet/20 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-violet/20 flex items-center justify-center shrink-0">
                                <Sparkles className="text-brand-violet-light" size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-brand-violet-light uppercase tracking-wider mb-0.5">Récompense visée</p>
                                <h3 className="text-white font-bold leading-tight">{challenge.reward}</h3>
                            </div>
                        </div>

                        {/* Share URL */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] block pl-1">
                                Lien de Recrutement
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-brand-cyan truncate font-mono">
                                    {inviteLink}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(inviteLink)}
                                    className={`shrink-0 h-auto px-5 rounded-xl flex items-center justify-center transition-all font-bold text-[10px] tracking-wider ${copied
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-brand-cyan text-brand-black hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    {copied ? 'COPIÉ !' : 'COPIER'}
                                </button>
                            </div>
                        </div>

                        {/* Invite Code Card */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-3 pl-1">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                                    Code du Groupe
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-white/60 uppercase">
                                        {memberCount} / {challenge.max_members} Membres
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:border-white/20 transition-colors">
                                <span className="text-4xl font-black text-white font-mono tracking-[0.2em]">
                                    {challenge.invite_code}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(challenge.invite_code)}
                                    className="p-3 bg-white/5 rounded-xl text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all border border-transparent group-hover:border-white/10"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>
                            <p className="text-[10px] text-white/20 text-center mt-4 italic">
                                "{memberCount === 1 ? '1 membre (C&apos;est vous !)' : `${memberCount} membres actifs`}"
                            </p>
                        </div>

                        {/* Share Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={shareMessenger}
                                className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#0084FF] text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#0084FF]/20"
                            >
                                <Send size={18} fill="currentColor" />
                                Messenger
                            </button>
                            <button
                                onClick={shareWhatsApp}
                                className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#25D366] text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#25D366]/20"
                            >
                                <MessageCircle size={18} fill="currentColor" />
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 flex flex-col gap-4 text-center"
                >
                    <button
                        onClick={() => router.push('/riseandreward')}
                        className="group flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all relative overflow-hidden"
                    >
                        <Zap size={20} className="text-brand-cyan" fill="currentColor" />
                        Accéder au Tableau de Bord
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] mt-8 flex items-center justify-center gap-2">
                        <span className="w-8 h-px bg-white/5" />
                        Propulsé par EkstremAI
                        <span className="w-8 h-px bg-white/5" />
                    </p>
                </motion.div>
            </div>
        </main>
    );
}
