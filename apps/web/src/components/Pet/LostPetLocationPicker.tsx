/**
 * Lost Pet Location Picker Component
 * Interactive map using inline Leaflet via iframe - NO npm dependencies
 * Uses postMessage for React ↔ iframe communication
 * Free OpenStreetMap tiles - no API key required
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Navigation, Loader2, X } from 'lucide-react';
import type { GeoCoordinates } from '@tailtracker/shared-types';

interface LostPetLocationPickerProps {
  onLocationSelect: (location: GeoCoordinates, address: string) => void;
  initialLocation?: GeoCoordinates | null;
  initialAddress?: string;
}

const DEFAULT_LAT = 42.6977;
const DEFAULT_LNG = 23.3219;

export function LostPetLocationPicker({
  onLocationSelect,
  initialLocation,
  initialAddress = '',
}: LostPetLocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [mapCenter, setMapCenter] = useState({
    lat: initialLocation?.latitude || DEFAULT_LAT,
    lng: initialLocation?.longitude || DEFAULT_LNG,
  });
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<
    Array<{ lat: number; lng: number; display_name: string }>
  >([]);
  const [mapKey, setMapKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Convert to GeoCoordinates and notify parent
  const notifyLocationChange = useCallback(
    (lat: number, lng: number, addr: string) => {
      const geoCoords: GeoCoordinates = {
        latitude: lat,
        longitude: lng,
        accuracy: 50,
        timestamp: new Date().toISOString(),
      };
      onLocationSelect(geoCoords, addr);
    },
    [onLocationSelect]
  );

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Listen for messages from the iframe map
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'mapClick') {
        const { lat, lng } = event.data;
        setPosition({ lat, lng });
        setError(null);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        notifyLocationChange(lat, lng, addr);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [notifyLocationChange]);

  // Update iframe when position changes externally
  useEffect(() => {
    if (iframeRef.current?.contentWindow && position) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'setMarker', lat: position.lat, lng: position.lng },
        '*'
      );
    }
  }, [position]);

  // Update iframe center when mapCenter changes
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'setCenter', lat: mapCenter.lat, lng: mapCenter.lng },
        '*'
      );
    }
  }, [mapCenter]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        setMapCenter({ lat, lng });
        setMapKey((k) => k + 1); // Force iframe reload with new center
        setIsLoadingLocation(false);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        notifyLocationChange(lat, lng, addr);
      },
      () => {
        setIsLoadingLocation(false);
        setError('Unable to get location. Click on the map to select.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();

      if (data.length > 0) {
        setSearchResults(
          data.map((item: { lat: string; lon: string; display_name: string }) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            display_name: item.display_name,
          }))
        );
      } else {
        setError('No results found. Try a different search.');
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: { lat: number; lng: number; display_name: string }) => {
    setPosition({ lat: result.lat, lng: result.lng });
    setMapCenter({ lat: result.lat, lng: result.lng });
    setMapKey((k) => k + 1); // Force iframe reload with new center
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery('');
    setError(null);
    notifyLocationChange(result.lat, result.lng, result.display_name);
  };

  const clearLocation = () => {
    setPosition(null);
    setAddress('');
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'clearMarker' }, '*');
    }
  };

  // Inline HTML for the Leaflet map (loaded via CDN, no npm packages)
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    #map { cursor: crosshair; }
    .leaflet-control-attribution { font-size: 10px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      center: [${mapCenter.lat}, ${mapCenter.lng}],
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    let marker = ${position ? `L.marker([${position.lat}, ${position.lng}]).addTo(map)` : 'null'};

    // Handle map clicks
    map.on('click', function(e) {
      const { lat, lng } = e.latlng;
      if (marker) marker.remove();
      marker = L.marker([lat, lng]).addTo(map);
      window.parent.postMessage({ type: 'mapClick', lat: lat, lng: lng }, '*');
    });

    // Listen for messages from React
    window.addEventListener('message', function(e) {
      if (!e.data || !e.data.type) return;

      if (e.data.type === 'setMarker') {
        if (marker) marker.remove();
        marker = L.marker([e.data.lat, e.data.lng]).addTo(map);
        map.setView([e.data.lat, e.data.lng], 14);
      }
      if (e.data.type === 'setCenter') {
        map.setView([e.data.lat, e.data.lng], 14);
      }
      if (e.data.type === 'clearMarker') {
        if (marker) {
          marker.remove();
          marker = null;
        }
      }
    });
  <\/script>
</body>
</html>`;

  const mapSrc = `data:text/html;charset=utf-8,${encodeURIComponent(mapHtml)}`;

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-lg divide-y max-h-40 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectSearchResult(result)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <span className="line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Get Current Location Button */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={isLoadingLocation}
        className="w-full py-2 border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoadingLocation ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Getting your location...
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4" />
            Use My Current Location
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-2">
          <span>Warning:</span> {error}
        </p>
      )}

      {/* Interactive Map (Leaflet via CDN in iframe) */}
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '280px' }}>
        <iframe
          key={mapKey}
          ref={iframeRef}
          src={mapSrc}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Location picker map"
          sandbox="allow-scripts"
        />
      </div>
      <p className="text-xs text-gray-500 text-center">
        Click anywhere on the map to place a pin
      </p>

      {/* Selected Location Display */}
      {position && address && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">Location Selected</p>
            <p className="text-sm text-green-700 break-words">{address}</p>
            <p className="text-xs text-green-600 mt-1">
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          </div>
          <button
            type="button"
            onClick={clearLocation}
            className="p-1 hover:bg-green-100 rounded"
          >
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {!position && !isLoadingLocation && (
        <p className="text-sm text-gray-500 text-center py-2">
          Search for an address, use your current location, or click on the map
        </p>
      )}
    </div>
  );
}

export default LostPetLocationPicker;
