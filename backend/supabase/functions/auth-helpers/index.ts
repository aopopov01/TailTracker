// TailTracker Authentication Helper Edge Function
// Handles auth-related operations like family invites and profile setup

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { responseHeaders, getCorsHeaders } from '../_shared/cors.ts'

interface JoinFamilyRequest {
  invite_code: string
}

interface CompleteOnboardingRequest {
  full_name: string
  phone?: string
  timezone?: string
  marketing_consent?: boolean
  pet_data?: {
    name: string
    species: string
    breed?: string
    date_of_birth?: string
  }
}

serve(async (req) => {
  // Handle CORS
  const origin = req.headers.get('origin');
  const responseHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders })
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
        { status: 401, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const method = req.method
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const action = pathSegments[pathSegments.length - 1]

    switch (method) {
      case 'GET':
        if (action === 'onboarding-status') {
          return await handleGetOnboardingStatus(supabaseClient, user.id)
        } else if (action === 'email-verification-status') {
          return await handleGetEmailVerificationStatus(supabaseClient, user.id)
        }
        break
      case 'POST':
        if (action === 'join-family') {
          return await handleJoinFamily(supabaseClient, user.id, req)
        } else if (action === 'complete-onboarding') {
          return await handleCompleteOnboarding(supabaseClient, user.id, req)
        } else if (action === 'resend-confirmation') {
          return await handleResendConfirmation(supabaseClient, user.email!)
        } else if (action === 'request-password-reset') {
          return await handleRequestPasswordReset(supabaseClient, req)
        }
        break
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Auth helpers function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGetOnboardingStatus(supabaseClient: any, userId: string) {
  try {
    // Check if user has completed onboarding
    const { data, error } = await supabaseClient
      .rpc('has_completed_onboarding', { user_auth_id: userId })

    if (error) {
      console.error('Onboarding status error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to check onboarding status' }),
        { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile and pet count for detailed status
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select(`
        full_name,
        phone,
        avatar_url,
        families:family_members(
          family:families(
            id,
            name,
            pets:pets(id, name, species)
          )
        )
      `)
      .eq('auth_user_id', userId)
      .single()

    if (userError) {
      console.error('User data error:', userError)
    }

    const hasProfile = userData?.full_name && userData.full_name.trim() !== ''
    const hasPets = userData?.families?.some((fm: any) => fm.family?.pets?.length > 0)

    return new Response(
      JSON.stringify({
        data: {
          completed: data || false,
          has_profile: hasProfile || false,
          has_pets: hasPets || false,
          pet_count: userData?.families?.[0]?.family?.pets?.length || 0,
          user_data: userData
        }
      }),
      { status: 200, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get onboarding status error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get onboarding status' }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleGetEmailVerificationStatus(supabaseClient: any, userId: string) {
  try {
    const { data, error } = await supabaseClient
      .rpc('is_email_confirmed', { user_auth_id: userId })

    if (error) {
      console.error('Email verification status error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to check email verification status' }),
        { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data: { email_confirmed: data || false } }),
      { status: 200, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get email verification status error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get email verification status' }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleJoinFamily(supabaseClient: any, userId: string, req: Request) {
  try {
    const { invite_code }: JoinFamilyRequest = await req.json()

    if (!invite_code || invite_code.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Invite code is required' }),
        { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use the database function to join family
    const { data, error } = await supabaseClient
      .rpc('join_family_by_invite_code', {
        user_auth_id: userId,
        invite_code: invite_code.trim().toUpperCase()
      })

    if (error) {
      console.error('Join family error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to join family' }),
        { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!data.success) {
      return new Response(
        JSON.stringify({ error: data.error }),
        { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        data: {
          family_id: data.family_id,
          family_name: data.family_name
        },
        message: data.message 
      }),
      { status: 200, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Join family error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to join family' }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCompleteOnboarding(supabaseClient: any, userId: string, req: Request) {
  try {
    const onboardingData: CompleteOnboardingRequest = await req.json()

    // Get user's internal ID and family ID
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select(`
        id,
        families:family_members(
          family:families(id, name)
        )
      `)
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user profile
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        full_name: onboardingData.full_name,
        phone: onboardingData.phone,
        timezone: onboardingData.timezone || 'UTC',
        marketing_consent: onboardingData.marketing_consent || false,
        gdpr_consent_date: new Date().toISOString()
      })
      .eq('auth_user_id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create first pet if provided
    let petData = null
    if (onboardingData.pet_data && userData.families?.[0]?.family?.id) {
      const { data: newPet, error: petError } = await supabaseClient
        .from('pets')
        .insert({
          family_id: userData.families[0].family.id,
          name: onboardingData.pet_data.name,
          species: onboardingData.pet_data.species,
          breed: onboardingData.pet_data.breed,
          date_of_birth: onboardingData.pet_data.date_of_birth,
          created_by: userData.id
        })
        .select()
        .single()

      if (petError) {
        console.error('Pet creation error:', petError)
      } else {
        petData = newPet
      }
    }

    // Send welcome notification
    await supabaseClient
      .rpc('send_welcome_notification', { user_auth_id: userId })

    return new Response(
      JSON.stringify({
        data: {
          profile_updated: true,
          pet_created: !!petData,
          pet_data: petData
        },
        message: 'Onboarding completed successfully'
      }),
      { status: 200, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Complete onboarding error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to complete onboarding' }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleResendConfirmation(supabaseClient: any, userEmail: string) {
  try {
    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email: userEmail
    })

    if (error) {
      console.error('Resend confirmation error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to resend confirmation email' }),
        { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Confirmation email sent' }),
      { status: 200, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Resend confirmation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to resend confirmation email' }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleRequestPasswordReset(supabaseClient: any, req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${Deno.env.get('APP_URL') || 'https://tailtracker.app'}/reset-password`
    })

    if (error) {
      console.error('Password reset error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send password reset email' }),
        { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Password reset email sent' }),
      { status: 200, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Request password reset error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to request password reset' }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
}