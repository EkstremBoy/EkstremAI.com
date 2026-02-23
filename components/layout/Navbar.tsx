'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
    const t = useTranslations('nav');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const toggleLocale = () => {
        const next = locale === 'fr' ? 'en' : 'fr';
        // Replace locale prefix in pathname
        const segments = pathname.split('/');
        segments[1] = next;
        router.push(segments.join('/'));
    };

    const navLinks = [
        { key: 'projects', href: '#projets' },
        { key: 'vision', href: '#vision' },
        { key: 'blog', href: '#blog' },
        { key: 'contact', href: '#contact' },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? 'glass border-b border-white/5 py-3'
                    : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href={`/${locale}`} className="flex items-center gap-2 group">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-violet flex items-center justify-center text-white font-black text-sm group-hover:scale-110 transition-transform duration-300">
                            E
                        </div>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-violet opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">
                        Ekstrem<span className="gradient-text">AI</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.key}
                            href={link.href}
                            className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 relative group"
                        >
                            {t(link.key as 'projects' | 'vision' | 'blog' | 'contact')}
                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-brand-cyan group-hover:w-full transition-all duration-300" />
                        </a>
                    ))}
                </nav>

                {/* Right actions */}
                <div className="hidden md:flex items-center gap-3">
                    {/* Lang toggle */}
                    <button
                        onClick={toggleLocale}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all duration-200 tracking-wider"
                        aria-label="Toggle language"
                    >
                        {locale === 'fr' ? 'EN' : 'FR'}
                    </button>

                    {/* CTA */}
                    <Link
                        href={`/${locale}/dashboard/rise-reward`}
                        className="relative group px-5 py-2 rounded-xl text-sm font-semibold text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all duration-200 glow-cyan"
                    >
                        <span className="relative z-10">{t('cta')}</span>
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="md:hidden glass border-t border-white/5 overflow-hidden"
                    >
                        <div className="px-6 py-6 flex flex-col gap-5">
                            {navLinks.map((link) => (
                                <a
                                    key={link.key}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                                >
                                    {t(link.key as 'projects' | 'vision' | 'blog' | 'contact')}
                                </a>
                            ))}
                            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                                <button
                                    onClick={toggleLocale}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white transition-all"
                                >
                                    {locale === 'fr' ? 'EN' : 'FR'}
                                </button>
                                <Link
                                    href={`/${locale}/dashboard/rise-reward`}
                                    className="flex-1 text-center px-4 py-2 rounded-xl text-sm font-semibold text-brand-black bg-brand-cyan"
                                >
                                    {t('cta')}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
