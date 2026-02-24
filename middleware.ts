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

    // Routes standalone — pas de préfixe de locale (Rise & Reward landing page)
    const isStandalone = pathname.startsWith('/riseandreward');
    if (isStandalone) {
        return NextResponse.next();
    }

    // Protect dashboard routes — requires Supabase session
    const isDashboard = locales.some((locale) =>
        pathname.startsWith(`/${locale}/dashboard`)
    );

    if (isDashboard) {
        return updateSession(request);
    }

    return intlMiddleware(request) as NextResponse;
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
