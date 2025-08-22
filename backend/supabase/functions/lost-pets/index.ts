// TailTracker Lost Pet Alert System Edge Function
// Handles lost pet reports and location-based alerts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface LostPet {
  id?: string
  pet_id: string
  reported_by: string
  status?: 'lost' | 'found'
  last_seen_location?: { lat: number; lng: number }
  last_seen_address?: string
  last_seen_date?: string
  description?: string
  reward_amount?: number
  reward_currency?: string
  contact_phone?: string
  contact_email?: string
  photo_urls?: string[]
  search_radius_km?: number
  found_date?: string
  found_by?: string
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

    const method = req.method
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const lostPetId = pathSegments[pathSegments.length - 1]

    // For GET requests, allow anonymous access to view lost pets
    let user = null
    if (method !== 'GET') {
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()
      if (authError || !authUser) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      user = authUser
    }

    switch (method) {
      case 'GET':
        return await handleGetLostPets(supabaseClient, url.searchParams)
      case 'POST':
        return await handleCreateLostPetReport(supabaseClient, user!.id, req)
      case 'PUT':
        return await handleUpdateLostPetReport(supabaseClient, user!.id, lostPetId, req)
      case 'DELETE':
        return await handleDeleteLostPetReport(supabaseClient, user!.id, lostPetId)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Lost pet function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGetLostPets(supabaseClient: any, searchParams: URLSearchParams) {
  try {
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseInt(searchParams.get('radius') || '50') // km
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || 'lost'

    let query = supabaseClient
      .from('lost_pets')
      .select(`
        *,
        pet:pets(
          id,
          name,
          species,
          breed,
          color,
          gender,
          profile_photo_url,
          microchip_number
        ),
        reported_by_user:users!lost_pets_reported_by_fkey(
          full_name,
          phone
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    // If location provided, filter by distance
    if (lat && lng) {
      // Use PostGIS ST_DWithin for radius search (in meters)
      const radiusMeters = radius * 1000
      query = query.filter(
        'last_seen_location',
        'st_dwithin',
        `POINT(${lng} ${lat})::geography,${radiusMeters}`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch lost pets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate distances if location provided
    const enrichedData = lat && lng ? data?.map(lostPet => {
      if (lostPet.last_seen_location) {
        // Parse PostGIS POINT format
        const location = parsePostGISPoint(lostPet.last_seen_location)
        if (location) {
          const distance = calculateDistance(lat, lng, location.lat, location.lng)
          return { ...lostPet, distance_km: Math.round(distance * 10) / 10 }
        }
      }
      return lostPet
    }) : data

    return new Response(
      JSON.stringify({ data: enrichedData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get lost pets error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch lost pets' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCreateLostPetReport(supabaseClient: any, userId: string, req: Request) {
  try {
    const lostPetData: LostPet = await req.json()

    // Get user's internal ID and subscription status
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

    // Check if user has premium access for lost pet alerts
    if (userData.subscription_status === 'free') {
      return new Response(
        JSON.stringify({ 
          error: 'Premium feature required',
          message: 'Lost pet alerts require a Premium subscription',
          upgrade_required: true
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify pet ownership through family membership
    const { data: petData, error: petError } = await supabaseClient
      .from('pets')
      .select('id, name, family_id')
      .eq('id', lostPetData.pet_id)
      .single()

    if (petError || !petData) {
      return new Response(
        JSON.stringify({ error: 'Pet not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert location to PostGIS format
    let locationPoint = null
    if (lostPetData.last_seen_location) {
      locationPoint = `POINT(${lostPetData.last_seen_location.lng} ${lostPetData.last_seen_location.lat})`
    }

    // Create lost pet report
    const { data, error } = await supabaseClient
      .from('lost_pets')
      .insert({
        pet_id: lostPetData.pet_id,
        reported_by: userData.id,
        status: 'lost',
        last_seen_location: locationPoint,
        last_seen_address: lostPetData.last_seen_address,
        last_seen_date: lostPetData.last_seen_date,
        description: lostPetData.description,
        reward_amount: lostPetData.reward_amount,
        reward_currency: lostPetData.reward_currency || 'USD',
        contact_phone: lostPetData.contact_phone,
        contact_email: lostPetData.contact_email,
        photo_urls: lostPetData.photo_urls || [],
        search_radius_km: lostPetData.search_radius_km || 10
      })
      .select(`
        *,
        pet:pets(name, species, breed, color)
      `)
      .single()

    if (error) {
      console.error('Lost pet report creation error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create lost pet report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update pet status to lost
    await supabaseClient
      .from('pets')
      .update({ status: 'lost' })
      .eq('id', lostPetData.pet_id)

    // Send location-based alerts to nearby users
    if (locationPoint) {
      await sendLocationBasedAlerts(supabaseClient, data, userData.id)
    }

    return new Response(
      JSON.stringify({ data, message: 'Lost pet report created successfully' }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Create lost pet report error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create lost pet report' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleUpdateLostPetReport(supabaseClient: any, userId: string, lostPetId: string, req: Request) {
  try {
    const updateData: Partial<LostPet> = await req.json()

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

    // Convert location to PostGIS format if provided
    if (updateData.last_seen_location) {
      updateData.last_seen_location = `POINT(${updateData.last_seen_location.lng} ${updateData.last_seen_location.lat})` as any
    }

    // Update lost pet report
    const { data, error } = await supabaseClient
      .from('lost_pets')
      .update(updateData)
      .eq('id', lostPetId)
      .select(`
        *,
        pet:pets(name, species, breed, color)
      `)
      .single()

    if (error) {
      console.error('Lost pet report update error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update lost pet report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If pet is found, update pet status
    if (updateData.status === 'found') {
      await supabaseClient
        .from('pets')
        .update({ status: 'found' })
        .eq('id', data.pet_id)

      // Send notification to pet owner
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: data.reported_by,
          type: 'lost_pet_alert',
          title: `Great news! ${data.pet.name} has been found!`,
          message: `Your lost pet ${data.pet.name} has been marked as found.`,
          pet_id: data.pet_id,
          related_id: data.id
        })
    }

    return new Response(
      JSON.stringify({ data, message: 'Lost pet report updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update lost pet report error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update lost pet report' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleDeleteLostPetReport(supabaseClient: any, userId: string, lostPetId: string) {
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

    // Get the lost pet report first to update pet status
    const { data: lostPetData, error: fetchError } = await supabaseClient
      .from('lost_pets')
      .select('pet_id')
      .eq('id', lostPetId)
      .single()

    if (fetchError || !lostPetData) {
      return new Response(
        JSON.stringify({ error: 'Lost pet report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete lost pet report
    const { error } = await supabaseClient
      .from('lost_pets')
      .delete()
      .eq('id', lostPetId)

    if (error) {
      console.error('Lost pet report deletion error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to delete lost pet report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update pet status back to active
    await supabaseClient
      .from('pets')
      .update({ status: 'active' })
      .eq('id', lostPetData.pet_id)

    return new Response(
      JSON.stringify({ message: 'Lost pet report deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete lost pet report error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete lost pet report' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function sendLocationBasedAlerts(supabaseClient: any, lostPetReport: any, reporterId: string) {
  try {
    const radiusMeters = (lostPetReport.search_radius_km || 10) * 1000

    // Find users with premium subscriptions in the area (if they have location data)
    // This would require implementing location tracking for users
    // For now, just send a general notification to all premium users
    const { data: premiumUsers, error } = await supabaseClient
      .from('users')
      .select('id')
      .eq('subscription_status', 'premium')
      .neq('id', reporterId)
      .limit(100)

    if (error || !premiumUsers?.length) {
      return
    }

    // Create notifications for nearby users
    const notifications = premiumUsers.map(user => ({
      user_id: user.id,
      type: 'lost_pet_alert',
      title: `Lost ${lostPetReport.pet.species} in your area`,
      message: `${lostPetReport.pet.name}, a ${lostPetReport.pet.breed || lostPetReport.pet.species} has gone missing near ${lostPetReport.last_seen_address || 'your location'}. Please keep an eye out!`,
      pet_id: lostPetReport.pet_id,
      related_id: lostPetReport.id
    }))

    await supabaseClient
      .from('notifications')
      .insert(notifications)

    // Increment alert count
    await supabaseClient
      .from('lost_pets')
      .update({ alert_sent_count: (lostPetReport.alert_sent_count || 0) + notifications.length })
      .eq('id', lostPetReport.id)

  } catch (error) {
    console.error('Error sending location-based alerts:', error)
  }
}

function parsePostGISPoint(pointString: string): { lat: number; lng: number } | null {
  try {
    // Extract coordinates from POINT(lng lat) format
    const match = pointString.match(/POINT\(([^)]+)\)/)
    if (match) {
      const [lng, lat] = match[1].split(' ').map(Number)
      return { lat, lng }
    }
    return null
  } catch {
    return null
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}