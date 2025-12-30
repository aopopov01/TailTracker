import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface CareReminder {
  id: string;
  pet_id: string;
  user_id: string;
  reminder_type:
    | 'vaccination'
    | 'medication'
    | 'grooming'
    | 'vet_checkup'
    | 'custom';
  title: string;
  description: string;
  due_date: string;
  repeat_interval?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  is_completed: boolean;
}

interface ScheduleRemindersRequest {
  reminders: CareReminder[];
  advance_notice_hours?: number;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { reminders, advance_notice_hours = 24 }: ScheduleRemindersRequest =
        await req.json();

      // Store reminders in database
      const { error: insertError } = await supabaseClient
        .from('care_reminders')
        .upsert(
          reminders.map(reminder => ({
            ...reminder,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        );

      if (insertError) {
        throw new Error(`Failed to store reminders: ${insertError.message}`);
      }

      // Schedule notifications for each reminder
      const scheduledNotifications = await Promise.all(
        reminders.map(async reminder => {
          const dueDate = new Date(reminder.due_date);
          const notificationDate = new Date(
            dueDate.getTime() - advance_notice_hours * 60 * 60 * 1000
          );

          // Get pet information for personalized notification
          const { data: pet } = await supabaseClient
            .from('pets')
            .select('name, species')
            .eq('id', reminder.pet_id)
            .single();

          return {
            user_id: reminder.user_id,
            reminder_id: reminder.id,
            scheduled_for: notificationDate.toISOString(),
            title: `Reminder: ${reminder.title}`,
            body: `${pet?.name || 'Your pet'} has ${reminder.title.toLowerCase()} ${
              dueDate < new Date() ? 'overdue' : 'due tomorrow'
            }`,
            data: {
              type: 'care_reminder',
              reminder_id: reminder.id,
              pet_id: reminder.pet_id,
              reminder_type: reminder.reminder_type,
              due_date: reminder.due_date,
            },
          };
        })
      );

      return new Response(
        JSON.stringify({
          success: true,
          reminders_scheduled: scheduledNotifications.length,
          reminders: scheduledNotifications,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // GET: Retrieve pending reminders for a user
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const userId = url.searchParams.get('user_id');
      const upcoming = url.searchParams.get('upcoming') === 'true';

      if (!userId) {
        throw new Error('user_id parameter is required');
      }

      let query = supabaseClient
        .from('care_reminders')
        .select(
          `
          *,
          pets:pet_id (
            name,
            species,
            breed
          )
        `
        )
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('due_date', { ascending: true });

      if (upcoming) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        query = query.lte('due_date', nextWeek.toISOString());
      }

      const { data: reminders, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch reminders: ${error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          reminders: reminders || [],
          count: reminders?.length || 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  } catch (_error) {
    console.error('Care reminders error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
