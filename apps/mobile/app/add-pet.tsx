import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { PetOnboardingWizard } from '../src/components/PetOnboarding/PetOnboardingWizard';

export default function AddPetRoute() {
  const router = useRouter();

  const handleComplete = () => {
    // Navigate to dashboard after successful pet creation
    router.push('/(tabs)/dashboard' as any);
  };

  const handleCancel = () => {
    // Navigate back to previous screen
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' />
      <PetOnboardingWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
