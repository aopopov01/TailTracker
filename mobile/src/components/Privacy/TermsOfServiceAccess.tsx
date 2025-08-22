import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface TermsOfServiceAccessProps {
  style?: any;
  showAsLink?: boolean;
  showAsButton?: boolean;
  children?: React.ReactNode;
  navigation?: any;
}

export const TermsOfServiceAccess: React.FC<TermsOfServiceAccessProps> = ({
  style,
  showAsLink = false,
  showAsButton = false,
  children,
  navigation: propNavigation
}) => {
  const navigationHook = useNavigation();
  const navigation = propNavigation || navigationHook;

  const openTermsOfService = () => {
    try {
      navigation.navigate('TermsOfServiceScreen');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: could show an alert or handle gracefully
    }
  };

  if (showAsButton) {
    return (
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={openTermsOfService}
        accessibilityRole="button"
        accessibilityLabel="View Terms of Service"
        accessibilityHint="Opens the TailTracker Terms of Service screen"
      >
        <Text style={styles.buttonText}>
          {children || 'Terms of Service'}
        </Text>
      </TouchableOpacity>
    );
  }

  if (showAsLink) {
    return (
      <TouchableOpacity
        onPress={openTermsOfService}
        style={[styles.link, style]}
        accessibilityRole="link"
        accessibilityLabel="Terms of Service link"
        accessibilityHint="Opens the Terms of Service screen"
      >
        <Text style={styles.linkText}>
          {children || 'Terms of Service'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.description}>
        Please review our Terms of Service to understand your rights and responsibilities.
      </Text>
      <TouchableOpacity
        onPress={openTermsOfService}
        style={styles.accessButton}
        accessibilityRole="button"
        accessibilityLabel="View Terms of Service"
        accessibilityHint="Opens the complete Terms of Service document"
      >
        <Text style={styles.accessButtonText}>View Terms of Service</Text>
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

export default TermsOfServiceAccess;