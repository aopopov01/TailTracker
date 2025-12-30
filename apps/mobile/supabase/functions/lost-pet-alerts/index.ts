import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface LostPetAlertPayload {
  report_id: string;
  pet_id: string;
  pet_name: string;
  species: string;
  breed?: string;
  last_seen_location: {
    latitude: number;
    longitude: number;
  };
  last_seen_address?: string;
  last_seen_date: string;
  description: string;
  contact_phone?: string;
  contact_email?: string;
  reward_amount?: number;
  photo_url?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  alert_radius: number; // in meters
  created_by: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
}

// Send push notifications via Expo Push Service
async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<{
  success: boolean;
  sentCount: number;
  errors: string[];
}> {
  if (messages.length === 0) {
    return { success: true, sentCount: 0, errors: [] };
  }

  // Expo Push API endpoint
  const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  try {
    // Expo recommends batching messages (max 100 per request)
    const batches = [];
    for (let i = 0; i < messages.length; i += 100) {
      batches.push(messages.slice(i, i + 100));
    }

    let totalSent = 0;
    const allErrors: string[] = [];

    for (const batch of batches) {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      const result = await response.json();

      if (result.data) {
        result.data.forEach((item: { status: string; message?: string }, index: number) => {
          if (item.status === 'ok') {
            totalSent++;
          } else {
            allErrors.push(`Message ${index}: ${item.message || 'Unknown error'}`);
          }
        });
      }
    }

    return {
      success: allErrors.length === 0,
      sentCount: totalSent,
      errors: allErrors,
    };
  } catch (error) {
    console.error('Expo push error:', error);
    return {
      success: false,
      sentCount: 0,
      errors: [(error as Error).message],
    };
  }
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

    const alertPayload: LostPetAlertPayload = await req.json();

    // Validate required fields
    if (!alertPayload.pet_id || !alertPayload.last_seen_location) {
      throw new Error('Missing required fields: pet_id and last_seen_location are required');
    }

    // Find nearby users within the alert radius using the database function
    const { data: nearbyUsers, error: usersError } = await supabaseClient.rpc(
      'find_nearby_users_for_alert',
      {
        center_lat: alertPayload.last_seen_location.latitude,
        center_lng: alertPayload.last_seen_location.longitude,
        radius_meters: alertPayload.alert_radius || 5000,
      }
    );

    if (usersError) {
      console.error('Failed to find nearby users:', usersError);
      throw new Error(`Failed to find nearby users: ${usersError.message}`);
    }

    // Filter out the pet owner from notifications
    const usersToNotify =
      nearbyUsers?.filter((user: { user_id: string }) => user.user_id !== alertPayload.created_by) || [];

    console.log(`Found ${usersToNotify.length} nearby users to notify`);

    // Build push notification messages
    const urgencyEmoji = {
      low: '',
      medium: '⚠️',
      high: '🚨',
      critical: '🆘',
    };

    const messages: ExpoPushMessage[] = usersToNotify
      .filter((user: { push_token: string | null }) => user.push_token && user.push_token.startsWith('ExponentPushToken'))
      .map((user: { push_token: string; distance_meters: number }) => ({
        to: user.push_token,
        title: `${urgencyEmoji[alertPayload.urgency] || ''} Lost Pet Alert: ${alertPayload.pet_name}`.trim(),
        body: `A ${alertPayload.species}${alertPayload.breed ? ` (${alertPayload.breed})` : ''} is missing ${Math.round(user.distance_meters / 1000 * 10) / 10}km away from you. Tap to help!`,
        data: {
          type: 'lost_pet_alert',
          report_id: alertPayload.report_id,
          pet_id: alertPayload.pet_id,
          pet_name: alertPayload.pet_name,
          location: alertPayload.last_seen_location,
          address: alertPayload.last_seen_address,
          distance_km: user.distance_meters / 1000,
          urgency: alertPayload.urgency,
        },
        sound: 'default' as const,
        priority: alertPayload.urgency === 'critical' ? 'high' as const : 'default' as const,
        channelId: 'lost-pet-alerts',
      }));

    // Send push notifications
    let pushResult = { success: true, sentCount: 0, errors: [] as string[] };
    if (messages.length > 0) {
      pushResult = await sendExpoPushNotifications(messages);
      console.log(`Push notifications sent: ${pushResult.sentCount}/${messages.length}`);
    }

    // Record notifications in the database for tracking
    if (usersToNotify.length > 0) {
      const notificationRecords = usersToNotify.map((user: { user_id: string; distance_meters: number }) => ({
        report_id: alertPayload.report_id,
        user_id: user.user_id,
        notification_type: 'initial_alert',
        sent_at: new Date().toISOString(),
        delivery_status: 'sent',
        distance_meters: user.distance_meters,
      }));

      const { error: insertError } = await supabaseClient
        .from('lost_pet_notifications')
        .insert(notificationRecords);

      if (insertError) {
        console.error('Failed to record notifications:', insertError);
        // Don't throw - this is a secondary operation
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_id: alertPayload.report_id,
        notifications_sent: pushResult.sentCount,
        nearby_users_count: usersToNotify.length,
        push_result: pushResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Lost pet alert error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
