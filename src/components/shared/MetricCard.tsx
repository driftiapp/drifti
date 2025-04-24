import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Info } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    previousValue?: string | number;
    tooltip?: string;
    className?: string;
}

const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
};

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    previousValue,
    tooltip,
    className
}) => (
    <Card className={className}>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                {title}
                {tooltip && (
                    <InfoTooltip content={tooltip}>
                        <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </InfoTooltip>
                )}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{value}</span>
                    {change !== undefined && (
                        <span className={`text-sm ${getChangeColor(change)}`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                    )}
                </div>
                {previousValue && (
                    <div className="text-sm text-gray-500">
                        vs {previousValue}
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
); 