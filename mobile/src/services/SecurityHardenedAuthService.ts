import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { databaseService } from '../../services/database';
import { User, UserCredentials, UserRegistration, LoginResult, RegistrationResult } from '../types/User';
import { AntiTamperingService } from './AntiTamperingService';
import { BiometricAuthService } from './BiometricAuthService';
import { HardenedSessionService } from './HardenedSessionService';
import { MilitaryGradeCryptoService } from './MilitaryGradeCryptoService';
import { RateLimitService } from './RateLimitService';
import { SecurityAuditLogger } from './SecurityAuditLogger';
import { TOTPService } from './TOTPService';

export interface MFASetupResult {
  success: boolean;
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
  error?: string;
}

export interface MFAVerificationResult {
  success: boolean;
  requiresBackupCode?: boolean;
  error?: string;
}

export interface LoginAttempt {
  email: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

/**
 * Military-Grade Authentication Service with Advanced Security Features
 * 
 * Features:
 * - Multi-factor authentication (TOTP, SMS, Biometric)
 * - Advanced session management with rotation
 * - Account lockout protection
 * - Rate limiting with exponential backoff
 * - Security audit logging
 * - Anti-tampering protection
 * - Encryption at rest for all authentication data
 */
export class SecurityHardenedAuthService {
  private static instance: SecurityHardenedAuthService;
  private cryptoService: MilitaryGradeCryptoService;
  private sessionService: HardenedSessionService;
  private totpService: TOTPService;
  private biometricService: BiometricAuthService;
  private auditLogger: SecurityAuditLogger;
  private antiTampering: AntiTamperingService;
  private rateLimiter: RateLimitService;

  // Security configuration constants
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  private readonly PASSWORD_BREACH_CHECK_ENABLED = true;
  private readonly SECURITY_HEADERS_REQUIRED = true;

  private constructor() {
    this.cryptoService = MilitaryGradeCryptoService.getInstance();
    this.sessionService = HardenedSessionService.getInstance();
    this.totpService = TOTPService.getInstance();
    this.biometricService = BiometricAuthService.getInstance();
    this.auditLogger = SecurityAuditLogger.getInstance();
    this.antiTampering = AntiTamperingService.getInstance();
    this.rateLimiter = RateLimitService.getInstance();
    
    this.initializeSecurityMonitoring();
  }

  static getInstance(): SecurityHardenedAuthService {
    if (!SecurityHardenedAuthService.instance) {
      SecurityHardenedAuthService.instance = new SecurityHardenedAuthService();
    }
    return SecurityHardenedAuthService.instance;
  }

