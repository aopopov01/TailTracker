/**
 * Shared Pets Page
 * View pets that have been shared with the current user by family members
 */

import { Link } from 'react-router-dom';
import {
  Loader2,
  Dog,
  Eye,
  Users,
  ChevronRight,
} from 'lucide-react';
import { usePetsSharedWithMe, useSharesWithMe } from '@/hooks';
import { PetImage } from '@/components/Pet';
import type { SharedPet } from '@tailtracker/shared-types';

// Shared Pet Card
const SharedPetCard = ({ sharedPet }: { sharedPet: SharedPet }) => {
  const permissions = [];
  if (sharedPet.shareCalendar) permissions.push('Calendar');
  if (sharedPet.shareVaccinations) permissions.push('Vaccinations');
  if (sharedPet.shareMedicalRecords) permissions.push('Medical Records');

  return (
    <Link
      to={`/shared-pets/${sharedPet.petId}`}
      className="card p-4 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-4">
        <PetImage
          petId={sharedPet.petId}
          species={sharedPet.petSpecies || 'dog'}
          petName={sharedPet.petName || 'Pet'}
          className="w-16 h-16 rounded-xl bg-primary-50 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
              {sharedPet.petName || 'Unknown Pet'}
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              <Eye className="h-3 w-3" />
              Read-only
            </span>
          </div>
          <p className="text-sm text-slate-500 capitalize mb-2">
            {sharedPet.petSpecies}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Users className="h-3 w-3" />
            <span>Shared by {sharedPet.ownerName || 'Owner'}</span>
          </div>
          {permissions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {permissions.map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded"
                >
                  {perm}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
};

// Group by owner
interface GroupedPets {
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  pets: SharedPet[];
}

const groupPetsByOwner = (pets: SharedPet[]): GroupedPets[] => {
  const grouped: Record<string, GroupedPets> = {};

  pets.forEach((pet) => {
    const ownerId = pet.ownerId || 'unknown';
    if (!grouped[ownerId]) {
      grouped[ownerId] = {
        ownerId,
        ownerName: pet.ownerName || 'Unknown Owner',
        pets: [],
      };
    }
    grouped[ownerId].pets.push(pet);
  });

  return Object.values(grouped);
};

export const SharedPetsPage = () => {
  const { sharedPets, isLoading, error } = usePetsSharedWithMe();
  const { shares: sharesWithMe, isLoading: loadingShares } = useSharesWithMe();

  const groupedPets = groupPetsByOwner(sharedPets);
  const acceptedShares = sharesWithMe.filter((s) => s.status === 'accepted');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Shared Pets</h1>
        <p className="text-slate-600 mt-1">
          View pets that family members have shared with you
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <div className="flex items-start gap-3">
          <Eye className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Read-only access</p>
            <p className="text-sm text-blue-700 mt-1">
              You can view these pets' profiles, vaccinations, and medical records,
              but cannot make changes. Only the pet owner can edit their information.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading || loadingShares ? (
        <div className="card p-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-3" />
          <p className="text-slate-500 text-sm">Loading shared pets...</p>
        </div>
      ) : error ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Dog className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-red-600 font-medium">Failed to load shared pets</p>
          <p className="text-slate-500 text-sm mt-1">Please try again later.</p>
        </div>
      ) : groupedPets.length > 0 ? (
        <div className="space-y-8">
          {groupedPets.map((group) => (
            <div key={group.ownerId}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-600">
                    {group.ownerName[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{group.ownerName}</h2>
                  <p className="text-xs text-slate-500">
                    {group.pets.length} pet{group.pets.length !== 1 ? 's' : ''} shared with you
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.pets.map((pet) => (
                  <SharedPetCard key={pet.id} sharedPet={pet} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : acceptedShares.length > 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Dog className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No pets shared yet
          </h3>
          <p className="text-slate-500 mb-4 max-w-sm mx-auto">
            You have {acceptedShares.length} family connection{acceptedShares.length !== 1 ? 's' : ''},
            but they haven't shared any pets with you yet.
          </p>
          <Link
            to="/family-sharing"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View Family Connections
          </Link>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-primary-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No shared pets yet
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            When family members share their pets with you, they'll appear here.
            You'll be able to view their profiles and health records.
          </p>
          <Link
            to="/family-sharing"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Users className="h-5 w-5" />
            View Family Sharing
          </Link>
        </div>
      )}
    </div>
  );
};
