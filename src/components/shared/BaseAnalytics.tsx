import React from 'react';
import { ComparisonMetrics } from '@/components/ComparisonMetrics';
import { MetricCard } from './MetricCard';

interface Metric {
    id: string;
    title: string;
    value: string | number;
    change?: number;
    previousValue?: string | number;
    tooltip?: string;
}

interface BaseAnalyticsProps {
    data: Record<string, any>;
    previousData?: Record<string, any>;
    showComparison?: boolean;
    metrics: Metric[];
    className?: string;
}

export const BaseAnalytics: React.FC<BaseAnalyticsProps> = ({
    data,
    previousData,
    showComparison = false,
    metrics,
    className
}) => (
    <div className={`space-y-4 ${className || ''}`}>
        {showComparison && previousData && (
            <ComparisonMetrics
                current={data}
                previous={previousData}
            />
        )}
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
    </div>
); 