'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format as formatDate, parseISO, subDays, isSameDay, getHours, getMinutes } from 'date-fns';
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
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  ReferenceLine,
  Brush,
  ComposedChart,
  Sankey,
  Treemap,
  FunnelChart,
  Funnel,
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

interface DrillDownData {
  date: string;
  transactions: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    timestamp: string;
    category: string;
    hour: number;
    minute: number;
  }>;
}

interface AnalyticsData {
  dailyMetrics: {
    totalRevenue: number;
    totalTransactions: number;
    successfulTransactions: number;
    averageAmount: number;
    customerLifetimeValue: number;
    customerAcquisitionCost: number;
    churnRate: number;
    retentionRate: number;
  };
  methodBreakdown: Array<{
    method: string;
    provider: string;
    count: number;
    total: number;
    successRate: number;
  }>;
  revenueTrend: Array<{
    date: string;
    amount: number;
  }>;
  refundMetrics: {
    totalRefunds: number;
    totalRefundAmount: number;
  };
  geographicDistribution: Array<{
    country: string;
    transactions: number;
    revenue: number;
  }>;
  peakTimes: Array<{
    hour: number;
    transactions: number;
  }>;
  correlationData: Array<{
    amount: number;
    successRate: number;
    volume: number;
  }>;
  heatMapData: Array<{
    hour: number;
    day: number;
    transactions: number;
  }>;
  radarMetrics: Array<{
    metric: string;
    value: number;
    maxValue: number;
  }>;
  paymentMethodTrends: Array<{
    date: string;
    creditCard: number;
    paypal: number;
    bankTransfer: number;
    crypto: number;
  }>;
  revenueByCategory: Array<{
    date: string;
    amount: number;
    category: string;
  }>;
  drillDownData: Record<string, DrillDownData>;
}

interface ExportOptions {
  filename: string;
  dateFormat?: string;
}

interface PaymentMethodTrendsData {
  date: string;
  creditCard: number;
  paypal: number;
  bankTransfer: number;
  crypto: number;
  total?: number;
}

interface ComparisonData {
  current: AnalyticsData;
  previous: AnalyticsData;
}

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface TreemapNode {
  root: any;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  name: string;
  value: number;
}

