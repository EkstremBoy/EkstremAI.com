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
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
