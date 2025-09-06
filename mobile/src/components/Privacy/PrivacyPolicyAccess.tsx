import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface PrivacyPolicyAccessProps {
  style?: any;
  showAsLink?: boolean;
  showAsButton?: boolean;
  children?: React.ReactNode;
  navigation?: any;
}

export const PrivacyPolicyAccess: React.FC<PrivacyPolicyAccessProps> = ({
  style,
  showAsLink = false,
  showAsButton = false,
  children,
  navigation: propNavigation
}) => {
  const navigationHook = useNavigation();
  const navigation = propNavigation || navigationHook;
  const openPrivacyPolicy = () => {
    try {
      navigation.navigate('PrivacyPolicyScreen');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: could show an alert or handle gracefully
    }
  };

  if (showAsButton) {
    return (
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={openPrivacyPolicy}
        accessibilityRole="button"
        accessibilityLabel="View Privacy Policy"
        accessibilityHint="Opens the TailTracker Privacy Policy in your web browser"
      >
        <Text style={styles.buttonText}>
          {children || 'Privacy Policy'}
        </Text>
      </TouchableOpacity>
    );
  }

  if (showAsLink) {
    return (
      <TouchableOpacity
        onPress={openPrivacyPolicy}
        style={[styles.link, style]}
        accessibilityRole="link"
        accessibilityLabel="Privacy Policy link"
        accessibilityHint="Opens the Privacy Policy in your web browser"
      >
        <Text style={styles.linkText}>
          {children || 'Privacy Policy'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.description}>
        Your privacy is important to us. Learn how we collect, use, and protect your data.
      </Text>
      <TouchableOpacity
        onPress={openPrivacyPolicy}
        style={styles.accessButton}
        accessibilityRole="button"
        accessibilityLabel="View Privacy Policy"
        accessibilityHint="Opens the complete Privacy Policy document in your web browser"
      >
        <Text style={styles.accessButtonText}>View Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    margin: 8,
  },
  description: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Accessibility minimum touch target
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    padding: 8,
    minHeight: 44, // Accessibility minimum touch target
    justifyContent: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  accessButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    minHeight: 44,
  },
  accessButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default PrivacyPolicyAccess;