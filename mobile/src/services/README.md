# TailTracker Error Recovery System

This document describes the comprehensive error recovery system implemented for the TailTracker mobile application. The system ensures robust operation during network outages, service disruptions, and other failure conditions.

## Overview

The error recovery system consists of several interconnected components:

1. **ErrorRecoveryService** - Central retry logic with exponential backoff
2. **OfflineQueueManager** - Persistent queue for failed operations
3. **EnhancedSupabaseClient** - Supabase wrapper with error recovery
4. **ApiClient** - HTTP client with caching and deduplication
5. **Error Boundaries** - React error boundary components
6. **ErrorMonitoringService** - Comprehensive error tracking and reporting

## Core Components

### 1. ErrorRecoveryService

**File:** `/src/services/ErrorRecoveryService.ts`

Central service providing retry logic, circuit breaker pattern, and network monitoring.

#### Key Features:
- **Exponential Backoff**: Automatic retry with increasing delays
- **Circuit Breaker**: Prevents cascade failures for unstable endpoints
- **Request Deduplication**: Prevents duplicate operations during retries
- **Network Monitoring**: Tracks connection status and reacts to changes

#### Usage:
```typescript
import { errorRecoveryService } from './ErrorRecoveryService';

// Basic retry
const result = await errorRecoveryService.executeWithRetry(async () => {
  return await apiCall();
});

// With circuit breaker
const result = await errorRecoveryService.executeWithCircuitBreaker(
  'user_profile_endpoint',
  async () => await getUserProfile()
);

// Request deduplication
const result = await errorRecoveryService.deduplicateRequest(
  'get_pets_list',
  async () => await getPets()
);
```

### 2. OfflineQueueManager

**File:** `/src/services/OfflineQueueManager.ts`

Manages a persistent queue of operations to retry when connectivity is restored.

#### Key Features:
- **Priority-based Processing**: Critical operations processed first
- **Persistent Storage**: Queue survives app restarts
- **Dependency Management**: Handle operations that depend on others
- **Automatic Processing**: Processes queue when connection is restored

#### Usage:
```typescript
import { offlineQueueManager } from './OfflineQueueManager';

// Queue critical operation
const operationId = await offlineQueueManager.enqueueAction(
  'LOST_PET_REPORT',
  reportData,
  {
    priority: 'critical',
    requiresAuthentication: true,
  }
);

// Monitor queue status
const queueStats = offlineQueueManager.getQueueStats();
console.log(`${queueStats.totalOperations} operations queued`);
```

### 3. EnhancedSupabaseClient

**File:** `/src/services/EnhancedSupabaseClient.ts`

Enhanced wrapper around Supabase client with built-in error recovery.

#### Key Features:
- **Automatic Retry**: Built-in retry for database operations
- **Session Caching**: Fallback to cached sessions when offline
- **Health Monitoring**: Continuous health checks for Supabase connectivity
- **Offline Queue Integration**: Automatically queues operations when offline

#### Usage:
```typescript
import { supabaseEnhanced } from '../../config/supabase';

// Enhanced select with retry and caching
const result = await supabaseEnhanced.select(
  'pets',
  '*',
  {
    retry: { maxAttempts: 5 },
    circuitBreaker: 'pets_table',
    offlineQueue: { priority: 'high' },
  }
);

// Enhanced insert with offline support
const result = await supabaseEnhanced.insert(
  'pets',
  petData,
  {
    offlineQueue: { priority: 'high', requiresAuth: true },
  }
);
```

### 4. ApiClient

**File:** `/src/services/ApiClient.ts`

HTTP client with caching, deduplication, and error recovery.

#### Key Features:
- **Response Caching**: Reduces API calls and provides offline data
- **Request Deduplication**: Prevents duplicate simultaneous requests
- **Automatic Retry**: Built-in retry logic for failed requests
- **Offline Queue**: Automatic queueing for write operations

#### Usage:
```typescript
import { TailTrackerAPI } from './ApiClient';

// Get pets with caching
const pets = await TailTrackerAPI.pets.getAll();

// Report lost pet with offline support
const result = await TailTrackerAPI.lostPets.report(reportData);

// Custom API call
const result = await apiClient.post('/custom-endpoint', data, {
  circuitBreaker: 'custom_endpoint',
  offlineQueue: { priority: 'medium' },
});
```

