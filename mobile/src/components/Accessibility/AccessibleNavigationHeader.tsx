import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccessibleNavigationHeaderProps {
  title: string;
  leftButton?: {
    title: string;
    onPress: () => void;
    accessibilityLabel?: string;
    accessibilityHint?: string;
  };
  rightButton?: {
    title: string;
    onPress: () => void;
    accessibilityLabel?: string;
    accessibilityHint?: string;
  };
  backgroundColor?: string;
  titleColor?: string;
}

export const AccessibleNavigationHeader: React.FC<AccessibleNavigationHeaderProps> = ({
  title,
  leftButton,
  rightButton,
  backgroundColor = '#FFFFFF',
  titleColor = '#1C1C1E'
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      { backgroundColor, paddingTop: insets.top }
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      
      <View style={styles.header}>
        {/* Left Button */}
        <View style={styles.leftContainer}>
          {leftButton && (
            <TouchableOpacity
              style={styles.button}
              onPress={leftButton.onPress}
              accessibilityRole="button"
              accessibilityLabel={leftButton.accessibilityLabel || leftButton.title}
              accessibilityHint={leftButton.accessibilityHint}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.buttonText}>{leftButton.title}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: titleColor }]}
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
        </View>

        {/* Right Button */}
        <View style={styles.rightContainer}>
          {rightButton && (
            <TouchableOpacity
              style={styles.button}
              onPress={rightButton.onPress}
              accessibilityRole="button"
              accessibilityLabel={rightButton.accessibilityLabel || rightButton.title}
              accessibilityHint={rightButton.accessibilityHint}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.buttonText}>{rightButton.title}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C7C7CC',
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    color: '#007AFF',
  },
});

export default AccessibleNavigationHeader;