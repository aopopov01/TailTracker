/**
 * Reminder Card Component
 * Displays a single reminder for an overdue scheduled appointment
 * Supports resolve (create past record) and dismiss actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Bell,
  Calendar,
  Clock,
  Syringe,
  Stethoscope,
  CheckCircle2,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  dismissReminder,
  type ReminderWithPet,
} from '@tailtracker/shared-services';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { usePreferences } from '@/contexts/PreferencesContext';
import { invalidateReminderData } from '@/lib/cacheUtils';

interface ReminderCardProps {
  reminder: ReminderWithPet;
  onResolve?: () => void;
}

const formatTime = (time: string | undefined) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const getSourceIcon = (sourceType: 'vaccination' | 'medical_record') => {
  return sourceType === 'vaccination' ? Syringe : Stethoscope;
};

const getSourceLabel = (sourceType: 'vaccination' | 'medical_record') => {
  return sourceType === 'vaccination' ? 'Vaccination' : 'Medical Record';
};

export const ReminderCard = ({ reminder, onResolve }: ReminderCardProps) => {
  const navigate = useNavigate();
  const [showDismissModal, setShowDismissModal] = useState(false);
  const { formatDate } = usePreferences();

  const SourceIcon = getSourceIcon(reminder.sourceType);

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: () => dismissReminder(reminder.id),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate all reminder-related caches
        invalidateReminderData();
        setShowDismissModal(false);
      }
    },
  });

  const handleResolve = () => {
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
    onResolve?.();
  };

  const handleDismiss = () => {
    setShowDismissModal(true);
  };

  const confirmDismiss = () => {
    dismissMutation.mutate();
  };

  const handleViewDetails = () => {
    navigate(`/reminders/${reminder.id}`);
  };

  // Calculate days overdue
  const scheduledDate = new Date(reminder.scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysOverdue = Math.floor(
    (today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <div
        className="card p-4 hover:shadow-md transition-shadow border border-amber-200 bg-gradient-to-r from-amber-50 to-white cursor-pointer"
        onClick={handleViewDetails}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
              <p className="text-sm text-gray-600">{reminder.petName}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <SourceIcon className="h-3 w-3" />
            {getSourceLabel(reminder.sourceType)}
          </span>
        </div>

        {/* Scheduled Date Info */}
        <div className="mt-3 p-3 bg-amber-100/50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 text-amber-800 font-medium">
            <Calendar className="h-4 w-4" />
            <span>
              Was scheduled for {formatDate(reminder.scheduledDate)}
              {reminder.scheduledStartTime && reminder.scheduledEndTime && (
                <span className="font-normal ml-2">
                  {formatTime(reminder.scheduledStartTime)} -{' '}
                  {formatTime(reminder.scheduledEndTime)}
                </span>
              )}
            </span>
          </div>
          {daysOverdue > 0 && (
            <div className="flex items-center gap-2 text-amber-700 mt-1 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
              </span>
            </div>
          )}
        </div>

        {reminder.description && (
          <p className="mt-3 text-sm text-gray-500 italic">
            {reminder.description}
          </p>
        )}

        {/* Actions Row */}
        <div
          className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Resolve button (primary action) */}
          <button
            onClick={handleResolve}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Create Record
          </button>

          <div className="flex items-center gap-2">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Dismiss
            </button>
            {/* View details */}
            <button
              onClick={handleViewDetails}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            >
              Details
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
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
    </>
  );
};
