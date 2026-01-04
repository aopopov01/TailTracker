/**
 * Dashboard Page
 * Main dashboard after login with clean, minimal design
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Bell, Loader2, PawPrint, CalendarClock, ChevronRight, Users, Eye } from 'lucide-react';
import { getPets, getPendingRemindersCount, syncReminders } from '@tailtracker/shared-services';
import { useAuthStore } from '@/stores/authStore';
import { PetImage } from '@/components/Pet';
import { supabase } from '@/lib/supabase';
import { invalidateReminderData } from '@/lib/cacheUtils';
import { usePetsSharedWithMe, useHasSharedPets } from '@/hooks';

interface NextAppointment {
  date: Date;
  startTime: string | null;
  title: string;
  petName: string;
  petId: string;
  type: 'vaccination' | 'medical';
}

export const DashboardPage = () => {
  const { user, isInitialized, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);

  // Fetch pets shared with me
  const { sharedPets, isLoading: loadingSharedPets } = usePetsSharedWithMe();
  const { hasSharedPets } = useHasSharedPets();

  const {
    data: pets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pets', user?.id],
    queryFn: getPets,
    enabled: isInitialized && isAuthenticated,
    retry: 2,
  });

  // Fetch pending reminders count
  // CRITICAL: Include user ID in query key to prevent cross-user cache pollution
  const { data: pendingRemindersCount = 0 } = useQuery({
    queryKey: ['pendingRemindersCount', user?.id],
    queryFn: getPendingRemindersCount,
    enabled: isInitialized && isAuthenticated && !!user?.id,
  });

  // Sync reminders mutation
  const syncMutation = useMutation({
    mutationFn: syncReminders,
    onSuccess: (result) => {
      if (result.created > 0) {
        // Invalidate all reminder-related caches
        invalidateReminderData();
      }
    },
  });

  // Sync reminders on mount
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      syncMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isAuthenticated]);

  // Fetch next appointment from vaccinations and medical records
  useEffect(() => {
    const fetchNextAppointment = async () => {
      if (!user?.id || !pets || pets.length === 0 || !supabase) return;

      const now = new Date();
      // Get today's date at midnight for the query filter (we'll do precise filtering in JS)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const petIds = pets.map((p) => p.id);

      try {
        // Fetch upcoming vaccinations (include end time for precise filtering)
        const { data: vaccinations } = await supabase
          .from('vaccinations')
          .select('pet_id, vaccine_name, next_due_date, next_due_start_time, next_due_end_time')
          .in('pet_id', petIds)
          .gte('next_due_date', today.toISOString().split('T')[0])
          .order('next_due_date', { ascending: true });

        // Fetch upcoming medical follow-ups (include end time for precise filtering)
        const { data: medicalRecords } = await supabase
          .from('medical_records')
          .select('pet_id, title, follow_up_date, follow_up_start_time, follow_up_end_time')
          .in('pet_id', petIds)
          .gte('follow_up_date', today.toISOString().split('T')[0])
          .order('follow_up_date', { ascending: true });

        // Helper to parse time string (HH:MM or HH:MM:SS)
        const parseTime = (timeStr: string | null | undefined): { hours: number; minutes: number; seconds: number } => {
          if (!timeStr) return { hours: 23, minutes: 59, seconds: 59 }; // Default to end of day
          const parts = timeStr.split(':').map(Number);
          return {
            hours: parts[0] || 0,
            minutes: parts[1] || 0,
            seconds: parts[2] || 0,
          };
        };

        // Helper to check if appointment has ended (based on end time)
        const isAppointmentEnded = (dateStr: string, endTimeStr: string | null | undefined): boolean => {
          const appointmentDate = new Date(dateStr);
          const { hours, minutes, seconds } = parseTime(endTimeStr);
          appointmentDate.setHours(hours, minutes, seconds);
          return appointmentDate <= now;
        };

        // Helper to create appointment datetime from date and start time
        const createAppointmentDate = (dateStr: string, startTimeStr: string | null | undefined): Date => {
          const date = new Date(dateStr);
          if (startTimeStr) {
            const { hours, minutes, seconds } = parseTime(startTimeStr);
            date.setHours(hours, minutes, seconds);
          } else {
            // No start time specified - set to beginning of day
            date.setHours(0, 0, 0, 0);
          }
          return date;
        };

        // Combine and filter for appointments that haven't ended yet
        const allAppointments: Array<{
          date: Date;
          startTime: string | null;
          title: string;
          petId: string;
          type: 'vaccination' | 'medical';
        }> = [];

        vaccinations?.forEach((v) => {
          if (v.next_due_date) {
            // Skip if appointment has already ended
            if (isAppointmentEnded(v.next_due_date, v.next_due_end_time)) {
              return;
            }
            allAppointments.push({
              date: createAppointmentDate(v.next_due_date, v.next_due_start_time),
              startTime: v.next_due_start_time || null,
              title: v.vaccine_name || 'Vaccination',
              petId: v.pet_id,
              type: 'vaccination',
            });
          }
        });

        medicalRecords?.forEach((m) => {
          if (m.follow_up_date) {
            // Skip if appointment has already ended
            if (isAppointmentEnded(m.follow_up_date, m.follow_up_end_time)) {
              return;
            }
            allAppointments.push({
              date: createAppointmentDate(m.follow_up_date, m.follow_up_start_time),
              startTime: m.follow_up_start_time || null,
              title: m.title || 'Follow-up',
              petId: m.pet_id,
              type: 'medical',
            });
          }
        });

        // Sort by date/time and get nearest
        allAppointments.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (allAppointments.length > 0) {
          const nearest = allAppointments[0];
          const pet = pets.find((p) => p.id === nearest.petId);
          setNextAppointment({
            date: nearest.date,
            startTime: nearest.startTime,
            title: nearest.title,
            petId: nearest.petId,
            type: nearest.type,
            petName: pet?.name || 'Unknown',
          });
        } else {
          setNextAppointment(null);
        }
      } catch (err) {
        console.error('Error fetching next appointment:', err);
        setNextAppointment(null);
      }
    };

    fetchNextAppointment();
  }, [user?.id, pets]);

  // Format next appointment display
  const formatNextAppointment = () => {
    if (!nextAppointment) return { main: 'None', sub: 'No upcoming appointments' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDay = new Date(nextAppointment.date);
    appointmentDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((appointmentDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let main: string;
    if (diffDays === 0) {
      // Today - show time if available
      if (nextAppointment.startTime) {
        const [hours, minutes] = nextAppointment.startTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0);
        const timeStr = timeDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        main = `Today at ${timeStr}`;
      } else {
        main = 'Today';
      }
    } else if (diffDays === 1) {
      main = 'Tomorrow';
    } else if (diffDays <= 7) {
      main = `${diffDays} days`;
    } else {
      main = nextAppointment.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    const sub = `${nextAppointment.title} - ${nextAppointment.petName}`;

    return { main, sub };
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-slate-600 mt-1">
          Here's what's happening with your pets today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <img src="/images/pets/logo.png" alt="Pets" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Pets</p>
              <p className="text-2xl font-bold text-slate-900">
                {isLoading ? '-' : pets?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Next Appointment Card */}
        <div
          className={`card p-5 ${
            nextAppointment ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
          }`}
          onClick={() => {
            if (!nextAppointment) return;
            // Navigate to the specific record type page
            const path = nextAppointment.type === 'vaccination'
              ? `/pets/${nextAppointment.petId}/vaccinations`
              : `/pets/${nextAppointment.petId}/medical-records`;
            navigate(path);
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                nextAppointment ? 'bg-amber-100' : 'bg-slate-100'
              }`}
            >
              <CalendarClock
                className={`h-6 w-6 ${nextAppointment ? 'text-amber-500' : 'text-slate-400'}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500">Next Appointment</p>
              <p className="text-2xl font-bold text-slate-900">{formatNextAppointment().main}</p>
              {nextAppointment && (
                <p
                  className="text-xs text-slate-500 truncate"
                  title={formatNextAppointment().sub}
                >
                  {formatNextAppointment().sub}
                </p>
              )}
            </div>
            {nextAppointment && <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />}
          </div>
        </div>

        <div
          className={`card p-5 ${
            pendingRemindersCount > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
          }`}
          onClick={() => {
            if (pendingRemindersCount > 0) {
              navigate('/reminders');
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                pendingRemindersCount > 0 ? 'bg-amber-100' : 'bg-primary-100'
              }`}
            >
              <Bell
                className={`h-6 w-6 ${
                  pendingRemindersCount > 0 ? 'text-amber-500' : 'text-primary-500'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500">Reminders</p>
              <p className="text-2xl font-bold text-slate-900">{pendingRemindersCount}</p>
              {pendingRemindersCount > 0 && (
                <p className="text-xs text-amber-600">Overdue appointments</p>
              )}
            </div>
            {pendingRemindersCount > 0 && (
              <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
            )}
          </div>
        </div>

        <Link
          to="/pets/new"
          className="card p-5 border-dashed border-2 border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <Plus className="h-6 w-6 text-slate-400 group-hover:text-primary-500 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Add a Pet</p>
              <p className="text-sm text-slate-500">Create new profile</p>
            </div>
          </div>
        </Link>
      </div>

      {/* My Pets Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">My Pets</h2>
          <Link to="/pets" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="card p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-3" />
            <p className="text-slate-500 text-sm">Loading your pets...</p>
          </div>
        ) : error ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <img src="/images/pets/logo.png" alt="Error" className="h-8 w-8 object-contain" />
            </div>
            <p className="text-red-600 font-medium">Failed to load pets</p>
            <p className="text-slate-500 text-sm mt-1">Please try again later.</p>
          </div>
        ) : pets && pets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.slice(0, 3).map((pet) => (
              <Link
                key={pet.id}
                to={`/pets/${pet.id}`}
                className="card p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <PetImage
                    petId={pet.id}
                    species={pet.species}
                    petName={pet.name}
                    className="w-16 h-16 rounded-xl bg-primary-50"
                  />
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {pet.name}
                    </h3>
                    <p className="text-sm text-slate-500 capitalize">
                      {pet.species}
                      {pet.breed && ` - ${pet.breed}`}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <img src="/images/pets/logo.png" alt="No pets" className="h-10 w-10 object-contain" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No pets yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Add your first furry friend to get started with TailTracker
            </p>
            <Link to="/pets/new" className="btn-primary inline-flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Add Your First Pet
            </Link>
          </div>
        )}
      </div>

      {/* Shared With Me Section - Only show if user has shared pets */}
      {hasSharedPets && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Shared with Me</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                <Eye className="h-3 w-3" />
                Read-only
              </span>
            </div>
            <Link to="/shared-pets" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>

          {loadingSharedPets ? (
            <div className="card p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : sharedPets && sharedPets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedPets.slice(0, 3).map((sharedPet) => (
                <Link
                  key={sharedPet.id}
                  to={`/shared-pets/${sharedPet.petId}`}
                  className="card p-4 hover:shadow-md transition-shadow group border-l-4 border-l-blue-400"
                >
                  <div className="flex items-center gap-4">
                    <PetImage
                      petId={sharedPet.petId}
                      species={sharedPet.petSpecies || 'dog'}
                      petName={sharedPet.petName || 'Pet'}
                      className="w-16 h-16 rounded-xl bg-blue-50"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                        {sharedPet.petName || 'Unknown'}
                      </h3>
                      <p className="text-sm text-slate-500 capitalize truncate">
                        {sharedPet.petSpecies}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {sharedPet.ownerName || 'Shared'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
