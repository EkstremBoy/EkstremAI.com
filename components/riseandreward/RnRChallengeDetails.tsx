'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, Users, CalendarDays, Zap,
    Flame, Award, ShieldCheck, Timer,
    ChevronLeft, Plus, MessageSquare, Lock
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
    max_members: number;
    is_strict_mode: boolean;
    created_at: string;
}

interface Props {
    challenge: Challenge;
    members: Member[];
    initialLogs: Log[];
}

export default function RnRChallengeDetails({ challenge, members: initialMembers, initialLogs }: Props) {
    const t = useTranslations('riseandreward');
    const locale = useLocale();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        getUserId();
    }, []);

    // ─── REORDER MEMBERS (Current user first) ───────────────────
    const orderedMembers = useMemo(() => {
        if (!currentUserId) return initialMembers;
        const currentUserMember = initialMembers.find(m => m.user_id === currentUserId);
        if (!currentUserMember) return initialMembers;
        const otherMembers = initialMembers.filter(m => m.user_id !== currentUserId);
        return [currentUserMember, ...otherMembers];
    }, [initialMembers, currentUserId]);

    // ─── BADGES & STATS LOGIC ──────────────────────────────────────

    const stats = useMemo(() => {
        const now = new Date();
        const memberStats = orderedMembers.map(member => {
            const userLogs = initialLogs
                .filter(l => l.user_id === member.user_id)
                .sort((a, b) => new Date(b.target_date).getTime() - new Date(a.target_date).getTime());

            // 1. Current Streak calculation (Success only)
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
    }, [orderedMembers, initialLogs, challenge]);

    // ─── CALENDAR LOGIC (Feb 2026) ──────────────────────────────
    const calendarData = useMemo(() => {
        const year = 2026;
        const month = 1; // 0-indexed, Jan=0, Feb=1
        const daysInMonth = 28;

        // Feb 1st 2026 is a Sunday (index 6 if Mon=0, Sun=6)
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        return {
            year,
            monthName: 'Février',
            daysInMonth,
            startPadding
        };
    }, []);

    const todayNormalized = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const twoDaysAgo = useMemo(() => {
        const d = new Date(todayNormalized);
        d.setDate(d.getDate() - 2);
        return d;
    }, [todayNormalized]);

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
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Users className="text-brand-cyan" size={20} />
                        <h2 className="text-xl font-black text-white uppercase tracking-widest italic">
                            {t('details.members_title') || 'Membres du groupe'}
                        </h2>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-bold tracking-widest">
                        {orderedMembers.length}/{challenge.max_members || 8}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {orderedMembers.map((member) => {
                        const mStats = stats.find(s => s.userId === member.user_id);
                        const isPierre = member.user_id === currentUserId;
                        const profile = member.profiles || { first_name: 'Utilisateur', username: 'user', color: '#6366f1' };

                        return (
                            <motion.div
                                key={member.user_id}
                                whileHover={{ y: -5 }}
                                className={`glass rounded-[2rem] p-6 border ${isPierre ? 'border-brand-cyan/40 bg-brand-cyan/5' : 'border-white/8'} relative overflow-hidden group`}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center relative shadow-lg"
                                        style={{ backgroundColor: `${profile.color}20`, border: `2px solid ${profile.color}` }}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full absolute -top-1 -right-1 border-2 border-[#030712] shadow-sm"
                                            style={{ backgroundColor: profile.color }}
                                        />
                                        <span className="text-xl font-black" style={{ color: profile.color }}>
                                            {(profile.first_name || profile.username).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white text-lg">
                                            {profile.first_name || profile.username}
                                            {isPierre && <span className="ml-2 text-[10px] text-brand-cyan font-bold uppercase tracking-widest">(Moi)</span>}
                                        </h3>
                                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                                            {t('details.member_role') || 'Membre'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                                        <div className="flex items-center gap-2 text-white/40">
                                            <Flame size={14} className="text-orange-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{t('details.stats.streak') || 'Streak'}</span>
                                        </div>
                                        <span className="font-black text-white italic">{mStats?.currentStreak || 0}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                                        <div className="flex items-center gap-2 text-white/40">
                                            <Zap size={14} className="text-brand-cyan" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{t('details.stats.pool') || 'Cagnotte'}</span>
                                        </div>
                                        <span className="font-black text-brand-cyan italic">
                                            {(mStats?.totalPenalties || 0) + Number(member.generous_amount || 0)}$
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 min-h-[38px]">
                                        {mStats?.isInarretable && (
                                            <div className="group/badge relative">
                                                <div className="p-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30">
                                                    <ShieldCheck size={16} />
                                                </div>
                                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-[10px] text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity">{t('details.badges.unstoppable') || 'Inarrêtable'}</span>
                                            </div>
                                        )}
                                        {mStats?.isLongestStreak && (
                                            <div className="group/badge relative">
                                                <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                                    <Flame size={16} />
                                                </div>
                                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-[10px] text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity">{t('details.badges.max_streak') || 'Max Streak'}</span>
                                            </div>
                                        )}
                                        {mStats?.isEarlyBird && (
                                            <div className="group/badge relative">
                                                <div className="p-2 rounded-lg bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                                                    <Timer size={16} />
                                                </div>
                                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-[10px] text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity">{t('details.badges.early_bird') || 'Lève-tôt'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: profile.color }} />
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Calendar Section */}
            <div className="mb-20">
                <div className="flex items-center gap-3 mb-8">
                    <CalendarDays className="text-brand-cyan" size={20} />
                    <h2 className="text-xl font-black text-white uppercase tracking-widest italic">{t('details.calendar_title') || 'Calendrier de discipline'}</h2>
                    <span className="ml-auto text-xs font-bold text-white/20 uppercase tracking-[0.2em]">{calendarData.monthName} {calendarData.year}</span>
                </div>

                <div className="glass rounded-[2.5rem] border border-white/5 p-8 shadow-2xl overflow-hidden relative">
                    <div className="grid grid-cols-7 gap-3">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-white/20 uppercase pb-4 tracking-tighter">{d}</div>
                        ))}

                        {/* Start Padding */}
                        {Array.from({ length: calendarData.startPadding }).map((_, i) => (
                            <div key={`pad-${i}`} className="aspect-[1.3/1]" />
                        ))}

                        {/* Actual Days */}
                        {Array.from({ length: calendarData.daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const targetDateStr = `${calendarData.year}-02-${day.toString().padStart(2, '0')}`;
                            const targetDate = new Date(targetDateStr);

                            // Logic helpers
                            const isFuture = targetDate > todayNormalized;
                            const isLocked = challenge.is_strict_mode
                                ? targetDate < todayNormalized
                                : targetDate < twoDaysAgo;

                            // Get logs for this day and sort by completion time (fastest first)
                            const dayLogs = initialLogs
                                .filter(l => l.target_date === targetDateStr)
                                .sort((a, b) => {
                                    if (!a.completed_at) return 1; // Incomplete logs last
                                    if (!b.completed_at) return -1; // Incomplete logs last
                                    return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
                                });

                            const allSuccess = dayLogs.length === orderedMembers.length && dayLogs.length > 0 && dayLogs.every(l => l.status === 'success');

                            return (
                                <motion.div
                                    key={i}
                                    whileHover={!isFuture && !isLocked ? { scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' } : {}}
                                    className={`relative aspect-[1.3/1] glass rounded-2xl flex flex-col items-center justify-center border transition-all overflow-hidden ${isFuture
                                            ? 'border-white/2 opacity-20 pointer-events-none grayscale'
                                            : 'border-white/5 hover:bg-white/2'
                                        } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    {/* Perfect Centering - Flex Column with gap */}
                                    <div className="flex flex-col items-center justify-center gap-1.5 h-full w-full">
                                        <span className={`text-sm font-black transition-colors ${isFuture ? 'text-white/20' : 'text-white/40 group-hover:text-white'}`}>
                                            {day}
                                        </span>

                                        {/* Completion Dots - Ordered left to right */}
                                        <div className="flex justify-center items-center gap-1 h-2">
                                            {!isFuture && dayLogs.map((l, li) => {
                                                const m = orderedMembers.find(mem => mem.user_id === l.user_id);
                                                const color = m?.profiles?.color || '#ffffff';
                                                return (
                                                    <div
                                                        key={li}
                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{
                                                            backgroundColor: color,
                                                            opacity: l.status === 'success' ? 1 : 0.3,
                                                            boxShadow: l.status === 'success' ? `0 0 8px ${color}` : 'none'
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {allSuccess && (
                                        <div className="absolute top-1.5 right-1.5 bg-brand-cyan text-brand-black rounded-full p-0.5 shadow-lg border-2 border-[#030712] z-20">
                                            <Award size={10} />
                                        </div>
                                    )}

                                    {/* Lock Indicator */}
                                    {isLocked && (
                                        <div className="absolute bottom-1.5 right-1.5 text-white/20">
                                            <Lock size={10} />
                                        </div>
                                    )}

                                    {/* Subtle hover highlight */}
                                    {!isFuture && !isLocked && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/0 to-brand-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

