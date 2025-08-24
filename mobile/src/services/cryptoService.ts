import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';

export class CryptoService {
  private static readonly SALT_LENGTH = 32;
  private static readonly HASH_ITERATIONS = 10000;

  /**
   * Generates a cryptographically secure random salt
   */
  static generateSalt(): string {
    const array = new Uint8Array(this.SALT_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hashes a password with a salt using PBKDF2-like approach
   * Uses SHA-256 multiple times for enhanced security
   */
  static async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const generatedSalt = salt || this.generateSalt();
    let hash = password + generatedSalt;

    // Apply SHA-256 multiple times for PBKDF2-like security
    for (let i = 0; i < this.HASH_ITERATIONS; i++) {
      hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, hash);
    }

    return { hash, salt: generatedSalt };
  }

  /**
   * Verifies a password against a stored hash
   */
  static async verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
    try {
      const { hash } = await this.hashPassword(password, salt);
      return hash === storedHash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Generates a secure session token
   */
  static async generateSessionToken(): Promise<string> {
    const timestamp = Date.now().toString();
    const randomBytes = this.generateSalt();
    const combined = timestamp + randomBytes;
    return await digestStringAsync(CryptoDigestAlgorithm.SHA256, combined);
  }

  /**
   * Validates password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase());
  }
}