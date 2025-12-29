/**
 * Dashboard Page
 * Main dashboard after login with clean, minimal design
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Bell, Loader2, PawPrint, CalendarClock, ChevronRight } from 'lucide-react';
import { getPets, getPendingRemindersCount, syncReminders } from '@tailtracker/shared-services';
import { useAuthStore } from '@/stores/authStore';
import { PetImage } from '@/components/Pet';
import { supabase } from '@/lib/supabase';

interface NextAppointment {
  date: Date;
  title: string;
  petName: string;
  petId: string;
  type: 'vaccination' | 'medical';
}

export const DashboardPage = () => {
  const { user, isInitialized, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);

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
  const { data: pendingRemindersCount = 0 } = useQuery({
    queryKey: ['pendingRemindersCount'],
    queryFn: getPendingRemindersCount,
    enabled: isInitialized && isAuthenticated,
  });

  // Sync reminders mutation
  const syncMutation = useMutation({
    mutationFn: syncReminders,
    onSuccess: (result) => {
      if (result.created > 0) {
        queryClient.invalidateQueries({ queryKey: ['pendingRemindersCount'] });
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const petIds = pets.map((p) => p.id);

      try {
        // Fetch upcoming vaccinations
        const { data: vaccinations } = await supabase
          .from('vaccinations')
          .select('pet_id, vaccine_name, next_due_date, next_due_start_time')
          .in('pet_id', petIds)
          .gte('next_due_date', today.toISOString().split('T')[0])
          .order('next_due_date', { ascending: true });

        // Fetch upcoming medical follow-ups
        const { data: medicalRecords } = await supabase
          .from('medical_records')
          .select('pet_id, title, follow_up_date, follow_up_start_time')
          .in('pet_id', petIds)
          .gte('follow_up_date', today.toISOString().split('T')[0])
          .order('follow_up_date', { ascending: true });

        // Combine and find earliest
        const allAppointments: Array<{
          date: Date;
          title: string;
          petId: string;
          type: 'vaccination' | 'medical';
        }> = [];

        vaccinations?.forEach((v) => {
          if (v.next_due_date) {
            const dateStr = v.next_due_start_time
              ? `${v.next_due_date}T${v.next_due_start_time}`
              : v.next_due_date;
            allAppointments.push({
              date: new Date(dateStr),
              title: v.vaccine_name || 'Vaccination',
              petId: v.pet_id,
              type: 'vaccination',
            });
          }
        });

        medicalRecords?.forEach((m) => {
          if (m.follow_up_date) {
            const dateStr = m.follow_up_start_time
              ? `${m.follow_up_date}T${m.follow_up_start_time}`
              : m.follow_up_date;
            allAppointments.push({
              date: new Date(dateStr),
              title: m.title || 'Follow-up',
              petId: m.pet_id,
              type: 'medical',
            });
          }
        });

        // Sort by date and get nearest
        allAppointments.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (allAppointments.length > 0) {
          const nearest = allAppointments[0];
          const pet = pets.find((p) => p.id === nearest.petId);
          setNextAppointment({
            ...nearest,
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

    const now = new Date();
    const diffTime = nextAppointment.date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let main: string;
    if (diffDays <= 0) {
      main = 'Today';
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
    </div>
  );
};
