# TailTracker Performance & Security Testing Protocols
## Comprehensive Non-Functional Testing Strategy

### Overview

This document establishes rigorous performance and security testing protocols for TailTracker mobile app to ensure optimal user experience, data protection, and system reliability under all conditions.

## 1. PERFORMANCE TESTING STRATEGY

### 1.1 Performance Requirements & Benchmarks

#### Core Performance Targets

| Metric | Target | Critical Threshold | Measurement Method |
|--------|--------|--------------------|-------------------|
| App Launch Time | < 2.5s | < 3.5s | Time to first meaningful paint |
| Screen Transitions | < 300ms | < 500ms | Navigation timing |
| API Response Time | < 1.5s | < 3.0s | Network request timing |
| Image Upload Time | < 15s | < 30s | File upload completion |
| GPS Location Fix | < 3s | < 8s | Location service response |
| Search/Filter Operations | < 500ms | < 1s | Query execution time |
| Offline Data Sync | < 5s | < 10s | Background sync completion |

#### Resource Usage Limits

| Resource | Normal Usage | Warning Threshold | Critical Threshold |
|----------|--------------|------------------|-------------------|
| Memory (RAM) | < 100MB | 150MB | 200MB |
| CPU Usage | < 25% | 50% | 70% |
| Battery Drain | < 3%/hour | 5%/hour | 8%/hour |
| Network Usage | < 5MB/hour | 10MB/hour | 15MB/hour |
| Storage Growth | < 1MB/day | 5MB/day | 10MB/day |

### 1.2 Performance Testing Implementation

#### Automated Performance Testing

```typescript
// tests/performance/app-performance.test.ts
describe('App Performance Tests', () => {
  beforeEach(async () => {
    await device.relaunchApp();
    await performance.startMeasuring();
  });

  afterEach(async () => {
    const metrics = await performance.stopMeasuring();
    await performance.saveMetrics(metrics);
  });

  describe('App Launch Performance', () => {
    it('should launch within 2.5 seconds', async () => {
      const startTime = performance.now();
      await device.launchApp();
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(4000);
      const launchTime = performance.now() - startTime;
      
      expect(launchTime).toBeLessThan(2500);
      performance.record('app_launch_time', launchTime);
    });

    it('should show splash screen immediately', async () => {
      const startTime = performance.now();
      await device.launchApp();
      await expect(element(by.id('splash-screen'))).toBeVisible();
      const splashTime = performance.now() - startTime;
      
      expect(splashTime).toBeLessThan(200);
    });
  });

  describe('Navigation Performance', () => {
    const screens = [
      'pets-tab', 'health-tab', 'family-tab', 'settings-tab'
    ];

    screens.forEach(screen => {
      it(`should navigate to ${screen} within 300ms`, async () => {
        await loginAsTestUser();
        
        const startTime = performance.now();
        await element(by.id(screen)).tap();
        await waitFor(element(by.id(`${screen}-content`)))
          .toBeVisible()
          .withTimeout(1000);
        const navTime = performance.now() - startTime;
        
        expect(navTime).toBeLessThan(300);
        performance.record(`navigation_${screen}`, navTime);
      });
    });
  });

  describe('Data Operations Performance', () => {
    it('should load pet profiles within 1 second', async () => {
      await loginWithTestPets();
      
      const startTime = performance.now();
      await element(by.id('pets-tab')).tap();
      await waitFor(element(by.id('pets-loaded')))
        .toBeVisible()
        .withTimeout(2000);
      const loadTime = performance.now() - startTime;
      
      expect(loadTime).toBeLessThan(1000);
      performance.record('pets_load_time', loadTime);
    });

    it('should create pet profile within 3 seconds', async () => {
      await navigateToPetCreation();
      
      const startTime = performance.now();
      await fillPetForm({
        name: 'Performance Test Pet',
        type: 'dog',
        breed: 'Test Breed'
      });
      await element(by.id('save-pet-btn')).tap();
      await waitFor(element(by.id('pet-saved-success')))
        .toBeVisible()
        .withTimeout(5000);
      const saveTime = performance.now() - startTime;
      
      expect(saveTime).toBeLessThan(3000);
      performance.record('pet_creation_time', saveTime);
    });
  });
});
```

