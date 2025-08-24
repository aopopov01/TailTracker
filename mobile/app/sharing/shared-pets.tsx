import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SharingService } from '../../src/services/sharingService';
import { SharedPetAccess } from '../../services/database';
import { useAuth } from '../../src/contexts/AuthContext';

interface SharedPetWithOwner extends SharedPetAccess {
  // All needed properties are already in SharedPetAccess
}

const SharedPetsScreen: React.FC = () => {
  const { user } = useAuth();
  const [sharedPets, setSharedPets] = useState<SharedPetWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSharedPets();
  }, []);

  const loadSharedPets = async () => {
    if (!user) return;

    try {
      const pets = await SharingService.getSharedPets(user.id);
      setSharedPets(pets);
    } catch (error) {
      console.error('Error loading shared pets:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSharedPets();
  };

  const navigateToPetDetail = (pet: SharedPetWithOwner) => {
    router.push({
      pathname: '/sharing/pet-detail/[id]',
      params: { 
        id: pet.petId.toString(),
        shared: 'true',
        ownerName: `${pet.ownerFirstName} ${pet.ownerLastName}`
      }
    });
  };

  const getSpeciesIcon = (species: string | undefined) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return 'pets';
      case 'cat':
        return 'pets';
      case 'bird':
      case 'parrot':
        return 'flutter-dash';
      default:
        return 'pets';
    }
  };

  const getSpeciesColor = (species: string | undefined) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return '#8B4513';
      case 'cat':
        return '#FF6B35';
      case 'bird':
      case 'parrot':
        return '#00CED1';
      default:
        return '#8E8E93';
    }
  };

  const renderPetItem = ({ item }: { item: SharedPetWithOwner }) => {
    const hasPhoto = item.photos && item.photos.length > 0;
    
    return (
      <TouchableOpacity
        style={styles.petCard}
        onPress={() => navigateToPetDetail(item)}
      >
        {/* Pet Photo/Icon */}
        <View style={styles.petImageContainer}>
          {hasPhoto ? (
            <Image source={{ uri: item.photos?.[0] }} style={styles.petImage} />
          ) : (
            <View style={[
              styles.petIconContainer,
              { backgroundColor: `${getSpeciesColor(item.species)}20` }
            ]}>
              <MaterialIcons 
                name={getSpeciesIcon(item.species)} 
                size={32} 
                color={getSpeciesColor(item.species)} 
              />
            </View>
          )}
        </View>

        {/* Pet Info */}
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{item.petName || 'Unnamed Pet'}</Text>
          <View style={styles.petDetailsRow}>
            <Text style={styles.petSpecies}>
              {item.species || 'Unknown species'}
            </Text>
            {item.breed && (
              <>
                <Text style={styles.separator}> • </Text>
                <Text style={styles.petBreed}>{item.breed}</Text>
              </>
            )}
          </View>
          <View style={styles.ownerInfo}>
            <MaterialIcons name="person" size={16} color="#8E8E93" />
            <Text style={styles.ownerText}>
              Shared by {item.ownerFirstName} {item.ownerLastName}
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <MaterialIcons name="arrow-forward-ios" size={16} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Shared Pets</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading shared pets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Shared Pets</Text>
        <TouchableOpacity 
          onPress={() => router.push('/sharing')} 
          style={styles.addButton}
        >
          <MaterialIcons name="qr-code-scanner" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {sharedPets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="pets" size={80} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No Shared Pets</Text>
            <Text style={styles.emptyText}>
              When others share their pet information with you, it will appear here.
            </Text>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => router.push('/sharing')}
            >
              <MaterialIcons name="qr-code-scanner" size={20} color="white" />
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {sharedPets.length} pet{sharedPets.length !== 1 ? 's' : ''} shared with you
              </Text>
            </View>

            <FlatList
              data={sharedPets}
              renderItem={renderPetItem}
              keyExtractor={(item) => `shared-${item.petId}`}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              contentContainerStyle={styles.listContent}
            />
          </>
        )}
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialIcons name="info" size={20} color="#007AFF" />
        <Text style={styles.infoBannerText}>
          You have read-only access to shared pets. Contact the owner to update information.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C7C7CC',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  addButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  petCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  petImageContainer: {
    marginRight: 16,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  petIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  petDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  petSpecies: {
    fontSize: 14,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  separator: {
    fontSize: 14,
    color: '#C7C7CC',
  },
  petBreed: {
    fontSize: 14,
    color: '#8E8E93',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  infoBannerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default SharedPetsScreen;