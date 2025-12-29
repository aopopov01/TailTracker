/**
 * Medical Record Card Component
 * Displays a single medical record with type-specific styling
 * Supports both scheduled (future) and completed (past) records
 * Includes document display, edit, and delete functionality
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope,
  Scissors,
  AlertTriangle,
  Pill,
  FileText,
  Syringe,
  Smile,
  MoreHorizontal,
  Calendar,
  Building2,
  DollarSign,
  CalendarClock,
  CheckCircle2,
  Clock,
  Paperclip,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  deleteMedicalRecord,
  type MedicalRecord,
  type MedicalRecordType,
} from '@tailtracker/shared-services';
import { AddToCalendarButton } from '@/components/AddToCalendarButton';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { createMedicalFollowUpCalendarEvent } from '@/utils/calendar';
import { usePreferences } from '@/contexts/PreferencesContext';

interface MedicalRecordCardProps {
  record: MedicalRecord;
  petId: string;
  petName?: string;
}

// Check if record is a scheduled appointment (not yet completed)
const isScheduledRecord = (record: MedicalRecord): boolean => {
  // Scheduled records have a followUpDate but no dateOfRecord
  // OR they have a dateOfRecord in the future
  if (!record.dateOfRecord && record.followUpDate) {
    return true;
  }
  // Also check if the main date is in the future
  if (record.dateOfRecord) {
    const recordDate = new Date(record.dateOfRecord);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (recordDate > today) {
      return true;
    }
  }
  return false;
};

// Get styling config based on record type and scheduled status
const getRecordConfig = (record: MedicalRecord) => {
  const isScheduled = isScheduledRecord(record);

  // Scheduled records get blue styling regardless of type
  if (isScheduled) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: CalendarClock,
      label: 'Scheduled',
      cardBg: 'bg-gradient-to-r from-blue-50 to-white',
    };
  }

  // Completed records use type-specific styling
  return getTypeConfig(record.recordType);
};

const getTypeConfig = (type: MedicalRecordType) => {
  switch (type) {
    case 'checkup':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: Stethoscope,
        label: 'Checkup',
        cardBg: '',
      };
    case 'surgery':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        icon: Scissors,
        label: 'Surgery',
        cardBg: '',
      };
    case 'emergency':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: AlertTriangle,
        label: 'Emergency',
        cardBg: '',
      };
    case 'prescription':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: Pill,
        label: 'Prescription',
        cardBg: '',
      };
    case 'test_result':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: FileText,
        label: 'Test Result',
        cardBg: '',
      };
    case 'vaccination':
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        icon: Syringe,
        label: 'Vaccination',
        cardBg: '',
      };
    case 'dental':
      return {
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
        icon: Smile,
        label: 'Dental',
        cardBg: '',
      };
    case 'grooming':
      return {
        bg: 'bg-pink-50',
        text: 'text-pink-700',
        border: 'border-pink-200',
        icon: Scissors,
        label: 'Grooming',
        cardBg: '',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: MoreHorizontal,
        label: 'Other',
        cardBg: '',
      };
  }
};

const formatCurrency = (amount: number, currency?: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(amount);
};

export const MedicalRecordCard = ({
  record,
  petId,
  petName,
}: MedicalRecordCardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { formatDate } = usePreferences();

  const isScheduled = isScheduledRecord(record);
  const config = getRecordConfig(record);
  const TypeIcon = config.icon;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteMedicalRecord(record.id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['medicalRecords', petId] });
        queryClient.invalidateQueries({
          queryKey: ['medicalRecordSummary', petId],
        });
        setShowDeleteModal(false);
      }
    },
  });

  // Check if there's a future follow-up date for calendar button
  // For scheduled records, the appointment date IS the followUpDate
  const appointmentDate = isScheduled ? record.followUpDate : null;
  const hasUpcomingFollowUp =
    record.followUpDate && new Date(record.followUpDate) > new Date();

  // Create calendar event if there's an upcoming date
  const calendarEvent = hasUpcomingFollowUp
    ? createMedicalFollowUpCalendarEvent(
        petName || 'Pet',
        record.title,
        record.followUpDate!,
        record.dateOfRecord,
        record.diagnosis,
        record.clinicName,
        record.followUpStartTime,
        record.followUpEndTime
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
    navigate(`/pets/${petId}/medical-records/${record.id}/edit`);
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

  // Get documents array
  const documents = record.documents || [];
  const hasDocuments = documents.length > 0;

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
                <TypeIcon className={`h-5 w-5 ${config.text}`} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{record.title}</h3>
              {record.description && (
                <p className="text-sm text-gray-600 line-clamp-1">
                  {record.description}
                </p>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
          >
            <TypeIcon className="h-3 w-3" />
            {config.label}
          </span>
        </div>

        {/* SCHEDULED APPOINTMENT: Show appointment date/time prominently */}
        {isScheduled && appointmentDate && (
          <div className="mt-3 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(appointmentDate)}
                {record.followUpStartTime && record.followUpEndTime && (
                  <span className="font-normal ml-2">
                    {formatTime(record.followUpStartTime)} -{' '}
                    {formatTime(record.followUpEndTime)}
                  </span>
                )}
              </span>
            </div>
            {record.clinicName && (
              <div className="flex items-center gap-2 text-blue-700 mt-1 text-sm">
                <Building2 className="h-4 w-4" />
                <span>{record.clinicName}</span>
              </div>
            )}
          </div>
        )}

        {/* COMPLETED RECORD: Show visit date and details */}
        {!isScheduled && (
          <>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {record.dateOfRecord && (
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Visited: {formatDate(record.dateOfRecord)}</span>
                </div>
              )}
              {record.clinicName && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{record.clinicName}</span>
                </div>
              )}
              {record.cost !== undefined && record.cost > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>{formatCurrency(record.cost, record.currency)}</span>
                </div>
              )}
            </div>

            {(record.diagnosis || record.treatment) && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                {record.diagnosis && (
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Diagnosis:</span>{' '}
                    {record.diagnosis}
                  </p>
                )}
                {record.treatment && (
                  <p className="text-gray-600 mt-1">
                    <span className="font-medium text-gray-700">Treatment:</span>{' '}
                    {record.treatment}
                  </p>
                )}
              </div>
            )}

            {/* Show follow-up date for completed records that have a future follow-up */}
            {record.followUpDate && !isScheduled && (
              <div className="mt-3 p-2 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Follow-up scheduled: {formatDate(record.followUpDate)}</span>
              </div>
            )}
          </>
        )}

        {/* Documents Section */}
        {hasDocuments && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
        )}

        {record.notes && (
          <p className="mt-3 text-sm text-gray-500 italic line-clamp-2">
            {record.notes}
          </p>
        )}

        {/* Actions Row: Calendar button + Edit/Delete */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          {/* Calendar button (left side) */}
          <div>
            {calendarEvent && <AddToCalendarButton event={calendarEvent} size="sm" />}
          </div>

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
        title="Delete Medical Record"
        message={`Are you sure you want to delete "${record.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
