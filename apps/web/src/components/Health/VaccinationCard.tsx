/**
 * Vaccination Card Component
 * Displays a single vaccination record with status
 * Supports both scheduled (future) and completed (past) vaccinations
 * Includes document display, edit, and delete functionality
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { invalidateVaccinationData } from '@/lib/cacheUtils';
import {
  Syringe,
  Calendar,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Paperclip,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  deleteVaccination,
  type VaccinationWithStatus,
} from '@tailtracker/shared-services';
import { AddToCalendarButton } from '@/components/AddToCalendarButton';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { createVaccinationCalendarEvent } from '@/utils/calendar';
import { usePreferences } from '@/contexts/PreferencesContext';

interface VaccinationCardProps {
  vaccination: VaccinationWithStatus;
  petId: string;
  petName?: string;
}

// Check if vaccination is scheduled (not yet administered)
const isScheduledVaccination = (vaccination: VaccinationWithStatus): boolean => {
  return !vaccination.administeredDate && !!vaccination.nextDueDate;
};

const getStatusConfig = (vaccination: VaccinationWithStatus) => {
  // Scheduled (future) vaccination - blue styling
  if (isScheduledVaccination(vaccination)) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: CalendarClock,
      label: 'Scheduled',
      cardBg: 'bg-gradient-to-r from-blue-50 to-white',
    };
  }

  // Completed vaccination with status-based styling
  switch (vaccination.status) {
    case 'overdue':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: AlertTriangle,
        label: 'Overdue',
        cardBg: '',
      };
    case 'due_soon':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        icon: Clock,
        label: 'Due Soon',
        cardBg: '',
      };
    case 'current':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: CheckCircle2,
        label: 'Current',
        cardBg: '',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: CheckCircle2,
        label: 'Complete',
        cardBg: '',
      };
  }
};

export const VaccinationCard = ({
  vaccination,
  petId,
  petName,
}: VaccinationCardProps) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { formatDate } = usePreferences();

  const isScheduled = isScheduledVaccination(vaccination);
  const config = getStatusConfig(vaccination);
  const StatusIcon = config.icon;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteVaccination(vaccination.id),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate all vaccination-related caches
        invalidateVaccinationData(petId);
        setShowDeleteModal(false);
      }
    },
  });

  // Check if there's a future due date for calendar button
  const hasUpcomingDueDate =
    vaccination.nextDueDate && new Date(vaccination.nextDueDate) > new Date();

  // Create calendar event if there's an upcoming due date
  const calendarEvent = hasUpcomingDueDate
    ? createVaccinationCalendarEvent(
        petName || 'Pet',
        vaccination.vaccineName,
        vaccination.nextDueDate!,
        vaccination.administeredDate,
        vaccination.clinicName,
        vaccination.nextDueStartTime,
        vaccination.nextDueEndTime
      )
    : null;

  // Format time for display
  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleEdit = () => {
    navigate(`/pets/${petId}/vaccinations/${vaccination.id}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Get documents array - check both documents array and legacy certificateUrl
  const documents = vaccination.documents || [];
  const hasDocuments = documents.length > 0 || !!vaccination.certificateUrl;

  return (
    <>
      <div
        className={`card p-4 hover:shadow-md transition-shadow border ${config.border} ${config.cardBg}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              {isScheduled ? (
                <CalendarClock className={`h-5 w-5 ${config.text}`} />
              ) : (
                <Syringe className={`h-5 w-5 ${config.text}`} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {vaccination.vaccineName}
              </h3>
              {/* Show batch number only for completed vaccinations */}
              {!isScheduled && vaccination.batchNumber && (
                <p className="text-sm text-gray-500">
                  Batch: {vaccination.batchNumber}
                </p>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
          >
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </span>
        </div>

        {/* SCHEDULED VACCINATION: Show appointment date/time prominently */}
        {isScheduled && vaccination.nextDueDate && (
          <div className="mt-3 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(vaccination.nextDueDate)}
                {vaccination.nextDueStartTime && vaccination.nextDueEndTime && (
                  <span className="font-normal ml-2">
                    {formatTime(vaccination.nextDueStartTime)} -{' '}
                    {formatTime(vaccination.nextDueEndTime)}
                  </span>
                )}
              </span>
            </div>
            {vaccination.clinicName && (
              <div className="flex items-center gap-2 text-blue-700 mt-1 text-sm">
                <Building2 className="h-4 w-4" />
                <span>{vaccination.clinicName}</span>
              </div>
            )}
          </div>
        )}

        {/* COMPLETED VACCINATION: Show administered date and next due date */}
        {!isScheduled && (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {vaccination.administeredDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Administered: {formatDate(vaccination.administeredDate)}</span>
              </div>
            )}
            {vaccination.nextDueDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  Next Due: {formatDate(vaccination.nextDueDate)}
                  {vaccination.daysUntilDue !== undefined && (
                    <span className={`ml-1 ${config.text}`}>
                      (
                      {vaccination.daysUntilDue > 0
                        ? `${vaccination.daysUntilDue} days`
                        : `${Math.abs(vaccination.daysUntilDue)} days ago`}
                      )
                    </span>
                  )}
                </span>
              </div>
            )}
            {vaccination.clinicName && (
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{vaccination.clinicName}</span>
              </div>
            )}
          </div>
        )}

        {/* Documents Section */}
        {hasDocuments && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {/* New documents array */}
              {documents.map((doc, index) => (
                <button
                  key={doc.url || index}
                  onClick={() => openDocument(doc.url)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title={`View ${doc.filename}`}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="max-w-[150px] truncate">{doc.filename}</span>
                  <Eye className="h-3.5 w-3.5" />
                </button>
              ))}
              {/* Legacy certificate URL support */}
              {!documents.length && vaccination.certificateUrl && (
                <button
                  onClick={() => openDocument(vaccination.certificateUrl!)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="View certificate"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>Certificate</span>
                  <Eye className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {vaccination.notes && (
          <p className="mt-3 text-sm text-gray-500 italic line-clamp-2">
            {vaccination.notes}
          </p>
        )}

        {/* Actions Row: Calendar button + Edit/Delete */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          {/* Calendar button (left side) */}
          <div>{calendarEvent && <AddToCalendarButton event={calendarEvent} size="sm" />}</div>

          {/* Edit & Delete buttons (right side) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Vaccination Record"
        message={`Are you sure you want to delete the "${vaccination.vaccineName}" vaccination record? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
