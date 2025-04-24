import React from 'react';
import { IPLocation as IPLocationType } from '@/types/ip';

interface IPLocationProps {
  location: IPLocationType | null;
}

const IPLocation: React.FC<IPLocationProps> = ({ location }) => {
  if (!location) {
    return <div>No location data available</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">IP Location</h2>
      <div className="space-y-2">
        <p><span className="font-medium">IP:</span> {location.ip}</p>
        <p><span className="font-medium">Country:</span> {location.country}</p>
        <p><span className="font-medium">Region:</span> {location.region}</p>
        <p><span className="font-medium">City:</span> {location.city}</p>
        <p><span className="font-medium">ISP:</span> {location.isp}</p>
      </div>
      <div 
        className="mt-4 h-48 bg-gray-100 rounded"
        data-testid="ip-location-map"
        data-lat={location.latitude}
        data-lng={location.longitude}
      >
        {/* Map component would be rendered here */}
      </div>
    </div>
  );
};

export default IPLocation; 