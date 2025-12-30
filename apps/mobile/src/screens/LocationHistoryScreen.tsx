import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  useTheme,
  Card,
  Searchbar,
  Chip,
  FAB,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, Polyline } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// Navigation types
type RootStackParamList = {
  LocationHistory: { petId: string };
};

type LocationHistoryScreenRouteProp = RouteProp<
  RootStackParamList,
  'LocationHistory'
>;
type LocationHistoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'LocationHistory'
>;

interface Props {
  route: LocationHistoryScreenRouteProp;
  navigation: LocationHistoryScreenNavigationProp;
}

interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
  address?: string;
  activity?: 'walking' | 'running' | 'resting' | 'playing';
  safeZone?: string;
}

interface LocationSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  distance: number; // in meters
  locations: LocationPoint[];
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
}

type ViewMode = 'list' | 'map';
type TimeFilter = 'today' | '3days' | '7days' | '30days' | 'all';

export const LocationHistoryScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const theme = useTheme();
  const { petId } = route.params;
  const [sessions, setSessions] = useState<LocationSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<LocationSession[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7days');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSession, setSelectedSession] =
    useState<LocationSession | null>(null);

  useEffect(() => {
    loadLocationHistory();
  }, [petId]);

  const loadLocationHistory = async () => {
    try {
      // Mock location data - replace with actual API call
      const mockSessions: LocationSession[] = [
        {
          id: '1',
          startTime: new Date('2025-01-20T08:30:00'),
          endTime: new Date('2025-01-20T09:15:00'),
          duration: 45,
          distance: 1200,
          averageSpeed: 1.6,
          maxSpeed: 4.2,
          locations: [
            {
              id: '1-1',
              latitude: 37.7749,
              longitude: -122.4194,
              timestamp: new Date('2025-01-20T08:30:00'),
              accuracy: 5,
              address: 'Golden Gate Park, San Francisco',
              activity: 'walking',
            },
            {
              id: '1-2',
              latitude: 37.7759,
              longitude: -122.4184,
              timestamp: new Date('2025-01-20T08:45:00'),
              accuracy: 4,
              activity: 'running',
            },
            {
              id: '1-3',
              latitude: 37.7769,
              longitude: -122.4174,
              timestamp: new Date('2025-01-20T09:00:00'),
              accuracy: 6,
              activity: 'playing',
            },
          ],
        },
        {
          id: '2',
          startTime: new Date('2025-01-19T15:20:00'),
          endTime: new Date('2025-01-19T16:00:00'),
          duration: 40,
          distance: 800,
          averageSpeed: 1.2,
          maxSpeed: 2.8,
          locations: [
            {
              id: '2-1',
              latitude: 37.7849,
              longitude: -122.4094,
              timestamp: new Date('2025-01-19T15:20:00'),
              accuracy: 8,
              address: 'Dolores Park, San Francisco',
              activity: 'walking',
            },
          ],
        },
        {
          id: '3',
          startTime: new Date('2025-01-18T10:00:00'),
          endTime: new Date('2025-01-18T11:30:00'),
          duration: 90,
          distance: 2400,
          averageSpeed: 1.8,
          maxSpeed: 5.1,
          locations: [
            {
              id: '3-1',
              latitude: 37.8049,
              longitude: -122.4194,
              timestamp: new Date('2025-01-18T10:00:00'),
              accuracy: 3,
              address: 'Presidio, San Francisco',
              activity: 'walking',
              safeZone: 'Home Area',
            },
          ],
        },
      ];

      setSessions(mockSessions);
    } catch (error) {
      console.error('Failed to load location history:', error);
      Alert.alert('Error', 'Failed to load location history');
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = useCallback(() => {
    let filtered = sessions;

    // Apply time filter
    const now = new Date();
    const filterDays = {
      today: 1,
      '3days': 3,
      '7days': 7,
      '30days': 30,
      all: 365 * 10, // 10 years
    }[timeFilter];

    const cutoffDate = new Date(
      now.getTime() - filterDays * 24 * 60 * 60 * 1000
    );
    filtered = filtered.filter(session => session.startTime >= cutoffDate);

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.locations.some(location =>
          location.address?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredSessions(filtered);
  }, [sessions, searchQuery, timeFilter]);

  useEffect(() => {
    filterSessions();
  }, [sessions, filterSessions]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getActivityIcon = (activity?: LocationPoint['activity']): string => {
    switch (activity) {
      case 'running':
        return 'run';
      case 'playing':
        return 'tennis-ball';
      case 'resting':
        return 'sleep';
      default:
        return 'walk';
    }
  };

  const getActivityColor = (activity?: LocationPoint['activity']): string => {
    switch (activity) {
      case 'running':
        return theme.colors.error;
      case 'playing':
        return theme.colors.tertiary;
      case 'resting':
        return theme.colors.outline;
      default:
        return theme.colors.primary;
    }
  };

  const handleSessionPress = (session: LocationSession) => {
    setSelectedSession(session);
    setViewMode('map');
  };

  const exportLocationData = () => {
    Alert.alert('Export Data', 'Choose export format:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'CSV', onPress: () => console.log('Export as CSV') },
      { text: 'GPX', onPress: () => console.log('Export as GPX') },
      { text: 'JSON', onPress: () => console.log('Export as JSON') },
    ]);
  };

  const renderSessionItem = ({ item }: { item: LocationSession }) => (
    <TouchableOpacity onPress={() => handleSessionPress(item)}>
      <Card
        style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]}
      >
        <Card.Content>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text
                style={[styles.sessionDate, { color: theme.colors.onSurface }]}
              >
                {item.startTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text
                style={[
                  styles.sessionTime,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {item.startTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {item.endTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.sessionStats}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {formatDuration(item.duration)}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Duration
              </Text>
            </View>
          </View>

          <View style={styles.sessionDetails}>
            <View style={styles.detailItem}>
              <Icon
                name='map-marker-distance'
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {formatDistance(item.distance)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Icon
                name='speedometer'
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {item.averageSpeed.toFixed(1)} km/h avg
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Icon
                name='map-marker-multiple'
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {item.locations.length} points
              </Text>
            </View>
          </View>

          {/* Activity chips */}
          <View style={styles.activityContainer}>
            {[
              ...new Set(
                item.locations.map(loc => loc.activity).filter(Boolean)
              ),
            ].map((activity, index) => (
              <Chip
                key={index}
                icon={() => (
                  <Icon
                    name={getActivityIcon(activity)}
                    size={14}
                    color={getActivityColor(activity)}
                  />
                )}
                style={[
                  styles.activityChip,
                  { backgroundColor: `${getActivityColor(activity)}20` },
                ]}
                textStyle={{ color: getActivityColor(activity), fontSize: 12 }}
              >
                {activity}
              </Chip>
            ))}
          </View>

          {/* First location address */}
          {item.locations[0]?.address && (
            <Text
              style={[
                styles.locationText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              📍 {item.locations[0].address}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderMapView = () => {
    if (!selectedSession || selectedSession.locations.length === 0) {
      return (
        <View style={styles.emptyMapContainer}>
          <Icon
            name='map-outline'
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.emptyMapText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Select a session to view on map
          </Text>
        </View>
      );
    }

    const coordinates = selectedSession.locations.map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));

    const region = {
      latitude:
        coordinates.reduce((sum, coord) => sum + coord.latitude, 0) /
        coordinates.length,
      longitude:
        coordinates.reduce((sum, coord) => sum + coord.longitude, 0) /
        coordinates.length,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={region}
        >
          {/* Path polyline */}
          <Polyline
            coordinates={coordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
            lineCap='round'
            lineJoin='round'
          />

          {/* Start marker */}
          <Marker
            coordinate={coordinates[0]}
            title='Start'
            description={`Started at ${selectedSession.startTime.toLocaleTimeString()}`}
          >
            <View
              style={[
                styles.startMarker,
                { backgroundColor: theme.colors.tertiary },
              ]}
            >
              <Icon name='play' size={16} color='white' />
            </View>
          </Marker>

          {/* End marker */}
          <Marker
            coordinate={coordinates[coordinates.length - 1]}
            title='End'
            description={`Ended at ${selectedSession.endTime.toLocaleTimeString()}`}
          >
            <View
              style={[
                styles.endMarker,
                { backgroundColor: theme.colors.error },
              ]}
            >
              <Icon name='stop' size={16} color='white' />
            </View>
          </Marker>

          {/* Activity markers */}
          {selectedSession.locations
            .filter(
              (loc, index) =>
                index > 0 &&
                index < selectedSession.locations.length - 1 &&
                loc.activity
            )
            .map(location => (
              <Marker
                key={location.id}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.activity}
                description={location.address || 'Activity location'}
              >
                <View
                  style={[
                    styles.activityMarker,
                    { backgroundColor: getActivityColor(location.activity) },
                  ]}
                >
                  <Icon
                    name={getActivityIcon(location.activity)}
                    size={12}
                    color='white'
                  />
                </View>
              </Marker>
            ))}
        </MapView>

        {/* Map session info */}
        <Card
          style={[
            styles.mapInfoCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Card.Content style={styles.mapInfoContent}>
            <View style={styles.mapInfoItem}>
              <Text
                style={[styles.mapInfoValue, { color: theme.colors.primary }]}
              >
                {formatDistance(selectedSession.distance)}
              </Text>
              <Text
                style={[
                  styles.mapInfoLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Distance
              </Text>
            </View>
            <View style={styles.mapInfoItem}>
              <Text
                style={[styles.mapInfoValue, { color: theme.colors.primary }]}
              >
                {formatDuration(selectedSession.duration)}
              </Text>
              <Text
                style={[
                  styles.mapInfoLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Duration
              </Text>
            </View>
            <View style={styles.mapInfoItem}>
              <Text
                style={[styles.mapInfoValue, { color: theme.colors.primary }]}
              >
                {selectedSession.maxSpeed.toFixed(1)}
              </Text>
              <Text
                style={[
                  styles.mapInfoLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Max Speed
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size='large' />
          <Text
            style={[styles.loadingText, { color: theme.colors.onBackground }]}
          >
            Loading location history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header Controls */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder='Search locations...'
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.controlsRow}>
          {/* Time filter chips */}
          <View style={styles.filterContainer}>
            {(['today', '3days', '7days', '30days', 'all'] as TimeFilter[]).map(
              filter => (
                <Chip
                  key={filter}
                  selected={timeFilter === filter}
                  onPress={() => setTimeFilter(filter)}
                  style={styles.filterChip}
                  textStyle={{ fontSize: 12 }}
                >
                  {filter === '3days'
                    ? '3 days'
                    : filter === '7days'
                      ? '7 days'
                      : filter === '30days'
                        ? '30 days'
                        : filter}
                </Chip>
              )
            )}
          </View>

          {/* View mode toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === 'list' && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
              onPress={() => setViewMode('list')}
            >
              <Icon
                name='format-list-bulleted'
                size={20}
                color={
                  viewMode === 'list'
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === 'map' && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
              onPress={() => setViewMode('map')}
            >
              <Icon
                name='map'
                size={20}
                color={
                  viewMode === 'map'
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        filteredSessions.length > 0 ? (
          <FlatList
            data={filteredSessions}
            renderItem={renderSessionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon
              name='map-marker-off'
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {searchQuery
                ? 'No matching locations found'
                : 'No location history available'}
            </Text>
            {searchQuery && (
              <Button mode='text' onPress={() => setSearchQuery('')}>
                Clear search
              </Button>
            )}
          </View>
        )
      ) : (
        renderMapView()
      )}

      {/* Export FAB */}
      <FAB
        icon='download'
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
        onPress={exportLocationData}
        label={filteredSessions.length > 0 ? 'Export' : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchBar: {
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  filterChip: {
    marginRight: 8,
    height: 32,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 12,
  },
  viewButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
  },
  sessionCard: {
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionTime: {
    fontSize: 14,
    marginTop: 2,
  },
  sessionStats: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
  },
  activityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  activityChip: {
    marginRight: 6,
    marginBottom: 4,
    height: 24,
  },
  locationText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  startMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  endMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  activityMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  mapInfoCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mapInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  mapInfoItem: {
    alignItems: 'center',
  },
  mapInfoValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  mapInfoLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMapText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
