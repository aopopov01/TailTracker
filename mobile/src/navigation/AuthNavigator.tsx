import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

// Import auth screens
import { ForgotPasswordScreen } from '@/components/Auth/ForgotPasswordScreen';
import { LoginScreen } from '@/components/Auth/LoginScreen';
import { OnboardingScreen } from '@/components/Auth/OnboardingScreen';
import { RegisterScreen } from '@/components/Auth/RegisterScreen';
import { WelcomeScreen } from '@/components/Auth/WelcomeScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '600',
        },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Login" 
        options={{
          title: 'Sign In',
          headerStyle: {
            backgroundColor: theme.colors.surface,
            elevation: 1,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          },
        }}
      >
        {({ navigation }) => (
          <LoginScreen
            onNavigateToRegister={() => navigation.navigate('Register')}
            onNavigateToForgotPassword={() => navigation.navigate('ForgotPassword')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen 
        name="Register" 
        component={(props: any) => (
          <RegisterScreen 
            {...props} 
            onNavigateToLogin={() => props.navigation.navigate('Login')}
          />
        )}
        options={{
          title: 'Create Account',
          headerStyle: {
            backgroundColor: theme.colors.surface,
            elevation: 1,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          },
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        options={{
          title: 'Reset Password',
          headerStyle: {
            backgroundColor: theme.colors.surface,
            elevation: 1,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          },
        }}
      >
        {({ navigation }) => (
          <ForgotPasswordScreen
            onNavigateBack={() => navigation.goBack()}
            onNavigateToLogin={() => navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};