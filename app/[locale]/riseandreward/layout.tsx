import RnRNavbar from '@/components/riseandreward/RnRNavbar';

export default async function RiseAndRewardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    await params;
    return (
        <>
            <RnRNavbar />
            {children}
        </>
    );
}
