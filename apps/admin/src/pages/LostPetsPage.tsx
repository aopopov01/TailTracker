/**
 * Lost Pets Management Page
 * Moderate and manage lost pet alerts
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Dog,
} from 'lucide-react';
import { supabaseAdmin } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface LostPetAlert {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  status: string;
  created_at: string;
  user_id: string;
  profile_photo_url: string | null;
}

const fetchLostPets = async (): Promise<LostPetAlert[]> => {
  const { data, error } = await supabaseAdmin
    .from('pets')
    .select('id, name, species, breed, status, created_at, user_id, profile_photo_url')
    .eq('status', 'lost')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const LostPetsPage = () => {
  const [selectedPet, setSelectedPet] = useState<LostPetAlert | null>(null);
  const queryClient = useQueryClient();

  const { data: lostPets, isLoading, error } = useQuery({
    queryKey: ['admin-lost-pets'],
    queryFn: fetchLostPets,
  });

  const markAsFoundMutation = useMutation({
    mutationFn: async (petId: string) => {
      const { error } = await supabaseAdmin
        .from('pets')
        .update({ status: 'active' })
        .eq('id', petId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lost-pets'] });
      setSelectedPet(null);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lost Pet Alerts</h1>
          <p className="text-gray-600">Review and manage lost pet reports</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-warning">
            {lostPets?.length || 0} Active Alerts
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Alerts</p>
            <p className="text-2xl font-bold text-gray-900">
              {lostPets?.length || 0}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Resolved This Month</p>
            <p className="text-2xl font-bold text-gray-900">12</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg. Resolution Time</p>
            <p className="text-2xl font-bold text-gray-900">3.2 days</p>
          </div>
        </div>
      </div>

      {/* Lost Pets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-admin-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          Error loading lost pets
        </div>
      ) : lostPets?.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Active Alerts
          </h3>
          <p className="text-gray-500">All lost pet cases have been resolved</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lostPets?.map((pet) => (
            <div key={pet.id} className="card overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {pet.profile_photo_url ? (
                  <img
                    src={pet.profile_photo_url}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Dog className="h-16 w-16 text-gray-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {pet.species}
                      {pet.breed && ` - ${pet.breed}`}
                    </p>
                  </div>
                  <span className="badge badge-warning">Lost</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(pet.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPet(pet)}
                    className="btn-outline flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </button>
                  <button
                    onClick={() => markAsFoundMutation.mutate(pet.id)}
                    disabled={markAsFoundMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {markAsFoundMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Found
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lost Pet Details
                </h2>
                <button
                  onClick={() => setSelectedPet(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-xl bg-orange-100 flex items-center justify-center">
                  {selectedPet.profile_photo_url ? (
                    <img
                      src={selectedPet.profile_photo_url}
                      alt={selectedPet.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Dog className="h-10 w-10 text-orange-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xl">{selectedPet.name}</h3>
                  <p className="text-gray-500 capitalize">
                    {selectedPet.species}
                    {selectedPet.breed && ` - ${selectedPet.breed}`}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Reported</p>
                  <p className="text-gray-900">
                    {formatDistanceToNow(new Date(selectedPet.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner ID</p>
                  <p className="text-gray-900 font-mono text-sm">
                    {selectedPet.user_id}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedPet(null)}
                  className="btn-outline flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => markAsFoundMutation.mutate(selectedPet.id)}
                  disabled={markAsFoundMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {markAsFoundMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Mark as Found'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
