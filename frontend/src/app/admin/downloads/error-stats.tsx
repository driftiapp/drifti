import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DownloadLogger } from '@/lib/logger';

interface ErrorStatsProps {
  data: Awaited<ReturnType<typeof DownloadLogger.prototype.getErrorStats>>;
}

export function ErrorStats({ data }: ErrorStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Error Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.errorRate.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {data.totalErrors} errors out of {data.totalDownloads} downloads
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Error Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.errorTypes.map((error) => (
              <div key={error.type} className="flex justify-between">
                <span className="text-sm">{error.type}</span>
                <span className="text-sm font-medium">{error.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.errorTrends.map((trend) => (
              <div key={trend.period} className="flex justify-between">
                <span className="text-sm">{trend.period}</span>
                <span className="text-sm font-medium">{trend.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 