const GeographicDistributionChart = ({ data }: { data: AnalyticsData['geographicDistribution'] }) => (
  <Card className="overflow-hidden">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        Geographic Distribution
        <InfoTooltip content="Distribution of transactions by country">
          <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </InfoTooltip>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="country" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="transactions" name="Transactions" fill="#8884d8" />
            <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const PeakTimesChart = ({ data }: { data: AnalyticsData['peakTimes'] }) => (
  <Card className="overflow-hidden">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        Peak Transaction Times
        <InfoTooltip content="Transaction volume by hour of day">
          <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </InfoTooltip>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="transactions" name="Transactions" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const CorrelationChart = ({ data }: { data: AnalyticsData['correlationData'] }) => (
  <Card className="overflow-hidden">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        Transaction Correlations
        <InfoTooltip content="Correlation between transaction amount, success rate, and volume">
          <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </InfoTooltip>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="amount" name="Amount" />
            <YAxis dataKey="successRate" name="Success Rate" />
            <ZAxis dataKey="volume" name="Volume" />
            <Tooltip />
            <Legend />
            <Scatter name="Transactions" data={data} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const CustomerMetrics = ({ data }: { data: AnalyticsData['dailyMetrics'] }) => (
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Customer Lifetime Value
          <InfoTooltip content="Average revenue per customer over their lifetime">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${data.customerLifetimeValue.toFixed(2)}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Customer Acquisition Cost
          <InfoTooltip content="Average cost to acquire a new customer">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${data.customerAcquisitionCost.toFixed(2)}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Churn Rate
          <InfoTooltip content="Percentage of customers who stopped using the service">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {data.churnRate.toFixed(1)}%
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Retention Rate
          <InfoTooltip content="Percentage of customers who continue using the service">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {data.retentionRate.toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  </div>
);

const TransactionHeatMap = ({ data }: { data: AnalyticsData['heatMapData'] }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxTransactions = Math.max(...data.map(d => d.transactions));

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Transaction Patterns
          <InfoTooltip content="Transaction volume by day and hour">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] min-h-[200px]">
          <div className="grid grid-cols-24 gap-1">
            {days.map((day, dayIndex) => (
              <div key={day} className="flex flex-col gap-1">
                <div className="text-xs text-gray-500">{day}</div>
                {hours.map((hour) => {
                  const transactions = data.find(
                    d => d.day === dayIndex && d.hour === hour
                  )?.transactions || 0;
                  const intensity = transactions / maxTransactions;
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="w-4 h-4 rounded-sm"
                      style={{
                        backgroundColor: `rgba(136, 132, 216, ${intensity})`,
                      }}
                      title={`${day} ${hour}:00 - ${transactions} transactions`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MetricsRadarChart = ({ data }: { data: AnalyticsData['radarMetrics'] }) => (
  <Card className="overflow-hidden">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        Performance Metrics
        <InfoTooltip content="Comparison of key performance metrics">
          <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </InfoTooltip>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis />
            <Radar
              name="Current"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Radar
              name="Target"
              dataKey="maxValue"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.2}
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ComparisonModal = ({ data, onClose }: { data: ComparisonData; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Period Comparison</h3>
        <Button variant="ghost" onClick={onClose}>×</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Current Period</h4>
          <div className="space-y-2">
            <p>Total Revenue: {formatCurrency(data.current.dailyMetrics.totalRevenue)}</p>
            <p>Total Transactions: {data.current.dailyMetrics.totalTransactions}</p>
            <p>Success Rate: {((data.current.dailyMetrics.successfulTransactions / data.current.dailyMetrics.totalTransactions) * 100).toFixed(1)}%</p>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Previous Period</h4>
          <div className="space-y-2">
            <p>Total Revenue: {formatCurrency(data.previous.dailyMetrics.totalRevenue)}</p>
            <p>Total Transactions: {data.previous.dailyMetrics.totalTransactions}</p>
            <p>Success Rate: {((data.previous.dailyMetrics.successfulTransactions / data.previous.dailyMetrics.totalTransactions) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TimeBasedDrillDown = ({ data }: { data: DrillDownData }) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => {
      const transactions = data.transactions.filter(t => t.hour === hour);
      return {
        hour,
        count: transactions.length,
        total: transactions.reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [data.transactions]);

  const minuteData = useMemo(() => {
    if (selectedHour === null) return [];
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    return minutes.map(minute => {
      const transactions = data.transactions.filter(
        t => t.hour === selectedHour && t.minute === minute
      );
      return {
        minute,
        count: transactions.length,
        total: transactions.reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [data.transactions, selectedHour]);

  return (
    <div className="space-y-4">
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="count"
              name="Transactions"
              fill="#8884d8"
              onClick={(data) => setSelectedHour(data.hour)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {selectedHour !== null && (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={minuteData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="minute" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="count"
                name="Transactions"
                fill="#82ca9d"
                onClick={(data) => setSelectedMinute(data.minute)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const CategoryTreemap = ({ data }: { data: AnalyticsData['revenueByCategory'] }) => {
  const treemapData = useMemo(() => {
    const categories = Array.from(new Set(data.map(d => d.category)));
    return categories.map(category => {
      const categoryData = data.filter(d => d.category === category);
      return {
        name: category,
        value: categoryData.reduce((sum, d) => sum + d.amount, 0),
        children: categoryData.map(d => ({
          name: formatDate(parseISO(d.date), 'MMM dd'),
          value: d.amount,
        })),
      };
    });
  }, [data]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Revenue by Category
          <InfoTooltip content="Revenue distribution by category and date">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={treemapData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const PaymentMethodDrillDown = ({ data }: { data: DrillDownData }) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const methodData = useMemo(() => {
    const methods = Array.from(new Set(data.transactions.map(t => t.method)));
    return methods.map(method => {
      const transactions = data.transactions.filter(t => t.method === method);
      return {
        method,
        count: transactions.length,
        total: transactions.reduce((sum, t) => sum + t.amount, 0),
        successRate: (transactions.filter(t => t.status === 'COMPLETED').length / transactions.length) * 100,
      };
    });
  }, [data.transactions]);

  const statusData = useMemo(() => {
    if (!selectedMethod) return [];
    const transactions = data.transactions.filter(t => t.method === selectedMethod);
    const statuses = Array.from(new Set(transactions.map(t => t.status)));
    return statuses.map(status => {
      const statusTransactions = transactions.filter(t => t.status === status);
      return {
        status,
        count: statusTransactions.length,
        total: statusTransactions.reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [data.transactions, selectedMethod]);

  return (
    <div className="space-y-4">
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={methodData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="method" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              name="Transactions"
              fill="#8884d8"
              onClick={(data) => setSelectedMethod(data.method)}
            />
            <Bar
              dataKey="successRate"
              name="Success Rate"
              fill="#82ca9d"
              onClick={(data) => setSelectedMethod(data.method)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {selectedMethod && (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="count"
                data={statusData}
                nameKey="status"
                fill="#8884d8"
              />
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const CategoryDrillDown = ({ data }: { data: DrillDownData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryData = useMemo(() => {
    const categories = Array.from(new Set(data.transactions.map(t => t.category)));
    return categories.map(category => {
      const transactions = data.transactions.filter(t => t.category === category);
      return {
        category,
        count: transactions.length,
        total: transactions.reduce((sum, t) => sum + t.amount, 0),
        methods: Array.from(new Set(transactions.map(t => t.method))).map(method => {
          const methodTransactions = transactions.filter(t => t.method === method);
          return {
            method,
            count: methodTransactions.length,
            total: methodTransactions.reduce((sum, t) => sum + t.amount, 0),
          };
        }),
      };
    });
  }, [data.transactions]);

  const methodData = useMemo(() => {
    if (!selectedCategory) return [];
    const category = categoryData.find(c => c.category === selectedCategory);
    if (!category) return [];
    return category.methods;
  }, [categoryData, selectedCategory]);

  return (
    <div className="space-y-4">
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              name="Transactions"
              fill="#8884d8"
              onClick={(data) => setSelectedCategory(data.category)}
            />
            <Bar
              dataKey="total"
              name="Total Amount"
              fill="#82ca9d"
              onClick={(data) => setSelectedCategory(data.category)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {selectedCategory && methodData.length > 0 && (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={methodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="method" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Transactions" fill="#8884d8" />
              <Bar dataKey="total" name="Total Amount" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const DataComparison = ({ data, previousData }: { data: AnalyticsData; previousData: AnalyticsData }) => {
  const comparisonData = useMemo(() => {
    const metrics = [
      {
        name: 'Total Revenue',
        current: data.dailyMetrics.totalRevenue,
        previous: previousData.dailyMetrics.totalRevenue,
      },
      {
        name: 'Total Transactions',
        current: data.dailyMetrics.totalTransactions,
        previous: previousData.dailyMetrics.totalTransactions,
      },
      {
        name: 'Success Rate',
        current: (data.dailyMetrics.successfulTransactions / data.dailyMetrics.totalTransactions) * 100,
        previous: (previousData.dailyMetrics.successfulTransactions / previousData.dailyMetrics.totalTransactions) * 100,
      },
      {
        name: 'Average Amount',
        current: data.dailyMetrics.averageAmount,
        previous: previousData.dailyMetrics.averageAmount,
      },
    ];

    return metrics.map(metric => ({
      ...metric,
      change: ((metric.current - metric.previous) / metric.previous) * 100,
    }));
  }, [data, previousData]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Period Comparison
          <InfoTooltip content="Comparison of key metrics between current and previous periods">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="current" name="Current" fill="#8884d8" />
              <Bar dataKey="previous" name="Previous" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {comparisonData.map(metric => (
            <div key={metric.name} className="border rounded p-4">
              <h4 className="font-medium">{metric.name}</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Current</p>
                  <p className="text-lg font-bold">{formatCurrency(metric.current)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Previous</p>
                  <p className="text-lg font-bold">{formatCurrency(metric.previous)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Change</p>
                  <p className={`text-lg font-bold ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const DrillDownModal = ({ data, onClose }: { data: DrillDownData; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'time' | 'method' | 'category'>('transactions');
  const [filter, setFilter] = useState<{
    method?: string;
    status?: string;
    category?: string;
  }>({});

  const filteredTransactions = useMemo(() => {
    return data.transactions.filter(t => {
      if (filter.method && t.method !== filter.method) return false;
      if (filter.status && t.status !== filter.status) return false;
      if (filter.category && t.category !== filter.category) return false;
      return true;
    });
  }, [data.transactions, filter]);

  const methods = useMemo(() => Array.from(new Set(data.transactions.map(t => t.method))), [data.transactions]);
  const statuses = useMemo(() => Array.from(new Set(data.transactions.map(t => t.status))), [data.transactions]);
  const categories = useMemo(() => Array.from(new Set(data.transactions.map(t => t.category))), [data.transactions]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Transaction Details for {formatDate(parseISO(data.date), 'MMMM d, yyyy')}</h3>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>
        <div className="flex gap-4 mb-4">
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </Button>
          <Button
            variant={activeTab === 'time' ? 'default' : 'outline'}
            onClick={() => setActiveTab('time')}
          >
            Time Analysis
          </Button>
          <Button
            variant={activeTab === 'method' ? 'default' : 'outline'}
            onClick={() => setActiveTab('method')}
          >
            Payment Methods
          </Button>
          <Button
            variant={activeTab === 'category' ? 'default' : 'outline'}
            onClick={() => setActiveTab('category')}
          >
            Categories
          </Button>
        </div>
        {activeTab === 'transactions' ? (
          <>
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                <select
                  className="border rounded p-2"
                  value={filter.method || ''}
                  onChange={(e) => setFilter(f => ({ ...f, method: e.target.value || undefined }))}
                  aria-label="Filter by payment method"
                >
                  <option value="">All Methods</option>
                  {methods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                <select
                  className="border rounded p-2"
                  value={filter.status || ''}
                  onChange={(e) => setFilter(f => ({ ...f, status: e.target.value || undefined }))}
                  aria-label="Filter by status"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  className="border rounded p-2"
                  value={filter.category || ''}
                  onChange={(e) => setFilter(f => ({ ...f, category: e.target.value || undefined }))}
                  aria-label="Filter by category"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-500">
                Showing {filteredTransactions.length} of {data.transactions.length} transactions
              </p>
            </div>
            <div className="space-y-4">
              {filteredTransactions.map(transaction => (
                <div key={transaction.id} className="border rounded p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Method</p>
                      <p className="font-medium">{transaction.method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">{transaction.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{transaction.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{formatDate(parseISO(transaction.timestamp), 'HH:mm:ss')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : activeTab === 'time' ? (
          <TimeBasedDrillDown data={data} />
        ) : activeTab === 'method' ? (
          <PaymentMethodDrillDown data={data} />
        ) : (
          <CategoryDrillDown data={data} />
        )}
      </div>
    </div>
  );
};

const PaymentMethodTrendsChart = ({ data, drillDownData }: {
  data: PaymentMethodTrendsData[];
  drillDownData: AnalyticsData['drillDownData'];
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [brushStartIndex, setBrushStartIndex] = useState(0);
  const [brushEndIndex, setBrushEndIndex] = useState(data.length - 1);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const handleBrushChange = useCallback((newDomain: any) => {
    setBrushStartIndex(newDomain.startIndex);
    setBrushEndIndex(newDomain.endIndex);
  }, []);

  const filteredData = data.slice(brushStartIndex, brushEndIndex + 1).map(item => ({
    ...item,
    total: item.total || (item.creditCard + item.paypal + item.bankTransfer + item.crypto),
  }));

  const handleBarClick = useCallback((data: any) => {
    setSelectedDate(data.date);
    if (drillDownData[data.date]) {
      setShowDrillDown(true);
    }
  }, [drillDownData]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Payment Method Trends
          <InfoTooltip content="Trend of payment methods over time. Click on a bar to see detailed transactions.">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(parseISO(value), 'MMM dd')}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
              <Legend />
              <Bar
                dataKey="creditCard"
                name="Credit Card"
                stackId="a"
                fill="#8884d8"
                onClick={handleBarClick}
                yAxisId="left"
              />
              <Bar
                dataKey="paypal"
                name="PayPal"
                stackId="a"
                fill="#82ca9d"
                onClick={handleBarClick}
                yAxisId="left"
              />
              <Bar
                dataKey="bankTransfer"
                name="Bank Transfer"
                stackId="a"
                fill="#ffc658"
                onClick={handleBarClick}
                yAxisId="left"
              />
              <Bar
                dataKey="crypto"
                name="Crypto"
                stackId="a"
                fill="#ff8042"
                onClick={handleBarClick}
                yAxisId="left"
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#000"
                yAxisId="right"
                dot={false}
              />
              {selectedDate && (
                <ReferenceLine x={selectedDate} stroke="#666" label="Selected" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <Brush
              data={data}
              dataKey="date"
              height={30}
              onChange={handleBrushChange}
              startIndex={brushStartIndex}
              endIndex={brushEndIndex}
            />
          </div>
        </div>
      </CardContent>
      {showDrillDown && selectedDate && drillDownData[selectedDate] && (
        <DrillDownModal
          data={drillDownData[selectedDate]}
          onClose={() => setShowDrillDown(false)}
        />
      )}
    </Card>
  );
};

const RevenueByCategoryChart = ({ data }: { data: AnalyticsData['revenueByCategory'] }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTrend, setShowTrend] = useState(true);

  const filteredData = selectedCategory
    ? data.filter(d => d.category === selectedCategory)
    : data;

  const categories = Array.from(new Set(data.map(d => d.category)));

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Revenue by Category
          <InfoTooltip content="Revenue trends by product category. Click on a category to filter.">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(
                selectedCategory === category ? null : category
              )}
            >
              {category}
            </Button>
          ))}
        </div>
        <div className="h-[300px] min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(parseISO(value), 'MMM dd')}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                activeDot={{ r: 8 }}
              />
              {showTrend && (
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#82ca9d"
                  dot={false}
                  name="Trend"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const PaymentFlowChart = ({ data }: { data: AnalyticsData['paymentMethodTrends'] }) => {
  const sankeyData = useMemo(() => {
    const nodes: SankeyNode[] = [
      { name: 'Credit Card' },
      { name: 'PayPal' },
      { name: 'Bank Transfer' },
      { name: 'Crypto' },
      { name: 'Completed' },
      { name: 'Failed' },
      { name: 'Refunded' },
    ];

    const nodeMap = nodes.reduce((acc, node, index) => {
      acc[node.name] = index;
      return acc;
    }, {} as Record<string, number>);

    const links: SankeyLink[] = data.flatMap(day => [
      { source: nodeMap['Credit Card'], target: nodeMap['Completed'], value: day.creditCard },
      { source: nodeMap['PayPal'], target: nodeMap['Completed'], value: day.paypal },
      { source: nodeMap['Bank Transfer'], target: nodeMap['Completed'], value: day.bankTransfer },
      { source: nodeMap['Crypto'], target: nodeMap['Completed'], value: day.crypto },
    ]);

    return { nodes, links };
  }, [data]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Payment Flow
          <InfoTooltip content="Flow of payments through different methods and statuses">
            <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={sankeyData}
              node={{ fill: '#8884d8' }}
              link={{ fill: '#82ca9d' }}
            />
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const ExportButton = ({ data }: { data: AnalyticsData }) => {
  const handleExport = useCallback(async (exportFormat: 'csv' | 'json' | 'excel') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          format: exportFormat,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${exportFormat}-${formatDate(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  }, [data]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
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

  const fetchAnalytics = useCallback(async (startDate: Date, endDate: Date, storeId?: string): Promise<AnalyticsData> => {
    const response = await fetch(
      `/api/analytics/payments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${storeId ? `&storeId=${storeId}` : ''
      }`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return response.json();
  }, []);

  const handleComparePeriods = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
    const previousFrom = new Date(dateRange.from.getTime() - periodLength);
    const previousTo = new Date(dateRange.to.getTime() - periodLength);

    try {
      const [currentData, previousData] = await Promise.all([
        fetchAnalytics(dateRange.from, dateRange.to, storeId),
        fetchAnalytics(previousFrom, previousTo, storeId),
      ]);

      setComparisonData({
        current: currentData,
        previous: previousData,
      });
      setShowComparison(true);
    } catch (error) {
      console.error('Error comparing periods:', error);
      toast.error('Failed to compare periods');
    }
  }, [dateRange, storeId, fetchAnalytics]);

  const startPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    if (!dateRange?.from || !dateRange?.to) return;

    const from = dateRange.from;
    const to = dateRange.to;

    pollingInterval.current = setInterval(() => {
      fetchAnalytics(from, to, storeId);
    }, 30000); // Poll every 30 seconds
  }, [dateRange, storeId, fetchAnalytics]);

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
        `/api/analytics/payments?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}${storeId ? `&storeId=${storeId}` : ''
        }&export=true`
      );

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const exportData = await response.json();
      const filename = `payment-analytics-${formatDate(new Date(), 'yyyy-MM-dd')}`;

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
        `/api/analytics/payments?startDate=${previousFrom.toISOString()}&endDate=${previousTo.toISOString()}${storeId ? `&storeId=${storeId}` : ''
        }`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch previous period data');
      }

      const previousData = await response.json();
      setData(previousData);
    } catch (error) {
      console.error('Error fetching previous period data:', error);
      toast.error('Failed to load previous period data');
    }
  }, [dateRange, storeId]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const from = dateRange.from;
      const to = dateRange.to;
      fetchAnalytics(from, to, storeId);
    }
  }, [dateRange, storeId, fetchAnalytics]);

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
              value={dateRange}
              onChange={setDateRange}
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
          <ExportButton data={data} />
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

        {showComparison && comparisonData && (
          <ComparisonModal
            data={comparisonData}
            onClose={() => setShowComparison(false)}
          />
        )}

        <section aria-label="Analytics metrics">
          <CustomerMetrics data={data.dailyMetrics} />
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
                        tickFormatter={(value) => formatDate(new Date(value), 'MMM dd')}
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

            <TransactionHeatMap data={data.heatMapData} />
            <MetricsRadarChart data={data.radarMetrics} />
            <PaymentMethodTrendsChart
              data={data.paymentMethodTrends}
              drillDownData={data.drillDownData}
            />
            <RevenueByCategoryChart data={data.revenueByCategory} />
            <PaymentFlowChart data={data.paymentMethodTrends} />
            <CategoryTreemap data={data.revenueByCategory} />
            {comparisonData && (
              <DataComparison data={data} previousData={comparisonData.previous} />
            )}
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

        <section aria-label="Geographic distribution">
          <GeographicDistributionChart data={data.geographicDistribution} />
        </section>

        <section aria-label="Peak transaction times">
          <PeakTimesChart data={data.peakTimes} />
        </section>

        <section aria-label="Transaction correlations">
          <CorrelationChart data={data.correlationData} />
        </section>
      </div>
    </ErrorBoundary>
  );
} 