#### Memory Usage Monitoring

```typescript
// tests/performance/memory-usage.test.ts
describe('Memory Usage Tests', () => {
  it('should maintain memory usage under 100MB during normal operation', async () => {
    await device.launchApp();
    await loginAsTestUser();
    
    const initialMemory = await device.getMemoryUsage();
    
    // Simulate normal app usage
    await navigateThroughAllScreens();
    await createAndViewMultiplePets();
    await uploadAndViewPhotos();
    
    const finalMemory = await device.getMemoryUsage();
    
    expect(finalMemory).toBeLessThan(100 * 1024 * 1024); // 100MB
    expect(finalMemory - initialMemory).toBeLessThan(20 * 1024 * 1024); // 20MB increase max
  });

  it('should release memory after intensive operations', async () => {
    await device.launchApp();
    await loginAsTestUser();
    
    const baselineMemory = await device.getMemoryUsage();
    
    // Intensive operations
    for (let i = 0; i < 50; i++) {
      await uploadLargeImage();
      await processImageOperations();
    }
    
    const peakMemory = await device.getMemoryUsage();
    
    // Trigger memory cleanup
    await device.sendToBackground();
    await device.launchApp({ newInstance: false });
    
    const cleanupMemory = await device.getMemoryUsage();
    const memoryReduction = peakMemory - cleanupMemory;
    
    expect(memoryReduction).toBeGreaterThan(30 * 1024 * 1024); // Should free 30MB+
    expect(cleanupMemory).toBeLessThan(baselineMemory * 1.5); // Within 50% of baseline
  });
});
```

#### Network Performance Testing

```typescript
// tests/performance/network-performance.test.ts
describe('Network Performance Tests', () => {
  beforeEach(async () => {
    await device.relaunchApp();
  });

  it('should handle slow network conditions gracefully', async () => {
    await device.setNetworkConditions({
      speed: 'slow_3g',
      downlink: 0.5,
      uplink: 0.5,
      latency: 2000
    });
    
    await loginAsTestUser();
    
    const startTime = performance.now();
    await element(by.id('pets-tab')).tap();
    await waitFor(element(by.id('loading-indicator')))
      .toBeVisible()
      .withTimeout(1000);
    
    // Verify loading indicator appears quickly
    expect(performance.now() - startTime).toBeLessThan(500);
    
    await waitFor(element(by.id('pets-loaded')))
      .toBeVisible()
      .withTimeout(15000);
    
    await device.resetNetworkConditions();
  });

  it('should optimize image loading for mobile networks', async () => {
    await device.setNetworkConditions({ speed: 'regular_4g' });
    
    await loginWithPetPhotos();
    await element(by.id('pets-tab')).tap();
    
    // Verify progressive image loading
    await waitFor(element(by.id('image-placeholder')))
      .toBeVisible()
      .withTimeout(1000);
    
    await waitFor(element(by.id('image-loaded')))
      .toBeVisible()
      .withTimeout(5000);
    
    const networkUsage = await device.getNetworkUsage();
    expect(networkUsage.bytesReceived).toBeLessThan(2 * 1024 * 1024); // 2MB max
  });
});
```

#### Battery Usage Testing

```typescript
// tests/performance/battery-usage.test.ts
describe('Battery Usage Tests', () => {
  it('should maintain reasonable battery consumption', async () => {
    const initialBattery = await device.getBatteryLevel();
    const testDuration = 30 * 60 * 1000; // 30 minutes
    const startTime = Date.now();
    
    await device.launchApp();
    await loginAsTestUser();
    
    // Simulate normal usage patterns
    while (Date.now() - startTime < testDuration) {
      await simulateUserInteraction();
      await device.sleep(5000);
    }
    
    const finalBattery = await device.getBatteryLevel();
    const batteryDrain = initialBattery - finalBattery;
    const drainPerHour = (batteryDrain / testDuration) * (60 * 60 * 1000);
    
    expect(drainPerHour).toBeLessThan(0.03); // Less than 3% per hour
  });
});
```

