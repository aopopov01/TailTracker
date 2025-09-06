import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PetProfileProvider } from '../contexts/PetProfileContext';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <PetProfileProvider>
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
            <Stack.Screen name="sharing" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
        </PetProfileProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});