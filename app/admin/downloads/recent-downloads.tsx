import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DownloadLogger } from '@/lib/logger';
import { formatDistanceToNow } from 'date-fns';
import { DownloadLog } from '@prisma/client';

interface RecentDownloadsProps {
  data: DownloadLog[];
}

export function RecentDownloads({ data }: RecentDownloadsProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Speed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((download) => (
            <TableRow key={download.id}>
              <TableCell>{download.userId || 'Anonymous'}</TableCell>
              <TableCell>{download.filename}</TableCell>
              <TableCell>{download.speed ? `${download.speed.toFixed(2)} MB/s` : 'N/A'}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${download.status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}
                >
                  {download.status}
                </span>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(download.timestamp, { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 