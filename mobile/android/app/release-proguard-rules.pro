# Release-specific ProGuard rules for TailTracker
# These rules are applied only to release builds for maximum optimization

# Enable aggressive optimization
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclassmembers
-dontpreverify
-verbose

# Optimization options
-optimizations !code/simplification/cast,!field/*,!class/merging/*,!code/allocation/variable

# Keep React Native core classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.flipper.** { *; }

# Keep TailTracker app classes
-keep class com.tailtracker.app.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelable classes
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Keep Serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep annotations
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Google Play Billing
-keep class com.android.billingclient.** { *; }
-keepclassmembers class com.android.billingclient.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**

# OkHttp and networking
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Retrofit
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# Gson
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Room Database
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-keep @androidx.room.Dao class *
-keepclassmembers class * {
    @androidx.room.* <methods>;
}

# Work Manager
-keep class * extends androidx.work.Worker
-keep class * extends androidx.work.InputMerger
-keep class androidx.work.impl.WorkManagerInitializer

# Material Components
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**

# AndroidX
-keep class androidx.** { *; }
-dontwarn androidx.**

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**

# Remove logging for release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
    public static int e(...);
}

# Remove debug-only classes
-assumenosideeffects class com.facebook.flipper.** { *; }
-assumenosideeffects class com.facebook.react.devsupport.** { *; }

# Crashlytics
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# Custom obfuscation dictionary
-obfuscationdictionary dictionary.txt
-classobfuscationdictionary dictionary.txt
-packageobfuscationdictionary dictionary.txt

# Keep BuildConfig
-keep class **.BuildConfig { *; }

# Keep R class
-keep class **.R$* { *; }

# Additional optimization for React Native
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.common.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Paper
-keep class com.callstack.react.paper.** { *; }

# React Native Maps
-keep class com.airbnb.android.react.maps.** { *; }
-keep class com.google.android.gms.maps.** { *; }

# Supabase/PostgreSQL
-keep class org.postgresql.** { *; }
-dontwarn org.postgresql.**

# Image loading libraries
-keep class com.bumptech.glide.** { *; }
-keep class com.facebook.fresco.** { *; }

# Date/Time libraries
-keep class org.joda.time.** { *; }
-dontwarn org.joda.time.**

# Analytics
-keep class com.google.android.gms.analytics.** { *; }
-keep class com.google.firebase.analytics.** { *; }

# Push notifications
-keep class com.google.firebase.messaging.** { *; }

# Location services
-keep class com.google.android.gms.location.** { *; }

# Performance monitoring
-keep class com.google.firebase.perf.** { *; }

# Remote config
-keep class com.google.firebase.remoteconfig.** { *; }

# Dynamic feature modules
-keep class com.google.android.play.core.** { *; }

# App startup
-keep class androidx.startup.** { *; }

# Data binding
-dontwarn android.databinding.**
-keep class android.databinding.** { *; }

# View binding
-keep class * extends androidx.viewbinding.ViewBinding { *; }