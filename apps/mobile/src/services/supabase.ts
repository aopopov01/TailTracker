/**
 * TailTracker Supabase Service Integration
 * Centralized Supabase client and database operations with full type safety
 *
 * This file now uses the shared Supabase client from @tailtracker/shared-services
 * with the native AsyncStorage adapter for React Native
 */

import { getSupabase, initializeSupabase } from '../lib/supabaseInit';

// Re-export shared services for gradual migration
export {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getSession,
  refreshSession,
  resetPassword,
  updatePassword,
  onAuthStateChange,
} from '@tailtracker/shared-services';

export {
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  upsertPetFromOnboarding,
  getPetCount,
} from '@tailtracker/shared-services';

export {
  getUserSubscription,
  getSubscriptionFeatures,
  canPerformAction,
  canAddPet,
  getMaxPetsAllowed,
  getMaxFamilyMembersAllowed,
  canAddFamilyMember,
  getMaxPhotosPerPet,
  canAddPhoto,
  canReportLostPet,
  canExportHealthRecords,
  getSubscriptionPlan,
  getAllPlans,
  upgradeSubscription,
  isOnTrial,
  getTrialDaysRemaining,
  SUBSCRIPTION_PLANS,
} from '@tailtracker/shared-services';

// Initialize Supabase on module load
initializeSupabase();

// Get the initialized client
export const supabase = getSupabase();

// Legacy helper functions (for backward compatibility during migration)
// These can be gradually replaced with shared service functions
export const supabaseHelpers = {
  // User operations - now using shared services internally
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: undefined,
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resendVerificationEmail(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {},
    });
    if (error) throw error;
    return data;
  },

  // Pet operations
  async getPets(userId: string) {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPetsBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('anonymous_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createPet(petData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('pets')
      .insert([petData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePet(petId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', petId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePet(petId: string) {
    const { error } = await supabase.from('pets').delete().eq('id', petId);

    if (error) throw error;
  },

  // Medical records (health records)
  async getHealthRecords(petId: string) {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createHealthRecord(recordData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('medical_records')
      .insert([recordData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Vaccination records
  async getVaccinations(petId: string) {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('pet_id', petId)
      .order('administered_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createVaccination(vaccinationData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('vaccinations')
      .insert([vaccinationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Lost pet alerts
  async getLostPetAlerts(
    location?: { latitude: number; longitude: number },
    radius: number = 10
  ) {
    if (location) {
      const { data, error } = await supabase.rpc('find_nearby_users', {
        center_lat: location.latitude,
        center_lng: location.longitude,
        radius_meters: radius * 1000,
      });
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('lost_pets')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  },

  // File upload
  async uploadFile(bucket: string, path: string, file: Blob) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  },

  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl;
  },

  // Realtime subscriptions
  subscribeToTable(
    table: string,
    callback: (payload: unknown) => void,
    filters?: Record<string, unknown>
  ) {
    const subscription = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...filters,
        },
        callback
      )
      .subscribe();

    return subscription;
  },

  // Helper for handling errors
  handleError(error: { code?: string; message?: string }) {
    console.error('Supabase error:', error);

    if (error.code === 'PGRST301') {
      throw new Error('Resource not found');
    } else if (error.code === 'PGRST116') {
      throw new Error('Access denied');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('An unexpected database error occurred');
    }
  },
};

// Export default client
export default supabase;
