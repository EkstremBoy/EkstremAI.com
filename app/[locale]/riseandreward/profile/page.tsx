'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import RnRNavbar from '@/components/riseandreward/RnRNavbar';
import {
    Zap, Shield, Camera, Sparkles,
    ChevronRight, Target, Info,
    Rocket, Ghost, Bot, Bird,
    Trees, Castle, Palmtree, Orbit,
    Building2, Smile, Angry, Sword, Meh,
    Flame, CheckCircle
} from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// ─── Constants ──────────────────────────────────────────────

const AVATAR_COST = 1;

const getCharacters = (t: any) => [
    { id: 'dragon', label: t('characters.dragon'), icon: <Flame size={18} /> },
    { id: 'troll', label: t('characters.troll'), icon: <Ghost size={18} /> },
    { id: 'owl', label: t('characters.owl'), icon: <Bird size={18} /> },
    { id: 'unicorn', label: t('characters.unicorn'), icon: <Sparkles size={18} /> },
    { id: 'ninja', label: t('characters.ninja'), icon: <Target size={18} /> },
    { id: 'robot', label: t('characters.robot'), icon: <Bot size={18} /> },
];

const getEnvironments = (t: any) => [
    { id: 'forest', label: t('environments.forest'), icon: <Trees size={18} /> },
    { id: 'castle', label: t('environments.castle'), icon: <Castle size={18} /> },
    { id: 'beach', label: t('environments.beach'), icon: <Palmtree size={18} /> },
    { id: 'space', label: t('environments.space'), icon: <Orbit size={18} /> },
    { id: 'cyber', label: t('environments.cyber'), icon: <Building2 size={18} /> },
];

const getVibes = (t: any) => [
    { id: 'furious', label: t('vibes.furious'), icon: <Angry size={18} /> },
    { id: 'happy', label: t('vibes.happy'), icon: <Smile size={18} /> },
    { id: 'adventurous', label: t('vibes.adventurous'), icon: <Sword size={18} /> },
    { id: 'stoic', label: t('vibes.stoic'), icon: <Shield size={18} /> },
    { id: 'dumb', label: t('vibes.dumb'), icon: <Meh size={18} /> },
];

// ─── Component ───────────────────────────────────────────────

