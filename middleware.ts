/**
 * Next.js Middleware for Authentication and Route Protection
 *
 * Handles session management, cookie persistence, and route access control.
 * Integrates with Supabase Auth for server-side session validation.
 *
 * @remarks
 * - Refreshes session on every request to keep cookies current
 * - Protects authenticated routes (/dashboard, /vitavalidator, etc.)
 * - Allows public access to marketing and content pages
 * - Handles cookie sync edge cases during login transitions
 *
 * @module middleware
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes accessible without authentication */
const publicRoutes = [
  '/',
  '/auth',
  '/blog',
  '/documentacion',
  '/community',
  '/guias',
  '/ayuda',
  '/contacto',
  '/faq',
];

/** Regex patterns for public route matching */
const publicRoutePatterns = [
  /^\/blog\/.*/,
  /^\/community\/.*/,
  /^\/documentacion\/.*/,
  /^\/l\/.*/,
  /^\/sean-ellis\/.*/,
];

/** Routes requiring authentication */
const protectedRoutes = [
  '/dashboard',
  '/vitavalidator',
  '/vitacoach',
  '/ideapivotengine',
];

/** Regex patterns for protected route matching */
const protectedRoutePatterns = [
  /^\/dashboard\/.*/,
];

/**
 * Checks if a path matches public route configuration.
 * @param pathname - URL path to check
 * @returns true if route is publicly accessible
 */
function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) {
    return true;
  }
  return publicRoutePatterns.some(pattern => pattern.test(pathname));
}

/**
 * Checks if a path matches protected route configuration.
 * @param pathname - URL path to check
 * @returns true if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    return true;
  }
  return protectedRoutePatterns.some(pattern => pattern.test(pathname));
}

/**
 * Main middleware function for request processing.
 *
 * Flow:
 * 1. Skip static assets and API routes (handled separately)
 * 2. Initialize Supabase client with cookie handlers
 * 3. Refresh session via getUser() to update cookies
 * 4. For protected routes: redirect to /auth if not authenticated
 * 5. Handle cookie sync edge cases during login transitions
 *
 * @param request - Incoming Next.js request
 * @returns NextResponse with updated cookies or redirect
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          // Configure cookies for proper session persistence (7 days)
          cookiesToSet.forEach(({ name: cookieName, value: cookieValue, options: cookieOptions }) => {
            // Default maxAge: 7 days in seconds (604800)
            const maxAge = cookieOptions?.maxAge || 7 * 24 * 60 * 60;

            supabaseResponse.cookies.set(cookieName, cookieValue, {
              ...cookieOptions,
              maxAge: maxAge,
              // Enforce secure flag in production
              ...(isProduction && !cookieOptions?.secure ? { secure: true } : {}),
              // Default sameSite to 'lax' for CSRF protection
              ...(!cookieOptions?.sameSite ? { sameSite: 'lax' as const } : {}),
              // Ensure cookie is available app-wide
              path: cookieOptions?.path || '/',
            });
          });
        },
      } as any,
    }
  );

  const isPublic = isPublicRoute(pathname);
  const isProtected = isProtectedRoute(pathname);

  // Single getUser() call refreshes session and updates cookies
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (isProtected) {
    if (!user || userError) {
      // Avoid redirect loop if already on /auth
      if (pathname !== '/auth') {
        // Check for auth cookies that may still be syncing after login
        // This handles the edge case where cookies exist but getUser() fails
        // due to timing issues during OAuth callback processing
        const cookies = request.cookies.getAll();
        const hasAuthCookies = cookies.some(
          cookie => cookie.name.startsWith('sb-') || cookie.name.includes('auth')
        );

        // If no auth cookies, redirect to login
        if (!hasAuthCookies) {
          const authUrl = new URL('/auth', request.url);
          authUrl.searchParams.set('redirect', pathname);
          return NextResponse.redirect(authUrl);
        }
        // If cookies exist but getUser() failed, allow access
        // Dashboard layout will handle verification with more time
      }
    }
  }

  // Public routes: allow access regardless of auth state
  // Session cookies already refreshed via getUser() above
  return supabaseResponse;
}

/**
 * Route matcher configuration.
 * Excludes static files and images from middleware processing.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|lola-logo.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
