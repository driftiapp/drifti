import { useState, useCallback, useMemo } from 'react';

interface FilterOptions {
  dateRange?: {
    from: Date;
    to: Date;
  };
  paymentMethods?: string[];
  minAmount?: number;
  maxAmount?: number;
  status?: string[];
}

interface FilteredData<T> {
  data: T[];
  total: number;
  filtered: number;
}

export function useAnalyticsFilter<T extends Record<string, any>>(
  data: T[],
  options: FilterOptions = {}
) {
  const [filters, setFilters] = useState<FilterOptions>(options);

  const applyFilters = useCallback(
    (data: T[]): FilteredData<T> => {
      if (!data.length) return { data: [], total: 0, filtered: 0 };

      const total = data.length;
      let filtered = data;

      if (filters.dateRange) {
        filtered = filtered.filter((item) => {
          const date = new Date(item.date);
          return (
            date >= filters.dateRange!.from &&
            date <= filters.dateRange!.to
          );
        });
      }

      if (filters.paymentMethods?.length) {
        filtered = filtered.filter((item) =>
          filters.paymentMethods!.includes(item.paymentMethod)
        );
      }

      if (filters.minAmount !== undefined) {
        filtered = filtered.filter(
          (item) => item.amount >= filters.minAmount!
        );
      }

      if (filters.maxAmount !== undefined) {
        filtered = filtered.filter(
          (item) => item.amount <= filters.maxAmount!
        );
      }

      if (filters.status?.length) {
        filtered = filtered.filter((item) =>
          filters.status!.includes(item.status)
        );
      }

      return {
        data: filtered,
        total,
        filtered: filtered.length,
      };
    },
    [filters]
  );

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(options);
  }, [options]);

  const filteredData = useMemo(() => applyFilters(data), [data, applyFilters]);

  return {
    filters,
    updateFilters,
    clearFilters,
    filteredData,
  };
} 