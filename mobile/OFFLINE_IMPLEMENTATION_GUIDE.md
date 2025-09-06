# TailTracker Offline Implementation Guide

## Quick Start

### 1. Installation and Setup

```bash
# Required dependencies are already included in package.json
npm install

# The offline system will be initialized automatically when the app starts
```

### 2. Basic Integration

```typescript
// App.tsx - Root component setup
import React from 'react';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { ApiClient } from './src/services/ApiClient';

const apiClient = new ApiClient();

export default function App() {
  return (
    <OfflineProvider apiClient={apiClient}>
      {/* Your app components */}
      <MainNavigator />
    </OfflineProvider>
  );
}
```

### 3. Using Offline Features in Components

```typescript
// PetListScreen.tsx
import React from 'react';
import { View, FlatList, Text } from 'react-native';
import { useOfflinePets } from '../contexts/OfflineContext';
import { OfflineStatusBar } from '../components/Offline';

export const PetListScreen = () => {
  const { pets, loading, createPet, updatePet, deletePet, isReady } = useOfflinePets();

  const handleCreatePet = async (petData: any) => {
    try {
      await createPet(petData);
      // UI updates immediately (optimistic update)
      // Data will sync when online
    } catch (error) {
      console.error('Failed to create pet:', error);
    }
  };

  if (!isReady) {
    return <Text>Setting up offline features...</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineStatusBar showDetails />
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PetCard pet={item} onUpdate={updatePet} onDelete={deletePet} />
        )}
      />
    </View>
  );
};
```

## Core Patterns

### 1. **Optimistic Updates Pattern**

```typescript
// Optimistic UI updates with automatic rollback
const updatePetProfile = async (petId: string, updates: any) => {
  const { updatePet } = useOfflinePets();
  
  try {
    // UI updates immediately
    await updatePet(petId, updates);
    
    // Success feedback
    showSuccessToast('Pet updated successfully');
  } catch (error) {
    // Automatic rollback happens in the background
    // User sees error feedback
    showErrorToast('Update failed - changes reverted');
  }
};
```

### 2. **Network-Aware Operations Pattern**

```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const PhotoUploadComponent = () => {
  const { networkStatus, isOperationRecommended } = useNetworkStatus();
  
  const handlePhotoUpload = async (photo: any) => {
    if (!networkStatus.isConnected) {
      // Save locally, sync later
      await savePhotoOffline(photo);
      showMessage('Photo saved - will upload when online');
      return;
    }
    
    if (!isOperationRecommended('imageSync')) {
      // Poor connection - save locally
      await savePhotoOffline(photo);
      showMessage('Photo saved - will upload with better connection');
      return;
    }
    
    // Good connection - upload immediately
    await uploadPhotoImmediately(photo);
  };
};
```

### 3. **Priority Sync Pattern**

```typescript
// Lost pet reports get immediate priority
const LostPetReportScreen = () => {
  const { createLostPetReport } = useOfflineLostPets();
  
  const handleCreateReport = async (reportData: any) => {
    try {
      // This will attempt immediate sync with CRITICAL priority
      const reportId = await createLostPetReport(petId, reportData);
      
      // User feedback
      showSuccessToast('Lost pet report created - notifying nearby users');
      
      // Navigate to tracking screen
      navigation.navigate('LostPetTracking', { reportId });
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  };
};
```

### 4. **Conflict Resolution Pattern**

```typescript
import { ConflictResolutionModal } from '../components/Offline';

const PetProfileScreen = () => {
  const { conflicts, resolveConflict } = useOfflineSync();
  const [showConflicts, setShowConflicts] = useState(false);
  
  useEffect(() => {
    if (conflicts.length > 0) {
      setShowConflicts(true);
    }
  }, [conflicts]);
  
  return (
    <View>
      {/* Your regular UI */}
      <PetProfileForm />
      
      {/* Conflict resolution modal */}
      <ConflictResolutionModal
        visible={showConflicts}
        conflicts={conflicts}
        onResolve={resolveConflict}
        onClose={() => setShowConflicts(false)}
      />
    </View>
  );
};
```

## Advanced Usage

### 1. **Custom Data Operations**

