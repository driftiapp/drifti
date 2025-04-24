import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileArchive } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { exportToCSV, exportToExcel, exportChartAsImage, formatDataForExport, createExportOptions } from '@/lib/export-utils';
import { ExportData, Metadata } from '@/lib/export-types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExportItem {
  filename: string;
  data: ExportData<any>;
  type: 'csv' | 'excel' | 'image';
  chartRef?: React.RefObject<HTMLDivElement>;
}

interface ZipExportProps {
  exports: ExportItem[];
  userId: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  className?: string;
  tooltip?: string;
}

export function ZipExport({
  exports,
  userId,
  dateRange,
  className,
  tooltip = "Export all data as a ZIP file",
}: ZipExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generateMetadata = (): Metadata => {
    return {
      exportedAt: new Date().toISOString(),
      userId,
      dateRange: dateRange ? {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
      } : undefined,
      files: exports.map(exp => ({
        filename: exp.filename,
        type: exp.type,
      })),
    };
  };

  const handleExport = async () => {
    if (!exports.length) {
      toast.warning("No data available for export");
      return;
    }

    try {
      setIsExporting(true);
      const zip = new JSZip();
      const metadata = generateMetadata();
      
      // Add metadata file
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Process each export
      for (const exp of exports) {
        try {
          let result;
          switch (exp.type) {
            case 'csv':
              if (!exp.data.rows.length) {
                toast.warning(`No data available for ${exp.filename}`);
                continue;
              }
              result = await exportToCSV(exp.data, createExportOptions(exp.filename));
              zip.file(`${exp.filename}.csv`, result.content as string);
              break;
            case 'excel':
              if (!exp.data.rows.length) {
                toast.warning(`No data available for ${exp.filename}`);
                continue;
              }
              result = await exportToExcel(exp.data, createExportOptions(exp.filename));
              zip.file(`${exp.filename}.xlsx`, result.content as Blob);
              break;
            case 'image':
              if (!exp.chartRef?.current) {
                toast.warning(`No chart available for ${exp.filename}`);
                continue;
              }
              result = await exportChartAsImage(exp.chartRef, createExportOptions(exp.filename));
              zip.file(`${exp.filename}.png`, result.content as Blob);
              break;
          }
        } catch (error) {
          console.error(`Error processing ${exp.filename}:`, error);
          toast.error(`Failed to export ${exp.filename}`);
        }
      }

      // Generate ZIP file
      const content = await zip.generateAsync({ type: 'blob' });
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = `user-${userId}-metrics_${dateStr}.zip`;
      saveAs(content, filename);
      toast.success('All data exported successfully');
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      toast.error('Failed to create ZIP file');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || !exports.length}
            className={className}
            aria-label="Export all data as ZIP"
          >
            <FileArchive className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 