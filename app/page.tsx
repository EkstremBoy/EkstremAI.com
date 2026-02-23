import { redirect } from 'next/navigation';

// Root URL: redirect to default locale /fr
export default function RootPage() {
    redirect('/fr');
}
