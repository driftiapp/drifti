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
} from 'recharts';

interface ErrorDetailsProps {
  data: Awaited<ReturnType<typeof DownloadLogger.prototype.getErrorStats>>;
}

export function ErrorDetails({ data }: ErrorDetailsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Error Types Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.errorTypes}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="#ef4444"
                  name="Error Count"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.errorTrends}
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
                <Bar
                  dataKey="count"
                  fill="#f97316"
                  name="Errors per Day"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Error Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.errorTypes.map((error) => (
              <div
                key={error.type}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{error.type}</h3>
                  <p className="text-sm text-muted-foreground">
                    Last occurred: {new Date(error.lastOccurrence).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{error.count} occurrences</p>
                  <p className="text-sm text-muted-foreground">
                    {error.percentage.toFixed(1)}% of total errors
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 