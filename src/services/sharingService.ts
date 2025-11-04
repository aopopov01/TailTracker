/**
 * Sharing Service
 * Handles pet profile sharing and QR code generation
 */

interface SharingResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface QRCodeData {
  petId: string;
  token: string;
  expiresAt: string;
  url: string;
}

interface SharingToken {
  id: string;
  token: string;
  petId: string;
  expiresAt: string;
  createdAt: string;
}

interface SharedAccess {
  id: string;
  petId: string;
  userId: string;
  accessLevel: 'read' | 'write';
  grantedAt: string;
}

class SharingService {
  // Static method for backward compatibility
  static async getSharedPets(userId?: number): Promise<any[]> {
    // Create a temporary instance to call the method
    const instance = new SharingService();
    const result = await instance.getSharedPets();
    return result.success ? result.data : [];
  }

  async generatePetQRCode(petId: string): Promise<SharingResult> {
    try {
      // Mock implementation for testing
      const qrData = {
        petId,
        url: `https://tailtracker.app/pet/${petId}`,
        generatedAt: new Date().toISOString(),
      };

      return { success: true, data: qrData };
    } catch (error) {
      return { success: false, error: 'Failed to generate QR code' };
    }
  }

  async sharePetProfile(
    petId: string,
    shareOptions?: any
  ): Promise<SharingResult> {
    try {
      // Mock implementation for testing
      const shareData = {
        petId,
        shareUrl: `https://tailtracker.app/pet/${petId}`,
        sharedAt: new Date().toISOString(),
      };

      return { success: true, data: shareData };
    } catch (error) {
      return { success: false, error: 'Failed to share pet profile' };
    }
  }

  async createShareableLink(petId: string): Promise<SharingResult> {
    try {
      // Mock implementation for testing
      const linkData = {
        petId,
        shareUrl: `https://tailtracker.app/pet/${petId}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      return { success: true, data: linkData };
    } catch (error) {
      return { success: false, error: 'Failed to create shareable link' };
    }
  }

  async getSharedPets(): Promise<SharingResult> {
    try {
      // Mock implementation for testing
      const sharedPets = [
        {
          petId: 'shared-1',
          name: 'Max',
          species: 'Dog',
          shareUrl: 'https://tailtracker.app/pet/shared-1',
          sharedBy: 'User1',
          sharedAt: new Date().toISOString(),
        },
      ];

      return { success: true, data: sharedPets };
    } catch (error) {
      return { success: false, error: 'Failed to get shared pets' };
    }
  }

  // Additional methods for sharing components
  static async generateSharingToken(
    petId: string | number,
    expiresIn?: number
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const token = `token_${petId}_${Date.now()}`;
      return { success: true, token };
    } catch (error) {
      return { success: false, error: 'Failed to generate sharing token' };
    }
  }

  static createQRCodeData(token: string, petId?: string): QRCodeData {
    return {
      petId: petId || 'unknown',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://tailtracker.app/share/${token}`,
    };
  }

  static formatExpirationTime(expiresAt: string): string {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return `${diffDays} days`;
    if (diffDays === 1) return '1 day';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 1) return `${diffHours} hours`;
    if (diffHours === 1) return '1 hour';

    return 'Less than 1 hour';
  }

  static async processSharedAccess(
    token: string,
    userId?: string
  ): Promise<SharingResult> {
    try {
      return {
        success: true,
        data: {
          petId: 'shared-pet-1',
          accessLevel: 'read',
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          userId: userId || 'unknown',
        },
      };
    } catch (error) {
      return { success: false, error: 'Failed to process shared access' };
    }
  }

  static async getUserSharingTokens(
    userId: string | number
  ): Promise<SharingToken[]> {
    return [];
  }

  static async getActiveSharedAccess(
    userId: string | number
  ): Promise<SharedAccess[]> {
    return [];
  }

  static async revokeSharingToken(
    tokenId: string,
    onSuccess?: () => void
  ): Promise<SharingResult> {
    if (onSuccess) onSuccess();
    return { success: true };
  }

  static async revokeUserAccess(
    accessId: string,
    onSuccess?: () => void
  ): Promise<SharingResult> {
    if (onSuccess) onSuccess();
    return { success: true };
  }

  static isTokenExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }
}

export const sharingService = new SharingService();
export { SharingService };
export default sharingService;
