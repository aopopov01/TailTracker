package com.tailtracker.app.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.tailtracker.app.MainActivity
import com.tailtracker.app.R
import com.tailtracker.app.data.PetLocationData
import com.tailtracker.app.utils.LocationUtils
import kotlinx.coroutines.*

class LocationBackgroundService : Service() {

    companion object {
        private const val TAG = "LocationBgService"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "location_tracking"
        
        // Actions
        const val ACTION_START_TRACKING = "start_tracking"
        const val ACTION_STOP_TRACKING = "stop_tracking"
        const val ACTION_UPDATE_INTERVAL = "update_interval"
        
        // Extras
        const val EXTRA_PET_ID = "pet_id"
        const val EXTRA_INTERVAL = "interval"
        const val EXTRA_DISTANCE = "distance"
        
        // Default values
        private const val DEFAULT_UPDATE_INTERVAL = 30000L // 30 seconds
        private const val DEFAULT_FASTEST_INTERVAL = 15000L // 15 seconds
        private const val DEFAULT_DISTANCE_FILTER = 10f // 10 meters
    }

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var locationRequest: LocationRequest
    private var serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private var isTracking = false
    private var currentPetId: String? = null
    private var lastKnownLocation: Location? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
        
        createNotificationChannel()
        initializeLocationTracking()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand: ${intent?.action}")
        
        when (intent?.action) {
            ACTION_START_TRACKING -> {
                val petId = intent.getStringExtra(EXTRA_PET_ID)
                val interval = intent.getLongExtra(EXTRA_INTERVAL, DEFAULT_UPDATE_INTERVAL)
                val distance = intent.getFloatExtra(EXTRA_DISTANCE, DEFAULT_DISTANCE_FILTER)
                startLocationTracking(petId, interval, distance)
            }
            ACTION_STOP_TRACKING -> {
                stopLocationTracking()
            }
            ACTION_UPDATE_INTERVAL -> {
                val interval = intent.getLongExtra(EXTRA_INTERVAL, DEFAULT_UPDATE_INTERVAL)
                val distance = intent.getFloatExtra(EXTRA_DISTANCE, DEFAULT_DISTANCE_FILTER)
                updateTrackingSettings(interval, distance)
            }
            else -> {
                // Default behavior - start with default settings
                startLocationTracking(null, DEFAULT_UPDATE_INTERVAL, DEFAULT_DISTANCE_FILTER)
            }
        }
        
        return START_STICKY // Restart if killed by system
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")
        
