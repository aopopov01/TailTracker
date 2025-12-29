/**
 * Reminder Service
 * Platform-agnostic reminder management for overdue scheduled appointments
 */

import type { ApiResult } from '@tailtracker/shared-types';
import { getSupabaseClient } from './supabase/client';

// ===================================
// TYPES
// ===================================

/**
 * Reminder status
 */
export type ReminderStatus = 'pending' | 'resolved' | 'dismissed';

/**
 * Source type for the reminder
 */
export type ReminderSourceType = 'vaccination' | 'medical_record';

/**
 * Reminder data as stored in the database (snake_case)
 */
export interface DatabaseReminder {
  id: string;
  pet_id: string;
  user_id: string;
  source_type: ReminderSourceType;
  source_id: string;
  title: string;
  description?: string | null;
  scheduled_date: string;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  status: ReminderStatus;
  resolved_at?: string | null;
  resolved_record_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Reminder data for frontend use (camelCase)
 */
export interface Reminder {
  id: string;
  petId: string;
  userId: string;
  sourceType: ReminderSourceType;
  sourceId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  status: ReminderStatus;
  resolvedAt?: string;
  resolvedRecordId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Reminder with pet name for display
 */
export interface ReminderWithPet extends Reminder {
  petName: string;
}

/**
 * Input data for creating a reminder
 */
export interface CreateReminderData {
  petId: string;
  sourceType: ReminderSourceType;
  sourceId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
}

// ===================================
// MAPPERS
// ===================================

/**
 * Map database format to frontend format
 */
const mapDatabaseToReminder = (dbReminder: DatabaseReminder): Reminder => ({
  id: dbReminder.id,
  petId: dbReminder.pet_id,
  userId: dbReminder.user_id,
  sourceType: dbReminder.source_type,
  sourceId: dbReminder.source_id,
  title: dbReminder.title,
  description: dbReminder.description ?? undefined,
  scheduledDate: dbReminder.scheduled_date,
  scheduledStartTime: dbReminder.scheduled_start_time ?? undefined,
  scheduledEndTime: dbReminder.scheduled_end_time ?? undefined,
  status: dbReminder.status,
  resolvedAt: dbReminder.resolved_at ?? undefined,
  resolvedRecordId: dbReminder.resolved_record_id ?? undefined,
  createdAt: dbReminder.created_at,
  updatedAt: dbReminder.updated_at,
});

/**
 * Map frontend format to database format for creation
 */
const mapReminderToDatabase = (
  data: CreateReminderData,
  userId: string
): Record<string, unknown> => ({
  pet_id: data.petId,
  user_id: userId,
  source_type: data.sourceType,
  source_id: data.sourceId,
  title: data.title,
  description: data.description ?? null,
  scheduled_date: data.scheduledDate,
  scheduled_start_time: data.scheduledStartTime ?? null,
  scheduled_end_time: data.scheduledEndTime ?? null,
  status: 'pending',
});

// ===================================
// SERVICE FUNCTIONS
// ===================================

/**
 * Get all pending reminders, optionally filtered by pet
 */
export const getReminders = async (petId?: string): Promise<ReminderWithPet[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  let query = supabase
    .from('reminders')
    .select(`
      *,
      pets!inner(name)
    `)
    .eq('user_id', user.user.id)
    .eq('status', 'pending')
    .order('scheduled_date', { ascending: true });

  if (petId) {
    query = query.eq('pet_id', petId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((item) => {
    const dbReminder = item as DatabaseReminder & { pets: { name: string } };
    return {
      ...mapDatabaseToReminder(dbReminder),
      petName: dbReminder.pets.name,
    };
  });
};

/**
 * Get a specific reminder by ID
 */
export const getReminderById = async (id: string): Promise<ReminderWithPet | null> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      pets!inner(name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching reminder:', error);
    return null;
  }

  if (!data) return null;

  const dbReminder = data as DatabaseReminder & { pets: { name: string } };
  return {
    ...mapDatabaseToReminder(dbReminder),
    petName: dbReminder.pets.name,
  };
};

/**
 * Get count of pending reminders for dashboard
 */
export const getPendingRemindersCount = async (): Promise<number> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return 0;

  const { count, error } = await supabase
    .from('reminders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.user.id)
    .eq('status', 'pending');

  if (error) {
    console.error('Error counting reminders:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Create a new reminder
 */
export const createReminder = async (
  data: CreateReminderData
): Promise<ApiResult<Reminder>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const dbData = mapReminderToDatabase(data, user.user.id);

    const { data: created, error } = await supabase
      .from('reminders')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: mapDatabaseToReminder(created as DatabaseReminder),
    };
  } catch (error) {
    console.error('Error creating reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create reminder',
    };
  }
};

/**
 * Resolve a reminder (mark as completed with the created record ID)
 */
export const resolveReminder = async (
  id: string,
  resolvedRecordId: string
): Promise<ApiResult<Reminder>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: updated, error } = await supabase
      .from('reminders')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_record_id: resolvedRecordId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: mapDatabaseToReminder(updated as DatabaseReminder),
    };
  } catch (error) {
    console.error('Error resolving reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve reminder',
    };
  }
};

