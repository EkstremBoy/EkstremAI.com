'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Simulated member colors for the calendar demo
const members = [
    { name: 'Alex', color: '#22d3ee' },
    { name: 'Sam', color: '#7c3aed' },
    { name: 'Jordan', color: '#a855f7' },
    { name: 'Morgan', color: '#ec4899' },
    { name: 'Taylor', color: '#f59e0b' },
];

// Generate 28 days of fake calendar data
type DayStatus = 'success' | 'failed' | 'partial' | 'future';

const generateDays = (): { day: number; status: DayStatus; completions: string[] }[] => {
    const today = 18; // simulate "today" as day 18
    return Array.from({ length: 28 }, (_, i) => {
        const day = i + 1;
        if (day > today) return { day, status: 'future', completions: [] };
        if (day === today) return { day, status: 'partial', completions: [members[0].color, members[2].color] };

        // Randomize past days deterministically
        const seed = (day * 7 + 13) % 10;
        const numCompleted = seed < 2 ? 1 : seed < 5 ? 3 : seed < 8 ? 5 : 4;
        const completions = members.slice(0, numCompleted).map((m) => m.color);
        const status: DayStatus = numCompleted === members.length ? 'success' : completions.length === 0 ? 'failed' : 'partial';
        return { day, status, completions };
    });
};

const days = generateDays();

export default function RnRCalendarPreview() {
    const t = useTranslations('riseandreward.calendar');

    const weekdays = [
        t('days.lun'), t('days.mar'), t('days.mer'), t('days.jeu'), t('days.ven'), t('days.sam'), t('days.dim')
    ];

    return (
        <section id="apercu" className="relative section-padding overflow-hidden">
            {/* Background */}
            <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-brand-violet/5 to-transparent pointer-events-none"
            />

            <div className="relative z-10 max-w-6xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Visual Demo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 w-full max-w-2xl"
                    >
                        <div className="relative glass rounded-[2.5rem] border border-white/5 p-4 md:p-8 shadow-2xl">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-1">{t('month_year')}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-brand-cyan animate-pulse" />
                                        <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{t('ongoing')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-4 py-2 border border-white/5">
                                    <div className="text-right">
                                        <p className="text-[10px] text-white/30 uppercase font-bold">{t('members')}</p>
                                        <p className="text-sm font-bold text-white">05</p>
                                    </div>
                                    <div className="w-px h-6 bg-white/10" />
                                    <div>
                                        <p className="text-[10px] text-white/30 uppercase font-bold">{t('penalty')}</p>
                                        <p className="text-sm font-bold text-brand-cyan">5$</p>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-2 md:gap-3 mb-8">
                                {weekdays.map((d) => (
                                    <div key={d} className="text-center text-[10px] md:text-xs font-bold text-white/20 uppercase pb-2">
                                        {d}
                                    </div>
                                ))}
                                {days.map(({ day, status, completions }, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className={`relative aspect-square rounded-xl md:rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${status === 'future'
                                            ? 'bg-white/2 border border-white/5 text-white/10'
                                            : 'bg-white/5 border border-white/10 text-white/80'
                                            }`}
                                    >
                                        <span className="relative z-10">{day}</span>
                                        {/* Colored dots for completions */}
                                        <div className="absolute inset-x-0 bottom-1.5 md:bottom-2.5 flex justify-center gap-0.5 px-1 truncate">
                                            {completions.map((color, ci) => (
                                                <div
                                                    key={ci}
                                                    className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        {/* Status indicator */}
                                        {status === 'success' && (
                                            <div className="absolute -top-1 -right-1 bg-brand-cyan text-brand-black rounded-full p-0.5 shadow-lg">
                                                <CheckCircle2 size={10} />
                                            </div>
                                        )}
                                        {status === 'failed' && (
                                            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg">
                                                <XCircle size={10} />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-4 px-2 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-md bg-brand-cyan/20 text-brand-cyan">
                                        <CheckCircle2 size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">{t('success_all')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-md bg-red-500/20 text-red-500">
                                        <XCircle size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">{t('failed')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-md bg-white/10 text-white/30">
                                        <Clock size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase">{t('future')}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 space-y-8 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-flex px-3 py-1 rounded-full bg-brand-violet/10 text-brand-violet-light text-[11px] font-bold uppercase tracking-widest mb-6">
                                {t('badge')}
                            </span>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.1] mb-6">
                                {t('title')}
                            </h2>
                            <p className="text-lg text-white/50 leading-relaxed max-w-xl mx-auto lg:mx-0">
                                {t('description')}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-3 glass px-5 py-3 rounded-2xl border border-white/5"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-brand-cyan" />
                            <span className="text-sm text-white/60 font-medium">
                                {t('tease')}
                            </span>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
