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
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Default center (Sofia, Bulgaria)
const DEFAULT_LAT = 42.6977;
const DEFAULT_LNG = 23.3219;
const DEFAULT_RADIUS = 10000; // 10km

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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<LostPetAlert | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch nearby lost pets
  const {
    data: alerts,
    isLoading,
    refetch,
  } = useQuery<LostPetAlert[]>({
    queryKey: ['lostPetsNearby', userLocation.lat, userLocation.lng],
    queryFn: async () => {
      if (!supabase) return [];

      // Call the RPC function to get nearby lost pets
      const { data, error } = await supabase.rpc('get_nearby_lost_pets', {
        center_lat: userLocation.lat,
        center_lng: userLocation.lng,
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
            latitude: userLocation.lat,
            longitude: userLocation.lng,
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
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      }));
    },
    enabled: !isLoadingLocation,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLoadingLocation(false);
        setMapKey((k) => k + 1);
      },
      () => {
        setLocationError('Unable to get your location. Showing default area.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Handle marker click from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'markerClick' && event.data?.alertId) {
        const alert = alerts?.find((a) => a.id === event.data.alertId);
        if (alert) {
          setSelectedAlert(alert);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [alerts]);

  // Generate map HTML with markers
  const generateMapHtml = useCallback(() => {
    const markers = (alerts || [])
      .map(
        (alert: LostPetAlert) => `
        {
          id: '${alert.id}',
          lat: ${alert.latitude || userLocation.lat + (Math.random() - 0.5) * 0.05},
          lng: ${alert.longitude || userLocation.lng + (Math.random() - 0.5) * 0.05},
          name: '${alert.pet_name.replace(/'/g, "\\'")}',
          species: '${alert.pet_species}',
          urgency: '${alert.urgency}'
        }`
      )
      .join(',');

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
    html, body, #map { width: 100%; height: 100%; }
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
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      center: [${userLocation.lat}, ${userLocation.lng}],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    // User location marker
    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-location"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([${userLocation.lat}, ${userLocation.lng}], { icon: userIcon })
      .addTo(map)
      .bindPopup('Your location');

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
      bounds.extend([${userLocation.lat}, ${userLocation.lng}]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  <\/script>
</body>
</html>`;
  }, [alerts, userLocation]);

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

      {/* Location Status */}
      {locationError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {locationError}
        </div>
      )}

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
