import { NextRequest, NextResponse } from 'next/server';
import { generateTokens } from '@/utils/auth';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { LoginCredentials, AuthResponse } from '@shared/types/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // Find user in database
    const { rows } = await sql`
      SELECT id, email, password, role
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate tokens
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
    console.error('Login error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 