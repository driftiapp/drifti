import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SessionExportProps {
  sessions: Array<{
    id: string;
    startedAt: string;
    endedAt: string;
    duration: number;
    device: string;
    browser: string;
    location: string;
  }>;
}

export function SessionExport({ sessions }: SessionExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      const headers = [
        'Session ID',
        'Start Time',
        'End Time',
        'Duration (minutes)',
        'Device',
        'Browser',
        'Location',
      ];
      
      const csvContent = [
        headers.join(','),
        ...sessions.map(session => [
          session.id,
          format(new Date(session.startedAt), 'yyyy-MM-dd HH:mm:ss'),
          format(new Date(session.endedAt), 'yyyy-MM-dd HH:mm:ss'),
          Math.round(session.duration / 60),
          session.device,
          session.browser,
          session.location,
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sessions_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Sessions exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting sessions to CSV:', error);
      toast.error('Failed to export sessions to CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      const { utils, writeFile } = await import('xlsx');
      
      const data = sessions.map(session => ({
        'Session ID': session.id,
        'Start Time': format(new Date(session.startedAt), 'yyyy-MM-dd HH:mm:ss'),
        'End Time': format(new Date(session.endedAt), 'yyyy-MM-dd HH:mm:ss'),
        'Duration (minutes)': Math.round(session.duration / 60),
        'Device': session.device,
        'Browser': session.browser,
        'Location': session.location,
      }));

      const worksheet = utils.json_to_sheet(data);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Sessions');
      
      writeFile(
        workbook,
        `sessions_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      );
      
      toast.success('Sessions exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting sessions to Excel:', error);
      toast.error('Failed to export sessions to Excel');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
          <FileDown className="mr-2 h-4 w-4" />
          Export to CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} disabled={isExporting}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 