### 5. Error Boundaries

**File:** `/src/components/ErrorBoundary/`

React error boundary components for graceful error handling.

#### Components:
- **ErrorBoundary**: General-purpose error boundary
- **CriticalFlowErrorBoundary**: Enhanced boundary for critical features
- **LostPetAlertErrorBoundary**: Specific to lost pet functionality
- **AuthenticationErrorBoundary**: Handles auth-related errors

#### Usage:
```tsx
import { LostPetAlertErrorBoundary } from './ErrorBoundary/CriticalFlowErrorBoundary';

function LostPetScreen() {
  return (
    <LostPetAlertErrorBoundary>
      <LostPetReportForm />
    </LostPetAlertErrorBoundary>
  );
}
```

### 6. ErrorMonitoringService

**File:** `/src/services/ErrorMonitoringService.ts`

Comprehensive error tracking, reporting, and analytics.

#### Key Features:
- **Error Tracking**: Automatic error reporting with context
- **Breadcrumb Tracking**: User action history for debugging
- **Error Metrics**: Statistics and trends analysis
- **Offline Reporting**: Queues error reports for later transmission

#### Usage:
```typescript
import { errorMonitoring, reportError, addBreadcrumb } from './ErrorMonitoringService';

// Report an error
const errorId = await reportError(
  error,
  { component: 'PetProfile', action: 'update_pet' },
  'high',
  ['pet_management', 'database_error']
);

// Add breadcrumb for user action
addBreadcrumb({
  category: 'user_action',
  message: 'User clicked save pet button',
  level: 'info',
  data: { petId: '123' },
});

// Get error metrics
const metrics = await errorMonitoring.getErrorMetrics();
```

## Error Recovery Strategies

### 1. Network Errors

**Strategy**: Automatic retry with exponential backoff + offline queue

```typescript
// Network errors are automatically retried
const result = await errorRecoveryService.executeWithRetry(async () => {
  return await fetch('/api/pets');
});

// Write operations are queued when offline
if (!networkStatus.isConnected) {
  await offlineQueueManager.enqueueAction('CREATE_PET', petData);
}
```

### 2. Authentication Errors

**Strategy**: Token refresh + fallback to cached session

```typescript
// Automatic token refresh on 401 errors
const session = await supabaseEnhanced.refreshSession();

// Fallback to cached session when offline
const session = await supabaseEnhanced.getSession(); // Uses cache if offline
```

### 3. Server Errors (5xx)

**Strategy**: Circuit breaker + automatic retry

```typescript
// Circuit breaker prevents overwhelming failing services
const result = await errorRecoveryService.executeWithCircuitBreaker(
  'user_profile_service',
  async () => await getUserProfile()
);
```

### 4. Rate Limiting (429)

**Strategy**: Exponential backoff with jitter

```typescript
const retryConfig = {
  maxAttempts: 5,
  baseDelayMs: 2000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

const result = await errorRecoveryService.executeWithRetry(
  apiCall,
  retryConfig
);
```

## Critical Flow Protection

### Lost Pet Alerts

- **Priority**: Critical
- **Offline Support**: Full offline queueing
- **Error Boundaries**: Specialized error handling
- **Retry Strategy**: Up to 5 attempts with immediate queue fallback

### Authentication

- **Session Caching**: Local session backup
- **Token Refresh**: Automatic token renewal
- **Offline Mode**: Limited functionality without auth

### Vaccination Records

- **Local Storage**: Offline data entry
- **Sync on Connect**: Automatic upload when online
- **Conflict Resolution**: Last-write-wins strategy

## Configuration

### Default Retry Configuration

```typescript
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};
```

### Circuit Breaker Configuration

```typescript
const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeoutMs: 60000,
  monitoringPeriodMs: 300000,
};
```

### Cache Configuration

```typescript
const DEFAULT_CACHE_CONFIG = {
  enabled: true,
  ttl: 300000, // 5 minutes
  maxEntries: 100,
};
```

