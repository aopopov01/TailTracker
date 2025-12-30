import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Text, useTheme, FAB, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

interface Pet {
  id: string;
  name: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  safeZone?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  color?: string;
}

export const MapScreen: React.FC = () => {
  const theme = useTheme();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        // Mock pet data for demonstration
        const mockPets: Pet[] = [
          {
            id: '1',
            name: 'Max',
            color: theme.colors.primary,
            location: {
              latitude: location.coords.latitude + 0.001,
              longitude: location.coords.longitude + 0.001,
              timestamp: new Date(),
            },
            safeZone: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              radius: 100,
            },
          },
          {
            id: '2',
            name: 'Bella',
            color: theme.colors.secondary,
            location: {
              latitude: location.coords.latitude - 0.002,
              longitude: location.coords.longitude + 0.002,
              timestamp: new Date(),
            },
          },
        ];

        setPets(mockPets);
        setLoading(false);
      } catch (error) {
        setErrorMsg('Failed to get location');
        setLoading(false);
      }
    })();
  }, [theme.colors.primary, theme.colors.secondary]);

  const animateToLocation = (latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000
    );
  };

  const handlePetSelect = (pet: Pet) => {
    setSelectedPet(pet);
    if (pet.location) {
      animateToLocation(pet.location.latitude, pet.location.longitude);
    }

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closePetDetails = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedPet(null);
    });
  };

  const centerOnUser = () => {
    if (location) {
      animateToLocation(location.coords.latitude, location.coords.longitude);
    }
  };

  const toggleSafeZone = (petId: string) => {
    Alert.alert('Safe Zone', 'Set up a safe zone for your pet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Set Zone',
        onPress: () => console.log('Setting safe zone for pet:', petId),
      },
    ]);
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
            Loading map...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !location) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Icon name='map-marker-off' size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errorMsg || 'Unable to load map'}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => window.location.reload()}
          >
            <Text
              style={[
                styles.retryButtonText,
                { color: theme.colors.onPrimary },
              ]}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* User location marker */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title='Your Location'
          description='Current location'
        >
          <View style={styles.userMarker}>
            <Icon name='account' size={20} color='white' />
          </View>
        </Marker>

        {/* Pet markers and safe zones */}
        {pets.map(pet => (
          <React.Fragment key={pet.id}>
            {pet.location && (
              <Marker
                coordinate={{
                  latitude: pet.location.latitude,
                  longitude: pet.location.longitude,
                }}
                title={pet.name}
                description={`Last seen: ${pet.location.timestamp.toLocaleTimeString()}`}
                onPress={() => handlePetSelect(pet)}
              >
                <View
                  style={[
                    styles.petMarker,
                    { backgroundColor: pet.color || theme.colors.primary },
                  ]}
                >
                  <Icon name='paw' size={16} color='white' />
                </View>
              </Marker>
            )}

            {pet.safeZone && (
              <Circle
                center={{
                  latitude: pet.safeZone.latitude,
                  longitude: pet.safeZone.longitude,
                }}
                radius={pet.safeZone.radius}
                fillColor={`${pet.color || theme.colors.primary}20`}
                strokeColor={pet.color || theme.colors.primary}
                strokeWidth={2}
              />
            )}
          </React.Fragment>
        ))}
      </MapView>

      {/* Pet list */}
      <View style={[styles.petList, { backgroundColor: theme.colors.surface }]}>
        {pets.map(pet => (
          <TouchableOpacity
            key={pet.id}
            style={[
              styles.petItem,
              selectedPet?.id === pet.id && {
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
            onPress={() => handlePetSelect(pet)}
            onLongPress={() => toggleSafeZone(pet.id)}
          >
            <View
              style={[
                styles.petIndicator,
                { backgroundColor: pet.color || theme.colors.primary },
              ]}
            />
            <Text style={[styles.petName, { color: theme.colors.onSurface }]}>
              {pet.name}
            </Text>
            {pet.location && (
              <Text
                style={[
                  styles.petStatus,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Active
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Center on user FAB */}
      <FAB
        icon='crosshairs-gps'
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={centerOnUser}
        size='medium'
      />

      {/* Pet details bottom sheet */}
      {selectedPet && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { backgroundColor: theme.colors.surface },
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [200, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.bottomSheetHeader}>
            <Text
              style={[
                styles.bottomSheetTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              {selectedPet.name}
            </Text>
            <TouchableOpacity onPress={closePetDetails}>
              <Icon name='close' size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSheetContent}>
            {selectedPet.location && (
              <>
                <View style={styles.infoRow}>
                  <Icon
                    name='clock'
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Last seen: {selectedPet.location.timestamp.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon
                    name='map-marker'
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Location: {selectedPet.location.latitude.toFixed(4)},{' '}
                    {selectedPet.location.longitude.toFixed(4)}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => toggleSafeZone(selectedPet.id)}
            >
              <Icon name='shield' size={16} color={theme.colors.onPrimary} />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.onPrimary },
                ]}
              >
                {selectedPet.safeZone ? 'Edit Safe Zone' : 'Set Safe Zone'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  map: {
    width: width,
    height: height,
  },
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  petMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  petList: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    maxHeight: 200,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  petIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  petName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  petStatus: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  bottomSheetContent: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});
