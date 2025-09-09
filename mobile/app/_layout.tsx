import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { PetProfileProvider } from '../contexts/PetProfileContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';

// Deep link handler component
function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL when app is opened from a link
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('📱 App opened with initial URL:', initialUrl);
          handleDeepLink(initialUrl);
        }
      } catch (error) {
        console.error('Error handling initial URL:', error);
      }
    };

    // Handle URLs when app is already running
    const handleURLChange = (event: { url: string }) => {
      console.log('📱 Deep link received:', event.url);
      handleDeepLink(event.url);
    };

    const handleDeepLink = (url: string) => {
      if (url.includes('/auth/verify')) {
        console.log('🔗 Email verification link detected, navigating to verify screen');
        // Extract query parameters and navigate
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search || urlObj.hash?.replace('#', ''));
        
        // Build query string for the verification screen
        const queryString = params.toString();
        const verifyPath = queryString ? `/auth/verify?${queryString}` : '/auth/verify';
        
        console.log('🔗 Navigating to:', verifyPath);
        router.push(verifyPath as any);
      }
    };

    // Set up event listener for URL changes
    const subscription = Linking.addEventListener('url', handleURLChange);
    
    // Handle initial URL
    handleInitialURL();

    return () => {
      subscription?.remove();
    };
  }, [router]);

  return null; // This component doesn't render anything
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <SubscriptionProvider>
          <PetProfileProvider>
            <DeepLinkHandler />
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#2196F3',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen name="index" options={{ title: 'TailTracker' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
              <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
              <Stack.Screen name="auth/verify" options={{ title: 'Verify Email', headerShown: false }} />
              <Stack.Screen name="sharing" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="light" />
          </PetProfileProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});