/**
 * Edit Vaccination Page
 * Form to edit an existing vaccination record
 * Conditionally shows fields based on entry_type (past vs scheduled)
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Syringe,
  Calendar,
  Building2,
  FileText,
  Loader2,
  Save,
  Trash2,
  CalendarClock,
} from 'lucide-react';
import {
  getVaccinationById,
  updateVaccination,
  deleteVaccination,
  getPetById,
  getSupabaseClient,
  type VaccinationData,
  type VaccinationEntryType,
  type VaccinationDocument,
} from '@tailtracker/shared-services';
import { DocumentUpload, type DocumentMetadata } from '@/components/DocumentUpload';

export const EditVaccinationPage = () => {
  const { id, vacId } = useParams<{ id: string; vacId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch pet details for header
  const { data: pet } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => getPetById(id!),
    enabled: !!id,
  });

  // Fetch vaccination data
  const {
    data: vaccination,
    isLoading: isLoadingVaccination,
    error: vaccinationError,
  } = useQuery({
    queryKey: ['vaccination', vacId],
    queryFn: () => getVaccinationById(vacId!),
    enabled: !!vacId,
  });

  // Form state
  const [formData, setFormData] = useState({
    vaccineName: '',
    batchNumber: '',
    administeredDate: '',
    // For scheduled vaccinations, we use nextDueDate/Time as the appointment
    scheduledDate: '',
    scheduledStartTime: '09:00',
    scheduledEndTime: '10:00',
    administeredBy: '',
    clinicName: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track the entry type (past vs scheduled) - determines which fields to show
  const [entryType, setEntryType] = useState<VaccinationEntryType>('past');
  const isScheduledMode = entryType === 'scheduled';

  // User ID for document uploads
  const [userId, setUserId] = useState<string>('');

  // Documents state - uses DocumentMetadata for immediate upload (past mode only)
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

  // Populate form when vaccination data loads
  useEffect(() => {
    if (vaccination) {
      // Determine entry type from the record
      const recordEntryType = vaccination.entryType ||
        (vaccination.administeredDate ? 'past' : 'scheduled');
      setEntryType(recordEntryType);

      setFormData({
        vaccineName: vaccination.vaccineName || '',
        batchNumber: vaccination.batchNumber || '',
        administeredDate: vaccination.administeredDate || '',
        // For scheduled vaccinations, nextDueDate is the appointment date
        scheduledDate: vaccination.nextDueDate || '',
        scheduledStartTime: vaccination.nextDueStartTime || '09:00',
        scheduledEndTime: vaccination.nextDueEndTime || '10:00',
        administeredBy: vaccination.administeredBy || '',
        clinicName: vaccination.clinicName || '',
        notes: vaccination.notes || '',
      });

      // Populate documents if they exist
      if (vaccination.documents && vaccination.documents.length > 0) {
        const docs: DocumentMetadata[] = vaccination.documents.map((doc) => ({
          filename: doc.filename,
          url: doc.url,
          size: doc.size,
          uploadedAt: doc.uploadedAt,
        }));
        setDocuments(docs);
      }
    }
  }, [vaccination]);

  // Update mutation - documents are already uploaded via DocumentUpload component
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<VaccinationData>) => {
      return updateVaccination(vacId!, data);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['vaccinations', id] });
        queryClient.invalidateQueries({ queryKey: ['vaccination', vacId] });
        queryClient.invalidateQueries({ queryKey: ['vaccinationSummary', id] });
        navigate(`/pets/${id}/vaccinations`);
      } else {
        setErrors({ submit: result.error || 'Failed to update vaccination' });
      }
    },
    onError: (error) => {
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Failed to update vaccination',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteVaccination(vacId!),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['vaccinations', id] });
        queryClient.invalidateQueries({ queryKey: ['vaccinationSummary', id] });
        navigate(`/pets/${id}/vaccinations`);
      } else {
        setErrors({ submit: result.error || 'Failed to delete vaccination' });
      }
    },
    onError: (error) => {
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Failed to delete vaccination',
      });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !vacId) return;

    let data: Partial<VaccinationData>;

    if (isScheduledMode) {
      // Scheduled vaccination - only update relevant fields
      data = {
        vaccineName: formData.vaccineName.trim(),
        nextDueDate: formData.scheduledDate,
        nextDueStartTime: formData.scheduledStartTime,
        nextDueEndTime: formData.scheduledEndTime,
        clinicName: formData.clinicName.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };
    } else {
      // Past vaccination - only update relevant fields (no next appointment section)
      // Convert DocumentMetadata to VaccinationDocument format
      const vaccinationDocs: VaccinationDocument[] = documents.map((doc) => ({
        filename: doc.filename,
        url: doc.url,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
      }));

      data = {
        vaccineName: formData.vaccineName.trim(),
        batchNumber: formData.batchNumber.trim() || undefined,
        administeredDate: formData.administeredDate,
        administeredBy: formData.administeredBy.trim() || undefined,
        clinicName: formData.clinicName.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        documents: vaccinationDocs.length > 0 ? vaccinationDocs : undefined,
      };
    }

    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        'Are you sure you want to delete this vaccination record? This action cannot be undone.'
      )
    ) {
      deleteMutation.mutate();
    }
  };

  if (!id || !vacId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Record not found
        </h2>
        <Link to="/pets" className="btn-primary">
          Back to My Pets
        </Link>
      </div>
    );
  }

  if (isLoadingVaccination) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (vaccinationError || !vaccination) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Vaccination record not found
        </h2>
        <Link to={`/pets/${id}/vaccinations`} className="btn-primary">
          Back to Vaccinations
        </Link>
      </div>
    );
  }

  const isPending = updateMutation.isPending || deleteMutation.isPending;

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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isScheduledMode ? 'bg-blue-100' : 'bg-primary-100'}`}>
              {isScheduledMode ? (
                <CalendarClock className="h-6 w-6 text-blue-600" />
              ) : (
                <Syringe className="h-6 w-6 text-primary-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isScheduledMode ? 'Edit Scheduled Vaccination' : 'Edit Past Vaccination'}
              </h1>
              <p className="text-gray-600">
                {isScheduledMode
                  ? `Update scheduled vaccination for ${pet?.name || 'your pet'}`
                  : `Update vaccination record for ${pet?.name || 'your pet'}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </button>
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

        {/* Conditional fields based on entry type */}
        {isScheduledMode ? (
          <>
            {/* SCHEDULED MODE: Date/Time section */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Appointment Details</h3>
                <p className="text-xs text-gray-500">When is this vaccination scheduled?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Date */}
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-600 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.scheduledDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.scheduledDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.scheduledDate}</p>
                  )}
                </div>

                {/* Start Time */}
                <div>
                  <label htmlFor="scheduledStartTime" className="block text-sm font-medium text-gray-600 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="scheduledStartTime"
                    name="scheduledStartTime"
                    value={formData.scheduledStartTime}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.scheduledStartTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.scheduledStartTime && (
                    <p className="text-red-500 text-xs mt-1">{errors.scheduledStartTime}</p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <label htmlFor="scheduledEndTime" className="block text-sm font-medium text-gray-600 mb-1">
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
                      errors.scheduledEndTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.scheduledEndTime && (
                    <p className="text-red-500 text-xs mt-1">{errors.scheduledEndTime}</p>
                  )}
                </div>
              </div>

              {formData.scheduledDate && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" />
                  Appointment: {new Date(formData.scheduledDate).toLocaleDateString()} from {formData.scheduledStartTime} to {formData.scheduledEndTime}
                </p>
              )}
            </div>

            {/* Clinic Name (full width for scheduled) */}
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
          </>
        ) : (
          <>
            {/* PAST MODE: Batch Number */}
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

            {/* PAST MODE: Date Administered */}
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
                  onChange={handleChange}
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

            {/* PAST MODE: Clinic Info (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </>
        )}

        {/* Notes (both modes) */}
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

        {/* Documents section (past mode only) - Immediate upload on file selection */}
        {!isScheduledMode && userId && id && vacId && (
          <DocumentUpload
            userId={userId}
            petId={id}
            recordId={vacId}
            recordType="vaccination"
            documents={documents}
            onDocumentsChange={setDocuments}
            label="Documents"
            disabled={isPending}
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
          <Link to={`/pets/${id}/vaccinations`} className="btn-outline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