## Monitoring and Debugging

### Error Metrics

The system provides comprehensive error metrics:

```typescript
const metrics = await errorMonitoring.getErrorMetrics();
// Returns: totalErrors, criticalErrors, networkErrors, crashRate, etc.
```

### Queue Status

Monitor offline queue status:

```typescript
const queueStats = offlineQueueManager.getQueueStats();
// Returns: totalOperations, criticalActions, oldestActionAge, etc.
```

### Network Status

Track network connectivity:

```typescript
const networkStatus = errorRecoveryService.getNetworkStatus();
// Returns: isConnected, type, isInternetReachable
```

## Integration Guidelines

### 1. Wrap Critical Components

```tsx
import { CriticalFlowErrorBoundary } from './ErrorBoundary/CriticalFlowErrorBoundary';

function CriticalFeature() {
  return (
    <CriticalFlowErrorBoundary flowName="Pet Registration">
      <PetRegistrationForm />
    </CriticalFlowErrorBoundary>
  );
}
```

### 2. Use Enhanced APIs

```typescript
// Replace direct Supabase calls
// OLD:
const { data, error } = await supabase.from('pets').select('*');

// NEW:
const result = await supabaseEnhanced.select('pets', '*', {
  retry: true,
  offlineQueue: { priority: 'high' },
});
```

### 3. Add Error Reporting

```typescript
try {
  await performCriticalOperation();
} catch (error) {
  await reportCriticalFlowError('Pet Registration', error, {
    userId,
    petData,
  });
  throw error;
}
```

### 4. Track User Actions

```typescript
// Add breadcrumbs for important user actions
addBreadcrumb({
  category: 'user_action',
  message: 'User started pet registration',
  level: 'info',
  data: { step: 'basic_info' },
});
```

## Testing Error Recovery

### Network Simulation

```typescript
// Simulate offline mode
NetInfo.configure({
  reachabilityUrl: 'https://httpstat.us/500',
  reachabilityTest: async (response) => response.status === 200,
});
```

### Error Injection

```typescript
// Inject errors for testing
errorRecoveryService.injectError('user_profile_endpoint', new Error('Test error'));
```

### Queue Testing

```typescript
// Test offline queue
await offlineQueueManager.enqueueAction('TEST_ACTION', { data: 'test' });
const queueStats = offlineQueueManager.getQueueStats();
expect(queueStats.totalOperations).toBe(1);
```

## Performance Considerations

- **Memory Usage**: Queues and caches are limited in size
- **Storage**: Local storage is used efficiently with cleanup
- **Network**: Request deduplication reduces bandwidth usage
- **Battery**: Exponential backoff reduces unnecessary requests

## Security Notes

- **Token Storage**: Sessions are encrypted in secure storage
- **Error Data**: Sensitive data is filtered from error reports
- **Queue Encryption**: Offline queue data is encrypted
- **Rate Limiting**: Built-in protection against API abuse

## Migration Guide

### From Direct Supabase Usage

1. Replace `supabase` imports with `supabaseEnhanced`
2. Update method calls to use enhanced options
3. Add error boundaries around components
4. Implement breadcrumb tracking

### From Basic Fetch Usage

1. Replace fetch calls with `apiClient` methods
2. Configure retry and caching options
3. Add offline queue support for write operations
4. Implement proper error handling

## Troubleshooting

### Common Issues

1. **Queue Not Processing**: Check network connectivity and queue status
2. **Excessive Retries**: Verify retry configuration and circuit breaker settings
3. **Memory Issues**: Monitor cache sizes and queue lengths
4. **Token Refresh Loops**: Check authentication configuration

### Debug Tools

```typescript
// Enable debug mode
errorRecoveryService.setDebugMode(true);
offlineQueueManager.setDebugMode(true);
errorMonitoring.setDebugMode(true);
```

### Logging

All services provide comprehensive logging for debugging:

- Error recovery attempts and results
- Queue processing status
- Network status changes
- Circuit breaker state changes

This error recovery system ensures TailTracker remains functional and user-friendly even during adverse network conditions or service disruptions, with particular focus on critical features like lost pet alerts and user authentication.