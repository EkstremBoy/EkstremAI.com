'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Upload, CheckCircle, AlertCircle, Loader2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfilePhotoUploadProps {
    userId: string;
    currentAvatarUrl?: string;
    onUploadComplete: (url: string) => void;
}

export default function ProfilePhotoUpload({
    userId,
    currentAvatarUrl,
    onUploadComplete,
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

            // 1. Upload file to Supabase Storage
            // Path: userId/filename (scoped by user ID for RLS)
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

            const { error: uploadError, data } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // 3. Update profiles table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            onUploadComplete(publicUrl);
            setStatus('success');

            // Reset status after a few seconds
            setTimeout(() => setStatus('idle'), 3000);

        } catch (error) {
            console.error('Error uploading avatar:', error);
            setStatus('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
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

                {/* Upload Overlay Button */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    <Upload size={24} className="text-white" />
                </label>
            </div>

            {/* Status Feedback */}
            <div className="h-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {uploading && (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-2 text-brand-cyan text-sm font-medium"
                        >
                            <Loader2 size={16} className="animate-spin" />
                            {t('uploading')}
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-2 text-green-400 text-sm font-medium"
                        >
                            <CheckCircle size={16} />
                            {t('success')}
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-2 text-red-400 text-sm font-medium"
                        >
                            <AlertCircle size={16} />
                            {t('error')}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <label className="cursor-pointer px-6 py-2.5 rounded-xl text-sm font-bold text-white glass border border-white/10 hover:border-brand-cyan transition-all active:scale-95">
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                />
                {t('upload_photo')}
            </label>
        </div>
    );
}
