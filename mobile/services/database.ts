import * as SQLite from 'expo-sqlite';
import { PetProfile } from '../contexts/PetProfileContext';
import { User } from '../src/types/User';

const db = SQLite.openDatabaseSync('tailtracker.db');

export interface StoredPetProfile extends PetProfile {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserCredentials {
  passwordHash: string;
  passwordSalt: string;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  passwordSalt: string;
}

export interface SharingToken {
  id: number;
  token: string;
  ownerUserId: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface SharedAccess {
  id: number;
  tokenId: number;
  guestUserId: number;
  ownerUserId: number;
  accessGrantedAt: string;
  lastAccessedAt?: string;
  isActive: boolean;
}

export interface SharedPetAccess {
  petId: number;
  petName: string;
  ownerFirstName: string;
  ownerLastName: string;
  photos: string[];
  species: string;
  breed?: string;
}

class DatabaseService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Create users table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          passwordHash TEXT NOT NULL,
          passwordSalt TEXT NOT NULL,
          lastLoginAt TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create pets table with user relationship
      db.execSync(`
        CREATE TABLE IF NOT EXISTS pets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          name TEXT,
          species TEXT,
          photos TEXT,
          breed TEXT,
          dateOfBirth TEXT,
          approximateAge TEXT,
          useApproximateAge INTEGER,
          gender TEXT,
          colorMarkings TEXT,
          weight TEXT,
          weightUnit TEXT,
          height TEXT,
          heightUnit TEXT,
          microchipId TEXT,
          registrationNumber TEXT,
          insuranceProvider TEXT,
          insurancePolicyNumber TEXT,
          medicalConditions TEXT,
          medications TEXT,
          allergies TEXT,
          veterinarian TEXT,
          emergencyContact TEXT,
          personalityTraits TEXT,
          favoriteToys TEXT,
          favoriteActivities TEXT,
          exerciseNeeds TEXT,
          feedingSchedule TEXT,
          specialNotes TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        );
      `);

