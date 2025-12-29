/**
 * Vaccination Service
 * Platform-agnostic vaccination management operations
 */

import type { ApiResult } from '@tailtracker/shared-types';
import { getSupabaseClient } from './supabase/client';

// ===================================
// TYPES
// ===================================

/**
 * Entry type for vaccinations - determines which form fields to show in edit mode
 */
export type VaccinationEntryType = 'past' | 'scheduled';

/**
 * Document metadata for vaccination documents
 */
export interface VaccinationDocument {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

/**
 * Vaccination data as stored in the database
 * NOTE: Must match actual Supabase vaccinations table schema
 */
export interface DatabaseVaccination {
  id: string;
  pet_id: string;
  vaccine_name: string;
  batch_number?: string | null;
  administered_date?: string | null; // NULL for scheduled vaccinations
  next_due_date?: string | null;
  next_due_start_time?: string | null;
  next_due_end_time?: string | null;
  veterinarian_id?: string | null;
  administered_by?: string | null;
  clinic_name?: string | null;
  notes?: string | null;
  certificate_url?: string | null;
  documents?: VaccinationDocument[] | null;
  reminder_sent?: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  anonymous_session_id?: string | null;
  entry_type?: 'past' | 'scheduled' | null;
}

/**
 * Vaccination data for frontend use (camelCase)
 */
export interface Vaccination {
  id: string;
  petId: string;
  vaccineName: string;
  batchNumber?: string;
  administeredDate?: string; // Optional for scheduled vaccinations
  nextDueDate?: string;
  nextDueStartTime?: string;
  nextDueEndTime?: string;
  veterinarianId?: string;
  administeredBy?: string;
  clinicName?: string;
  notes?: string;
  certificateUrl?: string;
  documents?: VaccinationDocument[];
  reminderSent?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  entryType?: VaccinationEntryType;
}

/**
 * Input data for creating/updating a vaccination
 */
export interface VaccinationData {
  petId: string;
  vaccineName: string;
  batchNumber?: string;
  administeredDate?: string; // Optional for scheduled vaccinations
  nextDueDate?: string;
  nextDueStartTime?: string;
  nextDueEndTime?: string;
  veterinarianId?: string;
  administeredBy?: string;
  clinicName?: string;
  notes?: string;
  certificateUrl?: string;
  documents?: VaccinationDocument[];
  entryType?: VaccinationEntryType;
}

/**
 * Vaccination status based on due date
 */
export type VaccinationStatus = 'current' | 'due_soon' | 'overdue' | 'complete';

export interface VaccinationWithStatus extends Vaccination {
  status: VaccinationStatus;
  daysUntilDue?: number;
}

// ===================================
// MAPPERS
// ===================================

/**
 * Map database format to frontend format
 */
const mapDatabaseToVaccination = (dbVax: DatabaseVaccination): Vaccination => ({
  id: dbVax.id,
  petId: dbVax.pet_id,
  vaccineName: dbVax.vaccine_name,
  batchNumber: dbVax.batch_number ?? undefined,
  administeredDate: dbVax.administered_date ?? undefined,
  nextDueDate: dbVax.next_due_date ?? undefined,
  nextDueStartTime: dbVax.next_due_start_time ?? undefined,
  nextDueEndTime: dbVax.next_due_end_time ?? undefined,
  veterinarianId: dbVax.veterinarian_id ?? undefined,
  administeredBy: dbVax.administered_by ?? undefined,
  clinicName: dbVax.clinic_name ?? undefined,
  notes: dbVax.notes ?? undefined,
  certificateUrl: dbVax.certificate_url ?? undefined,
  documents: dbVax.documents ?? undefined,
  reminderSent: dbVax.reminder_sent ?? false,
  createdBy: dbVax.created_by ?? undefined,
  createdAt: dbVax.created_at,
  updatedAt: dbVax.updated_at,
  entryType: dbVax.entry_type ?? undefined,
});

/**
 * Map frontend format to database format
 * Only includes columns that exist in the vaccinations table
 */
const mapVaccinationToDatabase = (
  data: VaccinationData
): Record<string, unknown> => ({
  pet_id: data.petId,
  vaccine_name: data.vaccineName,
  batch_number: data.batchNumber ?? null,
  administered_date: data.administeredDate ?? null, // NULL for scheduled vaccinations
  next_due_date: data.nextDueDate ?? null,
  next_due_start_time: data.nextDueStartTime ?? null,
  next_due_end_time: data.nextDueEndTime ?? null,
  veterinarian_id: data.veterinarianId ?? null,
  administered_by: data.administeredBy ?? null,
  clinic_name: data.clinicName ?? null,
  notes: data.notes ?? null,
  certificate_url: data.certificateUrl ?? null,
  documents: data.documents ?? [],
  entry_type: data.entryType ?? 'past',
});

/**
 * Calculate vaccination status based on next due date
 */
const calculateVaccinationStatus = (
  nextDueDate?: string
): { status: VaccinationStatus; daysUntilDue?: number } => {
  if (!nextDueDate) {
    return { status: 'complete' };
  }

  const now = new Date();
  const dueDate = new Date(nextDueDate);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', daysUntilDue: diffDays };
  }
  if (diffDays <= 30) {
    return { status: 'due_soon', daysUntilDue: diffDays };
  }
  return { status: 'current', daysUntilDue: diffDays };
};

// ===================================
// SERVICE FUNCTIONS
// ===================================

/**
 * Get all vaccinations for a pet
 */
