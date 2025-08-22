// TailTracker Vaccination Management Edge Function
// Handles vaccination tracking and reminder notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Vaccination {
  id?: string
  pet_id: string
  vaccine_name: string
  batch_number?: string
  administered_date: string
  next_due_date?: string
  veterinarian_id?: string
  notes?: string
  certificate_url?: string
  reminder_sent?: boolean
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
    const vaccinationId = pathSegments[pathSegments.length - 1]

    switch (method) {
      case 'GET':
        return await handleGetVaccinations(supabaseClient, user.id, url.searchParams)
      case 'POST':
        return await handleCreateVaccination(supabaseClient, user.id, req)
      case 'PUT':
        return await handleUpdateVaccination(supabaseClient, user.id, vaccinationId, req)
      case 'DELETE':
        return await handleDeleteVaccination(supabaseClient, user.id, vaccinationId)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Vaccination function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGetVaccinations(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  try {
    const petId = searchParams.get('pet_id')
    const dueSoon = searchParams.get('due_soon') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabaseClient
      .from('vaccinations')
      .select(`
        *,
        pet:pets(
          id,
          name,
          species,
          breed,
          family:families(name)
        ),
        veterinarian:veterinarians(
          id,
          name,
          clinic_name,
          phone
        )
      `)
      .order('administered_date', { ascending: false })
      .limit(limit)

    if (petId) {
      query = query.eq('pet_id', petId)
    }

    if (dueSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      query = query
        .not('next_due_date', 'is', null)
        .lte('next_due_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('next_due_date', new Date().toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch vaccinations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get vaccinations error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch vaccinations' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCreateVaccination(supabaseClient: any, userId: string, req: Request) {
  try {
    const vaccinationData: Vaccination = await req.json()

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

    // Verify pet access through family membership
    const { data: petData, error: petError } = await supabaseClient
      .from('pets')
      .select('id, family_id')
      .eq('id', vaccinationData.pet_id)
      .single()

    if (petError || !petData) {
      return new Response(
        JSON.stringify({ error: 'Pet not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create vaccination record
    const { data, error } = await supabaseClient
      .from('vaccinations')
      .insert({
        ...vaccinationData,
        created_by: userData.id
      })
      .select(`
        *,
        pet:pets(name, species),
        veterinarian:veterinarians(name, clinic_name)
      `)
      .single()

    if (error) {
      console.error('Vaccination creation error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create vaccination record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Schedule reminder notification if next due date is set and user has premium
    if (vaccinationData.next_due_date && userData.subscription_status === 'premium') {
      await scheduleVaccinationReminder(supabaseClient, userData.id, data)
    }

    return new Response(
      JSON.stringify({ data, message: 'Vaccination record created successfully' }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Create vaccination error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create vaccination record' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleUpdateVaccination(supabaseClient: any, userId: string, vaccinationId: string, req: Request) {
  try {
    const vaccinationData: Partial<Vaccination> = await req.json()

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

    // Update vaccination record
    const { data, error } = await supabaseClient
      .from('vaccinations')
      .update(vaccinationData)
      .eq('id', vaccinationId)
      .select(`
        *,
        pet:pets(name, species),
        veterinarian:veterinarians(name, clinic_name)
      `)
      .single()

    if (error) {
      console.error('Vaccination update error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update vaccination record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data, message: 'Vaccination record updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update vaccination error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update vaccination record' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleDeleteVaccination(supabaseClient: any, userId: string, vaccinationId: string) {
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

    // Delete vaccination record
    const { error } = await supabaseClient
      .from('vaccinations')
      .delete()
      .eq('id', vaccinationId)

    if (error) {
      console.error('Vaccination deletion error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to delete vaccination record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Vaccination record deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete vaccination error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete vaccination record' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function scheduleVaccinationReminder(supabaseClient: any, userId: string, vaccination: any) {
  try {
    const dueDate = new Date(vaccination.next_due_date)
    const reminderDate = new Date(dueDate)
    reminderDate.setDate(reminderDate.getDate() - 7) // Remind 7 days before

    if (reminderDate > new Date()) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'vaccination_due',
          title: `${vaccination.pet.name}'s ${vaccination.vaccine_name} vaccination is due soon`,
          message: `${vaccination.pet.name} needs a ${vaccination.vaccine_name} vaccination on ${dueDate.toLocaleDateString()}`,
          pet_id: vaccination.pet_id,
          related_id: vaccination.id,
          scheduled_for: reminderDate.toISOString()
        })
    }
  } catch (error) {
    console.error('Error scheduling vaccination reminder:', error)
  }
}