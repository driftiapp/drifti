import { describe, it, expect, vi, beforeEach } from 'vitest';
import { format } from 'date-fns';
import {
  exportToCSV,
  exportToExcel,
  exportChartAsImage,
  formatDataForExport,
  createExportOptions,
  createZipAndShare,
} from '../export-utils';
import { ExportData, ExportResult, ChartRef } from '../export-types';
import { toast } from 'sonner';
import JSZip from 'jszip';

// Mock HTMLCanvasElement
class MockCanvas {
  toDataURL = vi.fn().mockReturnValue('data:image/png;base64,test');
  getContext = vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    fillRect: vi.fn(),
  });
}

// Mock HTMLImageElement
class MockImage {
  onload = vi.fn();
  src = '';
  width = 100;
  height = 100;
}

// Mock HTMLDivElement
class MockDivElement {
  querySelector = vi.fn().mockReturnValue(new MockCanvas());
}

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file: jest.fn(),
    generateAsync: jest.fn().mockResolvedValue(new Blob()),
  }));
});

describe('Export Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global objects
    global.HTMLCanvasElement = MockCanvas as any;
    global.Image = MockImage as any;
    global.HTMLDivElement = MockDivElement as any;
  });

  describe('formatDataForExport', () => {
    it('should format normal data correctly', () => {
      const data = [
        { id: 1, name: 'Test', value: 100 },
        { id: 2, name: 'Test2', value: 200 },
      ];
      const result = formatDataForExport(data);
      expect(result.headers).toEqual(['id', 'name', 'value']);
      expect(result.rows).toEqual(data);
    });

    it('should handle nested data structures', () => {
      const data = [
        {
          id: 1,
          user: { name: 'John', email: 'john@test.com' },
          metrics: { views: 100, clicks: 50 },
        },
      ];
      const result = formatDataForExport(data);
      expect(result.headers).toEqual([
        'id',
        'user.name',
        'user.email',
        'metrics.views',
        'metrics.clicks',
      ]);
      expect(result.rows).toEqual(data);
    });

    it('should handle empty data', () => {
      const result = formatDataForExport([]);
      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('should use custom headers when provided', () => {
      const data = [{ id: 1, name: 'Test' }];
      const headers = ['ID', 'Name'];
      const result = formatDataForExport(data, headers);
      expect(result.headers).toEqual(headers);
      expect(result.rows).toEqual(data);
    });
  });

  describe('createExportOptions', () => {
    it('should create options with default filename', () => {
      const options = createExportOptions('test');
      expect(options.filename).toBe('test');
      expect(options.includeHeaders).toBe(true);
    });
  });

  describe('exportToCSV', () => {
    it('should export normal data to CSV', async () => {
      const data = [
        { id: 1, name: 'Test' },
        { id: 2, name: 'Test2' },
      ];
      const exportData = formatDataForExport(data);
      const result = await exportToCSV(exportData, createExportOptions('test'));
      expect(result.content).toContain('id,name');
      expect(result.content).toContain('1,Test');
      expect(result.content).toContain('2,Test2');
    });

    it('should handle empty data gracefully', async () => {
      const exportData = formatDataForExport([]);
      const result = await exportToCSV(exportData, createExportOptions('test'));
      expect(result.content).toBe('');
    });

    it('should escape special characters in CSV', async () => {
      const data = [{ text: 'Test, "with" quotes' }];
      const exportData = formatDataForExport(data);
      const result = await exportToCSV(exportData, createExportOptions('test'));
      expect(result.content).toContain('"Test, ""with"" quotes"');
    });
  });

  describe('exportToExcel', () => {
    it('should export normal data to Excel', async () => {
      const data = [
        { id: 1, name: 'Test' },
        { id: 2, name: 'Test2' },
      ];
      const exportData = formatDataForExport(data);
      const result = await exportToExcel(exportData, createExportOptions('test'));
      expect(result.content).toBeInstanceOf(Blob);
      expect((result.content as Blob).type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should handle empty data gracefully', async () => {
      const exportData = formatDataForExport([]);
      const result = await exportToExcel(exportData, createExportOptions('test'));
      expect(result.content).toBeInstanceOf(Blob);
    });
  });

  describe('exportChartAsImage', () => {
    it('should export chart as PNG image', async () => {
      const mockRef: ChartRef = {
        current: new MockDivElement() as unknown as HTMLDivElement,
      };
      const result = await exportChartAsImage(mockRef, createExportOptions('test'));
      expect(result.content).toBeInstanceOf(Blob);
      expect((result.content as Blob).type).toBe('image/png');
    });

    it('should handle missing chart element', async () => {
      const mockRef: ChartRef = { current: null };
      await expect(exportChartAsImage(mockRef, createExportOptions('test')))
        .rejects
        .toThrow('Chart element not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle CSV export errors', async () => {
      const data = [{ id: undefined }];
      const exportData = formatDataForExport(data);
      await expect(exportToCSV(exportData, createExportOptions('test')))
        .rejects
        .toThrow();
    });

    it('should handle Excel export errors', async () => {
      const data = [{ id: undefined }];
      const exportData = formatDataForExport(data);
      await expect(exportToExcel(exportData, createExportOptions('test')))
        .rejects
        .toThrow();
    });

    it('should handle image export errors', async () => {
      const mockRef: ChartRef = {
        current: {
          querySelector: () => null,
        } as unknown as HTMLDivElement,
      };
      await expect(exportChartAsImage(mockRef, createExportOptions('test')))
        .rejects
        .toThrow('Canvas element not found');
    });
  });

  describe('createZipAndShare', () => {
    const mockData = [
      {
        filename: 'test.csv',
        content: 'test,content',
        type: 'text/csv',
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      global.fetch = jest.fn();
    });

    it('creates a zip file with the correct content', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shareUrl: 'https://example.com/share/123',
          expiresAt: new Date(),
        }),
      });

      await createZipAndShare(mockData, { filename: 'test' });

      expect(JSZip).toHaveBeenCalled();
      const zipInstance = (JSZip as jest.Mock).mock.results[0].value;
      expect(zipInstance.file).toHaveBeenCalledWith(
        'test.csv',
        'test,content',
        { binary: false }
      );
    });

    it('handles binary content correctly', async () => {
      const binaryData = new Blob(['test'], { type: 'application/octet-stream' });
      const mockDataWithBinary = [
        {
          filename: 'test.bin',
          content: binaryData,
          type: 'application/octet-stream',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shareUrl: 'https://example.com/share/123',
          expiresAt: new Date(),
        }),
      });

      await createZipAndShare(mockDataWithBinary, { filename: 'test' });

      const zipInstance = (JSZip as jest.Mock).mock.results[0].value;
      expect(zipInstance.file).toHaveBeenCalledWith(
        'test.bin',
        expect.any(String),
        { binary: true }
      );
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const result = await createZipAndShare(mockData, { filename: 'test' });

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Failed to create share link');
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await createZipAndShare(mockData, { filename: 'test' });

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Failed to create share link');
    });

    it('uses default expiration time when not specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shareUrl: 'https://example.com/share/123',
          expiresAt: new Date(),
        }),
      });

      await createZipAndShare(mockData, { filename: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/exports/share',
        expect.objectContaining({
          body: expect.stringContaining('"expiresIn":86400'),
        })
      );
    });

    it('uses custom expiration time when specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shareUrl: 'https://example.com/share/123',
          expiresAt: new Date(),
        }),
      });

      await createZipAndShare(mockData, { 
        filename: 'test',
        shareExpiresIn: 3600, // 1 hour
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/exports/share',
        expect.objectContaining({
          body: expect.stringContaining('"expiresIn":3600'),
        })
      );
    });
  });
}); 