import React from 'react';
import { MetricCard } from '@/components/shared/MetricCard';

interface ComparisonData {
    totalRevenue: number;
    totalTransactions: number;
    successfulTransactions: number;
    averageAmount: number;
}

interface ComparisonMetricsProps {
    current: ComparisonData;
    previous: ComparisonData;
}

const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
};

export const ComparisonMetrics: React.FC<ComparisonMetricsProps> = ({ current, previous }) => {
    const metrics = [
        {
            id: 'revenue',
            title: 'Total Revenue',
            value: `$${current.totalRevenue.toFixed(2)}`,
            change: calculateChange(current.totalRevenue, previous.totalRevenue),
            previousValue: `$${previous.totalRevenue.toFixed(2)}`,
            tooltip: 'Total revenue for the selected period'
        },
        {
            id: 'transactions',
            title: 'Total Transactions',
            value: current.totalTransactions,
            change: calculateChange(current.totalTransactions, previous.totalTransactions),
            previousValue: previous.totalTransactions,
            tooltip: 'Total number of transactions'
        },
        {
            id: 'successful',
            title: 'Successful Transactions',
            value: current.successfulTransactions,
            change: calculateChange(current.successfulTransactions, previous.successfulTransactions),
            previousValue: previous.successfulTransactions,
            tooltip: 'Number of successful transactions'
        },
        {
            id: 'average',
            title: 'Average Amount',
            value: `$${current.averageAmount.toFixed(2)}`,
            change: calculateChange(current.averageAmount, previous.averageAmount),
            previousValue: `$${previous.averageAmount.toFixed(2)}`,
            tooltip: 'Average transaction amount'
        }
    ];

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(metric => (
                <MetricCard
                    key={metric.id}
                    title={metric.title}
                    value={metric.value}
                    change={metric.change}
                    previousValue={metric.previousValue}
                    tooltip={metric.tooltip}
                />
            ))}
        </div>
    );
}; 