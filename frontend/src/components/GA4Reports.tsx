import React, { useState } from 'react';
import { ga4Configurator } from '@/utils/ga4Config';

const reports = [
  'Web Vitals Overview',
  'API Performance by User Type',
  'Component Performance',
  'Page Load Performance',
  'User Journey Performance',
  'Driver Performance Metrics',
];

const funnels = [
  'Customer Purchase Journey',
  'Driver Delivery Journey',
];

export default function GA4Reports() {
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedView, setSelectedView] = useState<'reports' | 'funnels'>('reports');
  const segments = ga4Configurator.getUserSegments();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm font-mono max-w-md">
      <h3 className="font-bold mb-2">GA4 Analytics</h3>
      
      {/* View selector */}
      <div className="mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedView('reports')}
            className={`px-2 py-1 rounded ${
              selectedView === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setSelectedView('funnels')}
            className={`px-2 py-1 rounded ${
              selectedView === 'funnels'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Funnels
          </button>
        </div>
      </div>

      {/* Segment selector */}
      <div className="mb-4">
        <label className="block text-xs mb-1">User Segment:</label>
        <select
          value={selectedSegment}
          onChange={(e) => setSelectedSegment(e.target.value)}
          className="w-full bg-gray-800 text-white rounded px-2 py-1 text-xs"
        >
          <option value="">All Users</option>
          {segments.map((segment) => (
            <option key={segment.name} value={segment.name}>
              {segment.name}
              {segment.type === 'dynamic' && ' (Dynamic)'}
            </option>
          ))}
        </select>
      </div>

      {/* Report/Funnel links */}
      <div className="space-y-2">
        {selectedView === 'reports' ? (
          // Reports view
          reports.map((report) => {
            const url = selectedSegment
              ? ga4Configurator.getSegmentReportUrl(report, selectedSegment)
              : ga4Configurator.getReportUrl(report);

            return (
              <div key={report} className="group">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-blue-400 transition-colors"
                >
                  {report}
                </a>
                <div className="text-xs text-gray-400 group-hover:block hidden">
                  {selectedSegment ? `Filtered by ${selectedSegment}` : 'All Users'}
                </div>
              </div>
            );
          })
        ) : (
          // Funnels view
          funnels.map((funnel) => {
            const url = ga4Configurator.getFunnelUrl(funnel, selectedSegment);

            return (
              <div key={funnel} className="group">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-blue-400 transition-colors"
                >
                  {funnel}
                </a>
                <div className="text-xs text-gray-400 group-hover:block hidden">
                  {selectedSegment ? `Filtered by ${selectedSegment}` : 'All Users'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Help text */}
      <div className="mt-4 text-xs text-gray-400">
        <p>Click on a {selectedView === 'reports' ? 'report' : 'funnel'} to view it in Google Analytics 4.</p>
        <p>Select a user segment to filter the data.</p>
        {selectedView === 'funnels' && (
          <p className="mt-1">Funnel analysis shows step-by-step conversion rates.</p>
        )}
      </div>
    </div>
  );
} 