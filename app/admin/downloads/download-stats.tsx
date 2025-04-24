import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DownloadLogger } from '@/lib/logger';

interface DownloadStatsProps {
  filename: string;
}

interface DownloadStats {
  count: number;
  lastDownload: Date;
  successfulDownloads: number;
  failedDownloads: number;
  totalSize: number;
  averageSize: number;
  averageDownloadTime?: number;
}

export function DownloadStats({ filename }: DownloadStatsProps) {
  const stats = DownloadLogger.getInstance().getDownloadStats(filename) as DownloadStats;

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.count}</div>
          <p className="text-xs text-muted-foreground">
            Last download: {new Date(stats.lastDownload).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.count > 0 ? Math.round((stats.successfulDownloads / stats.count) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.successfulDownloads} successful / {stats.count} total
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.failedDownloads}</div>
          <p className="text-xs text-muted-foreground">
            {stats.failedDownloads} failed / {stats.count} total
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">File Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(stats.averageSize / 1024 / 1024).toFixed(2)} MB
          </div>
          <p className="text-xs text-muted-foreground">
            Average size per download
          </p>
        </CardContent>
      </Card>
      {stats.averageDownloadTime !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Download Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageDownloadTime ? `${stats.averageDownloadTime}ms` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average time per download
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 