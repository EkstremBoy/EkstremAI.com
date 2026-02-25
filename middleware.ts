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

    // Protect dashboard and profile routes — requires Supabase session
    const isProtected = locales.some((locale) =>
        pathname.startsWith(`/${locale}/dashboard`) ||
        pathname.startsWith(`/${locale}/profile`) ||
        pathname.startsWith(`/${locale}/settings`)
    );

    if (isProtected) {
        return updateSession(request);
    }

    return intlMiddleware(request) as NextResponse;
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
