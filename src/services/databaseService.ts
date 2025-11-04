/**
 * Database Service
 * Handles local database operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface PetProfile {
  id: string;
  name: string;
  species: string;
  [key: string]: any;
}

export const databaseService = {
  async getAllPetProfiles(): Promise<PetProfile[]> {
    try {
      const data = await AsyncStorage.getItem('petProfiles');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get pet profiles:', error);
      return [];
    }
  },

  async getPetProfile(id: string): Promise<PetProfile | null> {
    try {
      const profiles = await this.getAllPetProfiles();
      return profiles.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Failed to get pet profile:', error);
      return null;
    }
  },

  async savePetProfile(profile: PetProfile): Promise<void> {
    try {
      const profiles = await this.getAllPetProfiles();
      const existingIndex = profiles.findIndex(p => p.id === profile.id);

      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }

      await AsyncStorage.setItem('petProfiles', JSON.stringify(profiles));
    } catch (error) {
      console.error('Failed to save pet profile:', error);
      throw error;
    }
  },

  async deletePetProfile(id: string): Promise<void> {
    try {
      const profiles = await this.getAllPetProfiles();
      const filtered = profiles.filter(p => p.id !== id);
      await AsyncStorage.setItem('petProfiles', JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete pet profile:', error);
      throw error;
    }
  },

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  },

  // Additional methods used by other services
  async createPet(petData: any): Promise<PetProfile> {
    const newPet = { ...petData, id: Date.now().toString() };
    await this.savePetProfile(newPet);
    return newPet;
  },

  async updatePet(
    id: string,
    updates: Partial<PetProfile>
  ): Promise<PetProfile | null> {
    const existingPet = await this.getPetProfile(id);
    if (!existingPet) return null;

    const updatedPet = { ...existingPet, ...updates };
    await this.savePetProfile(updatedPet);
    return updatedPet;
  },

  async getPetById(id: string): Promise<PetProfile | null> {
    return this.getPetProfile(id);
  },

  async deletePetPhoto(petId: string, photoUrl: string): Promise<void> {
    const pet = await this.getPetProfile(petId);
    if (pet && pet.photos) {
      pet.photos = pet.photos.filter((url: string) => url !== photoUrl);
      await this.savePetProfile(pet);
    }
  },

  async updateUser(userId: string, userData: any): Promise<void> {
    // Mock implementation for user updates
    await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(userData));
  },

  async getUserByEmail(email: string): Promise<any | null> {
    // Mock implementation
    try {
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      return userList.find((u: any) => u.email === email) || null;
    } catch (error) {
      return null;
    }
  },

  async getUserByAuthId(authId: string): Promise<any | null> {
    // Mock implementation
    try {
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      return userList.find((u: any) => u.authId === authId) || null;
    } catch (error) {
      return null;
    }
  },

  // Additional methods needed by other services
  async getUserById(id: string): Promise<any | null> {
    try {
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      return userList.find((u: any) => u.id === id) || null;
    } catch (error) {
      return null;
    }
  },

  async createUser(userData: any): Promise<any> {
    const newUser = { ...userData, id: Date.now().toString() };
    try {
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      userList.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(userList));
      return newUser;
    } catch (error) {
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      const filtered = userList.filter((u: any) => u.id !== userId);
      await AsyncStorage.setItem('users', JSON.stringify(filtered));
    } catch (error) {
      throw error;
    }
  },

  async softDeletePet(petId: string): Promise<void> {
    const pet = await this.getPetProfile(petId);
    if (pet) {
      pet.deleted = true;
      pet.deletedAt = new Date().toISOString();
      await this.savePetProfile(pet);
    }
  },

  async createPetPhoto(petId: string, photoData: any): Promise<any> {
    const pet = await this.getPetProfile(petId);
    if (pet) {
      if (!pet.photos) pet.photos = [];
      const newPhoto = { ...photoData, id: Date.now().toString() };
      pet.photos.push(newPhoto);
      await this.savePetProfile(pet);
      return newPhoto;
    }
    throw new Error('Pet not found');
  },

  async createFamilyMembership(membershipData: any): Promise<any> {
    // Mock implementation for family membership
    const newMembership = { ...membershipData, id: Date.now().toString() };
    await AsyncStorage.setItem(
      `membership_${newMembership.id}`,
      JSON.stringify(newMembership)
    );
    return newMembership;
  },
};

// Export additional types and interfaces that are imported elsewhere
export interface DatabaseUser {
  id: string;
  authId: string;
  email: string;
  name?: string;
  [key: string]: any;
}

export interface DatabasePet extends PetProfile {
  identification_number?: string;
  color_markings?: string;
  height?: string;
  microchip_number?: string;
  current_medications?: string[];
  favorite_food?: string;
  weight_display?: string;
  height_display?: string;
  profile_photo_url?: string;
  favorite_activities?: string[];
  exercise_needs?: 'low' | 'moderate' | 'high';
  feeding_schedule?: string;
  special_diet_notes?: string;
  weight_kg?: number;
  allergies?: string[];
  medical_conditions?: string[];
  personality_traits?: string[];
  special_notes?: string;
}

export class DatabaseService {
  async getAllPetProfiles() {
    return databaseService.getAllPetProfiles();
  }
  async getUserPets(userId: string) {
    return databaseService.getAllPetProfiles();
  }
  async getPetProfile(id: string) {
    return databaseService.getPetProfile(id);
  }
  async savePetProfile(profile: PetProfile) {
    return databaseService.savePetProfile(profile);
  }
  async deletePetProfile(id: string) {
    return databaseService.deletePetProfile(id);
  }
  async clearAllData() {
    return databaseService.clearAllData();
  }
  async createPet(petData: any) {
    return databaseService.createPet(petData);
  }
  async updatePet(id: string, updates: any) {
    return databaseService.updatePet(id, updates);
  }
  async getPetById(id: string) {
    return databaseService.getPetById(id);
  }
  async deletePetPhoto(petId: string, photoUrl: string) {
    return databaseService.deletePetPhoto(petId, photoUrl);
  }
  async updateUser(userId: string, userData: any) {
    return databaseService.updateUser(userId, userData);
  }
  async getUserByEmail(email: string) {
    return databaseService.getUserByEmail(email);
  }
  async getUserByAuthId(authId: string) {
    return databaseService.getUserByAuthId(authId);
  }
  async getUserById(id: string) {
    return databaseService.getUserById(id);
  }
  async createUser(userData: any) {
    return databaseService.createUser(userData);
  }
  async deleteUser(userId: string) {
    return databaseService.deleteUser(userId);
  }
  async softDeletePet(petId: string) {
    return databaseService.softDeletePet(petId);
  }
  async createPetPhoto(petId: string, photoData: any) {
    return databaseService.createPetPhoto(petId, photoData);
  }
  async createFamilyMembership(membershipData: any) {
    return databaseService.createFamilyMembership(membershipData);
  }
}

export default databaseService;
