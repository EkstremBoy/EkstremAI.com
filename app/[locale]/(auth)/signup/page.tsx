'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
    const t = useTranslations('signup');
    const locale = useLocale();
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirm) {
            setError(t('errorMatch'));
            return;
        }

        if (password.length < 8) {
            setError(t('errorShort'));
            return;
        }

        setLoading(true);
        const supabase = createClient();

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Le prénom est stocké dans user_metadata — le trigger handle_new_user
                // utilise la partie avant @ de l'email comme username par défaut dans profiles.
                // On passera le prénom en metadata pour qu'il soit disponible via auth.users.
                data: { first_name: firstName.trim() },
                emailRedirectTo: `${window.location.origin}/riseandreward`,
            },
        });

        setLoading(false);

        if (authError) {
            setError(authError.message);
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 animated-bg relative overflow-hidden">
                <div aria-hidden className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-cyan/10 blur-[120px] pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md text-center"
                >
                    <div className="relative glass rounded-3xl p-10 border border-white/8">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent rounded-t-3xl" />
                        <div className="flex justify-center mb-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-brand-violet/20 flex items-center justify-center">
                                <CheckCircle size={32} className="text-brand-cyan" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mb-3">{t('successTitle')}</h2>
                        <p className="text-sm text-white/50 leading-relaxed mb-8">{t('successBody')}</p>
                        <Link
                            href={`/${locale}/login`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-cyan text-brand-black font-semibold text-sm hover:bg-brand-cyan/90 transition-all glow-cyan"
                        >
                            {t('goLogin')}
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 animated-bg relative overflow-hidden">
            {/* Orbs */}
            <div aria-hidden className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-violet/15 blur-[120px] pointer-events-none" />
            <div aria-hidden className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-brand-cyan/5 blur-[80px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href={`/${locale}`} className="inline-flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-violet flex items-center justify-center text-white font-black text-xl">
                            E
                        </div>
                        <span className="font-bold text-xl tracking-tight">
                            Ekstrem<span className="gradient-text">AI</span>
                        </span>
                    </Link>
                </div>

                {/* Card */}
                <div className="relative glass rounded-3xl p-8 border border-white/8">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-violet/40 to-transparent rounded-t-3xl" />

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-violet-light border border-brand-violet/20 rounded-full px-3 py-1.5 bg-brand-violet/5 mb-4">
                            <Zap size={11} className="text-brand-cyan" />
                            Rise &amp; Reward
                        </div>
                        <h1 className="text-2xl font-extrabold text-white">{t('title')}</h1>
                        <p className="text-sm text-white/40 mt-1">{t('subtitle')}</p>
                    </div>

                    <form onSubmit={handleSignUp} className="flex flex-col gap-5">
                        {/* Prénom */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="signup-firstname" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                {t('firstName')}
                            </label>
                            <input
                                id="signup-firstname"
                                type="text"
                                required
                                autoComplete="given-name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder={t('firstNamePlaceholder')}
                                className="input-glass"
                            />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="signup-email" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                {t('email')}
                            </label>
                            <input
                                id="signup-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vous@exemple.com"
                                className="input-glass"
                            />
                        </div>

                        {/* Mot de passe */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="signup-password" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                {t('password')}
                            </label>
                            <div className="relative">
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-glass pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                    aria-label="Afficher/masquer le mot de passe"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmation */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="signup-confirm" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                {t('confirm')}
                            </label>
                            <div className="relative">
                                <input
                                    id="signup-confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    autoComplete="new-password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-glass pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                    aria-label="Afficher/masquer la confirmation"
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Erreur */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-red-400 text-center glass rounded-xl px-4 py-3 border border-red-400/20"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-semibold text-sm hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : t('submit')}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-xs text-white/30 mt-6">
                        {t('hasAccount')}{' '}
                        <Link href={`/${locale}/login`} className="text-brand-cyan hover:text-brand-cyan/80 transition-colors font-medium">
                            {t('login')}
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
