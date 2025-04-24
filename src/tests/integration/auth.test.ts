import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sign, verify } from 'jsonwebtoken';
import { hash } from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { describe, it, expect, beforeEach } from "vitest";
import { Role } from "../../types/auth";

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User',
};

const testAdmin = {
  email: 'admin@example.com',
  password: 'Admin123!',
  name: 'Admin User',
  role: UserRole.ADMIN,
};

const testBusinessOwner = {
  email: 'business@example.com',
  password: 'Business123!',
  name: 'Business Owner',
  role: UserRole.BUSINESS_OWNER,
};

// Helper functions
const createMockNextRequest = (body: any, headers: Record<string, string> = {}) => {
  return new NextRequest('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: new Headers(headers),
  });
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
  });

  describe('Complete Auth Flow', () => {
    it('should complete full registration to logout flow', async () => {
      // 1. Register
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...testUser,
        isEmailVerified: false,
      });

      const registerRequest = createMockNextRequest(testUser);
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        body: registerRequest.body,
      });
      expect(registerResponse.status).toBe(201);

      // 2. Login
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        ...testUser,
        password: 'hashed_password',
      });
      (sign as jest.Mock).mockReturnValue('access_token');

      const loginRequest = createMockNextRequest({
        email: testUser.email,
        password: testUser.password,
      });
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        body: loginRequest.body,
      });
      expect(loginResponse.status).toBe(200);
      const loginData = await loginResponse.json();
      expect(loginData).toHaveProperty('accessToken');
      expect(loginData).toHaveProperty('refreshToken');

      // 3. Access protected route
      (verify as jest.Mock).mockReturnValue({ userId: '1' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        ...testUser,
        role: UserRole.CUSTOMER,
      });

      const protectedRequest = createMockNextRequest(
        {},
        { authorization: `Bearer ${loginData.accessToken}` }
      );
      const protectedResponse = await fetch('/api/protected', {
        method: 'GET',
        headers: protectedRequest.headers,
      });
      expect(protectedResponse.status).toBe(200);

      // 4. Logout
      const logoutRequest = createMockNextRequest(
        {},
        { authorization: `Bearer ${loginData.accessToken}` }
      );
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: logoutRequest.headers,
      });
      expect(logoutResponse.status).toBe(200);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should handle token refresh and retry access', async () => {
      // 1. Login
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        ...testUser,
        password: 'hashed_password',
      });
      (sign as jest.Mock).mockReturnValue('access_token');

      const loginRequest = createMockNextRequest({
        email: testUser.email,
        password: testUser.password,
      });
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        body: loginRequest.body,
      });
      const loginData = await loginResponse.json();

      // 2. Simulate token expiration
      (verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      const expiredRequest = createMockNextRequest(
        {},
        { authorization: `Bearer ${loginData.accessToken}` }
      );
      const expiredResponse = await fetch('/api/protected', {
        method: 'GET',
        headers: expiredRequest.headers,
      });
      expect(expiredResponse.status).toBe(401);

      // 3. Refresh token
      (verify as jest.Mock).mockReturnValue({ userId: '1', tokenId: 'token_1' });
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'token_1',
        userId: '1',
        isRevoked: false,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        ...testUser,
      });
      (sign as jest.Mock).mockReturnValue('new_access_token');

      const refreshRequest = createMockNextRequest({
        refreshToken: loginData.refreshToken,
      });
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        body: refreshRequest.body,
      });
      expect(refreshResponse.status).toBe(200);
      const refreshData = await refreshResponse.json();

      // 4. Retry access with new token
      (verify as jest.Mock).mockReturnValue({ userId: '1' });
      const retryRequest = createMockNextRequest(
        {},
        { authorization: `Bearer ${refreshData.accessToken}` }
      );
      const retryResponse = await fetch('/api/protected', {
        method: 'GET',
        headers: retryRequest.headers,
      });
      expect(retryResponse.status).toBe(200);
    });
  });

  describe('Role-Specific Access', () => {
    it('should enforce role-based access control', async () => {
      // 1. Login as admin
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        ...testAdmin,
        password: 'hashed_password',
      });
      (sign as jest.Mock).mockReturnValue('admin_token');

      const adminLoginRequest = createMockNextRequest({
        email: testAdmin.email,
        password: testAdmin.password,
      });
      const adminLoginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        body: adminLoginRequest.body,
      });
      const adminLoginData = await adminLoginResponse.json();

      // 2. Access admin route
      (verify as jest.Mock).mockReturnValue({ userId: '1' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        ...testAdmin,
      });

      const adminRequest = createMockNextRequest(
        {},
        { authorization: `Bearer ${adminLoginData.accessToken}` }
      );
      const adminResponse = await fetch('/api/admin', {
        method: 'GET',
        headers: adminRequest.headers,
      });
      expect(adminResponse.status).toBe(200);

      // 3. Login as business owner
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '2',
        ...testBusinessOwner,
        password: 'hashed_password',
      });
      (sign as jest.Mock).mockReturnValue('business_token');

      const businessLoginRequest = createMockNextRequest({
        email: testBusinessOwner.email,
        password: testBusinessOwner.password,
      });
      const businessLoginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        body: businessLoginRequest.body,
      });
      const businessLoginData = await businessLoginResponse.json();

      // 4. Try to access admin route as business owner
      (verify as jest.Mock).mockReturnValue({ userId: '2' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '2',
        ...testBusinessOwner,
      });

      const businessRequest = createMockNextRequest(
        {},
        { authorization: `Bearer ${businessLoginData.accessToken}` }
      );
      const businessResponse = await fetch('/api/admin', {
        method: 'GET',
        headers: businessRequest.headers,
      });
      expect(businessResponse.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials gracefully', async () => {
      // 1. Try to login with invalid credentials
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const invalidLoginRequest = createMockNextRequest({
        email: 'invalid@example.com',
        password: 'wrong_password',
      });
      const invalidLoginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        body: invalidLoginRequest.body,
      });
      expect(invalidLoginResponse.status).toBe(401);

      // 2. Try to refresh with expired token
      (verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      const expiredRefreshRequest = createMockNextRequest({
        refreshToken: 'expired_token',
      });
      const expiredRefreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        body: expiredRefreshRequest.body,
      });
      expect(expiredRefreshResponse.status).toBe(401);
    });
  });

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.user.deleteMany();
  });

  it("should create a new user with admin role", async () => {
    const hashedPassword = await hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Admin User",
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe("admin@example.com");
    expect(user.role).toBe(Role.ADMIN);
  });

  it("should create a new user with business owner role", async () => {
    const hashedPassword = await hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        email: "business@example.com",
        name: "Business User",
        password: hashedPassword,
        role: Role.BUSINESS_OWNER,
      },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe("business@example.com");
    expect(user.role).toBe(Role.BUSINESS_OWNER);
  });

  it("should create a new user with customer support role", async () => {
    const hashedPassword = await hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        email: "support@example.com",
        name: "Support User",
        password: hashedPassword,
        role: Role.USER,
      },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe("support@example.com");
    expect(user.role).toBe(Role.USER);
  });
}); 