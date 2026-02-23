import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
    weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
    title: {
        default: 'EkstremAI — L\'IA au service de votre liberté',
        template: '%s | EkstremAI',
    },
    description: 'EkstremAI forge des outils intelligents pour automatiser l\'utile et vous permettre de vivre l\'essentiel. Découvrez Rise & Reward, notre application SaaS de gamification.',
    keywords: ['IA', 'intelligence artificielle', 'SaaS', 'gamification', 'Rise and Reward', 'automatisation', 'EkstremAI'],
    authors: [{ name: 'EkstremAI' }],
    creator: 'EkstremAI',
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        alternateLocale: 'en_US',
        title: 'EkstremAI — L\'IA au service de votre liberté',
        description: 'EkstremAI forge des outils intelligents pour automatiser l\'utile.',
        siteName: 'EkstremAI',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'EkstremAI — L\'IA au service de votre liberté',
        description: 'EkstremAI forge des outils intelligents pour automatiser l\'utile.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning>
            <body className={`${jakarta.variable} font-jakarta`}>
                {children}
            </body>
        </html>
    );
}
