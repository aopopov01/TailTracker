// TailTracker Premium Lost Pet Alert System Edge Function
// Handles premium lost pet reports and regional notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface LostPetReport {
  pet_id: string
  last_seen_location: { lat: number; lng: number }
  last_seen_address?: string
  last_seen_date: string
  description?: string
  reward_amount?: number
  reward_currency?: string
  contact_phone?: string
  contact_email?: string
  photo_urls?: string[]
  search_radius_km?: number
}

interface NearbyUser {
  id: string
  push_token?: string
  latitude?: number
  longitude?: number
  distance_km?: number
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  try {
    const { action, data } = await req.json()

    switch (action) {
      case 'report_lost_pet':
        return await handleLostPetReport(data)
      case 'mark_found':
        return await handleMarkFound(data)
      case 'get_nearby_alerts':
        return await getNearbyAlerts(data)
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Lost pet alert error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process lost pet alert'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

async function handleLostPetReport(reportData: LostPetReport & { user_id: string }) {
  const { user_id, pet_id, last_seen_location, ...otherData } = reportData

  // 1. Verify user has premium subscription
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', user_id)
    .single()

  if (userError || !user) {
    throw new Error('User not found')
  }

  if (user.subscription_status !== 'premium' && user.subscription_status !== 'family') {
    throw new Error('Premium subscription required for lost pet alerts')
  }

  // 2. Verify pet ownership
  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('id, name, species, breed, photo_url')
    .eq('id', pet_id)
    .eq('created_by', user_id)
    .single()

  if (petError || !pet) {
    throw new Error('Pet not found or not owned by user')
  }

  // 3. Create lost pet report
  const { data: lostPet, error: insertError } = await supabase
    .from('lost_pets')
    .insert([{
      pet_id,
      reported_by: user_id,
      last_seen_location: `POINT(${last_seen_location.lng} ${last_seen_location.lat})`,
      ...otherData,
      status: 'lost'
    }])
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to create lost pet report: ${insertError.message}`)
  }

  // 4. Update pet status
  const { error: updateError } = await supabase
    .from('pets')
    .update({ status: 'lost' })
    .eq('id', pet_id)

  if (updateError) {
    console.error('Failed to update pet status:', updateError)
  }

  // 5. Find nearby users and send alerts
  const alertsResult = await sendRegionalAlerts(lostPet, pet, last_seen_location)

  return new Response(
    JSON.stringify({
      success: true,
      lost_pet_id: lostPet.id,
      alerts_sent: alertsResult.count,
      message: 'Lost pet report created and alerts sent to nearby users'
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}

async function sendRegionalAlerts(lostPet: any, pet: any, location: { lat: number; lng: number }) {
  const searchRadiusKm = lostPet.search_radius_km || 10

  // Find users within radius using PostGIS
  const { data: nearbyUsers, error } = await supabase.rpc('find_users_within_radius', {
    center_lat: location.lat,
    center_lng: location.lng,
    radius_km: searchRadiusKm
  })

  if (error) {
    console.error('Error finding nearby users:', error)
    return { count: 0, error: error.message }
  }

  // Prepare notification data
  const notifications = nearbyUsers
    ?.filter((user: NearbyUser) => user.push_token)
    .map((user: NearbyUser) => ({
      to: user.push_token,
      title: `Lost Pet Alert: ${pet.name}`,
      body: `A ${pet.species} named ${pet.name} is missing in your area. Can you help?`,
      data: {
        type: 'lost_pet_alert',
        pet_id: pet.id,
        lost_pet_id: lostPet.id,
        pet_name: pet.name,
        species: pet.species,
        breed: pet.breed,
        location: location,
        reward_amount: lostPet.reward_amount,
        contact_phone: lostPet.contact_phone,
        photo_url: pet.photo_url
      },
      sound: 'default',
      priority: 'high'
    })) || []

  // Send push notifications via Expo Push API
  if (notifications.length > 0) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(notifications)
      })

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`)
      }

      // Update alert count
      await supabase
        .from('lost_pets')
        .update({ alert_sent_count: notifications.length })
        .eq('id', lostPet.id)

      return { count: notifications.length }
    } catch (pushError) {
      console.error('Push notification error:', pushError)
      return { count: 0, error: pushError.message }
    }
  }

  return { count: 0 }
}

async function handleMarkFound(data: { lost_pet_id: string; user_id: string; found_by?: string }) {
  const { lost_pet_id, user_id, found_by } = data

  // Get lost pet report
  const { data: lostPet, error: fetchError } = await supabase
    .from('lost_pets')
    .select('*, pets(id, name, created_by)')
    .eq('id', lost_pet_id)
    .single()

  if (fetchError || !lostPet) {
    throw new Error('Lost pet report not found')
  }

  // Verify user can mark as found (owner or the finder)
  const canUpdate = lostPet.reported_by === user_id || 
                   lostPet.pets.created_by === user_id ||
                   (found_by && found_by === user_id)

  if (!canUpdate) {
    throw new Error('Unauthorized to mark pet as found')
  }

  // Update lost pet status
  const { error: updateError } = await supabase
    .from('lost_pets')
    .update({
      status: 'found',
      found_date: new Date().toISOString(),
      found_by: found_by || user_id
    })
    .eq('id', lost_pet_id)

  if (updateError) {
    throw new Error(`Failed to mark pet as found: ${updateError.message}`)
  }

  // Update pet status
  await supabase
    .from('pets')
    .update({ status: 'found' })
    .eq('id', lostPet.pet_id)

  return new Response(
    JSON.stringify({
      success: true,
      message: `${lostPet.pets.name} has been marked as found!`
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}

async function getNearbyAlerts(data: { user_location: { lat: number; lng: number }; radius_km?: number }) {
  const { user_location, radius_km = 25 } = data

  const { data: nearbyAlerts, error } = await supabase.rpc('get_lost_pets_within_radius', {
    center_lat: user_location.lat,
    center_lng: user_location.lng,
    radius_km
  })

  if (error) {
    throw new Error(`Failed to get nearby alerts: ${error.message}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      alerts: nearbyAlerts || [],
      count: nearbyAlerts?.length || 0
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}