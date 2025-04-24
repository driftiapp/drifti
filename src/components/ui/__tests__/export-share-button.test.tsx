import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportShareButton } from '../export-share-button';
import { toast } from 'sonner';
import { createZipAndShare } from '@/lib/export-utils';

// Mock the toast and createZipAndShare functions
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@/lib/export-utils', () => ({
  createZipAndShare: jest.fn(),
}));

describe('ExportShareButton', () => {
  const mockData = [
    {
      filename: 'test.csv',
      content: 'test,content',
      type: 'text/csv',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button with correct text and icon', () => {
    render(<ExportShareButton data={mockData} filename="test" />);
    expect(screen.getByText('Export & Share')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows loading state when exporting', async () => {
    (createZipAndShare as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<ExportShareButton data={mockData} filename="test" />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows warning toast when no data is provided', () => {
    render(<ExportShareButton data={[]} filename="test" />);
    fireEvent.click(screen.getByRole('button'));
    expect(toast.warning).toHaveBeenCalledWith('No data to export');
  });

  it('successfully creates and shares export', async () => {
    const mockResult = {
      shareUrl: 'https://example.com/share/123',
      expiresAt: new Date(Date.now() + 86400000),
    };
    (createZipAndShare as jest.Mock).mockResolvedValue(mockResult);

    render(<ExportShareButton data={mockData} filename="test" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(createZipAndShare).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            filename: 'test.csv',
            type: 'text/csv',
          }),
        ]),
        expect.objectContaining({
          filename: expect.stringMatching(/test-\d+/),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Export created successfully');
    });
  });

  it('handles export errors gracefully', async () => {
    (createZipAndShare as jest.Mock).mockRejectedValue(new Error('Export failed'));
    render(<ExportShareButton data={mockData} filename="test" />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create export');
      expect(console.error).toHaveBeenCalledWith('[Export Error]', expect.any(Error));
    });
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

    (createZipAndShare as jest.Mock).mockResolvedValue({
      shareUrl: 'https://example.com/share/123',
      expiresAt: new Date(),
    });

    render(<ExportShareButton data={mockDataWithBinary} filename="test" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(createZipAndShare).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            filename: 'test.bin',
            type: 'application/octet-stream',
          }),
        ]),
        expect.any(Object)
      );
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('handles very large files gracefully', async () => {
      const largeContent = 'a'.repeat(10 * 1024 * 1024); // 10MB
      const largeData = [
        {
          filename: 'large.csv',
          content: largeContent,
          type: 'text/csv',
        },
      ];

      (createZipAndShare as jest.Mock).mockResolvedValue({
        shareUrl: 'https://example.com/share/123',
        expiresAt: new Date(),
      });

      render(<ExportShareButton data={largeData} filename="large-test" />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(createZipAndShare).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              filename: 'large.csv',
              type: 'text/csv',
            }),
          ]),
          expect.any(Object)
        );
      });
    });

    it('handles multiple large files', async () => {
      const largeData = Array(5).fill(null).map((_, i) => ({
        filename: `large-${i}.csv`,
        content: 'a'.repeat(2 * 1024 * 1024), // 2MB each
        type: 'text/csv',
      }));

      (createZipAndShare as jest.Mock).mockResolvedValue({
        shareUrl: 'https://example.com/share/123',
        expiresAt: new Date(),
      });

      render(<ExportShareButton data={largeData} filename="multi-large" />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(createZipAndShare).toHaveBeenCalledWith(
          expect.arrayContaining(
            largeData.map(file => expect.objectContaining({
              filename: file.filename,
              type: file.type,
            }))
          ),
          expect.any(Object)
        );
      });
    });

    it('handles network interruptions during upload', async () => {
      (createZipAndShare as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          shareUrl: 'https://example.com/share/123',
          expiresAt: new Date(),
        });

      render(<ExportShareButton data={mockData} filename="test" />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create export');
      });

      // Retry should work
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Export created successfully');
      });
    });

    it('handles invalid file types', async () => {
      const invalidData = [
        {
          filename: 'test.exe',
          content: 'malicious content',
          type: 'application/x-msdownload',
        },
      ];

      render(<ExportShareButton data={invalidData} filename="test" />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(createZipAndShare).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              filename: 'test.exe',
              type: 'application/x-msdownload',
            }),
          ]),
          expect.any(Object)
        );
      });
    });

    it('handles missing file content', async () => {
      const incompleteData = [
        {
          filename: 'test.csv',
          // Missing content
          type: 'text/csv',
        },
      ];

      render(<ExportShareButton data={incompleteData} filename="test" />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create export');
      });
    });

    it('handles concurrent exports', async () => {
      const mockResults = [
        {
          shareUrl: 'https://example.com/share/1',
          expiresAt: new Date(),
        },
        {
          shareUrl: 'https://example.com/share/2',
          expiresAt: new Date(),
        },
      ];

      (createZipAndShare as jest.Mock)
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      render(<ExportShareButton data={mockData} filename="test" />);
      
      // Trigger two exports quickly
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(createZipAndShare).toHaveBeenCalledTimes(2);
        expect(toast.success).toHaveBeenCalledTimes(2);
      });
    });
  });
}); 