/**
 * Medical Records Page
 * List of all medical records for a pet with filtering
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  Loader2,
  Stethoscope,
  Calendar,
  DollarSign,
  Filter,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import {
  getMedicalRecords,
  getMedicalRecordSummary,
  getPetById,
  RECORD_TYPE_INFO,
  type MedicalRecordType,
} from '@tailtracker/shared-services';
import { MedicalRecordCard } from '@/components/Health';

const RECORD_TYPES: { value: MedicalRecordType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Records' },
  { value: 'checkup', label: 'Checkups' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'prescription', label: 'Prescriptions' },
  { value: 'test_result', label: 'Test Results' },
  { value: 'vaccination', label: 'Vaccinations' },
  { value: 'dental', label: 'Dental' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'other', label: 'Other' },
];

export const MedicalRecordsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [filterType, setFilterType] = useState<MedicalRecordType | 'all'>('all');

  // Fetch pet details
  const { data: pet } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => getPetById(id!),
    enabled: !!id,
  });

  // Fetch medical records
  const {
    data: records,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['medicalRecords', id],
    queryFn: () => getMedicalRecords(id!),
    enabled: !!id,
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['medicalRecordSummary', id],
    queryFn: () => getMedicalRecordSummary(id!),
    enabled: !!id,
  });

  // Filter records
  const filteredRecords = records?.filter(
    (record) => filterType === 'all' || record.recordType === filterType
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/pets/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {pet?.name || 'Pet Profile'}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
            <p className="text-gray-600">
              Track {pet?.name ? `${pet.name}'s` : "your pet's"} health history
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={`/pets/${id}/medical-records/new?type=past`} className="btn-outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Past Record
            </Link>
            <Link to={`/pets/${id}/medical-records/new?type=scheduled`} className="btn-primary">
              <CalendarClock className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.total}
                </p>
                <p className="text-sm text-gray-500">Total Records</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Stethoscope className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.last30Days}
                </p>
                <p className="text-sm text-gray-500">Last 30 Days</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.scheduled}
                </p>
                <p className="text-sm text-gray-500">Scheduled</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalCost)}
                </p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <Filter className="h-4 w-4 text-gray-400" />
          {RECORD_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === type.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.label}
              {type.value !== 'all' && summary && (
                <span className="ml-1 opacity-70">
                  ({summary.byType[type.value as MedicalRecordType] || 0})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="card p-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-3" />
          <p className="text-gray-500 text-sm">Loading medical records...</p>
        </div>
      ) : error ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-red-600 font-medium">
            Failed to load medical records
          </p>
          <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
        </div>
      ) : filteredRecords && filteredRecords.length > 0 ? (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <MedicalRecordCard key={record.id} record={record} petId={id} petName={pet?.name} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-primary-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {filterType === 'all'
              ? 'No medical records yet'
              : `No ${RECORD_TYPE_INFO[filterType as MedicalRecordType]?.label.toLowerCase()} records`}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {filterType === 'all'
              ? `Start tracking ${pet?.name ? `${pet.name}'s` : "your pet's"} health history`
              : 'Try selecting a different filter or add a new record'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/pets/${id}/medical-records/new?type=past`}
              className="btn-outline inline-flex items-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              Past Record
            </Link>
            <Link
              to={`/pets/${id}/medical-records/new?type=scheduled`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <CalendarClock className="h-5 w-5" />
              Schedule Appointment
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
