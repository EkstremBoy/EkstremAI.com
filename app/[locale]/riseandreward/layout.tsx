import RnRNavbar from '@/components/riseandreward/RnRNavbar';

export default function RiseAndRewardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <RnRNavbar />
            {children}
        </>
    );
}