export default function ProfilePage() {
    const t = useTranslations('riseandreward.profile');
    const CHARACTERS = getCharacters(t);
    const ENVIRONMENTS = getEnvironments(t);
    const VIBES = getVibes(t);
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [tokens, setTokens] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);

    // Generator State
    const [generating, setGenerating] = useState(false);
    const [generatorStep, setGeneratorStep] = useState(0); // 0: Closed, 1: Selection, 2: Preview
    const [selection, setSelection] = useState({
        character: '',
        environment: '',
        vibe: ''
    });
    const [previews, setPreviews] = useState<string[]>([]);
    const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUser(user);

            // Fetch profile and tokens
            const [{ data: profData }, { data: tokenData }] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('user_tokens').select('balance').eq('user_id', user.id).single()
            ]);

            setProfile(profData);

            if (!tokenData) {
                // First visit logic: grant 1 token
                const { data: newTaskData, error: insError } = await supabase
                    .from('user_tokens')
                    .insert({ user_id: user.id, balance: 1 })
                    .select()
                    .single();

                if (!insError) {
                    setTokens(1);
                    setShowWelcome(true);
                }
            } else {
                setTokens(tokenData.balance);
            }
            setLoading(false);
        }
        loadProfile();
    }, []);

    const handleGenerate = async () => {
        if (tokens < AVATAR_COST) return;

        setGenerating(true);
        try {
            // Debit token
            const { error: dbError } = await supabase
                .from('user_tokens')
                .update({ balance: tokens - AVATAR_COST })
                .eq('user_id', user.id);

            if (dbError) throw dbError;
            setTokens(prev => prev - AVATAR_COST);

            // Call API
            const res = await fetch('/api/generate-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selection)
            });
            const data = await res.json();
            setPreviews(data.urls);
            setGeneratorStep(2);
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveAvatar = async () => {
        if (!selectedPreview) return;

        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: selectedPreview })
            .eq('id', user.id);

        if (!error) {
            setProfile({ ...profile, avatar_url: selectedPreview });
            setGeneratorStep(0);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#030712] text-white font-jakarta overflow-x-hidden pb-24">
            <RnRNavbar minimal />

            {/* Ambient effects */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-1/4 w-[800px] h-[600px] bg-brand-violet/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-cyan/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 px-6">

                {/* Welcome Message */}
                <AnimatePresence>
                    {showWelcome && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass mb-8 p-6 rounded-3xl border border-brand-cyan/20 bg-brand-cyan/5 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setShowWelcome(false)} className="text-white/20 hover:text-white transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-cyan/20 rounded-2xl flex items-center justify-center shrink-0 glow-cyan">
                                    <Rocket size={24} className="text-brand-cyan" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">{t('welcome', { username: profile?.username })}</h2>
                                    <p className="text-sm text-white/60" dangerouslySetInnerHTML={{ __html: t('welcome_desc') }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left: User Card */}
                    <div className="md:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass p-8 rounded-[2rem] border border-white/10 text-center"
                        >
                            <div className="relative w-24 h-24 mx-auto mb-6">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan to-brand-violet rounded-[2rem] blur-xl opacity-30 animate-pulse" />
                                <div className="relative w-full h-full bg-[#0F172A] rounded-[2rem] border border-white/10 overflow-hidden flex items-center justify-center group">
                                    {profile?.avatar_url ? (
                                        <Image src={profile.avatar_url} alt="Avatar" width={96} height={96} className="object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
                                            {profile?.username[0].toUpperCase()}
                                        </span>
                                    )}
                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                                        <Camera size={20} className="mb-1" />
                                        <span className="text-[10px] font-bold uppercase">{t('modify')}</span>
                                        <input type="file" className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <h1 className="text-xl font-black mb-1">{profile?.username}</h1>
                            <p className="text-xs text-white/40 font-mono mb-6 truncate">{user?.email}</p>

                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap size={16} className="text-brand-cyan" />
                                    <span className="text-sm font-bold">{t('tokens')}</span>
                                </div>
                                <span className="text-xl font-black text-brand-cyan font-mono">{tokens}</span>
                            </div>
                        </motion.div>

                        <div className="glass p-6 rounded-3xl border border-white/10">
                            <h3 className="text-xs font-bold text-white/20 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Sparkles size={14} /> {t('gamification.title')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 opacity-40">
                                    <div className="w-8 h-8 rounded-lg bg-brand-violet/20 flex items-center justify-center shrink-0">
                                        <Target size={14} className="text-brand-violet-light" />
                                    </div>
                                    <p className="text-[10px] font-medium leading-tight">
                                        {t('gamification.perfect_week')} <br />
                                        <span className="text-brand-violet-light font-bold">{t('gamification.perfect_week_reward')}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 opacity-40">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                                        <Rocket size={14} className="text-green-400" />
                                    </div>
                                    <p className="text-[10px] font-medium leading-tight">
                                        {t('gamification.challenge_won')} <br />
                                        <span className="text-green-400 font-bold">{t('gamification.challenge_won_reward')}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Avatar Creator */}
                    <div className="md:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass p-8 rounded-[2rem] border border-white/10"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black mb-2">{t('title')}</h2>
                                    <p className="text-sm text-white/40">{t('subtitle')}</p>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl">
                                    <Zap size={14} className="text-brand-cyan" />
                                    <span className="text-xs font-bold text-brand-cyan">{t('cost', { count: AVATAR_COST })}</span>
                                </div>
                            </div>

                            {generatorStep === 0 ? (
                                <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
                                    <div className="w-20 h-20 bg-brand-violet/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Sparkles size={32} className="text-brand-violet-light" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{t('generator.empty_title')}</h3>
                                    <p className="text-white/40 mb-8 max-w-sm mx-auto">
                                        {t('generator.empty_desc')}
                                        {tokens < AVATAR_COST && t('generator.no_tokens')}
                                    </p>
                                    <button
                                        disabled={tokens < AVATAR_COST}
                                        onClick={() => setGeneratorStep(1)}
                                        className="px-8 py-3.5 bg-brand-cyan text-brand-black font-black rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all glow-cyan"
                                    >
                                        {t('generator.start')}
                                    </button>
                                </div>
                            ) : generatorStep === 1 ? (
                                <div className="space-y-8">
                                    {/* Selectors */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-4">{t('generator.characters_label')}</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {CHARACTERS.map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => setSelection({ ...selection, character: c.label })}
                                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${selection.character === c.label ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
                                                    >
                                                        {c.icon}
                                                        <span className="text-sm font-bold">{c.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-4">{t('generator.environments_label')}</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {ENVIRONMENTS.map(e => (
                                                    <button
                                                        key={e.id}
                                                        onClick={() => setSelection({ ...selection, environment: e.label })}
                                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${selection.environment === e.label ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
                                                    >
                                                        {e.icon}
                                                        <span className="text-sm font-bold">{e.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-4">{t('generator.vibes_label')}</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {VIBES.map(v => (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => setSelection({ ...selection, vibe: v.label })}
                                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${selection.vibe === v.label ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
                                                    >
                                                        {v.icon}
                                                        <span className="text-sm font-bold">{v.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => setGeneratorStep(0)}
                                            className="px-6 py-3.5 bg-white/5 text-white/60 font-bold rounded-2xl hover:bg-white/10 transition-all"
                                        >
                                            {t('generator.cancel')}
                                        </button>
                                        <button
                                            disabled={!selection.character || !selection.environment || !selection.vibe || generating}
                                            onClick={handleGenerate}
                                            className="flex-1 px-8 py-3.5 bg-brand-cyan text-brand-black font-black rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all glow-cyan flex items-center justify-center gap-2"
                                        >
                                            {generating ? (
                                                <div className="w-5 h-5 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                                            ) : (
                                                <>{t('generator.generate')}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <h3 className="text-lg font-bold text-center">{t('generator.pick_title')}</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {previews.map((url, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedPreview(url)}
                                                className={`relative aspect-square rounded-[2rem] overflow-hidden border-4 transition-all ${selectedPreview === url ? 'border-brand-cyan scale-105 shadow-2xl shadow-brand-cyan/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            >
                                                <Image src={url} alt={`Preview ${i}`} fill className="object-cover" />
                                                {selectedPreview === url && (
                                                    <div className="absolute top-3 right-3 bg-brand-cyan text-brand-black p-1.5 rounded-full">
                                                        <CheckCircle size={16} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => setGeneratorStep(1)}
                                            className="px-6 py-3.5 bg-white/5 text-white/60 font-bold rounded-2xl hover:bg-white/10 transition-all"
                                        >
                                            {t('generator.retry')}
                                        </button>
                                        <button
                                            disabled={!selectedPreview}
                                            onClick={handleSaveAvatar}
                                            className="flex-1 px-8 py-3.5 bg-brand-cyan text-brand-black font-black rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all glow-cyan"
                                        >
                                            {t('generator.use_avatar')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <div className="glass p-6 rounded-3xl border border-white/10 flex items-center justify-between text-white/40">
                            <div className="flex items-center gap-3">
                                <Info size={18} />
                                <p className="text-xs">{t('footer_info')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
