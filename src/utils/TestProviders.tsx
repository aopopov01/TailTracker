/**
 * Test Providers
 * Wraps components with necessary context providers for testing
 */

import React, { ReactNode } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { PetProfileProvider } from '../contexts/PetProfileContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { DataSyncProvider } from '../contexts/DataSyncContext';
import { MaterialThemeProvider } from '../theme/MaterialThemeProvider';
import { HomeScreen } from '../screens/HomeScreen';
import PetProfileScreen from '../screens/Pet/PetProfileScreen';

const Stack = createNativeStackNavigator();

interface TestProvidersProps {
  children?: ReactNode;
  initialRouteName?: string;
}

/**
 * Provides all necessary context providers for component testing
 */
export const TestContextProviders: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <PaperProvider>
      <MaterialThemeProvider>
        <SubscriptionProvider>
          <DataSyncProvider>
            <PetProfileProvider>{children}</PetProfileProvider>
          </DataSyncProvider>
        </SubscriptionProvider>
      </MaterialThemeProvider>
    </PaperProvider>
  );
};

/**
 * Provides both context and navigation for integration testing
 */
export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  initialRouteName = 'Home',
}) => {
  return (
    <TestContextProviders>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRouteName}>
          <Stack.Screen name='Home' component={HomeScreen} />
          <Stack.Screen name='PetProfile' component={PetProfileScreen} />
          <Stack.Screen name='AddPet' component={() => <>{children}</>} />
        </Stack.Navigator>
      </NavigationContainer>
    </TestContextProviders>
  );
};

export default TestProviders;
