import { LatLngExpression } from 'leaflet'
import { ReactNode } from 'react'

declare module 'react-leaflet' {
  export interface MapContainerProps {
    center: LatLngExpression
    zoom: number
    style?: React.CSSProperties
    children?: ReactNode
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
    children?: ReactNode
  }

  export interface PopupProps {
    children?: ReactNode
  }

  export const MapContainer: React.FC<MapContainerProps>
  export const TileLayer: React.FC<TileLayerProps>
  export const Marker: React.FC<MarkerProps>
  export const Popup: React.FC<PopupProps>
  export function useMap(): any
} 