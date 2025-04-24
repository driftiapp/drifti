import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { getToken } from 'next-auth/jwt';

// Configure next-intl middleware
const intlMiddleware = createMiddleware({
    locales: ['en', 'fr', 'es', 'de', 'it', 'pt', 'nl'],
    defaultLocale: 'en',
    localePrefix: 'as-needed',
    localeDetection: true,
});

// Define public routes that don't require authentication
const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth',
];

// Define API routes that don't require authentication
const publicApiRoutes = [
    '/api/auth',
    '/api/health',
    '/api/public',
];

// Helper function to verify token
async function verifyToken(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        return token;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Skip middleware for static files and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Handle API routes
    if (pathname.startsWith('/api')) {
        // Check if it's a public API route
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
            return NextResponse.next();
        }

        // Verify authentication for protected API routes
        const token = await verifyToken(request);
        if (!token) {
            return new NextResponse(
                JSON.stringify({ message: 'Authentication required' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return NextResponse.next();
    }

    // Handle page routes
    if (pathname.startsWith('/auth')) {
        // If user is already authenticated, redirect to dashboard
        const token = await verifyToken(request);
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Check if the route is public
    if (publicRoutes.includes(pathname)) {
        return intlMiddleware(request);
    }

    // Verify authentication for protected routes
    const token = await verifyToken(request);
    if (!token) {
        const signInUrl = new URL('/auth/signin', request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
    }

    // Apply internationalization middleware
    return intlMiddleware(request);
}

// Update matcher to handle both API routes and page routes
export const config = {
    matcher: [
        // Match all pathnames except for
        // - static files (e.g. /favicon.ico, /images/*)
        // - api routes (e.g. /api/*)
        // - _next internal routes (e.g. /_next/*)
        '/((?!api|_next|.*\\..*).*)',
        // Match all API routes except for public ones
        '/api/((?!auth|health|public).*)',
    ],
}; 