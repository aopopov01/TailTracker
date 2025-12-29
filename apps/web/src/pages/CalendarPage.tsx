/**
 * Calendar Page
 * Visual calendar view showing all pet appointments from vaccinations and medical records
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's pets
      const { data: pets } = await supabase
        .from('pets')
        .select('id, name')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (!pets?.length) {
        setLoading(false);
        return;
      }

      const petIds = pets.map(p => p.id);
      const petMap = Object.fromEntries(pets.map(p => [p.id, p.name]));

      // Fetch ALL vaccinations (both past and future) with time fields
      const { data: vaccinations } = await supabase
        .from('vaccinations')
        .select('id, pet_id, vaccine_name, administered_date, next_due_date, next_due_start_time, next_due_end_time')
        .in('pet_id', petIds);

      // Fetch ALL medical records with time fields
      const { data: medicalRecords } = await supabase
        .from('medical_records')
        .select('id, pet_id, title, date_of_record, follow_up_date, follow_up_start_time, follow_up_end_time, entry_type')
        .in('pet_id', petIds);

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

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
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
