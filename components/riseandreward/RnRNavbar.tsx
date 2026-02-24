'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';

export default function RnRNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navLinks = [
        { label: 'Comment ça marche', href: '#comment-ca-marche' },
        { label: 'Transparence', href: '#transparence' },
        { label: 'Aperçu', href: '#apercu' },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? 'glass border-b border-white/5 py-3'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo — links back to main site */}
                <Link href="/" className="flex items-center group">
                    <Image
                        src="/images/logo.png"
                        alt="EkstremAI"
                        width={200}
                        height={72}
                        className="h-14 w-auto object-contain -my-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_16px_rgba(0,212,255,0.4)]"
                        priority
                    />
                </Link>

                {/* Rise & Reward label */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-violet/25">
                    <span className="text-xs font-bold text-brand-violet-light tracking-widest uppercase">Rise & Reward</span>
                </div>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-7">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-white/55 hover:text-white transition-colors duration-200 relative group"
                        >
                            {link.label}
                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-brand-cyan group-hover:w-full transition-all duration-300" />
                        </a>
                    ))}
                </nav>

                {/* Right CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        href="/auth/login"
                        className="text-sm font-medium text-white/60 hover:text-white transition-colors px-4 py-2"
                    >
                        Se connecter
                    </Link>
                    <Link
                        href="/auth/register"
                        className="group flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-brand-black bg-brand-cyan hover:bg-brand-cyan/90 transition-all duration-200 glow-cyan"
                    >
                        Commencer
                        <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
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
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="flex gap-3 pt-2 border-t border-white/5">
                                <Link
                                    href="/auth/login"
                                    className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium text-white/70 border border-white/10"
                                >
                                    Se connecter
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-brand-black bg-brand-cyan"
                                >
                                    Commencer
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
