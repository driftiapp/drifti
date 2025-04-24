'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/export-utils';
import { InfoTooltip } from '@/components/ui/enhanced-tooltip';
import { Info } from 'lucide-react';

interface ComparisonMetricsProps {
  current: {
    totalRevenue: number;
    totalTransactions: number;
    successfulTransactions: number;
    averageAmount: number;
  };
  previous: {
    totalRevenue: number;
    totalTransactions: number;
    successfulTransactions: number;
    averageAmount: number;
  };
}

export function ComparisonMetrics({ current, previous }: ComparisonMetricsProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const metrics = [
    {
      label: 'Revenue',
      current: current.totalRevenue,
      previous: previous.totalRevenue,
      formatter: formatCurrency,
    },
    {
      label: 'Transactions',
      current: current.totalTransactions,
      previous: previous.totalTransactions,
      formatter: (value: number) => value.toString(),
    },
    {
      label: 'Success Rate',
      current: (current.successfulTransactions / current.totalTransactions) * 100,
      previous: (previous.successfulTransactions / previous.totalTransactions) * 100,
      formatter: formatPercentage,
    },
    {
      label: 'Average Amount',
      current: current.averageAmount,
      previous: previous.averageAmount,
      formatter: formatCurrency,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const change = calculateChange(metric.current, metric.previous);
        const changeColor = getChangeColor(change);

        return (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {metric.label}
                <InfoTooltip content={`Comparison with previous period`}>
                  <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </InfoTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {metric.formatter(metric.current)}
                  </span>
                  <span className={`text-sm ${changeColor}`}>
                    {change > 0 ? '+' : ''}
                    {change.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  vs {metric.formatter(metric.previous)}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 