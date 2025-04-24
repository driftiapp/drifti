import { NextResponse } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    exportShare: {
      create: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('POST /api/exports/share', () => {
  const mockRequest = (body: any) => ({
    json: () => Promise.resolve(body),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user123' },
    });
    (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/file.zip');
  });

  it('creates a share link successfully', async () => {
    const request = mockRequest({
      filename: 'test.zip',
      content: 'test content',
      expiresIn: 3600,
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('shareUrl');
    expect(data).toHaveProperty('expiresAt');
    expect(prisma.exportShare.create).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const request = mockRequest({
      // Missing required fields
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('validates expiration time range', async () => {
    const request = mockRequest({
      filename: 'test.zip',
      content: 'test content',
      expiresIn: 100, // Too short
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('handles unauthorized requests', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const request = mockRequest({
      filename: 'test.zip',
      content: 'test content',
      expiresIn: 3600,
    });

    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it('handles Firebase upload errors', async () => {
    (uploadBytes as jest.Mock).mockRejectedValue(new Error('Upload failed'));
    const request = mockRequest({
      filename: 'test.zip',
      content: 'test content',
      expiresIn: 3600,
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
  });

  it('validates file size limits', async () => {
    const largeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB
    const request = mockRequest({
      filename: 'test.zip',
      content: largeContent,
      expiresIn: 3600,
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('handles database errors', async () => {
    (prisma.exportShare.create as jest.Mock).mockRejectedValue(new Error('DB error'));
    const request = mockRequest({
      filename: 'test.zip',
      content: 'test content',
      expiresIn: 3600,
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('handles very large file uploads', async () => {
      const largeContent = 'a'.repeat(9 * 1024 * 1024); // 9MB (just under limit)
      const request = mockRequest({
        filename: 'large.zip',
        content: largeContent,
        expiresIn: 3600,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(200);
    });

    it('rejects files exceeding size limit', async () => {
      const tooLargeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB (over limit)
      const request = mockRequest({
        filename: 'too-large.zip',
        content: tooLargeContent,
        expiresIn: 3600,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(400);
    });

    it('handles concurrent uploads from same user', async () => {
      const request = mockRequest({
        filename: 'test.zip',
        content: 'test content',
        expiresIn: 3600,
      });

      // Simulate concurrent requests
      const responses = await Promise.all([
        POST(request as any),
        POST(request as any),
        POST(request as any),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('handles Firebase storage quota exceeded', async () => {
      (uploadBytes as jest.Mock).mockRejectedValueOnce({
        code: 'storage/quota-exceeded',
        message: 'Storage quota exceeded',
      });

      const request = mockRequest({
        filename: 'test.zip',
        content: 'test content',
        expiresIn: 3600,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(507); // Insufficient Storage
    });

    it('handles invalid file types', async () => {
      const request = mockRequest({
        filename: 'test.exe',
        content: 'malicious content',
        expiresIn: 3600,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(400);
    });

    it('handles corrupted file content', async () => {
      const request = mockRequest({
        filename: 'test.zip',
        content: 'invalid base64 content',
        expiresIn: 3600,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(400);
    });

    it('handles database connection issues', async () => {
      (prisma.exportShare.create as jest.Mock).mockRejectedValueOnce({
        code: 'P1001',
        message: 'Database connection error',
      });

      const request = mockRequest({
        filename: 'test.zip',
        content: 'test content',
        expiresIn: 3600,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(503); // Service Unavailable
    });

    it('handles rate limiting', async () => {
      const request = mockRequest({
        filename: 'test.zip',
        content: 'test content',
        expiresIn: 3600,
      });

      // Simulate rapid requests
      for (let i = 0; i < 10; i++) {
        const response = await POST(request as any);
        if (i < 5) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429); // Too Many Requests
        }
      }
    });

    it('handles expired session during upload', async () => {
      const request = mockRequest({
        filename: 'test.zip',
        content: 'test content',
        expiresIn: 3600,
      });

      // Session expires after first check
      (getServerSession as jest.Mock)
        .mockResolvedValueOnce({ user: { id: 'user123' } })
        .mockResolvedValueOnce(null);

      const response = await POST(request as any);
      expect(response.status).toBe(401);
    });

    it('handles network interruptions during upload', async () => {
      (uploadBytes as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request = mockRequest({
        filename: 'test.zip',
        content: 'test content',
        expiresIn: 3600,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(500);
    });
  });
}); 