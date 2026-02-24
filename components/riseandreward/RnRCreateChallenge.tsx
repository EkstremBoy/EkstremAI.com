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

// ─── Types ───────────────────────────────────────────────────

type ChallengeType = 'collective' | 'individual' | null;
type ValidationMode = 'strict' | 'flexible' | null;
type GroupType = 'Amis' | 'Famille' | 'Collègues' | 'Autre';

interface FormState {
    challengeType: ChallengeType;
    groupType: GroupType;
    name: string;
    reward: string;
    goalAmount: string;
    penaltyAmount: string;
    startDate: string;
    validationMode: ValidationMode;
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

const STEPS = [
    { number: 1, label: 'Le Défi', icon: <Flame size={14} /> },
    { number: 2, label: "L'Objectif", icon: <Target size={14} /> },
    { number: 3, label: 'Les Règles', icon: <Shield size={14} /> },
];

const GROUP_TYPES: { label: GroupType; icon: React.ReactNode }[] = [
    { label: 'Amis', icon: <Users size={16} /> },
    { label: 'Famille', icon: <Home size={16} /> },
    { label: 'Collègues', icon: <Briefcase size={16} /> },
    { label: 'Autre', icon: <Heart size={16} /> },
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
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<FormState>({
        challengeType: null,
        groupType: 'Amis',
        name: '',
        reward: '',
        goalAmount: '',
        penaltyAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        validationMode: null,
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
        return false;
    };

    const handleCreate = async () => {
        if (!canProceed()) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Utilisateur non connecté');

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

            if (challengeError) throw challengeError;

            // 2. Ajouter le créateur comme membre avec rôle 'admin'
            const { error: memberError } = await supabase
                .from('challenge_members')
                .insert({
                    challenge_id: challenge.id,
                    user_id: user.id,
                    role: 'admin'
                });

            if (memberError) throw memberError;

            // Rediriger vers la page de succès via le invite_code
            router.push(`/riseandreward/succes/${inviteCode}`);
        } catch (err: any) {
            console.error('Erreur lors de la création:', err);
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
                        Créer un nouveau défi
                    </h1>
                    <p className="text-white/40 text-sm mt-2">
                        Configurez votre groupe en 3 étapes simples.
                    </p>
                </div>

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
                                        Dynamique du groupe
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
                                                Défi Commun
                                            </h3>
                                            <p className="text-xs text-white/40 leading-relaxed">
                                                Tout le groupe accomplit la <strong className="text-white/60">même tâche quotidienne</strong>. Simple, unifié, percutant.
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
                                                Défis Personnalisés
                                            </h3>
                                            <p className="text-xs text-white/40 leading-relaxed">
                                                Chaque membre a son <strong className="text-white/60">propre objectif quotidien</strong>, mais la cagnotte est partagée.
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* Group Type */}
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
                                        Type de groupe
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {GROUP_TYPES.map((gt) => (
                                            <button
                                                key={gt.label}
                                                onClick={() => set('groupType', gt.label)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${form.groupType === gt.label
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
                                                    ? 'Quel est le défi quotidien du groupe ?'
                                                    : 'Donnez un nom à votre groupe'}
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
                                                        ? 'ex. 50 push-ups, Zéro Uber Eats...'
                                                        : 'ex. Opération Remise en forme...'
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
                                        Que va-t-on se payer avec la cagnotte ?
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
                                        placeholder="ex. Soirée resto, Billets pour le match..."
                                        className="input-glass"
                                    />
                                </div>

                                {/* Cagnotte cible */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="rr-fld-m29" className="text-xs font-semibold text-white/40 tracking-wider uppercase flex items-center gap-2">
                                        <Target size={12} className="text-brand-violet-light" />
                                        Quel est l&apos;objectif financier ?
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
                                            placeholder="ex. 200"
                                            className="flex-1 bg-transparent border-none outline-none py-3.5 text-white placeholder:text-white/20"
                                        />
                                    </div>
                                    <div className="flex items-start gap-2 bg-brand-cyan/5 border border-brand-cyan/15 rounded-xl px-4 py-3 mt-1">
                                        <span className="text-base shrink-0 mt-0.5">💡</span>
                                        <p className="text-xs text-white/50 leading-relaxed">
                                            N&apos;oubliez pas d&apos;inclure les <strong className="text-white/70">taxes et le pourboire</strong> dans votre cible pour éviter les surprises.
                                        </p>
                                    </div>
                                </div>

                                {/* Amende */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="rr-fld-p77" className="text-xs font-semibold text-white/40 tracking-wider uppercase flex items-center gap-2">
                                        <DollarSign size={12} className="text-red-400" />
                                        Coût d&apos;un échec quotidien
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
                                            placeholder="ex. 2, 5, 10..."
                                            className="flex-1 bg-transparent border-none outline-none py-3.5 text-white placeholder:text-white/20"
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
                                                Estimation — à{' '}
                                                <strong className="text-white/60">{form.penaltyAmount}$/échec</strong>, il faut environ{' '}
                                                <strong className="text-brand-cyan">
                                                    {Math.ceil(Number(form.goalAmount) / Number(form.penaltyAmount))} échec{Math.ceil(Number(form.goalAmount) / Number(form.penaltyAmount)) > 1 ? 's' : ''}
                                                </strong>{' '}
                                                pour remplir la cagnotte de{' '}
                                                <strong className="text-white/60">{form.goalAmount}$</strong>.
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
                                        Date de départ
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
                                        Le défi se termine automatiquement quand la cagnotte est pleine — pas de date de fin fixe.
                                    </p>
                                </div>

                                {/* Validation mode */}
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
                                        Règles de validation
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
                                                    <h3 className="font-bold text-sm text-white">Mode Strict</h3>
                                                    <span className="text-xs text-red-400/70 font-medium">Coupure à minuit</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed mb-3">
                                                Le défi doit être validé le jour même, avant minuit.
                                            </p>
                                            <div className={`text-xs px-3 py-2 rounded-lg ${form.validationMode === 'strict' ? 'bg-red-400/10 text-red-300/80' : 'bg-white/3 text-white/25'
                                                }`}>
                                                ⚡ Idéal pour bâtir une discipline d&apos;acier. Le suivi en temps réel crée une forte dynamique d&apos;équipe.
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
                                                    <h3 className="font-bold text-sm text-white">Mode Flexible</h3>
                                                    <span className="text-xs text-brand-cyan/70 font-medium">Période de grâce de 3 jours</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed mb-3">
                                                Vous avez jusqu&apos;à 3 jours en arrière pour valider un défi complété.
                                            </p>
                                            <div className={`text-xs px-3 py-2 rounded-lg ${form.validationMode === 'flexible' ? 'bg-brand-cyan/10 text-brand-cyan/80' : 'bg-white/3 text-white/25'
                                                }`}>
                                                🏕️ L&apos;honnêteté prime sur la connectivité ! Parfait pour les fins de semaine au chalet, la pêche dans le nord ou les simples oublis.
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
                                        <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Récapitulatif</p>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                            <div>
                                                <p className="text-xs text-white/30">Type</p>
                                                <p className="text-white/80 font-medium">
                                                    {form.challengeType === 'collective' ? '👥 Défi Commun' : '⭐ Défis Personnalisés'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">Nom</p>
                                                <p className="text-white/80 font-medium truncate">{form.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">Récompense</p>
                                                <p className="text-white/80 font-medium truncate">{form.reward}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">Cagnotte cible</p>
                                                <p className="text-brand-cyan font-bold">{form.goalAmount}$</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">Amende/échec</p>
                                                <p className="text-red-400 font-bold">{form.penaltyAmount}$</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30">Départ</p>
                                                <p className="text-white/80 font-medium">
                                                    {new Date(form.startDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
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
                            Retour
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => goTo(step + 1)}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all glow-cyan disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            Continuer
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            disabled={!canProceed() || isSubmitting}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                                background: canProceed() && !isSubmitting
                                    ? 'linear-gradient(135deg, #8B3AF7, #C026D3, #00D4FF)'
                                    : 'rgba(255,255,255,0.05)',
                                boxShadow: canProceed() && !isSubmitting
                                    ? '0 0 30px rgba(139,58,247,0.35)'
                                    : 'none',
                            }}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                            ) : (
                                <Flame size={16} />
                            )}
                            {isSubmitting ? 'Création en cours...' : 'Lancer le défi !'}
                            {!isSubmitting && <ArrowRight size={16} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
