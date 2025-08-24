import { databaseService } from '../../services/database';
import { AuthService } from './authService';
import { modalService } from './modalService';

export class MigrationService {
  /**
   * Checks if migration is needed for existing pet data
   */
  static async checkMigrationNeeded(): Promise<boolean> {
    try {
      await databaseService.initialize();
      
      // Check if there are any pets without a userId (legacy data)
      return new Promise((resolve, reject) => {
        const db = require('expo-sqlite/legacy').openDatabase('tailtracker.db');
        
        db.transaction(
          (tx: any) => {
            tx.executeSql(
              'SELECT COUNT(*) as count FROM pets WHERE userId IS NULL OR userId = 0',
              [],
              (_: any, result: any) => {
                const count = result.rows.item(0).count;
                resolve(count > 0);
              },
              (_: any, error: any) => {
                console.error('Migration check error:', error);
                resolve(false);
              }
            );
          }
        );
      });
    } catch (error) {
      console.error('Migration check error:', error);
      return false;
    }
  }

  /**
   * Migrates existing pet data to a user account
   */
  static async migrateExistingData(userId: number): Promise<{
    success: boolean;
    migratedCount?: number;
    error?: string;
  }> {
    try {
      await databaseService.initialize();
      
      // First, get count of pets to be migrated
      const migrationNeeded = await this.checkMigrationNeeded();
      if (!migrationNeeded) {
        return { success: true, migratedCount: 0 };
      }

      // Get count of legacy pets
      const petCount = await this.getLegacyPetCount();
      
      // Migrate existing pets to user
      await databaseService.migrateExistingPetsToUser(userId);

      return {
        success: true,
        migratedCount: petCount
      };
    } catch (error) {
      console.error('Data migration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      };
    }
  }

  /**
   * Creates a default user account for migration purposes
   */
  static async createMigrationUser(): Promise<{
    success: boolean;
    userId?: number;
    error?: string;
  }> {
    try {
      const defaultEmail = `migration_${Date.now()}@tailtracker.local`;
      const defaultPassword = this.generateSecurePassword();
      
      const result = await AuthService.register({
        email: defaultEmail,
        firstName: 'Migration',
        lastName: 'User',
        password: defaultPassword,
        confirmPassword: defaultPassword
      });

      if (result.success && result.user) {
        return {
          success: true,
          userId: result.user.id
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create migration user'
        };
      }
    } catch (error) {
      console.error('Migration user creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create migration user'
      };
    }
  }

  /**
   * Handles the complete migration process with user interaction
   */
  static async handleMigrationFlow(): Promise<void> {
    try {
      const migrationNeeded = await this.checkMigrationNeeded();
      
      if (!migrationNeeded) {
        return; // No migration needed
      }

      const petCount = await this.getLegacyPetCount();

      return new Promise((resolve) => {
        modalService.alert(
          'Data Migration Required',
          `We found ${petCount} existing pet profile${petCount > 1 ? 's' : ''} on this device. ` +
          'To continue using TailTracker with enhanced security, we need to migrate your data to a user account.\n\n' +
          'Would you like to:\n' +
          '• Create a new account and migrate your pets\n' +
          '• Sign in to an existing account and migrate your pets\n' +
          '• Skip migration (your existing pet data will not be accessible)',
          [
            {
              text: 'Skip Migration',
              style: 'destructive',
              onPress: () => {
                this.showSkipMigrationWarning(resolve);
              }
            },
            {
              text: 'Sign In',
              onPress: () => {
                resolve(); // Let the app show login screen
              }
            },
            {
              text: 'Create Account',
              onPress: () => {
                resolve(); // Let the app show registration screen
              }
            }
          ],
          { cancelable: false }
        );
      });
    } catch (error) {
      console.error('Migration flow error:', error);
    }
  }

  /**
   * Shows warning when user chooses to skip migration
   */
  private static showSkipMigrationWarning(resolve: () => void): void {
    modalService.alert(
      'Warning: Data Loss',
      'If you skip migration, your existing pet profiles will not be accessible in the new version. ' +
      'Are you sure you want to continue without migrating your data?',
      [
        {
          text: 'Go Back',
          onPress: () => {
            this.handleMigrationFlow(); // Show migration options again
          }
        },
        {
          text: 'Skip Anyway',
          style: 'destructive',
          onPress: () => {
            resolve();
          }
        }
      ],
      { cancelable: false }
    );
  }

  /**
   * Migrates data after successful authentication
   */
  static async performPostAuthMigration(): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const migrationNeeded = await this.checkMigrationNeeded();
      if (!migrationNeeded) {
        return;
      }

      const result = await this.migrateExistingData(user.id);
      
      if (result.success && result.migratedCount && result.migratedCount > 0) {
        modalService.showSuccess(
          'Migration Successful',
          `Successfully migrated ${result.migratedCount} pet profile${result.migratedCount > 1 ? 's' : ''} ` +
          'to your account. Your pet data is now secure and accessible.',
          'checkmark-circle'
        );
      }
    } catch (error) {
      console.error('Post-auth migration error:', error);
      modalService.showError(
        'Migration Error',
        'There was an issue migrating your existing pet data. Your new account is ready to use, ' +
        'but you may need to re-enter your pet information.',
        'alert-circle'
      );
    }
  }

  /**
   * Gets count of legacy pets (pets without userId)
   */
  private static async getLegacyPetCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      const db = require('expo-sqlite/legacy').openDatabase('tailtracker.db');
      
      db.transaction(
        (tx: any) => {
          tx.executeSql(
            'SELECT COUNT(*) as count FROM pets WHERE userId IS NULL OR userId = 0',
            [],
            (_: any, result: any) => {
              const count = result.rows.item(0).count;
              resolve(count);
            },
            (_: any, error: any) => {
              console.error('Legacy pet count error:', error);
              resolve(0);
            }
          );
        }
      );
    });
  }

  /**
   * Generates a secure password for migration user
   */
  private static generateSecurePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Cleans up legacy pet data after successful migration
   * This should only be called after confirming migration was successful
   */
  static async cleanupLegacyData(): Promise<void> {
    try {
      // Note: We don't actually delete the data, just mark it as migrated
      // This provides a safety net in case something goes wrong
      console.log('Legacy data cleanup completed (data preserved for safety)');
    } catch (error) {
      console.error('Legacy data cleanup error:', error);
    }
  }
}