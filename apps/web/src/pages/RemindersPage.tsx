/**
 * Reminders Page
 * Lists all pending reminders across all pets
 * Allows users to resolve or dismiss overdue scheduled appointments
 */

import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, RefreshCw, CheckCircle } from 'lucide-react';
import {
  getReminders,
  syncReminders,
  type ReminderWithPet,
} from '@tailtracker/shared-services';
import { ReminderCard } from '@/components/Health/ReminderCard';
import { useAuthStore } from '@/stores/authStore';
import { invalidateReminderData } from '@/lib/cacheUtils';

export const RemindersPage = () => {
  const { user } = useAuthStore();

  // Fetch all pending reminders
  // CRITICAL: Include user ID in query key to prevent cross-user cache pollution
  const {
    data: reminders = [],
    isLoading,
    refetch,
  } = useQuery<ReminderWithPet[]>({
    queryKey: ['reminders', user?.id],
    queryFn: () => getReminders(),
    enabled: !!user?.id,
  });

  // Sync reminders mutation
  const syncMutation = useMutation({
    mutationFn: syncReminders,
    onSuccess: (result) => {
      if (result.created > 0) {
        // Invalidate all reminder-related caches
        invalidateReminderData();
      }
    },
  });

  // Sync on mount (only when user is available)
  useEffect(() => {
    if (user?.id) {
      syncMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleManualSync = () => {
    syncMutation.mutate();
  };

  // Group reminders by pet
  const remindersByPet = reminders.reduce(
    (acc, reminder) => {
      const petName = reminder.petName;
      if (!acc[petName]) {
        acc[petName] = [];
      }
      acc[petName].push(reminder);
      return acc;
    },
    {} as Record<string, ReminderWithPet[]>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Reminders
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Overdue scheduled appointments that need attention
          </p>
        </div>
        <button
          onClick={handleManualSync}
          disabled={syncMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <RefreshCw
            className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`}
          />
          {syncMutation.isPending ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : reminders.length === 0 ? (
        /* Empty State */
        <div
          className="text-center py-12 rounded-xl"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <p
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            All caught up!
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>
            No pending reminders. All scheduled appointments are up to date.
          </p>
        </div>
      ) : (
        /* Reminders List */
        <div className="space-y-6">
          {Object.entries(remindersByPet).map(([petName, petReminders]) => (
            <div key={petName}>
              <h2
                className="text-lg font-semibold mb-3 flex items-center gap-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Bell className="h-5 w-5 text-amber-500" />
                {petName}
                <span
                  className="text-sm font-normal"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  ({petReminders.length} pending)
                </span>
              </h2>
              <div className="space-y-3">
                {petReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onResolve={() => refetch()}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sync Status */}
      {syncMutation.isSuccess && syncMutation.data && syncMutation.data.created > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Found {syncMutation.data.created} new overdue appointment
          {syncMutation.data.created !== 1 ? 's' : ''}.
        </div>
      )}
    </div>
  );
};
