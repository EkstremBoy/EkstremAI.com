'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gamepad2, Volume2, VolumeX, RefreshCw, ChevronLeft, Award, Zap } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from 'next-intl';

type Mode = 'RETRO' | 'EKSTREMAI';
type ItemType = 'normal' | 'bonus' | 'negative';
type Point = {
    x: number;
    y: number;
    type: ItemType;
    expiresAt?: number;
    blinking?: boolean;
};

const GRID_SIZE = 20;
// Start with 5 segments as requested
const INITIAL_SNAKE = [
    { x: 10, y: 10, type: 'normal' as ItemType },
    { x: 10, y: 11, type: 'normal' as ItemType },
    { x: 10, y: 12, type: 'normal' as ItemType },
    { x: 10, y: 13, type: 'normal' as ItemType },
    { x: 10, y: 14, type: 'normal' as ItemType }
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

export default function SnakeGame() {
    const t = useTranslations('snake');
    const locale = useLocale();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const supabase = createClient();

    const [mode, setMode] = useState<Mode>('EKSTREMAI');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(20);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showStory, setShowStory] = useState(false);
    const [hasSeen20Msg, setHasSeen20Msg] = useState(false);
    const [hasSeen25Msg, setHasSeen25Msg] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE as Point[]);
    const [food, setFood] = useState<Point>({ x: 5, y: 5, type: 'normal' });
    const [specialItems, setSpecialItems] = useState<Point[]>([]);

    const directionRef = useRef(INITIAL_DIRECTION);

    // Fetch Leaderboard
    const fetchLeaderboard = async () => {
        const { data } = await supabase
            .from('snake_leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(5);
        if (data) setLeaderboard(data);
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    // Audio Logic
    useEffect(() => {
        if (!audioRef.current || !isPlaying) return;
        const track = mode === 'RETRO' ? '/audio/retro.mp3' : '/audio/synthwave.mp3';
        audioRef.current.src = track;
        audioRef.current.loop = true;
        if (!isMuted) audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        return () => audioRef.current?.pause();
    }, [mode, isPlaying]);

    useEffect(() => {
        if (!audioRef.current) return;
        // Basic acceleration modulation
        const baseSpeed = score >= 20 ? 1.25 : 1.0;
        audioRef.current.playbackRate = baseSpeed;
    }, [score]);

    // Game Functions
    const generatePos = useCallback((occupied: Point[]) => {
        let pos: { x: number; y: number };
        let tries = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            tries++;
            if (tries > 400) break; // Avoid infinite loop
        } while (occupied.some(s => s.x === pos.x && s.y === pos.y));
        return pos;
    }, []);

    const spawnBonus = useCallback((currentSnake: Point[], currentSpecials: Point[]) => {
        const pos = generatePos([...currentSnake, ...currentSpecials]);
        const now = Date.now();
        const newItem: Point = {
            ...pos,
            type: 'bonus',
            expiresAt: now + 5000,
            blinking: false
        };
        setSpecialItems(prev => [...prev, newItem]);
    }, [generatePos]);

    const spawnNegative = useCallback((currentSnake: Point[], currentSpecials: Point[]) => {
        const pos = generatePos([...currentSnake, ...currentSpecials]);
        const newItem: Point = { ...pos, type: 'negative' };
        setSpecialItems(prev => [...prev.filter(i => i.type !== 'negative'), newItem]);
    }, [generatePos]);

    const startGame = () => {
        setSnake(INITIAL_SNAKE as Point[]);
        directionRef.current = INITIAL_DIRECTION;
        setScore(0);
        setIsGameOver(false);
        setIsPlaying(true);
        setIsPaused(false);
        setShowStory(false);
        setHasSeen20Msg(false);
        setHasSeen25Msg(false);
        const firstPos = generatePos(INITIAL_SNAKE as Point[]);
        setFood({ ...firstPos, type: 'normal' });
        setSpecialItems([]);
    };

    const handleGameOver = async () => {
        setIsGameOver(true);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        if (score > 25) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const username = user.user_metadata.full_name || user.email?.split('@')[0] || 'Player';
                await supabase.from('snake_leaderboard').insert({
                    user_id: user.id, username, score, mode: mode.toLowerCase()
                });

                const { data: tokens } = await supabase.from('user_tokens').select('balance').eq('user_id', user.id).single();
                if (tokens) {
                    await supabase.from('user_tokens').update({ balance: tokens.balance + 1 }).eq('user_id', user.id);
                }
                fetchLeaderboard();
            }
        }
    };

    // Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': if (directionRef.current.y === 0) directionRef.current = { x: 0, y: -1 }; break;
                case 'ArrowDown': if (directionRef.current.y === 0) directionRef.current = { x: 0, y: 1 }; break;
                case 'ArrowLeft': if (directionRef.current.x === 0) directionRef.current = { x: -1, y: 0 }; break;
                case 'ArrowRight': if (directionRef.current.x === 0) directionRef.current = { x: 1, y: 0 }; break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Bonus Logic & Timers
    useEffect(() => {
        if (!isPlaying || isPaused) return;

        const timer = setInterval(() => {
            const now = Date.now();
            setSpecialItems(prev => {
                const updated = prev.filter(item => {
                    if (item.type === 'bonus' && item.expiresAt) {
                        return item.expiresAt > now;
                    }
                    return true;
                }).map(item => {
                    if (item.type === 'bonus' && item.expiresAt) {
                        const timeLeft = item.expiresAt - now;
                        return { ...item, blinking: timeLeft < 2000 };
                    }
                    return item;
                });
                return updated;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [isPlaying, isPaused]);

    // Main Loop
    useEffect(() => {
        if (!isPlaying || isPaused || showStory) return;

        const moveSnake = () => {
            setSnake(prevSnake => {
                const newHead = {
                    x: prevSnake[0].x + directionRef.current.x,
                    y: prevSnake[0].y + directionRef.current.y,
                    type: 'normal' as ItemType
                };

                // DEATH BY WALL
                if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
                    handleGameOver();
                    return prevSnake;
                }

                // DEATH BY SELF
                if (prevSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
                    handleGameOver();
                    return prevSnake;
                }

                const newSnake = [newHead, ...prevSnake];
                let ate = false;

                // Check Regular Food
                if (newHead.x === food.x && newHead.y === food.y) {
                    const newScore = score + 1;
                    setScore(newScore);
                    setFood({ ...generatePos(newSnake), type: 'normal' });
                    ate = true;

                    // Spawn Bonus every 5 points
                    if (newScore > 0 && newScore % 5 === 0) {
                        spawnBonus(newSnake, specialItems);
                    }
                    // Spawn Negative from level 3
                    if (newScore >= 3) {
                        spawnNegative(newSnake, specialItems);
                    }
                }

                // Check Specials
                const specialIndex = specialItems.findIndex(i => i.x === newHead.x && i.y === newHead.y);
                if (specialIndex !== -1) {
                    const item = specialItems[specialIndex];
                    if (item.type === 'bonus') {
                        setScore(s => s + 3);
                        ate = true;
                    } else if (item.type === 'negative') {
                        setScore(s => Math.max(0, s - 1));
                        // Snake doesn't grow when eating negative items
                        newSnake.pop();
                        ate = false;
                    }
                    setSpecialItems(prev => prev.filter((_, idx) => idx !== specialIndex));
                }

                if (!ate) {
                    newSnake.pop();
                }

                return newSnake;
            });
        };

        // ACCELERATION every 5 points
        const speed = Math.max(40, 160 - (Math.floor(score / 5) * 15) - (score % 5) * 2);
        const interval = setInterval(moveSnake, speed);
        return () => clearInterval(interval);
    }, [isPlaying, isPaused, showStory, food, specialItems, score, mode, generatePos, spawnBonus, spawnNegative]);

    // Story
    useEffect(() => {
        if (score === 20 && !hasSeen20Msg) {
            setShowStory(true);
            setHasSeen20Msg(true);
        }
        if (score === 25 && !hasSeen25Msg) {
            setShowStory(true);
            setHasSeen25Msg(true);
        }
    }, [score, hasSeen20Msg, hasSeen25Msg]);

    // Render
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const cellSize = canvas.width / GRID_SIZE;

        // Background
        if (mode === 'RETRO') {
            ctx.fillStyle = '#8b956d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#7a8260'; ctx.lineWidth = 0.5;
            for (let i = 0; i <= GRID_SIZE; i++) {
                ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, canvas.height); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(canvas.width, i * cellSize); ctx.stroke();
            }
        } else {
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            for (let i = 0; i < canvas.height; i += 4) ctx.fillRect(0, i, canvas.width, 1);
        }

        // Draw Food (Regular)
        if (mode === 'RETRO') {
            // Red Apple
            ctx.fillStyle = '#bc1e1e';
            ctx.beginPath(); ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#4a2d1a'; ctx.fillRect(food.x * cellSize + cellSize / 2 - 1, food.y * cellSize + 2, 2, 4);
        } else {
            // AI Token (Non-luminous)
            ctx.fillStyle = '#00f2ff'; ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Draw Specials
        specialItems.forEach(item => {
            if (item.type === 'bonus' && item.blinking && Math.floor(Date.now() / 200) % 2 === 0) return;

            if (item.type === 'bonus') {
                if (mode === 'RETRO') {
                    // Golden Apple
                    ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 10; ctx.shadowColor = 'gold';
                    ctx.beginPath(); ctx.arc(item.x * cellSize + cellSize / 2, item.y * cellSize + cellSize / 2, cellSize / 2.2, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    // Bright AI Token
                    ctx.shadowBlur = 30; ctx.shadowColor = '#00f2ff'; ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(item.x * cellSize + cellSize / 2, item.y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                }
            } else if (item.type === 'negative') {
                if (mode === 'RETRO') {
                    // Rotten Apple
                    ctx.fillStyle = '#444';
                    ctx.beginPath(); ctx.arc(item.x * cellSize + cellSize / 2, item.y * cellSize + cellSize / 2, cellSize / 2.8, 0, Math.PI * 2); ctx.fill();
                } else {
                    // Broken Token
                    ctx.fillStyle = '#ff2d55'; ctx.globalAlpha = 0.4;
                    ctx.fillRect(item.x * cellSize + 4, item.y * cellSize + 4, cellSize - 8, cellSize - 8);
                    ctx.strokeStyle = '#ff2d55'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(item.x * cellSize + 2, item.y * cellSize + 2); ctx.lineTo(item.x * cellSize + cellSize - 2, item.y * cellSize + cellSize - 2); ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }
            }
        });

        // Draw Snake
        snake.forEach((segment, i) => {
            const isHead = i === 0;
            if (mode === 'RETRO') {
                ctx.fillStyle = isHead ? '#0a0b08' : '#2a2d1f';
                ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
                if (isHead) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(segment.x * cellSize + 4, segment.y * cellSize + 4, 3, 3);
                    ctx.fillRect(segment.x * cellSize + cellSize - 7, segment.y * cellSize + 4, 3, 3);
                }
            } else {
                ctx.shadowBlur = isHead ? 25 : 12;
                ctx.shadowColor = '#00f2ff';
                ctx.fillStyle = isHead ? '#fff' : 'rgba(0, 242, 255, 0.7)';
                ctx.beginPath();
                ctx.roundRect(segment.x * cellSize + 2, segment.y * cellSize + 2, cellSize - 4, cellSize - 4, isHead ? 6 : 3);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
    }, [snake, food, specialItems, mode]);

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
            <audio ref={audioRef} />

            <div className="flex items-center justify-between w-full glass p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-6">
                    <Link href={`/${locale}/game`} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <ChevronLeft />
                    </Link>
                    <div>
                        <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('score')}</h2>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-white italic">{score}</p>
                            {score > 0 && score % 5 === 0 && <Zap size={16} className="text-brand-cyan animate-bounce" />}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setMode(m => m === 'RETRO' ? 'EKSTREMAI' : 'RETRO')}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${mode === 'RETRO' ? 'bg-[#8b956d] border-[#1a1c13] text-[#1a1c13]' : 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'}`}
                    >
                        {mode === 'RETRO' ? t('retro_mode') : t('ekstrem_mode')}
                    </button>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-brand-cyan/20 text-white/40 hover:text-brand-cyan transition-all"
                    >
                        {isMuted ? <VolumeX /> : <Volume2 />}
                    </button>
                </div>
            </div>

            <div className="relative group">
                <div className={`p-4 rounded-[40px] border-8 transition-colors duration-500 ${mode === 'RETRO' ? 'bg-[#7a8260] border-[#1a1c13]/20' : 'bg-brand-cyan/5 border-brand-cyan/20 shadow-[0_0_60px_rgba(0,242,255,0.15)]'}`}>
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={400}
                        className={`rounded-2xl ${mode === 'RETRO' ? 'pixelated' : ''}`}
                        style={{ width: '400px', height: '400px' }}
                    />
                </div>

                <AnimatePresence>
                    {!isPlaying && !isGameOver && (
                        <motion.button
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={startGame}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-[40px] z-20 group"
                        >
                            <div className="p-6 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan mb-4 group-hover:scale-110 transition-transform">
                                <Gamepad2 size={48} />
                            </div>
                            <span className="text-white font-black text-2xl uppercase tracking-[0.2em] animate-pulse">
                                {t('start')}
                            </span>
                        </motion.button>
                    )}

                    {isGameOver && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-[40px] z-30"
                        >
                            <h2 className="text-4xl font-black text-red-500 uppercase italic mb-2 tracking-tighter">{t('game_over')}</h2>
                            <p className="text-white/40 mb-8 font-bold">Final Score: {score}</p>
                            <button
                                onClick={startGame}
                                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-cyan font-black text-brand-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                            >
                                <RefreshCw size={20} /> Replay
                            </button>
                        </motion.div>
                    )}

                    {showStory && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute inset-x-8 bottom-8 glass p-8 rounded-3xl border border-brand-cyan/30 z-40 shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
                                    <Award />
                                </div>
                                <h3 className="text-brand-cyan font-black uppercase text-sm tracking-widest">{t('story.guy_title')}</h3>
                            </div>
                            <p className="text-white text-lg font-medium leading-relaxed italic mb-6">
                                "{score === 20 ? t('story.msg_20') : t('story.msg_25')}"
                            </p>
                            <button
                                onClick={() => setShowStory(false)}
                                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                            >
                                {t('story.continue')} ➜
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="w-full glass p-8 rounded-[40px] border border-white/5">
                <div className="flex items-center gap-3 mb-8">
                    <Trophy className="text-brand-cyan" size={24} />
                    <h3 className="text-xl font-black text-white uppercase tracking-widest italic">{t('leaderboard.title')}</h3>
                </div>
                <div className="space-y-3">
                    {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-4">
                                <span className="text-white/20 font-black text-sm w-4">#{idx + 1}</span>
                                <span className="text-white font-bold">{entry.username}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase ${entry.mode === 'retro' ? 'bg-[#8b956d]/10 border-[#8b956d]/30 text-[#8b956d]' : 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'}`}>
                                    {entry.mode}
                                </span>
                            </div>
                            <span className="text-brand-cyan font-black text-xl">{entry.score}</span>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-white/20 font-medium italic">No records yet...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
