'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Upload, CheckCircle, AlertCircle, Loader2, Camera, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfilePhotoUploadProps {
    userId: string;
    currentAvatarUrl?: string;
    onUploadComplete: (url: string) => void;
    onAiAvatarClick?: () => void;
}

export default function ProfilePhotoUpload({
    userId,
    currentAvatarUrl,
    onUploadComplete,
    onAiAvatarClick,
}: ProfilePhotoUploadProps) {
    const t = useTranslations('profile_page');
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const supabase = createClient();

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setStatus('idle');

            const file = event.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            onUploadComplete(publicUrl);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);

        } catch (error) {
            console.error('Error uploading avatar:', error);
            setStatus('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative group">
                <div className="w-32 h-32 rounded-3xl overflow-hidden glass border-2 border-white/10 group-hover:border-brand-cyan/50 transition-all duration-300 shadow-2xl">
                    {currentAvatarUrl ? (
                        <img
                            src={currentAvatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-cyan/20 to-brand-violet/20">
                            <Camera size={40} className="text-white/20" />
                        </div>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                />
            </div>

            {/* Status Feedback */}
            <div className="h-4 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {uploading && (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-2 text-brand-cyan text-xs font-medium"
                        >
                            <Loader2 size={12} className="animate-spin" />
                            {t('uploading')}
                        </motion.div>
                    )}
                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-2 text-green-400 text-xs font-medium"
                        >
                            <CheckCircle size={12} />
                            {t('success')}
                        </motion.div>
                    )}
                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-2 text-red-400 text-xs font-medium"
                        >
                            <AlertCircle size={12} />
                            {t('error')}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[200px]">
                {/* Personal Photo Button */}
                <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer px-4 py-3 rounded-2xl text-[11px] font-black text-white/60 glass border border-white/10 hover:border-brand-cyan hover:text-brand-cyan text-center transition-all active:scale-95 uppercase tracking-widest"
                >
                    {t('upload_personal_photo')}
                </label>

                {/* AI Avatar Button */}
                <button
                    onClick={onAiAvatarClick}
                    className="px-4 py-3 rounded-2xl text-[11px] font-black text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/30 hover:bg-brand-cyan/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest group"
                >
                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                    <span>{t('create_ai_avatar')}</span>
                    <span className="ml-1 opacity-40">— 1 Token</span>
                </button>
            </div>
        </div>
    );
}
