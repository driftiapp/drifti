'use client';

import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Info } from 'lucide-react';
import {
  Tooltip as TooltipPrimitive,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnhancedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
}

export function EnhancedTooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  className,
}: EnhancedTooltipProps) {
  return (
    <TooltipProvider>
      <TooltipPrimitive delayDuration={delayDuration}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={`p-0 ${className}`}
        >
          <Card className="border shadow-lg">
            <CardContent className="p-2">
              {content}
            </CardContent>
          </Card>
        </TooltipContent>
      </TooltipPrimitive>
    </TooltipProvider>
  );
}

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
  additionalInfo?: React.ReactNode;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter = (value) => value.toString(),
  additionalInfo,
}: ChartTooltipProps) {
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
        {additionalInfo && (
          <div className="mt-2 pt-2 border-t">
            {additionalInfo}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InfoTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
}

export function InfoTooltip({ content, children }: InfoTooltipProps) {
  return (
    <EnhancedTooltip
      content={content}
      side="right"
      delayDuration={0}
    >
      {children || <Info className="h-4 w-4 text-gray-400" />}
    </EnhancedTooltip>
  );
} 