```typescript
// Using the data layer directly for complex operations
import { useOffline } from '../contexts/OfflineContext';

const AdvancedDataComponent = () => {
  const { dataLayer } = useOffline();
  
  const complexQuery = async () => {
    if (!dataLayer) return;
    
    // Using query builder for complex offline queries
    const results = await dataLayer
      .query('pets')
      .where('age', '>', 5)
      .where('breed', '=', 'Golden Retriever')
      .orderBy('name', 'asc')
      .limit(10)
      .execute();
    
    return results;
  };
  
  const batchOperations = async () => {
    if (!dataLayer) return;
    
    // Batch multiple operations for consistency
    const results = await dataLayer.batch([
      () => dataLayer.createPet(petData1),
      () => dataLayer.createPet(petData2),
      () => dataLayer.createHealthRecord(petId, healthData),
    ]);
    
    return results;
  };
};
```

### 2. **Custom Sync Configuration**

```typescript
// App.tsx - Custom offline configuration
const customOfflineConfig = {
  // Storage settings
  storageQuotaMB: 1000, // 1GB for premium users
  encryptionEnabled: true,
  compressionQuality: 0.9,
  
  // Sync settings
  syncIntervalMs: 15000, // Faster sync for premium
  wifiOnlySync: false, // Allow cellular sync
  batchSize: 100, // Larger batches
  
  // Lost pet priority settings
  immediateUploadEnabled: true,
  backgroundLocationEnabled: true,
  highFrequencySync: true,
};

export default function App() {
  return (
    <OfflineProvider apiClient={apiClient} config={customOfflineConfig}>
      <MainNavigator />
    </OfflineProvider>
  );
}
```

### 3. **Manual Sync Control**

```typescript
const SyncControlComponent = () => {
  const { forceSync, pauseSync, resumeSync, isSyncing } = useOfflineSync();
  
  return (
    <View>
      <Button
        title={isSyncing ? 'Syncing...' : 'Force Sync'}
        onPress={forceSync}
        disabled={isSyncing}
      />
      
      <Button
        title="Pause Sync"
        onPress={pauseSync}
      />
      
      <Button
        title="Resume Sync"
        onPress={resumeSync}
      />
    </View>
  );
};
```

## UI Components

### 1. **Status Indicators**

```typescript
// Different status indicators for different use cases

// Full status bar (top of screen)
<OfflineStatusBar 
  dataLayer={dataLayer}
  showDetails={true}
  onPress={() => navigation.navigate('SyncStatus')}
/>

// Compact status (in navigation bar)
<CompactOfflineStatus 
  dataLayer={dataLayer}
  onPress={() => setShowSyncModal(true)}
/>

// Floating status (bottom right)
<FloatingOfflineStatus 
  dataLayer={dataLayer}
  bottom={100}
  right={20}
  onPress={() => setShowSyncDetails(true)}
/>
```

### 2. **Sync Progress**

```typescript
const SyncStatusScreen = () => {
  const { syncEngine } = useOffline();
  const [showProgress, setShowProgress] = useState(false);
  
  return (
    <View>
      <SyncProgressModal
        visible={showProgress}
        syncEngine={syncEngine!}
        onClose={() => setShowProgress(false)}
      />
      
      {/* Compact progress indicator */}
      <CompactSyncProgress
        syncEngine={syncEngine!}
        onPress={() => setShowProgress(true)}
      />
    </View>
  );
};
```

## Error Handling

### 1. **Graceful Degradation**

```typescript
const RobustComponent = () => {
  const { isReady, initializationError } = useOfflineStatus();
  
  if (initializationError) {
    return (
      <ErrorView
        title="Offline Features Unavailable"
        message="Some features may be limited without offline support"
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  if (!isReady) {
    return <LoadingView message="Setting up offline features..." />;
  }
  
  // Regular component content
  return <MainContent />;
};
```

### 2. **Error Recovery**

