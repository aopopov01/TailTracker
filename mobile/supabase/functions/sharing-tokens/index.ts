import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface SharingTokenRequest {
  owner_user_id: string;
  expiration_hours?: number;
}

interface ValidateTokenRequest {
  token: string;
  guest_user_id: string;
}

function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
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

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (req.method === 'POST' && action === 'generate') {
      const { owner_user_id, expiration_hours = 24 }: SharingTokenRequest = await req.json();

      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + expiration_hours * 60 * 60 * 1000);

      // Store token in database
      const { data: sharingToken, error } = await supabaseClient
        .from('sharing_tokens')
        .insert({
          token,
          owner_user_id,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create sharing token: ${error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          token,
          expires_at: expiresAt.toISOString(),
          qr_data: {
            type: 'pet_sharing',
            token,
            version: '1.0',
            appName: 'TailTracker',
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (req.method === 'POST' && action === 'validate') {
      const { token, guest_user_id }: ValidateTokenRequest = await req.json();

      // Validate token
      const { data: sharingToken, error: tokenError } = await supabaseClient
        .from('sharing_tokens')
        .select(`
          *,
          owner:owner_user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !sharingToken) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid or expired sharing token',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Check if user is trying to access their own pets
      if (sharingToken.owner_user_id === guest_user_id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Cannot access your own pets through sharing',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Grant access
      const { error: accessError } = await supabaseClient
        .from('shared_access')
        .upsert({
          token_id: sharingToken.id,
          guest_user_id,
          owner_user_id: sharingToken.owner_user_id,
          access_granted_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        });

      if (accessError) {
        throw new Error(`Failed to grant access: ${accessError.message}`);
      }

      // Get pet count for owner
      const { count: petCount } = await supabaseClient
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sharingToken.owner_user_id);

      return new Response(
        JSON.stringify({
          success: true,
          owner_name: sharingToken.owner?.full_name || 'Pet Owner',
          pet_count: petCount || 0,
          access_granted: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (req.method === 'GET' && action === 'shared-pets') {
      const guestUserId = url.searchParams.get('guest_user_id');

      if (!guestUserId) {
        throw new Error('guest_user_id parameter is required');
      }

      // Get all pets shared with this user
      const { data: sharedPets, error } = await supabaseClient
        .from('shared_access')
        .select(`
          *,
          owner:owner_user_id (
            full_name,
            email
          ),
          pets:owner_user_id (
            id,
            name,
            species,
            breed,
            photos,
            date_of_birth,
            gender,
            weight,
            medical_conditions,
            medications,
            allergies
          )
        `)
        .eq('guest_user_id', guestUserId)
        .gte('expires_at', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to fetch shared pets: ${error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          shared_pets: sharedPets || [],
          count: sharedPets?.length || 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint or method' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  } catch (_error) {
    console.error('Sharing tokens error:', error);
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