'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { LogOut, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface UserMenuProps {
    /** locale for links — default 'fr' */
    locale?: string;
    /** login button label */
    loginLabel?: string;
    /** login href */
    loginHref?: string;
}

export default function UserMenu({
    locale = 'fr',
    loginLabel = 'Se connecter',
    loginHref,
}: UserMenuProps) {
    const [user, setUser] = useState<User | null>(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    const resolvedLoginHref = loginHref ?? `/${locale}/login`;

    useEffect(() => {
        // Get initial session
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = async () => {
        setOpen(false);
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    const firstName = user?.user_metadata?.first_name
        ?? user?.email?.split('@')[0]
        ?? 'Mon compte';

    if (loading) {
        return <div className="w-24 h-8 rounded-xl bg-white/5 animate-pulse" />;
    }

    if (!user) {
        return (
            <Link
                href={resolvedLoginHref}
                className="group flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all duration-200 glow-cyan"
            >
                {loginLabel}
            </Link>
        );
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl glass border border-white/10 hover:border-brand-cyan/30 transition-all duration-200"
            >
                {/* Avatar initial */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-violet flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {firstName[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white max-w-[120px] truncate">{firstName}</span>
                <ChevronDown
                    size={14}
                    className={`text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 glass rounded-2xl border border-white/10 py-1.5 shadow-xl shadow-black/30 z-50"
                    >
                        {/* User info */}
                        <div className="px-4 py-2.5 border-b border-white/8 mb-1">
                            <p className="text-xs text-white/30 truncate">{user.email}</p>
                        </div>

                        {/* Paramètres */}
                        <Link
                            href={`/${locale}/settings`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Settings size={15} className="text-white/40" />
                            Paramètres
                        </Link>

                        {/* Déconnexion */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-400/5 transition-colors"
                        >
                            <LogOut size={15} />
                            Déconnexion
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