### 1.3 Performance Monitoring in Production

#### Real-Time Performance Monitoring

```typescript
// src/services/performance/PerformanceMonitor.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public measureAppLaunch(): void {
    const launchTime = performance.now();
    this.recordMetric('app_launch', launchTime);
  }

  public measureScreenTransition(screenName: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(`screen_transition_${screenName}`, duration);
    };
  }

  public measureAPICall(endpoint: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(`api_call_${endpoint}`, duration);
    };
  }

  public monitorMemoryUsage(): void {
    if (Platform.OS === 'android') {
      // Monitor Android memory
      this.monitorAndroidMemory();
    } else {
      // Monitor iOS memory
      this.monitoriOSMemory();
    }
  }

  private recordMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
    };
    
    this.metrics.push(metric);
    
    // Send critical performance issues immediately
    if (this.isCriticalPerformanceIssue(metric)) {
      this.reportCriticalIssue(metric);
    }
    
    // Batch upload metrics
    if (this.metrics.length >= 50) {
      this.uploadMetrics();
    }
  }

  private isCriticalPerformanceIssue(metric: PerformanceMetric): boolean {
    const thresholds = {
      app_launch: 3500,
      screen_transition: 500,
      api_call: 3000,
    };
    
    return metric.value > (thresholds[metric.name] || Infinity);
  }
}
```

## 2. SECURITY TESTING STRATEGY

### 2.1 Security Testing Framework

#### Automated Security Testing

