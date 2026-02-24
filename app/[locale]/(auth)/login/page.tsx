'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const t = useTranslations('login');
    const locale = useLocale();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            router.push('/riseandreward');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 animated-bg relative overflow-hidden">
            {/* Orbs */}
            <div aria-hidden className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-violet/15 blur-[120px] pointer-events-none" />
            <div aria-hidden className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-brand-cyan/5 blur-[80px] pointer-events-none" />

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
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent rounded-t-3xl" />

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-cyan border border-brand-cyan/20 rounded-full px-3 py-1.5 bg-brand-cyan/5 mb-4">
                            <Zap size={11} />
                            Rise & Reward
                        </div>
                        <h1 className="text-2xl font-extrabold text-white">{t('title')}</h1>
                        <p className="text-sm text-white/40 mt-1">{t('subtitle')}</p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        {/* Email */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="login-email" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                {t('email')}
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vous@exemple.com"
                                className="input-glass"
                            />
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="login-password" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                {t('password')}
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-glass pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
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
                            className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-cyan text-brand-black font-semibold text-sm hover:bg-brand-cyan/90 transition-all duration-200 glow-cyan disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full"
                                />
                            ) : t('submit')}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-xs text-white/30 mt-6">
                        {t('noAccount')}{' '}
                        <Link href={`/${locale}/signup`} className="text-brand-cyan hover:text-brand-cyan/80 transition-colors font-medium">
                            {t('signUp')}
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
