import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always',
});

export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // Icônes fichier de Next (app/favicon.ico, app/icon.png, app/apple-icon.png).
    // Elles sont servies à la racine. next-intl ne doit pas les préfixer d'une
    // locale — y compris `/icon` et `/apple-icon`, que le routeur sert parfois
    // sans extension. Un préfixe `/fr` les enverrait en 404.
    if (
        pathname === '/favicon.ico' ||
        pathname === '/icon' ||
        pathname.startsWith('/icon.') ||
        pathname === '/apple-icon' ||
        pathname.startsWith('/apple-icon.')
    ) {
        return NextResponse.next();
    }

    // 1. Transparent rewrite for sot-companion
    if (pathname === '/sot-companion' || pathname === '/sot-companion/') {
        return NextResponse.rewrite(new URL(`/${defaultLocale}/sot-companion`, request.url));
    }

    // 2. Call intlMiddleware first to handle locale
    const response = intlMiddleware(request) as NextResponse;

    // 3. Protect routes — requires Supabase session
    const isProtected = locales.some((locale) =>
        pathname.startsWith(`/${locale}/dashboard`) ||
        pathname.startsWith(`/${locale}/profile`) ||
        pathname.startsWith(`/${locale}/settings`)
    );

    if (isProtected) {
        return await updateSession(request, response);
    }

    return response;
}

export const config = {
    /* `games/` AVEC la barre oblique, et c'est tout le sel : elle exclut
       `/games/alpineschool/...` — un jeu autonome servi depuis public/, que
       next-intl redirigerait sinon vers `/fr/games/...`, donc vers un 404 —
       tout en laissant passer `/games` seul, que le middleware redirige bien
       vers `/fr/games`, le hub.
       Les extensions sont là pour la même raison : le filtre d'origine ne
       laissait passer que les images, pas les .html ni les .js. */
    matcher: [
        '/((?!api|games/|_next/static|_next/image|favicon.ico|icon$|apple-icon$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|js|css|woff2|ico|json|webmanifest)$).*)',
    ],
};
