import SnakeGame from '@/components/game/SnakeGame';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useTranslations } from 'next-intl';

export default function SnakePage() {
    const t = useTranslations('snake');

    return (
        <main className="min-h-screen relative bg-brand-black overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-brand-cyan/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none" />

            <Navbar />

            <div className="max-w-7xl mx-auto pt-32 pb-20 px-6 flex flex-col items-center">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 italic tracking-tighter">
                        {t('title')}
                    </h1>
                    <div className="h-1 w-20 bg-brand-cyan mx-auto rounded-full" />
                </div>

                <SnakeGame />
            </div>

            <Footer />
        </main>
    );
}
