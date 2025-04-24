import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Routes that require email verification
const requireVerification = [
    "/dashboard",
    "/profile",
    "/settings",
    "/admin",
];

export async function middleware(request: NextRequest) {
    const session = await auth();

    // Public paths that don't require authentication
    const publicPaths = [
        "/",
        "/auth/signin",
        "/auth/register",
        "/auth/error",
        "/auth/verify-request",
        "/auth/verify",
    ];

    // Check if the path is public
    const isPublicPath = publicPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    // If the path is public, allow access
    if (isPublicPath) {
        return NextResponse.next();
    }

    // If there's no session and the path is not public, redirect to sign in
    if (!session) {
        const signInUrl = new URL("/auth/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(signInUrl);
    }

    // Check if the route requires email verification
    const requiresVerification = requireVerification.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (requiresVerification && !session.user.emailVerified) {
        const verifyUrl = new URL("/auth/verify-request", request.url);
        verifyUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(verifyUrl);
    }

    // Allow access to protected routes if authenticated and verified
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
    ],
}; 