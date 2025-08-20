package com.tailtracker.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.tailtracker.app.services.PetMonitoringService
import com.tailtracker.app.data.AlertType
import com.tailtracker.app.utils.NotificationUtils

class NotificationReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "NotificationReceiver"
        
        // Actions
        const val ACTION_NOTIFICATION_CLICKED = "notification_clicked"
        const val ACTION_NOTIFICATION_DISMISSED = "notification_dismissed"
        const val ACTION_QUICK_ACTION = "quick_action"
        
        // Quick actions
        const val QUICK_ACTION_VIEW_LOCATION = "view_location"
        const val QUICK_ACTION_MARK_SAFE = "mark_safe"
        const val QUICK_ACTION_CALL_EMERGENCY = "call_emergency"
        const val QUICK_ACTION_DISMISS_ALERT = "dismiss_alert"
        const val QUICK_ACTION_SNOOZE_REMINDER = "snooze_reminder"
        
        // Extras
        const val EXTRA_NOTIFICATION_ID = "notification_id"
        const val EXTRA_PET_ID = "pet_id"
        const val EXTRA_ALERT_ID = "alert_id"
        const val EXTRA_ALERT_TYPE = "alert_type"
        const val EXTRA_QUICK_ACTION = "quick_action"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Received notification action: ${intent.action}")
        
        when (intent.action) {
            ACTION_NOTIFICATION_CLICKED -> handleNotificationClick(context, intent)
            ACTION_NOTIFICATION_DISMISSED -> handleNotificationDismissal(context, intent)
            ACTION_QUICK_ACTION -> handleQuickAction(context, intent)
            else -> {
                Log.w(TAG, "Unknown action: ${intent.action}")
            }
        }
    }

    private fun handleNotificationClick(context: Context, intent: Intent) {
        val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1)
        val petId = intent.getStringExtra(EXTRA_PET_ID)
        val alertType = intent.getStringExtra(EXTRA_ALERT_TYPE)
        
        Log.d(TAG, "Notification clicked - Pet: $petId, Alert: $alertType, ID: $notificationId")
        
        try {
            // Cancel the notification
            if (notificationId != -1) {
                NotificationUtils.cancelNotification(context, notificationId)
            }
            
            // Launch appropriate screen based on alert type
            when (alertType) {
                AlertType.SAFETY_ALERT.name,
                AlertType.GEOFENCE_EXIT.name -> {
                    launchMapScreen(context, petId)
                }
                AlertType.HEALTH_REMINDER.name -> {
                    launchHealthScreen(context, petId)
                }
                AlertType.LOW_BATTERY.name,
                AlertType.DEVICE_OFFLINE.name -> {
                    launchDeviceScreen(context, petId)
                }
                else -> {
                    launchMainScreen(context)
                }
            }
            
            // Mark notification as read
            markNotificationAsRead(context, notificationId, petId, alertType)
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle notification click", e)
        }
    }

    private fun handleNotificationDismissal(context: Context, intent: Intent) {
        val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1)
        val petId = intent.getStringExtra(EXTRA_PET_ID)
        val alertType = intent.getStringExtra(EXTRA_ALERT_TYPE)
        
        Log.d(TAG, "Notification dismissed - Pet: $petId, Alert: $alertType, ID: $notificationId")
        
        try {
            // Mark notification as dismissed
            markNotificationAsDismissed(context, notificationId, petId, alertType)
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle notification dismissal", e)
        }
    }

    private fun handleQuickAction(context: Context, intent: Intent) {
        val quickAction = intent.getStringExtra(EXTRA_QUICK_ACTION)
        val petId = intent.getStringExtra(EXTRA_PET_ID)
        val alertId = intent.getStringExtra(EXTRA_ALERT_ID)
        val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1)
        
        Log.d(TAG, "Quick action: $quickAction, Pet: $petId, Alert: $alertId")
        
        try {
            when (quickAction) {
                QUICK_ACTION_VIEW_LOCATION -> {
                    launchMapScreen(context, petId)
                    if (notificationId != -1) {
                        NotificationUtils.cancelNotification(context, notificationId)
                    }
                }
                
                QUICK_ACTION_MARK_SAFE -> {
                    markPetAsSafe(context, petId, alertId)
                    if (notificationId != -1) {
                        NotificationUtils.cancelNotification(context, notificationId)
                    }
                    showConfirmationNotification(context, "Pet marked as safe")
                }
                
                QUICK_ACTION_CALL_EMERGENCY -> {
                    callEmergencyServices(context)
                    // Keep notification visible for emergency calls
                }
                
                QUICK_ACTION_DISMISS_ALERT -> {
                    dismissAlert(context, petId, alertId)
                    if (notificationId != -1) {
                        NotificationUtils.cancelNotification(context, notificationId)
                    }
                }
                
                QUICK_ACTION_SNOOZE_REMINDER -> {
                    snoozeHealthReminder(context, petId, alertId)
                    if (notificationId != -1) {
                        NotificationUtils.cancelNotification(context, notificationId)
                    }
                    showConfirmationNotification(context, "Reminder snoozed for 1 hour")
                }
                
                else -> {
                    Log.w(TAG, "Unknown quick action: $quickAction")
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle quick action: $quickAction", e)
        }
    }

    private fun launchMapScreen(context: Context, petId: String?) {
        try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                putExtra("screen", "map")
                if (petId != null) {
                    putExtra("pet_id", petId)
                }
            }
            
            if (launchIntent != null) {
                context.startActivity(launchIntent)
                Log.d(TAG, "Launched map screen for pet: $petId")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch map screen", e)
        }
    }

    private fun launchHealthScreen(context: Context, petId: String?) {
        try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                putExtra("screen", "health")
                if (petId != null) {
                    putExtra("pet_id", petId)
                }
            }
            
            if (launchIntent != null) {
                context.startActivity(launchIntent)
                Log.d(TAG, "Launched health screen for pet: $petId")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch health screen", e)
        }
    }

    private fun launchDeviceScreen(context: Context, petId: String?) {
        try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                putExtra("screen", "device")
                if (petId != null) {
                    putExtra("pet_id", petId)
                }
            }
            
            if (launchIntent != null) {
                context.startActivity(launchIntent)
                Log.d(TAG, "Launched device screen for pet: $petId")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch device screen", e)
        }
    }

    private fun launchMainScreen(context: Context) {
        try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            }
            
            if (launchIntent != null) {
                context.startActivity(launchIntent)
                Log.d(TAG, "Launched main screen")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch main screen", e)
        }
    }

    private fun markPetAsSafe(context: Context, petId: String?, alertId: String?) {
        if (petId == null) return
        
        try {
            // Send intent to pet monitoring service
            val intent = Intent(context, PetMonitoringService::class.java).apply {
                action = "MARK_PET_SAFE"
                putExtra("pet_id", petId)
                if (alertId != null) {
                    putExtra("alert_id", alertId)
                }
            }
            
            context.startService(intent)
            Log.d(TAG, "Marked pet as safe: $petId")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to mark pet as safe", e)
        }
    }

    private fun callEmergencyServices(context: Context) {
        try {
            val callIntent = Intent(Intent.ACTION_CALL).apply {
                data = android.net.Uri.parse("tel:911")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            
            if (callIntent.resolveActivity(context.packageManager) != null) {
                context.startActivity(callIntent)
                Log.d(TAG, "Initiated emergency call")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to call emergency services", e)
        }
    }

    private fun dismissAlert(context: Context, petId: String?, alertId: String?) {
        if (petId == null || alertId == null) return
        
        try {
            // Send intent to pet monitoring service
            val intent = Intent(context, PetMonitoringService::class.java).apply {
                action = "DISMISS_ALERT"
                putExtra("pet_id", petId)
                putExtra("alert_id", alertId)
            }
            
            context.startService(intent)
            Log.d(TAG, "Dismissed alert: $alertId for pet: $petId")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to dismiss alert", e)
        }
    }

    private fun snoozeHealthReminder(context: Context, petId: String?, alertId: String?) {
        if (petId == null || alertId == null) return
        
        try {
            // Send intent to pet monitoring service
            val intent = Intent(context, PetMonitoringService::class.java).apply {
                action = "SNOOZE_REMINDER"
                putExtra("pet_id", petId)
                putExtra("alert_id", alertId)
                putExtra("snooze_duration", 3600000L) // 1 hour in milliseconds
            }
            
            context.startService(intent)
            Log.d(TAG, "Snoozed reminder: $alertId for pet: $petId")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to snooze reminder", e)
        }
    }

    private fun markNotificationAsRead(context: Context, notificationId: Int, petId: String?, alertType: String?) {
        try {
            // Update notification status in database or send to server
            Log.d(TAG, "Marked notification as read: $notificationId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to mark notification as read", e)
        }
    }

    private fun markNotificationAsDismissed(context: Context, notificationId: Int, petId: String?, alertType: String?) {
        try {
            // Update notification status in database or send to server
            Log.d(TAG, "Marked notification as dismissed: $notificationId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to mark notification as dismissed", e)
        }
    }

    private fun showConfirmationNotification(context: Context, message: String) {
        try {
            NotificationUtils.showSimpleNotification(
                context,
                "TailTracker",
                message,
                android.R.drawable.ic_dialog_info
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show confirmation notification", e)
        }
    }
}