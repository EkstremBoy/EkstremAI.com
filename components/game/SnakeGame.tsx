'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gamepad2, Volume2, VolumeX, RefreshCw, ChevronLeft, Award } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from 'next-intl';

type Mode = 'RETRO' | 'EKSTREMAI';
type Point = { x: number; y: number; type?: 'normal' | 'ai' | 'broken' };

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

export default function SnakeGame() {
    const t = useTranslations('snake');
    const locale = useLocale();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const supabase = createClient();

    const [mode, setMode] = useState<Mode>('EKSTREMAI');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(20); // Default by EkstremAI Guy
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showStory, setShowStory] = useState(false);
    const [hasSeen20Msg, setHasSeen20Msg] = useState(false);
    const [hasSeen25Msg, setHasSeen25Msg] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
    const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
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

        if (!isMuted) {
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }

        return () => {
            audioRef.current?.pause();
        };
    }, [mode, isPlaying]);

    useEffect(() => {
        if (!audioRef.current) return;

        // Speed up music based on score
        if (score >= 20) {
            audioRef.current.playbackRate = 1.25;
        } else {
            audioRef.current.playbackRate = 1.0;
        }
    }, [score]);

    // Game Logic
    const generateFood = useCallback((currentSnake: Point[]) => {
        let newFood: Point;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
                type: 'normal'
            };
        } while (currentSnake.some(s => s.x === newFood.x && s.y === newFood.y));
        return newFood;
    }, []);

    const generateSpecial = useCallback((currentSnake: Point[]) => {
        if (mode !== 'EKSTREMAI') return [];

        const items: Point[] = [];
        // AI Token (Gold)
        if (Math.random() > 0.7) {
            items.push({
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
                type: 'ai'
            });
        }
        // Broken Token (Obstacle) - more frequent if score is high
        const obstacleChance = score > 15 ? 0.4 : 0.2;
        if (Math.random() < obstacleChance) {
            items.push({
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
                type: 'broken'
            });
        }
        return items.filter(item => !currentSnake.some(s => s.x === item.x && s.y === item.y));
    }, [mode, score]);

    const startGame = () => {
        setSnake(INITIAL_SNAKE);
        setDirection(INITIAL_DIRECTION);
        directionRef.current = INITIAL_DIRECTION;
        setScore(0);
        setIsGameOver(false);
        setIsPlaying(true);
        setIsPaused(false);
        setShowStory(false);
        setHasSeen20Msg(false);
        setHasSeen25Msg(false);
        setFood(generateFood(INITIAL_SNAKE));
        setSpecialItems([]);
    };

    const handleGameOver = async () => {
        setIsGameOver(true);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        // Save score if significant
        if (score > 25) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const username = user.user_metadata.full_name || user.email?.split('@')[0] || 'Player';
                await supabase.from('snake_leaderboard').insert({
                    user_id: user.id,
                    username,
                    score,
                    mode: mode.toLowerCase()
                });

                // Reward Token
                // Note: In a real app, this should be done via a secure server action/function
                const { data: tokens } = await supabase
                    .from('user_tokens')
                    .select('balance')
                    .eq('user_id', user.id)
                    .single();

                if (tokens) {
                    await supabase
                        .from('user_tokens')
                        .update({ balance: tokens.balance + 1 })
                        .eq('user_id', user.id);
                }

                fetchLeaderboard();
            }
        }
    };

    // Keyboard controls
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

    // Main Game Loop
    useEffect(() => {
        if (!isPlaying || isPaused || showStory) return;

        const moveSnake = () => {
            setSnake(prevSnake => {
                const newHead = {
                    x: (prevSnake[0].x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
                    y: (prevSnake[0].y + directionRef.current.y + GRID_SIZE) % GRID_SIZE
                };

                // Check collision with self
                if (prevSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
                    handleGameOver();
                    return prevSnake;
                }

                // Check collision with Broken Token
                if (specialItems.some(i => i.x === newHead.x && i.y === newHead.y && i.type === 'broken')) {
                    handleGameOver();
                    return prevSnake;
                }

                const newSnake = [newHead, ...prevSnake];

                // Check collision with Food
                if (newHead.x === food.x && newHead.y === food.y) {
                    setScore(s => s + 1);
                    setFood(generateFood(newSnake));
                    if (mode === 'EKSTREMAI') setSpecialItems(generateSpecial(newSnake));
                }
                // Check collision with AI Token
                else if (specialItems.some(i => i.x === newHead.x && i.y === newHead.y && i.type === 'ai')) {
                    setScore(s => s + 2); // AI token gives more
                    setSpecialItems(prev => prev.filter(i => !(i.x === newHead.x && i.y === newHead.y)));
                }
                else {
                    newSnake.pop();
                }

                return newSnake;
            });
        };

        const speed = Math.max(50, 150 - score * 2);
        const interval = setInterval(moveSnake, speed);
        return () => clearInterval(interval);
    }, [isPlaying, isPaused, showStory, food, specialItems, score, mode]);

    // Story Pause logic
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

    // Render Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cellSize = canvas.width / GRID_SIZE;

        // Clear
        if (mode === 'RETRO') {
            ctx.fillStyle = '#8b956d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Grid lines (subtle)
            ctx.strokeStyle = '#7a8260';
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= GRID_SIZE; i++) {
                ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, canvas.height); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(canvas.width, i * cellSize); ctx.stroke();
            }
        } else {
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // CRT Lines effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            for (let i = 0; i < canvas.height; i += 4) ctx.fillRect(0, i, canvas.width, 1);
        }

        // Draw Food
        if (mode === 'RETRO') {
            ctx.fillStyle = '#1a1c13';
            ctx.fillRect(food.x * cellSize + 2, food.y * cellSize + 2, cellSize - 4, cellSize - 4);
        } else {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff2d55';
            ctx.fillStyle = '#ff2d55';
            ctx.beginPath();
            ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw Special Items
        specialItems.forEach(item => {
            if (item.type === 'ai') {
                ctx.shadowBlur = 20; ctx.shadowColor = '#ffcc00'; ctx.fillStyle = '#ffcc00';
                ctx.beginPath(); ctx.arc(item.x * cellSize + cellSize / 2, item.y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            } else if (item.type === 'broken') {
                ctx.fillStyle = '#333';
                ctx.fillRect(item.x * cellSize + 2, item.y * cellSize + 2, cellSize - 4, cellSize - 4);
                ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(item.x * cellSize + 4, item.y * cellSize + 4); ctx.lineTo(item.x * cellSize + cellSize - 4, item.y * cellSize + cellSize - 4); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(item.x * cellSize + cellSize - 4, item.y * cellSize + 4); ctx.lineTo(item.x * cellSize + 4, item.y * cellSize + cellSize - 4); ctx.stroke();
            }
        });

        // Draw Snake
        snake.forEach((segment, i) => {
            const isHead = i === 0;
            if (mode === 'RETRO') {
                ctx.fillStyle = isHead ? '#0a0b08' : '#1a1c13';
                ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
            } else {
                ctx.shadowBlur = isHead ? 20 : 10;
                ctx.shadowColor = '#00f2ff';
                ctx.fillStyle = isHead ? '#00f2ff' : 'rgba(0, 242, 255, 0.6)';
                const r = isHead ? 4 : 2;
                ctx.beginPath();
                ctx.roundRect(segment.x * cellSize + 2, segment.y * cellSize + 2, cellSize - 4, cellSize - 4, r);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });

    }, [snake, food, specialItems, mode]);

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
            <audio ref={audioRef} />

            {/* Header / Stats */}
            <div className="flex items-center justify-between w-full glass p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-6">
                    <Link href={`/${locale}/game`} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <ChevronLeft />
                    </Link>
                    <div>
                        <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('score')}</h2>
                        <p className="text-3xl font-black text-white italic">{score}</p>
                    </div>
                    <div className="border-l border-white/10 pl-6">
                        <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('high_score')}</h2>
                        <p className="text-xl font-bold text-white/60">20 <span className="text-[10px] opacity-50 font-normal">by AI Guy</span></p>
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
                {/* Canvas Container */}
                <div className={`p-4 rounded-[40px] border-8 transition-colors duration-500 ${mode === 'RETRO' ? 'bg-[#7a8260] border-[#1a1c13]/20' : 'bg-brand-cyan/5 border-brand-cyan/20 shadow-[0_0_50px_rgba(0,242,255,0.1)]'}`}>
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={400}
                        className={`rounded-2xl ${mode === 'RETRO' ? 'pixelated' : ''}`}
                        style={{ width: '400px', height: '400px' }}
                    />
                </div>

                {/* Overlays */}
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
                            <h2 className="text-4xl font-black text-red-500 uppercase italic mb-2 tracking-tighter italic">{t('game_over')}</h2>
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
                            className="absolute inset-x-8 bottom-8 glass p-8 rounded-3xl border border-brand-cyan/30 z-40"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
                                    <Award />
                                </div>
                                <div>
                                    <h3 className="text-brand-cyan font-black uppercase text-sm tracking-widest">{t('story.guy_title')}</h3>
                                    <div className="flex gap-1 h-1 w-24 bg-white/5 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-brand-cyan w-[60%] animate-pulse" />
                                    </div>
                                </div>
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

            {/* Leaderboard */}
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
                        <div className="text-center py-8 text-white/20 font-medium italic">
                            No records yet... forge your path!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