        stopLocationTracking()
        serviceScope.cancel()
    }

    private fun initializeLocationTracking() {
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                super.onLocationResult(locationResult)
                
                locationResult.lastLocation?.let { location ->
                    handleLocationUpdate(location)
                }
            }
            
            override fun onLocationAvailability(locationAvailability: LocationAvailability) {
                super.onLocationAvailability(locationAvailability)
                Log.d(TAG, "Location availability: ${locationAvailability.isLocationAvailable}")
                
                if (!locationAvailability.isLocationAvailable) {
                    // Handle location unavailability
                    updateNotification("Location unavailable", "GPS signal lost")
                }
            }
        }
    }

    @Suppress("MissingPermission")
    private fun startLocationTracking(petId: String?, interval: Long, distance: Float) {
        if (isTracking) {
            Log.d(TAG, "Already tracking location")
            return
        }
        
        currentPetId = petId
        
        // Create location request
        locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, interval)
            .setMinUpdateIntervalMillis(DEFAULT_FASTEST_INTERVAL)
            .setMinUpdateDistanceMeters(distance)
            .setMaxUpdateDelayMillis(interval * 2)
            .setWaitForAccurateLocation(true)
            .build()
        
        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
            
            isTracking = true
            Log.d(TAG, "Started location tracking for pet: $petId")
            
            // Start foreground service
            val notification = createTrackingNotification("Tracking pet location", "GPS active")
            startForeground(NOTIFICATION_ID, notification)
            
            // Get last known location immediately
            getLastKnownLocation()
            
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission not granted", e)
            stopSelf()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start location tracking", e)
            stopSelf()
        }
    }

    private fun stopLocationTracking() {
        if (!isTracking) {
            Log.d(TAG, "Not currently tracking")
            return
        }
        
        fusedLocationClient.removeLocationUpdates(locationCallback)
        isTracking = false
        currentPetId = null
        lastKnownLocation = null
        
        Log.d(TAG, "Stopped location tracking")
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun updateTrackingSettings(interval: Long, distance: Float) {
        if (!isTracking) return
        
        try {
            // Remove current updates
            fusedLocationClient.removeLocationUpdates(locationCallback)
            
            // Update location request
            locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, interval)
                .setMinUpdateIntervalMillis(DEFAULT_FASTEST_INTERVAL)
                .setMinUpdateDistanceMeters(distance)
                .setMaxUpdateDelayMillis(interval * 2)
                .setWaitForAccurateLocation(true)
                .build()
            
            // Restart with new settings
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
            
            Log.d(TAG, "Updated tracking settings - interval: $interval, distance: $distance")
            
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission not granted", e)
            stopLocationTracking()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update tracking settings", e)
        }
    }

    @Suppress("MissingPermission")
    private fun getLastKnownLocation() {
        fusedLocationClient.lastLocation.addOnSuccessListener { location ->
            location?.let {
                handleLocationUpdate(it)
            }
        }
    }

    private fun handleLocationUpdate(location: Location) {
        lastKnownLocation = location
        
        Log.d(TAG, "Location update: ${location.latitude}, ${location.longitude} (accuracy: ${location.accuracy}m)")
        
        // Update notification with current location info
        val accuracy = LocationUtils.getAccuracyDescription(location.accuracy)
        updateNotification(
            "Pet location tracked", 
            "Last update: ${LocationUtils.formatTime(System.currentTimeMillis())} ($accuracy)"
        )
        
        // Process location update
        serviceScope.launch {
            processLocationUpdate(location)
        }
    }

    private suspend fun processLocationUpdate(location: Location) {
        try {
            val locationData = PetLocationData(
                petId = currentPetId ?: "unknown",
                latitude = location.latitude,
                longitude = location.longitude,
                accuracy = location.accuracy,
                altitude = if (location.hasAltitude()) location.altitude else null,
                speed = if (location.hasSpeed()) location.speed else null,
                bearing = if (location.hasBearing()) location.bearing else null,
                timestamp = location.time,
                provider = location.provider
            )
            
            // Save to local database
            saveLocationToDatabase(locationData)
            
            // Send to server (if online)
            sendLocationToServer(locationData)
            
            // Check geofences
            checkGeofences(locationData)
            
            // Check for alerts (battery, movement patterns, etc.)
            checkAlerts(locationData)
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to process location update", e)
        }
    }

    private suspend fun saveLocationToDatabase(locationData: PetLocationData) {
        // Implementation for saving to local Room database
        // This would use your LocationRepository or similar
        Log.d(TAG, "Saving location to database: ${locationData.petId}")
    }

    private suspend fun sendLocationToServer(locationData: PetLocationData) {
        // Implementation for sending to server
        // This would use your API service
        try {
            // Example API call
            Log.d(TAG, "Sending location to server: ${locationData.petId}")
            // apiService.updatePetLocation(locationData)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send location to server", e)
            // Queue for retry when network is available
        }
    }

    private suspend fun checkGeofences(locationData: PetLocationData) {
        // Implementation for geofence checking
        // This would check if pet entered/exited safe zones
        Log.d(TAG, "Checking geofences for: ${locationData.petId}")
    }

    private suspend fun checkAlerts(locationData: PetLocationData) {
        // Implementation for alert checking
        // This would check for unusual movement patterns, speed alerts, etc.
        Log.d(TAG, "Checking alerts for: ${locationData.petId}")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Pet Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Ongoing pet location tracking"
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createTrackingNotification(title: String, content: String): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, LocationBackgroundService::class.java).apply {
            action = ACTION_STOP_TRACKING
        }
        
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_location)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(
                R.drawable.ic_stop,
                "Stop Tracking",
                stopPendingIntent
            )
            .setColor(getColor(R.color.primary))
            .build()
    }

    private fun updateNotification(title: String, content: String) {
        val notification = createTrackingNotification(title, content)
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
}

// Data class for location data
data class PetLocationData(
    val petId: String,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val altitude: Double? = null,
    val speed: Float? = null,
    val bearing: Float? = null,
    val timestamp: Long,
    val provider: String? = null
)