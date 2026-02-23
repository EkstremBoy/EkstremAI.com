'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Send, CheckCircle2 } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function ContactSection() {
    const t = useTranslations('contact');
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');
        // Simulate send (replace with real API call later)
        await new Promise((res) => setTimeout(res, 1200));
        console.log('[Contact Form]', form);
        setStatus('success');
        setForm({ name: '', email: '', message: '' });
    };

    return (
        <section id="contact" className="section-padding relative overflow-hidden">
            {/* Background orb */}
            <div
                aria-hidden
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-cyan/5 blur-[100px] pointer-events-none"
            />

            <div className="max-w-2xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    className="text-center mb-12"
                >
                    <span className="text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-4 block">
                        Contact
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-white/40 text-base">{t('subtitle')}</p>
                </motion.div>

                {/* Form card */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                >
                    <div className="relative glass rounded-3xl p-8 md:p-10 border border-white/8">
                        {/* Top accent */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent rounded-t-3xl" />

                        {status === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-4 py-10 text-center"
                            >
                                <CheckCircle2 size={48} className="text-brand-cyan" />
                                <p className="text-lg font-semibold text-white">{t('success')}</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {/* Name */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="contact-name" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                        {t('name')}
                                    </label>
                                    <input
                                        id="contact-name"
                                        name="name"
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder={t('namePlaceholder')}
                                        className="input-glass"
                                    />
                                </div>

                                {/* Email */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="contact-email" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                        {t('email')}
                                    </label>
                                    <input
                                        id="contact-email"
                                        name="email"
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder={t('emailPlaceholder')}
                                        className="input-glass"
                                    />
                                </div>

                                {/* Message */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="contact-message" className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                                        {t('message')}
                                    </label>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        rows={5}
                                        required
                                        value={form.message}
                                        onChange={handleChange}
                                        placeholder={t('messagePlaceholder')}
                                        className="input-glass resize-none"
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={status === 'sending'}
                                    className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-cyan text-brand-black font-semibold text-sm hover:bg-brand-cyan/90 transition-all duration-200 glow-cyan disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                                >
                                    {status === 'sending' ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full"
                                            />
                                            {t('sending')}
                                        </>
                                    ) : (
                                        <>
                                            {t('send')}
                                            <Send size={15} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
