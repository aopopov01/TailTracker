# 📍 Location Pin Setup Guide

## Overview
The TailTracker app includes a comprehensive lost pet alert system with location-based features. This guide will help you enable the location pin functionality for the lost pet feature.

## ✅ Current Status
- ✅ Dependencies installed (`expo-location`, `react-native-maps`)
- ✅ Location permissions configured in `app.json`
- ✅ Code implementation complete in `ReportLostPetScreen.tsx`
- ⚠️ **Needs Google Maps API key setup**

## 🗝️ Step 1: Get Google Maps API Key

### 1. Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Maps SDK for iOS**
   - **Maps SDK for Android** 
   - **Geocoding API**
   - **Places API** (optional, for address suggestions)

### 2. Create API Key
1. Go to "Credentials" section
2. Click "Create Credentials" → "API Key"
3. Copy the API key

### 3. Restrict API Key (Recommended)
1. Click on the created API key
2. Under "API restrictions", select "Restrict key"
3. Select the APIs you enabled above
4. Under "Application restrictions":
   - For iOS: Add your bundle identifier (`com.tailtracker.app`)
   - For Android: Add your package name (`com.tailtracker.app`) and SHA-1 certificate fingerprint

## 🔧 Step 2: Configure API Key

### Method 1: Environment Variable (Recommended)
1. Create `.env` file in project root:
```bash
cp .env.example .env
```

2. Add your API key to `.env`:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### Method 2: Direct Configuration in app.json
Add to your `app.json`:
```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_IOS_API_KEY"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_API_KEY"
        }
      }
    }
  }
}
```

## 🏗️ Step 3: Rebuild the App

After adding the API key, rebuild your app:

```bash
# Clear cache and rebuild
npx expo start --clear

# For development builds
npx expo prebuild --clean
```

## 📱 Step 4: Test Location Features

### Test Checklist:
1. **Permissions**: App requests location permission
2. **Current Location**: "Use Current Location" button works
3. **Map Interaction**: Tap on map to set location
4. **Address Resolution**: Selected location shows readable address
5. **Marker Display**: Pin appears at selected location with correct color
6. **Accessibility**: Screen reader alternatives work

### Testing Commands:
```bash
# Start development server
npm start

# Test on iOS simulator
npm run ios

# Test on Android emulator  
npm run android
```

## 🔍 Features Included

The location pin system includes:

### Visual Features:
- **Interactive Map**: Google Maps with tap-to-select
- **Location Marker**: Color-coded pins (red=high urgency, orange=medium, yellow=low)
- **Current Location**: GPS-based location detection
- **Address Display**: Automatic address resolution

### Accessibility Features:
- **Screen Reader Support**: Alternative input methods for visually impaired users
- **Voice Announcements**: Location selections announced via accessibility
- **Keyboard Navigation**: Alternative to map interaction
- **Manual Address Entry**: Text-based location input

### User Experience:
- **Three Location Methods**:
  1. Use current GPS location
  2. Tap on interactive map
  3. Enter address manually
- **Real-time Updates**: Live address resolution
- **Error Handling**: Graceful fallbacks for location failures

## 🚨 Alert System Integration

Once location is set, the lost pet alert:
1. **Sends notifications** to users within 5-15km radius
2. **Includes pet photo and description**
3. **Shows last seen location** on recipients' maps
4. **Enables contact** with pet owner
5. **Tracks alert status** until pet is found

## 🛠️ Troubleshooting

### Common Issues:

**Map not loading:**
- Check API key is correct
- Verify APIs are enabled in Google Cloud
- Check network connectivity

**Location permission denied:**
- Ensure permissions in `app.json` are correct
- Check device location services are enabled
- Test permission prompts in app

**Address not resolving:**
- Verify Geocoding API is enabled
- Check API key restrictions
- Test with different locations

**Build errors:**
- Run `npx expo prebuild --clean`
- Check for conflicting dependencies
- Verify Node.js version compatibility

### Debugging Commands:
```bash
# Check dependencies
npm list expo-location react-native-maps

# Clear cache
npx expo start --clear

# Check permissions
npx expo run:ios --device
npx expo run:android --device
```

## 📋 Next Steps

After setup is complete:

1. **Test thoroughly** on physical devices (GPS works poorly on simulators)
2. **Configure backend** for alert distribution system
3. **Set up push notifications** for location-based alerts
4. **Test accessibility features** with VoiceOver/TalkBack
5. **Implement analytics** to track feature usage

## 🎯 Production Considerations

Before releasing:

- **Rate Limiting**: Implement API key usage monitoring
- **Privacy**: Clear location data usage disclosure
- **Performance**: Optimize map rendering for older devices
- **Offline**: Handle offline scenarios gracefully
- **Battery**: Minimize location service impact

The location pin feature is now ready to use! 🎉