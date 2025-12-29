/**
 * Reminder Detail Page
 * Shows full details of a reminder and allows resolution or dismissal
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Clock,
  Syringe,
  Stethoscope,
  CheckCircle2,
  X,
  PawPrint,
} from 'lucide-react';
import {
  getReminderById,
  dismissReminder,
  type ReminderWithPet,
} from '@tailtracker/shared-services';
import { ConfirmationModal } from '@/components/ConfirmationModal';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (time: string | undefined) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const ReminderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDismissModal, setShowDismissModal] = useState(false);

  // Fetch reminder details
  const { data: reminder, isLoading } = useQuery<ReminderWithPet | null>({
    queryKey: ['reminder', id],
    queryFn: () => getReminderById(id!),
    enabled: !!id,
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: () => dismissReminder(id!),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
        queryClient.invalidateQueries({ queryKey: ['pendingRemindersCount'] });
        navigate('/reminders');
      }
    },
  });

  const handleResolve = () => {
    if (!reminder) return;

    // Navigate to the appropriate Add form with pre-filled data
    if (reminder.sourceType === 'vaccination') {
      navigate(
        `/pets/${reminder.petId}/vaccinations/new?type=past&reminderId=${reminder.id}&prefill=${encodeURIComponent(reminder.title)}`
      );
    } else {
      navigate(
        `/pets/${reminder.petId}/medical-records/new?type=past&reminderId=${reminder.id}&prefill=${encodeURIComponent(reminder.title)}`
      );
    }
  };

  const handleDismiss = () => {
    setShowDismissModal(true);
  };

  const confirmDismiss = () => {
    dismissMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!reminder) {
    return (
      <div className="max-w-2xl mx-auto">
        <div
          className="text-center py-12 rounded-xl"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Reminder not found
          </p>
          <p style={{ color: 'var(--color-text-muted)' }} className="mb-4">
            This reminder may have been resolved or dismissed.
          </p>
          <Link
            to="/reminders"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reminders
          </Link>
        </div>
      </div>
    );
  }

  // Calculate days overdue
  const scheduledDate = new Date(reminder.scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysOverdue = Math.floor(
    (today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const SourceIcon =
    reminder.sourceType === 'vaccination' ? Syringe : Stethoscope;
  const sourceLabel =
    reminder.sourceType === 'vaccination' ? 'Vaccination' : 'Medical Record';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <Link
        to="/reminders"
        className="inline-flex items-center gap-2 mb-6 text-sm font-medium hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reminders
      </Link>

      {/* Main Card */}
      <div
        className="rounded-xl p-6 border border-amber-200 bg-gradient-to-br from-amber-50 to-white"
        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-amber-100">
            <Bell className="h-8 w-8 text-amber-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{reminder.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                <SourceIcon className="h-3 w-3" />
                {sourceLabel}
              </span>
              {daysOverdue > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <Clock className="h-3 w-3" />
                  {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pet Info */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <PawPrint className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pet</p>
              <p className="font-semibold text-gray-900">{reminder.petName}</p>
            </div>
          </div>
        </div>

        {/* Scheduled Date Info */}
        <div className="mb-6 p-4 bg-amber-100/50 rounded-lg border border-amber-200">
          <h3 className="font-medium text-amber-800 mb-2">Scheduled Appointment</h3>
          <div className="flex items-center gap-2 text-amber-800">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{formatDate(reminder.scheduledDate)}</span>
          </div>
          {reminder.scheduledStartTime && reminder.scheduledEndTime && (
            <div className="flex items-center gap-2 text-amber-700 mt-1">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime(reminder.scheduledStartTime)} -{' '}
                {formatTime(reminder.scheduledEndTime)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {reminder.description && (
          <div className="mb-6">
            <h3
              className="font-medium mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Description
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {reminder.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-amber-200">
          <button
            onClick={handleResolve}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            <CheckCircle2 className="h-5 w-5" />
            Create Past Record
          </button>
          <button
            onClick={handleDismiss}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
            Dismiss
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-4 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
          Creating a past record will mark this appointment as completed.
          <br />
          Dismissing will remove this reminder without creating a record.
        </p>
      </div>

      {/* Dismiss Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDismissModal}
        onClose={() => setShowDismissModal(false)}
        onConfirm={confirmDismiss}
        title="Dismiss Reminder"
        message={`Are you sure you want to dismiss this reminder for "${reminder.title}"? This will mark the reminder as dismissed without creating a record.`}
        confirmText="Dismiss"
        cancelText="Cancel"
        variant="warning"
        isLoading={dismissMutation.isPending}
      />
    </div>
  );
};
