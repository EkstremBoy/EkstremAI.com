'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, Users, CalendarDays, Zap,
    Flame, Award, ShieldCheck, Timer,
    ChevronLeft, Plus, MessageSquare
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

interface Profile {
    id: string;
    username: string;
    first_name: string | null;
    color: string;
}

interface Member {
    user_id: string;
    challenge_id: string;
    joined_at: string;
    generous_amount: number;
    profiles: Profile;
}

interface Log {
    user_id: string;
    target_date: string;
    completed_at: string | null;
    status: 'success' | 'failed';
}

interface Challenge {
    id: string;
    name: string;
    challenge_type: string;
    penalty_amount: number;
    goal_amount: number;
    created_at: string;
}

interface Props {
    challenge: Challenge;
    members: Member[];
    initialLogs: Log[];
}

export default function RnRChallengeDetails({ challenge, members, initialLogs }: Props) {
    const t = useTranslations('riseandreward');
    const locale = useLocale();

    // ─── BADGES & STATS LOGIC ──────────────────────────────────────

    const stats = useMemo(() => {
        const now = new Date();
        const memberStats = members.map(member => {
            const userLogs = initialLogs
                .filter(l => l.user_id === member.user_id)
                .sort((a, b) => new Date(b.target_date).getTime() - new Date(a.target_date).getTime());

            // 1. Current Streak calculation
            let currentStreak = 0;
            const sortedSuccessDates = userLogs
                .filter(l => l.status === 'success')
                .map(l => l.target_date);

            // Basic streak: consecutive days from today/yesterday
            // (Simplified for this UI demo, can be improved with date diff logic)
            for (let i = 0; i < sortedSuccessDates.length; i++) {
                currentStreak++;
            }

            // 2. Total Penalties (Contribution)
            const totalPenalties = userLogs.filter(l => l.status === 'failed').length * Number(challenge.penalty_amount);

            // 3. Unstoppable Badge (Never failed)
            const hasFailed = userLogs.some(l => l.status === 'failed');
            const isInarretable = !hasFailed && userLogs.length > 0;

            return {
                userId: member.user_id,
                currentStreak,
                totalPenalties,
                isInarretable
            };
        });

        // 4. Early Bird logic
        const dateGroups: Record<string, Log[]> = {};
        initialLogs.forEach(log => {
            if (!log.completed_at) return;
            if (!dateGroups[log.target_date]) dateGroups[log.target_date] = [];
            dateGroups[log.target_date].push(log);
        });

        const earlyBirdTally: Record<string, number> = {};
        Object.values(dateGroups).forEach(group => {
            const earliest = group.sort((a, b) =>
                new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime()
            )[0];
            if (earliest) {
                earlyBirdTally[earliest.user_id] = (earlyBirdTally[earliest.user_id] || 0) + 1;
            }
        });

        const maxEarlyBirdCount = Math.max(0, ...Object.values(earlyBirdTally));
        const maxStreakValue = Math.max(0, ...memberStats.map(s => s.currentStreak));

        return memberStats.map(s => ({
            ...s,
            isLongestStreak: s.currentStreak > 0 && s.currentStreak === maxStreakValue,
            isEarlyBird: earlyBirdTally[s.userId] > 0 && earlyBirdTally[s.userId] === maxEarlyBirdCount
        }));
    }, [members, initialLogs, challenge]);

    // ─── RENDER ───────────────────────────────────────────────────

    return (
        <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/${locale}/riseandreward`}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">
                            {challenge.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-1 text-white/40 text-sm font-medium">
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-violet/10 text-brand-violet-light border border-brand-violet/20 text-[10px] uppercase font-bold tracking-wider">
                                {challenge.challenge_type}
                            </span>
                            <span>•</span>
                            <span>{challenge.penalty_amount}$ / {t('dashboard.view') === 'Voir' ? 'échec' : 'fail'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-white/60 font-bold hover:bg-white/10 transition-all">
                        <MessageSquare size={18} />
                        <span className="hidden md:inline">Chat</span>
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-cyan text-brand-black font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)]">
                        <Plus size={18} />
                        <span className="hidden md:inline">Log Journée</span>
                    </button>
                </div>
            </div>

            {/* Members Section */}
            <div className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                    <Users className="text-brand-cyan" size={20} />
                    <h2 className="text-xl font-black text-white uppercase tracking-widest italic">{t('success.members')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {members.map((member) => {
                        const mStats = stats.find(s => s.userId === member.user_id);
                        return (
                            <motion.div
                                key={member.user_id}
                                whileHover={{ y: -5 }}
                                className="glass rounded-[2rem] p-6 border border-white/8 relative overflow-hidden group"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center relative shadow-lg"
                                        style={{ backgroundColor: `${member.profiles.color}20`, border: `2px solid ${member.profiles.color}` }}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full absolute -top-1 -right-1 border-2 border-[#030712] shadow-sm"
                                            style={{ backgroundColor: member.profiles.color }}
                                        />
                                        <span className="text-xl font-black" style={{ color: member.profiles.color }}>
                                            {(member.profiles.first_name || member.profiles.username).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white text-lg">
                                            {member.profiles.first_name || member.profiles.username}
                                        </h3>
                                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                                            Membre
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                                        <div className="flex items-center gap-2 text-white/40">
                                            <Flame size={14} className="text-orange-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Streak</span>
                                        </div>
                                        <span className="font-black text-white italic">{mStats?.currentStreak || 0}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                                        <div className="flex items-center gap-2 text-white/40">
                                            <Zap size={14} className="text-brand-cyan" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Cagnotte</span>
                                        </div>
                                        <span className="font-black text-brand-cyan italic">
                                            {(mStats?.totalPenalties || 0) + Number(member.generous_amount)}$
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        {mStats?.isInarretable && (
                                            <div className="group/badge relative">
                                                <div className="p-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30">
                                                    <ShieldCheck size={16} />
                                                </div>
                                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-[10px] text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity">Inarrêtable</span>
                                            </div>
                                        )}
                                        {mStats?.isLongestStreak && (
                                            <div className="group/badge relative">
                                                <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                                    <Flame size={16} />
                                                </div>
                                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-[10px] text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity">Max Streak</span>
                                            </div>
                                        )}
                                        {mStats?.isEarlyBird && (
                                            <div className="group/badge relative">
                                                <div className="p-2 rounded-lg bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                                                    <Timer size={16} />
                                                </div>
                                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-[10px] text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity">Lève-tôt</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: member.profiles.color }} />
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Calendar Section */}
            <div className="mb-20">
                <div className="flex items-center gap-3 mb-8">
                    <CalendarDays className="text-brand-cyan" size={20} />
                    <h2 className="text-xl font-black text-white uppercase tracking-widest italic">Calendrier de discipline</h2>
                </div>

                <div className="glass rounded-[2.5rem] border border-white/5 p-8 shadow-2xl overflow-hidden relative">
                    <div className="grid grid-cols-7 gap-3">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-white/20 uppercase pb-4 tracking-tighter">{d}</div>
                        ))}
                        {Array.from({ length: 31 }, (_, i) => {
                            const day = i + 1;
                            const targetDateStr = `2024-03-${day.toString().padStart(2, '0')}`; // Static month for demo
                            const dayLogs = initialLogs.filter(l => l.target_date === targetDateStr);
                            const allSuccess = dayLogs.length === members.length && dayLogs.every(l => l.status === 'success');
                            const hasFail = dayLogs.some(l => l.status === 'failed');

                            return (
                                <div key={i} className="relative aspect-square glass rounded-2xl flex flex-col items-center justify-center border border-white/5 group/day transition-colors hover:border-white/20">
                                    <span className="text-sm font-black text-white/40 group-hover/day:text-white transition-colors">{day}</span>
                                    <div className="flex gap-0.5 mt-2">
                                        {dayLogs.map((l, li) => {
                                            const m = members.find(mem => mem.user_id === l.user_id);
                                            return (
                                                <div
                                                    key={li}
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{
                                                        backgroundColor: m?.profiles.color,
                                                        opacity: l.status === 'success' ? 1 : 0.3,
                                                        boxShadow: l.status === 'success' ? `0 0 8px ${m?.profiles.color}` : 'none'
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                    {allSuccess && (
                                        <div className="absolute -top-1 -right-1 bg-brand-cyan text-brand-black rounded-full p-0.5 shadow-lg border-2 border-[#030712]">
                                            <Award size={10} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

