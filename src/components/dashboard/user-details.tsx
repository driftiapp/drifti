'use client'

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  Clock,
  TrendingUp,
  ChevronRight,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorCard } from "@/components/ui/error-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButton } from "@/components/ui/export-button";
import { exportToCSV, exportToExcel, exportChartAsImage, formatDataForExport, createExportOptions } from "@/lib/export-utils";
import React from "react";
import { SessionExport } from './session-export';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { DataExport } from '@/components/ui/data-export';
import { ZipExport } from '@/components/ui/zip-export';
import { ExportData } from '@/lib/export-types';

interface ActivityData {
  date: string;
  sessions: number;
  duration: number;
}

interface DeviceData {
  type: string;
  count: number;
}

interface UserData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    lastActive: string;
    totalSessions: number;
    averageSessionDuration: number;
    devices: DeviceData[];
    browsers: Array<{
      name: string;
      count: number;
    }>;
    locations: Array<{
      country: string;
      city: string;
      count: number;
    }>;
  };
  activity: ActivityData[];
  recentSessions: Array<{
    id: string;
    startedAt: string;
    endedAt: string;
    duration: number;
    device: string;
    browser: string;
    location: string;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
}

interface TabsListProps {
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

interface ExportConfig {
  filename: string;
  data: ExportData<any>;
  type: 'csv' | 'excel' | 'image';
  chartRef?: React.RefObject<HTMLDivElement>;
}

export function UserDetails({ userId }: { userId: string }) {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const router = useRouter();
  const activityChartRef = useRef<HTMLDivElement>(null);
  const devicesChartRef = useRef<HTMLDivElement>(null);

  const chartData = React.useMemo(() => data?.activity || [], [data?.activity]);
  const devicesData = React.useMemo(() => data?.user.devices || [], [data?.user.devices]);

  const formattedDateRange = dateRange ? {
    from: dateRange.from,
    to: dateRange.to,
  } : undefined;

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

        const response = await fetch(`/api/dashboard/users/${userId}?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const result = await response.json();
        setData(result as UserData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, dateRange]);

  const handleExportActivityCSV = async () => {
    if (data?.activity) {
      const exportData = formatDataForExport(data.activity);
      const options = createExportOptions(`user-${userId}-activity`);
      await exportToCSV(exportData, options);
    }
  };

  const handleExportActivityExcel = async () => {
    if (data?.activity) {
      const exportData = formatDataForExport(data.activity);
      const options = createExportOptions(`user-${userId}-activity`);
      await exportToExcel(exportData, options);
    }
  };

  const handleExportActivityImage = async () => {
    const options = createExportOptions(`user-${userId}-activity-chart`);
    await exportChartAsImage(activityChartRef, options);
  };

  const handleExportDevicesImage = async () => {
    const options = createExportOptions(`user-${userId}-devices-chart`);
    await exportChartAsImage(devicesChartRef, options);
  };

  const handleExportDevicesCSV = async () => {
    if (data?.user.devices) {
      const exportData = formatDataForExport(data.user.devices);
      const options = createExportOptions(`user-${userId}-devices`);
      await exportToCSV(exportData, options);
    }
  };

  const handleExportDevicesExcel = async () => {
    if (data?.user.devices) {
      const exportData = formatDataForExport(data.user.devices);
      const options = createExportOptions(`user-${userId}-devices`);
      await exportToExcel(exportData, options);
    }
  };

  const handleExportBrowsersCSV = async () => {
    if (data?.user.browsers) {
      const exportData = formatDataForExport(data.user.browsers);
      const options = createExportOptions(`user-${userId}-browsers`);
      await exportToCSV(exportData, options);
    }
  };

  const handleExportBrowsersExcel = async () => {
    if (data?.user.browsers) {
      const exportData = formatDataForExport(data.user.browsers);
      const options = createExportOptions(`user-${userId}-browsers`);
      await exportToExcel(exportData, options);
    }
  };

  const handleExportLocationsCSV = async () => {
    if (data?.user.locations) {
      const exportData = formatDataForExport(data.user.locations);
      const options = createExportOptions(`user-${userId}-locations`);
      await exportToCSV(exportData, options);
    }
  };

  const handleExportLocationsExcel = async () => {
    if (data?.user.locations) {
      const exportData = formatDataForExport(data.user.locations);
      const options = createExportOptions(`user-${userId}-locations`);
      await exportToExcel(exportData, options);
    }
  };

  const getExportConfigs = (): ExportConfig[] => {
    const configs: ExportConfig[] = [];

    if (data?.activity) {
      configs.push({
        filename: `user-${userId}-activity`,
        data: formatDataForExport(data.activity, ['date', 'sessions', 'duration']),
        type: 'csv',
      });

      if (activityChartRef.current) {
        configs.push({
          filename: `user-${userId}-activity-chart`,
          data: formatDataForExport(data.activity, ['date', 'sessions', 'duration']),
          type: 'image',
          chartRef: activityChartRef,
        });
      }
    }

    if (data?.user.devices) {
      configs.push({
        filename: `user-${userId}-devices`,
        data: formatDataForExport(data.user.devices, ['type', 'count']),
        type: 'csv',
      });

      if (devicesChartRef.current) {
        configs.push({
          filename: `user-${userId}-devices-chart`,
          data: formatDataForExport(data.user.devices, ['type', 'count']),
          type: 'image',
          chartRef: devicesChartRef,
        });
      }
    }

    if (data?.user.browsers) {
      configs.push({
        filename: `user-${userId}-browsers`,
        data: formatDataForExport(data.user.browsers, ['name', 'count']),
        type: 'csv',
      });
    }

    if (data?.user.locations) {
      configs.push({
        filename: `user-${userId}-locations`,
        data: formatDataForExport(data.user.locations, ['country', 'city', 'count']),
        type: 'csv',
      });
    }

    if (data?.recentSessions) {
      configs.push({
        filename: `user-${userId}-sessions`,
        data: formatDataForExport(data.recentSessions, ['id', 'startedAt', 'endedAt', 'duration', 'device', 'browser', 'location']),
        type: 'csv',
      });
    }

    return configs;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <ZipExport
            exports={getExportConfigs()}
            userId={userId}
            dateRange={formattedDateRange}
          />
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
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
        <div className="flex justify-end gap-2">
          <ZipExport
            exports={getExportConfigs()}
            userId={userId}
            dateRange={formattedDateRange}
          />
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
        <ErrorCard
          title="Failed to load user data"
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
        <div className="flex justify-end gap-2">
          <ZipExport
            exports={getExportConfigs()}
            userId={userId}
            dateRange={formattedDateRange}
          />
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
        <ErrorCard
          title="No user data available"
          message="There is no data available for this user."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <ZipExport
          exports={getExportConfigs()}
          userId={userId}
          dateRange={formattedDateRange}
        />
        <DateRangeSelector
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{data.user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{data.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={data.user.role === "ADMIN" ? "default" : "secondary"}>
                {data.user.role}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                Back to Activity
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Member Since</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(data.user.createdAt), "PP")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Active</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(data.user.lastActive), "PPp")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Sessions</p>
              <p className="text-sm text-muted-foreground">
                {data.user.totalSessions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="devices">Devices & Browsers</TabsTrigger>
          <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <div className="grid gap-4 md:grid-cols-2">
            <Card ref={activityChartRef}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daily Activity</CardTitle>
                  <DataExport
                    data={chartData}
                    filename={`user-${userId}-activity`}
                    chartRef={activityChartRef}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
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
                        dataKey="sessions"
                        stroke="#8884d8"
                        name="Sessions"
                      />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        stroke="#82ca9d"
                        name="Duration (min)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card ref={devicesChartRef}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Device Usage</CardTitle>
                  <DataExport
                    data={devicesData}
                    filename={`user-${userId}-devices`}
                    chartRef={devicesChartRef}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={devicesData}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {devicesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Browser Usage</CardTitle>
                  <DataExport
                    data={data?.user.browsers}
                    filename={`user-${userId}-browsers`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.user.browsers.map((browser) => (
                    <div
                      key={browser.name}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{browser.name}</span>
                      </div>
                      <Badge variant="outline">{browser.count} sessions</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Locations</CardTitle>
                  <DataExport
                    data={data?.user.locations}
                    filename={`user-${userId}-locations`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.user.locations.map((location) => (
                    <div
                      key={`${location.country}-${location.city}`}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {location.city}, {location.country}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {location.count} sessions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Sessions</h3>
            <SessionExport sessions={data?.recentSessions} />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Browser</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.device}</TableCell>
                    <TableCell>{session.browser}</TableCell>
                    <TableCell>{session.location}</TableCell>
                    <TableCell>
                      {format(new Date(session.startedAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {Math.round(session.duration / 60)} minutes
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.endedAt ? 'secondary' : 'default'}>
                        {session.endedAt ? 'Completed' : 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}