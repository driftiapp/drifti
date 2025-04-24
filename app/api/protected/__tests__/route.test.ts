import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { Role } from '../../../../../src/types/auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

// Mock NextRequest
const createMockNextRequest = (headers: Record<string, string> = {}) => {
  return new NextRequest('http://localhost', {
    method: 'GET',
    headers: new Headers(headers),
  });
};

describe('Protected Route API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  it('should return 401 if no authorization header is present', async () => {
    const request = createMockNextRequest();

    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('No authorization token provided');
  });

  it('should return 401 if authorization header is malformed', async () => {
    const request = createMockNextRequest({
      'authorization': 'malformed-token',
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid authorization header format');
  });

  it('should return 401 if JWT is invalid', async () => {
    (verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const request = createMockNextRequest({
      'authorization': 'Bearer invalid_token',
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid token');
  });

  it('should return 401 if JWT is expired', async () => {
    (verify as jest.Mock).mockImplementation(() => {
      throw new Error('Token expired');
    });

    const request = createMockNextRequest({
      'authorization': 'Bearer expired_token',
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Token expired');
  });

  it('should return 401 if user is not found', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockNextRequest({
      'authorization': 'Bearer valid_token',
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('User not found');
  });

  it('should return 403 if user is blocked', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      isBlocked: true,
    });

    const request = createMockNextRequest({
      'authorization': 'Bearer valid_token',
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Account is blocked');
  });

  it('should return 403 if user does not have required role', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      role: Role.USER,
    });

    const request = createMockNextRequest({
      'authorization': 'Bearer valid_token',
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should successfully access protected route with valid admin token', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      role: Role.ADMIN,
    });

    const request = createMockNextRequest({
      'authorization': 'Bearer valid_token',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toBe('Protected route accessed successfully');
  });

  it('should successfully access protected route with valid business owner token', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'business@example.com',
      role: Role.BUSINESS_OWNER,
    });

    const request = createMockNextRequest({
      'authorization': 'Bearer valid_token',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toBe('Protected route accessed successfully');
  });

  it('should handle server errors gracefully', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1' });
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockNextRequest({
      'authorization': 'Bearer valid_token',
    });

    const response = await GET(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });

  it('should inject user into request context', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      role: Role.ADMIN,
    };

    (verify as jest.Mock).mockReturnValue({ userId: '1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const request = createMockNextRequest({
      'authorization': 'Bearer valid_token',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('user');
    expect(data.user).toEqual(mockUser);
  });
}); 