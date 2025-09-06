import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import { TailTrackerModal } from '../UI/TailTrackerModal';

interface DataConsentFlowProps {
  onConsentComplete: (consents: ConsentSettings) => void;
  onSkip?: () => void;
  initialConsents?: Partial<ConsentSettings>;
}

export interface ConsentSettings {
  essential: boolean;
  analytics: boolean;
  locationTracking: boolean;
  notifications: boolean;
  crashReporting: boolean;
  performanceMonitoring: boolean;
  marketing: boolean;
}

export const DataConsentFlow: React.FC<DataConsentFlowProps> = ({
  onConsentComplete,
  onSkip,
  initialConsents = {}
}) => {
  const { modalConfig, hideModal, showConfirm } = useTailTrackerModal();
  const [consents, setConsents] = useState<ConsentSettings>({
    essential: true, // Always required
    analytics: initialConsents.analytics ?? true,
    locationTracking: initialConsents.locationTracking ?? true,
    notifications: initialConsents.notifications ?? true,
    crashReporting: initialConsents.crashReporting ?? true,
    performanceMonitoring: initialConsents.performanceMonitoring ?? true,
    marketing: initialConsents.marketing ?? false,
  });

  const [currentStep, setCurrentStep] = useState(0);

  const consentItems = [
    {
      id: 'essential' as keyof ConsentSettings,
      title: 'Essential App Functions',
      description: 'Required for basic app functionality including account management, pet profiles, and core features.',
      required: true,
      details: `Essential data includes:
• Account information (email, name)
• Pet profile data (names, photos, basic info)
• App preferences and settings
• Basic security and authentication data

This data is necessary for the app to function and cannot be disabled.`,
      icon: 'shield-checkmark-outline'
    },
    {
      id: 'locationTracking' as keyof ConsentSettings,
      title: 'Location Tracking',
      description: 'Enables real-time pet tracking, safe zones, and location-based features.',
      required: false,
      details: `Location data includes:
• Real-time GPS coordinates for pet tracking
• Location history for tracking patterns
• Safe zone boundaries and alerts
• Background location for continuous monitoring

Location data is stored securely and is never shared for marketing purposes. You can disable this at any time, but core tracking features will not work.`,
      icon: 'location-outline'
    },
    {
      id: 'notifications' as keyof ConsentSettings,
      title: 'Push Notifications',
      description: 'Receive important alerts about your pets, health reminders, and safety notifications.',
      required: false,
      details: `Notifications include:
• Emergency pet alerts (lost pet, safe zone exits)
• Health reminders (vaccinations, medications)
• App updates and feature announcements
• Family sharing notifications

You can customize notification types in the app settings. Emergency safety notifications may still be sent even if general notifications are disabled.`,
      icon: 'notifications-outline'
    },
    {
      id: 'analytics' as keyof ConsentSettings,
      title: 'App Analytics',
      description: 'Help improve the app by sharing anonymous usage statistics and feature performance.',
      required: false,
      details: `Analytics data includes:
• Which features are used most often
• App performance metrics
• Anonymous user behavior patterns
• Feature effectiveness measurements

All analytics data is anonymized and aggregated. No personal information or pet data is included in analytics.`,
      icon: 'bar-chart-outline'
    },
    {
      id: 'crashReporting' as keyof ConsentSettings,
      title: 'Crash Reporting',
      description: 'Automatically report app crashes to help identify and fix technical issues.',
      required: false,
      details: `Crash reports include:
• Technical error information
• Device and OS details
• App version and configuration
• Anonymous crash patterns

Crash reports help us fix bugs and improve app stability. No personal or pet data is included in crash reports.`,
      icon: 'bug-outline'
    },
    {
      id: 'performanceMonitoring' as keyof ConsentSettings,
      title: 'Performance Monitoring',
      description: 'Monitor app performance to ensure fast, reliable operation across different devices.',
      required: false,
      details: `Performance data includes:
• App loading times and responsiveness
• Memory and battery usage patterns
• Network request performance
• Device-specific optimization data

Performance monitoring helps us optimize the app for better user experience on all devices.`,
      icon: 'speedometer-outline'
    },
    {
      id: 'marketing' as keyof ConsentSettings,
      title: 'Marketing Communications',
      description: 'Receive promotional emails about new features, pet care tips, and special offers.',
      required: false,
      details: `Marketing communications include:
• Feature announcements and updates
• Pet care tips and educational content
• Special promotional offers
• Newsletter and community updates

You can unsubscribe from marketing communications at any time. Essential service communications will still be sent.`,
      icon: 'mail-outline'
    }
  ];

  const currentItem = consentItems[currentStep];
  const isLastStep = currentStep === consentItems.length - 1;

  const handleToggle = (key: keyof ConsentSettings) => {
    if (key === 'essential') return; // Cannot disable essential
    
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNext = () => {
    if (isLastStep) {
      onConsentComplete(consents);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      showConfirm(
        'Skip Data Consent',
        'Are you sure you want to skip the consent setup? You can change these settings later in the app.',
        onSkip,
        'Skip',
        'Cancel',
        false
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Data Privacy</Text>
        {onSkip && (
          <TouchableOpacity 
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip data consent setup"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentStep + 1} of {consentItems.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / consentItems.length) * 100}%` }
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.itemContainer}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={currentItem.icon as any} 
              size={48} 
              color="#007AFF" 
            />
          </View>

          <Text style={styles.itemTitle}>{currentItem.title}</Text>
          
          {currentItem.required && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Required</Text>
            </View>
          )}

          <Text style={styles.itemDescription}>{currentItem.description}</Text>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>
              {currentItem.required ? 'Always Enabled' : 'Enable this feature'}
            </Text>
            <Switch
              value={consents[currentItem.id]}
              onValueChange={() => handleToggle(currentItem.id)}
              disabled={currentItem.required}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
              accessibilityRole="switch"
              accessibilityLabel={`Toggle ${currentItem.title}`}
              accessibilityState={{ checked: consents[currentItem.id] }}
            />
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>What data is involved?</Text>
            <Text style={styles.detailsText}>{currentItem.details}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton, currentStep === 0 && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous consent item"
          accessibilityState={{ disabled: currentStep === 0 }}
        >
          <Ionicons name="chevron-back" size={20} color={currentStep === 0 ? '#ccc' : '#007AFF'} />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? 'Complete consent setup' : 'Next consent item'}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Complete' : 'Next'}
          </Text>
          {!isLastStep && (
            <Ionicons name="chevron-forward" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={modalConfig.actions?.[0]?.onPress || hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  skipButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  itemContainer: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  requiredBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  requiredText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemDescription: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  previousButton: {
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: '#cccccc',
  },
});

export default DataConsentFlow;