export const getVaccinations = async (petId: string): Promise<Vaccination[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('vaccinations')
    .select('*')
    .eq('pet_id', petId)
    .order('administered_date', { ascending: false });

  if (error) throw error;

  return (data || []).map((dbVax) =>
    mapDatabaseToVaccination(dbVax as DatabaseVaccination)
  );
};

/**
 * Get all vaccinations for a pet with status information
 */
export const getVaccinationsWithStatus = async (
  petId: string
): Promise<VaccinationWithStatus[]> => {
  const vaccinations = await getVaccinations(petId);

  return vaccinations.map((vax) => {
    const { status, daysUntilDue } = calculateVaccinationStatus(vax.nextDueDate);
    return { ...vax, status, daysUntilDue };
  });
};

/**
 * Get a specific vaccination by ID
 */
export const getVaccinationById = async (
  id: string
): Promise<Vaccination | null> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('vaccinations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching vaccination:', error);
    return null;
  }

  return data ? mapDatabaseToVaccination(data as DatabaseVaccination) : null;
};

/**
 * Create a new vaccination record
 */
export const createVaccination = async (
  data: VaccinationData
): Promise<ApiResult<Vaccination>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify the user owns this pet
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('id', data.petId)
      .single();

    if (petError || !pet) {
      return { success: false, error: 'Pet not found or access denied' };
    }

    const dbData = mapVaccinationToDatabase(data);

    const { data: created, error } = await supabase
      .from('vaccinations')
      .insert(dbData as Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: mapDatabaseToVaccination(created as DatabaseVaccination),
    };
  } catch (error) {
    console.error('Error creating vaccination:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create vaccination',
    };
  }
};

/**
 * Update an existing vaccination record
 */
export const updateVaccination = async (
  id: string,
  data: Partial<VaccinationData>
): Promise<ApiResult<Vaccination>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Build update object with only provided fields
    // Only includes columns that exist in the vaccinations table
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.vaccineName !== undefined)
      updateData.vaccine_name = data.vaccineName;
    if (data.batchNumber !== undefined)
      updateData.batch_number = data.batchNumber;
    if (data.administeredDate !== undefined)
      updateData.administered_date = data.administeredDate;
    if (data.nextDueDate !== undefined)
      updateData.next_due_date = data.nextDueDate;
    if (data.nextDueStartTime !== undefined)
      updateData.next_due_start_time = data.nextDueStartTime;
    if (data.nextDueEndTime !== undefined)
      updateData.next_due_end_time = data.nextDueEndTime;
    if (data.veterinarianId !== undefined)
      updateData.veterinarian_id = data.veterinarianId;
    if (data.administeredBy !== undefined)
      updateData.administered_by = data.administeredBy;
    if (data.clinicName !== undefined)
      updateData.clinic_name = data.clinicName;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.certificateUrl !== undefined)
      updateData.certificate_url = data.certificateUrl;
    if (data.documents !== undefined)
      updateData.documents = data.documents;
    if (data.entryType !== undefined)
      updateData.entry_type = data.entryType;

    const { data: updated, error } = await supabase
      .from('vaccinations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: mapDatabaseToVaccination(updated as DatabaseVaccination),
    };
  } catch (error) {
    console.error('Error updating vaccination:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update vaccination',
    };
  }
};

/**
 * Delete a vaccination record
 */
export const deleteVaccination = async (
  id: string
): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase.from('vaccinations').delete().eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete vaccination',
    };
  }
};

/**
 * Get upcoming vaccinations (due within specified days)
 */
export const getUpcomingVaccinations = async (
  petId: string,
  daysAhead: number = 30
): Promise<VaccinationWithStatus[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('vaccinations')
    .select('*')
    .eq('pet_id', petId)
    .not('next_due_date', 'is', null)
    .lte('next_due_date', futureDate.toISOString())
    .order('next_due_date', { ascending: true });

  if (error) throw error;

  return (data || []).map((dbVax) => {
    const vax = mapDatabaseToVaccination(dbVax as DatabaseVaccination);
    const { status, daysUntilDue } = calculateVaccinationStatus(vax.nextDueDate);
    return { ...vax, status, daysUntilDue };
  });
};

/**
 * Get overdue vaccinations
 */
export const getOverdueVaccinations = async (
  petId: string
): Promise<VaccinationWithStatus[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const today = new Date().toISOString();

  const { data, error } = await supabase
    .from('vaccinations')
    .select('*')
    .eq('pet_id', petId)
    .not('next_due_date', 'is', null)
    .lt('next_due_date', today)
    .order('next_due_date', { ascending: true });

  if (error) throw error;

  return (data || []).map((dbVax) => {
    const vax = mapDatabaseToVaccination(dbVax as DatabaseVaccination);
    const { status, daysUntilDue } = calculateVaccinationStatus(vax.nextDueDate);
    return { ...vax, status, daysUntilDue };
  });
};

/**
 * Get vaccination summary for a pet
 */
export interface VaccinationSummary {
  total: number;
  current: number;
  dueSoon: number;
  overdue: number;
}

export const getVaccinationSummary = async (
  petId: string
): Promise<VaccinationSummary> => {
  const vaccinations = await getVaccinationsWithStatus(petId);

  return {
    total: vaccinations.length,
    current: vaccinations.filter((v) => v.status === 'current').length,
    dueSoon: vaccinations.filter((v) => v.status === 'due_soon').length,
    overdue: vaccinations.filter((v) => v.status === 'overdue').length,
  };
};
