'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import UserMenu from '@/components/auth/UserMenu';

export default function RnRNavbar({ minimal = false }: { minimal?: boolean }) {
    console.log("RnR NAVBAR CHARGÉE");
    const locale = useLocale();

    return (
        <header className="fixed top-0 left-0 right-0 py-4 glass border-b border-white/5" style={{ zIndex: 9999 }}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <Link href={`/${locale}`} className="flex items-center group transition-transform hover:scale-[1.02]">
                        <Image
                            src="/images/logo.png"
                            alt="EkstremAI"
                            width={150}
                            height={54}
                            className="h-12 w-auto object-contain"
                            priority
                        />
                    </Link>
                </div>

                <div className="flex items-center gap-8">
                    {!minimal && (
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                href={`/${locale}/dashboard`}
                                className="text-[10px] font-black text-white/40 hover:text-brand-cyan transition-colors tracking-[0.2em] uppercase"
                            >
                                Dashboard
                            </Link>
                        </nav>
                    )}

                    <div className="flex items-center gap-5 border-l border-white/10 pl-8">
                        {/* BOUTON LANGUE À DROITE */}
                        <Link
                            href={locale === 'fr' ? '/en/riseandreward' : '/fr/riseandreward'}
                            className="text-[10px] font-black px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-brand-cyan hover:border-brand-cyan/30 transition-all uppercase tracking-widest"
                        >
                            {locale === 'fr' ? 'EN' : 'FR'}
                        </Link>

                        <UserMenu />
                    </div>
                </div>
            </div>
        </header>
    );
}
