'use client'

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeSelector } from "@/components/ui/date-range-selector";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Users, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorCard } from "@/components/ui/error-card";
import { MetricChange } from "@/components/ui/metric-change";

interface ActivityData {
  dailyActivity: Array<{
    date: string;
    activeUsers: number;
    sessions: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    activeUsers: number;
  }>;
  topUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    lastActive: string;
    sessions: number;
  }>;
  summary: {
    totalActiveUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    peakHour: number;
  };
}

export function ActivityView() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isComparing, setIsComparing] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (dateRange?.from) {
          params.append("from", dateRange.from.toISOString());
        }
        if (dateRange?.to) {
          params.append("to", dateRange.to.toISOString());
        }
        if (isComparing) {
          params.append("compare", "true");
        }

        const response = await fetch(`/api/dashboard/activity?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch activity data");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, isComparing]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            compareEnabled={isComparing}
            onCompareChange={setIsComparing}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            compareEnabled={isComparing}
            onCompareChange={setIsComparing}
          />
        </div>
        <ErrorCard
          title="Failed to load activity data"
          message={error}
          onRetry={() => {
            setError(null);
            setLoading(true);
          }}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            compareEnabled={isComparing}
            onCompareChange={setIsComparing}
          />
        </div>
        <ErrorCard
          title="No activity data available"
          message="There is no activity data available for the selected date range."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangeSelector
          value={dateRange}
          onChange={setDateRange}
          compareEnabled={isComparing}
          onCompareChange={setIsComparing}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), "MMMM d, yyyy")}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#8884d8"
                    name="Active Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#82ca9d"
                    name="Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="activeUsers"
                    fill="#8884d8"
                    name="Active Users"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{user.role}</span>
                    <span>•</span>
                    <span>{user.sessions} sessions</span>
                    <span>•</span>
                    <span>Last active: {format(new Date(user.lastActive), "PPp")}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 