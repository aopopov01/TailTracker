package com.tailtracker.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.os.Bundle
import android.util.Log
import android.widget.RemoteViews
import com.tailtracker.app.MainActivity
import com.tailtracker.app.R
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * TailTracker Pet Status Widget
 * Shows quick status of pets including location, health, and activity
 */
class PetStatusWidget : AppWidgetProvider() {

    companion object {
        private const val TAG = "PetStatusWidget"
        private const val WIDGET_PREFS = "pet_widget_prefs"
        private const val WIDGET_DATA_KEY = "widget_data"
        private const val ACTION_WIDGET_UPDATE = "com.tailtracker.widget.UPDATE"
        private const val ACTION_PET_SELECTED = "com.tailtracker.widget.PET_SELECTED"
        private const val ACTION_EMERGENCY = "com.tailtracker.widget.EMERGENCY"
        private const val EXTRA_PET_ID = "pet_id"
        private const val EXTRA_WIDGET_ID = "widget_id"
        
        // Widget update intervals
        private const val UPDATE_INTERVAL_MS = 15 * 60 * 1000L // 15 minutes
        
        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val widgetProvider = PetStatusWidget()
            widgetProvider.updateAppWidget(context, appWidgetManager, appWidgetId)
        }
        
        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widgetProvider = PetStatusWidget()
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, PetStatusWidget::class.java)
            )
            widgetProvider.onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        Log.d(TAG, "onUpdate called for ${appWidgetIds.size} widgets")
        
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
        
        super.onUpdate(context, appWidgetManager, appWidgetIds)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        Log.d(TAG, "onReceive: ${intent.action}")
        
        when (intent.action) {
            ACTION_WIDGET_UPDATE -> {
                handleWidgetUpdate(context, intent)
            }
            ACTION_PET_SELECTED -> {
                handlePetSelected(context, intent)
            }
            ACTION_EMERGENCY -> {
                handleEmergency(context, intent)
            }
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        Log.d(TAG, "onDeleted: ${appWidgetIds.contentToString()}")
        super.onDeleted(context, appWidgetIds)
    }

    override fun onEnabled(context: Context) {
        Log.d(TAG, "onEnabled")
        super.onEnabled(context)
    }

    override fun onDisabled(context: Context) {
        Log.d(TAG, "onDisabled")
        super.onDisabled(context)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle
    ) {
        Log.d(TAG, "onAppWidgetOptionsChanged for widget $appWidgetId")
        updateAppWidget(context, appWidgetManager, appWidgetId)
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        try {
            Log.d(TAG, "Updating widget $appWidgetId")
            
            // Get widget data
            val widgetData = getWidgetData(context, appWidgetId)
            
            // Create remote views
            val views = RemoteViews(context.packageName, getWidgetLayout(context, appWidgetId))
            
            if (widgetData != null && widgetData.has("pets")) {
                setupWidgetWithData(context, views, widgetData, appWidgetId)
            } else {
                setupEmptyWidget(context, views, appWidgetId)
            }
            
            // Update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error updating widget $appWidgetId", e)
            setupErrorWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun getWidgetLayout(context: Context, appWidgetId: Int): Int {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
        
        val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
        val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)
        
        // Determine layout based on size
        return when {
            minWidth >= 250 && minHeight >= 120 -> R.layout.widget_pet_status_large
            minWidth >= 180 -> R.layout.widget_pet_status_medium
            else -> R.layout.widget_pet_status_small
        }
    }

    private fun setupWidgetWithData(
        context: Context,
        views: RemoteViews,
        data: JSONObject,
        appWidgetId: Int
    ) {
        try {
            val pets = data.getJSONArray("pets")
            val selectedPetId = data.optString("selectedPetId", "")
            
            if (pets.length() > 0) {
                // Find selected pet or use first pet
                var selectedPet: JSONObject? = null
                for (i in 0 until pets.length()) {
                    val pet = pets.getJSONObject(i)
                    if (pet.getString("id") == selectedPetId || selectedPet == null) {
                        selectedPet = pet
                        if (pet.getString("id") == selectedPetId) break
                    }
                }
                
                selectedPet?.let { pet ->
                    setupPetData(context, views, pet, appWidgetId)
                }
                
                // Setup pet selector if multiple pets
                if (pets.length() > 1) {
                    setupPetSelector(context, views, pets, selectedPetId, appWidgetId)
                }
            } else {
                setupEmptyWidget(context, views, appWidgetId)
            }
            
            // Setup common actions
            setupWidgetActions(context, views, appWidgetId)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error setting up widget with data", e)
            setupEmptyWidget(context, views, appWidgetId)
        }
    }

    private fun setupPetData(
        context: Context,
        views: RemoteViews,
        pet: JSONObject,
        appWidgetId: Int
    ) {
        try {
            // Pet name
            val petName = pet.optString("name", "Unknown Pet")
            views.setTextViewText(R.id.widget_pet_name, petName)
            
            // Pet image
            val imageUrl = pet.optString("imageUrl", "")
            if (imageUrl.isNotEmpty()) {
                loadPetImage(context, views, imageUrl)
            } else {
                views.setImageViewResource(R.id.widget_pet_image, R.drawable.ic_pet_placeholder)
            }
            
            // Location status
            val location = pet.optJSONObject("location")
            if (location != null) {
                val isInSafeZone = location.optBoolean("isInSafeZone", true)
                val lastSeen = location.optLong("lastSeen", 0)
                
                if (isInSafeZone) {
                    views.setTextViewText(R.id.widget_location_status, "Safe Zone")
                    views.setTextColor(R.id.widget_location_status, context.getColor(R.color.status_safe))
                    views.setImageViewResource(R.id.widget_location_icon, R.drawable.ic_location_safe)
                } else {
                    views.setTextViewText(R.id.widget_location_status, "Outside Safe Zone")
                    views.setTextColor(R.id.widget_location_status, context.getColor(R.color.status_warning))
                    views.setImageViewResource(R.id.widget_location_icon, R.drawable.ic_location_warning)
                }
                
                // Last seen time
                if (lastSeen > 0) {
                    val lastSeenText = formatLastSeen(lastSeen)
                    views.setTextViewText(R.id.widget_last_seen, "Last seen: $lastSeenText")
                }
            }
            
            // Health status
            val health = pet.optJSONObject("health")
            if (health != null) {
                val healthScore = health.optInt("score", 100)
                val healthStatus = when {
                    healthScore >= 90 -> "Excellent"
                    healthScore >= 70 -> "Good"
                    healthScore >= 50 -> "Fair"
                    else -> "Needs Attention"
                }
                
                views.setTextViewText(R.id.widget_health_status, healthStatus)
                
                val healthColor = when {
                    healthScore >= 90 -> R.color.status_excellent
                    healthScore >= 70 -> R.color.status_good
                    healthScore >= 50 -> R.color.status_fair
                    else -> R.color.status_critical
                }
                views.setTextColor(R.id.widget_health_status, context.getColor(healthColor))
            }
            
            // Activity status
            val activity = pet.optJSONObject("activity")
            if (activity != null) {
                val activityLevel = activity.optString("level", "Normal")
                val stepsToday = activity.optInt("stepsToday", 0)
                
                views.setTextViewText(R.id.widget_activity_level, activityLevel)
                views.setTextViewText(R.id.widget_steps_today, "$stepsToday steps today")
            }
            
            // Setup click actions
            setupPetClickActions(context, views, pet.getString("id"), appWidgetId)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error setting up pet data", e)
        }
    }

    private fun setupEmptyWidget(context: Context, views: RemoteViews, appWidgetId: Int) {
        views.setTextViewText(R.id.widget_pet_name, "No Pets")
        views.setTextViewText(R.id.widget_location_status, "Add a pet in the app")
        views.setImageViewResource(R.id.widget_pet_image, R.drawable.ic_add_pet)
        
        // Setup click to open app
        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openAppPendingIntent = PendingIntent.getActivity(
            context, appWidgetId, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_container, openAppPendingIntent)
    }

    private fun setupErrorWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.widget_pet_status_small)
        views.setTextViewText(R.id.widget_pet_name, "Error")
        views.setTextViewText(R.id.widget_location_status, "Unable to load data")
        views.setImageViewResource(R.id.widget_pet_image, R.drawable.ic_error)
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun setupPetSelector(
        context: Context,
        views: RemoteViews,
        pets: JSONArray,
        selectedPetId: String,
        appWidgetId: Int
    ) {
        // Setup previous/next buttons for pet selection
        val prevIntent = createPetSelectionIntent(context, "prev", appWidgetId)
        val nextIntent = createPetSelectionIntent(context, "next", appWidgetId)
        
        views.setOnClickPendingIntent(R.id.widget_prev_pet, prevIntent)
        views.setOnClickPendingIntent(R.id.widget_next_pet, nextIntent)
        
        // Show pet count
        val currentIndex = findPetIndex(pets, selectedPetId)
        views.setTextViewText(R.id.widget_pet_count, "${currentIndex + 1} of ${pets.length()}")
    }

    private fun setupWidgetActions(context: Context, views: RemoteViews, appWidgetId: Int) {
        // Refresh button
        val refreshIntent = Intent(context, PetStatusWidget::class.java).apply {
            action = ACTION_WIDGET_UPDATE
            putExtra(EXTRA_WIDGET_ID, appWidgetId)
        }
        val refreshPendingIntent = PendingIntent.getBroadcast(
            context, appWidgetId, refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_refresh_button, refreshPendingIntent)
        
        // Emergency button
        val emergencyIntent = Intent(context, PetStatusWidget::class.java).apply {
            action = ACTION_EMERGENCY
            putExtra(EXTRA_WIDGET_ID, appWidgetId)
        }
        val emergencyPendingIntent = PendingIntent.getBroadcast(
            context, appWidgetId + 1000, emergencyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_emergency_button, emergencyPendingIntent)
    }

    private fun setupPetClickActions(
        context: Context,
        views: RemoteViews,
        petId: String,
        appWidgetId: Int
    ) {
        // Click on pet info to open pet details
        val petDetailsIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("openPetDetails", petId)
        }
        val petDetailsPendingIntent = PendingIntent.getActivity(
            context, appWidgetId + 2000, petDetailsIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_pet_info, petDetailsPendingIntent)
    }

    private fun createPetSelectionIntent(context: Context, action: String, appWidgetId: Int): PendingIntent {
        val intent = Intent(context, PetStatusWidget::class.java).apply {
            this.action = ACTION_PET_SELECTED
            putExtra("selectionAction", action)
            putExtra(EXTRA_WIDGET_ID, appWidgetId)
        }
        return PendingIntent.getBroadcast(
            context, appWidgetId + if (action == "prev") 3000 else 4000, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun handleWidgetUpdate(context: Context, intent: Intent) {
        val appWidgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun handlePetSelected(context: Context, intent: Intent) {
        val appWidgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        val selectionAction = intent.getStringExtra("selectionAction") ?: return
        
        if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            val widgetData = getWidgetData(context, appWidgetId)
            if (widgetData != null && widgetData.has("pets")) {
                val pets = widgetData.getJSONArray("pets")
                val selectedPetId = widgetData.optString("selectedPetId", "")
                val currentIndex = findPetIndex(pets, selectedPetId)
                
                val newIndex = when (selectionAction) {
                    "prev" -> if (currentIndex > 0) currentIndex - 1 else pets.length() - 1
                    "next" -> if (currentIndex < pets.length() - 1) currentIndex + 1 else 0
                    else -> currentIndex
                }
                
                if (newIndex < pets.length()) {
                    val newSelectedPet = pets.getJSONObject(newIndex)
                    widgetData.put("selectedPetId", newSelectedPet.getString("id"))
                    saveWidgetData(context, appWidgetId, widgetData)
                    
                    val appWidgetManager = AppWidgetManager.getInstance(context)
                    updateAppWidget(context, appWidgetManager, appWidgetId)
                }
            }
        }
    }

    private fun handleEmergency(context: Context, intent: Intent) {
        // Open app in emergency mode
        val emergencyIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("emergencyMode", true)
        }
        context.startActivity(emergencyIntent)
    }

    private fun getWidgetData(context: Context, appWidgetId: Int): JSONObject? {
        return try {
            val prefs = context.getSharedPreferences(WIDGET_PREFS, Context.MODE_PRIVATE)
            val dataJson = prefs.getString("${WIDGET_DATA_KEY}_$appWidgetId", null)
            if (dataJson != null) JSONObject(dataJson) else null
        } catch (e: Exception) {
            Log.e(TAG, "Error getting widget data", e)
            null
        }
    }

    private fun saveWidgetData(context: Context, appWidgetId: Int, data: JSONObject) {
        try {
            val prefs = context.getSharedPreferences(WIDGET_PREFS, Context.MODE_PRIVATE)
            prefs.edit()
                .putString("${WIDGET_DATA_KEY}_$appWidgetId", data.toString())
                .apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error saving widget data", e)
        }
    }

    private fun loadPetImage(context: Context, views: RemoteViews, imageUrl: String) {
        try {
            // In a real implementation, this would load the image asynchronously
            // For now, we'll use a placeholder
            views.setImageViewResource(R.id.widget_pet_image, R.drawable.ic_pet_placeholder)
        } catch (e: Exception) {
            Log.e(TAG, "Error loading pet image", e)
            views.setImageViewResource(R.id.widget_pet_image, R.drawable.ic_pet_placeholder)
        }
    }

    private fun formatLastSeen(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp
        
        return when {
            diff < 60 * 1000 -> "Just now"
            diff < 60 * 60 * 1000 -> "${diff / (60 * 1000)}m ago"
            diff < 24 * 60 * 60 * 1000 -> "${diff / (60 * 60 * 1000)}h ago"
            else -> {
                val format = SimpleDateFormat("MMM d", Locale.getDefault())
                format.format(Date(timestamp))
            }
        }
    }

    private fun findPetIndex(pets: JSONArray, petId: String): Int {
        for (i in 0 until pets.length()) {
            if (pets.getJSONObject(i).optString("id") == petId) {
                return i
            }
        }
        return 0
    }
}

/**
 * Widget configuration activity
 */
class PetStatusWidgetConfigActivity : android.app.Activity() {
    
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Set the result to CANCELED initially
        setResult(RESULT_CANCELED)
        
        // Get the widget ID from the intent
        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID
        
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }
        
        // For now, we'll just use default configuration and finish
        // In a real implementation, this would show a configuration UI
        configureWidget()
    }
    
    private fun configureWidget() {
        // Configure the widget with default settings
        val context = this
        val appWidgetManager = AppWidgetManager.getInstance(context)
        
        // Update the widget
        PetStatusWidget.updateWidget(context, appWidgetManager, appWidgetId)
        
        // Set the result
        val resultValue = Intent().apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        setResult(RESULT_OK, resultValue)
        finish()
    }
}