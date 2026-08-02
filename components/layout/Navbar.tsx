'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import UserMenu from '@/components/auth/UserMenu';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    console.log("NAVBAR CHARGÉE");
    const locale = useLocale();
    const t = useTranslations('nav');
    const pathname = usePathname();

    // Logic to switch locale preservation current path
    const getTargetLocalePath = () => {
        const targetLocale = locale === 'fr' ? 'en' : 'fr';
        // pathname is like /fr/dashboard/rise-reward or /fr
        const segments = pathname.split('/');
        segments[1] = targetLocale;
        return segments.join('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 py-4 glass border-b border-white/5" style={{ zIndex: 9999 }}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

                <div className="flex items-center gap-8">
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

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href={`/${locale}/games`}
                            className="text-sm font-medium text-white/50 hover:text-brand-cyan transition-all"
                        >
                            {t('games')}
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-5 border-l border-white/10 pl-8">
                        {/* BOUTON LANGUE DYNAMIQUE */}
                        <Link
                            href={getTargetLocalePath()}
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
