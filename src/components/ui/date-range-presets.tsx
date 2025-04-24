import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangePresetsProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets = [
  {
    label: "Today",
    getRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Yesterday",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: "Last 7 days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 7)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last month",
    getRange: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
];

export function DateRangePresets({ value, onChange, className }: DateRangePresetsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {presets.map((preset) => {
        const range = preset.getRange();
        const isSelected =
          value?.from?.getTime() === range.from.getTime() &&
          value?.to?.getTime() === range.to.getTime();

        return (
          <Button
            key={preset.label}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(range)}
            className={cn(
              "h-8 px-2 text-xs",
              isSelected && "bg-primary/10 hover:bg-primary/20"
            )}
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
} 