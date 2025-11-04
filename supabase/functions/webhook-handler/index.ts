import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface WebhookPayload {
  event_type: string;
  data: Record<string, any>;
  timestamp: string;
  source: string;
}

interface VeterinarianWebhook {
  event_type:
    | 'appointment_scheduled'
    | 'vaccination_completed'
    | 'medical_record_updated';
  clinic_id: string;
  pet_id: string;
  owner_id: string;
  appointment_date?: string;
  vaccination_data?: {
    vaccine_name: string;
    administered_date: string;
    next_due_date: string;
    batch_number: string;
    veterinarian_name: string;
  };
  medical_data?: {
    diagnosis: string;
    treatment: string;
    medications: string[];
    follow_up_date?: string;
  };
}

interface InsuranceWebhook {
  event_type: 'claim_approved' | 'claim_denied' | 'policy_updated';
  policy_number: string;
  pet_id: string;
  owner_id: string;
  claim_data?: {
    claim_number: string;
    amount: number;
    status: string;
    reason?: string;
  };
}

interface MicrochipWebhook {
  event_type: 'pet_registered' | 'contact_updated' | 'pet_found';
  microchip_id: string;
  pet_data?: {
    name: string;
    species: string;
    breed: string;
    owner_contact: string;
  };
  found_location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// Verify webhook signature
const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = encoder.encode(secret);

  // This would use actual HMAC verification in production
  // For now, we'll do a simple comparison
  const expectedSignature = `sha256=${signature}`;
  return signature === expectedSignature;
};

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-webhook-signature',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const webhookType = url.pathname.split('/').pop();

    // Get webhook signature for verification
    const signature = req.headers.get('x-webhook-signature');
    const rawBody = await req.text();

    // Verify webhook authenticity
    const webhookSecret = Deno.env.get(
      `WEBHOOK_SECRET_${webhookType?.toUpperCase()}`
    );
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: corsHeaders }
        );
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody);

    // Route webhook to appropriate handler
    switch (webhookType) {
      case 'veterinarian':
        return await handleVeterinarianWebhook(
          supabaseClient,
          payload as VeterinarianWebhook
        );

      case 'insurance':
        return await handleInsuranceWebhook(
          supabaseClient,
          payload as InsuranceWebhook
        );

      case 'microchip':
        return await handleMicrochipWebhook(
          supabaseClient,
          payload as MicrochipWebhook
        );

      case 'payment':
        return await handlePaymentWebhook(supabaseClient, payload);

      default:
        return new Response(JSON.stringify({ error: 'Unknown webhook type' }), {
          status: 400,
          headers: corsHeaders,
        });
    }
  } catch (_error) {
    console.error('Webhook handler error:', error);
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

// Veterinarian webhook handler
async function handleVeterinarianWebhook(
  supabaseClient: any,
  payload: VeterinarianWebhook
) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  switch (payload.event_type) {
    case 'vaccination_completed':
      // Add vaccination record
      const { error: vaccinationError } = await supabaseClient
        .from('vaccinations')
        .insert({
          pet_id: payload.pet_id,
          vaccine_name: payload.vaccination_data?.vaccine_name,
          administered_date: payload.vaccination_data?.administered_date,
          next_due_date: payload.vaccination_data?.next_due_date,
          batch_number: payload.vaccination_data?.batch_number,
          veterinarian_name: payload.vaccination_data?.veterinarian_name,
          veterinarian_clinic: payload.clinic_id,
        });

      if (vaccinationError) {
        throw new Error(
          `Failed to record vaccination: ${vaccinationError.message}`
        );
      }

      // Schedule reminder for next vaccination
      if (payload.vaccination_data?.next_due_date) {
        await supabaseClient.from('care_reminders').insert({
          pet_id: payload.pet_id,
          user_id: payload.owner_id,
          reminder_type: 'vaccination',
          title: `${payload.vaccination_data.vaccine_name} Due`,
          description: 'Annual vaccination is due',
          due_date: payload.vaccination_data.next_due_date,
          repeat_interval: 'yearly',
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Vaccination recorded and reminder scheduled',
        }),
        { status: 200, headers: corsHeaders }
      );

    case 'appointment_scheduled':
      // Create appointment reminder
      await supabaseClient.from('care_reminders').insert({
        pet_id: payload.pet_id,
        user_id: payload.owner_id,
        reminder_type: 'vet_checkup',
        title: 'Veterinary Appointment',
        description: `Appointment scheduled at ${payload.clinic_id}`,
        due_date: payload.appointment_date,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Appointment reminder created',
        }),
        { status: 200, headers: corsHeaders }
      );

    case 'medical_record_updated':
      // Update pet medical conditions if provided
      if (payload.medical_data?.diagnosis) {
        await supabaseClient
          .from('pets')
          .update({
            medical_conditions: supabaseClient.rpc('array_append', {
              arr: 'medical_conditions',
              elem: payload.medical_data.diagnosis,
            }),
          })
          .eq('id', payload.pet_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Medical record updated',
        }),
        { status: 200, headers: corsHeaders }
      );

    default:
      throw new Error(`Unknown veterinarian event: ${payload.event_type}`);
  }
}

