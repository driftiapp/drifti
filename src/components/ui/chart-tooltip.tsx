'use client';

import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: any;
    color?: string;
  }>;
  label?: string;
  formatter?: (value: number) => string;
}

export function ChartTooltip({ active, payload, label, formatter = (value) => value.toString() }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <Card className="border shadow-lg">
      <CardContent className="p-2">
        {label && (
          <p className="text-sm font-medium mb-1">
            {typeof label === 'string' && label.includes('-')
              ? format(new Date(label), 'MMM dd, yyyy')
              : label}
          </p>
        )}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color || '#8884d8' }}
            />
            <span className="text-sm">
              {entry.name}: {formatter(entry.value)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 