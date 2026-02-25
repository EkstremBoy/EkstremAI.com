'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import UserMenu from '@/components/auth/UserMenu';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

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
                <Link href={`/${locale}`} className="flex items-center group">
                    <Image
                        src="/images/logo.png"
                        alt="EkstremAI"
                        width={200}
                        height={72}
                        className="h-16 w-auto object-contain -my-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_16px_rgba(0,212,255,0.4)]"
                        priority
                    />
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
                <div className="hidden md:flex items-center gap-4">
                    <Link
                        href="/en/dashboard"
                        className="text-xs font-black px-3 py-1.5 rounded-lg border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 transition-all"
                    >
                        EN
                    </Link>
                    <UserMenu locale={locale} />
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
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <Link
                                    href="/en/dashboard"
                                    className="text-xs font-black px-3 py-1.5 rounded-lg border border-brand-cyan/30 text-brand-cyan"
                                >
                                    EN
                                </Link>
                                <UserMenu locale={locale} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
