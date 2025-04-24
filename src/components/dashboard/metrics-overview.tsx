import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, CheckCircle, Clock, TrendingUp, PieChart, BarChart, ChevronRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  Legend,
  Area,
  AreaChart,
  TooltipProps
} from "recharts";
import { DateRangeSelector } from "@/components/ui/date-range-selector";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import Link from "next/link";
import { MetricChange } from "@/components/ui/metric-change";
import { MetricCardSkeleton } from "@/components/ui/metric-card-skeleton";
import { ErrorCard } from "@/components/ui/error-card";

interface MetricsData {
  current: {
    newUsers: number;
    activeUsers: number;
    totalInvitations: number;
    acceptedInvitations: number;
  };
  previous: {
    newUsers: number;
    activeUsers: number;
    totalInvitations: number;
    acceptedInvitations: number;
  };
  changes: {
    newUsers: number;
    activeUsers: number;
    totalInvitations: number;
    acceptedInvitations: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function MetricsOverview() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const getDateRangeQuery = () => {
    if (!dateRange?.from || !dateRange?.to) return "";
    return `?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`;
  };

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/metrics${getDateRangeQuery()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [getDateRangeQuery]);

  useEffect(() => {
    fetchMetrics();
  }, [dateRange, fetchMetrics]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
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
          />
        </div>
        <ErrorCard
          title="Failed to load metrics"
          message={error}
          onRetry={fetchMetrics}
        />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
        <ErrorCard
          title="No metrics available"
          message="There are no metrics available for the selected date range."
        />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-sm font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-sm">{payload[0].value} users</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangeSelector
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href={`/dashboard/users${getDateRangeQuery()}` as any}>
          <Card className="group hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.current.newUsers}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {metrics.current.newUsers} new users
                </p>
                <MetricChange
                  value={metrics.changes.newUsers}
                  previousValue={metrics.previous.newUsers}
                  label="new users"
                />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/activity${getDateRangeQuery()}` as any}>
          <Card className="group hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.current.activeUsers}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(dateRange?.from || new Date()), "MMM d")} - {format(new Date(dateRange?.to || new Date()), "MMM d")}
                </p>
                <MetricChange
                  value={metrics.changes.activeUsers}
                  previousValue={metrics.previous.activeUsers}
                  label="active users"
                />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/invitations${getDateRangeQuery()}` as any}>
          <Card className="group hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invitations</CardTitle>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.current.totalInvitations}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                  {metrics.current.acceptedInvitations} accepted
                  <Clock className="ml-2 mr-1 h-3 w-3 text-yellow-500" />
                  {metrics.current.totalInvitations - metrics.current.acceptedInvitations} pending
                </div>
                <MetricChange
                  value={metrics.changes.totalInvitations}
                  previousValue={metrics.previous.totalInvitations}
                  label="invitations"
                />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/analytics${getDateRangeQuery()}` as any}>
          <Card className="group hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((metrics.current.acceptedInvitations / metrics.current.totalInvitations) * 100)}%
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Of total invitations
                </p>
                <MetricChange
                  value={metrics.changes.acceptedInvitations}
                  previousValue={metrics.previous.acceptedInvitations}
                  label="accepted invitations"
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
} 