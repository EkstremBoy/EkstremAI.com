'use client';

import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Lock, Globe, User } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function SettingsPage() {
    const t = useTranslations('settings_page');
    const tMenu = useTranslations('auth.menu');
    const locale = useLocale();

    const sections = [
        { id: 'profile', icon: User, label: tMenu('my_profile'), href: `/${locale}/profile` },
        { id: 'notifications', icon: Bell, label: t('notifications'), href: '#' },
        { id: 'security', icon: Lock, label: t('security'), href: '#' },
    ];

    return (
        <main className="min-h-screen relative bg-brand-black">
            <Navbar />

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20">
                            <SettingsIcon className="text-brand-cyan" size={28} />
                        </div>
                        <h1 className="text-4xl font-extrabold text-white">
                            {t('title')}
                        </h1>
                    </div>
                    <p className="text-white/40 text-lg">
                        {t('subtitle')}
                    </p>
                </motion.div>

                <div className="grid gap-4">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Link
                                href={section.href}
                                className="group flex items-center justify-between p-6 glass rounded-2xl border border-white/5 hover:border-brand-cyan/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-brand-cyan/10 group-hover:border-brand-cyan/20 transition-colors">
                                        <section.icon className="text-white/60 group-hover:text-brand-cyan transition-colors" size={20} />
                                    </div>
                                    <span className="text-lg font-medium text-white/80 group-hover:text-white transition-colors">
                                        {section.label}
                                    </span>
                                </div>
                                <div className="text-white/20 group-hover:text-brand-cyan transition-colors">
                                    →
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 p-8 glass rounded-3xl border border-white/5 bg-red-500/5">
                    <h3 className="text-red-400 font-bold mb-2">{t('danger_zone')}</h3>
                    <p className="text-white/40 text-sm mb-6">
                        {t('danger_zone_desc')}
                    </p>
                    <button className="px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-semibold text-sm">
                        {t('delete_account')}
                    </button>
                </div>
            </div>

            <Footer />
        </main>
    );
}
