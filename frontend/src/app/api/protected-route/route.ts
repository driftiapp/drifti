import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';

// Example of a protected route that requires authentication
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    const user = (req as any).user;
    return new NextResponse(
      JSON.stringify({ message: `Hello ${user.email}!` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  });
}

// Example of a route that requires specific role
export async function POST(request: NextRequest) {
  return withRole(['admin'])(request, async (req) => {
    const user = (req as any).user;
    return new NextResponse(
      JSON.stringify({ message: `Admin action by ${user.email}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  });
} 