import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricChangeProps {
  value: number;
  previousValue: number;
  label: string;
  className?: string;
}

export function MetricChange({
  value,
  previousValue,
  label,
  className,
}: MetricChangeProps) {
  const isPositive = value >= 0;
  const color = isPositive ? "text-green-500" : "text-red-500";
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  
  return (
    <div 
      className={cn("flex items-center", color, className)}
      title={`Previous ${label}: ${previousValue}`}
    >
      <Icon className="h-4 w-4" />
      <span className="ml-1 text-sm font-medium">
        {Math.abs(Math.round(value))}%
      </span>
    </div>
  );
} 