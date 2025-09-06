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

export interface VaccinationRecord {
  id?: number;
  pet_id: string;
  vaccine_name: string;
  date_administered: string;
  next_due_date?: string;
  batch_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MedicalRecord {
  id?: number;
  pet_id: string;
  record_type: 'checkup' | 'surgery' | 'emergency' | 'dental' | 'diagnostic' | 'other';
  title: string;
  date: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  follow_up_date?: string;
  cost?: number;
  notes?: string;
  attachments?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface LostPetAlert {
  id?: number;
  pet_id: string;
  is_active: boolean;
  lost_date: string;
  lost_location: string;
  last_seen_location?: string;
  description: string;
  reward_amount?: number;
  emergency_contacts: string[];
  special_instructions?: string;
  location_coordinates?: {
    latitude: number;
    longitude: number;
  };
  created_at?: string;
  updated_at?: string;
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
          registrationNumber TEXT,
          insuranceProvider TEXT,
          insurancePolicyNumber TEXT,
          medicalConditions TEXT,
          medications TEXT,
          allergies TEXT,
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

      // Create vaccination records table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS vaccination_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pet_id TEXT NOT NULL,
          vaccine_name TEXT NOT NULL,
          date_administered TEXT NOT NULL,
          next_due_date TEXT,
          batch_number TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create medical records table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS medical_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pet_id TEXT NOT NULL,
          record_type TEXT NOT NULL,
          title TEXT NOT NULL,
          date TEXT NOT NULL,
          diagnosis TEXT,
          treatment TEXT,
          medications TEXT,
          follow_up_date TEXT,
          cost REAL,
          notes TEXT,
          attachments TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create lost pet alerts table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS lost_pet_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pet_id TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          lost_date TEXT NOT NULL,
          lost_location TEXT NOT NULL,
          last_seen_location TEXT,
          description TEXT NOT NULL,
          reward_amount REAL,
          emergency_contacts TEXT NOT NULL,
          special_instructions TEXT,
          location_coordinates TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes for performance
      db.execSync(`
        CREATE INDEX IF NOT EXISTS idx_pets_userId ON pets (userId);
        CREATE INDEX IF NOT EXISTS idx_sharing_tokens_ownerUserId ON sharing_tokens (ownerUserId);
        CREATE INDEX IF NOT EXISTS idx_sharing_tokens_token ON sharing_tokens (token);
        CREATE INDEX IF NOT EXISTS idx_shared_access_guestUserId ON shared_access (guestUserId);
        CREATE INDEX IF NOT EXISTS idx_shared_access_ownerUserId ON shared_access (ownerUserId);
        CREATE INDEX IF NOT EXISTS idx_vaccination_records_pet_id ON vaccination_records (pet_id);
        CREATE INDEX IF NOT EXISTS idx_medical_records_pet_id ON medical_records (pet_id);
        CREATE INDEX IF NOT EXISTS idx_lost_pet_alerts_pet_id ON lost_pet_alerts (pet_id);
        CREATE INDEX IF NOT EXISTS idx_lost_pet_alerts_active ON lost_pet_alerts (is_active);
      `);

      this.initialized = true;
    } catch (_error) {
      console.error('Database initialization error:', _error);
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
        registrationNumber, insuranceProvider, insurancePolicyNumber,
        medicalConditions, medications, allergies, emergencyContact,
        personalityTraits, favoriteToys, favoriteActivities, exerciseNeeds,
        feedingSchedule, specialNotes
      } = profile;

      const result = db.runSync(
        `INSERT INTO pets (
          userId, name, species, photos, breed, dateOfBirth, approximateAge, useApproximateAge,
          gender, colorMarkings, weight, weightUnit, height, heightUnit,
          registrationNumber, insuranceProvider, insurancePolicyNumber,
          medicalConditions, medications, allergies, emergencyContact,
          personalityTraits, favoriteToys, favoriteActivities, exerciseNeeds,
          feedingSchedule, specialNotes, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          registrationNumber || null,
          insuranceProvider || null,
          insurancePolicyNumber || null,
          medicalConditions ? JSON.stringify(medicalConditions) : null,
          medications ? JSON.stringify(medications) : null,
          allergies ? JSON.stringify(allergies) : null,
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
    }
  }

  async deletePet(id: number, userId: number): Promise<void> {
    await this.initialize();

    try {
      db.runSync(
        'DELETE FROM pets WHERE id = ? AND userId = ?',
        [id, userId]
      );
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
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
    } catch (_error) {
      throw _error;
    }
  }

  async migratePetToUser(petId: number, userId: number): Promise<void> {
    await this.initialize();

    try {
      db.runSync(
        'UPDATE pets SET userId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [userId, petId]
      );
    } catch (_error) {
      throw _error;
    }
  }

  // Vaccination Records Methods
  async createVaccinationRecord(record: Omit<VaccinationRecord, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    await this.initialize();
    
    try {
      const now = new Date().toISOString();
      const result = db.runSync(
        `INSERT INTO vaccination_records (
          pet_id, vaccine_name, date_administered, next_due_date,
          batch_number, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          record.pet_id,
          record.vaccine_name,
          record.date_administered,
          record.next_due_date || null,
          record.batch_number || null,
          record.notes || null,
          now
        ]
      );
      return result.lastInsertRowId;
    } catch (_error) {
      throw _error;
    }
  }

  async getVaccinationRecords(petId: string): Promise<VaccinationRecord[]> {
    await this.initialize();
    
    try {
      const results = db.getAllSync(
        'SELECT * FROM vaccination_records WHERE pet_id = ? ORDER BY date_administered DESC',
        [petId]
      ) as any[];
      
      return results.map(row => ({
        id: row.id,
        pet_id: row.pet_id,
        vaccine_name: row.vaccine_name,
        date_administered: row.date_administered,
        next_due_date: row.next_due_date,
        batch_number: row.batch_number,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (_error) {
      throw _error;
    }
  }

  async updateVaccinationRecord(id: number, updates: Partial<VaccinationRecord>): Promise<void> {
    await this.initialize();
    
    try {
      const now = new Date().toISOString();
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const values = fields.map(field => updates[field as keyof VaccinationRecord]);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const params: any[] = [...values, now, id];
      db.runSync(
        `UPDATE vaccination_records SET ${setClause}, updated_at = ? WHERE id = ?`,
        params
      );
    } catch (_error) {
      throw _error;
    }
  }

  async deleteVaccinationRecord(id: number): Promise<void> {
    await this.initialize();
    
    try {
      db.runSync('DELETE FROM vaccination_records WHERE id = ?', [id]);
    } catch (_error) {
      throw _error;
    }
  }

  // Medical Records Methods
  async createMedicalRecord(record: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    await this.initialize();
    
    try {
      const now = new Date().toISOString();
      const result = db.runSync(
        `INSERT INTO medical_records (
          pet_id, record_type, title, date,
          diagnosis, treatment, medications, follow_up_date, cost, notes, attachments, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.pet_id,
          record.record_type,
          record.title,
          record.date,
          record.diagnosis || null,
          record.treatment || null,
          record.medications || null,
          record.follow_up_date || null,
          record.cost || null,
          record.notes || null,
          record.attachments ? JSON.stringify(record.attachments) : null,
          now
        ]
      );
      return result.lastInsertRowId;
    } catch (_error) {
      throw _error;
    }
  }

  async getMedicalRecords(petId: string, recordType?: string): Promise<MedicalRecord[]> {
    await this.initialize();
    
    try {
      let query = 'SELECT * FROM medical_records WHERE pet_id = ?';
      const params: any[] = [petId];
      
      if (recordType) {
        query += ' AND record_type = ?';
        params.push(recordType);
      }
      
      query += ' ORDER BY date DESC';
      
      const results = db.getAllSync(query, params) as any[];
      
      return results.map(row => ({
        id: row.id,
        pet_id: row.pet_id,
        record_type: row.record_type,
        title: row.title,
        date: row.date,
        diagnosis: row.diagnosis,
        treatment: row.treatment,
        medications: row.medications,
        follow_up_date: row.follow_up_date,
        cost: row.cost,
        notes: row.notes,
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (_error) {
      throw _error;
    }
  }

  async updateMedicalRecord(id: number, updates: Partial<MedicalRecord>): Promise<void> {
    await this.initialize();
    
    try {
      const now = new Date().toISOString();
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const values = fields.map(field => {
        const value = updates[field as keyof MedicalRecord];
        return field === 'attachments' && Array.isArray(value) ? JSON.stringify(value) : value;
      });
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const params: any[] = [...values, now, id];
      db.runSync(
        `UPDATE medical_records SET ${setClause}, updated_at = ? WHERE id = ?`,
        params
      );
    } catch (_error) {
      throw _error;
    }
  }

  async deleteMedicalRecord(id: number): Promise<void> {
    await this.initialize();
    
    try {
      db.runSync('DELETE FROM medical_records WHERE id = ?', [id]);
    } catch (_error) {
      throw _error;
    }
  }

  // Lost Pet Alert Methods
  async createLostPetAlert(alert: Omit<LostPetAlert, 'id' | 'created_at' | 'updated_at'>): Promise<LostPetAlert> {
    await this.initialize();
    
    try {
      const now = new Date().toISOString();
      const result = db.runSync(
        `INSERT INTO lost_pet_alerts (
          pet_id, is_active, lost_date, lost_location, last_seen_location,
          description, reward_amount, emergency_contacts, special_instructions,
          location_coordinates, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alert.pet_id,
          alert.is_active ? 1 : 0,
          alert.lost_date,
          alert.lost_location,
          alert.last_seen_location || null,
          alert.description,
          alert.reward_amount || null,
          JSON.stringify(alert.emergency_contacts),
          alert.special_instructions || null,
          alert.location_coordinates ? JSON.stringify(alert.location_coordinates) : null,
          now
        ]
      );
      
      const createdAlert = db.getFirstSync(
        'SELECT * FROM lost_pet_alerts WHERE id = ?',
        [result.lastInsertRowId]
      ) as any;
      
      return this.mapRowToLostPetAlert(createdAlert);
    } catch (_error) {
      throw _error;
    }
  }

  async getActiveLostPetAlert(petId: string): Promise<LostPetAlert | null> {
    await this.initialize();
    
    try {
      const result = db.getFirstSync(
        'SELECT * FROM lost_pet_alerts WHERE pet_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1',
        [petId]
      ) as any;
      
      return result ? this.mapRowToLostPetAlert(result) : null;
    } catch (_error) {
      throw _error;
    }
  }

  async getLostPetAlert(id: string): Promise<LostPetAlert | null> {
    await this.initialize();
    
    try {
      const result = db.getFirstSync(
        'SELECT * FROM lost_pet_alerts WHERE id = ?',
        [parseInt(id)]
      ) as any;
      
      return result ? this.mapRowToLostPetAlert(result) : null;
    } catch (_error) {
      throw _error;
    }
  }

  async updateLostPetAlert(id: string, updates: Partial<LostPetAlert>): Promise<LostPetAlert> {
    await this.initialize();
    
    try {
      const now = new Date().toISOString();
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const values = fields.map(field => {
        const value = updates[field as keyof LostPetAlert];
        if (field === 'emergency_contacts' && Array.isArray(value)) {
          return JSON.stringify(value);
        }
        if (field === 'location_coordinates' && value) {
          return JSON.stringify(value);
        }
        if (field === 'is_active' && typeof value === 'boolean') {
          return value ? 1 : 0;
        }
        return value;
      });
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const params: any[] = [...values, now, parseInt(id)];
      db.runSync(
        `UPDATE lost_pet_alerts SET ${setClause}, updated_at = ? WHERE id = ?`,
        params
      );
      
      const updatedAlert = db.getFirstSync(
        'SELECT * FROM lost_pet_alerts WHERE id = ?',
        [parseInt(id)]
      ) as any;
      
      return this.mapRowToLostPetAlert(updatedAlert);
    } catch (_error) {
      throw _error;
    }
  }

  async getAllActiveLostPetAlerts(): Promise<LostPetAlert[]> {
    await this.initialize();
    
    try {
      const results = db.getAllSync(
        'SELECT * FROM lost_pet_alerts WHERE is_active = 1 ORDER BY created_at DESC'
      ) as any[];
      
      return results.map(row => this.mapRowToLostPetAlert(row));
    } catch (_error) {
      throw _error;
    }
  }

  // Helper Methods
  async getPet(petId: string): Promise<any> {
    await this.initialize();
    
    try {
      const result = db.getFirstSync(
        'SELECT * FROM pets WHERE id = ?',
        [parseInt(petId)]
      ) as any;
      
      return result ? this.mapRowToPetProfile(result) : null;
    } catch (_error) {
      throw _error;
    }
  }

  async getCurrentUser(): Promise<any> {
    await this.initialize();
    
    // This would typically get the current user from auth state
    // For now, return a mock user - this should be implemented based on your auth system
    return {
      id: 1,
      email: 'user@example.com',
      display_name: 'User Name',
      phone: '+1234567890',
      emergency_contact: '+0987654321'
    };
  }

  private mapRowToLostPetAlert(row: any): LostPetAlert {
    return {
      id: row.id,
      pet_id: row.pet_id,
      is_active: row.is_active === 1,
      lost_date: row.lost_date,
      lost_location: row.lost_location,
      last_seen_location: row.last_seen_location,
      description: row.description,
      reward_amount: row.reward_amount,
      emergency_contacts: row.emergency_contacts ? JSON.parse(row.emergency_contacts) : [],
      special_instructions: row.special_instructions,
      location_coordinates: row.location_coordinates ? JSON.parse(row.location_coordinates) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
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
      registrationNumber: row.registrationNumber,
      insuranceProvider: row.insuranceProvider,
      insurancePolicyNumber: row.insurancePolicyNumber,
      medicalConditions: row.medicalConditions ? JSON.parse(row.medicalConditions) : [],
      medications: row.medications ? JSON.parse(row.medications) : [],
      allergies: row.allergies ? JSON.parse(row.allergies) : [],
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