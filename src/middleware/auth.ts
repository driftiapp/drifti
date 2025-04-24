import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, parseAuthHeader } from '../utils/auth';

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization') || undefined;
  const token = parseAuthHeader(authHeader);

  if (!token) {
    return new NextResponse(
      JSON.stringify({ message: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return new NextResponse(
      JSON.stringify({ message: 'Invalid or expired token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Attach user info to the request
  (request as any).user = payload;
  
  return handler(request);
}

export function withRole(roles: string[]) {
  return async function(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const response = await withAuth(request, async (req) => {
      const user = (req as any).user;
      
      if (!roles.includes(user.role)) {
        return new NextResponse(
          JSON.stringify({ message: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return handler(req);
    });
    
    return response;
  };
} 