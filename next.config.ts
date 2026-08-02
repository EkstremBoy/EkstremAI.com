import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
    },

    /* L'ancienne adresse du hub est peut-être indexée : on la redirige au lieu
       de la laisser tomber en 404. Permanente, pour que les moteurs
       transfèrent le référencement. */
    async redirects() {
        return [
            { source: '/:locale(fr|en)/game', destination: '/:locale/games', permanent: true },
            { source: '/:locale(fr|en)/game/:path*', destination: '/:locale/games/:path*', permanent: true },
        ];
    },

    /* Un jeu autonome est un dossier contenant un index.html. Sans cette
       réécriture, `/games/alpineschool` ne trouverait rien : Next ne cherche
       pas d'index dans public/, il faut nommer le fichier. */
    async rewrites() {
        return [
            { source: '/games/:slug', destination: '/games/:slug/index.html' },
        ];
    },
};

export default withNextIntl(nextConfig);
