'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
    console.log("NAVBAR CHARGÉE");
    const locale = useLocale();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 py-4">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
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

                {/* MENU STATIQUE SANS CONDITIONS */}
                <nav className="flex items-center gap-6">
                    <Link
                        href={`/${locale}/dashboard`}
                        className="text-sm font-bold text-white hover:text-brand-cyan transition-colors"
                    >
                        DASHBOARD
                    </Link>

                    <Link
                        href={`/${locale}/profile`}
                        className="text-sm font-bold text-white hover:text-brand-cyan transition-colors"
                    >
                        PROFIL
                    </Link>

                    <Link
                        href="/en/dashboard"
                        className="text-xs font-black px-3 py-1.5 rounded-lg border border-brand-cyan text-brand-cyan bg-brand-cyan/5"
                    >
                        EN
                    </Link>
                </nav>
            </div>
        </header>
    );
}
