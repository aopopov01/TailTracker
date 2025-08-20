package com.tailtracker.app.services

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.*
import com.tailtracker.app.MainActivity
import com.tailtracker.app.R
import com.tailtracker.app.data.AlertType
import com.tailtracker.app.data.PetAlert
import com.tailtracker.app.data.PetStatus
import com.tailtracker.app.workers.HealthReminderWorker
import com.tailtracker.app.workers.LocationSyncWorker
import com.tailtracker.app.workers.BatteryCheckWorker
import kotlinx.coroutines.*
import java.util.concurrent.TimeUnit

class PetMonitoringService : Service() {

    companion object {
        private const val TAG = "PetMonitoringService"
        const val NOTIFICATION_ID = 1002
        
        // Actions
        const val ACTION_START_MONITORING = "start_monitoring"
        const val ACTION_STOP_MONITORING = "stop_monitoring"
        const val ACTION_CHECK_PETS = "check_pets"
        const val ACTION_SEND_ALERT = "send_alert"
        
        // Extras
        const val EXTRA_PET_ID = "pet_id"
        const val EXTRA_ALERT_TYPE = "alert_type"
        const val EXTRA_ALERT_MESSAGE = "alert_message"
        
        // Monitoring intervals
        private const val HEALTH_CHECK_INTERVAL = 1L // 1 hour
        private const val BATTERY_CHECK_INTERVAL = 6L // 6 hours
        private const val LOCATION_SYNC_INTERVAL = 15L // 15 minutes
    }

    private var serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isMonitoring = false
    
