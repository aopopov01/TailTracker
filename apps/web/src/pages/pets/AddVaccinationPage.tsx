/**
 * Add Vaccination Page
 * Form to add a new vaccination record for a pet
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Syringe,
  Calendar,
  Building2,
  FileText,
  Loader2,
  Save,
} from 'lucide-react';
import {
  createVaccination,
  getPetById,
  getSupabaseClient,
  type VaccinationData,
  type VaccinationDocument,
} from '@tailtracker/shared-services';
import { DocumentUpload, type DocumentMetadata } from '@/components/DocumentUpload';

export const AddVaccinationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Determine form mode from query params
  const searchParams = new URLSearchParams(location.search);
  const formMode = searchParams.get('type') === 'scheduled' ? 'scheduled' : 'past';
  const isScheduledMode = formMode === 'scheduled';

  // Fetch pet details for header
  const { data: pet } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => getPetById(id!),
    enabled: !!id,
  });

  // Get tomorrow's date for scheduled mode default
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Form state - initialized differently based on mode
  const [formData, setFormData] = useState({
    vaccineName: '',
    batchNumber: '',
    // Past mode: administeredDate defaults to today
    administeredDate: isScheduledMode ? '' : new Date().toISOString().split('T')[0],
    // Scheduled mode: scheduledDate defaults to tomorrow
    scheduledDate: isScheduledMode ? getTomorrowDate() : '',
    scheduledStartTime: '09:00',
    scheduledEndTime: '10:00',
    // Optional future appointment for past vaccinations
    nextDueDate: '',
    nextDueStartTime: '09:00',
    nextDueEndTime: '10:00',
    administeredBy: '',
    clinicName: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // User ID for document uploads
  const [userId, setUserId] = useState<string>('');

  // Documents state (for past mode only) - uses DocumentMetadata for immediate upload
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);

  // Fetch current user ID for document upload paths
  useEffect(() => {
    const fetchUserId = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUserId();
  }, []);

  // Create mutation - documents are already uploaded via DocumentUpload component
  const createMutation = useMutation({
    mutationFn: async (data: VaccinationData) => {
      // Create the vaccination record with documents already uploaded
      const result = await createVaccination(data);
      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['vaccinations', id] });
        queryClient.invalidateQueries({ queryKey: ['vaccinationSummary', id] });
        navigate(`/pets/${id}/vaccinations`);
      } else {
        setErrors({ submit: result.error || 'Failed to create vaccination' });
      }
    },
    onError: (error) => {
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Failed to create vaccination',
      });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    if (!formData.vaccineName.trim()) {
      newErrors.vaccineName = 'Vaccine name is required';
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
      if (!formData.administeredDate) {
        newErrors.administeredDate = 'Administered date is required';
      }
      // Validate end time is after start time when optional appointment is set
      if (formData.nextDueDate && formData.nextDueStartTime && formData.nextDueEndTime) {
        if (formData.nextDueEndTime <= formData.nextDueStartTime) {
          newErrors.nextDueEndTime = 'End time must be after start time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !id) return;

    let data: VaccinationData;

    if (isScheduledMode) {
      // Scheduled vaccination - no administered date, use scheduled date as next_due_date
      data = {
        petId: id,
        vaccineName: formData.vaccineName.trim(),
        // No administeredDate for scheduled vaccinations - will be set when marked as complete
        nextDueDate: formData.scheduledDate,
        nextDueStartTime: formData.scheduledStartTime,
        nextDueEndTime: formData.scheduledEndTime,
        clinicName: formData.clinicName.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        entryType: 'scheduled',
      };
    } else {
      // Past vaccination - has administered date, optionally schedule next appointment
      // Convert DocumentMetadata to VaccinationDocument format
      const vaccinationDocs: VaccinationDocument[] = documents.map((doc) => ({
        filename: doc.filename,
        url: doc.url,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
      }));

      data = {
        petId: id,
        vaccineName: formData.vaccineName.trim(),
        batchNumber: formData.batchNumber.trim() || undefined,
        administeredDate: formData.administeredDate,
        nextDueDate: formData.nextDueDate || undefined,
        nextDueStartTime: formData.nextDueDate ? formData.nextDueStartTime : undefined,
        nextDueEndTime: formData.nextDueDate ? formData.nextDueEndTime : undefined,
        administeredBy: formData.administeredBy.trim() || undefined,
        clinicName: formData.clinicName.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        entryType: 'past',
        documents: vaccinationDocs.length > 0 ? vaccinationDocs : undefined,
      };
    }

    createMutation.mutate(data);
  };

  // Handle administered date change - NO auto-calculation
  // Past records are historical records, user decides if they want to add a next due date
  const handleAdministeredDateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, administeredDate: value }));
    // Clear error when field is modified
    if (errors.administeredDate) {
      setErrors((prev) => ({ ...prev, administeredDate: '' }));
    }
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
          to={`/pets/${id}/vaccinations`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vaccinations
        </Link>

        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isScheduledMode ? 'bg-blue-100' : 'bg-primary-100'}`}>
            {isScheduledMode ? (
              <Calendar className="h-6 w-6 text-blue-600" />
            ) : (
              <Syringe className="h-6 w-6 text-primary-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isScheduledMode ? 'Schedule Vaccination' : 'Record Past Vaccination'}
            </h1>
            <p className="text-gray-600">
              {isScheduledMode
                ? `Schedule an upcoming vaccination for ${pet?.name || 'your pet'}`
                : `Record a completed vaccination for ${pet?.name || 'your pet'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Vaccine Name */}
        <div>
          <label
            htmlFor="vaccineName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Vaccine Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Syringe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="vaccineName"
              name="vaccineName"
              value={formData.vaccineName}
              onChange={handleChange}
              placeholder="e.g., Rabies, DHPP, Bordetella"
              className={`input pl-10 ${
                errors.vaccineName ? 'border-red-500' : ''
              }`}
            />
          </div>
          {errors.vaccineName && (
            <p className="text-red-500 text-sm mt-1">{errors.vaccineName}</p>
          )}
        </div>

        {/* SCHEDULED MODE: Appointment Date/Time Section */}
        {isScheduledMode && (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h3 className="text-sm font-medium text-blue-700">Appointment Details</h3>
              <p className="text-xs text-blue-600">Schedule the vaccination appointment</p>
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

        {/* PAST MODE: Batch Number, Date Administered, and Optional Next Appointment */}
        {!isScheduledMode && (
          <>
            {/* Batch Number */}
            <div>
              <label
                htmlFor="batchNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Batch Number
              </label>
              <input
                type="text"
                id="batchNumber"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="Optional: Vaccine batch/lot number"
                className="input"
              />
            </div>

            {/* Date Administered */}
            <div>
              <label
                htmlFor="administeredDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date Administered <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  id="administeredDate"
                  name="administeredDate"
                  value={formData.administeredDate}
                  onChange={handleAdministeredDateChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`input pl-10 ${
                    errors.administeredDate ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {errors.administeredDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.administeredDate}
                </p>
              )}
            </div>
          </>
        )}

        {/* Clinic Info - Full width in scheduled mode, 2 cols in past mode */}
        <div className={`grid grid-cols-1 ${!isScheduledMode ? 'sm:grid-cols-2' : ''} gap-4`}>
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

          {/* Only show "Administered By" in past mode - vaccination hasn't happened yet in scheduled mode */}
          {!isScheduledMode && (
            <div>
              <label
                htmlFor="administeredBy"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Administered By
              </label>
              <input
                type="text"
                id="administeredBy"
                name="administeredBy"
                value={formData.administeredBy}
                onChange={handleChange}
                placeholder="Veterinarian's name"
                className="input"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about this vaccination..."
              className="input pl-10 resize-none"
            />
          </div>
        </div>

        {/* Documents (Past mode only) - Immediate upload on file selection */}
        {!isScheduledMode && userId && id && (
          <DocumentUpload
            userId={userId}
            petId={id}
            recordType="vaccination"
            documents={documents}
            onDocumentsChange={setDocuments}
            label="Documents"
            disabled={createMutation.isPending}
          />
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link
            to={`/pets/${id}/vaccinations`}
            className="btn-outline"
          >
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
                {isScheduledMode ? (
                  <Calendar className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isScheduledMode ? 'Schedule Vaccination' : 'Save Vaccination'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
