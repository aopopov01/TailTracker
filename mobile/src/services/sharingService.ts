import { databaseService, SharingToken, SharedAccess, StoredPetProfile, SharedPetAccess } from '../../services/database';
import { User } from '../types/User';

export interface QRCodeData {
  type: 'pet_sharing';
  token: string;
  version: '1.0';
  appName: 'TailTracker';
}

export interface SharingResult {
  success: boolean;
  error?: string;
  token?: string;
}

export interface AccessResult {
  success: boolean;
  error?: string;
  ownerName?: string;
  petCount?: number;
}

export class SharingService {
  /**
   * Generate a new sharing token and QR code data
   */
  static async generateSharingToken(ownerUserId: number, expirationHours: number = 24): Promise<SharingResult> {
    try {
      const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
      const token = await databaseService.createSharingToken(ownerUserId, expiresAt);
      
      return {
        success: true,
        token
      };
    } catch (error) {
      console.error('Error generating sharing token:', error);
      return {
        success: false,
        error: 'Failed to generate sharing token'
      };
    }
  }

  /**
   * Create QR code data object
   */
  static createQRCodeData(token: string): QRCodeData {
    return {
      type: 'pet_sharing',
      token,
      version: '1.0',
      appName: 'TailTracker'
    };
  }

  /**
   * Parse QR code data from scanned string
   */
  static parseQRCodeData(qrData: string): QRCodeData | null {
    try {
      const parsed = JSON.parse(qrData);
      
      if (
        parsed.type === 'pet_sharing' &&
        parsed.token &&
        parsed.version &&
        parsed.appName === 'TailTracker'
      ) {
        return parsed as QRCodeData;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      return null;
    }
  }

  /**
   * Validate and process access request from scanned QR code
   */
  static async requestAccess(token: string, guestUserId: number): Promise<AccessResult> {
    try {
      // First validate the token
      const sharingToken = await databaseService.validateSharingToken(token);
      
      if (!sharingToken) {
        return {
          success: false,
          error: 'Invalid or expired sharing code'
        };
      }

      // Check if user is trying to access their own pets
      if (sharingToken.ownerUserId === guestUserId) {
        return {
          success: false,
          error: 'You cannot access your own pets through sharing'
        };
      }

      // Grant access
      await databaseService.grantSharedAccess(sharingToken.id, guestUserId, sharingToken.ownerUserId);
      
      // No need to check return value since grantSharedAccess returns void

      // Get owner information
      const owner = await databaseService.getUserById(sharingToken.ownerUserId);
      const pets = await databaseService.getAllPets(sharingToken.ownerUserId);

      return {
        success: true,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Pet Owner',
        petCount: pets.length
      };
    } catch (error) {
      console.error('Error requesting access:', error);
      return {
        success: false,
        error: 'Failed to process access request'
      };
    }
  }

  /**
   * Process shared access from token string
   */
  static async processSharedAccess(token: string, guestUserId: number): Promise<boolean> {
    try {
      const result = await this.requestAccess(token, guestUserId);
      return result.success;
    } catch (error) {
      console.error('Error processing shared access:', error);
      return false;
    }
  }

  /**
   * Get all pets shared with a user
   */
  static async getSharedPets(guestUserId: number): Promise<SharedPetAccess[]> {
    try {
      return await databaseService.getSharedPetsForUser(guestUserId);
    } catch (error) {
      console.error('Error fetching shared pets:', error);
      return [];
    }
  }

  /**
   * Get user's active sharing tokens
   */
  static async getUserSharingTokens(ownerUserId: number): Promise<SharingToken[]> {
    try {
      return await databaseService.getUserSharingTokens(ownerUserId);
    } catch (error) {
      console.error('Error fetching sharing tokens:', error);
      return [];
    }
  }

  /**
   * Get active shared access for a user's pets
   */
  static async getActiveSharedAccess(ownerUserId: number): Promise<any[]> {
    try {
      return await databaseService.getActiveSharedAccess(ownerUserId);
    } catch (error) {
      console.error('Error fetching shared access:', error);
      return [];
    }
  }

  /**
   * Revoke a sharing token
   */
  static async revokeSharingToken(tokenId: number, ownerUserId: number): Promise<SharingResult> {
    try {
      await databaseService.revokeSharingToken(tokenId, ownerUserId);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error revoking sharing token:', error);
      return {
        success: false,
        error: 'Failed to revoke sharing token'
      };
    }
  }

  /**
   * Revoke access for a specific user
   */
  static async revokeUserAccess(accessId: number, ownerUserId: number): Promise<SharingResult> {
    try {
      await databaseService.revokeUserAccess(accessId, ownerUserId);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error revoking user access:', error);
      return {
        success: false,
        error: 'Failed to revoke user access'
      };
    }
  }

  /**
   * Update access time when user views shared pets
   */
  static async updateAccessTime(tokenId: number, guestUserId: number): Promise<void> {
    try {
      await databaseService.updateSharedAccessTime(tokenId, guestUserId);
    } catch (error) {
      console.error('Error updating access time:', error);
    }
  }

  /**
   * Format expiration time for display
   */
  static formatExpirationTime(expiresAt: string): string {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Expired';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ${diffHours % 24}h remaining`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(expiresAt: string): boolean {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    return now >= expirationDate;
  }

  /**
   * Clean up expired tokens (should be called periodically)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      // This would typically be handled by a background task
      // For now, expired tokens are filtered out in queries
      console.log('Cleanup expired tokens (handled by database queries)');
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }
}