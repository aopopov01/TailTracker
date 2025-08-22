// TailTracker User Profile Management Edge Function
// Handles user profile operations and premium access control

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UserProfile {
  id?: string
  email?: string
  full_name?: string
  avatar_url?: string
  phone?: string
  timezone?: string
  language?: string
  country_code?: string
  marketing_consent?: boolean
}

interface SubscriptionInfo {
  status: string
  plan: string
  expires_at: string | null
  trial_ends_at: string | null
  features: string[]
  limits: {
    pets: number
    photos_per_pet: number
    family_members: number
    vaccination_reminders: boolean
    lost_pet_alerts: boolean
    advanced_health_tracking: boolean
  }
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
    const action = pathSegments[pathSegments.length - 1]

    switch (method) {
      case 'GET':
        if (action === 'subscription') {
          return await handleGetSubscription(supabaseClient, user.id)
        } else {
          return await handleGetProfile(supabaseClient, user.id)
        }
      case 'PUT':
        return await handleUpdateProfile(supabaseClient, user.id, req)
      case 'DELETE':
        return await handleDeleteProfile(supabaseClient, user.id)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('User profile function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGetProfile(supabaseClient: any, userId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        phone,
        timezone,
        language,
        country_code,
        subscription_status,
        subscription_expires_at,
        trial_ends_at,
        marketing_consent,
        last_seen_at,
        created_at,
        families:family_members(
          family:families(
            id,
            name,
            description,
            owner_id
          ),
          role
        ),
        feature_usage(
          feature_name,
          usage_count,
          last_used_at
        )
      `)
      .eq('auth_user_id', userId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get subscription limits and features
    const subscriptionInfo = getSubscriptionInfo(data.subscription_status, data.subscription_expires_at, data.trial_ends_at)

    const profileData = {
      ...data,
      subscription: subscriptionInfo
    }

    return new Response(
      JSON.stringify({ data: profileData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get profile error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch user profile' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleGetSubscription(supabaseClient: any, userId: string) {
  try {
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select(`
        subscription_status,
        subscription_expires_at,
        trial_ends_at
      `)
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get detailed subscription data
    const { data: subscriptionData } = await supabaseClient
      .from('subscriptions')
      .select(`
        *,
        payments(
          amount,
          currency,
          status,
          processed_at
        )
      `)
      .eq('user_id', (await getUserId(supabaseClient, userId)))
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const subscriptionInfo = getSubscriptionInfo(
      userData.subscription_status,
      userData.subscription_expires_at,
      userData.trial_ends_at
    )

    const responseData = {
      ...subscriptionInfo,
      subscription_details: subscriptionData,
      billing_history: subscriptionData?.payments || []
    }

    return new Response(
      JSON.stringify({ data: responseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get subscription error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch subscription info' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleUpdateProfile(supabaseClient: any, userId: string, req: Request) {
  try {
    const profileData: Partial<UserProfile> = await req.json()

    // Remove fields that shouldn't be updated directly
    delete profileData.id
    delete profileData.email // Email updates should go through Supabase Auth

    const { data, error } = await supabaseClient
      .from('users')
      .update(profileData)
      .eq('auth_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data, message: 'Profile updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update profile error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update profile' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleDeleteProfile(supabaseClient: any, userId: string) {
  try {
    // Get user's internal ID
    const internalUserId = await getUserId(supabaseClient, userId)
    if (!internalUserId) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create GDPR deletion request
    const { data: gdprRequest, error: gdprError } = await supabaseClient
      .from('gdpr_requests')
      .insert({
        user_id: internalUserId,
        request_type: 'delete',
        status: 'pending'
      })
      .select()
      .single()

    if (gdprError) {
      console.error('GDPR request creation error:', gdprError)
      return new Response(
        JSON.stringify({ error: 'Failed to create deletion request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Soft delete user profile
    await supabaseClient
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('auth_user_id', userId)

    return new Response(
      JSON.stringify({ 
        message: 'Account deletion requested. Your data will be permanently deleted within 30 days.',
        gdpr_request_id: gdprRequest.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete profile error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete profile' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getUserId(supabaseClient: any, authUserId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single()

    return error ? null : data.id
  } catch {
    return null
  }
}

function getSubscriptionInfo(status: string, expiresAt: string | null, trialEndsAt: string | null): SubscriptionInfo {
  const now = new Date()
  const expires = expiresAt ? new Date(expiresAt) : null
  const trialEnds = trialEndsAt ? new Date(trialEndsAt) : null

  const isPremium = status === 'premium' && (
    (expires && expires > now) || 
    (trialEnds && trialEnds > now)
  )

  if (isPremium) {
    return {
      status: 'premium',
      plan: 'premium_monthly',
      expires_at: expiresAt,
      trial_ends_at: trialEndsAt,
      features: [
        'unlimited_pets',
        'unlimited_photos',
        'lost_pet_alerts',
        'vaccination_reminders',
        'medication_tracking',
        'advanced_health_tracking',
        'family_sharing_unlimited',
        'priority_support'
      ],
      limits: {
        pets: -1, // unlimited
        photos_per_pet: -1, // unlimited
        family_members: 10,
        vaccination_reminders: true,
        lost_pet_alerts: true,
        advanced_health_tracking: true
      }
    }
  }

  return {
    status: 'free',
    plan: 'free',
    expires_at: null,
    trial_ends_at: null,
    features: [
      'basic_profiles',
      'basic_vaccination_tracking'
    ],
    limits: {
      pets: 1,
      photos_per_pet: 1,
      family_members: 1,
      vaccination_reminders: false,
      lost_pet_alerts: false,
      advanced_health_tracking: false
    }
  }
}