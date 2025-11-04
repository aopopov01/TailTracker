/**
 * Crypto Service
 * Handles data encryption, decryption, and hashing
 */

import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'TailTracker_Secret_Key_2024'; // In production, use secure key management

export const cryptoService = {
  async encryptData(data: string): Promise<string> {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  },

  async decryptData(encryptedData: string): Promise<string> {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  },

  async hashData(data: string): Promise<string> {
    try {
      const hash = CryptoJS.SHA256(data).toString();
      return hash;
    } catch (error) {
      console.error('Hashing failed:', error);
      throw new Error('Failed to hash data');
    }
  },

  async generateSalt(): Promise<string> {
    try {
      const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
      return salt;
    } catch (error) {
      console.error('Salt generation failed:', error);
      throw new Error('Failed to generate salt');
    }
  },

  async hashPassword(password: string, salt: string): Promise<string> {
    try {
      const hash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1000,
      }).toString();
      return hash;
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  },

  async validateEmail(email: string): Promise<boolean> {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    } catch (error) {
      console.error('Email validation failed:', error);
      return false;
    }
  },

  async generateSessionToken(): Promise<string> {
    try {
      const token = CryptoJS.lib.WordArray.random(256 / 8).toString();
      return token;
    } catch (error) {
      console.error('Session token generation failed:', error);
      throw new Error('Failed to generate session token');
    }
  },

  async validatePasswordStrength(
    password: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
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
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      console.error('Password validation failed:', error);
      return { isValid: false, errors: ['Failed to validate password'] };
    }
  },
};

export class CryptoService {
  async encryptData(data: string) {
    return cryptoService.encryptData(data);
  }
  async decryptData(encryptedData: string) {
    return cryptoService.decryptData(encryptedData);
  }
  async hashData(data: string) {
    return cryptoService.hashData(data);
  }
  async generateSalt() {
    return cryptoService.generateSalt();
  }
  async hashPassword(password: string, salt: string) {
    return cryptoService.hashPassword(password, salt);
  }
  async validateEmail(email: string) {
    return cryptoService.validateEmail(email);
  }
  async generateSessionToken() {
    return cryptoService.generateSessionToken();
  }
  async validatePasswordStrength(password: string) {
    return cryptoService.validatePasswordStrength(password);
  }

  // Static methods for direct class access
  static async validateEmail(email: string) {
    return cryptoService.validateEmail(email);
  }
  static async generateSessionToken() {
    return cryptoService.generateSessionToken();
  }
  static async validatePasswordStrength(password: string) {
    return cryptoService.validatePasswordStrength(password);
  }
}

export default cryptoService;
