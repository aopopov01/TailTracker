import { User, UserCredentials, UserRegistration, LoginResult, RegistrationResult } from '../types/User';
import { CryptoService } from './cryptoService';
import { SessionService } from './sessionService';
import { databaseService } from '../../services/database';

export class AuthService {
  /**
   * Registers a new user with secure password hashing
   */
  static async register(userData: UserRegistration): Promise<RegistrationResult> {
    try {
      // Validate input
      const validation = this.validateRegistration(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Check if user already exists
      const existingUser = await databaseService.getUserByEmail(userData.email.toLowerCase());
      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }

      // Hash password
      const { hash, salt } = await CryptoService.hashPassword(userData.password);

      // Create user in database
      const userId = await databaseService.createUser({
        email: userData.email.toLowerCase(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        passwordHash: hash,
        passwordSalt: salt
      });

      // Get the created user
      const user = await databaseService.getUserById(userId);
      if (!user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Authenticates user with email and password
   */
  static async login(credentials: UserCredentials): Promise<LoginResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      if (!CryptoService.validateEmail(credentials.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Get user from database
      const userWithCredentials = await databaseService.getUserByEmail(credentials.email.toLowerCase());
      if (!userWithCredentials) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = await CryptoService.verifyPassword(
        credentials.password,
        userWithCredentials.passwordHash,
        userWithCredentials.passwordSalt
      );

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Extract user data without credentials
      const user = {
        id: userWithCredentials.id,
        email: userWithCredentials.email,
        firstName: userWithCredentials.firstName,
        lastName: userWithCredentials.lastName,
        lastLoginAt: userWithCredentials.lastLoginAt,
        createdAt: userWithCredentials.createdAt,
        updatedAt: userWithCredentials.updatedAt
      };

      // Update last login time
      await databaseService.updateUserLastLogin(user.id);

      // Create session
      const token = await SessionService.createSession(user);

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Logs out the current user
   */
  static async logout(): Promise<void> {
    try {
      await SessionService.clearSession();
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error to ensure logout always appears to succeed
    }
  }

  /**
   * Gets the current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      return await SessionService.getCurrentUser();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Checks if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      return await SessionService.isAuthenticated();
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Refreshes the current session
   */
  static async refreshSession(): Promise<boolean> {
    try {
      const currentUser = await SessionService.getCurrentUser();
      if (!currentUser) {
        return false;
      }

      // Verify user still exists in database
      const user = await databaseService.getUserById(currentUser.id);
      if (!user) {
        await SessionService.clearSession();
        return false;
      }

      // Update session with latest user data and extend expiration
      await SessionService.updateSessionUser(user);
      await SessionService.extendSession();
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  }

  /**
   * Changes user password
   */
  static async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = await SessionService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Validate new password
      const passwordValidation = CryptoService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        };
      }

      // Verify current password
      const userCredentials = await databaseService.getUserCredentials(currentUser.id);
      if (!userCredentials) {
        return {
          success: false,
          error: 'Authentication failed'
        };
      }

      const isValidCurrentPassword = await CryptoService.verifyPassword(
        currentPassword,
        userCredentials.passwordHash,
        userCredentials.passwordSalt
      );

      if (!isValidCurrentPassword) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Hash new password
      const { hash, salt } = await CryptoService.hashPassword(newPassword);

      // Update password in database
      await databaseService.updateUserPassword(currentUser.id, hash, salt);

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
   * Validates user registration data
   */
  private static validateRegistration(userData: UserRegistration): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Email validation
    if (!userData.email) {
      errors.push('Email is required');
    } else if (!CryptoService.validateEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    // Name validation
    if (!userData.firstName?.trim()) {
      errors.push('First name is required');
    }
    if (!userData.lastName?.trim()) {
      errors.push('Last name is required');
    }

    // Password validation
    const passwordValidation = CryptoService.validatePasswordStrength(userData.password);
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
}