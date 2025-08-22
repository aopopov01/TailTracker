// TailTracker Pet Management Edge Function
// Handles CRUD operations for pets with premium feature checks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Pet {
  id?: string
  family_id: string
  name: string
  species: string
  breed?: string
  color?: string
  gender?: string
  date_of_birth?: string
  weight_kg?: number
  microchip_number?: string
  insurance_provider?: string
  insurance_policy_number?: string
  status?: 'active' | 'deceased' | 'lost' | 'found'
  profile_photo_url?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  special_needs?: string
  allergies?: string
}

interface PremiumLimits {
  pets: number
  photos_per_pet: number
  unlimited: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    )

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const method = req.method
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const petId = pathSegments[pathSegments.length - 1]

    switch (method) {
      case 'GET':
        return await handleGetPets(supabaseClient, user.id, petId)
      case 'POST':
        return await handleCreatePet(supabaseClient, user.id, req)
      case 'PUT':
        return await handleUpdatePet(supabaseClient, user.id, petId, req)
      case 'DELETE':
        return await handleDeletePet(supabaseClient, user.id, petId)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Pet function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGetPets(supabaseClient: any, userId: string, petId?: string) {
  try {
    let query = supabaseClient
      .from('pets')
      .select(`
        *,
        family:families(name, owner_id),
        created_by_user:users!pets_created_by_fkey(full_name),
        vaccinations(
          id,
          vaccine_name,
          administered_date,
          next_due_date
        ),
        medications(
          id,
          medication_name,
          active
        )
      `)
      .is('deleted_at', null)

    if (petId && petId !== 'pets') {
      query = query.eq('id', petId).single()
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get pets error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch pets' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCreatePet(supabaseClient: any, userId: string, req: Request) {
  try {
    const petData: Pet = await req.json()

    // Get user's internal ID
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, subscription_status')
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check premium limits for pet creation
    const limitsCheck = await checkPetLimits(supabaseClient, userData.id, userData.subscription_status)
    if (!limitsCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Pet limit exceeded',
          message: limitsCheck.message,
          upgrade_required: true
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify family access
    const { data: familyData, error: familyError } = await supabaseClient
      .from('families')
      .select('id')
      .eq('id', petData.family_id)
      .single()

    if (familyError || !familyData) {
      return new Response(
        JSON.stringify({ error: 'Family not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create pet
    const { data, error } = await supabaseClient
      .from('pets')
      .insert({
        ...petData,
        created_by: userData.id
      })
      .select()
      .single()

    if (error) {
      console.error('Pet creation error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create pet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Track feature usage
    await supabaseClient
      .from('feature_usage')
      .upsert({
        user_id: userData.id,
        feature_name: 'pet_created',
        usage_count: 1,
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,feature_name'
      })

    return new Response(
      JSON.stringify({ data, message: 'Pet created successfully' }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Create pet error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create pet' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleUpdatePet(supabaseClient: any, userId: string, petId: string, req: Request) {
  try {
    const petData: Partial<Pet> = await req.json()

    // Get user's internal ID
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update pet
    const { data, error } = await supabaseClient
      .from('pets')
      .update(petData)
      .eq('id', petId)
      .select()
      .single()

    if (error) {
      console.error('Pet update error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update pet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data, message: 'Pet updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update pet error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update pet' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleDeletePet(supabaseClient: any, userId: string, petId: string) {
  try {
    // Get user's internal ID
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Soft delete pet
    const { data, error } = await supabaseClient
      .from('pets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', petId)
      .select()
      .single()

    if (error) {
      console.error('Pet deletion error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to delete pet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Pet deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete pet error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete pet' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function checkPetLimits(supabaseClient: any, userId: string, subscriptionStatus: string): Promise<{allowed: boolean, message: string}> {
  try {
    // Free tier: 1 pet limit
    if (subscriptionStatus === 'free') {
      const { count, error } = await supabaseClient
        .from('pets')
        .select('id', { count: 'exact' })
        .eq('created_by', userId)
        .is('deleted_at', null)

      if (error) {
        console.error('Error checking pet count:', error)
        return { allowed: false, message: 'Error checking limits' }
      }

      if ((count || 0) >= 1) {
        return { 
          allowed: false, 
          message: 'Free plan allows only 1 pet. Upgrade to Premium for unlimited pets.' 
        }
      }
    }

    return { allowed: true, message: 'Pet creation allowed' }
  } catch (error) {
    console.error('Error checking pet limits:', error)
    return { allowed: false, message: 'Error checking limits' }
  }
}