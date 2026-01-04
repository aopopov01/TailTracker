/**
 * Lost Pets Nearby Page
 * Interactive map showing active lost pet alerts in the area
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Radar,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  AlertTriangle,
  X,
  Dog,
  Cat,
  Bird,
  HelpCircle,
  ChevronRight,
  LocateFixed,
  RefreshCw,
  Search,
  Navigation,
  MousePointer2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Default center (Sofia, Bulgaria)
const DEFAULT_LAT = 42.6977;
const DEFAULT_LNG = 23.3219;
const DEFAULT_RADIUS = 10000; // 10km

// localStorage key for saved location
const SAVED_LOCATION_KEY = 'tailtracker_lost_pets_location';

// Location source types
type LocationSource = 'device' | 'manual' | 'saved' | 'default';

interface SavedLocation {
  lat: number;
  lng: number;
  address: string;
  timestamp: number;
}

interface SearchResult {
  lat: number;
  lng: number;
  display_name: string;
}

interface LostPetAlert {
  id: string;
  pet_id: string;
  pet_name: string;
  pet_species: string;
  pet_breed?: string;
  pet_photos: string[];
  last_seen_date: string;
  last_seen_address?: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reward_amount?: number;
  contact_phone?: string;
  contact_email?: string;
  distance_meters: number;
  latitude: number;
  longitude: number;
}

// Get species icon
const getSpeciesIcon = (species: string) => {
  switch (species?.toLowerCase()) {
    case 'dog':
      return Dog;
    case 'cat':
      return Cat;
    case 'bird':
      return Bird;
    default:
      return HelpCircle;
  }
};

// Format distance
const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }
  return `${(meters / 1000).toFixed(1)}km away`;
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// Urgency badge colors
const urgencyColors = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

export const LostPetsNearbyPage = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>('default');
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<LostPetAlert | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showClickHint, setShowClickHint] = useState(false);

  // Get the effective location (user location or default)
  const effectiveLocation = userLocation || { lat: DEFAULT_LAT, lng: DEFAULT_LNG };

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  // Save location to localStorage
  const saveLocation = useCallback((lat: number, lng: number, address: string) => {
    try {
      const saved: SavedLocation = { lat, lng, address, timestamp: Date.now() };
      localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(saved));
    } catch (e) {
      console.warn('Failed to save location to localStorage:', e);
    }
  }, []);

  // Load saved location from localStorage
  const loadSavedLocation = useCallback((): SavedLocation | null => {
    try {
      const saved = localStorage.getItem(SAVED_LOCATION_KEY);
      if (saved) {
        const parsed: SavedLocation = JSON.parse(saved);
        // Check if saved location is less than 7 days old
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < weekMs) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved location:', e);
    }
    return null;
  }, []);

  // Clear saved location
  const clearSavedLocation = useCallback(() => {
    try {
      localStorage.removeItem(SAVED_LOCATION_KEY);
    } catch (e) {
      console.warn('Failed to clear saved location:', e);
    }
  }, []);

  // Set location manually (from search or map click)
  const setManualLocation = useCallback(async (lat: number, lng: number, address?: string) => {
    const addr = address || await reverseGeocode(lat, lng);
    setUserLocation({ lat, lng });
    setCurrentAddress(addr);
    setLocationSource('manual');
    setLocationError(null);
    setIsLoadingLocation(false);
    saveLocation(lat, lng, addr);
    setMapKey(k => k + 1);
    setShowClickHint(false);
  }, [reverseGeocode, saveLocation]);

  // Handle address search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
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
        setLocationError('No results found. Try a different search term.');
      }
    } catch {
      setLocationError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Select a search result
  const selectSearchResult = useCallback((result: SearchResult) => {
    setManualLocation(result.lat, result.lng, result.display_name);
    setSearchResults([]);
    setSearchQuery('');
  }, [setManualLocation]);

  // Request geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please use a modern browser.');
      setIsLoadingLocation(false);
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        console.log('Geolocation success:', pos.coords.latitude, pos.coords.longitude);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setLocationError(null);
        setLocationSource('device');
        setIsLoadingLocation(false);
        setMapKey((k) => k + 1);
        // Get address in background
        const addr = await reverseGeocode(lat, lng);
        setCurrentAddress(addr);
        saveLocation(lat, lng, addr);
      },
      (error) => {
        console.error('Geolocation error:', error.code, error.message);
        let errorMessage = 'Unable to get your location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your device\'s location services.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting your location.';
        }

        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,  // Request high accuracy GPS
        timeout: 15000,            // 15 second timeout
        maximumAge: 60000          // Accept cached position up to 1 minute old
      }
    );
  }, [reverseGeocode, saveLocation]);

  // Fetch nearby lost pets
  const {
    data: alerts,
    isLoading,
    refetch,
  } = useQuery<LostPetAlert[]>({
    queryKey: ['lostPetsNearby', effectiveLocation.lat, effectiveLocation.lng],
    queryFn: async () => {
      if (!supabase) return [];

      // Call the RPC function to get nearby lost pets
      const { data, error } = await supabase.rpc('get_nearby_lost_pets', {
        center_lat: effectiveLocation.lat,
        center_lng: effectiveLocation.lng,
        radius_meters: DEFAULT_RADIUS,
      });

      if (error) {
        console.error('Error fetching nearby lost pets:', error);
        // Fallback to direct query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('lost_pet_reports')
          .select(`
            id,
            pet_id,
            last_seen_date,
            last_seen_address,
            description,
            urgency,
            reward_amount,
            contact_phone,
            contact_email,
            photos,
            pets!inner (
              name,
              species,
              breed,
              photos
            )
          `)
          .eq('status', 'active')
          .eq('is_resolved', false)
          .limit(50);

        if (fallbackError) throw fallbackError;

        // Transform fallback data
        return (fallbackData || []).map((item: Record<string, unknown>) => {
          const pet = item.pets as Record<string, unknown>;
          return {
            id: item.id as string,
            pet_id: item.pet_id as string,
            pet_name: pet?.name as string || 'Unknown',
            pet_species: pet?.species as string || 'unknown',
            pet_breed: pet?.breed as string,
            pet_photos: (item.photos as string[]) || (pet?.photos as string[]) || [],
            last_seen_date: item.last_seen_date as string,
            last_seen_address: item.last_seen_address as string,
            description: item.description as string,
            urgency: (item.urgency as string) || 'medium',
            reward_amount: item.reward_amount as number,
            contact_phone: item.contact_phone as string,
            contact_email: item.contact_email as string,
            distance_meters: 0,
            latitude: effectiveLocation.lat,
            longitude: effectiveLocation.lng,
          };
        });
      }

      // Transform RPC data
      return (data || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        pet_id: item.pet_id as string,
        pet_name: item.pet_name as string,
        pet_species: item.pet_species as string,
        pet_breed: undefined,
        pet_photos: (item.pet_photos as string[]) || [],
        last_seen_date: item.last_seen_date as string,
        last_seen_address: item.last_seen_address as string,
        description: item.description as string,
        urgency: (item.urgency as string) || 'medium',
        reward_amount: item.reward_amount as number,
        contact_phone: item.contact_phone as string,
        contact_email: undefined,
        distance_meters: item.distance_meters as number,
        latitude: effectiveLocation.lat,
        longitude: effectiveLocation.lng,
      }));
    },
    enabled: !isLoadingLocation,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Load saved location or request geolocation on mount
  useEffect(() => {
    const savedLoc = loadSavedLocation();
    if (savedLoc) {
      // Use saved location
      setUserLocation({ lat: savedLoc.lat, lng: savedLoc.lng });
      setCurrentAddress(savedLoc.address);
      setLocationSource('saved');
      setIsLoadingLocation(false);
    } else {
      // No saved location, request from device
      requestLocation();
    }
  }, [loadSavedLocation, requestLocation]);

  // Handle messages from iframe (marker clicks and map clicks)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'markerClick' && event.data?.alertId) {
        const alert = alerts?.find((a) => a.id === event.data.alertId);
        if (alert) {
          setSelectedAlert(alert);
        }
      }
      // Handle map clicks for manual location setting
      if (event.data?.type === 'mapClick' && showClickHint) {
        const { lat, lng } = event.data;
        await setManualLocation(lat, lng);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [alerts, showClickHint, setManualLocation]);

  // Generate map HTML with markers
  const generateMapHtml = useCallback(() => {
    const markers = (alerts || [])
      .map(
        (alert: LostPetAlert) => `
        {
          id: '${alert.id}',
          lat: ${alert.latitude || effectiveLocation.lat + (Math.random() - 0.5) * 0.05},
          lng: ${alert.longitude || effectiveLocation.lng + (Math.random() - 0.5) * 0.05},
          name: '${alert.pet_name.replace(/'/g, "\\'")}',
          species: '${alert.pet_species}',
          urgency: '${alert.urgency}'
        }`
      )
      .join(',');

    // Determine if we have the user's real location
    const hasRealLocation = userLocation !== null;
    const userMarkerPopup = hasRealLocation ? 'Your location' : 'Default location (Sofia, Bulgaria)';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; cursor: ${showClickHint ? 'crosshair' : 'grab'}; }
    .leaflet-control-attribution { font-size: 10px; }
    .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      font-size: 18px;
    }
    .urgency-low { background: #3b82f6; }
    .urgency-medium { background: #f59e0b; }
    .urgency-high { background: #f97316; }
    .urgency-critical { background: #ef4444; }
    .user-location {
      width: 16px;
      height: 16px;
      background: ${hasRealLocation ? '#3b82f6' : '#94a3b8'};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 8px ${hasRealLocation ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.2)'};
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      center: [${effectiveLocation.lat}, ${effectiveLocation.lng}],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    // User/default location marker
    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-location"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([${effectiveLocation.lat}, ${effectiveLocation.lng}], { icon: userIcon })
      .addTo(map)
      .bindPopup('${userMarkerPopup}');

    // Pet markers
    const markers = [${markers}];

    const getEmoji = (species) => {
      switch(species) {
        case 'dog': return '🐕';
        case 'cat': return '🐈';
        case 'bird': return '🐦';
        default: return '🐾';
      }
    };

    markers.forEach(m => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker urgency-' + m.urgency + '">' + getEmoji(m.species) + '</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);

      marker.on('click', () => {
        window.parent.postMessage({ type: 'markerClick', alertId: m.id }, '*');
      });

      marker.bindTooltip(m.name, { direction: 'top', offset: [0, -20] });
    });

    // Fit bounds if markers exist
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      bounds.extend([${effectiveLocation.lat}, ${effectiveLocation.lng}]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    // Handle map clicks for manual location setting
    map.on('click', function(e) {
      const { lat, lng } = e.latlng;
      window.parent.postMessage({ type: 'mapClick', lat: lat, lng: lng }, '*');
    });
  <\/script>
</body>
</html>`;
  }, [alerts, effectiveLocation, userLocation, showClickHint]);

  const mapSrc = `data:text/html;charset=utf-8,${encodeURIComponent(generateMapHtml())}`;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary-100">
            <Radar className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lost Pets Nearby</h1>
            <p className="text-slate-500">Help reunite lost pets with their families</p>
          </div>
        </div>
      </div>

      {/* Location Search and Controls */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
          <button
            onClick={requestLocation}
            disabled={isLoadingLocation}
            className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 text-sm"
            title="Use device location"
          >
            {isLoadingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <Navigation className="w-4 h-4 text-slate-600" />
            )}
            <span className="hidden sm:inline">Device</span>
          </button>
          <button
            onClick={() => {
              setShowClickHint(!showClickHint);
              setMapKey(k => k + 1);
            }}
            className={`px-3 py-2 border rounded-lg flex items-center gap-2 text-sm transition-colors ${
              showClickHint
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-slate-300 hover:bg-slate-50 text-slate-600'
            }`}
            title="Click on map to set location"
          >
            <MousePointer2 className="w-4 h-4" />
            <span className="hidden sm:inline">Click Map</span>
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white shadow-sm">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => selectSearchResult(result)}
                className="w-full px-3 py-2.5 text-left hover:bg-slate-50 text-sm flex items-start gap-2 transition-colors"
              >
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <span className="line-clamp-2 text-slate-700">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Location Status */}
        {!isLoadingLocation && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            locationSource === 'default'
              ? 'bg-amber-50 border border-amber-200 text-amber-700'
              : locationSource === 'device'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            {locationSource === 'default' ? (
              <>
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">Using default location (Sofia, Bulgaria)</span>
                  <span className="block text-xs mt-0.5 opacity-80">
                    Search for your location or click on the map to set it manually
                  </span>
                </div>
              </>
            ) : locationSource === 'device' ? (
              <>
                <LocateFixed className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">Using your device location</span>
                  {currentAddress && (
                    <span className="block text-xs mt-0.5 opacity-80 truncate">{currentAddress}</span>
                  )}
                </div>
              </>
            ) : locationSource === 'saved' ? (
              <>
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">Using saved location</span>
                  {currentAddress && (
                    <span className="block text-xs mt-0.5 opacity-80 truncate">{currentAddress}</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    clearSavedLocation();
                    requestLocation();
                  }}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                  title="Clear saved location"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <MousePointer2 className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">Location set manually</span>
                  {currentAddress && (
                    <span className="block text-xs mt-0.5 opacity-80 truncate">{currentAddress}</span>
                  )}
                </div>
              </>
            )}
            {locationSource !== 'default' && locationSource !== 'saved' && (
              <button
                onClick={requestLocation}
                className="p-1 hover:opacity-70 rounded transition-colors"
                title="Refresh location"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Click hint banner */}
        {showClickHint && (
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center gap-2 text-sm text-primary-700">
            <MousePointer2 className="h-4 w-4 flex-shrink-0 animate-pulse" />
            <span>Click anywhere on the map to set your location</span>
            <button
              onClick={() => {
                setShowClickHint(false);
                setMapKey(k => k + 1);
              }}
              className="ml-auto p-1 hover:bg-primary-100 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error message */}
        {locationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{locationError}</span>
            <button
              onClick={() => setLocationError(null)}
              className="ml-auto p-1 hover:bg-red-100 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Map Section */}
      <div className="card p-0 mb-6 overflow-hidden">
        <div className="relative" style={{ height: '500px' }}>
          {isLoadingLocation ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-2" />
                <p className="text-slate-500">Getting your location...</p>
              </div>
            </div>
          ) : (
            <iframe
              key={mapKey}
              ref={iframeRef}
              src={mapSrc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Lost pets map"
              sandbox="allow-scripts"
            />
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Active Alerts ({alerts?.length || 0})
          </h2>
          <button
            onClick={() => refetch()}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const SpeciesIcon = getSpeciesIcon(alert.pet_species);
              return (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left flex items-center gap-4"
                >
                  {/* Pet Photo */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0">
                    {alert.pet_photos?.[0] ? (
                      <img
                        src={alert.pet_photos[0]}
                        alt={alert.pet_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <SpeciesIcon className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{alert.pet_name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${urgencyColors[alert.urgency as keyof typeof urgencyColors] || urgencyColors.medium}`}
                      >
                        {alert.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 capitalize">
                      {alert.pet_species}
                      {alert.pet_breed && ` • ${alert.pet_breed}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(alert.last_seen_date)}
                      </span>
                      {alert.distance_meters > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {formatDistance(alert.distance_meters)}
                        </span>
                      )}
                      {alert.reward_amount && (
                        <span className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-3 w-3" />
                          €{alert.reward_amount} reward
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Radar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-700 mb-1">No lost pets nearby</h3>
            <p className="text-slate-500">
              There are no active lost pet alerts in your area. Check back later.
            </p>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Lost Pet Alert</h2>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Pet Photo & Basic Info */}
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  {selectedAlert.pet_photos?.[0] ? (
                    <img
                      src={selectedAlert.pet_photos[0]}
                      alt={selectedAlert.pet_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {(() => {
                        const Icon = getSpeciesIcon(selectedAlert.pet_species);
                        return <Icon className="h-10 w-10 text-slate-300" />;
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedAlert.pet_name}</h3>
                  <p className="text-slate-600 capitalize">
                    {selectedAlert.pet_species}
                    {selectedAlert.pet_breed && ` • ${selectedAlert.pet_breed}`}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${urgencyColors[selectedAlert.urgency as keyof typeof urgencyColors] || urgencyColors.medium}`}
                    >
                      {selectedAlert.urgency.toUpperCase()} urgency
                    </span>
                    {selectedAlert.reward_amount && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        €{selectedAlert.reward_amount} REWARD
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Last Seen */}
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Last Seen</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {new Date(selectedAlert.last_seen_date).toLocaleString()}
                  </div>
                  {selectedAlert.last_seen_address && (
                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                      <span>{selectedAlert.last_seen_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                <p className="text-slate-700">{selectedAlert.description}</p>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Contact Information</h4>
                <div className="space-y-2">
                  {selectedAlert.contact_phone && (
                    <a
                      href={`tel:${selectedAlert.contact_phone}`}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedAlert.contact_phone}
                    </a>
                  )}
                  {selectedAlert.contact_email && (
                    <a
                      href={`mailto:${selectedAlert.contact_email}`}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                      <Mail className="h-4 w-4" />
                      {selectedAlert.contact_email}
                    </a>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {selectedAlert.contact_phone && (
                <a
                  href={`tel:${selectedAlert.contact_phone}`}
                  className="block w-full py-3 bg-primary-600 text-white text-center font-medium rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Contact Owner
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostPetsNearbyPage;
