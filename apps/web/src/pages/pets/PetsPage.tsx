/**
 * Pets Page
 * List of all user's pets with clean, minimal design
 */

import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, PawPrint, Crown, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { getPets, SUBSCRIPTION_PLANS } from '@tailtracker/shared-services';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useSubscription } from '@/hooks/useSubscription';
import { PetImage } from '@/components/Pet';

export const PetsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInitialized, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Get fresh subscription data (not cached from user object)
  const { tier, features, isLoading: subscriptionLoading } = useSubscription();

  const {
    data: pets,
    isLoading: petsLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['pets', user?.id],
    queryFn: getPets,
    enabled: isInitialized && isAuthenticated,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 30000, // 30 seconds
  });

  // Use fresh subscription data from hook
  const tierConfig = SUBSCRIPTION_PLANS[tier];
  const petLimit = features.maxPets;
  const currentPetCount = pets?.length || 0;
  const canAddPet = currentPetCount < petLimit;
  const isLoading = petsLoading || subscriptionLoading;

  const handleAddPet = () => {
    if (canAddPet) {
      navigate('/pets/new');
    } else {
      navigate('/pricing');
    }
  };

  const filteredPets = pets?.filter((pet) =>
    pet.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Pets</h1>
          <p className="text-slate-600">
            Manage your pet profiles and health records
          </p>
          {!isLoading && !canAddPet && (
            <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
              <Crown className="h-4 w-4" />
              You've reached your {tierConfig.name} plan limit ({petLimit} pet{petLimit !== 1 ? 's' : ''}).{' '}
              <Link to="/pricing" className="text-primary-600 hover:text-primary-700 font-medium underline">
                Upgrade
              </Link>{' '}
              to add more.
            </p>
          )}
        </div>
        <button onClick={handleAddPet} className="btn-primary">
          <PawPrint className="h-5 w-5 mr-2" />
          Add Pet
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search your pets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-11"
          />
        </div>
      </div>

      {/* Pets Grid */}
      {isLoading || isRefetching ? (
        <div className="card p-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-3" />
          <p className="text-slate-500 text-sm">
            {isRefetching ? 'Refreshing...' : 'Loading your pets...'}
          </p>
        </div>
      ) : error ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <img src="/images/pets/logo.png" alt="Error" className="h-8 w-8 object-contain" />
          </div>
          <p className="text-red-600 font-medium">Failed to load pets</p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {error instanceof Error ? error.message : 'Please try again later.'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      ) : filteredPets && filteredPets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet) => (
            <Link
              key={pet.id}
              to={`/pets/${pet.id}`}
              className="card overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="bg-slate-50">
                <PetImage
                  petId={pet.id}
                  species={pet.species}
                  petName={pet.name}
                  className="w-full h-48 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 text-lg group-hover:text-primary-600 transition-colors">
                  {pet.name}
                </h3>
                <p className="text-sm text-slate-500 capitalize">
                  {pet.species}
                  {pet.breed && ` - ${pet.breed}`}
                </p>
                {pet.age && (
                  <p className="text-sm text-slate-500 mt-1">
                    {pet.age} old
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      pet.status === 'active'
                        ? 'bg-primary-50 text-primary-600'
                        : pet.status === 'lost'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pet.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
            <img src="/images/pets/logo.png" alt="No pets" className="h-12 w-12 object-contain" />
          </div>
          <h3 className="text-xl font-medium text-slate-900 mb-2">
            {searchQuery ? 'No pets found' : 'No pets yet'}
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            {searchQuery
              ? 'Try a different search term'
              : 'Start your pet care journey by adding your first furry friend'}
          </p>
          {!searchQuery && (
            <Link to="/pets/new" className="btn-primary inline-flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Add Your First Pet
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
