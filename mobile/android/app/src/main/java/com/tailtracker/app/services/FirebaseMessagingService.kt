package com.tailtracker.app.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.tailtracker.app.MainActivity
import com.tailtracker.app.R

class FirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCMService"
        
        // Notification channels
        const val CHANNEL_ALERTS = "pet_alerts"
        const val CHANNEL_LOCATION = "location_updates"
        const val CHANNEL_REMINDERS = "reminders"
        const val CHANNEL_GENERAL = "general"
        
        // Notification types
        const val TYPE_PET_ALERT = "pet_alert"
        const val TYPE_SAFE_ZONE_EXIT = "safe_zone_exit"
        const val TYPE_SAFE_ZONE_ENTRY = "safe_zone_entry"
        const val TYPE_LOW_BATTERY = "low_battery"
        const val TYPE_DEVICE_OFFLINE = "device_offline"
        const val TYPE_HEALTH_REMINDER = "health_reminder"
        const val TYPE_LOCATION_UPDATE = "location_update"
        const val TYPE_SUBSCRIPTION_EXPIRED = "subscription_expired"
        const val TYPE_GENERAL = "general"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    /**
     * Called when message is received.
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "From: ${remoteMessage.from}")

        // Check if message contains a data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            handleDataMessage(remoteMessage.data)
        }

        // Check if message contains a notification payload
        remoteMessage.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
            val notificationType = remoteMessage.data["type"] ?: TYPE_GENERAL
            sendNotification(it.title, it.body, notificationType, remoteMessage.data)
        }
    }

    /**
     * Called if the FCM registration token is updated.
     */
    override fun onNewToken(token: String) {
        Log.d(TAG, "Refreshed token: $token")
        sendRegistrationToServer(token)
    }

    /**
     * Handle data-only messages
     */
    private fun handleDataMessage(data: Map<String, String>) {
        val type = data["type"] ?: TYPE_GENERAL
        val title = data["title"]
        val body = data["body"]
        
        if (title != null && body != null) {
            sendNotification(title, body, type, data)
        }
    }

    /**
     * Create and show a simple notification containing the received FCM message.
     */
    private fun sendNotification(
        title: String?,
        messageBody: String?,
        type: String,
        data: Map<String, String>
    ) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            
            // Add extra data for handling notification click
            data.forEach { (key, value) ->
                putExtra(key, value)
            }
            putExtra("notification_type", type)
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val channelId = getChannelId(type)
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(getNotificationIcon(type))
            .setContentTitle(title ?: "TailTracker")
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)
            .setPriority(getNotificationPriority(type))
            .setCategory(getNotificationCategory(type))

        // Add custom styling based on type
        when (type) {
            TYPE_PET_ALERT, TYPE_SAFE_ZONE_EXIT -> {
                notificationBuilder
                    .setColor(getColor(R.color.status_danger))
                    .setLights(getColor(R.color.status_danger), 1000, 1000)
                    .setVibrate(longArrayOf(0, 1000, 500, 1000))
            }
            TYPE_SAFE_ZONE_ENTRY -> {
                notificationBuilder
                    .setColor(getColor(R.color.status_safe))
            }
            TYPE_LOW_BATTERY, TYPE_DEVICE_OFFLINE -> {
                notificationBuilder
                    .setColor(getColor(R.color.status_alert))
            }
            TYPE_HEALTH_REMINDER -> {
                notificationBuilder
                    .setColor(getColor(R.color.primary))
                    .setVibrate(longArrayOf(0, 500, 250, 500))
            }
        }

        // Add large icon if available
        val petId = data["petId"]
        if (petId != null) {
            // Could load pet image from cache or default pet icon
            notificationBuilder.setLargeIcon(
                getPetIcon(petId)
            )
        }

        // Add action buttons for certain notification types
        addNotificationActions(notificationBuilder, type, data)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Generate unique notification ID based on type and data
        val notificationId = generateNotificationId(type, data)
        
        notificationManager.notify(notificationId, notificationBuilder.build())
    }

    /**
     * Add action buttons to notifications
     */
    private fun addNotificationActions(
        builder: NotificationCompat.Builder,
        type: String,
        data: Map<String, String>
    ) {
        when (type) {
            TYPE_PET_ALERT, TYPE_SAFE_ZONE_EXIT -> {
                // Add "View Location" action
                val viewLocationIntent = Intent(this, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    putExtra("action", "view_location")
                    data.forEach { (key, value) -> putExtra(key, value) }
                }
                val viewLocationPendingIntent = PendingIntent.getActivity(
                    this,
                    1,
                    viewLocationIntent,
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                )
                
                builder.addAction(
                    R.drawable.ic_map,
                    "View Location",
                    viewLocationPendingIntent
                )

                // Add "Call Emergency" action for critical alerts
                if (type == TYPE_PET_ALERT) {
                    val callIntent = Intent(Intent.ACTION_DIAL).apply {
                        data = android.net.Uri.parse("tel:911")
                    }
                    val callPendingIntent = PendingIntent.getActivity(
                        this,
                        2,
                        callIntent,
                        PendingIntent.FLAG_IMMUTABLE
                    )
                    
                    builder.addAction(
                        R.drawable.ic_phone,
                        "Emergency",
                        callPendingIntent
                    )
                }
            }
            
            TYPE_HEALTH_REMINDER -> {
                // Add "Mark Done" action
                val markDoneIntent = Intent(this, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    putExtra("action", "mark_reminder_done")
                    data.forEach { (key, value) -> putExtra(key, value) }
                }
                val markDonePendingIntent = PendingIntent.getActivity(
                    this,
                    3,
                    markDoneIntent,
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                )
                
                builder.addAction(
                    R.drawable.ic_check,
                    "Mark Done",
                    markDonePendingIntent
                )
            }
        }
    }

    /**
     * Get notification channel ID based on type
     */
    private fun getChannelId(type: String): String {
        return when (type) {
            TYPE_PET_ALERT, TYPE_SAFE_ZONE_EXIT -> CHANNEL_ALERTS
            TYPE_LOCATION_UPDATE, TYPE_SAFE_ZONE_ENTRY -> CHANNEL_LOCATION
            TYPE_HEALTH_REMINDER -> CHANNEL_REMINDERS
            else -> CHANNEL_GENERAL
        }
    }

    /**
     * Get notification icon based on type
     */
    private fun getNotificationIcon(type: String): Int {
        return when (type) {
            TYPE_PET_ALERT -> R.drawable.ic_notification_alert
            TYPE_SAFE_ZONE_EXIT -> R.drawable.ic_notification_warning
            TYPE_SAFE_ZONE_ENTRY -> R.drawable.ic_notification_safe
            TYPE_LOW_BATTERY -> R.drawable.ic_notification_battery
            TYPE_HEALTH_REMINDER -> R.drawable.ic_notification_health
            TYPE_LOCATION_UPDATE -> R.drawable.ic_notification_location
            else -> R.drawable.ic_notification
        }
    }

    /**
     * Get notification priority based on type
     */
    private fun getNotificationPriority(type: String): Int {
        return when (type) {
            TYPE_PET_ALERT, TYPE_SAFE_ZONE_EXIT -> NotificationCompat.PRIORITY_HIGH
            TYPE_LOW_BATTERY, TYPE_DEVICE_OFFLINE -> NotificationCompat.PRIORITY_DEFAULT
            else -> NotificationCompat.PRIORITY_DEFAULT
        }
    }

    /**
     * Get notification category based on type
     */
    private fun getNotificationCategory(type: String): String {
        return when (type) {
            TYPE_PET_ALERT, TYPE_SAFE_ZONE_EXIT -> NotificationCompat.CATEGORY_ALARM
            TYPE_HEALTH_REMINDER -> NotificationCompat.CATEGORY_REMINDER
            TYPE_LOCATION_UPDATE -> NotificationCompat.CATEGORY_STATUS
            else -> NotificationCompat.CATEGORY_MESSAGE
        }
    }

    /**
     * Generate unique notification ID
     */
    private fun generateNotificationId(type: String, data: Map<String, String>): Int {
        val petId = data["petId"]
        val base = type.hashCode()
        return if (petId != null) {
            base + petId.hashCode()
        } else {
            base + System.currentTimeMillis().toInt()
        }
    }

    /**
     * Get pet icon (placeholder implementation)
     */
    private fun getPetIcon(petId: String): android.graphics.Bitmap? {
        // Implement pet icon loading from cache or use default
        // For now, return null to use default notification icon
        return null
    }

    /**
     * Create notification channels for Android O and above
     */
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Pet Alerts Channel (High Priority)
            val alertsChannel = NotificationChannel(
                CHANNEL_ALERTS,
                "Pet Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical alerts about your pets"
                enableLights(true)
                lightColor = getColor(R.color.status_danger)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 500, 1000)
                setSound(
                    android.net.Uri.parse("android.resource://$packageName/${R.raw.alert}"),
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                        .build()
                )
            }

            // Location Updates Channel (Normal Priority)
            val locationChannel = NotificationChannel(
                CHANNEL_LOCATION,
                "Location Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Location and movement notifications"
                enableLights(false)
                enableVibration(false)
                setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                        .build()
                )
            }

            // Health Reminders Channel (Normal Priority)
            val remindersChannel = NotificationChannel(
                CHANNEL_REMINDERS,
                "Health Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Medication and appointment reminders"
                enableLights(false)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 250, 500)
                setSound(
                    android.net.Uri.parse("android.resource://$packageName/${R.raw.reminder}"),
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                        .build()
                )
            }

            // General Notifications Channel (Low Priority)
            val generalChannel = NotificationChannel(
                CHANNEL_GENERAL,
                "General Notifications",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "General app notifications"
                enableLights(false)
                enableVibration(false)
                setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                        .build()
                )
            }

            // Register channels
            notificationManager.createNotificationChannels(
                listOf(alertsChannel, locationChannel, remindersChannel, generalChannel)
            )
        }
    }

    /**
     * Send registration token to server
     */
    private fun sendRegistrationToServer(token: String?) {
        Log.d(TAG, "Sending registration token to server: $token")
        
        // TODO: Implement sending token to your backend server
        // This should be done through your API
        
        // Example implementation:
        /*
        token?.let { fcmToken ->
            // Send to backend
            Thread {
                try {
                    // Make HTTP request to your server
                    // Include user authentication and platform info
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to send token to server", e)
                }
            }.start()
        }
        */
    }
}