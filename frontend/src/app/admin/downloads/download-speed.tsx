import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DownloadLogger } from '@/lib/logger';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export async function DownloadSpeed() {
  const logger = DownloadLogger.getInstance();
  const speedStats = await logger.getSpeedStats('week');

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Download Speed Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Speed</p>
              <p className="text-2xl font-bold">{speedStats.averageSpeed.toFixed(2)} MB/s</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Minimum Speed</p>
              <p className="text-2xl font-bold">{speedStats.minSpeed.toFixed(2)} MB/s</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Maximum Speed</p>
              <p className="text-2xl font-bold">{speedStats.maxSpeed.toFixed(2)} MB/s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Speed Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={speedStats.speedTrends}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
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

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Speed Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={speedStats.speedDistribution}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="#22c55e"
                  name="Number of Downloads"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 