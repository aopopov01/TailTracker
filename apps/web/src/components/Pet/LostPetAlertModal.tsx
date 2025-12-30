/**
 * Lost Pet Alert Modal
 * Modal wrapper for the Lost Pet Alert form
 * Only available to Pro tier users
 */

import { useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invalidatePetData, invalidateLostPetData } from '@/lib/cacheUtils';
import { X, AlertTriangle, Crown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { LostPetAlertForm } from './LostPetAlertForm';
import type { Pet, LostPetAlertFormData, SubscriptionTier } from '@tailtracker/shared-types';
import { supabase } from '@/lib/supabase';
import { getPetPhotos } from '@tailtracker/shared-services';

interface LostPetAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
  userTier: SubscriptionTier;
}

export const LostPetAlertModal = ({
  isOpen,
  onClose,
  pet,
  userTier,
}: LostPetAlertModalProps) => {
  const isPro = userTier === 'pro';

  // Fetch pet photos for the form
  const { data: petPhotos = [] } = useQuery({
    queryKey: ['petPhotos', pet.id],
    queryFn: () => getPetPhotos(pet.id),
    enabled: isOpen && !!pet.id,
  });

  // Convert photo objects to URL strings for the form
  const photoUrls = petPhotos.map(p => p.url);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Create lost pet alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (data: LostPetAlertFormData & { selectedPhotos?: string[] }) => {
      if (!supabase) throw new Error('Database not available');

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('Not authenticated');

      // Get the users table ID (not auth user ID)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', currentUser.id)
        .single();

      if (userError || !userData) {
        throw new Error('User profile not found');
      }

      // Convert alert radius from meters to km
      const radiusKm = Math.round((data.alertRadius || 5000) / 1000);

      // Create the lost pet report in the lost_pets table
      const { data: report, error } = await supabase
        .from('lost_pets')
        .insert({
          pet_id: data.petId,
          reported_by: userData.id,
          status: 'lost',
          last_seen_date: data.lastSeenDate.toISOString(),
          latitude: data.lastSeenLocation.latitude,
          longitude: data.lastSeenLocation.longitude,
          last_seen_address: data.lastSeenAddress,
          description: data.description,
          contact_phone: data.contactPhone,
          contact_email: data.contactEmail,
          reward_amount: data.rewardAmount,
          search_radius_km: radiusKm,
          photo_urls: data.selectedPhotos || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(error.message || 'Failed to create lost pet alert');
      }

      // Update pet status to 'lost'
      const { error: petError } = await supabase
        .from('pets')
        .update({ status: 'lost' })
        .eq('id', data.petId);

      if (petError) {
        console.error('Failed to update pet status:', petError);
      }

      // Call the edge function to send push notifications to nearby users
      try {
        const { error: fnError } = await supabase.functions.invoke('lost-pet-alerts', {
          body: {
            report_id: report.id,
            pet_id: pet.id,
            pet_name: pet.name,
            species: pet.species,
            breed: pet.breed,
            last_seen_location: {
              latitude: data.lastSeenLocation.latitude,
              longitude: data.lastSeenLocation.longitude,
            },
            last_seen_address: data.lastSeenAddress,
            last_seen_date: data.lastSeenDate.toISOString(),
            description: data.description,
            contact_phone: data.contactPhone,
            contact_email: data.contactEmail,
            reward_amount: data.rewardAmount,
            urgency: 'high',
            alert_radius: data.alertRadius || 5000,
            created_by: currentUser.id,
          },
        });

        if (fnError) {
          console.error('Failed to send notifications:', fnError);
          // Don't throw - the report was created successfully
        }
      } catch (fnErr) {
        console.error('Edge function error:', fnErr);
        // Don't throw - the report was created successfully
      }

      return report;
    },
    onSuccess: () => {
      // Invalidate pet and lost pet caches
      invalidatePetData(pet.id);
      invalidateLostPetData();
      onClose();
    },
  });

  const handleSubmit = useCallback(
    async (data: LostPetAlertFormData & { selectedPhotos?: string[] }) => {
      await createAlertMutation.mutateAsync(data);
    },
    [createAlertMutation]
  );

  // Create a pet object with photos for the form
  const petWithPhotos = {
    ...pet,
    photos: photoUrls,
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Report Lost Pet
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isPro ? (
            <>
              {createAlertMutation.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {createAlertMutation.error instanceof Error
                    ? createAlertMutation.error.message
                    : 'Failed to create alert. Please try again.'}
                </div>
              )}
              <LostPetAlertForm
                pet={petWithPhotos}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isSubmitting={createAlertMutation.isPending}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Pro Feature
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Creating lost pet alerts is available exclusively to Pro tier members.
                Upgrade to alert nearby users when your pet goes missing.
              </p>
              <div className="space-y-3">
                <a
                  href="/pricing"
                  className="block w-full btn-primary"
                >
                  Upgrade to Pro
                </a>
                <button
                  onClick={onClose}
                  className="block w-full px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Maybe Later
                </button>
              </div>

              {/* Feature highlights */}
              <div className="mt-8 text-left bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Pro tier includes:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Create lost pet alerts with location pinning
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Notify nearby TailTracker users instantly
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Receive community sightings and reports
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Up to 10 pet profiles
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Up to 10 photos per pet
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Email reminders
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default LostPetAlertModal;
