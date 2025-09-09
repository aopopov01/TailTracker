# TailTracker Unified Data Sync System

## Overview

The TailTracker Data Sync System ensures users never have to enter the same data twice by automatically synchronizing common fields across all database tables. When a user updates their profile, pet information, or veterinarian details, the changes propagate throughout the entire system automatically.

## Key Features

- ✅ **Zero Duplicate Data Entry** - Enter once, sync everywhere
- ✅ **Real-time Synchronization** - Changes sync instantly via triggers
- ✅ **Bidirectional Sync** - Data flows both ways (e.g., weight updates)
- ✅ **Conflict Resolution** - Smart handling of concurrent updates
- ✅ **Offline Queue** - Syncs when connection is restored
- ✅ **Progress Tracking** - Visual feedback for sync operations
- ✅ **Error Recovery** - Automatic retry with exponential backoff

## Architecture

```
┌─────────────────────────────────────────┐
│           DATABASE LAYER                │
│  ┌─────────────────────────────────────┐│
│  │        Automatic Triggers           ││
│  │  • User Profile → All Tables       ││
│  │  • Pet Data → Health Records       ││
│  │  • Vet Info → All References      ││
│  │  • Weight → Bidirectional Sync     ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│        APPLICATION LAYER                │
│  ┌─────────────────────────────────────┐│
│  │       DataSyncService              ││
│  │  • Real-time subscriptions         ││
│  │  • Offline sync queue              ││
│  │  • Progress tracking               ││
│  │  • Error handling                  ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│              UI LAYER                   │
│  ┌─────────────────────────────────────┐│
│  │        React Hooks                 ││
│  │  • useDataSync                     ││
│  │  • useAutoUserProfileSync          ││
│  │  • useSyncNotifications            ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## Database Implementation

### 1. Apply Migration

```sql
-- Apply the unified sync migration
\i supabase/migrations/20250107000001_unified_data_sync_system.sql
```

### 2. Sync Functions Available

```sql
-- Sync user profile across all tables
SELECT sync_all_user_data('user-auth-id');

-- Sync pet data to related tables
SELECT sync_all_pet_data('pet-uuid');

-- Sync veterinarian information
SELECT sync_all_veterinarian_data('vet-uuid');

-- Comprehensive sync for all user data
SELECT sync_all_user_data_comprehensive('user-auth-id');
```

### 3. Automatic Triggers

The system includes automatic triggers that fire when data changes:

- **User Profile Changes** → Updates emergency contacts, lost pets, veterinarian records
- **Pet Weight Updates** → Syncs to health records and measurements
- **Veterinarian Changes** → Updates all health records and events
- **Contact Info Changes** → Propagates across all relevant tables

## Application Integration

### 1. Import the Service

```typescript
import { dataSyncService } from '@/services/DataSyncService';
import { useDataSync } from '@/hooks/useDataSync';
```

### 2. Basic Usage in Components

```typescript
import React from 'react';
import { useDataSync, useAutoUserProfileSync } from '@/hooks/useDataSync';

export const UserProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const { syncStatus, queueUserProfileSync } = useDataSync();
  
  // Auto-sync when user data changes
  useAutoUserProfileSync(user?.id);

  const handleSaveProfile = async (profileData: UserProfile) => {
    // Save profile data
    await updateUserProfile(profileData);
    
    // Manually trigger sync if needed
    if (user?.id) {
      queueUserProfileSync(user.id);
    }
  };

  return (
    <View>
      <Text>Profile Status: {syncStatus.inProgress ? 'Syncing...' : 'Up to date'}</Text>
      {/* Your profile form */}
    </View>
  );
};
```

### 3. Pet Management with Auto-sync

```typescript
import { useAutoPetSync } from '@/hooks/useDataSync';

export const PetProfileScreen: React.FC<{ petId: string }> = ({ petId }) => {
  // Automatically sync pet data when it changes
  useAutoPetSync(petId);

  const handleUpdateWeight = async (newWeight: number) => {
    // Update pet weight - this will automatically sync to:
    // - health_records table
    // - pet_measurements table
    await updatePet(petId, { weight_kg: newWeight });
  };

  return (
    <View>
      {/* Pet weight form */}
    </View>
  );
};
```

### 4. Display Sync Status

```typescript
import { SyncStatusIndicator } from '@/components/Sync/SyncStatusIndicator';

