'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProfilePhotoUpload from '@/components/auth/ProfilePhotoUpload';
import { User, Mail } from 'lucide-react';

export default function GeneralProfilePage() {
    const t = useTranslations('profile_page');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .eq('id', user.id)
                    .single();

                setUserProfile({ ...user, ...profile });
                setUsername(profile?.username || user.email?.split('@')[0] || '');
            }
            setLoading(false);
        }
        loadProfile();
    }, []);

    const handlePhotoUpdate = (url: string) => {
        setUserProfile((prev: any) => ({ ...prev, avatar_url: url }));
    };

    const handleUpdateProfile = async () => {
        setUpdating(true);
        setMessage(null);

        const { error } = await supabase
            .from('profiles')
            .update({ username })
            .eq('id', userProfile.id);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: t('update_success') });
            setUserProfile((prev: any) => ({ ...prev, username }));
            // Refresh page/UserMenu if needed
            setTimeout(() => setMessage(null), 3000);
        }
        setUpdating(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!userProfile) {
        return null;
    }

    return (
        <main className="min-h-screen relative bg-brand-black">
            <Navbar />

            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-cyan/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-violet/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                        {t('title')}
                    </h1>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">
                        {t('description')}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Col: Photo Upload */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="glass rounded-3xl p-8 border border-white/5 flex flex-col items-center"
                    >
                        <ProfilePhotoUpload
                            userId={userProfile.id}
                            currentAvatarUrl={userProfile.avatar_url}
                            onUploadComplete={handlePhotoUpdate}
                        />
                    </motion.div>

                    {/* Right Col: Personal Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="md:col-span-2 glass rounded-3xl p-8 border border-white/5"
                    >
                        <div className="space-y-8">
                            {/* Username */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-brand-cyan uppercase tracking-widest mb-3">
                                    <User size={14} />
                                    {t('username')}
                                </label>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium focus:border-brand-cyan/50 focus:bg-white/10 transition-all outline-none"
                                        placeholder={t('username')}
                                    />

                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={updating || username === userProfile.username}
                                        className="w-full py-4 rounded-2xl bg-brand-cyan text-brand-black font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all shadow-[0_0_20px_rgba(0,212,255,0.2)]"
                                    >
                                        {updating ? (
                                            <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin mx-auto" />
                                        ) : (
                                            t('save')
                                        )}
                                    </button>

                                    {message && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`text-center text-xs font-bold ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                                        >
                                            {message.text}
                                        </motion.p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-brand-cyan uppercase tracking-widest mb-3">
                                    <Mail size={14} />
                                    {t('email')}
                                </label>
                                <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-medium italic">
                                    {userProfile.email}
                                </div>
                                <p className="mt-2 text-[10px] text-white/20 italic">
                                    L'adresse courriel ne peut pas être modifiée directement.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