// Insurance webhook handler
async function handleInsuranceWebhook(
  supabaseClient: any,
  payload: InsuranceWebhook
) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Send notification to pet owner about insurance update
  const notificationTitle =
    payload.event_type === 'claim_approved'
      ? 'Insurance Claim Approved'
      : payload.event_type === 'claim_denied'
        ? 'Insurance Claim Update'
        : 'Policy Update';

  const notificationBody =
    payload.event_type === 'claim_approved'
      ? `Your claim #${payload.claim_data?.claim_number} has been approved for $${payload.claim_data?.amount}`
      : payload.event_type === 'claim_denied'
        ? `Your claim #${payload.claim_data?.claim_number} requires attention`
        : 'Your insurance policy has been updated';

  await supabaseClient.from('notifications').insert({
    type: 'insurance_update',
    title: notificationTitle,
    body: notificationBody,
    data: {
      policy_number: payload.policy_number,
      claim_data: payload.claim_data,
    },
    recipients: [payload.owner_id],
    sent_at: new Date().toISOString(),
    status: 'sent',
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Insurance notification sent',
    }),
    { status: 200, headers: corsHeaders }
  );
}

// Microchip webhook handler
async function handleMicrochipWebhook(
  supabaseClient: any,
  payload: MicrochipWebhook
) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  switch (payload.event_type) {
    case 'pet_found':
      // Find the pet by microchip ID
      const { data: pet, error: petError } = await supabaseClient
        .from('pets')
        .select('id, name, user_id, status')
        .eq('microchip_id', payload.microchip_id)
        .single();

      if (petError || !pet) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Pet not found in system',
          }),
          { status: 404, headers: corsHeaders }
        );
      }

      // If pet is marked as lost, update status and notify owner
      if (pet.status === 'lost') {
        await supabaseClient
          .from('pets')
          .update({
            status: 'found',
            last_seen_location: payload.found_location
              ? `POINT(${payload.found_location.longitude} ${payload.found_location.latitude})`
              : null,
          })
          .eq('id', pet.id);

        // Send notification to owner
        await supabaseClient.from('notifications').insert({
          type: 'pet_found',
          title: `${pet.name} Has Been Found!`,
          body: payload.found_location?.address
            ? `${pet.name} was found at ${payload.found_location.address}`
            : `${pet.name} has been found and scanned`,
          data: {
            pet_id: pet.id,
            location: payload.found_location,
            microchip_id: payload.microchip_id,
          },
          recipients: [pet.user_id],
          sent_at: new Date().toISOString(),
          status: 'sent',
        });

        // Update any active lost pet alerts
        await supabaseClient
          .from('lost_pet_alerts')
          .update({
            is_found: true,
            found_at: new Date().toISOString(),
          })
          .eq('pet_id', pet.id)
          .eq('is_found', false);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message:
            pet.status === 'lost'
              ? 'Pet found and owner notified'
              : 'Pet scanned successfully',
          pet_info: {
            name: pet.name,
            status: pet.status,
          },
        }),
        { status: 200, headers: corsHeaders }
      );

    case 'contact_updated':
      // Microchip registry contact update notification
      const { data: petByChip } = await supabaseClient
        .from('pets')
        .select('user_id')
        .eq('microchip_id', payload.microchip_id)
        .single();

      if (petByChip) {
        await supabaseClient.from('notifications').insert({
          type: 'microchip_update',
          title: 'Microchip Registry Updated',
          body: "Your pet's microchip contact information has been updated",
          data: {
            microchip_id: payload.microchip_id,
          },
          recipients: [petByChip.user_id],
          sent_at: new Date().toISOString(),
          status: 'sent',
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Contact update notification sent',
        }),
        { status: 200, headers: corsHeaders }
      );

    default:
      throw new Error(`Unknown microchip event: ${payload.event_type}`);
  }
}

// Payment webhook handler (subscription updates)
async function handlePaymentWebhook(
  supabaseClient: any,
  payload: WebhookPayload
) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const { event_type, data } = payload;

  switch (event_type) {
    case 'subscription.created':
    case 'subscription.updated':
      await supabaseClient
        .from('user_profiles')
        .update({
          subscription_tier: data.tier || 'premium',
        })
        .eq('id', data.user_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Subscription updated',
        }),
        { status: 200, headers: corsHeaders }
      );

    case 'subscription.cancelled':
      await supabaseClient
        .from('user_profiles')
        .update({
          subscription_tier: 'free',
        })
        .eq('id', data.user_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Subscription cancelled',
        }),
        { status: 200, headers: corsHeaders }
      );

    default:
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook received but no action taken',
        }),
        { status: 200, headers: corsHeaders }
      );
  }
}