export const MainScreen: React.FC = () => {
  return (
    <View>
      <Header>
        <SyncStatusIndicator variant="badge" />
      </Header>
      {/* Your main content */}
    </View>
  );
};
```

### 5. Manual Sync Operations

```typescript
import { useForceSync, useBatchSync } from '@/hooks/useDataSync';

export const SyncSettingsScreen: React.FC = () => {
  const { forceSync, loading } = useForceSync();
  const { executeBatchSync, batchProgress } = useBatchSync();

  const handleForceUserSync = async () => {
    try {
      await forceSync('user_profile', user.id);
      alert('User profile synced successfully!');
    } catch (error) {
      alert('Sync failed: ' + error.message);
    }
  };

  const handleBatchSync = async () => {
    const operations = [
      { type: 'user_profile', targetId: user.id, label: 'User Profile' },
      { type: 'pet_data', targetId: pet.id, label: 'Pet Data' },
    ];
    
    await executeBatchSync(operations);
  };

  return (
    <View>
      <Button onPress={handleForceUserSync} disabled={loading}>
        Force User Sync
      </Button>
      <Button onPress={handleBatchSync}>
        Batch Sync All
      </Button>
      {batchProgress && (
        <Text>Progress: {batchProgress.completed}/{batchProgress.total}</Text>
      )}
    </View>
  );
};
```

## Real-time Sync

### 1. Automatic Setup

The sync service automatically sets up real-time subscriptions:

```typescript
// This happens automatically when DataSyncService initializes
const userChannel = supabase
  .channel(`user_sync_${user.id}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'users'
  }, handleUserProfileChange)
  .subscribe();
```

### 2. Custom Real-time Handlers

```typescript
import { dataSyncService } from '@/services/DataSyncService';

// Listen for sync progress
dataSyncService.addSyncProgressListener((progress) => {
  console.log(`Sync progress: ${progress.percentage}%`);
  console.log(`Current: ${progress.current}`);
});

// Check sync status
const status = dataSyncService.getSyncStatus();
console.log('Sync in progress:', status.inProgress);
console.log('Queue size:', status.queueSize);
console.log('Failed operations:', status.failedOperations);
```

## Sync Scenarios

### 1. User Updates Profile

```typescript
// User updates their phone number
await supabase
  .from('users')
  .update({ phone: '+1234567890' })
  .eq('auth_user_id', user.id);

// Automatically syncs to:
// - lost_pets.contact_phone
// - pets.emergency_contact_phone (if user is emergency contact)
// - veterinarians.phone (if user is a vet)
```

### 2. Pet Weight Update

```typescript
// User updates pet weight
await supabase
  .from('pets')
  .update({ weight_kg: 15.5 })
  .eq('id', petId);

// Automatically syncs to:
// - health_records.weight (latest records)
// - pet_measurements (new measurement entry)
```

### 3. Veterinarian Information Update

```typescript
// User updates vet clinic name
await supabase
  .from('veterinarians')
  .update({ clinic_name: 'New Clinic Name' })
  .eq('id', vetId);

// Automatically syncs to:
// - health_records.clinic_name (all records from this vet)
// - user_events.veterinarian_name (all events with this vet)
```

## Error Handling

### 1. Automatic Retry

```typescript
// Failed syncs are automatically retried with exponential backoff
const MAX_RETRY_COUNT = 3;
const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
```

### 2. Manual Error Recovery

```typescript
import { useDataSync } from '@/hooks/useDataSync';

export const SyncErrorHandler: React.FC = () => {
  const { syncStatus, retryFailedSyncs, clearFailedSyncs } = useDataSync();

  if (syncStatus.failedOperations.length > 0) {
    return (
      <View style={styles.errorContainer}>
        <Text>{syncStatus.failedOperations.length} sync operations failed</Text>
        <Button onPress={retryFailedSyncs}>Retry Failed</Button>
        <Button onPress={clearFailedSyncs}>Clear Failed</Button>
      </View>
    );
  }

  return null;
};
```

### 3. Conflict Resolution

```typescript
// The system handles conflicts by using "last write wins" strategy
// with timestamp-based resolution for concurrent updates
```

## Performance Optimization

### 1. Debouncing

```typescript
// Sync operations are debounced to prevent excessive triggers
const SYNC_DEBOUNCE_MS = 2000; // 2 seconds
```

### 2. Batch Operations

```typescript
// Use batch sync for multiple operations
const { executeBatchSync } = useBatchSync();

await executeBatchSync([
  { type: 'user_profile', targetId: userId, label: 'Profile' },
  { type: 'pet_data', targetId: petId, label: 'Pet' },
  { type: 'veterinarian', targetId: vetId, label: 'Vet' }
]);
```

### 3. Selective Sync

```typescript
// Only sync specific data types when needed
dataSyncService.queuePetDataSync(petId); // Only pet data
dataSyncService.queueUserProfileSync(userId); // Only user profile
dataSyncService.queueFullSync(); // Everything
```

## Testing

### 1. Run Sync Tests

```typescript
import { DataSyncTest } from '@/tests/DataSyncTest';

// Use the test component to validate sync functionality
<DataSyncTest />
```

### 2. Manual Testing Checklist

- [ ] Update user profile → Check emergency contacts sync
- [ ] Update pet weight → Check measurements table
- [ ] Update vet info → Check health records
- [ ] Test offline sync → Queue operations work
- [ ] Test error recovery → Failed syncs retry
- [ ] Test real-time → Changes propagate immediately

## Monitoring and Debugging

### 1. Sync History

```typescript
import { SyncHistoryModal } from '@/components/Sync/SyncHistoryModal';

// View detailed sync logs
<SyncHistoryModal visible={showHistory} onClose={closeHistory} />
```

### 2. Database Logs

```sql
-- Check sync operation logs
SELECT * FROM data_sync_log 
WHERE user_id = 'user-id' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for failed syncs
SELECT * FROM data_sync_log 
WHERE sync_status = 'failed' 
ORDER BY created_at DESC;
```

### 3. Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('sync_debug', 'true');

// Check sync service status
console.log(dataSyncService.getSyncStatus());
```

## Best Practices

### 1. Always Use Auto-sync Hooks

```typescript
// ✅ Good - Auto-sync when data changes
const EditPetScreen = ({ petId }) => {
  useAutoPetSync(petId);
  // Component logic
};

// ❌ Avoid - Manual sync every time
const EditPetScreen = ({ petId }) => {
  const { queuePetDataSync } = useDataSync();
  
  useEffect(() => {
    queuePetDataSync(petId); // Manual and error-prone
  }, [petId]);
};
```

### 2. Handle Sync Status in UI

```typescript
// ✅ Show sync status to users
const { syncStatus, syncProgress } = useDataSync();

return (
  <View>
    {syncStatus.inProgress && <SyncProgressBar progress={syncProgress} />}
    {syncStatus.failedOperations.length > 0 && <SyncErrorAlert />}
  </View>
);
```

### 3. Use Proper Error Boundaries

```typescript
// ✅ Wrap sync-dependent components in error boundaries
<ErrorBoundary fallback={<SyncErrorFallback />}>
  <PetProfileScreen />
</ErrorBoundary>
```

### 4. Test Sync Operations

```typescript
// ✅ Always test critical sync paths
await testUserProfileSync();
await testPetDataSync();
await testVeterinarianSync();
```

## Troubleshooting

### Common Issues

1. **Sync Not Triggering**
   - Check if user is authenticated
   - Verify triggers are installed in database
   - Check network connectivity

2. **Sync Failing**
   - Check sync error logs
   - Verify RLS policies allow access
   - Check for constraint violations

3. **Performance Issues**
   - Reduce sync debounce time
   - Use selective sync instead of full sync
   - Check database indexes

### Debug Commands

```typescript
// Check sync service status
console.log(dataSyncService.getSyncStatus());

// View sync history
const history = await dataSyncService.getSyncHistory(10);

// Force sync with logging
await dataSyncService.forceSync('user_profile', userId);

// Clear all failed syncs
dataSyncService.clearFailedSyncs();
```

## Summary

The TailTracker Unified Data Sync System eliminates duplicate data entry by automatically synchronizing information across all database tables. Users enter data once, and it propagates throughout the entire system in real-time, creating a seamless and consistent user experience.

**Key Benefits:**
- 🚀 **Improved UX** - No duplicate data entry
- ⚡ **Real-time Updates** - Instant synchronization
- 🔄 **Reliable Sync** - Error recovery and retry logic
- 📊 **Transparent Progress** - Visual feedback for users
- 🛡️ **Conflict Resolution** - Smart handling of concurrent edits

The system is designed to work automatically with minimal developer intervention while providing comprehensive monitoring and debugging tools for when manual control is needed.