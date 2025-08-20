import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from 'react-native-paper';
import { Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import { AuthNavigator } from './AuthNavigator';
import { HomeScreen } from '@/screens/HomeScreen';
import { PetsScreen } from '@/screens/PetsScreen';
import { MapScreen } from '@/screens/MapScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { PetDetailScreen } from '@/screens/PetDetailScreen';
import { AddPetScreen } from '@/screens/AddPetScreen';
import { LocationHistoryScreen } from '@/screens/LocationHistoryScreen';
import { SubscriptionScreen } from '@/screens/SubscriptionScreen';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PetDetail: { petId: string };
  AddPet: undefined;
  LocationHistory: { petId: string };
  Subscription: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Pets: undefined;
  Map: undefined;
  Profile: undefined;
};

export type DrawerParamList = {
  Main: undefined;
  Settings: undefined;
  Notifications: undefined;
  Subscription: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// Bottom Tab Navigator
const MainTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Pets':
              iconName = focused ? 'paw' : 'paw-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: Platform.OS === 'android' ? 65 : 85,
          paddingBottom: Platform.OS === 'android' ? 8 : 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Pets" 
        component={PetsScreen}
        options={{
          title: 'My Pets',
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          title: 'Location',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Drawer Navigator
const DrawerNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurfaceVariant,
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        drawerItemStyle: {
          marginVertical: 2,
          borderRadius: theme.roundness,
        },
        drawerActiveBackgroundColor: theme.colors.primaryContainer,
        headerStyle: {
          backgroundColor: theme.colors.primary,
          elevation: 4,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen 
        name="Main" 
        component={MainTabNavigator}
        options={{
          title: 'TailTracker',
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Icon name="bell" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{
          title: 'Premium Features',
          drawerIcon: ({ color, size }) => (
            <Icon name="crown" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// Root Stack Navigator
const RootNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
          elevation: 4,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
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
        name="Auth" 
        component={AuthNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Main" 
        component={DrawerNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PetDetail" 
        component={PetDetailScreen}
        options={{
          title: 'Pet Details',
          headerRight: ({ tintColor }) => (
            <Icon
              name="dots-vertical"
              size={24}
              color={tintColor}
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Stack.Screen 
        name="AddPet" 
        component={AddPetScreen}
        options={{
          title: 'Add New Pet',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="LocationHistory" 
        component={LocationHistoryScreen}
        options={{
          title: 'Location History',
        }}
      />
      <Stack.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{
          title: 'Premium Features',
          headerRight: ({ tintColor }) => (
            <Icon
              name="crown"
              size={24}
              color={tintColor}
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          headerRight: ({ tintColor }) => (
            <Icon
              name="bell-settings"
              size={24}
              color={tintColor}
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

// App Navigator with Navigation Container
export const AppNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: theme.dark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.onSurface,
          border: theme.colors.outline,
          notification: theme.colors.error,
        },
      }}
    >
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent={false}
      />
      <RootNavigator />
    </NavigationContainer>
  );
};