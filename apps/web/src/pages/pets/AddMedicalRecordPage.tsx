/**
 * Add Medical Record Page
 * Form to add a new medical record for a pet
 * Supports both past records and scheduled appointments
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  Stethoscope,
  Pill,
  DollarSign,
  Loader2,
  Save,
  CalendarClock,
} from 'lucide-react';
import {
  createMedicalRecord,
  getPetById,
  getSupabaseClient,
  type MedicalRecordData,
  type MedicalRecordType,
  type MedicalRecordDocument,
} from '@tailtracker/shared-services';
import { DocumentUpload, type DocumentMetadata } from '@/components/DocumentUpload';
import { invalidateMedicalRecordData } from '@/lib/cacheUtils';

const RECORD_TYPES: { value: MedicalRecordType; label: string }[] = [
  { value: 'checkup', label: 'Checkup' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'test_result', label: 'Test Result' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'dental', label: 'Dental' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'other', label: 'Other' },
];

// Appointment types for scheduled mode - includes ALL record types
const APPOINTMENT_TYPES: { value: MedicalRecordType; label: string }[] = [
  { value: 'checkup', label: 'Checkup' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'test_result', label: 'Test Result' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'dental', label: 'Dental' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'other', label: 'Other' },
];

export const AddMedicalRecordPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Determine form mode from query params
  const searchParams = new URLSearchParams(location.search);
  const formMode = searchParams.get('type') === 'scheduled' ? 'scheduled' : 'past';
  const isScheduledMode = formMode === 'scheduled';

  // Get tomorrow's date for scheduled mode default
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Fetch pet details for header
  const { data: pet } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => getPetById(id!),
    enabled: !!id,
  });

  // Form state - initialized differently based on mode
  const [formData, setFormData] = useState({
    recordType: 'checkup' as MedicalRecordType,
    title: '',
    description: '',
    // Past mode: dateOfRecord defaults to today
    dateOfRecord: isScheduledMode ? '' : new Date().toISOString().split('T')[0],
    // Scheduled mode: scheduled date defaults to tomorrow
    scheduledDate: isScheduledMode ? getTomorrowDate() : '',
    scheduledStartTime: '09:00',
    scheduledEndTime: '10:00',
    clinicName: '',
    diagnosis: '',
    treatment: '',
    // Follow-up for past records
    followUpDate: '',
    followUpStartTime: '09:00',
    followUpEndTime: '10:00',
    cost: '',
    currency: 'EUR',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // User ID for document upload
  const [userId, setUserId] = useState<string>('');

  // Documents state (for past mode only)
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);

  // Fetch user ID on mount
  useEffect(() => {
    const fetchUserId = async () => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUserId();
  }, []);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: MedicalRecordData) => createMedicalRecord(data),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate all medical record-related caches including calendar/reminders/dashboard
        invalidateMedicalRecordData(id);
        queryClient.invalidateQueries({ queryKey: ['medicalRecordSummary', id] });
        navigate(`/pets/${id}/medical-records`);
      } else {
        setErrors({ submit: result.error || 'Failed to create medical record' });
      }
    },
    onError: (error) => {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to create medical record',
      });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (isScheduledMode) {
      // Scheduled mode validation
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = 'Scheduled date is required';
      }
      if (!formData.scheduledStartTime) {
        newErrors.scheduledStartTime = 'Start time is required';
      }
      if (!formData.scheduledEndTime) {
        newErrors.scheduledEndTime = 'End time is required';
      }
      // Validate end time is after start time
      if (formData.scheduledStartTime && formData.scheduledEndTime) {
        if (formData.scheduledEndTime <= formData.scheduledStartTime) {
          newErrors.scheduledEndTime = 'End time must be after start time';
        }
      }
    } else {
      // Past mode validation
      if (!formData.dateOfRecord) {
        newErrors.dateOfRecord = 'Date is required';
      }

      if (formData.cost && isNaN(parseFloat(formData.cost))) {
        newErrors.cost = 'Cost must be a valid number';
      }

      // Validate end time is after start time when follow-up is set
      if (formData.followUpDate && formData.followUpStartTime && formData.followUpEndTime) {
        if (formData.followUpEndTime <= formData.followUpStartTime) {
          newErrors.followUpEndTime = 'End time must be after start time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !id) return;

    let data: MedicalRecordData;

    if (isScheduledMode) {
      // Scheduled appointment - use scheduled date as dateOfRecord (required by DB)
      // The entry_type='scheduled' distinguishes this from past records
      data = {
        petId: id,
        recordType: formData.recordType,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        // Use scheduled date as dateOfRecord (column is NOT NULL)
        dateOfRecord: formData.scheduledDate,
        clinicName: formData.clinicName.trim() || undefined,
        // Also store in follow_up fields for the scheduled appointment
        followUpDate: formData.scheduledDate,
        followUpStartTime: formData.scheduledStartTime,
        followUpEndTime: formData.scheduledEndTime,
        notes: formData.notes.trim() || undefined,
        entryType: 'scheduled',
      };
    } else {
      // Past record - has visit date, optionally schedule follow-up
      // Convert documents to MedicalRecordDocument format
      const medicalRecordDocs: MedicalRecordDocument[] = documents.map((doc) => ({
        filename: doc.filename,
        url: doc.url,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
      }));

      data = {
        petId: id,
        recordType: formData.recordType,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        dateOfRecord: formData.dateOfRecord,
        clinicName: formData.clinicName.trim() || undefined,
        diagnosis: formData.diagnosis.trim() || undefined,
        treatment: formData.treatment.trim() || undefined,
        followUpDate: formData.followUpDate || undefined,
        followUpStartTime: formData.followUpDate ? formData.followUpStartTime : undefined,
        followUpEndTime: formData.followUpDate ? formData.followUpEndTime : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        currency: formData.currency || undefined,
        notes: formData.notes.trim() || undefined,
        entryType: 'past',
        documents: medicalRecordDocs.length > 0 ? medicalRecordDocs : undefined,
      };
    }

    createMutation.mutate(data);
  };

  if (!id) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Pet not found
        </h2>
        <Link to="/pets" className="btn-primary">
          Back to My Pets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/pets/${id}/medical-records`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Medical Records
        </Link>

        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isScheduledMode ? 'bg-blue-100' : 'bg-primary-100'}`}>
            {isScheduledMode ? (
              <CalendarClock className="h-6 w-6 text-blue-600" />
            ) : (
              <FileText className="h-6 w-6 text-primary-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isScheduledMode ? 'Schedule Appointment' : 'Record Past Visit'}
            </h1>
            <p className="text-gray-600">
              {isScheduledMode
                ? `Schedule an upcoming appointment for ${pet?.name || 'your pet'}`
                : `Record a completed visit for ${pet?.name || 'your pet'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Record/Appointment Type */}
        <div>
          <label
            htmlFor="recordType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {isScheduledMode ? 'Appointment Type' : 'Record Type'} <span className="text-red-500">*</span>
          </label>
          <select
            id="recordType"
            name="recordType"
            value={formData.recordType}
            onChange={handleChange}
            className="input"
          >
            {(isScheduledMode ? APPOINTMENT_TYPES : RECORD_TYPES).map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Annual Checkup, Blood Test Results"
              className={`input pl-10 ${errors.title ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* SCHEDULED MODE: Appointment Date/Time Section */}
        {isScheduledMode && (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h3 className="text-sm font-medium text-blue-700">Appointment Details</h3>
              <p className="text-xs text-blue-600">Schedule the appointment date and time</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Date */}
              <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium text-blue-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="scheduledDate"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.scheduledDate ? 'border-red-500' : 'border-blue-300'
                  }`}
                />
                {errors.scheduledDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.scheduledDate}</p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="scheduledStartTime" className="block text-sm font-medium text-blue-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="scheduledStartTime"
                  name="scheduledStartTime"
                  value={formData.scheduledStartTime}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.scheduledStartTime ? 'border-red-500' : 'border-blue-300'
                  }`}
                />
                {errors.scheduledStartTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.scheduledStartTime}</p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="scheduledEndTime" className="block text-sm font-medium text-blue-700 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="scheduledEndTime"
                  name="scheduledEndTime"
                  value={formData.scheduledEndTime}
                  onChange={handleChange}
                  min={formData.scheduledStartTime}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.scheduledEndTime ? 'border-red-500' : 'border-blue-300'
                  }`}
                />
                {errors.scheduledEndTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.scheduledEndTime}</p>
                )}
              </div>
            </div>

            {formData.scheduledDate && (
              <p className="text-xs text-blue-700 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Scheduled: {new Date(formData.scheduledDate).toLocaleDateString()} from {formData.scheduledStartTime} to {formData.scheduledEndTime}
              </p>
            )}
          </div>
        )}

        {/* SCHEDULED MODE: Clinic Name (simplified) */}
        {isScheduledMode && (
          <div>
            <label
              htmlFor="clinicName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Clinic/Vet Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="clinicName"
                name="clinicName"
                value={formData.clinicName}
                onChange={handleChange}
                placeholder="Veterinary clinic name"
                className="input pl-10"
              />
            </div>
          </div>
        )}

        {/* PAST MODE: Full Record Fields */}
        {!isScheduledMode && (
          <>
            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Brief description of the visit or procedure"
                className="input resize-none"
              />
            </div>

            {/* Date and Clinic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="dateOfRecord"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="dateOfRecord"
                    name="dateOfRecord"
                    value={formData.dateOfRecord}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`input pl-10 ${
                      errors.dateOfRecord ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                {errors.dateOfRecord && (
                  <p className="text-red-500 text-sm mt-1">{errors.dateOfRecord}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="clinicName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Clinic/Vet Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="clinicName"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    placeholder="Veterinary clinic name"
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis and Treatment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="diagnosis"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Diagnosis
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="diagnosis"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    placeholder="Doctor's diagnosis"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="treatment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Treatment
                </label>
                <div className="relative">
                  <Pill className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="treatment"
                    name="treatment"
                    value={formData.treatment}
                    onChange={handleChange}
                    placeholder="Treatment provided"
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Cost */}
            <div>
              <label
                htmlFor="cost"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cost
              </label>
              <div className="relative max-w-xs">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`input pl-10 ${errors.cost ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.cost && (
                <p className="text-red-500 text-sm mt-1">{errors.cost}</p>
              )}
            </div>

            {/* Documents */}
            {userId && id && (
              <DocumentUpload
                userId={userId}
                petId={id}
                recordType="medical-record"
                documents={documents}
                onDocumentsChange={setDocuments}
                label="Documents"
                disabled={createMutation.isPending}
              />
            )}
          </>
        )}

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional notes or observations..."
            className="input resize-none"
          />
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link to={`/pets/${id}/medical-records`} className="btn-outline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={isScheduledMode ? 'btn-primary bg-blue-600 hover:bg-blue-700' : 'btn-primary'}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isScheduledMode ? 'Scheduling...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isScheduledMode ? 'Schedule Appointment' : 'Save Record'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
