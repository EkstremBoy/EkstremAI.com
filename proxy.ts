import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/routing';
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always',
});

export async function proxy(request: NextRequest) {
    // Protect dashboard routes — requires Supabase session
    const { pathname } = request.nextUrl;
    const isDashboard = locales.some((locale) =>
        pathname.startsWith(`/${locale}/dashboard`)
    );

    if (isDashboard) {
        return updateSession(request);
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
