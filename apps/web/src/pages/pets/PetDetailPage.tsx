/**
 * Pet Detail Page
 * View and manage individual pet profile
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Edit,
  Trash2,
  Calendar,
  CalendarDays,
  Scale,
  Camera,
  BookOpen,
  Syringe,
  FileText,
  ChevronRight,
  Users,
  Cpu,
  AlertTriangle,
  Check,
  Bell,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  getPetById,
  deletePet,
  getPetPhotos,
  getVaccinationSummary,
  getMedicalRecordSummary,
  getReminderSummary,
  getPetFamilyMembers,
  checkPetAccess,
  getMaxFamilyMembersAllowed,
} from '@tailtracker/shared-services';
import { FamilySharingModal } from '@/components/FamilySharingModal';
import { calculateAge } from '@tailtracker/shared-utils';
import { PhotoGallery, LostPetAlertModal, MarkAsFoundModal } from '@/components/Pet';
import { useAuth } from '@/hooks/useAuth';
import type { SubscriptionTier } from '@tailtracker/shared-types';
import { invalidatePetData, invalidateLostPetData } from '@/lib/cacheUtils';

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

export const PetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFamilySharingModal, setShowFamilySharingModal] = useState(false);
  const [showLostPetModal, setShowLostPetModal] = useState(false);
  const [showMarkAsFoundModal, setShowMarkAsFoundModal] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<{
    date: Date;
    title: string;
    type: 'vaccination' | 'medical';
  } | null>(null);

  const {
    data: pet,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => getPetById(id!),
    enabled: !!id,
  });

  // Check if user is owner (for showing/hiding edit controls)
  const { data: accessInfo } = useQuery({
    queryKey: ['petAccess', id],
    queryFn: () => checkPetAccess(id!),
    enabled: !!id,
  });

  const isOwner = accessInfo?.isOwner ?? true;

  // Fetch family members for the pet
  const { data: familyMembers = [], isLoading: isFamilyLoading } = useQuery({
    queryKey: ['petFamilyMembers', id],
    queryFn: () => getPetFamilyMembers(id!),
    enabled: !!id && isOwner,
  });

  // Get max family members allowed by subscription
  const { data: maxFamilyMembers = 2 } = useQuery({
    queryKey: ['maxFamilyMembers', user?.id],
    queryFn: () => getMaxFamilyMembersAllowed(user!.id),
    enabled: isOwner && !!user?.id,
  });

  // Fetch user subscription tier for lost pet alerts
  const { data: userSubscription, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ['userSubscription', user?.id],
    queryFn: async () => {
      if (!supabase || !user?.id) return { tier: 'free' as SubscriptionTier };

      // Use the RPC function to get subscription tier (bypasses RLS issues)
      const { data: rpcTier, error: rpcError } = await supabase
        .rpc('get_user_subscription_tier', { target_user_id: user.id });

      if (!rpcError && rpcTier) {
        return { tier: rpcTier as SubscriptionTier };
      }

      // Fallback: Query users table directly
      // Note: subscription_status now uses same values as app tier (free, premium, pro)
      const { data } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', user.id)
        .single();

      const tier = (data?.subscription_status as SubscriptionTier) || 'free';
      return { tier };
    },
    enabled: isOwner && !!user?.id,
  });

  const userTier: SubscriptionTier = userSubscription?.tier || 'free';

  // Fetch photos to get profile photo
  const { data: photos = [] } = useQuery({
    queryKey: ['petPhotos', id],
    queryFn: () => getPetPhotos(id!),
    enabled: !!id,
  });

  const profilePhoto = photos.find((p) => p.isProfilePhoto) || photos[0];

  // Fetch vaccination summary
  const { data: vaccinationSummary } = useQuery({
    queryKey: ['vaccinationSummary', id],
    queryFn: () => getVaccinationSummary(id!),
    enabled: !!id,
  });

  // Fetch medical record summary
  const { data: medicalSummary } = useQuery({
    queryKey: ['medicalRecordSummary', id],
    queryFn: () => getMedicalRecordSummary(id!),
    enabled: !!id,
  });

  // Fetch reminder summary
  // CRITICAL: Include user ID in query key to prevent cross-user cache pollution
  const { data: reminderSummary } = useQuery({
    queryKey: ['reminderSummary', id, user?.id],
    queryFn: () => getReminderSummary(id!),
    enabled: !!id && !!user?.id,
  });

  // Fetch next upcoming appointment (vaccination or medical follow-up)
  useEffect(() => {
    const fetchNextAppointment = async () => {
      if (!pet?.id || !supabase) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch upcoming vaccinations (next_due_date)
      const { data: vaccinations } = await supabase
        .from('vaccinations')
        .select('vaccine_name, next_due_date')
        .eq('pet_id', pet.id)
        .gte('next_due_date', today.toISOString())
        .order('next_due_date', { ascending: true });

      // Fetch upcoming medical records (follow_up_date)
      const { data: medicalRecords } = await supabase
        .from('medical_records')
        .select('title, follow_up_date')
        .eq('pet_id', pet.id)
        .gte('follow_up_date', today.toISOString())
        .order('follow_up_date', { ascending: true });

      // Combine and find the earliest upcoming appointment
      const allAppointments: { date: Date; title: string; type: 'vaccination' | 'medical' }[] = [];

      vaccinations?.forEach((v) => {
        if (v.next_due_date) {
          allAppointments.push({
            date: new Date(v.next_due_date),
            title: v.vaccine_name || 'Vaccination',
            type: 'vaccination',
          });
        }
      });

      medicalRecords?.forEach((m) => {
        if (m.follow_up_date) {
          allAppointments.push({
            date: new Date(m.follow_up_date),
            title: m.title || 'Follow-up',
            type: 'medical',
          });
        }
      });

      // Sort by date and get the nearest one
      allAppointments.sort((a, b) => a.date.getTime() - b.date.getTime());

      if (allAppointments.length > 0) {
        setNextAppointment(allAppointments[0]);
      } else {
        setNextAppointment(null);
      }
    };

    fetchNextAppointment();
  }, [pet?.id]);

  // Format next appointment for display
  const formatNextAppointment = () => {
    if (!nextAppointment) return 'No upcoming';

    const now = new Date();
    const diffTime = nextAppointment.date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;

    return nextAppointment.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const deleteMutation = useMutation({
    mutationFn: () => deletePet(id!),
    onSuccess: () => {
      // Invalidate all pet-related caches
      invalidatePetData(id);
      navigate('/pets');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Pet not found
        </h2>
        <p className="text-gray-600 mb-4">
          The pet you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/pets" className="btn-primary">
          Back to My Pets
        </Link>
      </div>
    );
  }

  const age = pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/pets"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Pets
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {profilePhoto ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={profilePhoto.url}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-100 flex items-center justify-center">
                <img
                  src={getSpeciesImage(pet.species)}
                  alt={pet.name}
                  className="w-12 h-12 object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
              <p className="text-gray-600 capitalize">
                {pet.species}
                {pet.breed && ` - ${pet.breed}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/pets/${id}/passport`} className="btn-outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Passport
            </Link>
            {isOwner && (
              <button
                onClick={() => setShowFamilySharingModal(true)}
                className="btn-outline"
              >
                <Users className="h-4 w-4 mr-2" />
                Family
              </button>
            )}
            {isOwner && (
              <Link to={`/pets/${id}/edit`} className="btn-outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            )}
            {isOwner && pet?.status !== 'lost' && (
              <button
                onClick={() => setShowLostPetModal(true)}
                disabled={isSubscriptionLoading}
                className="btn-outline text-orange-600 border-orange-300 hover:bg-orange-50 disabled:opacity-50"
              >
                {isSubscriptionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Lost
                  </>
                )}
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
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
            )}
          </div>
        </div>
      </div>

      {/* Lost pet status banner */}
      {pet?.status === 'lost' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {pet.name} is currently reported as lost
                </p>
                <p className="text-sm text-red-700">
                  Nearby TailTracker users have been notified to help find {pet.name}.
                </p>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowMarkAsFoundModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Check className="h-4 w-4" />
                Mark as Found
              </button>
            )}
          </div>
        </div>
      )}

      {/* Read-only access banner for family members */}
      {!isOwner && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Shared Access (Read Only)
              </p>
              <p className="text-sm text-blue-700">
                You have view-only access to {pet.name}'s profile as a family member.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-semibold text-gray-900">
                {age || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Scale className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight</p>
              <p className="font-semibold text-gray-900">
                {pet.weight?.value
                  ? `${pet.weight.value} ${pet.weight.unit}`
                  : 'Not recorded'}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            if (nextAppointment) {
              navigate(
                nextAppointment.type === 'vaccination'
                  ? `/pets/${id}/vaccinations`
                  : `/pets/${id}/medical-records`
              );
            }
          }}
          className={`card p-4 transition-all ${
            nextAppointment
              ? 'cursor-pointer hover:shadow-md hover:border-amber-300'
              : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">Next Appointment</p>
              <p className="font-semibold text-gray-900">{formatNextAppointment()}</p>
              {nextAppointment && (
                <p
                  className="text-xs text-gray-400 truncate"
                  title={nextAppointment.title}
                >
                  {nextAppointment.title}
                </p>
              )}
            </div>
            {nextAppointment && (
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Microchip</p>
              <p className="font-semibold text-gray-900">
                {pet.microchipNumber || 'Not registered'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Section */}
      <div className="card mb-6">
        <div className="p-4 border-b flex items-center gap-2">
          <Camera className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Photos</h2>
        </div>
        <div className="p-4">
          <PhotoGallery petId={id!} petName={pet.name} />
        </div>
      </div>

      {/* Health Tracking Section */}
      <div className="card mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Health Tracking</h2>
        </div>
        <div className="divide-y">
          {/* Vaccinations Link */}
          <Link
            to={`/pets/${id}/vaccinations`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Syringe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Vaccinations</p>
                <p className="text-sm text-gray-500">
                  {vaccinationSummary ? (
                    <>
                      {vaccinationSummary.total} records
                      {vaccinationSummary.overdue > 0 && (
                        <span className="text-red-600 ml-2">
                          ({vaccinationSummary.overdue} overdue)
                        </span>
                      )}
                      {vaccinationSummary.dueSoon > 0 &&
                        vaccinationSummary.overdue === 0 && (
                          <span className="text-orange-600 ml-2">
                            ({vaccinationSummary.dueSoon} due soon)
                          </span>
                        )}
                    </>
                  ) : (
                    'Track vaccinations'
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>

          {/* Medical Records Link */}
          <Link
            to={`/pets/${id}/medical-records`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Medical Records</p>
                <p className="text-sm text-gray-500">
                  {medicalSummary ? (
                    <>
                      {medicalSummary.total} records
                      {medicalSummary.scheduled > 0 && (
                        <span className="text-blue-600 ml-2">
                          ({medicalSummary.scheduled} scheduled)
                        </span>
                      )}
                    </>
                  ) : (
                    'Track medical history'
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>

          {/* Reminders Link */}
          <Link
            to="/reminders"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Reminders</p>
                <p className="text-sm text-gray-500">
                  {reminderSummary ? (
                    <>
                      {reminderSummary.pending > 0 ? (
                        <span className="text-amber-600">
                          {reminderSummary.pending} pending
                        </span>
                      ) : (
                        'All caught up'
                      )}
                    </>
                  ) : (
                    'Overdue appointments'
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Info */}
        <div className="card">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Health Information</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Medical Conditions</p>
              <p className="text-gray-900">
                {pet.medicalConditions?.length
                  ? pet.medicalConditions.map((c) => c.name).join(', ')
                  : 'None recorded'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Allergies</p>
              <p className="text-gray-900">
                {pet.allergies?.length
                  ? pet.allergies.join(', ')
                  : 'None recorded'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Medications</p>
              <p className="text-gray-900">
                {pet.currentMedications?.length
                  ? pet.currentMedications.map((m) => m.name).join(', ')
                  : 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="card">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Personality & Care</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Personality Traits</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {pet.personalityTraits?.length ? (
                  pet.personalityTraits.map((trait) => (
                    <span
                      key={trait}
                      className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                    >
                      {trait}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-900">Not specified</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Favorite Activities</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {pet.favoriteActivities?.length ? (
                  pet.favoriteActivities.map((activity) => (
                    <span
                      key={activity}
                      className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                    >
                      {activity}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-900">Not specified</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Exercise Needs</p>
              <p className="text-gray-900 capitalize">
                {pet.exerciseNeeds || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Special Notes</p>
              <p className="text-gray-900">
                {pet.specialNotes || 'No special notes'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Family Sharing Modal */}
      <FamilySharingModal
        isOpen={showFamilySharingModal}
        onClose={() => setShowFamilySharingModal(false)}
        petId={id!}
        petName={pet.name}
        currentFamilyMembers={familyMembers}
        maxFamilyMembers={maxFamilyMembers}
        isLoading={isFamilyLoading}
      />

      {/* Lost Pet Alert Modal */}
      {pet && (
        <LostPetAlertModal
          isOpen={showLostPetModal}
          onClose={() => setShowLostPetModal(false)}
          pet={pet}
          userTier={userTier}
        />
      )}

      {/* Mark as Found Modal */}
      {pet && (
        <MarkAsFoundModal
          isOpen={showMarkAsFoundModal}
          onClose={() => setShowMarkAsFoundModal(false)}
          petName={pet.name}
          onConfirm={async (notes?: string) => {
            if (supabase) {
              await supabase
                .from('pets')
                .update({ status: 'active' })
                .eq('id', pet.id);
              await supabase
                .from('lost_pets')
                .update({
                  status: 'found',
                  found_date: new Date().toISOString(),
                  ...(notes && { found_notes: notes }),
                })
                .eq('pet_id', pet.id)
                .eq('status', 'lost');
              // Invalidate pet and lost pet caches
              invalidatePetData(id);
              invalidateLostPetData();
              setShowMarkAsFoundModal(false);
            }
          }}
        />
      )}
    </div>
  );
};
