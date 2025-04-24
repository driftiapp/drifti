'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface LoginAttempt {
  id: string
  timestamp: Date
  ipAddress: string
  location: string
  device: string
  status: 'success' | 'failed'
  reason?: string
}

interface SuspiciousActivity {
  id: string
  timestamp: Date
  type: 'unusual_location' | 'multiple_failures' | 'suspicious_ip'
  details: string
  severity: 'low' | 'medium' | 'high'
  resolved: boolean
}

interface BlockedIP {
  id: string
  ipAddress: string
  reason: string
  blockedAt: Date
  expiresAt: Date
}

interface Incident {
  id: number;
  type: string;
  severity: string;
  timestamp: string;
}

interface SecurityData {
  totalIncidents: number;
  activeThreats: number;
  blockedIPs: number;
  recentIncidents: Incident[];
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'api_access' | 'system_change';
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  details: string;
  sourceIP: string;
  userAgent?: string;
}

interface SecurityMonitoringProps {
  events: SecurityEvent[];
  onRefresh?: () => void;
}

const SecurityMonitoring: React.FC<SecurityMonitoringProps> = ({ events, onRefresh }) => {
  const { data: session } = useSession()
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>(events)
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
  })

  useEffect(() => {
    let filtered = events
    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.type === filters.type)
    }
    if (filters.severity !== 'all') {
      filtered = filtered.filter(event => event.severity === filters.severity)
    }
    setFilteredEvents(filtered)
  }, [events, filters])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Security Events</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="border rounded p-2"
          aria-label="Filter by event type"
        >
          <option value="all">All Types</option>
          <option value="login_attempt">Login Attempts</option>
          <option value="api_access">API Access</option>
          <option value="system_change">System Changes</option>
        </select>

        <select
          value={filters.severity}
          onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
          className="border rounded p-2"
          aria-label="Filter by severity level"
        >
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="border p-4 rounded cursor-pointer hover:bg-gray-50"
            onClick={() => setSelectedEvent(event)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{event.type.replace('_', ' ').toUpperCase()}</p>
                <p className="text-sm text-gray-600">{event.details}</p>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${getSeverityColor(event.severity)}`}>
                {event.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {event.timestamp.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Event Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Type:</span> {selectedEvent.type.replace('_', ' ').toUpperCase()}</p>
              <p><span className="font-medium">Severity:</span> {selectedEvent.severity.toUpperCase()}</p>
              <p><span className="font-medium">Time:</span> {selectedEvent.timestamp.toLocaleString()}</p>
              <p><span className="font-medium">Details:</span> {selectedEvent.details}</p>
              <p><span className="font-medium">Source IP:</span> {selectedEvent.sourceIP}</p>
              {selectedEvent.userAgent && (
                <p><span className="font-medium">User Agent:</span> {selectedEvent.userAgent}</p>
              )}
            </div>
            <button
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityMonitoring 