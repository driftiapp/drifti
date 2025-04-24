import { NextResponse } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    exportShare: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('GET /api/exports/[id]', () => {
  const mockShare = {
    id: 'share123',
    filePath: 'exports/share123.zip',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    userId: 'user123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.exportShare.findUnique as jest.Mock).mockResolvedValue(mockShare);
    (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/file.zip');
  });

  it('successfully downloads a valid share', async () => {
    const request = new Request('http://localhost/api/exports/share123');
    const response = await GET(request, { params: { id: 'share123' } });

    expect(response.status).toBe(200);
    expect(prisma.exportShare.findUnique).toHaveBeenCalledWith({
      where: { id: 'share123' },
    });
    expect(getDownloadURL).toHaveBeenCalled();
  });

  it('handles non-existent shares', async () => {
    (prisma.exportShare.findUnique as jest.Mock).mockResolvedValue(null);
    const request = new Request('http://localhost/api/exports/nonexistent');
    const response = await GET(request, { params: { id: 'nonexistent' } });

    expect(response.status).toBe(404);
  });

  it('handles expired shares', async () => {
    (prisma.exportShare.findUnique as jest.Mock).mockResolvedValue({
      ...mockShare,
      expiresAt: new Date(Date.now() - 1000), // Expired
    });
    const request = new Request('http://localhost/api/exports/share123');
    const response = await GET(request, { params: { id: 'share123' } });

    expect(response.status).toBe(410); // Gone
  });

  it('handles missing file paths', async () => {
    (prisma.exportShare.findUnique as jest.Mock).mockResolvedValue({
      ...mockShare,
      filePath: null,
    });
    const request = new Request('http://localhost/api/exports/share123');
    const response = await GET(request, { params: { id: 'share123' } });

    expect(response.status).toBe(404);
  });

  it('handles invalid file paths', async () => {
    (prisma.exportShare.findUnique as jest.Mock).mockResolvedValue({
      ...mockShare,
      filePath: '../invalid/path',
    });
    const request = new Request('http://localhost/api/exports/share123');
    const response = await GET(request, { params: { id: 'share123' } });

    expect(response.status).toBe(400);
  });

  it('handles storage errors', async () => {
    (getDownloadURL as jest.Mock).mockRejectedValue(new Error('File not found'));
    const request = new Request('http://localhost/api/exports/share123');
    const response = await GET(request, { params: { id: 'share123' } });

    expect(response.status).toBe(404);
  });

  it('handles concurrent downloads', async () => {
    const request = new Request('http://localhost/api/exports/share123');
    const responses = await Promise.all([
      GET(request, { params: { id: 'share123' } }),
      GET(request, { params: { id: 'share123' } }),
      GET(request, { params: { id: 'share123' } }),
    ]);

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('handles database errors', async () => {
    (prisma.exportShare.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
    const request = new Request('http://localhost/api/exports/share123');
    const response = await GET(request, { params: { id: 'share123' } });

    expect(response.status).toBe(500);
  });

  it('handles rate limiting', async () => {
    const request = new Request('http://localhost/api/exports/share123');
    
    // Simulate rapid requests
    for (let i = 0; i < 10; i++) {
      const response = await GET(request, { params: { id: 'share123' } });
      if (i < 5) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });

  it('handles malformed share IDs', async () => {
    const request = new Request('http://localhost/api/exports/invalid-id');
    const response = await GET(request, { params: { id: 'invalid-id' } });

    expect(response.status).toBe(400);
  });

  it('handles deleted shares', async () => {
    (prisma.exportShare.findUnique as jest.Mock).mockResolvedValue({
      ...mockShare,
      deletedAt: new Date(),
    });
    const request = new Request('http://localhost/api/exports/share123');
    const response = await GET(request, { params: { id: 'share123' } });

    expect(response.status).toBe(410);
  });
}); 