```typescript
// tests/security/security-audit.test.ts
describe('Security Audit Tests', () => {
  describe('Data Encryption', () => {
    it('should encrypt sensitive data at rest', async () => {
      const sensitiveData = {
        email: 'user@example.com',
        phone: '+1234567890',
        location: { lat: 37.7749, lng: -122.4194 }
      };
      
      await SecureStorage.setItem('user_data', JSON.stringify(sensitiveData));
      const storedData = await AsyncStorage.getItem('user_data');
      
      // Data should be encrypted (not readable as plain text)
      expect(storedData).not.toContain('user@example.com');
      expect(storedData).not.toContain('+1234567890');
      
      // Should be retrievable and decryptable
      const retrievedData = await SecureStorage.getItem('user_data');
      expect(JSON.parse(retrievedData)).toEqual(sensitiveData);
    });

    it('should encrypt data in transit', async () => {
      const networkInterceptor = new NetworkInterceptor();
      networkInterceptor.start();
      
      await AuthService.login('test@example.com', 'password123');
      
      const requests = networkInterceptor.getRequests();
      const authRequest = requests.find(r => r.url.includes('/auth'));
      
      // Verify HTTPS usage
      expect(authRequest.url).toMatch(/^https:\/\//);
      
      // Verify no plain text passwords in request
      expect(authRequest.body).not.toContain('password123');
      
      networkInterceptor.stop();
    });
  });

  describe('Authentication Security', () => {
    it('should implement secure session management', async () => {
      await AuthService.login('test@example.com', 'password123');
      
      // Session token should be secure
      const sessionToken = await SecureStorage.getItem('session_token');
      expect(sessionToken).toBeTruthy();
      expect(sessionToken.length).toBeGreaterThan(32);
      
      // Token should have expiration
      const tokenData = jwt.decode(sessionToken);
      expect(tokenData.exp).toBeTruthy();
      expect(tokenData.exp * 1000).toBeGreaterThan(Date.now());
    });

    it('should implement proper logout and token cleanup', async () => {
      await AuthService.login('test@example.com', 'password123');
      expect(await SecureStorage.getItem('session_token')).toBeTruthy();
      
      await AuthService.logout();
      
      // All session data should be cleared
      expect(await SecureStorage.getItem('session_token')).toBeNull();
      expect(await SecureStorage.getItem('refresh_token')).toBeNull();
      expect(await AsyncStorage.getItem('user_preferences')).toBeNull();
    });

    it('should handle biometric authentication securely', async () => {
      if (!await LocalAuthentication.hasHardwareAsync()) return;
      
      await BiometricAuth.enrollUser('test@example.com');
      
      // Biometric data should not be stored locally
      const biometricKey = await SecureStorage.getItem('biometric_key');
      expect(biometricKey).toBeNull();
      
      // Should use secure enclave/keystore
      const authResult = await BiometricAuth.authenticate();
      expect(authResult.secureLevel).toBe('SECURE_HARDWARE');
    });
  });

  describe('API Security', () => {
    it('should validate API requests properly', async () => {
      const maliciousPayload = {
        name: '<script>alert("xss")</script>',
        breed: "'; DROP TABLE pets; --",
        description: '{{7*7}}'
      };
      
      try {
        await PetService.createPet(maliciousPayload);
      } catch (error) {
        expect(error.message).toContain('Invalid input');
      }
      
      // Verify no XSS or injection vulnerabilities
      const pets = await PetService.getAllPets();
      const testPet = pets.find(p => p.name.includes('script'));
      expect(testPet).toBeUndefined();
    });

    it('should implement proper rate limiting', async () => {
      const requests = [];
      
      // Send 100 requests rapidly
      for (let i = 0; i < 100; i++) {
        requests.push(APIClient.get('/api/pets'));
      }
      
      const results = await Promise.allSettled(requests);
      const rateLimitedRequests = results.filter(
        r => r.status === 'rejected' && r.reason.status === 429
      );
      
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Payment Security', () => {
    it('should handle payment data securely', async () => {
      const paymentFlow = new PaymentFlow();
      
      // Payment should use secure payment processor
      const paymentMethod = await paymentFlow.initializePayment('premium_monthly');
      expect(paymentMethod.processor).toMatch(/^(stripe|apple|google)$/);
      
      // No payment details should be stored locally
      const storedData = await AsyncStorage.getAllKeys();
      const paymentKeys = storedData.filter(key => 
        key.includes('card') || key.includes('payment') || key.includes('billing')
      );
      expect(paymentKeys).toHaveLength(0);
    });

    it('should validate purchase receipts properly', async () => {
      const mockReceipt = {
        productId: 'premium_monthly',
        transactionId: 'fake_transaction_123',
        purchaseDate: Date.now()
      };
      
      const validation = await PaymentService.validateReceipt(mockReceipt);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Invalid receipt');
    });
  });

  describe('Location Privacy', () => {
    it('should handle location data with proper privacy controls', async () => {
      await LocationService.requestPermissions();
      const location = await LocationService.getCurrentLocation();
      
      // Location should be stored securely
      const storedLocation = await SecureStorage.getItem('user_location');
      expect(storedLocation).toBeTruthy();
      
      // Should not store location in plain text
      const plainTextData = await AsyncStorage.getAllKeys();
      const locationKeys = plainTextData.filter(key => 
        key.includes('location') || key.includes('gps')
      );
      expect(locationKeys).toHaveLength(0);
    });

    it('should allow users to control location sharing', async () => {
      await LocationService.setLocationSharing(false);
      
      const sharedLocation = await LocationService.getShareableLocation();
      expect(sharedLocation).toBeNull();
      
      // Verify no location data in lost pet alerts when disabled
      const alert = await LostPetService.createAlert({
        petId: 'test-pet-id',
        description: 'Test alert'
      });
      
      expect(alert.location).toBeNull();
    });
  });

  describe('Data Protection', () => {
    it('should implement proper data sanitization', async () => {
      const userInput = {
        name: '<img src="x" onerror="alert(1)">',
        description: '{{constructor.constructor("alert(1)")()}}'
      };
      
      const sanitized = DataSanitizer.sanitize(userInput);
      
      expect(sanitized.name).not.toContain('<img');
      expect(sanitized.name).not.toContain('onerror');
      expect(sanitized.description).not.toContain('{{');
      expect(sanitized.description).not.toContain('constructor');
    });

    it('should handle GDPR data export requests', async () => {
      await AuthService.login('test@example.com', 'password123');
      
      const exportData = await DataExportService.exportUserData();
      
      // Should include all user data
      expect(exportData.profile).toBeTruthy();
      expect(exportData.pets).toBeTruthy();
      expect(exportData.healthRecords).toBeTruthy();
      expect(exportData.familyData).toBeTruthy();
      
      // Should not include sensitive system data
      expect(exportData.authTokens).toBeUndefined();
      expect(exportData.paymentMethods).toBeUndefined();
      expect(exportData.systemLogs).toBeUndefined();
    });

    it('should handle data deletion requests', async () => {
      const userId = 'test-user-id';
      await DataDeletionService.deleteUserData(userId);
      
      // Verify all user data is deleted
      const user = await UserService.getUser(userId);
      expect(user).toBeNull();
      
      const pets = await PetService.getPetsByUserId(userId);
      expect(pets).toHaveLength(0);
      
      const healthRecords = await HealthService.getRecordsByUserId(userId);
      expect(healthRecords).toHaveLength(0);
    });
  });
});
```

