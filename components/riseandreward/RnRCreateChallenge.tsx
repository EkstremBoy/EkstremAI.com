'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    Users, Star, Target, DollarSign,
    CalendarDays, Shield, Clock, ArrowRight,
    ArrowLeft, CheckCircle, Zap, Flame,
    Briefcase, Home, Heart
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

// ─── Types ───────────────────────────────────────────────────

type ChallengeType = 'collective' | 'individual' | null;
type ValidationMode = 'strict' | 'flexible' | null;
type GroupType = string;

interface FormState {
    challengeType: ChallengeType;
    groupType: string;
    name: string;
    reward: string;
    goalAmount: string;
    penaltyAmount: string;
    startDate: string;
    validationMode: ValidationMode;
    selectedColor: string;
}

// ─── Helpers ─────────────────────────────────────────────────

const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// ─── Stepper config ──────────────────────────────────────────

const COLORS = [
    { name: 'Bleu', hex: '#3b82f6', border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    { name: 'Cyan', hex: '#06b6d4', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    { name: 'Violet', hex: '#8b5cf6', border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-400' },
    { name: 'Rose', hex: '#ec4899', border: 'border-pink-500/30', bg: 'bg-pink-500/10', text: 'text-pink-400' },
    { name: 'Rouge', hex: '#ef4444', border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
    { name: 'Orange', hex: '#f97316', border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    { name: 'Jaune', hex: '#eab308', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    { name: 'Vert', hex: '#22c55e', border: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-400' },
];

// ─── Animations ──────────────────────────────────────────────

const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

// ─── Component ───────────────────────────────────────────────

export default function RnRCreateChallenge() {
    const router = useRouter();
    const supabase = createClient();
    const t = useTranslations('riseandreward.create_challenge');
    const locale = useLocale();

    const STEPS = [
        { number: 1, label: t('steps.step1'), icon: <Flame size={14} /> },
        { number: 2, label: t('steps.step2'), icon: <Target size={14} /> },
        { number: 3, label: t('steps.step3'), icon: <Shield size={14} /> },
        { number: 4, label: t('steps.step4'), icon: <Zap size={14} /> },
    ];

    const GROUP_TYPES = [
        { key: 'friends', label: t('group_types.friends'), icon: <Users size={16} /> },
        { key: 'family', label: t('group_types.family'), icon: <Home size={16} /> },
        { key: 'couple', label: t('group_types.couple'), icon: <Heart size={16} /> },
        { key: 'colleagues', label: t('group_types.colleagues'), icon: <Briefcase size={16} /> },
        { key: 'other', label: t('group_types.other'), icon: <Star size={16} /> },
    ];

    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<FormState>({
        challengeType: null,
        groupType: 'friends',
        name: '',
        reward: '',
        goalAmount: '',
        penaltyAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        validationMode: null,
        selectedColor: COLORS[0].hex,
    });

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const goTo = (next: number) => {
        setDirection(next > step ? 1 : -1);
        setStep(next);
    };

    // Validation per step
    const canProceed = () => {
        if (step === 1) return form.challengeType !== null && form.name.trim().length > 0;
        if (step === 2) return form.reward.trim().length > 0 && Number(form.goalAmount) > 0 && Number(form.penaltyAmount) > 0;
        if (step === 3) return form.startDate !== '' && form.validationMode !== null;
        if (step === 4) return form.selectedColor !== '';
        return false;
    };

    const handleSubmit = async () => {
        if (!canProceed()) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Utilisateur non connecté');

            // Vérifier si le profil existe (évite l'erreur FK profiles(id))
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, username')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                // Créer le profil s'il manque
                const { error: insertProfileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        username: user.email?.split('@')[0] || 'User',
                        color: form.selectedColor || '#6366f1'
                    });
                if (insertProfileError) throw new Error("Impossible de créer votre profil. " + insertProfileError.message);
            }

            const inviteCode = generateInviteCode();

            // 1. Insérer le défi
            const { data: challenge, error: challengeError } = await supabase
                .from('challenges')
                .insert({
                    name: form.name,
                    challenge_type: form.challengeType,
                    penalty_amount: Number(form.penaltyAmount),
                    goal_amount: Number(form.goalAmount),
                    is_strict_mode: form.validationMode === 'strict',
                    created_by: user.id,
                    group_type: form.groupType,
                    invite_code: inviteCode,
                    reward: form.reward
                })
                .select()
                .single();

            if (challengeError) {
                console.error('Erreur Supabase Challenges:', challengeError);
                throw new Error("Erreur lors de la création du défi : " + challengeError.message);
            }

            // 2. Ajouter le créateur comme membre avec rôle 'admin' et sa couleur
            const { error: memberError } = await supabase
                .from('challenge_members')
                .insert({
                    challenge_id: challenge.id,
                    user_id: user.id,
                    role: 'admin',
                    color: form.selectedColor
                });

            if (memberError) {
                console.error('Erreur Supabase Members Result:', memberError);
                // Si l'erreur est un 400, on log les détails pour le debug
                throw new Error(`Erreur lors de l'ajout du membre (Code ${memberError.code}) : ${memberError.message}`);
            }

            // Rediriger vers la page de succès via le invite_code
            router.push(`/riseandreward/succes/${inviteCode}`);
        } catch (err: any) {
            console.error('Erreur lors du lancement:', err);
            setError(err.message || 'Une erreur inattendue est survenue.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-20 px-6">
            {/* Ambient background */}
            <div
                aria-hidden
                className="fixed inset-0 pointer-events-none -z-10"
                style={{
                    background:
                        'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(139,58,247,0.22) 0%, transparent 65%), #030712',
                }}
            />

            <div className="max-w-2xl mx-auto">
                {/* Page header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-violet/25 text-xs font-semibold text-brand-violet-light mb-4">
                        <Zap size={11} className="text-brand-cyan" />
                        Rise &amp; Reward
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                        {t('title')}
                    </h1>
                    <p className="text-white/40 text-sm mt-2">
                        {t('subtitle', { count: 3 })}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                    >
                        <strong>Oups !</strong> {error}
                    </motion.div>
                )}

                {/* ── Stepper ──────────────────────────────── */}
                <div className="flex items-center justify-center gap-0 mb-10">
                    {STEPS.map((s, i) => {
                        const done = step > s.number;
                        const active = step === s.number;
                        return (
                            <div key={s.number} className="flex items-center">
                                <button
                                    onClick={() => done && goTo(s.number)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${active
                                        ? 'bg-brand-violet text-white shadow-lg shadow-brand-violet/30'
                                        : done
                                            ? 'text-brand-cyan cursor-pointer hover:bg-brand-cyan/10'
                                            : 'text-white/20 cursor-default'
                                        }`}
                                >
                                    {done ? <CheckCircle size={13} /> : s.icon}
                                    {s.label}
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div className={`w-8 h-px mx-1 transition-colors duration-500 ${done ? 'bg-brand-cyan/50' : 'bg-white/10'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Steps content ────────────────────────── */}
                <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        {/* ═══ ÉTAPE 1 — Le Défi ═══════════════════════════ */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="flex flex-col gap-8"
                            >
                                {/* Type cards */}
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
                                        {t('group_dynamic')}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Option A — Défi Commun */}
                                        <button
                                            onClick={() => set('challengeType', 'collective')}
                                            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 group ${form.challengeType === 'collective'
                                                ? 'border-brand-cyan bg-brand-cyan/5 shadow-lg shadow-brand-cyan/10'
                                                : 'border-white/8 glass hover:border-white/20'
                                                }`}
                                        >
                                            {form.challengeType === 'collective' && (
                                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-cyan flex items-center justify-center">
                                                    <CheckCircle size={12} className="text-brand-black" />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${form.challengeType === 'collective' ? 'bg-brand-cyan/20' : 'bg-white/5 group-hover:bg-white/8'
                                                }`}>
                                                <Users size={20} className={form.challengeType === 'collective' ? 'text-brand-cyan' : 'text-white/40'} />
                                            </div>
                                            <h3 className={`font-bold text-base mb-1.5 transition-colors ${form.challengeType === 'collective' ? 'text-white' : 'text-white/70'
                                                }`}>
                                                {t('collective_title')}
                                            </h3>
                                            <p className="text-xs text-white/40 leading-relaxed">
                                                {t('collective_desc')}
                                            </p>
                                        </button>

                                        {/* Option B — Défis Personnalisés */}
                                        <button
                                            onClick={() => set('challengeType', 'individual')}
                                            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 group ${form.challengeType === 'individual'
                                                ? 'border-brand-violet bg-brand-violet/5 shadow-lg shadow-brand-violet/10'
                                                : 'border-white/8 glass hover:border-white/20'
                                                }`}
                                        >
                                            {form.challengeType === 'individual' && (
                                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-violet flex items-center justify-center">
                                                    <CheckCircle size={12} className="text-white" />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${form.challengeType === 'individual' ? 'bg-brand-violet/20' : 'bg-white/5 group-hover:bg-white/8'
                                                }`}>
                                                <Star size={20} className={form.challengeType === 'individual' ? 'text-brand-violet-light' : 'text-white/40'} />
                                            </div>
                                            <h3 className={`font-bold text-base mb-1.5 transition-colors ${form.challengeType === 'individual' ? 'text-white' : 'text-white/70'
                                                }`}>
                                                {t('individual_title')}
                                            </h3>
                                            <p className="text-xs text-white/40 leading-relaxed">
                                                {t('individual_desc')}
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* Group Type */}
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
                                        {t('group_type')}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {GROUP_TYPES.map((gt) => (
                                            <button
                                                key={gt.key}
                                                onClick={() => set('groupType', gt.key)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${form.groupType === gt.key
                                                    ? 'bg-brand-cyan/15 border-brand-cyan/50 text-brand-cyan'
                                                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                                                    }`}
                                            >
                                                {gt.icon}
                                                {gt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Name field — dynamic label */}
                                <AnimatePresence mode="wait">
                                    {form.challengeType !== null && (
                                        <motion.div
                                            key={form.challengeType}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex flex-col gap-2"
                                        >
                                            <label htmlFor="rr-fld-v92" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                                {form.challengeType === 'collective'
                                                    ? t('labels.challenge_name_collective')
                                                    : t('labels.challenge_name_individual')}
                                            </label>
                                            <input
                                                id="rr-fld-v92"
                                                name="rr-fld-v92"
                                                type="text"
                                                autoComplete="one-time-code"
                                                data-lpignore="true"
                                                data-dashlane-ignore="true"
                                                value={form.name}
                                                onChange={e => set('name', e.target.value)}
                                                placeholder={
                                                    form.challengeType === 'collective'
                                                        ? t('placeholders.challenge_name_collective')
                                                        : t('placeholders.challenge_name_individual')
                                                }
                                                className="input-glass text-base"
                                                maxLength={80}
                                            />
                                            <p className="text-xs text-white/20 text-right">{form.name.length}/80</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* ═══ ÉTAPE 2 — L'Objectif ════════════════════════ */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="flex flex-col gap-7"
                            >
                                {/* Récompense */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="rr-fld-k31" className="text-xs font-semibold text-white/40 tracking-wider uppercase flex items-center gap-2">
                                        <Star size={12} className="text-brand-cyan" />
                                        {t('labels.reward')}
                                    </label>
                                    <input
                                        id="rr-fld-k31"
                                        name="rr-fld-k31"
                                        type="text"
                                        autoComplete="one-time-code"
                                        data-lpignore="true"
                                        data-dashlane-ignore="true"
                                        value={form.reward}
                                        onChange={e => set('reward', e.target.value)}
                                        placeholder={t('placeholders.reward')}
                                        className="input-glass"
                                    />
                                </div>

                                {/* Cagnotte cible */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="rr-fld-m29" className="text-xs font-semibold text-white/40 tracking-wider uppercase flex items-center gap-2">
                                        <Target size={12} className="text-brand-violet-light" />
                                        {t('labels.goal_amount')}
                                    </label>
                                    <div className="flex items-center input-glass !py-0 !px-4 focus-within:border-brand-cyan/50 focus-within:ring-3 focus-within:ring-brand-cyan/8 transition-all overflow-hidden group">
                                        <span className="text-white/40 font-bold text-base pr-2 shrink-0 select-none">
                                            $
                                        </span>
                                        <input
                                            id="rr-fld-m29"
                                            name="rr-fld-m29"
                                            type="number"
                                            min={1}
                                            autoComplete="one-time-code"
                                            data-lpignore="true"
                                            data-dashlane-ignore="true"
                                            value={form.goalAmount}
                                            onChange={e => set('goalAmount', e.target.value)}
                                            placeholder={t('placeholders.goal_amount')}
                                            className="flex-1 bg-transparent border-none outline-none py-3.5 text-white placeholder:text-white/20 appearance-none"
                                        />
                                    </div>
                                    <div className="flex items-start gap-2 bg-brand-cyan/5 border border-brand-cyan/15 rounded-xl px-4 py-3 mt-1">
                                        <span className="text-base shrink-0 mt-0.5">💡</span>
                                        <p className="text-xs text-white/50 leading-relaxed">
                                            {t('tips.goal_amount')}
                                        </p>
                                    </div>
                                </div>

                                {/* Amende */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="rr-fld-p77" className="text-xs font-semibold text-white/40 tracking-wider uppercase flex items-center gap-2">
                                        <DollarSign size={12} className="text-red-400" />
                                        {t('labels.penalty_amount')}
                                    </label>
                                    <div className="flex items-center input-glass !py-0 !px-4 focus-within:border-brand-cyan/50 focus-within:ring-3 focus-within:ring-brand-cyan/8 transition-all overflow-hidden group">
                                        <span className="text-white/40 font-bold text-base pr-2 shrink-0 select-none">
                                            $
                                        </span>
                                        <input
                                            id="rr-fld-p77"
                                            name="rr-fld-p77"
                                            type="number"
                                            min={1}
                                            autoComplete="one-time-code"
                                            data-lpignore="true"
                                            data-dashlane-ignore="true"
                                            value={form.penaltyAmount}
                                            onChange={e => set('penaltyAmount', e.target.value)}
                                            placeholder={t('placeholders.penalty_amount')}
                                            className="flex-1 bg-transparent border-none outline-none py-3.5 text-white placeholder:text-white/20 appearance-none"
                                        />
                                    </div>

                                    {/* Live preview */}
                                    {form.goalAmount && form.penaltyAmount && Number(form.penaltyAmount) > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass rounded-xl px-4 py-3 border border-white/8 mt-1"
                                        >
                                            <p className="text-xs text-white/40">
                                                {t('estimation', {
                                                    penalty: form.penaltyAmount,
                                                    fails: Math.ceil(Number(form.goalAmount) / Number(form.penaltyAmount)),
                                                    s: Math.ceil(Number(form.goalAmount) / Number(form.penaltyAmount)) > 1 ? 's' : '',
                                                    goal: form.goalAmount
                                                })}
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ ÉTAPE 3 — Les Règles ════════════════════════ */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="flex flex-col gap-8"
                            >
                                {/* Date de départ */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="rr-fld-d14" className="text-xs font-semibold text-white/40 tracking-wider uppercase flex items-center gap-2">
                                        <CalendarDays size={12} className="text-brand-cyan" />
                                        {t('labels.start_date')}
                                    </label>
                                    <input
                                        id="rr-fld-d14"
                                        name="rr-fld-d14"
                                        type="date"
                                        autoComplete="one-time-code"
                                        data-lpignore="true"
                                        data-dashlane-ignore="true"
                                        value={form.startDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => set('startDate', e.target.value)}
                                        className="input-glass"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                    <p className="text-xs text-white/20">
                                        {t('tips.start_date')}
                                    </p>
                                </div>

                                {/* Validation mode */}
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
                                        {t('labels.validation_rules')}
                                    </p>
                                    <div className="flex flex-col gap-4">
                                        {/* Strict */}
                                        <button
                                            onClick={() => set('validationMode', 'strict')}
                                            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 ${form.validationMode === 'strict'
                                                ? 'border-red-400/60 bg-red-400/5 shadow-lg shadow-red-400/10'
                                                : 'border-white/8 glass hover:border-white/20'
                                                }`}
                                        >
                                            {form.validationMode === 'strict' && (
                                                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-red-400 flex items-center justify-center">
                                                    <CheckCircle size={12} className="text-white" />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${form.validationMode === 'strict' ? 'bg-red-400/20' : 'bg-white/5'
                                                    }`}>
                                                    <Shield size={18} className={form.validationMode === 'strict' ? 'text-red-400' : 'text-white/30'} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-white">{t('modes.strict.title')}</h3>
                                                    <span className="text-xs text-red-400/70 font-medium">{t('modes.strict.subtitle')}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed mb-3">
                                                {t('modes.strict.desc')}
                                            </p>
                                            <div className={`text-xs px-3 py-2 rounded-lg ${form.validationMode === 'strict' ? 'bg-red-400/10 text-red-300/80' : 'bg-white/3 text-white/25'
                                                }`}>
                                                {t('modes.strict.tip')}
                                            </div>
                                        </button>

                                        {/* Flexible */}
                                        <button
                                            onClick={() => set('validationMode', 'flexible')}
                                            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 ${form.validationMode === 'flexible'
                                                ? 'border-brand-cyan/60 bg-brand-cyan/5 shadow-lg shadow-brand-cyan/10'
                                                : 'border-white/8 glass hover:border-white/20'
                                                }`}
                                        >
                                            {form.validationMode === 'flexible' && (
                                                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-brand-cyan flex items-center justify-center">
                                                    <CheckCircle size={12} className="text-brand-black" />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${form.validationMode === 'flexible' ? 'bg-brand-cyan/20' : 'bg-white/5'
                                                    }`}>
                                                    <Clock size={18} className={form.validationMode === 'flexible' ? 'text-brand-cyan' : 'text-white/30'} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-white">{t('modes.flexible.title')}</h3>
                                                    <span className="text-xs text-brand-cyan/70 font-medium">{t('modes.flexible.subtitle')}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed mb-3">
                                                {t('modes.flexible.desc')}
                                            </p>
                                            <div className={`text-xs px-3 py-2 rounded-lg ${form.validationMode === 'flexible' ? 'bg-brand-cyan/10 text-brand-cyan/80' : 'bg-white/3 text-white/25'
                                                }`}>
                                                {t('modes.flexible.tip')}
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Récapitulatif */}
                                {canProceed() && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass rounded-2xl p-5 border border-white/8"
                                    >
                                        <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">{t('summary.title')}</p>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                            <div>
                                                <p className="text-xs text-white/30">{t('summary.type')}</p>
                                                <p className="text-white/80 font-medium">
                                                    {form.challengeType === 'collective' ? `👥 ${t('collective_title')}` : `⭐ ${t('individual_title')}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">{t('summary.name')}</p>
                                                <p className="text-white/80 font-medium truncate">{form.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">{t('summary.reward')}</p>
                                                <p className="text-white/80 font-medium truncate">{form.reward}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">{t('summary.goal')}</p>
                                                <p className="text-brand-cyan font-bold">{form.goalAmount}$</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">{t('summary.penalty')}</p>
                                                <p className="text-red-400 font-bold">{form.penaltyAmount}$</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">{t('summary.start')}</p>
                                                <p className="text-white/80 font-medium">
                                                    {new Date(form.startDate).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                        {/* ═══ ÉTAPE 4 — Ma Couleur ═══════════════════════════ */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="flex flex-col gap-8"
                            >
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
                                        {t('identity.title')}
                                    </p>
                                    <div className="glass border border-white/8 rounded-2xl p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner transition-colors duration-500"
                                                style={{ backgroundColor: `${form.selectedColor}20`, color: form.selectedColor, border: `1px solid ${form.selectedColor}40` }}
                                            >
                                                P
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-base">{t('identity.subtitle')}</h3>
                                                <p className="text-white/40 text-xs">{t('identity.desc')}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                            {COLORS.map((c) => (
                                                <button
                                                    key={c.hex}
                                                    onClick={() => set('selectedColor', c.hex)}
                                                    className={`w-full aspect-square rounded-xl border-2 transition-all duration-300 hover:scale-110 flex items-center justify-center ${form.selectedColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                    title={c.name}
                                                    style={{ backgroundColor: c.hex }}
                                                >
                                                    {form.selectedColor === c.hex && (
                                                        <CheckCircle size={14} className="text-white drop-shadow-md" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8 bg-brand-violet/5 border border-brand-violet/20 rounded-2xl p-6 text-center">
                                        <div className="w-10 h-10 rounded-full bg-brand-violet/20 flex items-center justify-center mx-auto mb-3">
                                            <Zap size={18} className="text-brand-violet-light" fill="currentColor" />
                                        </div>
                                        <h4 className="text-white font-bold mb-1">{t('ready.title')}</h4>
                                        <p className="text-white/40 text-xs px-10">
                                            {t('ready.desc')}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Navigation ───────────────────────────── */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
                    {step > 1 ? (
                        <button
                            onClick={() => goTo(step - 1)}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white transition-colors disabled:opacity-30"
                        >
                            <ArrowLeft size={16} />
                            {t('buttons.back')}
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 4 ? (
                        <button
                            onClick={() => goTo(step + 1)}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all glow-cyan disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {t('buttons.continue')}
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed() || isSubmitting}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
                            style={{
                                background: canProceed() && !isSubmitting
                                    ? 'linear-gradient(135deg, #8B3AF7, #C026D3, #00D4FF)'
                                    : 'rgba(255,255,255,0.05)',
                                boxShadow: canProceed() && !isSubmitting
                                    ? '0 0 30px rgba(139,58,247,0.35)'
                                    : 'none',
                            }}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 slant" />
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                            ) : (
                                <Flame size={16} />
                            )}
                            {isSubmitting ? t('buttons.creating') : t('buttons.create')}
                            {!isSubmitting && <ArrowRight size={16} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