    private lateinit var workManager: WorkManager

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "PetMonitoringService created")
        
        workManager = WorkManager.getInstance(this)
        initializeMonitoring()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand: ${intent?.action}")
        
        when (intent?.action) {
            ACTION_START_MONITORING -> startMonitoring()
            ACTION_STOP_MONITORING -> stopMonitoring()
            ACTION_CHECK_PETS -> checkPetsHealth()
            ACTION_SEND_ALERT -> {
                val petId = intent.getStringExtra(EXTRA_PET_ID)
                val alertType = intent.getStringExtra(EXTRA_ALERT_TYPE)
                val message = intent.getStringExtra(EXTRA_ALERT_MESSAGE)
                if (petId != null && alertType != null && message != null) {
                    sendAlert(petId, alertType, message)
                }
            }
            else -> startMonitoring()
        }
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "PetMonitoringService destroyed")
        
        stopMonitoring()
        serviceScope.cancel()
    }

    private fun initializeMonitoring() {
        // Initialize any necessary components
        Log.d(TAG, "Initializing pet monitoring")
    }

    private fun startMonitoring() {
        if (isMonitoring) {
            Log.d(TAG, "Already monitoring pets")
            return
        }
        
        isMonitoring = true
        Log.d(TAG, "Starting pet monitoring")
        
        // Start foreground service
        val notification = createMonitoringNotification()
        startForeground(NOTIFICATION_ID, notification)
        
        // Schedule periodic work
        schedulePeriodicWork()
        
        // Start monitoring loop
        serviceScope.launch {
            startMonitoringLoop()
        }
    }

    private fun stopMonitoring() {
        if (!isMonitoring) {
            Log.d(TAG, "Not currently monitoring")
            return
        }
        
        isMonitoring = false
        Log.d(TAG, "Stopping pet monitoring")
        
        // Cancel all work
        workManager.cancelAllWorkByTag("pet_monitoring")
        
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun schedulePeriodicWork() {
        // Health reminders work
        val healthReminderWork = PeriodicWorkRequestBuilder<HealthReminderWorker>(
            HEALTH_CHECK_INTERVAL, TimeUnit.HOURS
        )
            .addTag("pet_monitoring")
            .addTag("health_reminders")
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        // Battery check work
        val batteryCheckWork = PeriodicWorkRequestBuilder<BatteryCheckWorker>(
            BATTERY_CHECK_INTERVAL, TimeUnit.HOURS
        )
            .addTag("pet_monitoring")
            .addTag("battery_check")
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        // Location sync work
        val locationSyncWork = PeriodicWorkRequestBuilder<LocationSyncWorker>(
            LOCATION_SYNC_INTERVAL, TimeUnit.MINUTES
        )
            .addTag("pet_monitoring")
            .addTag("location_sync")
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        // Enqueue all work
        workManager.enqueueUniquePeriodicWork(
            "health_reminders",
            ExistingPeriodicWorkPolicy.REPLACE,
            healthReminderWork
        )

        workManager.enqueueUniquePeriodicWork(
            "battery_check",
            ExistingPeriodicWorkPolicy.REPLACE,
            batteryCheckWork
        )

        workManager.enqueueUniquePeriodicWork(
            "location_sync",
            ExistingPeriodicWorkPolicy.REPLACE,
            locationSyncWork
        )

        Log.d(TAG, "Scheduled periodic work for pet monitoring")
    }

    private suspend fun startMonitoringLoop() {
        while (isMonitoring) {
            try {
                // Perform monitoring checks
                checkPetsStatus()
                checkDeviceConnectivity()
                checkGeofenceViolations()
                checkActivityPatterns()
                
                // Wait for next check
                delay(300000) // 5 minutes
                
            } catch (e: Exception) {
                Log.e(TAG, "Error in monitoring loop", e)
                delay(60000) // 1 minute retry delay
            }
        }
    }

    private suspend fun checkPetsStatus() {
        Log.d(TAG, "Checking pets status")
        
        try {
            // Get all pets from database
            val pets = getPetsFromDatabase()
            
            for (pet in pets) {
                val status = checkPetStatus(pet.id)
                
                when (status) {
                    PetStatus.SAFE -> {
                        // Pet is safe, no action needed
                    }
                    PetStatus.ALERT -> {
                        sendAlert(pet.id, AlertType.SAFETY_ALERT.name, "Pet may be in danger")
                    }
                    PetStatus.OUT_OF_BOUNDS -> {
                        sendAlert(pet.id, AlertType.GEOFENCE_EXIT.name, "Pet left safe zone")
                    }
                    PetStatus.LOW_BATTERY -> {
                        sendAlert(pet.id, AlertType.LOW_BATTERY.name, "Pet tracker battery is low")
                    }
                    PetStatus.OFFLINE -> {
                        sendAlert(pet.id, AlertType.DEVICE_OFFLINE.name, "Pet tracker is offline")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check pets status", e)
        }
    }

    private suspend fun checkDeviceConnectivity() {
        // Check if pet tracking devices are online
        Log.d(TAG, "Checking device connectivity")
        
        try {
            val devices = getTrackedDevices()
            
            for (device in devices) {
                if (!isDeviceOnline(device.id)) {
                    sendAlert(
                        device.petId, 
                        AlertType.DEVICE_OFFLINE.name, 
                        "Tracker ${device.name} is offline"
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check device connectivity", e)
        }
    }

    private suspend fun checkGeofenceViolations() {
        // Check for geofence violations
        Log.d(TAG, "Checking geofence violations")
        
        try {
            val violations = getGeofenceViolations()
            
            for (violation in violations) {
                sendAlert(
                    violation.petId,
                    AlertType.GEOFENCE_EXIT.name,
                    "Pet exited ${violation.zoneName}"
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check geofence violations", e)
        }
    }

    private suspend fun checkActivityPatterns() {
        // Check for unusual activity patterns
        Log.d(TAG, "Checking activity patterns")
        
        try {
            val pets = getPetsFromDatabase()
            
            for (pet in pets) {
                val activityData = getRecentActivity(pet.id)
                
                if (isActivityUnusual(activityData)) {
                    sendAlert(
                        pet.id,
                        AlertType.UNUSUAL_ACTIVITY.name,
                        "Unusual activity pattern detected for ${pet.name}"
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check activity patterns", e)
        }
    }

    private fun checkPetsHealth() {
        serviceScope.launch {
            try {
                Log.d(TAG, "Performing health check")
                
                val pets = getPetsFromDatabase()
                
                for (pet in pets) {
                    // Check health reminders
                    val reminders = getPendingHealthReminders(pet.id)
                    
                    for (reminder in reminders) {
                        sendHealthReminderNotification(pet, reminder)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to check pets health", e)
            }
        }
    }

    private fun sendAlert(petId: String, alertType: String, message: String) {
        serviceScope.launch {
            try {
                Log.d(TAG, "Sending alert - Pet: $petId, Type: $alertType, Message: $message")
                
                // Create alert record
                val alert = PetAlert(
                    petId = petId,
                    type = AlertType.valueOf(alertType),
                    message = message,
                    timestamp = System.currentTimeMillis(),
                    severity = determineSeverity(alertType)
                )
                
                // Save to database
                saveAlertToDatabase(alert)
                
                // Send push notification
                sendPushNotification(alert)
                
                // Send to server
                sendAlertToServer(alert)
                
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send alert", e)
            }
        }
    }

    private fun createMonitoringNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, PetMonitoringService::class.java).apply {
            action = ACTION_STOP_MONITORING
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, LocationBackgroundService.CHANNEL_ID)
            .setContentTitle("Monitoring your pets")
            .setContentText("TailTracker is keeping your pets safe")
            .setSmallIcon(R.drawable.ic_pet_monitoring)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(
                R.drawable.ic_stop,
                "Stop Monitoring",
                stopPendingIntent
            )
            .setColor(getColor(R.color.primary))
            .build()
    }

    private fun sendPushNotification(alert: PetAlert) {
        // Implementation for sending push notification
        Log.d(TAG, "Sending push notification for alert: ${alert.id}")
    }

    private suspend fun sendAlertToServer(alert: PetAlert) {
        // Implementation for sending alert to server
        Log.d(TAG, "Sending alert to server: ${alert.id}")
    }

    private suspend fun saveAlertToDatabase(alert: PetAlert) {
        // Implementation for saving alert to local database
        Log.d(TAG, "Saving alert to database: ${alert.id}")
    }

    private fun sendHealthReminderNotification(pet: Pet, reminder: HealthReminder) {
        // Implementation for sending health reminder notification
        Log.d(TAG, "Sending health reminder for pet: ${pet.id}")
    }

    private fun determineSeverity(alertType: String): String {
        return when (AlertType.valueOf(alertType)) {
            AlertType.SAFETY_ALERT -> "high"
            AlertType.GEOFENCE_EXIT -> "high"
            AlertType.DEVICE_OFFLINE -> "medium"
            AlertType.LOW_BATTERY -> "low"
            AlertType.HEALTH_REMINDER -> "low"
            AlertType.UNUSUAL_ACTIVITY -> "medium"
        }
    }

    // Mock data functions - replace with actual implementations
    private suspend fun getPetsFromDatabase(): List<Pet> {
        // Implementation to get pets from database
        return emptyList()
    }

    private suspend fun checkPetStatus(petId: String): PetStatus {
        // Implementation to check pet status
        return PetStatus.SAFE
    }

    private suspend fun getTrackedDevices(): List<TrackedDevice> {
        // Implementation to get tracked devices
        return emptyList()
    }

    private suspend fun isDeviceOnline(deviceId: String): Boolean {
        // Implementation to check if device is online
        return true
    }

    private suspend fun getGeofenceViolations(): List<GeofenceViolation> {
        // Implementation to get geofence violations
        return emptyList()
    }

    private suspend fun getRecentActivity(petId: String): ActivityData {
        // Implementation to get recent activity data
        return ActivityData()
    }

    private fun isActivityUnusual(activityData: ActivityData): Boolean {
        // Implementation to analyze activity patterns
        return false
    }

    private suspend fun getPendingHealthReminders(petId: String): List<HealthReminder> {
        // Implementation to get pending health reminders
        return emptyList()
    }
}

// Data classes
data class Pet(
    val id: String,
    val name: String,
    val type: String
)

data class TrackedDevice(
    val id: String,
    val petId: String,
    val name: String
)

data class GeofenceViolation(
    val petId: String,
    val zoneName: String
)

data class ActivityData(
    val steps: Int = 0,
    val distance: Float = 0f,
    val activeTime: Long = 0L
)

data class HealthReminder(
    val id: String,
    val petId: String,
    val title: String,
    val message: String,
    val dueDate: Long
)