/**
 * TailTracker Comprehensive Notification System
 * Multi-channel notifications: Push, Email, SMS, Real-time WebSocket
 */

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

class NotificationSystem {
  constructor(config) {
    // Initialize Firebase Admin SDK for push notifications
    if (config.firebase.serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(config.firebase.serviceAccount),
        projectId: config.firebase.projectId
      });
      this.messaging = admin.messaging();
    }

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });

    // Initialize Twilio for SMS
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
      this.twilioPhoneNumber = config.twilio.phoneNumber;
    }

    // Initialize Supabase client
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

    // WebSocket server for real-time notifications
    this.wsConnections = new Map(); // userId -> WebSocket connection
  }

  /**
   * Notification templates for different types
   */
  static TEMPLATES = {
    // Vaccination reminders
    vaccination_due: {
      push: {
        title: '💉 Vaccination Due',
        body: '{petName} is due for {vaccineName} vaccination'
      },
      email: {
        subject: 'Vaccination Reminder for {petName}',
        template: 'vaccination_reminder'
      },
      priority: 'high'
    },

    // Medication reminders
    medication_due: {
      push: {
        title: '💊 Medication Time',
        body: 'Time to give {petName} their {medicationName}'
      },
      email: {
        subject: 'Medication Reminder for {petName}',
        template: 'medication_reminder'
      },
      priority: 'high'
    },

    // Lost pet alerts
    lost_pet_alert: {
      push: {
        title: '🚨 Lost Pet Alert',
        body: '{petName} has been reported lost in your area'
      },
      email: {
        subject: 'Lost Pet Alert - {petName}',
        template: 'lost_pet_alert'
      },
      sms: {
        body: 'LOST PET ALERT: {petName} reported lost near {location}. More details: {url}'
      },
      priority: 'critical'
    },

    // Found pet notifications
    pet_found: {
      push: {
        title: '🎉 Great News!',
        body: '{petName} has been found safe!'
      },
      email: {
        subject: 'Good News - {petName} Has Been Found!',
        template: 'pet_found'
      },
      priority: 'high'
    },

    // Family invitations
    family_invite: {
      push: {
        title: '👨‍👩‍👧‍👦 Family Invitation',
        body: 'You\'ve been invited to join {familyName}\'s pet family'
      },
      email: {
        subject: 'Join {familyName}\'s Pet Family on TailTracker',
        template: 'family_invitation'
      },
      priority: 'medium'
    },

    // Appointment reminders
    appointment: {
      push: {
        title: '📅 Vet Appointment',
        body: '{petName} has an appointment with {vetName} tomorrow'
      },
      email: {
        subject: 'Veterinary Appointment Reminder for {petName}',
        template: 'appointment_reminder'
      },
      priority: 'high'
    },

    // Subscription notifications
    subscription_expiring: {
      push: {
        title: '⚠️ Subscription Expiring',
        body: 'Your premium subscription expires in 3 days'
      },
      email: {
        subject: 'Your TailTracker Premium Subscription is Expiring',
        template: 'subscription_expiring'
      },
      priority: 'medium'
    },

    trial_ending: {
      push: {
        title: '⏰ Trial Ending Soon',
        body: 'Your free trial ends tomorrow. Upgrade to keep premium features!'
      },
      email: {
        subject: 'Your TailTracker Trial Ends Tomorrow',
        template: 'trial_ending'
      },
      priority: 'high'
    }
  };

  /**
   * Send multi-channel notification
   */
  async sendNotification(userId, notificationType, data, channels = ['push', 'database']) {
    try {
      const template = NotificationSystem.TEMPLATES[notificationType];
      if (!template) {
        throw new Error(`Unknown notification type: ${notificationType}`);
      }

      // Get user preferences and contact info
      const userPrefs = await this.getUserNotificationPreferences(userId);
      const enabledChannels = channels.filter(channel => 
        userPrefs.channels[channel] && userPrefs.types[notificationType] !== false
      );

      const results = {};

      // Store notification in database first
      const dbNotification = await this.storeNotification(userId, notificationType, template, data);
      results.database = { success: true, id: dbNotification.id };

      // Send through enabled channels
      await Promise.allSettled(enabledChannels.map(async channel => {
        try {
          switch (channel) {
            case 'push':
              results.push = await this.sendPushNotification(userId, template.push, data);
              break;
            case 'email':
              results.email = await this.sendEmailNotification(userPrefs.email, template.email, data);
              break;
            case 'sms':
              if (template.sms && userPrefs.phone) {
                results.sms = await this.sendSMSNotification(userPrefs.phone, template.sms, data);
              }
              break;
            case 'websocket':
              results.websocket = await this.sendWebSocketNotification(userId, template, data);
              break;
          }
        } catch (error) {
          results[channel] = { success: false, error: error.message };
        }
      }));

      // Update notification status
      await this.updateNotificationStatus(dbNotification.id, results);

      return {
        notification_id: dbNotification.id,
        channels_attempted: enabledChannels,
        results
      };

    } catch (error) {
      console.error('Notification send failed:', error);
      throw error;
    }
  }

  /**
   * Store notification in database
   */
  async storeNotification(userId, type, template, data) {
    const notificationData = {
      user_id: userId,
      type: type,
      title: this.interpolateTemplate(template.push?.title || template.email?.subject, data),
      message: this.interpolateTemplate(template.push?.body || template.email?.subject, data),
      pet_id: data.petId || null,
      related_id: data.relatedId || null,
      scheduled_for: data.scheduledFor || null,
      action_url: data.actionUrl || null
    };

    const { data: notification, error } = await this.supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) throw error;
    return notification;
  }

  /**
   * Send push notification via Firebase
   */
  async sendPushNotification(userId, template, data) {
    try {
      // Get user's FCM tokens
      const tokens = await this.getUserFCMTokens(userId);
      if (!tokens.length) {
        return { success: false, reason: 'no_tokens' };
      }

      const message = {
        notification: {
          title: this.interpolateTemplate(template.title, data),
          body: this.interpolateTemplate(template.body, data)
        },
        data: {
          type: data.type || 'general',
          pet_id: data.petId?.toString() || '',
          action_url: data.actionUrl || ''
        },
        tokens: tokens
      };

      const response = await this.messaging.sendMulticast(message);
      
      // Remove invalid tokens
      if (response.failureCount > 0) {
        await this.removeInvalidTokens(userId, response.responses, tokens);
      }

      return {
        success: true,
        successful_sends: response.successCount,
        failed_sends: response.failureCount
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(email, template, data) {
    try {
      const subject = this.interpolateTemplate(template.subject, data);
      const htmlContent = await this.generateEmailHTML(template.template, data);

      const mailOptions = {
        from: 'TailTracker <notifications@tailtracker.com>',
        to: email,
        subject: subject,
        html: htmlContent,
        text: this.htmlToText(htmlContent)
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      return {
        success: true,
        message_id: result.messageId
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(phoneNumber, template, data) {
    try {
      if (!this.twilioClient) {
        return { success: false, reason: 'sms_not_configured' };
      }

      const message = this.interpolateTemplate(template.body, data);
      
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: phoneNumber
      });

      return {
        success: true,
        message_sid: result.sid
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send real-time WebSocket notification
   */
  async sendWebSocketNotification(userId, template, data) {
    try {
      const ws = this.wsConnections.get(userId);
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return { success: false, reason: 'no_connection' };
      }

      const notification = {
        type: 'notification',
        data: {
          title: this.interpolateTemplate(template.push?.title, data),
          body: this.interpolateTemplate(template.push?.body, data),
          timestamp: new Date().toISOString(),
          action_url: data.actionUrl
        }
      };

      ws.send(JSON.stringify(notification));
      
      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule notification for future delivery
   */
  async scheduleNotification(userId, notificationType, data, scheduledFor, channels = ['push', 'database']) {
    const notificationData = {
      user_id: userId,
      type: notificationType,
      title: data.title,
      message: data.message,
      pet_id: data.petId || null,
      related_id: data.relatedId || null,
      scheduled_for: scheduledFor,
      action_url: data.actionUrl || null
    };

    const { data: notification, error } = await this.supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) throw error;

    return {
      notification_id: notification.id,
      scheduled_for: scheduledFor,
      channels: channels
    };
  }

  /**
   * Process scheduled notifications (run by cron job)
   */
  async processScheduledNotifications() {
    const now = new Date().toISOString();
    
    const { data: pendingNotifications } = await this.supabase
      .from('notifications')
      .select('*')
      .lte('scheduled_for', now)
      .is('sent_at', null)
      .limit(100);

    for (const notification of pendingNotifications || []) {
      try {
        await this.sendNotification(
          notification.user_id,
          notification.type,
          {
            title: notification.title,
            message: notification.message,
            petId: notification.pet_id,
            actionUrl: notification.action_url
          }
        );

        // Mark as sent
        await this.supabase
          .from('notifications')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', notification.id);

      } catch (error) {
        console.error(`Failed to send scheduled notification ${notification.id}:`, error);
      }
    }
  }

  /**
   * Bulk notifications for lost pet alerts in geographic area
   */
  async sendLostPetAreaAlert(petData, location, radiusKm = 10) {
    try {
      // Find users in the area who have opted in to lost pet alerts
      const { data: nearbyUsers } = await this.supabase
        .rpc('get_users_in_radius', {
          center_lat: location.latitude,
          center_lng: location.longitude,
          radius_km: radiusKm
        });

      const results = [];

      // Send notifications to all nearby users
      for (const user of nearbyUsers || []) {
        try {
          const result = await this.sendNotification(
            user.id,
            'lost_pet_alert',
            {
              petName: petData.name,
              petType: petData.species,
              location: location.address || `${location.latitude}, ${location.longitude}`,
              actionUrl: `https://app.tailtracker.com/lost-pets/${petData.id}`,
              petId: petData.id
            },
            ['push', 'email', 'database']
          );

          results.push({
            user_id: user.id,
            success: true,
            notification_id: result.notification_id
          });

        } catch (error) {
          results.push({
            user_id: user.id,
            success: false,
            error: error.message
          });
        }
      }

      return {
        total_recipients: nearbyUsers?.length || 0,
        successful_sends: results.filter(r => r.success).length,
        failed_sends: results.filter(r => !r.success).length,
        results
      };

    } catch (error) {
      throw new Error(`Failed to send area alert: ${error.message}`);
    }
  }

  /**
   * User notification preferences management
   */
  async getUserNotificationPreferences(userId) {
    // Get user data including contact info and preferences
    const { data: user } = await this.supabase
      .from('users')
      .select('email, phone, notification_preferences')
      .eq('id', userId)
      .single();

    // Default preferences if not set
    const defaultPrefs = {
      channels: {
        push: true,
        email: true,
        sms: false,
        database: true
      },
      types: {
        vaccination_due: true,
        medication_due: true,
        lost_pet_alert: true,
        pet_found: true,
        family_invite: true,
        appointment: true,
        subscription_expiring: true,
        trial_ending: true
      }
    };

    return {
      email: user?.email,
      phone: user?.phone,
      ...defaultPrefs,
      ...user?.notification_preferences
    };
  }

  async updateNotificationPreferences(userId, preferences) {
    const { error } = await this.supabase
      .from('users')
      .update({ notification_preferences: preferences })
      .eq('id', userId);

    if (error) throw error;
    return preferences;
  }

  /**
   * FCM token management
   */
  async registerFCMToken(userId, token, deviceType) {
    // Store FCM token for user (implementation depends on your token storage strategy)
    const { error } = await this.supabase
      .from('user_devices')
      .upsert({
        user_id: userId,
        fcm_token: token,
        device_type: deviceType,
        last_used: new Date().toISOString()
      }, { onConflict: 'fcm_token' });

    if (error) throw error;
  }

  async getUserFCMTokens(userId) {
    const { data: devices } = await this.supabase
      .from('user_devices')
      .select('fcm_token')
      .eq('user_id', userId)
      .not('fcm_token', 'is', null);

    return devices?.map(d => d.fcm_token) || [];
  }

  async removeInvalidTokens(userId, responses, tokens) {
    const invalidTokens = [];
    
    responses.forEach((response, index) => {
      if (!response.success && 
          (response.error?.code === 'messaging/invalid-registration-token' ||
           response.error?.code === 'messaging/registration-token-not-registered')) {
        invalidTokens.push(tokens[index]);
      }
    });

    if (invalidTokens.length > 0) {
      await this.supabase
        .from('user_devices')
        .delete()
        .in('fcm_token', invalidTokens);
    }
  }

  /**
   * Utility methods
   */
  interpolateTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  async generateEmailHTML(templateName, data) {
    // This would integrate with your email template system
    // For now, return a simple HTML template
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🐾 TailTracker</h1>
          </div>
          <div style="padding: 30px;">
            <h2>${data.title || 'Notification'}</h2>
            <p>${data.message || 'You have a new notification.'}</p>
            ${data.actionUrl ? `<a href="${data.actionUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">View Details</a>` : ''}
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d;">
            <p>This email was sent by TailTracker. If you no longer wish to receive these emails, you can <a href="https://app.tailtracker.com/settings/notifications">update your preferences</a>.</p>
          </div>
        </body>
      </html>
    `;
  }

  htmlToText(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async updateNotificationStatus(notificationId, results) {
    const updates = {
      sent_at: new Date().toISOString(),
      push_sent: results.push?.success || false,
      email_sent: results.email?.success || false
    };

    await this.supabase
      .from('notifications')
      .update(updates)
      .eq('id', notificationId);
  }

  /**
   * WebSocket connection management
   */
  handleWebSocketConnection(ws, userId) {
    this.wsConnections.set(userId, ws);
    
    ws.on('close', () => {
      this.wsConnections.delete(userId);
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId, userId) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

module.exports = { NotificationSystem };