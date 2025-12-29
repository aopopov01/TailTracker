/**
 * Admin Pets Tab
 * Pet management with search, filter, and actions
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Eye,
  MapPin,
  RefreshCw,
  Save,
  PawPrint,
  UserPlus,
} from 'lucide-react';
import { getAdminPets, adminDeletePet, logAdminAction } from '@tailtracker/shared-services';
import type { AdminPetListItem } from '@tailtracker/shared-types';
import { syncPlatform } from '@/utils/syncPlatform';
import { CreatePetModal, AssignPetModal } from '@/components/Admin';

type FilterSpecies = 'all' | 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'other';
type FilterStatus = 'all' | 'active' | 'lost' | 'found' | 'deceased';

const ITEMS_PER_PAGE = 10;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get species-specific image path
 */
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

const StatusBadge = ({ status }: { status: string }) => {
  const classes: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
    found: 'bg-blue-100 text-blue-700',
    deceased: 'bg-slate-200 text-slate-600',
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
        classes[status] || 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  );
};

/**
 * Pet image component with proper error handling and species PNG fallback
 */
const PetImage = ({ pet }: { pet: AdminPetListItem }) => {
  const [imageError, setImageError] = useState(false);

  // If no photo URL or image failed to load, show species PNG fallback
  if (!pet.photoUrl || imageError) {
    return (
      <img
        src={getSpeciesImage(pet.species)}
        alt={pet.species}
        className="w-10 h-10 rounded-full object-cover bg-slate-100"
      />
    );
  }

  return (
    <img
      src={pet.photoUrl}
      alt={pet.name}
      className="w-10 h-10 rounded-full object-cover bg-slate-100"
      onError={() => setImageError(true)}
    />
  );
};

export const PetsTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<FilterSpecies>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<AdminPetListItem>>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCreatePetModal, setShowCreatePetModal] = useState(false);
  const [assignPetData, setAssignPetData] = useState<{
    id: string;
    name: string;
    currentOwnerId: string;
    currentOwnerEmail: string;
  } | null>(null);

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['adminPets', search, speciesFilter, statusFilter, page],
    queryFn: () =>
      getAdminPets({
        search: search || undefined,
        species: speciesFilter !== 'all' ? speciesFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      }),
  });

  /**
   * Comprehensive platform sync - clears ALL cached data
   * and refreshes everything from the database
   */
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Use global sync to clear all caches across the platform
      await syncPlatform(queryClient);

      // Refetch admin data after sync
      await refetch();

      console.log('[PetsTab] Platform sync completed');
    } catch (error) {
      console.error('[PetsTab] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    try {
      // Save all pending changes
      for (const [petId, changes] of pendingChanges) {
        // TODO: Implement save logic when inline editing is added
        console.log('Saving pet:', petId, changes);
      }

      // Clear pending changes
      setPendingChanges(new Map());

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['adminPets'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (petId: string) => adminDeletePet(petId),
    onSuccess: (_, petId) => {
      queryClient.invalidateQueries({ queryKey: ['adminPets'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      logAdminAction('delete_pet', 'pet', petId);
    },
  });

  const handleDelete = (pet: AdminPetListItem) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${pet.name}"? This will also delete all associated records. This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(pet.id);
    }
  };

  const pets = data?.pets || [];
  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by pet name or owner email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={speciesFilter}
              onChange={(e) => {
                setSpeciesFilter(e.target.value as FilterSpecies);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
            >
              <option value="all">All Species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="bird">Birds</option>
              <option value="rabbit">Rabbits</option>
              <option value="fish">Fish</option>
              <option value="other">Other</option>
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as FilterStatus);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
              <option value="deceased">Deceased</option>
            </select>
            <MapPin className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          {/* Save Button - Always visible, disabled when no changes */}
          <button
            onClick={handleSave}
            disabled={pendingChanges.size === 0 || isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              pendingChanges.size > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={pendingChanges.size > 0 ? 'Save pending changes' : 'No changes to save'}
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
            <span className="text-sm">Save{pendingChanges.size > 0 ? ` (${pendingChanges.size})` : ''}</span>
          </button>
          {/* Sync Button - Clears ALL caches across the platform */}
          <button
            onClick={handleSync}
            disabled={isSyncing || isFetching}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Sync entire platform - clears all cached data"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 ${isSyncing || isFetching ? 'animate-spin' : ''}`} />
            <span className="text-sm text-slate-600 hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
          {/* Create Pet Button */}
          <button
            onClick={() => setShowCreatePetModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PawPrint className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Create Pet</span>
          </button>
        </div>
      </div>

      {/* Pets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-slate-600">Failed to load pets</p>
            </div>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No pets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Species
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Breed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PetImage pet={pet} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{pet.name}</p>
                          {pet.microchipNumber && (
                            <p className="text-xs text-slate-500">
                              Chip: {pet.microchipNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700 capitalize">
                        {pet.species}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {pet.breed || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={pet.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="truncate max-w-[150px]" title={pet.ownerEmail}>
                          {pet.ownerEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(pet.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`/pets/${pet.id}`, '_blank')}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                          title="View pet profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAssignPetData({
                            id: pet.id,
                            name: pet.name,
                            currentOwnerId: pet.ownerId,
                            currentOwnerEmail: pet.ownerEmail || 'Unknown',
                          })}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors"
                          title="Assign to different owner"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pet)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                          title="Delete pet"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, data?.total || 0)} of {data?.total || 0} pets
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Pet Modal */}
      <CreatePetModal
        isOpen={showCreatePetModal}
        onClose={() => setShowCreatePetModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['adminPets'] });
          queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        }}
      />

      {/* Assign Pet Modal */}
      <AssignPetModal
        isOpen={!!assignPetData}
        onClose={() => setAssignPetData(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['adminPets'] });
          queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        }}
        pet={assignPetData}
      />
    </div>
  );
};