### 2.2 Penetration Testing Checklist

#### Network Security Testing

**SSL/TLS Configuration:**
- [ ] TLS 1.3 or higher enforced
- [ ] Certificate pinning implemented
- [ ] Perfect Forward Secrecy enabled
- [ ] Weak cipher suites disabled
- [ ] HSTS headers configured

**API Security:**
- [ ] Authentication required for all endpoints
- [ ] Authorization checks implemented
- [ ] Rate limiting configured
- [ ] Input validation on all parameters
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

#### Mobile Application Security

**Code Protection:**
- [ ] Code obfuscation in production builds
- [ ] Anti-debugging measures implemented
- [ ] Root/jailbreak detection
- [ ] Runtime application self-protection (RASP)
- [ ] Binary packing/encryption

**Data Protection:**
- [ ] Sensitive data encrypted at rest
- [ ] Secure key management
- [ ] Proper session management
- [ ] Secure backup exclusion
- [ ] Clipboard protection for sensitive data

### 2.3 Security Monitoring

#### Runtime Application Self-Protection (RASP)

```typescript
// src/security/SecurityMonitor.ts
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private securityEvents: SecurityEvent[] = [];

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  public initializeSecurityMonitoring(): void {
    this.detectRootedDevice();
    this.monitorNetworkCertificates();
    this.setupDebuggingDetection();
    this.monitorKeyboardInput();
  }

  private detectRootedDevice(): void {
    const isRooted = RootDetection.isDeviceRooted();
    if (isRooted) {
      this.reportSecurityEvent({
        type: 'ROOTED_DEVICE_DETECTED',
        severity: 'HIGH',
        timestamp: Date.now(),
        details: 'Application running on rooted/jailbroken device'
      });
      
      // Consider limiting functionality or blocking access
      this.handleRootedDevice();
    }
  }

  private monitorNetworkCertificates(): void {
    NetworkSecurity.onCertificateValidationFailure((error) => {
      this.reportSecurityEvent({
        type: 'CERTIFICATE_VALIDATION_FAILURE',
        severity: 'CRITICAL',
        timestamp: Date.now(),
        details: `Certificate validation failed: ${error.message}`
      });
    });
  }

  private setupDebuggingDetection(): void {
    if (DebuggingDetection.isDebuggerAttached()) {
      this.reportSecurityEvent({
        type: 'DEBUGGER_DETECTED',
        severity: 'HIGH',
        timestamp: Date.now(),
        details: 'Debugger attachment detected'
      });
    }
  }

  private reportSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Immediate reporting for critical events
    if (event.severity === 'CRITICAL') {
      this.sendSecurityAlert(event);
    }
    
    // Batch upload for other events
    if (this.securityEvents.length >= 10) {
      this.uploadSecurityEvents();
    }
  }
}
```

### 2.4 Security Testing Automation

#### Continuous Security Testing

