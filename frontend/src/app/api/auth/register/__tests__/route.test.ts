import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

// Mock NextRequest
const createMockNextRequest = (body: any) => {
  return new NextRequest('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

describe('Register API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  it('should return 400 if required fields are missing', async () => {
    const request = createMockNextRequest({});

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('All fields are required');
  });

  it('should return 400 if email is invalid', async () => {
    const request = createMockNextRequest({
      email: 'invalid-email',
      password: 'Password123!',
      name: 'Test User',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid email format');
  });

  it('should return 400 if password is too weak', async () => {
    const request = createMockNextRequest({
      email: 'test@example.com',
      password: 'weak',
      name: 'Test User',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
  });

  it('should return 409 if email already exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
    });

    const request = createMockNextRequest({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe('Email already registered');
  });

  it('should successfully create a new user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      isEmailVerified: false,
    });

    const request = createMockNextRequest({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('email');
    expect(data.user).toHaveProperty('name');
    expect(data.user.isEmailVerified).toBe(false);
    expect(hash).toHaveBeenCalledWith('Password123!', 10);
  });

  it('should handle server errors gracefully', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockNextRequest({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });

  it('should sanitize user input', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      isEmailVerified: false,
    });

    const request = createMockNextRequest({
      email: '  test@example.com  ',
      password: 'Password123!',
      name: '  Test User  ',
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user.email).toBe('test@example.com');
    expect(data.user.name).toBe('Test User');
  });

  it('should enforce password complexity requirements', async () => {
    const testCases = [
      { password: 'password', expected: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' },
      { password: 'Password', expected: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' },
      { password: 'Password1', expected: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' },
      { password: 'Password1!', expected: null }, // Valid password
    ];

    for (const { password, expected } of testCases) {
      const request = createMockNextRequest({
        email: 'test@example.com',
        password,
        name: 'Test User',
      });

      const response = await POST(request);
      if (expected) {
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe(expected);
      } else {
        expect(response.status).toBe(201);
      }
    }
  });
}); 