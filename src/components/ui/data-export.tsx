import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileDown, FileSpreadsheet, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { exportToCSV, exportToExcel, exportChartAsImage, formatDataForExport, createExportOptions } from '@/lib/export-utils';
import { ExportData } from '@/lib/export-types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataExportProps<T> {
  data: T[];
  filename: string;
  headers?: string[];
  chartRef?: React.RefObject<HTMLDivElement>;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onExportImage?: () => void;
  className?: string;
  tooltip?: string;
}

export function DataExport<T>({
  data,
  filename,
  headers,
  chartRef,
  onExportCSV,
  onExportExcel,
  onExportImage,
  className,
  tooltip = "Export data in various formats",
}: DataExportProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (!data.length) {
      toast.warning("No data available for export");
      return;
    }
    try {
      setIsExporting(true);
      if (onExportCSV) {
        onExportCSV();
      } else {
        const exportData = formatDataForExport(data, headers);
        const options = createExportOptions(filename);
        await exportToCSV(exportData, options);
      }
      toast.success('Data exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export to CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!data.length) {
      toast.warning("No data available for export");
      return;
    }
    try {
      setIsExporting(true);
      if (onExportExcel) {
        onExportExcel();
      } else {
        const exportData = formatDataForExport(data, headers);
        const options = createExportOptions(filename);
        await exportToExcel(exportData, options);
      }
      toast.success('Data exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (!chartRef?.current) {
      toast.warning("No chart available for export");
      return;
    }
    try {
      setIsExporting(true);
      if (onExportImage) {
        onExportImage();
      } else {
        const options = createExportOptions(filename);
        await exportChartAsImage(chartRef, options);
      }
      toast.success('Chart exported as image successfully');
    } catch (error) {
      console.error('Error exporting chart as image:', error);
      toast.error('Failed to export chart as image');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isExporting} 
                className={className}
                aria-label="Export data"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleExportCSV} 
                disabled={isExporting}
                aria-label="Export to CSV"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportExcel} 
                disabled={isExporting}
                aria-label="Export to Excel"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export to Excel
              </DropdownMenuItem>
              {chartRef && (
                <DropdownMenuItem 
                  onClick={handleExportImage} 
                  disabled={isExporting}
                  aria-label="Export chart as image"
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  Export as Image
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 