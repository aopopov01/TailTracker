/**
 * Supabase Realtime Updates Hook
 * Automatically invalidates React Query cache when database changes occur
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Helper to safely get property from realtime payload
type PayloadRecord = Record<string, unknown>;
const getPayloadId = (
  payload: { new: PayloadRecord | object; old: PayloadRecord | object },
  prop: string
): string | undefined => {
  const newRecord = payload.new as PayloadRecord;
  const oldRecord = payload.old as PayloadRecord;
  return (newRecord?.[prop] ?? oldRecord?.[prop]) as string | undefined;
};

/**
 * Subscribe to realtime database changes and auto-invalidate queries
 * Use this in App.tsx or main layout to enable live updates
 */
export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Skip if Supabase is not configured
    if (!supabase) {
      console.warn('Supabase not configured - realtime updates disabled');
      return;
    }

    // Create channel for database changes
    const channel = supabase
      .channel('db-changes')
      // Pet changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pets' },
        (payload) => {
          console.log('Pets table changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['pets'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });

          // If we have the pet ID, invalidate specific pet data
          const petId = getPayloadId(payload, 'id');
          if (petId) {
            queryClient.invalidateQueries({ queryKey: ['pet', petId] });
          }
        }
      )
      // Vaccination changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vaccinations' },
        (payload) => {
          console.log('Vaccinations table changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
          queryClient.invalidateQueries({ queryKey: ['reminders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });

          const petId = getPayloadId(payload, 'pet_id');
          if (petId) {
            queryClient.invalidateQueries({ queryKey: ['vaccinations', petId] });
          }
        }
      )
      // Medical record changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_records' },
        (payload) => {
          console.log('Medical records table changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['medical-records'] });
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
          queryClient.invalidateQueries({ queryKey: ['reminders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });

          const petId = getPayloadId(payload, 'pet_id');
          if (petId) {
            queryClient.invalidateQueries({ queryKey: ['medical-records', petId] });
          }
        }
      )
      // Reminder changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders' },
        (payload) => {
          console.log('Reminders table changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['reminders'] });
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });

          const petId = getPayloadId(payload, 'pet_id');
          if (petId) {
            queryClient.invalidateQueries({ queryKey: ['reminders', petId] });
          }
        }
      )
      // Subscription changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          console.log('Subscriptions table changed');
          queryClient.invalidateQueries({ queryKey: ['subscription'] });
          queryClient.invalidateQueries({ queryKey: ['user'] });
        }
      )
      // User changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          console.log('Users table changed');
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      )
      // Family sharing changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'family_members' },
        () => {
          console.log('Family members table changed');
          queryClient.invalidateQueries({ queryKey: ['family'] });
          queryClient.invalidateQueries({ queryKey: ['family-members'] });
        }
      )
      // Lost pet alerts
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lost_pet_alerts' },
        (payload) => {
          console.log('Lost pet alerts table changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['lost-pets'] });

          const petId = getPayloadId(payload, 'pet_id');
          if (petId) {
            queryClient.invalidateQueries({ queryKey: ['pet', petId] });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
}

/**
 * Subscribe to specific table changes
 * Use when you only need updates for a specific table
 */
export function useTableUpdates(
  tableName: string,
  queryKeys: string[][],
  enabled = true
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !supabase) return;

    const channel = supabase
      .channel(`table-${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        () => {
          queryKeys.forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tableName, queryKeys, enabled, queryClient]);
}
