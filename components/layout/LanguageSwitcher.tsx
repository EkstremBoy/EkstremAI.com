'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLocale = () => {
        const next = locale === 'fr' ? 'en' : 'fr';
        // Replace locale prefix in pathname
        const segments = pathname.split('/');
        segments[1] = next;
        router.push(segments.join('/'));
    };

    return (
        <button
            onClick={toggleLocale}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all duration-300 tracking-wider glass"
            aria-label="Toggle language"
        >
            {locale === 'fr' ? 'EN' : 'FR'}
        </button>
    );
}
