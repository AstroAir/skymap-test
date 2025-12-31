'use client';

import { useState } from 'react';
import { MapLocationPicker } from '@/components/starmap/map';
import { LocationSearch } from '@/components/starmap/map';

export default function TestMapPage() {
  const [location, setLocation] = useState({
    latitude: 39.9042,
    longitude: 116.4074,
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    coordinates: { latitude: number; longitude: number };
    address?: string;
  } | null>(null);

  return (
    <div className="p-4 space-y-6" data-testid="test-map-page">
      <h1 className="text-2xl font-bold">Map Component Test Page</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Location Search</h2>
        <LocationSearch
          onLocationSelect={(result) => {
            setSelectedLocation(result);
            setLocation(result.coordinates);
          }}
          placeholder="Search for a location..."
        />
        {selectedLocation && (
          <div className="p-2 bg-muted rounded" data-testid="selected-location">
            <p>Selected: {selectedLocation.address || 'Unknown'}</p>
            <p>Lat: {selectedLocation.coordinates.latitude.toFixed(6)}</p>
            <p>Lng: {selectedLocation.coordinates.longitude.toFixed(6)}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Map Location Picker</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={location.latitude}
              onChange={(e) => setLocation({ ...location, latitude: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border rounded"
              data-testid="latitude-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={location.longitude}
              onChange={(e) => setLocation({ ...location, longitude: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border rounded"
              data-testid="longitude-input"
            />
          </div>
        </div>
        
        <MapLocationPicker
          initialLocation={location}
          onLocationChange={(coords) => {
            setLocation(coords);
          }}
          onLocationSelect={(result) => {
            setSelectedLocation(result);
            setLocation(result.coordinates);
          }}
          height={400}
          showSearch={true}
          showControls={true}
        />
      </div>

      <div className="p-4 bg-muted rounded" data-testid="current-coordinates">
        <h3 className="font-semibold">Current Coordinates</h3>
        <p>Latitude: <span data-testid="current-lat">{location.latitude.toFixed(6)}</span></p>
        <p>Longitude: <span data-testid="current-lng">{location.longitude.toFixed(6)}</span></p>
      </div>
    </div>
  );
}
