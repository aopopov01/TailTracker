import { Stack } from 'expo-router';

export default function SharingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='shared-pets' />
      <Stack.Screen name='pet-detail/[id]' />
    </Stack>
  );
}
