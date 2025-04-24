import { NextResponse } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { getStorage, ref, deleteObject } from 'firebase/storage';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    exportShare: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  deleteObject: jest.fn(),
}));

describe('POST /api/exports/cleanup', () => {
  const mockExpiredShares = [
    {
      id: 'share1',
      filePath: 'exports/share1.zip',
      expiresAt: new Date(Date.now() - 1000),
    },
    {
      id: 'share2',
      filePath: 'exports/share2.zip',
      expiresAt: new Date(Date.now() - 2000),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.exportShare.findMany as jest.Mock).mockResolvedValue(mockExpiredShares);
    (deleteObject as jest.Mock).mockResolvedValue(undefined);
  });

  it('deletes expired shares and their files', async () => {
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('deletedCount', 2);
    expect(prisma.exportShare.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['share1', 'share2'],
        },
      },
    });
    expect(deleteObject).toHaveBeenCalledTimes(2);
  });

  it('handles no expired shares', async () => {
    (prisma.exportShare.findMany as jest.Mock).mockResolvedValue([]);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('deletedCount', 0);
    expect(prisma.exportShare.deleteMany).not.toHaveBeenCalled();
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('handles partial cleanup failures', async () => {
    (deleteObject as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('File not found'));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('deletedCount', 1);
    expect(data).toHaveProperty('errors');
    expect(data.errors).toHaveLength(1);
  });

  it('handles database errors', async () => {
    (prisma.exportShare.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const response = await POST();
    expect(response.status).toBe(500);
  });

  it('handles storage errors', async () => {
    (deleteObject as jest.Mock).mockRejectedValue(new Error('Storage error'));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('deletedCount', 0);
    expect(data).toHaveProperty('errors');
    expect(data.errors).toHaveLength(2);
  });

  it('handles concurrent cleanup requests', async () => {
    const responses = await Promise.all([
      POST(),
      POST(),
      POST(),
    ]);

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Ensure each share is only deleted once
    expect(prisma.exportShare.deleteMany).toHaveBeenCalledTimes(3);
    expect(deleteObject).toHaveBeenCalledTimes(2);
  });

  it('handles missing file paths', async () => {
    const sharesWithMissingPaths = [
      {
        id: 'share1',
        filePath: null,
        expiresAt: new Date(Date.now() - 1000),
      },
    ];
    (prisma.exportShare.findMany as jest.Mock).mockResolvedValue(sharesWithMissingPaths);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('deletedCount', 1);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('handles invalid file paths', async () => {
    const sharesWithInvalidPaths = [
      {
        id: 'share1',
        filePath: '../invalid/path',
        expiresAt: new Date(Date.now() - 1000),
      },
    ];
    (prisma.exportShare.findMany as jest.Mock).mockResolvedValue(sharesWithInvalidPaths);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('deletedCount', 1);
    expect(data).toHaveProperty('errors');
    expect(data.errors[0]).toContain('Invalid file path');
  });

  it('handles rate limiting', async () => {
    // Simulate rapid cleanup requests
    for (let i = 0; i < 10; i++) {
      const response = await POST();
      if (i < 5) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });
}); 