/**
 * Dismiss a reminder (mark as dismissed without creating a record)
 */
export const dismissReminder = async (id: string): Promise<ApiResult<Reminder>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: updated, error } = await supabase
      .from('reminders')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: mapDatabaseToReminder(updated as DatabaseReminder),
    };
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss reminder',
    };
  }
};

/**
 * Delete a reminder
 */
export const deleteReminder = async (id: string): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete reminder',
    };
  }
};

/**
 * Sync reminders - Create reminders for overdue scheduled appointments
 * This should be called on Dashboard and Pet Detail page mount
 */
export const syncReminders = async (): Promise<{ created: number; errors: number }> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { created: 0, errors: 0 };

  const today = new Date().toISOString().split('T')[0];
  let created = 0;
  let errors = 0;

  try {
    // Get user's pets
    const { data: pets } = await supabase
      .from('pets')
      .select('id, name')
      .eq('user_id', user.user.id)
      .is('deleted_at', null);

    if (!pets?.length) return { created: 0, errors: 0 };

    const petIds = pets.map((p) => p.id);

    // Find overdue scheduled vaccinations (no administered_date, past next_due_date)
    const { data: overdueVaccinations } = await supabase
      .from('vaccinations')
      .select('id, pet_id, vaccine_name, next_due_date, next_due_start_time, next_due_end_time')
      .in('pet_id', petIds)
      .is('administered_date', null)
      .not('next_due_date', 'is', null)
      .lt('next_due_date', today);

    // Find overdue scheduled medical records (entry_type = 'scheduled', past follow_up_date)
    const { data: overdueMedical } = await supabase
      .from('medical_records')
      .select('id, pet_id, title, follow_up_date, follow_up_start_time, follow_up_end_time')
      .in('pet_id', petIds)
      .eq('entry_type', 'scheduled')
      .not('follow_up_date', 'is', null)
      .lt('follow_up_date', today);

    // Get existing reminders to avoid duplicates
    const { data: existingReminders } = await supabase
      .from('reminders')
      .select('source_type, source_id')
      .eq('user_id', user.user.id)
      .in('status', ['pending', 'resolved']);

    const existingSet = new Set(
      (existingReminders || []).map((r) => `${r.source_type}:${r.source_id}`)
    );

    // Create reminders for overdue vaccinations
    for (const vax of overdueVaccinations || []) {
      const key = `vaccination:${vax.id}`;
      if (existingSet.has(key)) continue;

      const result = await createReminder({
        petId: vax.pet_id,
        sourceType: 'vaccination',
        sourceId: vax.id,
        title: vax.vaccine_name,
        description: 'Scheduled vaccination was not completed',
        scheduledDate: vax.next_due_date,
        scheduledStartTime: vax.next_due_start_time ?? undefined,
        scheduledEndTime: vax.next_due_end_time ?? undefined,
      });

      if (result.success) {
        created++;
      } else {
        errors++;
      }
    }

    // Create reminders for overdue medical records
    for (const med of overdueMedical || []) {
      const key = `medical_record:${med.id}`;
      if (existingSet.has(key)) continue;

      const result = await createReminder({
        petId: med.pet_id,
        sourceType: 'medical_record',
        sourceId: med.id,
        title: med.title,
        description: 'Scheduled appointment was not completed',
        scheduledDate: med.follow_up_date,
        scheduledStartTime: med.follow_up_start_time ?? undefined,
        scheduledEndTime: med.follow_up_end_time ?? undefined,
      });

      if (result.success) {
        created++;
      } else {
        errors++;
      }
    }
  } catch (error) {
    console.error('Error syncing reminders:', error);
  }

  return { created, errors };
};

/**
 * Get reminder summary for a pet
 */
export interface ReminderSummary {
  pending: number;
  resolved: number;
  dismissed: number;
}

export const getReminderSummary = async (petId: string): Promise<ReminderSummary> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { pending: 0, resolved: 0, dismissed: 0 };

  const { data, error } = await supabase
    .from('reminders')
    .select('status')
    .eq('pet_id', petId)
    .eq('user_id', user.user.id);

  if (error || !data) return { pending: 0, resolved: 0, dismissed: 0 };

  return {
    pending: data.filter((r) => r.status === 'pending').length,
    resolved: data.filter((r) => r.status === 'resolved').length,
    dismissed: data.filter((r) => r.status === 'dismissed').length,
  };
};
