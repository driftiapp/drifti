'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
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
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, FileDown, FileJson, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useAnalyticsCache } from '@/hooks/useAnalyticsCache';
import { ChartTooltip, InfoTooltip } from '@/components/ui/enhanced-tooltip';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { exportToCSV, exportToJSON, formatCurrency, formatPercentage } from '@/lib/export-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAnalyticsFilter } from '@/hooks/useAnalyticsFilter';
import { ComparisonMetrics } from '@/components/analytics/ComparisonMetrics';
import { FilterPanel } from '@/components/analytics/FilterPanel';

interface PaymentAnalyticsProps {
  storeId?: string;
}

interface AnalyticsData {
  dailyMetrics: {
    totalRevenue: number;
    totalTransactions: number;
    successfulTransactions: number;
    averageAmount: number;
  };
  methodBreakdown: Array<{
    method: string;
    provider: string;
    count: number;
    total: number;
  }>;
  revenueTrend: Array<{
    date: string;
    amount: number;
  }>;
  refundMetrics: {
    totalRefunds: number;
    totalRefundAmount: number;
  };
}

interface ExportOptions {
  filename: string;
  dateFormat?: string;
}

export function PaymentAnalytics({ storeId }: PaymentAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [focusedChart, setFocusedChart] = useState<string | null>(null);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const pollingInterval = useRef<NodeJS.Timeout>();
  const { get, set } = useAnalyticsCache<AnalyticsData>({
    ttl: 5 * 60 * 1000,
    maxSize: 50,
  });
  const [showComparison, setShowComparison] = useState(false);
  const [previousPeriodData, setPreviousPeriodData] = useState<AnalyticsData | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const chartNavigationRef = useKeyboardNavigation({
    onArrowLeft: () => {
      if (focusedChart === 'revenueTrend' && data) {
        // Navigate to previous data point
        const currentIndex = data.revenueTrend.findIndex(
          (point) => point.date === focusedDate
        );
        if (currentIndex > 0) {
          setFocusedDate(data.revenueTrend[currentIndex - 1].date);
        }
      }
    },
    onArrowRight: () => {
      if (focusedChart === 'revenueTrend' && data) {
        // Navigate to next data point
        const currentIndex = data.revenueTrend.findIndex(
          (point) => point.date === focusedDate
        );
        if (currentIndex < data.revenueTrend.length - 1) {
          setFocusedDate(data.revenueTrend[currentIndex + 1].date);
        }
      }
    },
    onEscape: () => {
      setFocusedChart(null);
      setFocusedDate(null);
    },
  });

  const { filters, updateFilters, clearFilters, filteredData } = useAnalyticsFilter(
    data?.revenueTrend || [],
    {
      dateRange: dateRange
        ? {
            from: dateRange.from!,
            to: dateRange.to!,
          }
        : undefined,
    }
  );

  const availablePaymentMethods = useMemo(() => {
    if (!data?.methodBreakdown) return [];
    return data.methodBreakdown.map((method) => method.method);
  }, [data?.methodBreakdown]);

  const availableStatuses = useMemo(() => {
    if (!data?.methodBreakdown) return [];
    return data.methodBreakdown.map((method) => method.provider);
  }, [data?.methodBreakdown]);

  const maxAmount = useMemo(() => {
    if (!data?.revenueTrend) return 0;
    return Math.max(...data.revenueTrend.map((item) => item.amount));
  }, [data?.revenueTrend]);

  const fetchAnalytics = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const cacheKey = {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      storeId,
    };

    // Check cache first
    const cachedData = get(cacheKey);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/payments?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}${
          storeId ? `&storeId=${storeId}` : ''
        }`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
      set(cacheKey, analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, storeId, get, set]);

  const startPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    pollingInterval.current = setInterval(() => {
      fetchAnalytics();
    }, 30000); // Poll every 30 seconds
  }, [fetchAnalytics]);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = undefined;
    }
  }, []);

  const handleExport = async (exportFormat: 'csv' | 'json') => {
    if (!dateRange?.from || !dateRange?.to || !data) return;

    try {
      const response = await fetch(
        `/api/analytics/payments?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}${
          storeId ? `&storeId=${storeId}` : ''
        }&export=true`
      );

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const exportData = await response.json();
      const filename = `payment-analytics-${format(new Date(), 'yyyy-MM-dd')}`;

      if (exportFormat === 'csv') {
        exportToCSV(exportData, { filename });
      } else {
        exportToJSON(exportData, { filename });
      }

      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics data');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, chartId: string) => {
    if (!data) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        // Navigate to previous data point
        break;
      case 'ArrowRight':
        e.preventDefault();
        // Navigate to next data point
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        // Toggle chart focus
        setFocusedChart(focusedChart === chartId ? null : chartId);
        break;
    }
  };

  const fetchPreviousPeriodData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const previousFrom = new Date(dateRange.from);
    const previousTo = new Date(dateRange.to);
    const periodLength = dateRange.to.getTime() - dateRange.from.getTime();

    previousFrom.setTime(previousFrom.getTime() - periodLength);
    previousTo.setTime(previousTo.getTime() - periodLength);

    try {
      const response = await fetch(
        `/api/analytics/payments?startDate=${previousFrom.toISOString()}&endDate=${previousTo.toISOString()}${
          storeId ? `&storeId=${storeId}` : ''
        }`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch previous period data');
      }

      const previousData = await response.json();
      setPreviousPeriodData(previousData);
    } catch (error) {
      console.error('Error fetching previous period data:', error);
      toast.error('Failed to load previous period data');
    }
  }, [dateRange, storeId]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchAnalytics();
    }
  }, [dateRange, fetchAnalytics]);

  useEffect(() => {
    if (isRealTime) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isRealTime, startPolling, stopPolling]);

  useEffect(() => {
    if (showComparison) {
      fetchPreviousPeriodData();
    }
  }, [showComparison, fetchPreviousPeriodData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading analytics data">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="sr-only">Loading analytics data...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8" role="alert" aria-label="No data available">
        <p className="text-gray-500">Select a date range to view analytics</p>
        <p className="text-sm text-gray-400 mt-2">Choose a date range using the picker above</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6" role="region" aria-label="Payment Analytics Dashboard">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              aria-label="Select date range for analytics"
            />
            <Button
              variant={isRealTime ? "default" : "outline"}
              onClick={() => setIsRealTime(!isRealTime)}
              className="flex items-center gap-2"
              aria-label={isRealTime ? "Disable real-time updates" : "Enable real-time updates"}
              aria-pressed={isRealTime}
            >
              <div 
                className={`h-2 w-2 rounded-full ${isRealTime ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                aria-hidden="true"
              />
              <span>{isRealTime ? 'Real-time' : 'Static'}</span>
            </Button>
            <Button
              variant={showComparison ? "default" : "outline"}
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center gap-2"
              aria-label={showComparison ? "Hide comparison" : "Show comparison"}
              aria-pressed={showComparison}
            >
              <span>{showComparison ? 'Hide Comparison' : 'Show Comparison'}</span>
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              aria-label={showFilters ? "Hide filters" : "Show filters"}
              aria-pressed={showFilters}
            >
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                aria-label="Export options"
                aria-haspopup="true"
                aria-expanded={false}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                onClick={() => handleExport('csv')}
                aria-label="Export as CSV"
              >
                <FileDown className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>Export as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('json')}
                aria-label="Export as JSON"
              >
                <FileJson className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>Export as JSON</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showFilters && (
          <section aria-label="Filter options">
            <FilterPanel
              filters={filters}
              onUpdateFilters={updateFilters}
              onClearFilters={clearFilters}
              availablePaymentMethods={availablePaymentMethods}
              availableStatuses={availableStatuses}
              maxAmount={maxAmount}
            />
          </section>
        )}

        {showComparison && previousPeriodData && (
          <section aria-label="Comparison metrics">
            <ComparisonMetrics
              current={data!.dailyMetrics}
              previous={previousPeriodData.dailyMetrics}
            />
          </section>
        )}

        <section aria-label="Analytics metrics">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Total Revenue
                  <InfoTooltip content="Total revenue for the selected period">
                    <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </InfoTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div aria-label={`Total Revenue: $${data?.dailyMetrics.totalRevenue.toFixed(2) || '0.00'}`}>
                  <p className="text-2xl font-bold">
                    ${data?.dailyMetrics.totalRevenue.toFixed(2) || '0.00'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Total Transactions
                  <InfoTooltip content="Total number of transactions for the selected period">
                    <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </InfoTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div aria-label={`Total Transactions: ${data?.dailyMetrics.totalTransactions || '0'}`}>
                  <p className="text-2xl font-bold">
                    {data?.dailyMetrics.totalTransactions || '0'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Success Rate
                  <InfoTooltip content="Percentage of successful transactions for the selected period">
                    <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </InfoTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div aria-label={`Success Rate: ${((data?.dailyMetrics.successfulTransactions / data?.dailyMetrics.totalTransactions) * 100).toFixed(1)}%`}>
                  <p className="text-2xl font-bold">
                    {((data?.dailyMetrics.successfulTransactions / data?.dailyMetrics.totalTransactions) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Average Amount
                  <InfoTooltip content="Average amount per transaction for the selected period">
                    <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </InfoTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div aria-label={`Average Amount: $${data?.dailyMetrics.averageAmount.toFixed(2) || '0.00'}`}>
                  <p className="text-2xl font-bold">
                    ${data?.dailyMetrics.averageAmount.toFixed(2) || '0.00'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-label="Analytics charts">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Revenue Trend
                  <InfoTooltip content="Revenue trend over time. Use arrow keys to navigate between data points.">
                    <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </InfoTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={(el) => {
                    if (el) {
                      (chartNavigationRef as any).current = el;
                    }
                  }}
                  className="h-[300px] min-h-[200px]"
                  role="figure"
                  aria-label="Revenue trend chart"
                  tabIndex={0}
                  onFocus={() => setFocusedChart('revenueTrend')}
                  onBlur={() => setFocusedChart(null)}
                  aria-describedby="revenue-trend-description"
                >
                  <div id="revenue-trend-description" className="sr-only">
                    Revenue trend chart. Use arrow keys to navigate between data points. Press Escape to exit navigation mode.
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.revenueTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip
                        content={
                          <ChartTooltip
                            formatter={formatCurrency}
                            additionalInfo={
                              focusedDate && (
                                <div className="text-xs text-gray-500">
                                  Press arrow keys to navigate between dates
                                </div>
                              )
                            }
                          />
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#8884d8"
                        name="Revenue"
                        strokeWidth={focusedChart === 'revenueTrend' ? 3 : 2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Payment Methods
                  <InfoTooltip content="Distribution of payments by method for the selected period">
                    <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </InfoTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={(el) => {
                    chartRefs.current.paymentMethods = el;
                  }}
                  className="h-[300px] min-h-[200px]"
                  role="figure"
                  aria-label="Payment methods distribution chart"
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, 'paymentMethods')}
                  onFocus={() => setFocusedChart('paymentMethods')}
                  onBlur={() => setFocusedChart(null)}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.methodBreakdown}
                        dataKey="total"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${formatPercentage(percent * 100)})`}
                      >
                        {data.methodBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#8884d8', '#82ca9d', '#ffc658'][index % 3]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-label="Refund metrics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Refund Metrics
                <InfoTooltip content="Metrics related to refunds for the selected period">
                  <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </InfoTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500">Total Refunds</p>
                  <div aria-label={`Total Refunds: ${data?.refundMetrics.totalRefunds || '0'}`}>
                    <p className="text-2xl font-bold">
                      {data?.refundMetrics.totalRefunds || '0'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Refund Amount</p>
                  <div aria-label={`Total Refund Amount: $${data?.refundMetrics.totalRefundAmount.toFixed(2) || '0.00'}`}>
                    <p className="text-2xl font-bold">
                      ${data?.refundMetrics.totalRefundAmount.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Refund Rate</p>
                  <div aria-label={`Refund Rate: ${((data?.refundMetrics.totalRefunds / data?.dailyMetrics.totalTransactions) * 100).toFixed(1)}%`}>
                    <p className="text-2xl font-bold">
                      {((data?.refundMetrics.totalRefunds / data?.dailyMetrics.totalTransactions) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </ErrorBoundary>
  );
} 