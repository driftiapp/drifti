'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize Mapbox with your access token
mapboxgl.accessToken = process.env['NEXT_PUBLIC_MAPBOX_TOKEN'] || '';

interface MapData {
  hotspots: Array<{
    id: number;
    name: string;
    coordinates: [number, number];
    type: 'ride' | 'delivery';
  }>;
  routes: Array<{
    id: number;
    name: string;
    coordinates: [number, number][];
    type: 'ride' | 'delivery';
  }>;
}

const MapboxMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapData] = useState<MapData>({
    hotspots: [
      { id: 1, name: 'Downtown', coordinates: [-73.935242, 40.730610], type: 'ride' },
      { id: 2, name: 'Shopping District', coordinates: [-73.935242, 40.740610], type: 'delivery' },
      { id: 3, name: 'Tech Hub', coordinates: [-73.945242, 40.735610], type: 'ride' },
      { id: 4, name: 'Restaurant Row', coordinates: [-73.925242, 40.735610], type: 'delivery' }
    ],
    routes: [
      {
        id: 1,
        name: 'Downtown Loop',
        coordinates: [
          [-73.935242, 40.730610],
          [-73.945242, 40.735610],
          [-73.935242, 40.740610]
        ],
        type: 'ride'
      },
      {
        id: 2,
        name: 'Delivery Route',
        coordinates: [
          [-73.925242, 40.735610],
          [-73.935242, 40.740610],
          [-73.945242, 40.735610]
        ],
        type: 'delivery'
      }
    ]
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-73.935242, 40.730610],
      zoom: 12
    });

    map.current.on('load', () => {
      // Add routes layer
      map.current?.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: mapData.routes.map(route => ({
            type: 'Feature',
            properties: {
              type: route.type
            },
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates,
            },
          })),
        },
      });

      map.current?.addLayer({
        id: 'routes',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'type'],
            'ride', '#3B82F6',
            'delivery', '#10B981',
            '#3B82F6' // default color
          ],
          'line-width': 3,
          'line-dasharray': [0, 2],
        },
      });

      // Add hotspots layer
      map.current?.addSource('hotspots', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: mapData.hotspots.map(hotspot => ({
            type: 'Feature',
            properties: {
              type: hotspot.type
            },
            geometry: {
              type: 'Point',
              coordinates: hotspot.coordinates,
            },
          })),
        },
      });

      map.current?.addLayer({
        id: 'hotspots',
        type: 'circle',
        source: 'hotspots',
        paint: {
          'circle-radius': 8,
          'circle-color': [
            'match',
            ['get', 'type'],
            'ride', '#3B82F6',
            'delivery', '#10B981',
            '#3B82F6' // default color
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Add popups for hotspots
      mapData.hotspots.forEach(hotspot => {
        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(hotspot.coordinates)
          .setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${hotspot.name}</h3>
              <p class="text-sm text-gray-600">${hotspot.type.charAt(0).toUpperCase() + hotspot.type.slice(1)} Hotspot</p>
            </div>
          `)
          .addTo(map.current!);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [mapData]);

  return (
    <div className="relative w-full h-[600px]">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm">Ride Hotspots</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm">Delivery Zones</span>
        </div>
      </div>
    </div>
  );
};

export default MapboxMap; 