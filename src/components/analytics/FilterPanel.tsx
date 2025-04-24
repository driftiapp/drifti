'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { InfoTooltip } from '@/components/ui/enhanced-tooltip';
import { Info, X } from 'lucide-react';
import { formatCurrency } from '@/lib/export-utils';

interface FilterPanelProps {
  filters: {
    paymentMethods?: string[];
    minAmount?: number;
    maxAmount?: number;
    status?: string[];
  };
  onUpdateFilters: (filters: any) => void;
  onClearFilters: () => void;
  availablePaymentMethods: string[];
  availableStatuses: string[];
  maxAmount: number;
}

export function FilterPanel({
  filters,
  onUpdateFilters,
  onClearFilters,
  availablePaymentMethods,
  availableStatuses,
  maxAmount,
}: FilterPanelProps) {
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value.length > 0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Filters
            <InfoTooltip content="Filter analytics data by various criteria">
              <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </InfoTooltip>
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-2"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Payment Methods</Label>
          <div className="grid grid-cols-2 gap-2">
            {availablePaymentMethods.map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={`method-${method}`}
                  checked={filters.paymentMethods?.includes(method)}
                  onCheckedChange={(checked) => {
                    const newMethods = checked
                      ? [...(filters.paymentMethods || []), method]
                      : (filters.paymentMethods || []).filter((m) => m !== method);
                    onUpdateFilters({ paymentMethods: newMethods });
                  }}
                  aria-label={`Filter by ${method}`}
                />
                <label
                  htmlFor={`method-${method}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {method}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Amount Range</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="minAmount" className="text-sm">
                  Min Amount
                </Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={filters.minAmount || ''}
                  onChange={(e) =>
                    onUpdateFilters({
                      minAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min={0}
                  max={filters.maxAmount || maxAmount}
                  aria-label="Minimum amount"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="maxAmount" className="text-sm">
                  Max Amount
                </Label>
                <Input
                  id="maxAmount"
                  type="number"
                  value={filters.maxAmount || ''}
                  onChange={(e) =>
                    onUpdateFilters({
                      maxAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min={filters.minAmount || 0}
                  max={maxAmount}
                  aria-label="Maximum amount"
                />
              </div>
            </div>
            <Slider
              value={[filters.minAmount || 0, filters.maxAmount || maxAmount]}
              min={0}
              max={maxAmount}
              step={1}
              onValueChange={([min, max]) =>
                onUpdateFilters({ minAmount: min, maxAmount: max })
              }
              aria-label="Amount range slider"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatCurrency(filters.minAmount || 0)}</span>
              <span>{formatCurrency(filters.maxAmount || maxAmount)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableStatuses.map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.status?.includes(status)}
                  onCheckedChange={(checked) => {
                    const newStatuses = checked
                      ? [...(filters.status || []), status]
                      : (filters.status || []).filter((s) => s !== status);
                    onUpdateFilters({ status: newStatuses });
                  }}
                  aria-label={`Filter by ${status} status`}
                />
                <label
                  htmlFor={`status-${status}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {status}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 