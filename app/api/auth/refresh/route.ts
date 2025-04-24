import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateTokens } from '@/utils/auth';
import { sql } from '@vercel/postgres';
import { RefreshTokenRequest, AuthResponse } from '@shared/types/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RefreshTokenRequest = await request.json();
    const { refreshToken } = body;

    // Verify refresh token
    const payload = verifyToken(refreshToken, true);
    if (!payload) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid refresh token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user still exists and is active
    const { rows } = await sql`
      SELECT id, email, role
      FROM users
      WHERE id = ${payload.id}
      AND is_active = true
      LIMIT 1
    `;

    const user = rows[0];
    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found or inactive' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const response: AuthResponse = {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 