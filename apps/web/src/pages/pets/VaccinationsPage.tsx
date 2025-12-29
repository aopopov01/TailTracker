/**
 * Vaccinations Page
 * List of all vaccinations for a pet with status overview
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Syringe,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import {
  getVaccinationsWithStatus,
  getVaccinationSummary,
  getPetById,
} from '@tailtracker/shared-services';
import { VaccinationCard } from '@/components/Health';

export const VaccinationsPage = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch pet details
  const { data: pet } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => getPetById(id!),
    enabled: !!id,
  });

  // Fetch vaccinations
  const {
    data: vaccinations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vaccinations', id],
    queryFn: () => getVaccinationsWithStatus(id!),
    enabled: !!id,
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['vaccinationSummary', id],
    queryFn: () => getVaccinationSummary(id!),
    enabled: !!id,
  });

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
            <h1 className="text-2xl font-bold text-gray-900">
              Vaccinations
            </h1>
            <p className="text-gray-600">
              Track {pet?.name ? `${pet.name}'s` : "your pet's"} vaccination records
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={`/pets/${id}/vaccinations/new?type=past`} className="btn-outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Past Record
            </Link>
            <Link to={`/pets/${id}/vaccinations/new?type=scheduled`} className="btn-primary">
              <CalendarClock className="h-4 w-4 mr-2" />
              Schedule Next
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
                <Syringe className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.total}
                </p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.current}
                </p>
                <p className="text-sm text-gray-500">Current</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.dueSoon}
                </p>
                <p className="text-sm text-gray-500">Due Soon</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.overdue}
                </p>
                <p className="text-sm text-gray-500">Overdue</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vaccinations List */}
      {isLoading ? (
        <div className="card p-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-3" />
          <p className="text-gray-500 text-sm">Loading vaccinations...</p>
        </div>
      ) : error ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Syringe className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-red-600 font-medium">Failed to load vaccinations</p>
          <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
        </div>
      ) : vaccinations && vaccinations.length > 0 ? (
        <div className="space-y-4">
          {vaccinations.map((vaccination) => (
            <VaccinationCard
              key={vaccination.id}
              vaccination={vaccination}
              petId={id}
              petName={pet?.name}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
            <Syringe className="h-12 w-12 text-primary-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No vaccinations recorded
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Start tracking {pet?.name ? `${pet.name}'s` : "your pet's"} vaccination history
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/pets/${id}/vaccinations/new?type=past`}
              className="btn-outline inline-flex items-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              Past Record
            </Link>
            <Link
              to={`/pets/${id}/vaccinations/new?type=scheduled`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <CalendarClock className="h-5 w-5" />
              Schedule Vaccination
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
