import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest, response?: NextResponse) {
    let supabaseResponse = response || NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    // Update our existing response instead of always creating a new one
                    if (!response) {
                        supabaseResponse = NextResponse.next({ request });
                    }
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Redirect unauthenticated users to login
        const locale = request.nextUrl.pathname.split('/')[1] || 'fr';
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = `/${locale}/login`;
        return NextResponse.redirect(loginUrl);
    }

    return supabaseResponse;
}
