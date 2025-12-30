import React from 'react';
import { useRouter } from 'expo-router';

/**
 * Appointments Route
 * Redirects to the schedule feature
 */
export default function AppointmentsRoute() {
  const router = useRouter();

  // Redirect to the schedule screen
  React.useEffect(() => {
    router.replace('/features/schedule' as any);
  }, []);

  return null;
}
