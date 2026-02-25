'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';

export default function RnRNavbar({ minimal = false }: { minimal?: boolean }) {
    console.log("RnR NAVBAR CHARGÉE");
    const locale = useLocale();

    return (
        <header className="fixed top-0 left-0 right-0 py-4 glass border-b border-white/5" style={{ zIndex: 9999 }}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <Link href={`/${locale}`} className="flex items-center">
                        <Image
                            src="/images/logo.png"
                            alt="EkstremAI"
                            width={150}
                            height={54}
                            className="h-12 w-auto object-contain"
                            priority
                        />
                    </Link>

                    {/* BOUTON EN PERMANENT À CÔTÉ DU LOGO */}
                    <Link
                        href="/en/riseandreward"
                        className="text-xs font-black px-3 py-1.5 rounded-lg border border-brand-cyan text-brand-cyan bg-brand-cyan/5 hover:bg-brand-cyan/10 transition-all"
                    >
                        EN
                    </Link>
                </div>

                {/* MENU STATIQUE SANS CONDITIONS */}
                <nav className="flex items-center gap-8">
                    <Link
                        href={`/${locale}/dashboard`}
                        className="text-xs font-black text-white/50 hover:text-white transition-colors tracking-widest"
                    >
                        DASHBOARD
                    </Link>

                    <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                        <span className="text-xs font-bold text-white/30 truncate max-w-[80px]">PIERRE</span>

                        <Link
                            href={`/${locale}/profile`}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-cyan text-brand-black text-[10px] font-black uppercase tracking-tighter hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                        >
                            <User size={12} />
                            MON PROFIL
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}
