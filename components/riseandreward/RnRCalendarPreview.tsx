'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

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

const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function RnRCalendarPreview() {
    return (
        <section id="apercu" className="relative section-padding overflow-hidden">
            {/* Background */}
            <div
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,58,247,0.1), transparent)' }}
            />

            <div className="relative z-10 max-w-6xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-14"
                >
                    <p className="text-sm font-semibold tracking-[0.2em] uppercase text-brand-violet-light/70 mb-3">
                        Aperçu de la plateforme
                    </p>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                        Le calendrier{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #00D4FF, #8B3AF7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            de groupe
                        </span>
                    </h2>
                    <p className="mt-4 text-white/45 text-lg max-w-xl mx-auto">
                        Chaque couleur représente un membre. D&apos;un coup d&apos;œil, vous savez qui a réussi, qui a raté, et dans quel ordre chacun a complété son défi.
                    </p>
                </motion.div>

                {/* Calendar card */}
                <motion.div
                    initial={{ opacity: 0, y: 32, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative rounded-3xl overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        backdropFilter: 'blur(24px)',
                    }}
                >
                    {/* Calendar header */}
                    <div
                        className="flex items-center justify-between px-8 py-5 border-b border-white/5"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                        <div>
                            <h3 className="text-white font-bold text-lg">🏆 Défi Cardio Février</h3>
                            <p className="text-white/40 text-xs mt-0.5">30 min d&apos;exercice • 5 membres • Pénalité : 5$</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                            <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                            <span className="text-brand-cyan text-xs font-semibold">En cours</span>
                        </div>
                    </div>

                    {/* Member legend */}
                    <div className="flex flex-wrap items-center gap-3 px-8 py-4 border-b border-white/5">
                        {members.map((m) => (
                            <div key={m.name} className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                                <span className="text-white/55 text-xs font-medium">{m.name}</span>
                            </div>
                        ))}
                        <div className="ml-auto flex items-center gap-4 text-xs text-white/30">
                            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400" /> Tous réussi</span>
                            <span className="flex items-center gap-1"><XCircle size={12} className="text-rose-400" /> Échec(s)</span>
                            <span className="flex items-center gap-1"><Clock size={12} className="text-white/30" /> À venir</span>
                        </div>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-px px-8 pt-4 pb-2">
                        {weekdays.map((d) => (
                            <div key={d} className="text-center text-xs font-semibold text-white/25 tracking-wider uppercase">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-2 px-8 pb-8 pt-1">
                        {/* Offset for first day (Tuesday = index 1) */}
                        <div />

                        {days.map(({ day, status, completions }, idx) => {
                            const isFuture = status === 'future';
                            const isToday = day === 18;

                            return (
                                <motion.div
                                    key={day}
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.015, duration: 0.35 }}
                                    className="relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 cursor-default group overflow-hidden"
                                    style={{
                                        background: isFuture
                                            ? 'rgba(255,255,255,0.02)'
                                            : isToday
                                                ? 'rgba(0,212,255,0.06)'
                                                : 'rgba(255,255,255,0.04)',
                                        border: isToday
                                            ? '1px solid rgba(0,212,255,0.3)'
                                            : '1px solid rgba(255,255,255,0.04)',
                                    }}
                                >
                                    {/* Day number */}
                                    <span className={`text-xs font-bold leading-none ${isFuture ? 'text-white/15' : isToday ? 'text-brand-cyan' : 'text-white/60'}`}>
                                        {day}
                                    </span>

                                    {/* Color dots (member completions) */}
                                    {!isFuture && completions.length > 0 && (
                                        <div className="flex flex-wrap gap-[2px] justify-center max-w-[90%]">
                                            {completions.map((color, ci) => (
                                                <div
                                                    key={ci}
                                                    className="w-2 h-2 rounded-full"
                                                    style={{
                                                        backgroundColor: color,
                                                        boxShadow: `0 0 4px ${color}80`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Status indicator */}
                                    {!isFuture && (
                                        <div
                                            className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    status === 'success'
                                                        ? '#34d399'
                                                        : status === 'partial'
                                                            ? '#f59e0b'
                                                            : '#f87171',
                                                boxShadow:
                                                    status === 'success'
                                                        ? '0 0 6px rgba(52,211,153,0.6)'
                                                        : status === 'partial'
                                                            ? '0 0 6px rgba(245,158,11,0.6)'
                                                            : '0 0 6px rgba(248,113,113,0.6)',
                                            }}
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Fake "blur" badge overlay to tease the app */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-max">
                        <div
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white/80"
                            style={{
                                background: 'rgba(139,58,247,0.15)',
                                border: '1px solid rgba(139,58,247,0.3)',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            ✨ Aperçu interactif disponible après inscription
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
