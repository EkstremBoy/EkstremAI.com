'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
    User,
    Settings,
    LogOut,
    ChevronDown,
    Sparkles,
    Zap
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function UserMenu() {
    const t = useTranslations('auth.menu');
    const locale = useLocale();
    const router = useRouter();
    const supabase = createClient();

    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function getData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', user.id)
                    .single();
                setProfile(prof);
            }
        }
        getData();

        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push(`/${locale}`);
        router.refresh();
    };

    if (!user) {
        return (
            <Link
                href={`/${locale}/login`}
                className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 hover:border-brand-cyan/30 transition-all flex items-center gap-2"
            >
                <Zap size={14} className="text-brand-cyan" />
                DÉMARRER
            </Link>
        );
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl glass border border-white/5 hover:border-brand-cyan/30 transition-all group"
            >
                <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/10">
                    {profile?.avatar_url ? (
                        <Image
                            src={profile.avatar_url}
                            alt="Avatar"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-cyan to-brand-violet flex items-center justify-center text-white font-bold text-xs">
                            {user.email?.[0].toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">
                        {t('default_account')}
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-brand-cyan transition-colors">
                        {(profile?.username || user.email?.split('@')[0])?.toUpperCase()}
                    </span>
                </div>

                <ChevronDown
                    size={14}
                    className={`text-white/20 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 bg-[#0F172A]/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 z-[10000] overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-white/5 mb-2">
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">Session Active</p>
                            <p className="text-xs text-white/60 truncate font-medium">{user.email}</p>
                        </div>

                        <div className="space-y-1">
                            <Link
                                href={`/${locale}/profile`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-brand-cyan/10 text-white/60 hover:text-brand-cyan transition-all group"
                            >
                                <User size={16} />
                                <span className="text-sm font-bold">{t('my_profile')}</span>
                            </Link>

                            <Link
                                href={`/${locale}/riseandreward/profile`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-brand-violet/10 text-white/60 hover:text-brand-violet-light transition-all group"
                            >
                                <Sparkles size={16} />
                                <span className="text-sm font-bold">{t('my_ai_profile')}</span>
                            </Link>

                            <Link
                                href={`/${locale}/settings`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-all group"
                            >
                                <Settings size={16} />
                                <span className="text-sm font-bold">{t('settings')}</span>
                            </Link>

                            <div className="h-px bg-white/5 my-2 mx-4" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all group"
                            >
                                <LogOut size={16} />
                                <span className="text-sm font-bold">{t('logout')}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
