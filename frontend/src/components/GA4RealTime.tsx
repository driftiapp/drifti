import React, { useState, useEffect } from 'react';
import { ga4Configurator } from '@/utils/ga4Config';

interface ExperimentMetric {
  name: string;
  value: number;
  improvement?: number;
}

interface ExperimentVariant {
  name: string;
  traffic: number;
  metrics: ExperimentMetric[];
}

interface ExperimentResults {
  variants: ExperimentVariant[];
}

interface RealTimeMetric {
  name: string;
  value: number;
  timestamp: number;
  segment?: string;
}

interface Experiment {
  name: string;
  variants: {
    name: string;
    traffic: number;
  }[];
  metrics: string[];
  segments?: string[];
  startDate: string;
  endDate: string;
  status: 'draft' | 'running' | 'completed';
  winner?: string;
}

interface MetricGroup {
  name: string;
  metrics: string[];
  color: string;
}

const metricGroups: MetricGroup[] = [
  {
    name: 'Performance',
    metrics: ['web_vital_lcp', 'web_vital_cls', 'web_vital_fid', 'perf_time_to_interactive'],
    color: 'text-blue-400',
  },
  {
    name: 'Server',
    metrics: ['server_cpu_usage', 'server_memory_usage', 'request_queue_length'],
    color: 'text-green-400',
  },
  {
    name: 'API',
    metrics: ['api_response_time', 'api_error_rate', 'cache_hit_rate'],
    color: 'text-yellow-400',
  },
  {
    name: 'Network',
    metrics: ['cdn_latency', 'websocket_connections'],
    color: 'text-purple-400',
  },
  {
    name: 'Users',
    metrics: ['active_users', 'active_sessions'],
    color: 'text-pink-400',
  },
];

export default function GA4RealTime() {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [experimentResults, setExperimentResults] = useState<ExperimentResults | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(ga4Configurator.getRealTimeMetrics());
      setExperiments(ga4Configurator.getActiveExperiments());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedExperiment) {
      ga4Configurator.getExperimentResults(selectedExperiment)
        .then((results: ExperimentResults) => setExperimentResults(results));
    }
  }, [selectedExperiment]);

  const filteredMetrics = selectedGroup === 'all'
    ? metrics
    : metrics.filter(metric => 
        metricGroups.find(group => 
          group.name === selectedGroup && 
          group.metrics.includes(metric.name)
        )
      );

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm font-mono max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Real-Time Analytics</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d')}
          className="bg-gray-800 text-white rounded px-2 py-1 text-xs"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      {/* Metric Groups */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedGroup('all')}
          className={`px-2 py-1 rounded text-xs ${
            selectedGroup === 'all' ? 'bg-blue-600' : 'bg-gray-700'
          }`}
        >
          All
        </button>
        {metricGroups.map(group => (
          <button
            key={group.name}
            onClick={() => setSelectedGroup(group.name)}
            className={`px-2 py-1 rounded text-xs ${
              selectedGroup === group.name ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* Real-time metrics */}
      <div className="mb-6">
        <h4 className="text-blue-400 mb-2">Live Metrics</h4>
        <div className="space-y-2">
          {filteredMetrics.map((metric, index) => {
            const group = metricGroups.find(g => g.metrics.includes(metric.name));
            return (
              <div key={index} className="flex justify-between items-center">
                <span className={group?.color || 'text-white'}>{metric.name}:</span>
                <span className="text-green-400">
                  {metric.value.toFixed(2)}
                  {metric.segment && (
                    <span className="text-xs text-gray-400 ml-2">
                      ({metric.segment})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* A/B Testing */}
      <div>
        <h4 className="text-blue-400 mb-2">Active Experiments</h4>
        <select
          value={selectedExperiment}
          onChange={(e) => setSelectedExperiment(e.target.value)}
          className="w-full bg-gray-800 text-white rounded px-2 py-1 text-xs mb-2"
        >
          <option value="">Select Experiment</option>
          {experiments.map((exp) => (
            <option key={exp.name} value={exp.name}>
              {exp.name}
            </option>
          ))}
        </select>

        {selectedExperiment && experimentResults && (
          <div className="mt-4 space-y-4">
            <h5 className="text-sm font-semibold">Results</h5>
            {experimentResults.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>{variant.name}</span>
                  <span className="text-xs text-gray-400">
                    {variant.traffic}% traffic
                  </span>
                </div>
                {variant.metrics.map((metric) => (
                  <div
                    key={metric.name}
                    className="flex justify-between items-center pl-4 text-xs"
                  >
                    <span>{metric.name}:</span>
                    <span
                      className={
                        (metric.improvement ?? 0) > 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {metric.value.toFixed(2)}
                      {typeof metric.improvement === 'number' && (
                        <span className="ml-1">
                          ({metric.improvement > 0 ? '+' : ''}
                          {metric.improvement.toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 text-xs text-gray-400">
        <p>Metrics update every 10 seconds.</p>
        <p>Select a metric group to filter metrics.</p>
        <p>Select an experiment to view its current results.</p>
        <p>Green values indicate improvements over baseline.</p>
      </div>
    </div>
  );
} 