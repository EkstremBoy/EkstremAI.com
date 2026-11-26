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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">

                <div className="flex items-center gap-6 min-w-0">
                    {/* Logo */}
                    <Link href={`/${locale}`} className="flex items-center min-w-0 group transition-transform hover:scale-[1.02]">
                        <Image
                            src="/brand/logo-horizontal.png"
                            alt="Ekstrem AI"
                            width={267}
                            height={48}
                            className="h-9 w-auto max-w-full object-contain sm:h-10 md:h-12"
                            priority
                        />
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex shrink-0 items-center gap-2 border-l border-white/10 pl-3 sm:gap-5 sm:pl-8">
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
