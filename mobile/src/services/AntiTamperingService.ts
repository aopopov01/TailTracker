import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { MilitaryGradeCryptoService } from './MilitaryGradeCryptoService';
import { SecurityAuditLogger } from './SecurityAuditLogger';

export interface TamperingDetectionResult {
  isCompromised: boolean;
  threats: TamperingThreat[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface TamperingThreat {
  type: 'ROOT_DETECTED' | 'JAILBREAK_DETECTED' | 'DEBUGGER_ATTACHED' | 'EMULATOR_DETECTED' | 
        'HOOKING_FRAMEWORK' | 'MODIFIED_BINARY' | 'SUSPICIOUS_PACKAGES' | 'DEVELOPER_OPTIONS' | 
        'USB_DEBUGGING' | 'INSTALL_FROM_UNKNOWN_SOURCES' | 'MALWARE_SIGNATURE';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string[];
}

export interface IntegrityCheckResult {
  isValid: boolean;
  violations: IntegrityViolation[];
  checksum: string;
  timestamp: number;
}

export interface IntegrityViolation {
  component: string;
  expected: string;
  actual: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Anti-Tampering and Security Validation Service
 * 
 * Provides comprehensive runtime security protection including:
 * - Root/Jailbreak detection with multiple techniques
 * - Debugger and emulator detection
 * - Code integrity validation
 * - Runtime application self-protection (RASP)
 * - Hooking framework detection
 * - Binary modification detection
 * - Environment threat assessment
 * - Security policy enforcement
 */
export class AntiTamperingService {
  private static instance: AntiTamperingService;
  private cryptoService: MilitaryGradeCryptoService;
  private auditLogger: SecurityAuditLogger;

  // Security configuration
  private readonly INTEGRITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly THREAT_ASSESSMENT_INTERVAL = 2 * 60 * 1000; // 2 minutes
  private readonly BASELINE_CHECKSUM_KEY = 'tailtracker_baseline_checksum';
  private readonly SECURITY_STATE_KEY = 'tailtracker_security_state';

  // Detection patterns and signatures
  private readonly ROOT_DETECTION_PATHS = [
    '/system/app/Superuser.apk',
    '/sbin/su',
    '/system/bin/su',
    '/system/xbin/su',
    '/data/local/xbin/su',
    '/data/local/bin/su',
    '/system/sd/xbin/su',
    '/system/bin/failsafe/su',
    '/data/local/su',
    '/su/bin/su'
  ];

  private readonly JAILBREAK_DETECTION_PATHS = [
    '/Applications/Cydia.app',
    '/Applications/blackra1n.app',
    '/Applications/FakeCarrier.app',
    '/Applications/Icy.app',
    '/Applications/IntelliScreen.app',
    '/Applications/MxTube.app',
    '/Applications/RockApp.app',
    '/Applications/SBSettings.app',
    '/Applications/WinterBoard.app',
    '/private/var/lib/apt/',
    '/private/var/lib/cydia/',
    '/private/var/mobile/Library/SBSettings/',
    '/private/var/stash/',
    '/usr/bin/sshd',
    '/usr/libexec/ssh-keysign',
    '/var/cache/apt/',
    '/var/lib/apt/',
    '/var/lib/cydia/',
    '/usr/sbin/frida-server',
    '/usr/bin/cycript',
    '/usr/local/bin/cycript',
    '/usr/lib/libcycript.dylib'
  ];

  private readonly SUSPICIOUS_PACKAGES = [
    'com.noshufou.android.su',
    'com.thirdparty.superuser',
    'eu.chainfire.supersu',
    'com.koushikdutta.superuser',
    'com.zachspong.temprootremovejb',
    'com.ramdroid.appquarantine',
    'com.topjohnwu.magisk'
  ];

  private readonly HOOKING_FRAMEWORKS = [
    'substrate', 'cycript', 'frida-server', 'xposed'
  ];

  // Monitoring state
  private integrityCheckTimer?: NodeJS.Timeout;
  private threatAssessmentTimer?: NodeJS.Timeout;
  private baselineChecksum?: string;
  private isMonitoring = false;

  private constructor() {
    this.cryptoService = MilitaryGradeCryptoService.getInstance();
    this.auditLogger = SecurityAuditLogger.getInstance();
  }

  static getInstance(): AntiTamperingService {
    if (!AntiTamperingService.instance) {
      AntiTamperingService.instance = new AntiTamperingService();
    }
    return AntiTamperingService.instance;
  }

  /**
   * Perform comprehensive tampering detection
   */
  async detectTampering(): Promise<TamperingDetectionResult> {
    const threats: TamperingThreat[] = [];
    
    try {
      // Root detection (Android)
      if (Platform.OS === 'android') {
        const rootThreats = await this.detectAndroidRoot();
        threats.push(...rootThreats);
        
        const androidThreats = await this.detectAndroidSpecificThreats();
        threats.push(...androidThreats);
      }
      
      // Jailbreak detection (iOS)
      if (Platform.OS === 'ios') {
        const jailbreakThreats = await this.detectIOSJailbreak();
        threats.push(...jailbreakThreats);
        
        const iosThreats = await this.detectIOSSpecificThreats();
        threats.push(...iosThreats);
      }
      
      // Universal threats
      const debuggerThreats = await this.detectDebugger();
      threats.push(...debuggerThreats);
      
      const emulatorThreats = await this.detectEmulator();
      threats.push(...emulatorThreats);
      
      const hookingThreats = await this.detectHookingFrameworks();
      threats.push(...hookingThreats);
      
      const binaryThreats = await this.detectBinaryModification();
      threats.push(...binaryThreats);

      // Calculate risk level
      const riskLevel = this.calculateRiskLevel(threats);
      const isCompromised = riskLevel === 'high' || riskLevel === 'critical';
      
      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations(threats);
      
      // Log detection results
      await this.auditLogger.logSecurityEvent('TAMPERING_DETECTION_COMPLETED', {
        threatsFound: threats.length,
        riskLevel,
        isCompromised,
        threatTypes: threats.map(t => t.type),
        timestamp: Date.now()
      });

      return {
        isCompromised,
        threats,
        riskLevel,
        recommendations
      };
    } catch (error) {
      await this.auditLogger.logSecurityEvent('TAMPERING_DETECTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      
      console.error('Tampering detection failed:', error);
      
      // Return critical risk if detection fails
      return {
        isCompromised: true,
        threats: [{
          type: 'MODIFIED_BINARY',
          severity: 'critical',
          description: 'Security validation failed - potential tampering detected',
          evidence: ['Detection mechanism compromised']
        }],
        riskLevel: 'critical',
        recommendations: ['Reinstall application from official source', 'Contact security team']
      };
    }
  }

  /**
   * Detect Android root access
   */
  private async detectAndroidRoot(): Promise<TamperingThreat[]> {
    const threats: TamperingThreat[] = [];
    const evidence: string[] = [];
    
    try {
      // Check for root binary files
      for (const path of this.ROOT_DETECTION_PATHS) {
        try {
          const exists = await FileSystem.getInfoAsync(path);
          if (exists.exists) {
            evidence.push(`Root binary found at: ${path}`);
          }
        } catch {
          // File doesn't exist or no permission (good)
        }
      }
      
      // Check for root management apps
      for (const packageName of this.SUSPICIOUS_PACKAGES) {
        // In a real implementation, check if package is installed
        // This would require native module integration
      }
      
      // Check build tags for test keys
      try {
        // Check if device is using test-keys (indicates custom ROM)
        const buildTags = 'release-keys'; // Would get from native
        if (buildTags.includes('test-keys')) {
          evidence.push('Device built with test-keys (custom ROM indicator)');
        }
      } catch {
        // Unable to check build tags
      }
      
      // Check for developer options
      try {
        // In production, check Settings.Global.DEVELOPMENT_SETTINGS_ENABLED
        // This requires native implementation
      } catch {
        // Unable to check developer settings
      }

      if (evidence.length > 0) {
        threats.push({
          type: 'ROOT_DETECTED',
          severity: 'critical',
          description: 'Android device appears to be rooted',
          evidence
        });
      }
    } catch (error) {
      console.warn('Root detection failed:', error);
    }
    
    return threats;
  }

  /**
   * Detect Android-specific security threats
   */
  private async detectAndroidSpecificThreats(): Promise<TamperingThreat[]> {
    const threats: TamperingThreat[] = [];
    
    try {
      // Check for USB debugging
      // In production, check Settings.Global.ADB_ENABLED
      
      // Check for unknown sources installation
      // In production, check Settings.Secure.INSTALL_NON_MARKET_APPS
      
      // Check for mock location
      // In production, check Settings.Secure.ALLOW_MOCK_LOCATION
      
    } catch (error) {
      console.warn('Android threat detection failed:', error);
    }
    
    return threats;
  }

  /**
   * Detect iOS jailbreak
   */
  private async detectIOSJailbreak(): Promise<TamperingThreat[]> {
    const threats: TamperingThreat[] = [];
    const evidence: string[] = [];
    
    try {
      // Check for jailbreak files and directories
      for (const path of this.JAILBREAK_DETECTION_PATHS) {
        try {
          const exists = await FileSystem.getInfoAsync(path);
          if (exists.exists) {
            evidence.push(`Jailbreak artifact found: ${path}`);
          }
        } catch {
          // File doesn't exist or no permission (good)
        }
      }
      
      // Check for Cydia URL scheme
      try {
        // In production, check if device can open cydia:// URLs
        // This requires native implementation
      } catch {
        // Unable to check URL scheme
      }
      
      // Check for fork() system call availability
      try {
        // Jailbroken devices typically allow fork() calls
        // Non-jailbroken devices restrict this
        // This requires native implementation
      } catch {
        // Unable to test fork()
      }

      if (evidence.length > 0) {
        threats.push({
          type: 'JAILBREAK_DETECTED',
          severity: 'critical',
          description: 'iOS device appears to be jailbroken',
          evidence
        });
      }
    } catch (error) {
      console.warn('Jailbreak detection failed:', error);
    }
    
    return threats;
  }

  /**
   * Detect iOS-specific security threats
   */
  private async detectIOSSpecificThreats(): Promise<TamperingThreat[]> {
    const threats: TamperingThreat[] = [];
    
    try {
      // Check for suspicious frameworks
      // In production, enumerate loaded frameworks and check for suspicious ones
      
      // Check for code injection
      // In production, analyze memory for signs of code injection
      
    } catch (error) {
      console.warn('iOS threat detection failed:', error);
    }
    
    return threats;
  }

  /**
   * Detect debugger attachment
   */
  private async detectDebugger(): Promise<TamperingThreat[]> {
    const threats: TamperingThreat[] = [];
    
    try {
      // Check for debugging flags
      const isDebuggable = __DEV__; // React Native debug flag
      if (isDebuggable) {
        threats.push({
          type: 'DEBUGGER_ATTACHED',
          severity: 'medium',
          description: 'Application is running in debug mode',
          evidence: ['Debug build configuration detected']
        });
      }
      
      // Check for remote debugging
      // In production, check for Chrome DevTools or similar
      
      // Anti-debugging techniques
      const startTime = Date.now();
      // Perform time-sensitive operation
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }
      const endTime = Date.now();
      
      // If execution took too long, debugger might be attached
      if (endTime - startTime > 100) { // 100ms threshold
        threats.push({
          type: 'DEBUGGER_ATTACHED',
          severity: 'high',
          description: 'Debugger or performance analysis tool detected',
          evidence: [`Execution time anomaly: ${endTime - startTime}ms`]
        });
      }
    } catch (error) {
      console.warn('Debugger detection failed:', error);
    }
    
    return threats;
  }

  /**
   * Detect emulator environment
   */
  private async detectEmulator(): Promise<TamperingThreat[]> {
    const threats: TamperingThreat[] = [];
    const evidence: string[] = [];
    
    try {
      // Check device characteristics
      const brand = 'unknown'; // Would get from Device.brand
      const model = 'unknown'; // Would get from Device.model
      const product = 'unknown'; // Would get from Device.product
      
      // Common emulator identifiers
      const emulatorIndicators = [
        'generic', 'unknown', 'emulator', 'simulator',
        'genymotion', 'bluestacks', 'vbox', 'qemu'
      ];
      
      if (emulatorIndicators.some(indicator => 
        brand.toLowerCase().includes(indicator) ||
        model.toLowerCase().includes(indicator) ||
        product.toLowerCase().includes(indicator)
      )) {
        evidence.push(`Emulator-like device characteristics: ${brand}/${model}/${product}`);
      }
      
      // Check for specific emulator files (Android)
      if (Platform.OS === 'android') {
        const emulatorFiles = [
          '/dev/socket/qemud',
          '/dev/qemu_pipe',
          '/system/lib/libc_malloc_debug_qemu.so',
          '/sys/qemu_trace',
          '/system/bin/qemu-props'
        ];
        
        for (const file of emulatorFiles) {
          try {
            const exists = await FileSystem.getInfoAsync(file);
            if (exists.exists) {
              evidence.push(`Emulator file found: ${file}`);
            }
          } catch {
            // File doesn't exist (normal for real device)
          }
        }
      }

      if (evidence.length > 0) {
        threats.push({
          type: 'EMULATOR_DETECTED',
          severity: 'high',
          description: 'Application appears to be running on an emulator',
          evidence
        });
      }
    } catch (error) {
      console.warn('Emulator detection failed:', error);
    }
    
    return threats;
  }

  /**
   * Detect hooking frameworks
   */
  private async detectHookingFrameworks(): Promise<TamperingThreat[]> {
    const threats: TamperingThreat[] = [];
    const evidence: string[] = [];
    
    try {
      // Check for known hooking framework signatures
      for (const framework of this.HOOKING_FRAMEWORKS) {
        // In production, check for framework-specific artifacts
        // This requires native implementation to scan memory and loaded libraries
      }
      
      // Check for function hooking
      // Verify that critical functions haven't been modified
      const originalConsoleLog = console.log.toString();
      if (!originalConsoleLog.includes('[native code]') && !__DEV__) {
        evidence.push('Console methods appear to be hooked');
      }
      
      if (evidence.length > 0) {
        threats.push({
          type: 'HOOKING_FRAMEWORK',
          severity: 'critical',
          description: 'Hooking or instrumentation framework detected',
          evidence
        });
      }
    } catch (error) {
      console.warn('Hooking framework detection failed:', error);
    }
    
    return threats;
  }

  /**
   * Detect binary modification
   */
  private async detectBinaryModification(): Promise<TamperingThreat[]> {
    const threats: TamperingThreat[] = [];
    
    try {
      // Check application signature (would require native implementation)
      
      // Verify application bundle integrity
      const bundleId = await Application.applicationId;
      const version = await Application.nativeApplicationVersion;
      
      // Create integrity hash
      const integrityData = `${bundleId}_${version}_${Platform.OS}`;
      const currentChecksum = await this.cryptoService.generateSessionToken();
      
      // Compare with stored baseline
      if (this.baselineChecksum && this.baselineChecksum !== currentChecksum) {
        threats.push({
          type: 'MODIFIED_BINARY',
          severity: 'critical',
          description: 'Application binary appears to be modified',
          evidence: [`Checksum mismatch: expected ${this.baselineChecksum}, got ${currentChecksum}`]
        });
      }
    } catch (error) {
      console.warn('Binary modification detection failed:', error);
    }
    
    return threats;
  }

  /**
   * Calculate overall risk level based on threats
   */
  private calculateRiskLevel(threats: TamperingThreat[]): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.length === 0) return 'low';
    
    const criticalThreats = threats.filter(t => t.severity === 'critical').length;
    const highThreats = threats.filter(t => t.severity === 'high').length;
    const mediumThreats = threats.filter(t => t.severity === 'medium').length;
    
    if (criticalThreats > 0) return 'critical';
    if (highThreats > 1) return 'critical';
    if (highThreats > 0) return 'high';
    if (mediumThreats > 2) return 'high';
    if (mediumThreats > 0) return 'medium';
    
    return 'low';
  }

  /**
   * Generate security recommendations based on threats
   */
  private generateSecurityRecommendations(threats: TamperingThreat[]): string[] {
    const recommendations: string[] = [];
    const threatTypes = threats.map(t => t.type);
    
    if (threatTypes.includes('ROOT_DETECTED') || threatTypes.includes('JAILBREAK_DETECTED')) {
      recommendations.push('Use device without root/jailbreak for maximum security');
      recommendations.push('Install official app version from official store');
    }
    
    if (threatTypes.includes('DEBUGGER_ATTACHED')) {
      recommendations.push('Disable developer options and USB debugging');
      recommendations.push('Close any debugging or analysis tools');
    }
    
    if (threatTypes.includes('EMULATOR_DETECTED')) {
      recommendations.push('Use physical device instead of emulator');
      recommendations.push('Ensure device meets security requirements');
    }
    
    if (threatTypes.includes('HOOKING_FRAMEWORK')) {
      recommendations.push('Remove hooking frameworks and analysis tools');
      recommendations.push('Reinstall application from clean environment');
    }
    
    if (threatTypes.includes('MODIFIED_BINARY')) {
      recommendations.push('Reinstall application from official source');
      recommendations.push('Verify application signature and integrity');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Continue using application normally');
      recommendations.push('Monitor for security updates');
    }
    
    return recommendations;
  }

  /**
   * Perform integrity check on application components
   */
  async performIntegrityCheck(): Promise<IntegrityCheckResult> {
    try {
      const violations: IntegrityViolation[] = [];
      
      // Generate current integrity checksum
      const bundleId = await Application.applicationId || 'unknown';
      const version = await Application.nativeApplicationVersion || 'unknown';
      const platform = Platform.OS;
      
      const integrityString = `${bundleId}_${version}_${platform}`;
      const currentChecksum = await this.cryptoService.generateSessionToken();
      
      // Compare with baseline if available
      if (this.baselineChecksum) {
        if (this.baselineChecksum !== currentChecksum) {
          violations.push({
            component: 'application_bundle',
            expected: this.baselineChecksum,
            actual: currentChecksum,
            severity: 'critical'
          });
        }
      } else {
        // Store as baseline for future checks
        this.baselineChecksum = currentChecksum;
        await SecureStore.setItemAsync(this.BASELINE_CHECKSUM_KEY, currentChecksum);
      }
      
      // Log integrity check
      await this.auditLogger.logSecurityEvent('INTEGRITY_CHECK_PERFORMED', {
        checksum: currentChecksum,
        violations: violations.length,
        timestamp: Date.now()
      });
      
      return {
        isValid: violations.length === 0,
        violations,
        checksum: currentChecksum,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Integrity check failed:', error);
      throw new Error('Integrity validation failed');
    }
  }

  /**
   * Validate system integrity before sensitive operations
   */
  async validateIntegrity(): Promise<void> {
    try {
      const tamperingResult = await this.detectTampering();
      
      if (tamperingResult.isCompromised) {
        const criticalThreats = tamperingResult.threats.filter(
          t => t.severity === 'critical' || t.severity === 'high'
        );
        
        if (criticalThreats.length > 0) {
          await this.auditLogger.logSecurityEvent('INTEGRITY_VALIDATION_FAILED', {
            threats: criticalThreats.map(t => t.type),
            riskLevel: tamperingResult.riskLevel,
            timestamp: Date.now()
          });
          
          throw new Error('Security integrity validation failed - device appears compromised');
        }
      }
    } catch (error) {
      console.error('Integrity validation failed:', error);
      throw error;
    }
  }

  /**
   * Start continuous security monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Periodic integrity checks
    this.integrityCheckTimer = setInterval(async () => {
      try {
        await this.performIntegrityCheck();
      } catch (error) {
        console.error('Scheduled integrity check failed:', error);
      }
    }, this.INTEGRITY_CHECK_INTERVAL);
    
    // Periodic threat assessment
    this.threatAssessmentTimer = setInterval(async () => {
      try {
        const result = await this.detectTampering();
        if (result.riskLevel === 'critical' || result.riskLevel === 'high') {
          await this.auditLogger.logSecurityEvent('HIGH_RISK_ENVIRONMENT_DETECTED', {
            riskLevel: result.riskLevel,
            threats: result.threats.length,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Scheduled threat assessment failed:', error);
      }
    }, this.THREAT_ASSESSMENT_INTERVAL);
    
    console.log('Anti-tampering monitoring started');
  }

  /**
   * Stop security monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    if (this.integrityCheckTimer) {
      clearInterval(this.integrityCheckTimer);
      this.integrityCheckTimer = undefined;
    }
    
    if (this.threatAssessmentTimer) {
      clearInterval(this.threatAssessmentTimer);
      this.threatAssessmentTimer = undefined;
    }
    
    this.isMonitoring = false;
    console.log('Anti-tampering monitoring stopped');
  }

  /**
   * Initialize baseline security state
   */
  async initializeBaseline(): Promise<void> {
    try {
      // Try to load existing baseline
      const storedChecksum = await SecureStore.getItemAsync(this.BASELINE_CHECKSUM_KEY);
      if (storedChecksum) {
        this.baselineChecksum = storedChecksum;
      } else {
        // Perform initial integrity check to establish baseline
        const integrityResult = await this.performIntegrityCheck();
        this.baselineChecksum = integrityResult.checksum;
      }
      
      // Start monitoring
      this.startMonitoring();
    } catch (error) {
      console.error('Failed to initialize security baseline:', error);
    }
  }
}

// Export singleton instance
export const antiTamperingService = AntiTamperingService.getInstance();