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
  BarChart,
  Bar,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TimelineDataPoint {
  date: string;
  downloads: number;
  successful: number;
  failed: number;
  averageSpeed: number;
  errorRate: number;
}

export async function DownloadHistory() {
  const logger = DownloadLogger.getInstance();
  const [dayData, weekData, monthData] = await Promise.all([
    logger.getTimelineData('day'),
    logger.getTimelineData('week'),
    logger.getTimelineData('month'),
  ]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="day">
        <TabsList>
          <TabsTrigger value="day">Last 24 Hours</TabsTrigger>
          <TabsTrigger value="week">Last Week</TabsTrigger>
          <TabsTrigger value="month">Last Month</TabsTrigger>
        </TabsList>

        <TabsContent value="day">
          <DownloadTimeline data={dayData} />
        </TabsContent>
        <TabsContent value="week">
          <DownloadTimeline data={weekData} />
        </TabsContent>
        <TabsContent value="month">
          <DownloadTimeline data={monthData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DownloadTimeline({ data }: { data: TimelineDataPoint[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Download Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="downloads" fill="#3b82f6" name="Total Downloads" />
                <Bar dataKey="successful" fill="#22c55e" name="Successful" />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="averageSpeed"
                  stroke="#3b82f6"
                  name="Average Speed (MB/s)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="errorRate"
                  stroke="#ef4444"
                  name="Error Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 