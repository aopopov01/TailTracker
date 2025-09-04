import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface LostPetAlert {
  id: string;
  pet_id: string;
  pet_name: string;
  species: string;
  breed?: string;
  last_seen_location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  last_seen_date: string;
  description: string;
  contact_phone?: string;
  reward_amount?: number;
  reward_currency?: string;
  photo_url?: string;
  is_found: boolean;
  created_by: string;
}

interface NotifyUsersRequest {
  alert: LostPetAlert;
  radius_km: number;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { alert, radius_km = 5 }: NotifyUsersRequest = await req.json();

    // Find nearby users within radius
    const { data: nearbyUsers, error: usersError } = await supabaseClient
      .rpc('find_nearby_users', {
        center_lat: alert.last_seen_location.latitude,
        center_lng: alert.last_seen_location.longitude,
        radius_meters: radius_km * 1000,
      });

    if (usersError) {
      throw new Error(`Failed to find nearby users: ${usersError.message}`);
    }

    // Filter out the pet owner from notifications
    const usersToNotify = nearbyUsers?.filter((user: any) => user.id !== alert.created_by) || [];

    // Send push notifications to nearby users
    const notifications = usersToNotify.map((user: any) => ({
      to: user.push_token,
      title: `Lost Pet Alert: ${alert.pet_name}`,
      body: `A ${alert.species} ${alert.breed ? `(${alert.breed})` : ''} is missing in your area`,
      data: {
        type: 'lost_pet_alert',
        alert_id: alert.id,
        pet_id: alert.pet_id,
        location: alert.last_seen_location,
        distance_km: user.distance_km,
      },
      channelId: 'lost-pet-alerts',
      priority: 'high',
    }));

    // Store alert in database
    const { error: alertError } = await supabaseClient
      .from('lost_pet_alerts')
      .insert({
        id: alert.id,
        pet_id: alert.pet_id,
        pet_name: alert.pet_name,
        species: alert.species,
        breed: alert.breed,
        last_seen_location: alert.last_seen_location,
        last_seen_date: alert.last_seen_date,
        description: alert.description,
        contact_phone: alert.contact_phone,
        reward_amount: alert.reward_amount,
        reward_currency: alert.reward_currency,
        photo_url: alert.photo_url,
        is_found: false,
        created_by: alert.created_by,
        created_at: new Date().toISOString(),
      });

    if (alertError) {
      throw new Error(`Failed to store alert: ${alertError.message}`);
    }

    // TODO: Integrate with actual push notification service (FCM/APNS)
    // For now, we'll log the notifications that would be sent
    console.log(`Would send ${notifications.length} notifications for lost pet alert ${alert.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        alert_id: alert.id,
        notifications_sent: notifications.length,
        nearby_users_count: usersToNotify.length,
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
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});