import { Role } from "./src/types/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define the middleware function
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request as any });
  const isAuth = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return null;
  }

  if (!isAuth) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    );
  }

  // Check role-based access
  const userRole = token.role as Role;
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isBusinessOwnerRoute = request.nextUrl.pathname.startsWith("/business");
  const isDriverRoute = request.nextUrl.pathname.startsWith("/driver");
  const isSupportRoute = request.nextUrl.pathname.startsWith("/support");

  if (isAdminRoute && userRole !== Role.ADMIN) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isBusinessOwnerRoute && userRole !== Role.BUSINESS_OWNER) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isDriverRoute && userRole !== Role.DRIVER) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isSupportRoute && userRole !== Role.CUSTOMER_SUPPORT) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/business/:path*",
    "/driver/:path*",
    "/support/:path*",
    "/login",
  ],
}; 