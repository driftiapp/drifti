import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShareExportModal } from '@/components/ui/share-export-modal';
import { createZipAndShare } from '@/lib/export-utils';
import { toast } from 'sonner';
import { Share2, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExportFile {
  filename: string;
  content: BlobPart | string;
  type: string;
}

interface ExportShareButtonProps {
  data: ExportFile[];
  filename: string;
  tooltip?: string;
  className?: string;
}

export function ExportShareButton({
  data,
  filename,
  tooltip = 'Export and share this data',
  className,
}: ExportShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const handleExportAndShare = async () => {
    if (!data.length) {
      toast.warning('No data to export');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createZipAndShare(
        data.map(file => ({
          filename: file.filename,
          content: typeof file.content === 'string' ? file.content : new Blob([file.content]).toString(),
          type: file.type
        })),
        { filename: `${filename}-${Date.now()}` }
      );

      if (result) {
        setShareUrl(result.shareUrl);
        setExpiresAt(result.expiresAt);
        setIsShareModalOpen(true);
        toast.success('Export created successfully');
      }
    } catch (error) {
      console.error('[Export Error]', error);
      toast.error('Failed to create export');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleExportAndShare}
            disabled={isLoading || !data.length}
            className={className}
            aria-label={tooltip}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Export & Share
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
      {shareUrl && expiresAt && (
        <ShareExportModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareUrl={shareUrl}
          expiresAt={expiresAt}
        />
      )}
    </TooltipProvider>
  );
} 