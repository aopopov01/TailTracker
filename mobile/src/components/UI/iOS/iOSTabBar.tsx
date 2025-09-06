import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export interface TabItem {
  key: string;
  title: string;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: string | number;
}

interface iOSTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  style?: any;
  hapticFeedback?: boolean;
  blurred?: boolean;
}

export const IOSTabBar: React.FC<iOSTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  style,
  hapticFeedback = true,
  blurred = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleTabPress = async (tabKey: string) => {
    if (tabKey === activeTab) return;

    if (hapticFeedback && Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onTabPress(tabKey);
  };

  const getTabBarStyle = () => {
    const baseStyle = {
      height: 83, // Standard iOS tab bar height with safe area
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? '#3A3A3C' : '#C6C6C8',
    };

    if (!blurred) {
      return {
        ...baseStyle,
        backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
      };
    }

    return baseStyle;
  };

  const getTabContentStyle = () => {
    return {
      flexDirection: 'row' as const,
      paddingTop: 6,
      paddingBottom: Platform.OS === 'ios' ? 20 : 6, // Account for home indicator
      paddingHorizontal: 8,
      justifyContent: 'space-around' as const,
    };
  };

  const getTabItemStyle = (isActive: boolean) => {
    return {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 8,
      paddingHorizontal: 4,
    };
  };

  const getTabTextStyle = (isActive: boolean) => {
    return {
      fontSize: 10,
      fontWeight: '500' as const,
      marginTop: 2,
      color: isActive 
        ? '#007AFF' 
        : isDark 
          ? '#8E8E93' 
          : '#8E8E93',
    };
  };

  const TabContent = () => (
    <View style={getTabContentStyle()}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const displayIcon = isActive && tab.activeIcon ? tab.activeIcon : tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            style={getTabItemStyle(isActive)}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              {displayIcon}
              {tab.badge && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {typeof tab.badge === 'number' && tab.badge > 99 
                      ? '99+' 
                      : tab.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={getTabTextStyle(isActive)}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (blurred && Platform.OS === 'ios') {
    return (
      <View style={[getTabBarStyle(), style]}>
        <BlurView
          intensity={100}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={{ flex: 1 }}>
          <TabContent />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[getTabBarStyle(), style]}>
      <TabContent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});