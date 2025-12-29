/**
 * Calendar Page
 * Visual calendar view showing all pet appointments from vaccinations and medical records
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: 'vaccination' | 'medical';
    petId: string;
    recordId: string;
    petName: string;
    isPast?: boolean;
  };
}

export const CalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Prevent duplicate requests
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Loading timeout - prevent infinite loading
  useEffect(() => {
    if (!loading) return;

    const timeout = setTimeout(() => {
      if (mountedRef.current && loading) {
        setLoading(false);
        setError('Calendar took too long to load. Please refresh the page.');
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!fetchingRef.current) {
      fetchAllAppointments();
    }
  }, []);

  const fetchAllAppointments = async () => {
    // Prevent duplicate concurrent requests
    if (fetchingRef.current) {
      return;
    }
    fetchingRef.current = true;

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Failed to authenticate');
      }
      if (!user) {
        if (mountedRef.current) {
          setLoading(false);
        }
        fetchingRef.current = false;
        return;
      }

      // Get user's pets
      const { data: pets, error: petsError } = await supabase
        .from('pets')
        .select('id, name')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (petsError) {
        console.error('Pets fetch error:', petsError);
        throw new Error('Failed to load pets');
      }

      if (!pets?.length) {
        if (mountedRef.current) {
          setLoading(false);
        }
        fetchingRef.current = false;
        return;
      }

      const petIds = pets.map(p => p.id);
      const petMap = Object.fromEntries(pets.map(p => [p.id, p.name]));

      // Fetch ALL vaccinations (both past and future) with time fields
      // Continue even if this fails
      const { data: vaccinations, error: vaxError } = await supabase
        .from('vaccinations')
        .select('id, pet_id, vaccine_name, administered_date, next_due_date, next_due_start_time, next_due_end_time')
        .in('pet_id', petIds);

      if (vaxError) {
        console.error('Vaccinations fetch error:', vaxError);
        // Continue with empty array - don't fail completely
      }

      // Fetch ALL medical records with time fields
      // Use * to get all columns and avoid column name issues
      const { data: medicalRecords, error: medError } = await supabase
        .from('medical_records')
        .select('*')
        .in('pet_id', petIds);

      if (medError) {
        console.error('Medical records fetch error:', medError);
        // Continue with empty array - don't fail completely
      }

      const calendarEvents: CalendarEvent[] = [];

      // Default time slot for events without times (8:00 AM - 8:30 AM)
      const DEFAULT_START_TIME = '08:00:00';
      const DEFAULT_END_TIME = '08:30:00';

      // Helper to format time - ensures HH:MM:SS format
      const formatTime = (time: string | null | undefined, defaultTime: string): string => {
        if (!time) return defaultTime;
        // If time already has seconds (HH:MM:SS), return as-is
        if (time.length >= 8 && time.includes(':')) return time;
        // If time is HH:MM format, add :00 for seconds
        return `${time}:00`;
      };

      // Add vaccination events
      (vaccinations || []).forEach(v => {
        // Past vaccination (administered) - with default time slot
        if (v.administered_date) {
          calendarEvents.push({
            id: `vax-past-${v.id}`,
            title: `✓ ${v.vaccine_name} - ${petMap[v.pet_id]}`,
            start: `${v.administered_date}T${DEFAULT_START_TIME}`,
            end: `${v.administered_date}T${DEFAULT_END_TIME}`,
            backgroundColor: '#fdba74', // Light orange for past
            borderColor: '#fb923c',
            extendedProps: {
              type: 'vaccination' as const,
              petId: v.pet_id,
              recordId: v.id,
              petName: petMap[v.pet_id],
              isPast: true,
            },
          });
        }

        // Future vaccination (due date) with time fields
        if (v.next_due_date) {
          const startTime = formatTime(v.next_due_start_time, DEFAULT_START_TIME);
          const endTime = formatTime(v.next_due_end_time, DEFAULT_END_TIME);
          calendarEvents.push({
            id: `vax-future-${v.id}`,
            title: `💉 ${v.vaccine_name} - ${petMap[v.pet_id]}`,
            start: `${v.next_due_date}T${startTime}`,
            end: `${v.next_due_date}T${endTime}`,
            backgroundColor: '#f97316', // Orange for upcoming
            borderColor: '#ea580c',
            extendedProps: {
              type: 'vaccination' as const,
              petId: v.pet_id,
              recordId: v.id,
              petName: petMap[v.pet_id],
              isPast: false,
            },
          });
        }
      });

      // Add medical record events
      (medicalRecords || []).forEach(m => {
        // Scheduled appointment - show on follow_up_date (entry_type = 'scheduled')
        if (m.entry_type === 'scheduled' && m.follow_up_date) {
          const startTime = formatTime(m.follow_up_start_time, DEFAULT_START_TIME);
          const endTime = formatTime(m.follow_up_end_time, DEFAULT_END_TIME);
          calendarEvents.push({
            id: `med-scheduled-${m.id}`,
            title: `📅 ${m.title} - ${petMap[m.pet_id]}`,
            start: `${m.follow_up_date}T${startTime}`,
            end: `${m.follow_up_date}T${endTime}`,
            backgroundColor: '#8b5cf6', // Purple for upcoming
            borderColor: '#7c3aed',
            extendedProps: {
              type: 'medical' as const,
              petId: m.pet_id,
              recordId: m.id,
              petName: petMap[m.pet_id],
              isPast: false,
            },
          });
        }
        // Past medical record - show on date_of_record (entry_type = 'past' or null)
        else if (m.entry_type !== 'scheduled' && m.date_of_record) {
          calendarEvents.push({
            id: `med-past-${m.id}`,
            title: `✓ ${m.title} - ${petMap[m.pet_id]}`,
            start: `${m.date_of_record}T${DEFAULT_START_TIME}`,
            end: `${m.date_of_record}T${DEFAULT_END_TIME}`,
            backgroundColor: '#c4b5fd', // Light purple for past
            borderColor: '#a78bfa',
            extendedProps: {
              type: 'medical' as const,
              petId: m.pet_id,
              recordId: m.id,
              petName: petMap[m.pet_id],
              isPast: true,
            },
          });

          // Also show follow-up if a past record has one scheduled
          if (m.follow_up_date) {
            const startTime = formatTime(m.follow_up_start_time, DEFAULT_START_TIME);
            const endTime = formatTime(m.follow_up_end_time, DEFAULT_END_TIME);
            calendarEvents.push({
              id: `med-followup-${m.id}`,
              title: `🏥 ${m.title} (Follow-up) - ${petMap[m.pet_id]}`,
              start: `${m.follow_up_date}T${startTime}`,
              end: `${m.follow_up_date}T${endTime}`,
              backgroundColor: '#8b5cf6', // Purple for upcoming
              borderColor: '#7c3aed',
              extendedProps: {
                type: 'medical' as const,
                petId: m.pet_id,
                recordId: m.id,
                petName: petMap[m.pet_id],
                isPast: false,
              },
            });
          }
        }
      });

      if (mountedRef.current) {
        setEvents(calendarEvents);

        // Show warning if some data failed to load but we have partial results
        if ((vaxError || medError) && calendarEvents.length > 0) {
          setError('Some calendar data may be incomplete. Try refreshing if events are missing.');
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      if (mountedRef.current) {
        setError(error instanceof Error ? error.message : 'Failed to load calendar events');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchingRef.current = false;
    fetchAllAppointments();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const { type, petId } = clickInfo.event.extendedProps;
    if (type === 'vaccination') {
      navigate(`/pets/${petId}/vaccinations`);
    } else {
      navigate(`/pets/${petId}/medical-records`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          My Calendar
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          All your pet appointments in one view
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 md:gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-orange-500"></span>
          <span
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Upcoming Vaccinations
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-orange-300"></span>
          <span
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Past Vaccinations
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-purple-500"></span>
          <span
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Upcoming Medical
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-purple-300"></span>
          <span
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Past Medical
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-4 rounded-lg flex items-center justify-between"
          style={{
            backgroundColor: error.includes('incomplete') ? 'var(--color-warning-bg, #fef3c7)' : 'var(--color-error-bg, #fee2e2)',
            border: `1px solid ${error.includes('incomplete') ? 'var(--color-warning-border, #fcd34d)' : 'var(--color-error-border, #fca5a5)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle
              className="h-5 w-5"
              style={{ color: error.includes('incomplete') ? '#d97706' : '#dc2626' }}
            />
            <span style={{ color: error.includes('incomplete') ? '#92400e' : '#991b1b' }}>
              {error}
            </span>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
            Loading calendar events...
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl shadow-sm p-4"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
          />
        </div>
      )}

      {!loading && events.length === 0 && (
        <div
          className="text-center py-12 rounded-xl"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            No upcoming appointments
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Add vaccinations or medical records with follow-up dates to see them here
          </p>
        </div>
      )}
    </div>
  );
};