```yaml
# .github/workflows/security-testing.yml
name: Security Testing

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * 0' # Weekly security scan

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk vulnerability scan
        uses: snyk/actions/node@master
        with:
          args: --severity-threshold=medium
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  code-security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run CodeQL Analysis
        uses: github/codeql-action/init@v3
        with:
          languages: typescript, javascript
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

  mobile-security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Android APK
        run: |
          npm install
          npm run build:android:release
      - name: Run MobSF Security Scan
        run: |
          docker run -it --rm -p 8000:8000 \
            -v $(pwd)/android/app/build/outputs/apk/release:/app \
            opensecurity/mobsf:latest
```

## 3. LOAD AND STRESS TESTING

### 3.1 Backend Load Testing

```typescript
// tests/load/api-load-test.ts
describe('API Load Testing', () => {
  it('should handle concurrent user registrations', async () => {
    const concurrentUsers = 100;
    const registrationPromises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      registrationPromises.push(
        AuthService.register(`user${i}@example.com`, 'password123')
      );
    }
    
    const results = await Promise.allSettled(registrationPromises);
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    
    expect(successful.length).toBeGreaterThan(concurrentUsers * 0.95); // 95% success rate
    expect(failed.length).toBeLessThan(concurrentUsers * 0.05);
  });

  it('should handle high-frequency lost pet alerts', async () => {
    const alertsPerSecond = 50;
    const testDuration = 10000; // 10 seconds
    const totalAlerts = (alertsPerSecond * testDuration) / 1000;
    
    const startTime = Date.now();
    const alertPromises = [];
    
    while (Date.now() - startTime < testDuration) {
      alertPromises.push(
        LostPetService.createAlert({
          petId: `test-pet-${Math.random()}`,
          location: generateRandomLocation(),
          description: 'Load test alert'
        })
      );
      
      if (alertPromises.length % alertsPerSecond === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const results = await Promise.allSettled(alertPromises);
    const successRate = results.filter(r => r.status === 'fulfilled').length / results.length;
    
    expect(successRate).toBeGreaterThan(0.9); // 90% success rate under load
  });
});
```

### 3.2 Database Performance Testing

```sql
-- Database performance benchmarks
-- Execute these queries to validate database performance under load

-- Test concurrent pet creation
SELECT 
  COUNT(*) as total_pets,
  AVG(EXTRACT(EPOCH FROM (created_at - lag(created_at) OVER (ORDER BY created_at)))) as avg_creation_interval
FROM pets 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Test location query performance for lost pet alerts
EXPLAIN ANALYZE
SELECT p.*, u.email, u.phone
FROM pets p
JOIN users u ON p.owner_id = u.id
WHERE ST_DWithin(
  ST_MakePoint(p.last_known_longitude, p.last_known_latitude)::geography,
  ST_MakePoint(-122.4194, 37.7749)::geography,
  5000 -- 5km radius
)
AND p.status = 'lost'
ORDER BY p.last_seen_at DESC;

-- Test family data synchronization performance
EXPLAIN ANALYZE
SELECT 
  f.id as family_id,
  f.name as family_name,
  p.id as pet_id,
  p.name as pet_name,
  h.id as health_record_id,
  h.type as record_type
FROM families f
JOIN family_members fm ON f.id = fm.family_id
JOIN pets p ON f.id = p.family_id
LEFT JOIN health_records h ON p.id = h.pet_id
WHERE fm.user_id = 'test-user-id'
ORDER BY p.name, h.created_at DESC;
```

## 4. PERFORMANCE & SECURITY DASHBOARDS

### 4.1 Real-Time Monitoring Dashboard

**Key Metrics to Monitor:**
- App crash rate and ANR rate
- API response times (95th percentile)
- Memory usage patterns
- Battery consumption trends
- Network usage optimization
- Security incident frequency
- Authentication failure rates
- Payment processing success rates

### 4.2 Alert Thresholds

**Critical Alerts:**
- App crash rate > 0.1%
- API response time > 5 seconds
- Memory usage > 200MB
- Security incidents detected
- Payment failure rate > 2%

**Warning Alerts:**
- App launch time > 3 seconds
- Screen transition > 500ms
- Memory usage > 150MB
- Unusual authentication patterns
- Performance degradation trends

This comprehensive performance and security testing strategy ensures TailTracker maintains optimal performance and robust security posture across all usage scenarios and threat vectors.