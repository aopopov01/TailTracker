import { digestStringAsync, CryptoDigestAlgorithm, getRandomBytes } from 'expo-crypto';

export class CryptoService {
  private static readonly SALT_LENGTH = 32;
  private static readonly HASH_ITERATIONS = 10000;

  /**
   * Generates a cryptographically secure random salt
   */
  static generateSalt(): string {
    const array = getRandomBytes(this.SALT_LENGTH);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hashes a password with a salt using proper PBKDF2 approach
   * Uses PBKDF2 with SHA-256 for enhanced security
   */
  static async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const generatedSalt = salt || this.generateSalt();
    
    // Convert salt to Uint8Array for proper PBKDF2
    const saltBytes = new Uint8Array(generatedSalt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const passwordBytes = new TextEncoder().encode(password);
    
    // Use proper PBKDF2 with SHA-256
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: this.HASH_ITERATIONS,
        hash: 'SHA-256'
      },
      key,
      256 // 32 bytes
    );
    
    // Convert to hex string
    const hash = Array.from(new Uint8Array(derivedBits))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

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
   * Generates a cryptographically secure session token
   */
  static async generateSessionToken(): Promise<string> {
    // Generate 32 bytes of cryptographically secure random data
    const randomBytes = getRandomBytes(32);
    
    // Convert to base64url for safe storage/transmission
    const base64 = btoa(String.fromCharCode(...randomBytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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