      // Create sharing tokens table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS sharing_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT UNIQUE NOT NULL,
          ownerUserId INTEGER NOT NULL,
          expiresAt TEXT NOT NULL,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          lastUsedAt TEXT,
          FOREIGN KEY (ownerUserId) REFERENCES users (id) ON DELETE CASCADE
        );
      `);

      // Create shared access table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS shared_access (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tokenId INTEGER NOT NULL,
          guestUserId INTEGER NOT NULL,
          ownerUserId INTEGER NOT NULL,
          accessGrantedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          lastAccessedAt TEXT,
          isActive INTEGER DEFAULT 1,
          FOREIGN KEY (tokenId) REFERENCES sharing_tokens (id) ON DELETE CASCADE,
          FOREIGN KEY (guestUserId) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (ownerUserId) REFERENCES users (id) ON DELETE CASCADE
        );
      `);

      // Create indexes for performance
      db.execSync(`
        CREATE INDEX IF NOT EXISTS idx_pets_userId ON pets (userId);
        CREATE INDEX IF NOT EXISTS idx_sharing_tokens_ownerUserId ON sharing_tokens (ownerUserId);
        CREATE INDEX IF NOT EXISTS idx_sharing_tokens_token ON sharing_tokens (token);
        CREATE INDEX IF NOT EXISTS idx_shared_access_guestUserId ON shared_access (guestUserId);
        CREATE INDEX IF NOT EXISTS idx_shared_access_ownerUserId ON shared_access (ownerUserId);
      `);

      console.log('Database initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  // User Management Methods
  async createUser(userData: CreateUserData): Promise<number> {
    await this.initialize();

    try {
      const result = db.runSync(
        `INSERT INTO users (email, firstName, lastName, passwordHash, passwordSalt)
         VALUES (?, ?, ?, ?, ?)`,
        [userData.email, userData.firstName, userData.lastName, userData.passwordHash, userData.passwordSalt]
      );

      return result.lastInsertRowId;
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<(User & UserCredentials) | null> {
    await this.initialize();

    try {
      const result = db.getFirstSync(
        'SELECT * FROM users WHERE email = ?',
        [email]
      ) as any;

      if (!result) return null;

      return {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        lastLoginAt: result.lastLoginAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        passwordHash: result.passwordHash,
        passwordSalt: result.passwordSalt
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId: number): Promise<User | null> {
    await this.initialize();

    try {
      const result = db.getFirstSync(
        'SELECT id, email, firstName, lastName, lastLoginAt, createdAt, updatedAt FROM users WHERE id = ?',
        [userId]
      ) as any;

      if (!result) return null;

      return {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        lastLoginAt: result.lastLoginAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserCredentials(userId: number): Promise<UserCredentials | null> {
    await this.initialize();

    try {
      const result = db.getFirstSync(
        'SELECT passwordHash, passwordSalt FROM users WHERE id = ?',
        [userId]
      ) as any;

      if (!result) return null;

      return {
        passwordHash: result.passwordHash,
        passwordSalt: result.passwordSalt
      };
    } catch (error) {
      throw error;
    }
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    await this.initialize();

    try {
      const now = new Date().toISOString();
      db.runSync(
        'UPDATE users SET lastLoginAt = ?, updatedAt = ? WHERE id = ?',
        [now, now, userId]
      );
    } catch (error) {
      throw error;
    }
  }

  async updateUserPassword(userId: number, passwordHash: string, passwordSalt: string): Promise<void> {
    await this.initialize();

    try {
      const now = new Date().toISOString();
      db.runSync(
        'UPDATE users SET passwordHash = ?, passwordSalt = ?, updatedAt = ? WHERE id = ?',
        [passwordHash, passwordSalt, now, userId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Pet Management Methods
  async savePetProfile(profile: PetProfile, userId: number): Promise<number> {
    await this.initialize();

    try {
      const now = new Date().toISOString();
      const {
        name, species, photos, breed, dateOfBirth, approximateAge, useApproximateAge,
        gender, colorMarkings, weight, weightUnit, height, heightUnit,
        microchipId, registrationNumber, insuranceProvider, insurancePolicyNumber,
        medicalConditions, medications, allergies, veterinarian, emergencyContact,
        personalityTraits, favoriteToys, favoriteActivities, exerciseNeeds,
        feedingSchedule, specialNotes
      } = profile;

      const result = db.runSync(
        `INSERT INTO pets (
          userId, name, species, photos, breed, dateOfBirth, approximateAge, useApproximateAge,
          gender, colorMarkings, weight, weightUnit, height, heightUnit,
          microchipId, registrationNumber, insuranceProvider, insurancePolicyNumber,
          medicalConditions, medications, allergies, veterinarian, emergencyContact,
          personalityTraits, favoriteToys, favoriteActivities, exerciseNeeds,
          feedingSchedule, specialNotes, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          name || null,
          species || null,
          photos ? JSON.stringify(photos) : null,
          breed || null,
          dateOfBirth ? dateOfBirth.toISOString() : null,
          approximateAge || null,
          useApproximateAge ? 1 : 0,
          gender || null,
          colorMarkings || null,
          weight || null,
          weightUnit || null,
          height || null,
          heightUnit || null,
          microchipId || null,
          registrationNumber || null,
          insuranceProvider || null,
          insurancePolicyNumber || null,
          medicalConditions ? JSON.stringify(medicalConditions) : null,
          medications ? JSON.stringify(medications) : null,
          allergies ? JSON.stringify(allergies) : null,
          veterinarian ? JSON.stringify(veterinarian) : null,
          emergencyContact ? JSON.stringify(emergencyContact) : null,
          personalityTraits ? JSON.stringify(personalityTraits) : null,
          favoriteToys ? JSON.stringify(favoriteToys) : null,
          favoriteActivities ? JSON.stringify(favoriteActivities) : null,
          exerciseNeeds || null,
          feedingSchedule || null,
          specialNotes || null,
          now
        ]
      );

      return result.lastInsertRowId;
    } catch (error) {
      throw error;
    }
  }

  async getAllPets(userId: number): Promise<StoredPetProfile[]> {
    await this.initialize();

    try {
      const results = db.getAllSync(
        'SELECT * FROM pets WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      ) as any[];

      return results.map(row => this.mapRowToPetProfile(row));
    } catch (error) {
      throw error;
    }
  }

  async getPetById(id: number, userId: number): Promise<StoredPetProfile | null> {
    await this.initialize();

    try {
      const result = db.getFirstSync(
        'SELECT * FROM pets WHERE id = ? AND userId = ?',
        [id, userId]
      ) as any;

      if (!result) return null;

      return this.mapRowToPetProfile(result);
    } catch (error) {
      throw error;
    }
  }

  async updatePetProfile(id: number, profile: Partial<PetProfile>, userId: number): Promise<void> {
    await this.initialize();

    try {
      const now = new Date().toISOString();
      const fields = Object.keys(profile);
      const values = Object.values(profile).map(value => {
        if (typeof value === 'object' && value !== null) {
          if (value instanceof Date) {
            return value.toISOString();
          }
          return JSON.stringify(value);
        }
        if (typeof value === 'boolean') {
          return value ? 1 : 0;
        }
        return value;
      });
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      db.runSync(
        `UPDATE pets SET ${setClause}, updatedAt = ? WHERE id = ? AND userId = ?`,
        [...values, now, id, userId] as (string | number)[]
      );
    } catch (error) {
      throw error;
    }
  }

  async deletePet(id: number, userId: number): Promise<void> {
    await this.initialize();

    try {
      db.runSync(
        'DELETE FROM pets WHERE id = ? AND userId = ?',
        [id, userId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Sharing Methods
  async createSharingToken(ownerUserId: number, expiresAt: Date): Promise<string> {
    await this.initialize();

    try {
      // Generate a secure random token
      const token = Array.from({ length: 64 }, () => 
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 62)]
      ).join('');

      db.runSync(
        `INSERT INTO sharing_tokens (token, ownerUserId, expiresAt)
         VALUES (?, ?, ?)`,
        [token, ownerUserId, expiresAt.toISOString()]
      );

      return token;
    } catch (error) {
      throw error;
    }
  }

  async validateSharingToken(token: string): Promise<SharingToken | null> {
    await this.initialize();

    try {
      const result = db.getFirstSync(
        `SELECT * FROM sharing_tokens 
         WHERE token = ? AND isActive = 1 AND datetime(expiresAt) > datetime('now')`,
        [token]
      ) as any;

      if (!result) return null;

      return {
        id: result.id,
        token: result.token,
        ownerUserId: result.ownerUserId,
        expiresAt: result.expiresAt,
        isActive: result.isActive === 1,
        createdAt: result.createdAt,
        lastUsedAt: result.lastUsedAt
      };
    } catch (error) {
      throw error;
    }
  }

  async grantSharedAccess(tokenId: number, guestUserId: number, ownerUserId: number): Promise<void> {
    await this.initialize();

    try {
      db.runSync(
        `INSERT OR REPLACE INTO shared_access (tokenId, guestUserId, ownerUserId)
         VALUES (?, ?, ?)`,
        [tokenId, guestUserId, ownerUserId]
      );

      // Update last used time for the token
      db.runSync(
        `UPDATE sharing_tokens SET lastUsedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [tokenId]
      );
    } catch (error) {
      throw error;
    }
  }

  async getSharedPetsForUser(guestUserId: number): Promise<SharedPetAccess[]> {
    await this.initialize();

    try {
      const results = db.getAllSync(
        `SELECT p.id as petId, p.name as petName, p.photos, p.species, p.breed,
                u.firstName as ownerFirstName, u.lastName as ownerLastName
         FROM shared_access sa
         JOIN sharing_tokens st ON sa.tokenId = st.id
         JOIN pets p ON p.userId = sa.ownerUserId
         JOIN users u ON u.id = sa.ownerUserId
         WHERE sa.guestUserId = ? AND sa.isActive = 1 AND st.isActive = 1
         AND datetime(st.expiresAt) > datetime('now')
         ORDER BY sa.accessGrantedAt DESC`,
        [guestUserId]
      ) as any[];

      return results.map(row => ({
        petId: row.petId,
        petName: row.petName,
        ownerFirstName: row.ownerFirstName,
        ownerLastName: row.ownerLastName,
        photos: row.photos ? JSON.parse(row.photos) : [],
        species: row.species,
        breed: row.breed
      }));
    } catch (error) {
      throw error;
    }
  }

  async getSharedPetDetails(petId: number, guestUserId: number): Promise<StoredPetProfile | null> {
    await this.initialize();

    try {
      const result = db.getFirstSync(
        `SELECT p.* FROM pets p
         JOIN shared_access sa ON p.userId = sa.ownerUserId
         JOIN sharing_tokens st ON sa.tokenId = st.id
         WHERE p.id = ? AND sa.guestUserId = ? AND sa.isActive = 1 AND st.isActive = 1
         AND datetime(st.expiresAt) > datetime('now')`,
        [petId, guestUserId]
      ) as any;

      if (!result) return null;

      // Update last accessed time
      db.runSync(
        `UPDATE shared_access SET lastAccessedAt = CURRENT_TIMESTAMP 
         WHERE guestUserId = ? AND ownerUserId = ?`,
        [guestUserId, result.userId]
      );

      return this.mapRowToPetProfile(result);
    } catch (error) {
      throw error;
    }
  }

  async getUserSharingTokens(ownerUserId: number): Promise<SharingToken[]> {
    await this.initialize();

    try {
      const results = db.getAllSync(
        `SELECT * FROM sharing_tokens 
         WHERE ownerUserId = ? AND isActive = 1 
         ORDER BY createdAt DESC`,
        [ownerUserId]
      ) as any[];

      return results.map(row => ({
        id: row.id,
        token: row.token,
        ownerUserId: row.ownerUserId,
        expiresAt: row.expiresAt,
        isActive: row.isActive === 1,
        createdAt: row.createdAt,
        lastUsedAt: row.lastUsedAt
      }));
    } catch (error) {
      throw error;
    }
  }

  async revokeSharingToken(tokenId: number, ownerUserId: number): Promise<void> {
    await this.initialize();

    try {
      db.runSync(
        `UPDATE sharing_tokens SET isActive = 0 WHERE id = ? AND ownerUserId = ?`,
        [tokenId, ownerUserId]
      );

      db.runSync(
        `UPDATE shared_access SET isActive = 0 WHERE tokenId = ?`,
        [tokenId]
      );
    } catch (error) {
      throw error;
    }
  }

  async getActiveSharedAccess(ownerUserId: number): Promise<SharedAccess[]> {
    await this.initialize();

    try {
      const results = db.getAllSync(
        `SELECT sa.*, u.firstName, u.lastName, u.email 
         FROM shared_access sa
         JOIN users u ON sa.guestUserId = u.id
         JOIN sharing_tokens st ON sa.tokenId = st.id
         WHERE sa.ownerUserId = ? AND sa.isActive = 1 AND st.isActive = 1
         AND datetime(st.expiresAt) > datetime('now')
         ORDER BY sa.accessGrantedAt DESC`,
        [ownerUserId]
      ) as any[];

      return results.map(row => ({
        id: row.id,
        tokenId: row.tokenId,
        guestUserId: row.guestUserId,
        ownerUserId: row.ownerUserId,
        accessGrantedAt: row.accessGrantedAt,
        lastAccessedAt: row.lastAccessedAt,
        isActive: row.isActive === 1
      }));
    } catch (error) {
      throw error;
    }
  }

  async revokeUserAccess(accessId: number, ownerUserId: number): Promise<void> {
    await this.initialize();

    try {
      db.runSync(
        `UPDATE shared_access SET isActive = 0 
         WHERE id = ? AND ownerUserId = ?`,
        [accessId, ownerUserId]
      );
    } catch (error) {
      throw error;
    }
  }

  async updateSharedAccessTime(tokenId: number, guestUserId: number): Promise<void> {
    await this.initialize();

    try {
      db.runSync(
        `UPDATE shared_access SET lastAccessedAt = CURRENT_TIMESTAMP 
         WHERE tokenId = ? AND guestUserId = ?`,
        [tokenId, guestUserId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Migration Methods
  async getUnmigratedPets(): Promise<StoredPetProfile[]> {
    await this.initialize();

    try {
      const results = db.getAllSync(
        'SELECT * FROM pets WHERE userId IS NULL OR userId = 0',
        []
      ) as any[];

      return results.map(row => this.mapRowToPetProfile(row));
    } catch (error) {
      throw error;
    }
  }

  async migratePetToUser(petId: number, userId: number): Promise<void> {
    await this.initialize();

    try {
      db.runSync(
        'UPDATE pets SET userId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [userId, petId]
      );
    } catch (error) {
      throw error;
    }
  }

  private mapRowToPetProfile(row: any): StoredPetProfile {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name || undefined,
      species: row.species,
      photos: row.photos ? JSON.parse(row.photos) : [],
      breed: row.breed,
      dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
      approximateAge: row.approximateAge,
      useApproximateAge: row.useApproximateAge === 1,
      gender: row.gender,
      colorMarkings: row.colorMarkings,
      weight: row.weight,
      weightUnit: row.weightUnit,
      height: row.height,
      heightUnit: row.heightUnit,
      microchipId: row.microchipId,
      registrationNumber: row.registrationNumber,
      insuranceProvider: row.insuranceProvider,
      insurancePolicyNumber: row.insurancePolicyNumber,
      medicalConditions: row.medicalConditions ? JSON.parse(row.medicalConditions) : [],
      medications: row.medications ? JSON.parse(row.medications) : [],
      allergies: row.allergies ? JSON.parse(row.allergies) : [],
      veterinarian: row.veterinarian ? JSON.parse(row.veterinarian) : undefined,
      emergencyContact: row.emergencyContact ? JSON.parse(row.emergencyContact) : undefined,
      personalityTraits: row.personalityTraits ? JSON.parse(row.personalityTraits) : [],
      favoriteToys: row.favoriteToys ? JSON.parse(row.favoriteToys) : [],
      favoriteActivities: row.favoriteActivities ? JSON.parse(row.favoriteActivities) : [],
      exerciseNeeds: row.exerciseNeeds,
      feedingSchedule: row.feedingSchedule,
      specialNotes: row.specialNotes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const databaseService = new DatabaseService();