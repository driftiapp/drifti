import { useState, ChangeEvent } from 'react';
import { useMap } from 'react-leaflet';
import { useTheme } from '../context/ThemeContext';

interface MapControlsProps {
  onFilterChange: (filters: MapFilters) => void;
  totalLocations: number;
  visibleLocations: number;
}

export interface MapFilters {
  country: string;
  timeRange: string;
  severity: string;
  ipRange?: string;
  userAgent?: string;
}

export default function MapControls({ onFilterChange, totalLocations, visibleLocations }: MapControlsProps) {
  const { theme } = useTheme();
  const map = useMap();
  const [filters, setFilters] = useState<MapFilters>({
    country: '',
    timeRange: 'all',
    severity: 'all',
    ipRange: '',
    userAgent: ''
  });

  const handleFilterChange = (key: keyof MapFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetMap = () => {
    map.setView([0, 0], 2);
  };

  return (
    <div className={`absolute top-4 right-4 z-[1000] flex flex-col gap-4 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Map Controls</h3>
          <button
            onClick={resetMap}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Reset map view to default position"
          >
            Reset View
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country
            </label>
            <select
              value={filters.country}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('country', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              title="Filter by country"
            >
              <option value="">All Countries</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              {/* Add more countries as needed */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Range
            </label>
            <select
              value={filters.timeRange}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('timeRange', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              title="Filter by time range"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('severity', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              title="Filter by severity level"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              IP Range
            </label>
            <input
              type="text"
              value={filters.ipRange}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('ipRange', e.target.value)}
              placeholder="e.g., 192.168.1.0/24"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              title="Filter by IP range (CIDR notation)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User Agent
            </label>
            <input
              type="text"
              value={filters.userAgent}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('userAgent', e.target.value)}
              placeholder="Filter by user agent"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              title="Filter by user agent string"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {visibleLocations} of {totalLocations} locations
          </p>
        </div>
      </div>
    </div>
  );
} 