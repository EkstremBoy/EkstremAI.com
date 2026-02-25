import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'SOT Companion | EkstremAI',
    description: 'Guide personnel pour Sea of Thieves',
    robots: {
        index: false,
        follow: false,
    },
};

export default function SotLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
