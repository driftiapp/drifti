'use client'

import { useEffect, useState, useMemo, ReactNode } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { LatLngExpression, Map as LeafletMap, TileLayer as LeafletTileLayer, Marker as LeafletMarker, Popup as LeafletPopup } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-markercluster/dist/styles.min.css'
import '../styles/map.css'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useTheme } from '../context/ThemeContext'
import L from 'leaflet'
import MapControls, { MapFilters } from './MapControls'
import Link from 'next/link'
import QuickActionsMenu from './QuickActionsMenu'
import { toast } from 'react-hot-toast'
import { Icon } from 'leaflet'
import { DivIcon } from 'leaflet'

// Add type declarations for react-leaflet components
declare module 'react-leaflet' {
  export interface MapContainerProps {
    center: LatLngExpression
    zoom: number
    style?: React.CSSProperties
    children?: React.ReactNode
  }

  export interface TileLayerProps {
    url: string
    attribution?: string
  }

  export interface MarkerProps {
    position: LatLngExpression
    eventHandlers?: {
      click?: () => void
    }
    children?: React.ReactNode
  }

  export interface PopupProps {
    children?: React.ReactNode
  }
}

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface Location {
  lat: number
  lng: number
  ip: string
  country?: string
  city?: string
  timestamp: string
  severity?: 'high' | 'medium' | 'low'
  userAgent?: string
}

interface IPLocationMapProps {
  locations: Location[]
  onLocationUpdate?: (locations: Location[]) => void
}

interface MapComponentProps {
  center: LatLngExpression
  zoom: number
  children: ReactNode
}

function MapComponent({ center, zoom, children }: MapComponentProps) {
  return (
    <MapContainer center={center} zoom={zoom}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {children}
    </MapContainer>
  )
}

function isIPInRange(ip: string, range: string): boolean {
  try {
    const [start, end] = range.split('-').map(ip => ip.trim())
    const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
    const startNum = start.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
    const endNum = end.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
    return ipNum >= startNum && ipNum <= endNum
  } catch {
    return false
  }
}

export default function IPLocationMap({ locations, onLocationUpdate }: IPLocationMapProps) {
  const { theme } = useTheme()
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([0, 0])
  const [filters, setFilters] = useState<MapFilters>({
    country: '',
    timeRange: 'all',
    severity: 'all',
    ipRange: '',
    userAgent: ''
  })

  const handleBlockIP = async (ip: string) => {
    try {
      const response = await fetch('/api/ip/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
      });

      if (!response.ok) {
        throw new Error('Failed to block IP');
      }

      toast.success(`IP ${ip} has been blocked`);
    } catch (error) {
      toast.error('Failed to block IP');
      console.error('Error blocking IP:', error);
    }
  };

  const handleWhitelistIP = async (ip: string) => {
    try {
      const response = await fetch('/api/ip/whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
      });

      if (!response.ok) {
        throw new Error('Failed to whitelist IP');
      }

      toast.success(`IP ${ip} has been whitelisted`);
    } catch (error) {
      toast.error('Failed to whitelist IP');
      console.error('Error whitelisting IP:', error);
    }
  };

  const handleExportData = (ip: string) => {
    const location = locations.find((loc: Location) => loc.ip === ip);
    if (!location) return;

    const data = {
      ...location,
      timestamp: new Date(location.timestamp).toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip_data_${ip.replace(/\./g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (ip: string) => {
    window.open(`/logs?ip=${ip}`, '_blank');
  };

  const filteredLocations = useMemo(() => {
    return locations.filter((location: Location) => {
      // Country filter
      if (filters.country && location.country !== filters.country) {
        return false
      }

      // Time range filter
      const now = new Date()
      const locationTime = new Date(location.timestamp)
      switch (filters.timeRange) {
        case '24h':
          return now.getTime() - locationTime.getTime() <= 24 * 60 * 60 * 1000
        case '7d':
          return now.getTime() - locationTime.getTime() <= 7 * 24 * 60 * 60 * 1000
        case '30d':
          return now.getTime() - locationTime.getTime() <= 30 * 24 * 60 * 60 * 1000
        default:
          return true
      }

      // Severity filter
      if (filters.severity !== 'all' && location.severity !== filters.severity) {
        return false
      }

      // IP range filter
      if (filters.ipRange) {
        const ipRange = filters.ipRange as string
        if (!isIPInRange(location.ip, ipRange)) {
          return false
        }
      }

      // User agent filter
      if (filters.userAgent && location.userAgent) {
        const userAgent = location.userAgent as string
        const filterAgent = filters.userAgent as string
        if (!userAgent.toLowerCase().includes(filterAgent.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [locations, filters])

  useEffect(() => {
    if (locations.length > 0) {
      const lastLocation = locations[locations.length - 1]
      setMapCenter([lastLocation.lat, lastLocation.lng])
      setSelectedLocation(lastLocation)
    }
  }, [locations])

  const createClusterCustomIcon = (cluster: any) => {
    return new DivIcon({
      html: `<div class="cluster-icon ${theme === 'dark' ? 'dark' : ''}">${cluster.getChildCount()}</div>`,
      className: 'custom-marker-cluster',
      iconSize: [40, 40],
    })
  }

  if (error) {
    return (
      <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg relative flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Map</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg relative bg-gray-50 dark:bg-gray-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading map data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg relative flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center p-6">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Location Data</h3>
          <p className="text-gray-600 dark:text-gray-400">There are no locations to display on the map.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg relative">
      <MapComponent center={mapCenter} zoom={4}>
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          showCoverageOnHover={false}
        >
          {filteredLocations.map((location, index) => (
            <Marker
              key={`${location.ip}-${index}`}
              position={[location.lat, location.lng]}
              eventHandlers={{
                click: () => {
                  setSelectedLocation(location)
                  if (onLocationUpdate) {
                    onLocationUpdate([location])
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{location.city}, {location.country}</h3>
                    <QuickActionsMenu
                      ip={location.ip}
                      onBlock={handleBlockIP}
                      onWhitelist={handleWhitelistIP}
                      onExport={handleExportData}
                      onViewDetails={handleViewDetails}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">IP:</span> {location.ip}
                    </p>
                    {location.country && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Country:</span> {location.country}
                      </p>
                    )}
                    {location.city && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">City:</span> {location.city}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapComponent>
      <MapControls
        onFilterChange={setFilters}
        totalLocations={locations.length}
        visibleLocations={filteredLocations.length}
      />
    </div>
  )
} 