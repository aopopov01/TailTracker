// TailTracker Notification Scheduler Edge Function
// Handles scheduled notifications and reminder processing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const method = req.method
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // This function should be called via cron job or scheduled trigger
    switch (action) {
      case 'send-scheduled':
        return await sendScheduledNotifications(supabaseClient)
      case 'vaccination-reminders':
        return await processVaccinationReminders(supabaseClient)
      case 'cleanup':
        return await cleanupOldNotifications(supabaseClient)
      case 'process-all':
        return await processAllScheduledTasks(supabaseClient)
      default:
        return await processAllScheduledTasks(supabaseClient)
    }
  } catch (error) {
    console.error('Notification scheduler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function sendScheduledNotifications(supabaseClient: any) {
  try {
    console.log('Processing scheduled notifications...')
    
    // Get notifications scheduled for now or past
    const { data: notifications, error } = await supabaseClient
      .from('notifications')
      .select(`
        id,
        user_id,
        type,
        title,
        message,
        pet_id,
        action_url,
        users:users(
          auth_user_id,
          email,
          full_name,
          phone,
          subscription_status
        )
      `)
      .lte('scheduled_for', new Date().toISOString())
      .is('sent_at', null)
      .limit(100)

    if (error) {
      console.error('Error fetching scheduled notifications:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let sentCount = 0
    let failedCount = 0

    for (const notification of notifications || []) {
      try {
        // Send push notification (would integrate with your push service)
        await sendPushNotification(notification)
        
        // Send email for important notifications
        if (['vaccination_due', 'lost_pet_alert', 'payment_failed'].includes(notification.type)) {
          await sendEmailNotification(notification)
        }

        // Send SMS for urgent notifications (premium users only)
        if (notification.type === 'lost_pet_alert' && 
            notification.users?.subscription_status === 'premium' &&
            notification.users?.phone) {
          await sendSMSNotification(notification)
        }

        // Mark as sent
        await supabaseClient
          .from('notifications')
          .update({
            sent_at: new Date().toISOString(),
            push_sent: true,
            email_sent: ['vaccination_due', 'lost_pet_alert', 'payment_failed'].includes(notification.type),
            sms_sent: notification.type === 'lost_pet_alert' && notification.users?.subscription_status === 'premium'
          })
          .eq('id', notification.id)

        sentCount++
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error)
        failedCount++
      }
    }

    console.log(`Sent ${sentCount} notifications, ${failedCount} failed`)

    return new Response(
      JSON.stringify({ 
        processed: notifications?.length || 0,
        sent: sentCount,
        failed: failedCount
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Send scheduled notifications error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send notifications' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function processVaccinationReminders(supabaseClient: any) {
  try {
    console.log('Processing vaccination reminders...')
    
    // Find vaccinations due within the next 14 days that haven't had reminders sent
    const reminderDate = new Date()
    reminderDate.setDate(reminderDate.getDate() + 14)

    const { data: vaccinations, error } = await supabaseClient
      .from('vaccinations')
      .select(`
        id,
        pet_id,
        vaccine_name,
        next_due_date,
        reminder_sent,
        pets:pets(
          id,
          name,
          family_id,
          families:families(
            id,
            family_members:family_members(
              user_id,
              users:users(
                id,
                auth_user_id,
                full_name,
                email,
                subscription_status
              )
            )
          )
        )
      `)
      .lte('next_due_date', reminderDate.toISOString().split('T')[0])
      .gte('next_due_date', new Date().toISOString().split('T')[0])
      .eq('reminder_sent', false)

    if (error) {
      console.error('Error fetching vaccinations:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch vaccinations' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let remindersSent = 0

    for (const vaccination of vaccinations || []) {
      try {
        // Calculate days until due
        const dueDate = new Date(vaccination.next_due_date)
        const today = new Date()
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Get family members with premium subscriptions
        const premiumMembers = vaccination.pets?.families?.family_members?.filter(
          (member: any) => member.users?.subscription_status === 'premium'
        ) || []

        if (premiumMembers.length === 0) {
          continue // Skip if no premium members
        }

        // Create notification for each premium family member
        for (const member of premiumMembers) {
          const reminderTitle = daysUntilDue <= 3 
            ? `🚨 ${vaccination.pets.name}'s ${vaccination.vaccine_name} vaccination is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}!`
            : `📅 ${vaccination.pets.name}'s ${vaccination.vaccine_name} vaccination is due in ${daysUntilDue} days`

          const reminderMessage = `Don't forget to schedule ${vaccination.pets.name}'s ${vaccination.vaccine_name} vaccination. It's due on ${dueDate.toLocaleDateString()}.`

          await supabaseClient
            .from('notifications')
            .insert({
              user_id: member.users.id,
              type: 'vaccination_due',
              title: reminderTitle,
              message: reminderMessage,
              pet_id: vaccination.pet_id,
              related_id: vaccination.id,
              scheduled_for: new Date().toISOString()
            })
        }

        // Mark reminder as sent
        await supabaseClient
          .from('vaccinations')
          .update({ reminder_sent: true })
          .eq('id', vaccination.id)

        remindersSent++
      } catch (error) {
        console.error(`Failed to process vaccination reminder ${vaccination.id}:`, error)
      }
    }

    console.log(`Processed ${remindersSent} vaccination reminders`)

    return new Response(
      JSON.stringify({ 
        processed: vaccinations?.length || 0,
        reminders_sent: remindersSent
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Process vaccination reminders error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process vaccination reminders' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function cleanupOldNotifications(supabaseClient: any) {
  try {
    console.log('Cleaning up old notifications...')
    
    const { data, error } = await supabaseClient
      .rpc('cleanup_old_notifications')

    if (error) {
      console.error('Cleanup error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup notifications' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Cleaned up ${data} old notifications`)

    return new Response(
      JSON.stringify({ cleaned_up: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Cleanup notifications error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to cleanup notifications' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function processAllScheduledTasks(supabaseClient: any) {
  try {
    console.log('Processing all scheduled tasks...')
    
    const results = await Promise.allSettled([
      sendScheduledNotifications(supabaseClient),
      processVaccinationReminders(supabaseClient),
      cleanupOldNotifications(supabaseClient)
    ])

    const summary = {
      tasks_completed: 0,
      tasks_failed: 0,
      results: []
    }

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'fulfilled') {
        summary.tasks_completed++
        const responseData = await result.value.json()
        summary.results.push(responseData)
      } else {
        summary.tasks_failed++
        summary.results.push({ error: result.reason?.message || 'Unknown error' })
      }
    }

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Process all scheduled tasks error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process scheduled tasks' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Placeholder functions for actual notification services
async function sendPushNotification(notification: any) {
  // Integrate with your push notification service (FCM, APNs, etc.)
  console.log(`Sending push notification to user ${notification.user_id}: ${notification.title}`)
  
  // Example: Send to FCM
  // const fcmToken = await getFCMToken(notification.users.auth_user_id)
  // await sendFCMNotification(fcmToken, notification.title, notification.message)
}

async function sendEmailNotification(notification: any) {
  // Integrate with your email service (SendGrid, AWS SES, etc.)
  console.log(`Sending email notification to ${notification.users.email}: ${notification.title}`)
  
  // Example: Send via SendGrid
  // await sendGridEmail({
  //   to: notification.users.email,
  //   subject: notification.title,
  //   html: generateEmailTemplate(notification)
  // })
}

async function sendSMSNotification(notification: any) {
  // Integrate with your SMS service (Twilio, AWS SNS, etc.)
  console.log(`Sending SMS notification to ${notification.users.phone}: ${notification.title}`)
  
  // Example: Send via Twilio
  // await twilioClient.messages.create({
  //   to: notification.users.phone,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   body: `${notification.title}\n\n${notification.message}`
  // })
}