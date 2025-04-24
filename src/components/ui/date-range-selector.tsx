'use client'

import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRangePresets } from "@/components/ui/date-range-presets";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DateRangeSelectorProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  onCompareChange?: (enabled: boolean) => void;
  compareEnabled?: boolean;
  className?: string;
}

const STORAGE_KEY = "driftix-date-range";
const COMPARE_STORAGE_KEY = "driftix-date-compare";

export function DateRangeSelector({
  value,
  onChange,
  onCompareChange,
  compareEnabled = false,
  className,
}: DateRangeSelectorProps) {
  const [date, setDate] = useState<DateRange | undefined>(value);
  const [isComparing, setIsComparing] = useState(compareEnabled);

  useEffect(() => {
    // Load saved date range and compare state from localStorage
    const savedRange = localStorage.getItem(STORAGE_KEY);
    const savedCompare = localStorage.getItem(COMPARE_STORAGE_KEY);

    if (savedRange) {
      try {
        const parsed = JSON.parse(savedRange);
        const range = {
          from: parsed.from ? new Date(parsed.from) : undefined,
          to: parsed.to ? new Date(parsed.to) : undefined,
        };
        setDate(range);
        onChange(range);
      } catch (e) {
        console.error("Failed to parse saved date range:", e);
      }
    }

    if (savedCompare) {
      setIsComparing(savedCompare === "true");
      onCompareChange?.(savedCompare === "true");
    }
  }, [onChange, onCompareChange]);

  useEffect(() => {
    // Save date range and compare state to localStorage when they change
    if (date) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(date));
    }
    localStorage.setItem(COMPARE_STORAGE_KEY, String(isComparing));
  }, [date, isComparing]);

  const handleDateChange = (range: DateRange | undefined) => {
    setDate(range);
    if (range) {
      onChange(range);
    }
  };

  const handleCompareToggle = (checked: boolean) => {
    setIsComparing(checked);
    onCompareChange?.(checked);
  };

  const getComparisonLabel = () => {
    if (!date?.from || !date?.to) return null;

    const days = Math.round((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24));
    const months = Math.round(days / 30);

    if (days === 0) return "Compared to yesterday";
    if (days === 6) return "Compared to previous 7 days";
    if (days === 29) return "Compared to previous 30 days";
    if (months === 1) return "Compared to previous month";

    return `Compared to previous ${days} days`;
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3">
              <DateRangePresets value={date} onChange={handleDateChange} />
            </div>
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center space-x-2">
          <Switch
            id="compare-mode"
            checked={isComparing}
            onCheckedChange={handleCompareToggle}
          />
          <Label htmlFor="compare-mode" className="text-sm">
            Compare
          </Label>
          {isComparing && date?.from && date?.to && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground cursor-help">
                    {getComparisonLabel()}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Shows percentage change compared to the previous period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
} 