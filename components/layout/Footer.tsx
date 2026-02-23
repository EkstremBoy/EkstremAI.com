'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';

export default function Footer() {
    const t = useTranslations('footer');
    const year = new Date().getFullYear();

    return (
        <footer className="relative border-t border-white/5 py-12 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Brand */}
                <div className="flex flex-col items-center md:items-start gap-1">
                    <span className="font-bold text-base tracking-tight">
                        Ekstrem<span className="gradient-text">AI</span>
                    </span>
                    <span className="text-xs text-white/30">{t('tagline')}</span>
                </div>

                {/* Center links */}
                <div className="flex items-center gap-6 text-xs text-white/30">
                    <Link href="#projets" className="hover:text-white/60 transition-colors">Projets</Link>
                    <Link href="#vision" className="hover:text-white/60 transition-colors">Vision</Link>
                    <Link href="#contact" className="hover:text-white/60 transition-colors">Contact</Link>
                </div>

                {/* Right: social + copyright */}
                <div className="flex items-center gap-4">
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
                    >
                        <Github size={16} />
                    </a>
                    <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter / X"
                        className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
                    >
                        <Twitter size={16} />
                    </a>
                    <span className="text-xs text-white/20">
                        © {year} EkstremAI — {t('rights')}
                    </span>
                </div>
            </div>
        </footer>
    );
}
