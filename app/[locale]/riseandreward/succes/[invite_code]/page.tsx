'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import {
    CheckCircle, Copy, Share2, Users,
    ArrowRight, MessageCircle, Send,
    PartyPopper, Sparkles, Zap, Shield,
    Settings2, Edit3, Globe, Lock,
    Calendar, Check
} from 'lucide-react';

import { useTranslations } from 'next-intl';

interface Member {
    user_id: string;
    role: string;
    color: string;
    profiles: {
        username: string;
        color: string;
    };
}

interface Challenge {
    id: string;
    name: string;
    invite_code: string;
    reward: string;
    max_members: number;
    allow_member_invites: boolean;
}

export default function RnRSuccessPage() {
    const t = useTranslations('riseandreward.success');
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const inviteCodeParam = params.invite_code as string;

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const { data: challengeData, error: challengeError } = await supabase
                .from('challenges')
                .select('id, name, invite_code, reward, max_members, allow_member_invites')
                .eq('invite_code', inviteCodeParam)
                .single();

            if (challengeData) {
                setChallenge(challengeData);

                // Charger les membres avec leurs profils
                const { data: membersData } = await supabase
                    .from('challenge_members')
                    .select('user_id, role, color, profiles(username, color)')
                    .eq('challenge_id', challengeData.id);

                if (membersData) {
                    setMembers(membersData as any);
                }
            }
            setLoading(false);
        }
        loadData();
    }, [inviteCodeParam]);

    const inviteLink = `https://www.ekstremai.com/join/${challenge?.invite_code || inviteCodeParam}`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleInvites = async () => {
        if (!challenge || isUpdating) return;
        setIsUpdating(true);
        const newValue = !challenge.allow_member_invites;

        const { error } = await supabase
            .from('challenges')
            .update({ allow_member_invites: newValue })
            .eq('id', challenge.id);

        if (!error) {
            setChallenge({ ...challenge, allow_member_invites: newValue });
        }
        setIsUpdating(false);
    };

    const shareWhatsApp = () => {
        const text = t('share_text', { code: challenge?.invite_code || inviteCodeParam });
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareMessenger = () => {
        const text = t('share_text', { code: challenge?.invite_code || inviteCodeParam });
        if (navigator.share) {
            navigator.share({
                title: `EkstremAI`,
                text: text,
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
        <main className="relative min-h-screen bg-[#030712] text-[#f0f9ff] font-jakarta overflow-x-hidden pb-24">
            <RnRNavbar minimal />

            {/* Ambient effects */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-violet/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-cyan/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-xl mx-auto pt-24 px-6">
                {/* Header Success */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-8"
                >
                    <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-green-500/30 rotate-3">
                        <CheckCircle size={28} className="text-green-400" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2 leading-tight">
                        {t('title')}
                    </h1>
                    <p className="text-white/40 text-sm">
                        {t('subtitle')}
                    </p>
                </motion.div>

                <div className="space-y-6">
                    {/* 1. Section Partage */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-3xl p-6 border border-white/10"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Share2 size={16} className="text-brand-cyan" />
                            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">{t('invite_title')}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <button
                                onClick={shareMessenger}
                                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0084FF] text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Send size={16} fill="currentColor" /> Messenger
                            </button>
                            <button
                                onClick={shareWhatsApp}
                                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <MessageCircle size={16} fill="currentColor" /> WhatsApp
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group hover:border-brand-cyan/30 transition-colors">
                                <span className="text-xs text-brand-cyan font-mono truncate mr-4">{inviteLink}</span>
                                <button onClick={() => copyToClipboard(inviteLink)} className="text-white/40 hover:text-white transition-colors">
                                    <Copy size={16} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">{t('invite_title')}</p>
                                    <span className="text-2xl font-black text-white font-mono tracking-tighter">{challenge.invite_code}</span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(challenge.invite_code)}
                                    className="px-4 py-2 bg-brand-cyan/20 border border-brand-cyan/30 rounded-xl text-brand-cyan text-[10px] font-bold hover:bg-brand-cyan hover:text-brand-black transition-all"
                                >
                                    {copied ? t('copied') : t('copy')}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. Section Admin Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-3xl overflow-hidden border border-white/10"
                    >
                        <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield size={16} className="text-brand-violet-light" />
                                <h2 className="text-xs font-bold text-white uppercase tracking-widest">Panneau Administrateur</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <Edit3 size={16} className="text-brand-violet-light" />
                                    MODIFIER LE DÉFI
                                </button>
                                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <Settings2 size={16} className="text-brand-cyan" />
                                    GÉRER LES INVITATIONS
                                </button>
                            </div>

                            <div className="p-4 bg-brand-violet/10 border border-brand-violet/20 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <Shield size={18} className="text-brand-violet-light" />
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Vos Pouvoirs</h3>
                                </div>
                                <p className="text-[11px] text-white/50 leading-relaxed">
                                    En tant qu'administrateur, vous pouvez <span className="text-white/80 font-semibold">nommer d'autres administrateurs</span> pour vous aider, ou <span className="text-white/80 font-semibold">restreindre les invitations</span> pour garder le groupe privé.
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${challenge.allow_member_invites ? 'bg-brand-cyan/10' : 'bg-red-500/10'}`}>
                                        {challenge.allow_member_invites ? <Globe size={18} className="text-brand-cyan" /> : <Lock size={18} className="text-red-400" />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Autoriser les invitations</h3>
                                        <p className="text-[10px] text-white/30">Les membres peuvent inviter leurs amis.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleInvites}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${challenge.allow_member_invites ? 'bg-brand-cyan' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${challenge.allow_member_invites ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <div className="p-4 bg-brand-violet/10 border border-brand-violet/20 rounded-2xl flex items-center gap-4">
                                <div className="w-10 h-10 bg-brand-violet/20 rounded-xl flex items-center justify-center shrink-0">
                                    <Sparkles size={20} className="text-brand-violet-light" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-brand-violet-light uppercase tracking-wider mb-0.5">Récompense visée</p>
                                    <h3 className="text-sm font-bold text-white truncate">{challenge.reward}</h3>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3. Section Next Steps */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-3xl p-6 border border-white/10"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <PartyPopper size={16} className="text-brand-cyan" />
                            <h2 className="text-xs font-bold text-white uppercase tracking-widest">{t('next_steps')}</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-brand-cyan/20 flex items-center justify-center text-[10px] font-bold text-brand-cyan shrink-0 mt-0.5">1</div>
                                <p className="text-xs text-white/60">{t('step1')}</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-brand-cyan/20 flex items-center justify-center text-[10px] font-bold text-brand-cyan shrink-0 mt-0.5">2</div>
                                <p className="text-xs text-white/60">{t('step2')}</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-brand-cyan/20 flex items-center justify-center text-[10px] font-bold text-brand-cyan shrink-0 mt-0.5">3</div>
                                <p className="text-xs text-white/60">{t('step3')}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation Finale */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="pt-4"
                    >
                        <button
                            onClick={() => router.push('/riseandreward')}
                            className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white text-[#030712] font-black text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-cyan/20"
                        >
                            <Calendar size={20} />
                            {t('go_to_dashboard')}
                            <ArrowRight size={20} />
                        </button>
                        <p className="text-center text-[10px] text-white/20 uppercase tracking-[0.4em] mt-8">
                            Édition Rise & Reward
                        </p>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
