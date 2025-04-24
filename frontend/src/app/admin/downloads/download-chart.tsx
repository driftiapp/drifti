import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DownloadLogger } from '@/lib/logger';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DownloadLog } from '@prisma/client';

interface DownloadData {
  date: string;
  successful: number;
  failed: number;
  averageSpeed: number;
}

export async function DownloadChart() {
  const logger = DownloadLogger.getInstance();
  const recentDownloads = await logger.getRecentDownloads(30); // Get last 30 days

  // Process data for the chart
  const chartData: DownloadData[] = recentDownloads.reduce((acc: DownloadData[], download: DownloadLog) => {
    const date = new Date(download.timestamp).toISOString().split('T')[0];
    const existingData = acc.find(d => d.date === date);

    if (existingData) {
      if (download.status === 'success') {
        existingData.successful++;
      } else {
        existingData.failed++;
      }
      existingData.averageSpeed = (existingData.averageSpeed + download.speed) / 2;
    } else {
      acc.push({
        date,
        successful: download.status === 'success' ? 1 : 0,
        failed: download.status !== 'success' ? 1 : 0,
        averageSpeed: download.speed,
      });
    }

    return acc;
  }, []);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Download Statistics Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="successful"
                stroke="#22c55e"
                name="Successful Downloads"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="failed"
                stroke="#ef4444"
                name="Failed Downloads"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="averageSpeed"
                stroke="#3b82f6"
                name="Average Speed (MB/s)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 