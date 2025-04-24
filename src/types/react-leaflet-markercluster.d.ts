import { Component } from 'react'
import { MarkerClusterGroupOptions } from 'leaflet.markercluster'

declare module 'react-leaflet-markercluster' {
  interface MarkerClusterGroupProps extends MarkerClusterGroupOptions {
    children?: React.ReactNode
  }

  export default class MarkerClusterGroup extends Component<MarkerClusterGroupProps> {}
} 