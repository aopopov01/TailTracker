/**
 * Shared Pet Detail Page
 * Read-only view of a pet that has been shared with the current user
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Scale,
  BookOpen,
  Syringe,
  FileText,
  ChevronRight,
  Eye,
  Users,
  AlertTriangle,
} from 'lucide-react';
import {
  getSharedPetDetails,
  getVaccinationSummary,
  getMedicalRecordSummary,
} from '@tailtracker/shared-services';
import { calculateAge } from '@tailtracker/shared-utils';
import { usePetAccess } from '@/hooks';

// Get species-specific default image path
const getSpeciesImage = (species: string): string => {
  switch (species?.toLowerCase()) {
    case 'dog':
      return '/images/pets/dog.png';
    case 'cat':
      return '/images/pets/cat.png';
    case 'bird':
      return '/images/pets/bird.png';
    default:
      return '/images/pets/logo.png';
  }
};

export const SharedPetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: pet,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sharedPet', id],
    queryFn: () => getSharedPetDetails(id!),
    enabled: !!id,
  });

  // Check access permissions
  const { hasAccess, isOwner, permissions, isLoading: loadingAccess } = usePetAccess(id);

  // Fetch vaccination summary (if permissions allow)
  const { data: vaccinationSummary } = useQuery({
    queryKey: ['vaccinationSummary', id],
    queryFn: () => getVaccinationSummary(id!),
    enabled: !!id && permissions?.shareVaccinations !== false,
  });

  // Fetch medical record summary (if permissions allow)
  const { data: medicalRecordSummary } = useQuery({
    queryKey: ['medicalRecordSummary', id],
    queryFn: () => getMedicalRecordSummary(id!),
    enabled: !!id && permissions?.shareMedicalRecords !== false,
  });

  if (isLoading || loadingAccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-slate-500">Loading pet details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          to="/shared-pets"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Shared Pets
        </Link>

        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Pet Not Found
          </h2>
          <p className="text-slate-500 mb-6">
            This pet may no longer be shared with you, or it doesn't exist.
          </p>
          <Link to="/shared-pets" className="btn-primary">
            View Shared Pets
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          to="/shared-pets"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Shared Pets
        </Link>

        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-500 mb-6">
            You don't have permission to view this pet.
          </p>
          <Link to="/shared-pets" className="btn-primary">
            View Shared Pets
          </Link>
        </div>
      </div>
    );
  }

  // If user is owner, redirect to regular pet detail page
  if (isOwner) {
    navigate(`/pets/${id}`, { replace: true });
    return null;
  }

  const ageDisplay = pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : 'Unknown age';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        to="/shared-pets"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Shared Pets
      </Link>

      {/* Read-Only Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">Read-only access</p>
            <p className="text-sm text-blue-700">
              Shared by <span className="font-medium">{pet.sharedBy?.name || 'Owner'}</span>
              {pet.sharedBy?.email && ` (${pet.sharedBy.email})`}
            </p>
          </div>
          <Link
            to="/family-sharing"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Users className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Pet Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Pet Photo */}
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-primary-50 flex-shrink-0">
            {pet.photos?.[0] ? (
              <img
                src={pet.photos[0]}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={getSpeciesImage(pet.species)}
                  alt={pet.species}
                  className="w-16 h-16 object-contain opacity-60"
                />
              </div>
            )}
          </div>

          {/* Pet Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{pet.name}</h1>
            <div className="flex flex-wrap gap-4 text-slate-600">
              <span className="capitalize">{pet.species}</span>
              {pet.breed && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{pet.breed}</span>
                </>
              )}
              <span className="text-slate-300">•</span>
              <span>{ageDisplay}</span>
            </div>

            {pet.gender && (
              <p className="text-sm text-slate-500 mt-2 capitalize">{pet.gender}</p>
            )}

            {pet.microchipNumber && (
              <p className="text-sm text-slate-500 mt-1">
                Microchip: {pet.microchipNumber}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          {pet.weight && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <Scale className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Weight</p>
                <p className="font-medium text-slate-900">
                  {pet.weight.value} {pet.weight.unit || 'kg'}
                </p>
              </div>
            </div>
          )}

          {pet.dateOfBirth && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <Calendar className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Birthday</p>
                <p className="font-medium text-slate-900">
                  {new Date(pet.dateOfBirth).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-50">
              <Syringe className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Vaccinations</p>
              <p className="font-medium text-slate-900">
                {vaccinationSummary?.total || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-50">
              <FileText className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Medical Records</p>
              <p className="font-medium text-slate-900">
                {medicalRecordSummary?.total || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {permissions?.shareVaccinations !== false && (
          <Link
            to={`/shared-pets/${id}/vaccinations`}
            className="card p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Syringe className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                    Vaccinations
                  </h3>
                  <p className="text-sm text-slate-500">
                    {vaccinationSummary?.total || 0} total
                    {vaccinationSummary?.current !== undefined &&
                      ` • ${vaccinationSummary.current} current`}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </div>
          </Link>
        )}

        {permissions?.shareMedicalRecords !== false && (
          <Link
            to={`/shared-pets/${id}/medical-records`}
            className="card p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                    Medical Records
                  </h3>
                  <p className="text-sm text-slate-500">
                    {medicalRecordSummary?.total || 0} records
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </div>
          </Link>
        )}
      </div>

      {/* Pet Details */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary-500" />
          Pet Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pet.color && (
            <div>
              <p className="text-sm text-slate-500">Color / Markings</p>
              <p className="font-medium text-slate-900">{pet.color}</p>
            </div>
          )}

          {pet.markings && (
            <div>
              <p className="text-sm text-slate-500">Markings</p>
              <p className="font-medium text-slate-900">{pet.markings}</p>
            </div>
          )}

          {pet.medicalConditions && pet.medicalConditions.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-500 mb-2">Medical Conditions</p>
              <div className="flex flex-wrap gap-2">
                {pet.medicalConditions.map((condition) => (
                  <span
                    key={condition.id}
                    className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                  >
                    {condition.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {pet.allergies && pet.allergies.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-500 mb-2">Allergies</p>
              <div className="flex flex-wrap gap-2">
                {pet.allergies.map((allergy: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {pet.specialNotes && (
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-500 mb-2">Notes</p>
              <p className="text-slate-700">{pet.specialNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
