'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

interface UserMenuProps {
    locale?: string;
}

export default function UserMenu({
    locale = 'fr',
}: UserMenuProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function getUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
            } catch (err) {
                console.error("UserMenu error:", err);
            } finally {
                setLoading(false);
            }
        }
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    if (loading) return <div className="w-20 h-8 rounded-lg bg-white/5 animate-pulse" />;

    if (!user) {
        return (
            <Link
                href={`/${locale}/login`}
                className="px-4 py-2 rounded-lg bg-brand-cyan text-brand-black text-sm font-bold"
            >
                CONNEXION
            </Link>
        );
    }

    const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || "PIERRE";

    return (
        <div className="flex items-center gap-3">
            {/* CLIC DIRECT SUR LE NOM POUR LE PROFIL */}
            <Link
                href={`/${locale}/profile`}
                className="text-sm font-black text-white hover:text-brand-cyan transition-colors uppercase tracking-tighter"
            >
                {firstName}
            </Link>

            <Link
                href={`/${locale}/profile`}
                className="p-2 rounded-lg bg-white/5 hover:bg-brand-cyan/20 border border-white/10 text-brand-cyan transition-all"
                title="Mon Profil"
            >
                <UserIcon size={14} />
            </Link>

            <button
                onClick={handleLogout}
                className="p-2 text-white/30 hover:text-red-400 transition-colors"
                title="Déconnexion"
            >
                <LogOut size={16} />
            </button>
        </div>
    );
}
