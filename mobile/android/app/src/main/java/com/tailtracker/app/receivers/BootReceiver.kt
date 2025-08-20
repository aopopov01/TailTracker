package com.tailtracker.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.tailtracker.app.services.LocationBackgroundService
import com.tailtracker.app.services.PetMonitoringService
import com.tailtracker.app.utils.PreferencesManager

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Boot completed, action: ${intent.action}")
        
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) {
            return
        }
        
        try {
            val preferencesManager = PreferencesManager(context)
            
            // Check if location tracking was enabled before shutdown
            if (preferencesManager.isLocationTrackingEnabled()) {
                restartLocationTracking(context, preferencesManager)
            }
            
            // Check if pet monitoring was enabled before shutdown
            if (preferencesManager.isPetMonitoringEnabled()) {
                restartPetMonitoring(context)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to restart services after boot", e)
        }
    }

    private fun restartLocationTracking(context: Context, preferencesManager: PreferencesManager) {
        try {
            Log.d(TAG, "Restarting location tracking service")
            
            val intent = Intent(context, LocationBackgroundService::class.java).apply {
                action = LocationBackgroundService.ACTION_START_TRACKING
                
                // Restore previous settings
                val lastTrackedPetId = preferencesManager.getLastTrackedPetId()
                val updateInterval = preferencesManager.getLocationUpdateInterval()
                val distanceFilter = preferencesManager.getLocationDistanceFilter()
                
                if (lastTrackedPetId != null) {
                    putExtra(LocationBackgroundService.EXTRA_PET_ID, lastTrackedPetId)
                }
                putExtra(LocationBackgroundService.EXTRA_INTERVAL, updateInterval)
                putExtra(LocationBackgroundService.EXTRA_DISTANCE, distanceFilter)
            }
            
            context.startForegroundService(intent)
            Log.d(TAG, "Location tracking service restarted")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to restart location tracking service", e)
        }
    }

    private fun restartPetMonitoring(context: Context) {
        try {
            Log.d(TAG, "Restarting pet monitoring service")
            
            val intent = Intent(context, PetMonitoringService::class.java).apply {
                action = PetMonitoringService.ACTION_START_MONITORING
            }
            
            context.startForegroundService(intent)
            Log.d(TAG, "Pet monitoring service restarted")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to restart pet monitoring service", e)
        }
    }
}