```typescript
const ErrorRecoveryExample = () => {
  const { healthCheck, clearCache } = useOffline();
  
  const handleRecovery = async () => {
    try {
      // Check system health
      const health = await healthCheck();
      
      if (!health.overall) {
        // Try clearing cache
        await clearCache();
        showMessage('Cache cleared - please restart the app');
        return;
      }
      
      showMessage('System is healthy');
    } catch (error) {
      showError('Recovery failed - please contact support');
    }
  };
};
```

## Testing Offline Features

### 1. **Development Testing**

```typescript
// Test utilities for development
const DevTestingComponent = () => {
  const { manager } = useOffline();
  
  const simulateOffline = () => {
    // Simulate offline mode
    if (manager) {
      manager.pauseSync();
      // Disable network in dev tools
    }
  };
  
  const simulateConflict = async () => {
    // Create conflicting data for testing
    const pet1 = await createPet({ name: 'Buddy', age: 5 });
    const pet2 = await createPet({ name: 'Buddy', age: 6 }); // Same ID, different data
  };
  
  const testSyncPerformance = async () => {
    const startTime = Date.now();
    await manager?.forceSync();
    const duration = Date.now() - startTime;
    console.log(`Sync completed in ${duration}ms`);
  };
};
```

### 2. **User Testing Scenarios**

```typescript
// Scenarios to test with users
const TEST_SCENARIOS = {
  basic_offline: 'Create pets while offline, then go online',
  conflict_resolution: 'Modify same pet on two devices',
  lost_pet_priority: 'Create lost pet report with poor connection',
  image_sync: 'Add photos with limited bandwidth',
  battery_optimization: 'Use app with low battery',
  storage_limits: 'Test with storage quota reached',
};
```

## Performance Optimization

### 1. **Image Handling**

```typescript
const OptimizedImageComponent = () => {
  const { saveImage } = useImageData();
  
  const handleImageUpload = async (imageUri: string) => {
    // Automatic compression and optimization
    const imageId = await saveImage(imageUri, {
      compressed: true,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    });
    
    return imageId;
  };
};
```

### 2. **Batch Operations**

```typescript
const BatchOperationsExample = () => {
  const { executeBatch } = useBatchOperations();
  
  const importMultiplePets = async (petsData: any[]) => {
    // Process multiple pets in a single transaction
    const results = await executeBatch(
      petsData.map(petData => () => createPet(petData))
    );
    
    return results;
  };
};
```

## Best Practices

### 1. **Data Management**

```typescript
// DO: Use optimistic updates for better UX
const goodExample = async () => {
  await updatePet(id, data); // Updates UI immediately
};

// DON'T: Wait for sync before updating UI
const badExample = async () => {
  await forceSync();
  await updatePet(id, data); // Poor UX
};
```

### 2. **Error Handling**

```typescript
// DO: Provide meaningful feedback
const handleError = (error: any) => {
  if (error.message.includes('storage')) {
    showMessage('Storage is full. Please free up space.');
  } else if (error.message.includes('network')) {
    showMessage('Connection issue. Your changes are saved offline.');
  } else {
    showMessage('Something went wrong. Please try again.');
  }
};

// DON'T: Show technical errors to users
const badErrorHandling = (error: any) => {
  alert(error.stack); // Don't do this
};
```

### 3. **Performance**

```typescript
// DO: Use appropriate priority levels
const createLostPetReport = async (data: any) => {
  // CRITICAL priority for lost pets
  return await lostPetService.createLostPetReport(petId, data);
};

const updatePetNotes = async (data: any) => {
  // LOW priority for non-urgent updates
  return await dataLayer.updatePet(petId, data, { priority: 'LOW' });
};
```

## Troubleshooting

### Common Issues

1. **Sync Not Working**
   ```typescript
   // Check network status
   const { networkStatus } = useNetworkStatus();
   console.log('Can sync:', networkStatus.canSync);
   ```

2. **Storage Full**
   ```typescript
   // Check storage info
   const { storage } = await getStatus();
   console.log('Storage used:', storage.quotaUsed);
   ```

3. **Conflicts Not Resolving**
   ```typescript
   // Check for pending conflicts
   const { conflicts } = useOfflineSync();
   console.log('Pending conflicts:', conflicts.length);
   ```

This implementation guide provides everything needed to integrate and customize TailTracker's offline capabilities for superior user experience.