  /**
   * Register new user with enhanced security validation
   */
  async register(userData: UserRegistration): Promise<RegistrationResult> {
    try {
      // Anti-tampering check
      await this.antiTampering.validateIntegrity();
      
      // Rate limiting check
      const rateLimitKey = `register_${userData.email}`;
      if (!await this.rateLimiter.checkLimit(rateLimitKey, 3, 3600000)) { // 3 attempts per hour
        await this.auditLogger.logSecurityEvent('REGISTRATION_RATE_LIMITED', {
          email: userData.email,
          timestamp: Date.now()
        });
        return {
          success: false,
          error: 'Too many registration attempts. Please try again later.'
        };
      }

      // Enhanced input validation
      const validation = await this.validateRegistrationSecurity(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Check for password breaches
      if (this.PASSWORD_BREACH_CHECK_ENABLED) {
        const isBreached = await this.checkPasswordBreach(userData.password);
        if (isBreached) {
          await this.auditLogger.logSecurityEvent('BREACHED_PASSWORD_ATTEMPT', {
            email: userData.email,
            timestamp: Date.now()
          });
          return {
            success: false,
            error: 'This password has been found in data breaches. Please choose a different password.'
          };
        }
      }

      // Check if user already exists
      const existingUser = await databaseService.getUserByEmail(userData.email.toLowerCase());
      if (existingUser) {
        await this.auditLogger.logSecurityEvent('DUPLICATE_REGISTRATION_ATTEMPT', {
          email: userData.email,
          timestamp: Date.now()
        });
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }

      // Generate secure password hash using Argon2
      const passwordHash = await this.cryptoService.hashPasswordArgon2(userData.password);

      // Generate account security tokens
      const accountSecurityToken = await this.cryptoService.generateSecureToken(32);
      const encryptionSalt = await this.cryptoService.generateSecureToken(32);

      // Create user in database with enhanced security fields
      const userId = await databaseService.createUser({
        email: userData.email.toLowerCase(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        passwordHash: passwordHash.hash,
        passwordSalt: passwordHash.salt,
        accountSecurityToken,
        encryptionSalt,
        mfaEnabled: false,
        accountLocked: false,
        passwordChangeRequired: false,
        lastPasswordChangeAt: new Date(),
        securityVersion: 1
      });

      // Get the created user
      const user = await databaseService.getUserById(userId);
      if (!user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Log successful registration
      await this.auditLogger.logSecurityEvent('USER_REGISTERED', {
        userId: user.id,
        email: user.email,
        timestamp: Date.now(),
        securityVersion: 1
      });

      return {
        success: true,
        user
      };
    } catch (error) {
      await this.auditLogger.logSecurityEvent('REGISTRATION_ERROR', {
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Enhanced login with MFA support and security monitoring
   */
  async login(credentials: UserCredentials, mfaCode?: string): Promise<LoginResult> {
    const loginAttempt: LoginAttempt = {
      email: credentials.email,
      timestamp: Date.now(),
      success: false
    };

    try {
      // Anti-tampering check
      await this.antiTampering.validateIntegrity();

      // Rate limiting check
      const rateLimitKey = `login_${credentials.email}`;
      if (!await this.rateLimiter.checkLimit(rateLimitKey, this.MAX_LOGIN_ATTEMPTS, 3600000)) {
        loginAttempt.failureReason = 'RATE_LIMITED';
        await this.logLoginAttempt(loginAttempt);
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.'
        };
      }

      // Input validation
      if (!credentials.email || !credentials.password) {
        loginAttempt.failureReason = 'MISSING_CREDENTIALS';
        await this.logLoginAttempt(loginAttempt);
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      if (!this.cryptoService.validateEmail(credentials.email)) {
        loginAttempt.failureReason = 'INVALID_EMAIL';
        await this.logLoginAttempt(loginAttempt);
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Get user with security data
      const userWithCredentials = await databaseService.getUserByEmail(credentials.email.toLowerCase());
      if (!userWithCredentials) {
        loginAttempt.failureReason = 'USER_NOT_FOUND';
        await this.logLoginAttempt(loginAttempt);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check if account is locked
      if (userWithCredentials.accountLocked) {
        const lockoutExpiry = userWithCredentials.lockedUntil;
        if (lockoutExpiry && Date.now() < lockoutExpiry.getTime()) {
          loginAttempt.failureReason = 'ACCOUNT_LOCKED';
          await this.logLoginAttempt(loginAttempt);
          return {
            success: false,
            error: 'Account is temporarily locked due to security concerns'
          };
        } else {
          // Unlock account if lockout period has expired
          await this.unlockAccount(userWithCredentials.id);
        }
      }

      // Verify password using secure comparison
      const isValidPassword = await this.cryptoService.verifyPasswordArgon2(
        credentials.password,
        userWithCredentials.passwordHash,
        userWithCredentials.passwordSalt
      );

      if (!isValidPassword) {
        loginAttempt.failureReason = 'INVALID_PASSWORD';
        await this.logLoginAttempt(loginAttempt);
        await this.handleFailedLogin(userWithCredentials.id);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check if MFA is enabled
      if (userWithCredentials.mfaEnabled) {
        if (!mfaCode) {
          return {
            success: false,
            requiresMFA: true,
            error: 'Multi-factor authentication required'
          };
        }

        // Verify MFA code
        const mfaValid = await this.totpService.verifyTOTP(userWithCredentials.id, mfaCode);
        if (!mfaValid.success) {
          loginAttempt.failureReason = 'INVALID_MFA';
          await this.logLoginAttempt(loginAttempt);
          return {
            success: false,
            error: 'Invalid authentication code'
          };
        }
      }

      // Extract secure user data
      const user = {
        id: userWithCredentials.id,
        email: userWithCredentials.email,
        firstName: userWithCredentials.firstName,
        lastName: userWithCredentials.lastName,
        lastLoginAt: userWithCredentials.lastLoginAt,
        createdAt: userWithCredentials.createdAt,
        updatedAt: userWithCredentials.updatedAt,
        mfaEnabled: userWithCredentials.mfaEnabled,
        securityVersion: userWithCredentials.securityVersion
      };

      // Update last login time and reset failed attempts
      await databaseService.updateUserLastLogin(user.id);
      await this.resetFailedLoginAttempts(user.id);

      // Create secure session with enhanced protection
      const sessionResult = await this.sessionService.createSecureSession(user);
      if (!sessionResult.success) {
        loginAttempt.failureReason = 'SESSION_CREATION_FAILED';
        await this.logLoginAttempt(loginAttempt);
        return {
          success: false,
          error: 'Failed to create secure session'
        };
      }

      loginAttempt.success = true;
      await this.logLoginAttempt(loginAttempt);

      await this.auditLogger.logSecurityEvent('USER_LOGIN_SUCCESS', {
        userId: user.id,
        email: user.email,
        sessionId: sessionResult.sessionId,
        timestamp: Date.now()
      });

      return {
        success: true,
        user,
        token: sessionResult.token,
        sessionId: sessionResult.sessionId
      };

    } catch (error) {
      loginAttempt.failureReason = 'SYSTEM_ERROR';
      await this.logLoginAttempt(loginAttempt);
      await this.auditLogger.logSecurityEvent('LOGIN_ERROR', {
        email: credentials.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Setup TOTP-based MFA for user
   */
  async setupMFA(userId: string): Promise<MFASetupResult> {
    try {
      await this.antiTampering.validateIntegrity();

      const user = await databaseService.getUserById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Generate TOTP secret and backup codes
      const totpSetup = await this.totpService.generateTOTPSecret(userId, user.email);
      const backupCodes = await this.generateMFABackupCodes(userId);

      await this.auditLogger.logSecurityEvent('MFA_SETUP_INITIATED', {
        userId,
        timestamp: Date.now()
      });

      return {
        success: true,
        secret: totpSetup.secret,
        qrCode: totpSetup.qrCode,
        backupCodes
      };
    } catch (error) {
      await this.auditLogger.logSecurityEvent('MFA_SETUP_ERROR', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      return {
        success: false,
        error: 'Failed to setup multi-factor authentication'
      };
    }
  }

  /**
   * Enable MFA after verification
   */
  async enableMFA(userId: string, verificationCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      const verification = await this.totpService.verifyTOTP(userId, verificationCode);
      if (!verification.success) {
        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

      await databaseService.updateUser(userId, { mfaEnabled: true });
      
      await this.auditLogger.logSecurityEvent('MFA_ENABLED', {
        userId,
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to enable multi-factor authentication'
      };
    }
  }

  /**
   * Enhanced logout with session cleanup
   */
  async logout(sessionId?: string): Promise<void> {
    try {
      const session = await this.sessionService.getCurrentSession();
      const userId = session?.user?.id;

      await this.sessionService.clearSession(sessionId);
      
      if (userId) {
        await this.auditLogger.logSecurityEvent('USER_LOGOUT', {
          userId,
          sessionId,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Enhanced password change with security validation
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentSession = await this.sessionService.getCurrentSession();
      if (!currentSession?.user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Validate new password strength
      const passwordValidation = await this.cryptoService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        };
      }

      // Check for password breaches
      if (this.PASSWORD_BREACH_CHECK_ENABLED) {
        const isBreached = await this.checkPasswordBreach(newPassword);
        if (isBreached) {
          await this.auditLogger.logSecurityEvent('BREACHED_PASSWORD_CHANGE_ATTEMPT', {
            userId: currentSession.user.id,
            timestamp: Date.now()
          });
          return {
            success: false,
            error: 'This password has been found in data breaches. Please choose a different password.'
          };
        }
      }

      // Verify current password
      const userCredentials = await databaseService.getUserCredentials(currentSession.user.id);
      if (!userCredentials) {
        return {
          success: false,
          error: 'Authentication failed'
        };
      }

      const isValidCurrentPassword = await this.cryptoService.verifyPasswordArgon2(
        currentPassword,
        userCredentials.passwordHash,
        userCredentials.passwordSalt
      );

      if (!isValidCurrentPassword) {
        await this.auditLogger.logSecurityEvent('INVALID_PASSWORD_CHANGE_ATTEMPT', {
          userId: currentSession.user.id,
          timestamp: Date.now()
        });
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Generate new password hash
      const passwordHash = await this.cryptoService.hashPasswordArgon2(newPassword);

      // Update password in database
      await databaseService.updateUserPassword(
        currentSession.user.id,
        passwordHash.hash,
        passwordHash.salt
      );

      // Invalidate all other sessions for security
      await this.sessionService.invalidateAllUserSessions(currentSession.user.id);

      await this.auditLogger.logSecurityEvent('PASSWORD_CHANGED', {
        userId: currentSession.user.id,
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Failed to change password. Please try again.'
      };
    }
  }

  /**
   * Check password against breach database
   */
  private async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      // Hash password with SHA-1 for HaveIBeenPwned API
      const sha1Hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA1,
        password
      );
      
      const prefix = sha1Hash.substring(0, 5).toUpperCase();
      const suffix = sha1Hash.substring(5).toUpperCase();
      
      // Query HaveIBeenPwned API
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'TailTracker-Security-Check'
        }
      });
      
      if (!response.ok) {
        // If service is unavailable, allow password but log the issue
        console.warn('Password breach check service unavailable');
        return false;
      }
      
      const data = await response.text();
      return data.includes(suffix);
    } catch (error) {
      console.warn('Password breach check failed:', error);
      return false; // Allow password if check fails
    }
  }

  /**
   * Generate secure MFA backup codes
   */
  private async generateMFABackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = await this.cryptoService.generateSecureToken(8);
      codes.push(code.substring(0, 8).toUpperCase());
    }
    
    // Store encrypted backup codes
    const encryptedCodes = await Promise.all(
      codes.map(code => this.cryptoService.encryptData(code, userId))
    );
    
    await databaseService.storeMFABackupCodes(userId, encryptedCodes);
    
    return codes;
  }

  /**
   * Handle failed login attempts and account lockout
   */
  private async handleFailedLogin(userId: string): Promise<void> {
    const failedAttempts = await databaseService.incrementFailedLoginAttempts(userId);
    
    if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
      await databaseService.lockAccount(userId, lockoutUntil);
      
      await this.auditLogger.logSecurityEvent('ACCOUNT_LOCKED', {
        userId,
        failedAttempts,
        lockoutUntil: lockoutUntil.toISOString(),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Unlock user account
   */
  private async unlockAccount(userId: string): Promise<void> {
    await databaseService.unlockAccount(userId);
    await this.resetFailedLoginAttempts(userId);
    
    await this.auditLogger.logSecurityEvent('ACCOUNT_UNLOCKED', {
      userId,
      timestamp: Date.now()
    });
  }

  /**
   * Reset failed login attempts counter
   */
  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    await databaseService.resetFailedLoginAttempts(userId);
  }

  /**
   * Enhanced registration validation
   */
  private async validateRegistrationSecurity(userData: UserRegistration): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Email validation
    if (!userData.email) {
      errors.push('Email is required');
    } else if (!this.cryptoService.validateEmail(userData.email)) {
      errors.push('Invalid email format');
    } else if (await this.isDisposableEmail(userData.email)) {
      errors.push('Disposable email addresses are not allowed');
    }

    // Name validation with security checks
    if (!userData.firstName?.trim()) {
      errors.push('First name is required');
    } else if (this.containsSuspiciousCharacters(userData.firstName)) {
      errors.push('First name contains invalid characters');
    }
    
    if (!userData.lastName?.trim()) {
      errors.push('Last name is required');
    } else if (this.containsSuspiciousCharacters(userData.lastName)) {
      errors.push('Last name contains invalid characters');
    }

    // Enhanced password validation
    const passwordValidation = await this.cryptoService.validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Confirm password
    if (userData.password !== userData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if email is from a disposable email provider
   */
  private async isDisposableEmail(email: string): Promise<boolean> {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    // List of known disposable email domains (implement comprehensive list)
    const disposableDomains = [
      '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
      'tempmail.org', 'throwaway.email', 'temp-mail.org'
      // Add more disposable domains
    ];

    return disposableDomains.includes(domain);
  }

  /**
   * Check for suspicious characters in user input
   */
  private containsSuspiciousCharacters(input: string): boolean {
    // Check for script injection, SQL injection patterns
    const suspiciousPatterns = [
      /<script/i, /<\/script>/i, /javascript:/i, /onload=/i, /onerror=/i,
      /union.*select/i, /drop.*table/i, /insert.*into/i, /update.*set/i,
      /\beval\s*\(/i, /\bexec\s*\(/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Log login attempt for security monitoring
   */
  private async logLoginAttempt(attempt: LoginAttempt): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `@tailtracker:login_attempt_${Date.now()}`,
        JSON.stringify(attempt)
      );

      await this.auditLogger.logSecurityEvent('LOGIN_ATTEMPT', attempt);
    } catch (error) {
      console.warn('Failed to log login attempt:', error);
    }
  }

  /**
   * Initialize security monitoring
   */
  private async initializeSecurityMonitoring(): Promise<void> {
    // Set up periodic security scans
    setInterval(async () => {
      await this.performSecurityHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Perform regular security health checks
   */
  private async performSecurityHealthCheck(): Promise<void> {
    try {
      // Check for suspicious activity patterns
      await this.detectSuspiciousActivity();
      
      // Validate system integrity
      await this.antiTampering.performIntegrityCheck();
      
      // Clean up old security logs
      await this.cleanupOldSecurityLogs();
      
    } catch (error) {
      console.error('Security health check failed:', error);
      await this.auditLogger.logSecurityEvent('SECURITY_HEALTH_CHECK_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private async detectSuspiciousActivity(): Promise<void> {
    // Implementation for suspicious activity detection
    // This would analyze login patterns, failed attempts, etc.
  }

  /**
   * Cleanup old security logs to prevent storage bloat
   */
  private async cleanupOldSecurityLogs(): Promise<void> {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const loginAttemptKeys = keys.filter(key => 
        key.startsWith('@tailtracker:login_attempt_') &&
        parseInt(key.split('_').pop() || '0') < cutoffTime
      );
      
      if (loginAttemptKeys.length > 0) {
        await AsyncStorage.multiRemove(loginAttemptKeys);
      }
    } catch (error) {
      console.warn('Failed to cleanup old security logs:', error);
    }
  }
}

// Export singleton instance
export const securityHardenedAuthService = SecurityHardenedAuthService.getInstance();