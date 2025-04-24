import React from 'react';
import { render, screen } from '@testing-library/react';
import IPLocation from '../IPLocation';
import { IPLocation as IPLocationType } from '@/types/ip';

describe('IPLocation Component', () => {
  const mockLocation: IPLocationType = {
    ip: '192.168.1.1',
    country: 'United States',
    region: 'California',
    city: 'San Francisco',
    isp: 'Test ISP',
    latitude: 37.7749,
    longitude: -122.4194
  };

  it('renders location information correctly', () => {
    render(<IPLocation location={mockLocation} />);
    
    expect(screen.getByText('IP Location')).toBeInTheDocument();
    expect(screen.getByText(/192.168.1.1/)).toBeInTheDocument();
    expect(screen.getByText(/United States/)).toBeInTheDocument();
    expect(screen.getByText(/California/)).toBeInTheDocument();
    expect(screen.getByText(/San Francisco/)).toBeInTheDocument();
    expect(screen.getByText(/Test ISP/)).toBeInTheDocument();
  });

  it('renders map with correct coordinates', () => {
    render(<IPLocation location={mockLocation} />);
    
    const mapElement = screen.getByTestId('ip-location-map');
    expect(mapElement).toBeInTheDocument();
    expect(mapElement).toHaveAttribute('data-lat', '37.7749');
    expect(mapElement).toHaveAttribute('data-lng', '-122.4194');
  });

  it('handles null location data', () => {
    render(<IPLocation location={null} />);
    
    expect(screen.getByText('No location data available')).toBeInTheDocument();
  });
}); 