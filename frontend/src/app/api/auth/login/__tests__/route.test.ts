import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    loginHistory: {
      create: jest.fn(),
    },
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// Mock NextRequest
const createMockNextRequest = (body: any) => {
  return new NextRequest('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

describe('Login API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  it('should return 400 if email or password is missing', async () => {
    const request = createMockNextRequest({});

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Email and password are required');
  });

  it('should return 401 if user is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockNextRequest({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 401 if password is incorrect', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password: 'hashed_password',
    });

    const request = createMockNextRequest({
      email: 'test@example.com',
      password: 'wrong_password',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 403 if user is blocked', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password: 'hashed_password',
      isBlocked: true,
    });

    const request = createMockNextRequest({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Account is blocked');
  });

  it('should successfully login and return tokens', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      password: 'hashed_password',
      isBlocked: false,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (sign as jest.Mock).mockReturnValue('mock_token');

    const request = createMockNextRequest({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
    expect(prisma.loginHistory.create).toHaveBeenCalled();
  });

  it('should handle server errors gracefully', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockNextRequest({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });
}); 