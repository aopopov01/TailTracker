import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge_count?: number;
  sound?: string;
  channel_id?: string;
  priority?: 'default' | 'high';
  collapse_key?: string;
}

interface BroadcastNotification {
  type: 'lost_pet' | 'care_reminder' | 'family_update' | 'emergency';
  recipients: string[];
  payload: NotificationPayload;
  region?: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
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
      const { type, recipients, payload, region }: BroadcastNotification =
        await req.json();

      let targetUsers = recipients;

      // If region is specified, find users in that area
      if (region) {
        const { data: nearbyUsers, error } = await supabaseClient.rpc(
          'find_nearby_users',
          {
            center_lat: region.latitude,
            center_lng: region.longitude,
            radius_meters: region.radius_km * 1000,
          }
        );

        if (error) {
          throw new Error(`Failed to find nearby users: ${error.message}`);
        }

        targetUsers = nearbyUsers?.map((user: any) => user.id) || [];
      }

      // Get push tokens for target users
      const { data: userTokens, error: tokensError } = await supabaseClient
        .from('user_profiles')
        .select('id, push_token, notification_preferences')
        .in('id', targetUsers)
        .not('push_token', 'is', null);

      if (tokensError) {
        throw new Error(`Failed to get user tokens: ${tokensError.message}`);
      }

      // Filter users based on notification preferences
      const eligibleUsers =
        userTokens?.filter(user => {
          const prefs = user.notification_preferences || {};
          switch (type) {
            case 'lost_pet':
              return prefs.lost_pet_alerts !== false;
            case 'care_reminder':
              return prefs.care_reminders !== false;
            case 'family_update':
              return prefs.family_updates !== false;
            case 'emergency':
              return true; // Emergency notifications always go through
            default:
              return true;
          }
        }) || [];

      // Store notification in database for tracking
      const { data: notification, error: notificationError } =
        await supabaseClient
          .from('notifications')
          .insert({
            type,
            title: payload.title,
            body: payload.body,
            data: payload.data,
            recipients: targetUsers,
            sent_at: new Date().toISOString(),
            status: 'pending',
          })
          .select()
          .single();

      if (notificationError) {
        console.error('Failed to store notification:', notificationError);
      }

      // Prepare push notifications
      const pushNotifications = eligibleUsers.map(user => ({
        to: user.push_token,
        title: payload.title,
        body: payload.body,
        data: {
          ...payload.data,
          notification_id: notification?.id,
          type,
          user_id: user.id,
        },
        badge: payload.badge_count,
        sound: payload.sound || 'default',
        channelId: payload.channel_id || 'default',
        priority: payload.priority || 'default',
        collapseKey: payload.collapse_key,
      }));

      // Send to Expo Push Notification service
      // NOTE: This would require actual Expo push token in production
      const pushResults = await Promise.allSettled(
        pushNotifications.map(async notification => {
          // Mock push notification sending
          // In production, you would call Expo's push API or FCM/APNS directly
          return {
            success: true,
            token: notification.to,
            messageId: `mock_${Date.now()}_${Math.random()}`,
          };
        })
      );

      const successCount = pushResults.filter(
        result => result.status === 'fulfilled'
      ).length;
      const failureCount = pushResults.length - successCount;

      // Update notification status
      if (notification) {
        await supabaseClient
          .from('notifications')
          .update({
            status: failureCount === 0 ? 'sent' : 'partial_failure',
            sent_count: successCount,
            failed_count: failureCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', notification.id);
      }

      // Send real-time updates via Supabase Realtime
      for (const userId of targetUsers) {
        await supabaseClient.channel(`user_${userId}`).send({
          type: 'broadcast',
          event: 'notification',
          payload: {
            type,
            title: payload.title,
            body: payload.body,
            data: payload.data,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          notification_id: notification?.id,
          recipients_targeted: targetUsers.length,
          recipients_eligible: eligibleUsers.length,
          push_notifications_sent: successCount,
          push_notifications_failed: failureCount,
          realtime_broadcasts_sent: targetUsers.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // GET: Retrieve notification history
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const userId = url.searchParams.get('user_id');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      if (!userId) {
        throw new Error('user_id parameter is required');
      }

      const { data: notifications, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .contains('recipients', [userId])
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          notifications: notifications || [],
          count: notifications?.length || 0,
          offset,
          limit,
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
  } catch (error) {
    console.error('Realtime notifications error:', error);
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
