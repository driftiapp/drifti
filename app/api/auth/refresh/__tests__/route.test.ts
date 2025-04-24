import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { verify, sign } from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

// Mock NextRequest
const createMockNextRequest = (body: any) => {
  return new NextRequest('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

describe('Refresh Token API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
  });

  it('should return 400 if refresh token is missing', async () => {
    const request = createMockNextRequest({});

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Refresh token is required');
  });

  it('should return 401 if refresh token is invalid', async () => {
    (verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const request = createMockNextRequest({
      refreshToken: 'invalid_token',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid refresh token');
  });

  it('should return 401 if refresh token is expired', async () => {
    (verify as jest.Mock).mockImplementation(() => {
      throw new Error('Token expired');
    });

    const request = createMockNextRequest({
      refreshToken: 'expired_token',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Refresh token expired');
  });

  it('should return 401 if refresh token is not found in database', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1', tokenId: 'token_1' });
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockNextRequest({
      refreshToken: 'valid_token',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Refresh token not found');
  });

  it('should return 401 if refresh token is revoked', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1', tokenId: 'token_1' });
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      id: 'token_1',
      userId: '1',
      isRevoked: true,
    });

    const request = createMockNextRequest({
      refreshToken: 'revoked_token',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Refresh token has been revoked');
  });

  it('should return 401 if user is not found', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1', tokenId: 'token_1' });
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      id: 'token_1',
      userId: '1',
      isRevoked: false,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockNextRequest({
      refreshToken: 'valid_token',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('User not found');
  });

  it('should successfully refresh tokens', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    };

    (verify as jest.Mock).mockReturnValue({ userId: '1', tokenId: 'token_1' });
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      id: 'token_1',
      userId: '1',
      isRevoked: false,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (sign as jest.Mock).mockReturnValue('new_access_token');

    const request = createMockNextRequest({
      refreshToken: 'valid_token',
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('accessToken');
    expect(data.accessToken).toBe('new_access_token');
    expect(prisma.refreshToken.update).toHaveBeenCalled();
  });

  it('should handle server errors gracefully', async () => {
    (verify as jest.Mock).mockReturnValue({ userId: '1', tokenId: 'token_1' });
    (prisma.refreshToken.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockNextRequest({
      refreshToken: 'valid_token',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });

  it('should implement token rotation', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    };

    (verify as jest.Mock).mockReturnValue({ userId: '1', tokenId: 'token_1' });
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      id: 'token_1',
      userId: '1',
      isRevoked: false,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (sign as jest.Mock).mockReturnValue('new_access_token');

    const request = createMockNextRequest({
      refreshToken: 'valid_token',
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'token_1' },
      data: { isRevoked: true },
    });
  });
}); 