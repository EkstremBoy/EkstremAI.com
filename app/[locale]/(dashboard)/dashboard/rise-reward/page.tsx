import { redirect } from 'next/navigation';

/**
 * L'ancienne page dashboard/rise-reward est remplacée par la landing page standalone.
 * On redirige automatiquement vers /riseandreward.
 */
export default async function RiseRewardDashboardRedirect({ params }: { params: Promise<{ locale: string }> }) {
    await params;
    redirect('/riseandreward');
}
