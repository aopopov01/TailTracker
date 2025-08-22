import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DataTransparencyProps {
  navigation?: any;
}

export const DataTransparency: React.FC<DataTransparencyProps> = ({ navigation }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const dataCategories = [
    {
      id: 'account-data',
      title: 'Account & Profile Data',
      purpose: 'User authentication and app personalization',
      retention: 'Until account deletion',
      sharing: 'Never shared with third parties',
      icon: 'person-outline',
      color: '#007AFF',
      items: [
        {
          type: 'Email Address',
          reason: 'Account login, important notifications, password reset',
          required: true
        },
        {
          type: 'Display Name',
          reason: 'App personalization and family sharing identification',
          required: true
        },
        {
          type: 'Profile Photo',
          reason: 'Visual identification in family sharing features',
          required: false
        },
        {
          type: 'Phone Number',
          reason: 'Emergency contact and SMS notifications (optional)',
          required: false
        }
      ]
    },
    {
      id: 'pet-data',
      title: 'Pet Information',
      purpose: 'Pet management and health tracking',
      retention: 'Until manually deleted by user',
      sharing: 'Only with authorized family members',
      icon: 'paw-outline',
      color: '#FF6B6B',
      items: [
        {
          type: 'Pet Names & Photos',
          reason: 'Pet identification and profile creation',
          required: true
        },
        {
          type: 'Breed, Age, Weight',
          reason: 'Health recommendations and breed-specific features',
          required: false
        },
        {
          type: 'Health Records',
          reason: 'Vaccination tracking, medication reminders, vet visits',
          required: false
        },
        {
          type: 'Behavior Notes',
          reason: 'Personality tracking and behavioral insights',
          required: false
        },
        {
          type: 'Emergency Contacts',
          reason: 'Veterinarian information for emergency situations',
          required: false
        }
      ]
    },
    {
      id: 'location-data',
      title: 'Location & Tracking Data',
      purpose: 'Pet safety and location monitoring',
      retention: '30 days (Premium) / 7 days (Free)',
      sharing: 'Only with authorized family members',
      icon: 'location-outline',
      color: '#4ECDC4',
      items: [
        {
          type: 'Real-Time GPS Coordinates',
          reason: 'Live pet tracking and current location display',
          required: true
        },
        {
          type: 'Location History',
          reason: 'Track movement patterns and generate location insights',
          required: false
        },
        {
          type: 'Safe Zone Boundaries',
          reason: 'Geofencing alerts when pets leave designated safe areas',
          required: false
        },
        {
          type: 'Background Location',
          reason: 'Continuous monitoring even when app is closed',
          required: false
        }
      ]
    },
    {
      id: 'device-data',
      title: 'Device & Technical Data',
      purpose: 'App functionality and technical support',
      retention: '12 months maximum',
      sharing: 'Anonymous data only',
      icon: 'phone-portrait-outline',
      color: '#9013FE',
      items: [
        {
          type: 'Device Model & OS Version',
          reason: 'Ensure app compatibility and optimize performance',
          required: true
        },
        {
          type: 'App Version & Settings',
          reason: 'Feature support and troubleshooting',
          required: true
        },
        {
          type: 'Crash Reports',
          reason: 'Identify and fix technical issues',
          required: false
        },
        {
          type: 'Performance Metrics',
          reason: 'Monitor app speed and responsiveness',
          required: false
        }
      ]
    },
    {
      id: 'usage-data',
      title: 'App Usage Analytics',
      purpose: 'Feature improvement and user experience optimization',
      retention: '24 months (anonymized)',
      sharing: 'Anonymous aggregated data only',
      icon: 'bar-chart-outline',
      color: '#FF9800',
      items: [
        {
          type: 'Feature Usage Patterns',
          reason: 'Understand which features are most valuable to users',
          required: false
        },
        {
          type: 'Screen View Times',
          reason: 'Optimize user interface and navigation flow',
          required: false
        },
        {
          type: 'Button Interactions',
          reason: 'Improve button placement and design',
          required: false
        },
        {
          type: 'Error Occurrences',
          reason: 'Identify common user experience issues',
          required: false
        }
      ]
    },
    {
      id: 'communication-data',
      title: 'Communication & Notifications',
      purpose: 'Service communication and emergency alerts',
      retention: 'Until notification preferences changed',
      sharing: 'Never shared',
      icon: 'notifications-outline',
      color: '#4CAF50',
      items: [
        {
          type: 'Notification Preferences',
          reason: 'Deliver relevant alerts and updates',
          required: false
        },
        {
          type: 'Emergency Contact Information',
          reason: 'Notify designated contacts in emergency situations',
          required: false
        },
        {
          type: 'Communication History',
          reason: 'Track support interactions and follow-ups',
          required: false
        }
      ]
    }
  ];

  const handleDataRequest = (requestType: 'export' | 'delete' | 'correct') => {
    const messages = {
      export: {
        title: 'Data Export Request',
        message: 'You can request a copy of all your data. This will be provided in a machine-readable format within 30 days. Would you like to submit this request?',
        action: 'Submit Export Request'
      },
      delete: {
        title: 'Data Deletion Request',
        message: 'This will permanently delete your account and all associated data. This action cannot be undone. Are you sure you want to proceed?',
        action: 'Delete My Data'
      },
      correct: {
        title: 'Data Correction Request',
        message: 'You can request corrections to inaccurate personal data. Please contact our support team with details about what needs to be corrected.',
        action: 'Contact Support'
      }
    };

    const config = messages[requestType];
    Alert.alert(
      config.title,
      config.message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: config.action, 
          onPress: () => {
            // Handle data request - in a real app, this would integrate with your backend
            Alert.alert('Request Submitted', 'Your data request has been submitted and will be processed within 30 days.');
          }
        }
      ]
    );
  };

  const CategoryCard: React.FC<{ category: any }> = ({ category }) => {
    const isExpanded = expandedCategories[category.id];

    return (
      <View style={[styles.categoryCard, { borderLeftColor: category.color }]}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.id)}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          accessibilityHint={`${isExpanded ? 'Collapse' : 'Expand'} ${category.title} details`}
        >
          <View style={styles.categoryTitleContainer}>
            <Ionicons 
              name={category.icon} 
              size={24} 
              color={category.color}
              style={styles.categoryIcon}
            />
            <View style={styles.categoryTextContainer}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryPurpose}>{category.purpose}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryContent}>
            <View style={styles.categoryMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Retention:</Text>
                <Text style={styles.metaValue}>{category.retention}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Sharing:</Text>
                <Text style={styles.metaValue}>{category.sharing}</Text>
              </View>
            </View>

            <Text style={styles.itemsTitle}>Data Types Collected:</Text>
            {category.items.map((item: any, index: number) => (
              <View key={index} style={styles.dataItem}>
                <View style={styles.dataItemHeader}>
                  <Text style={styles.dataItemType}>{item.type}</Text>
                  {item.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dataItemReason}>{item.reason}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
              size={24}
              color="#007AFF"
            />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Data Transparency</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Your Data, Transparent</Text>
          <Text style={styles.introText}>
            We believe in complete transparency about what data we collect and how we use it. 
            Expand each category below to see exactly what information TailTracker collects and why.
          </Text>
        </View>

        {dataCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}

        <View style={styles.rightsSection}>
          <Text style={styles.rightsTitle}>Your Data Rights</Text>
          <Text style={styles.rightsDescription}>
            You have the right to control your personal data. Here are the actions you can take:
          </Text>

          <TouchableOpacity
            style={styles.rightButton}
            onPress={() => handleDataRequest('export')}
            accessibilityRole="button"
            accessibilityLabel="Request data export"
          >
            <Ionicons name="download-outline" size={20} color="#007AFF" />
            <View style={styles.rightButtonContent}>
              <Text style={styles.rightButtonTitle}>Export My Data</Text>
              <Text style={styles.rightButtonDescription}>Download a copy of all your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rightButton}
            onPress={() => handleDataRequest('correct')}
            accessibilityRole="button"
            accessibilityLabel="Request data correction"
          >
            <Ionicons name="create-outline" size={20} color="#FF9800" />
            <View style={styles.rightButtonContent}>
              <Text style={styles.rightButtonTitle}>Correct My Data</Text>
              <Text style={styles.rightButtonDescription}>Request corrections to inaccurate information</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rightButton}
            onPress={() => handleDataRequest('delete')}
            accessibilityRole="button"
            accessibilityLabel="Request data deletion"
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            <View style={styles.rightButtonContent}>
              <Text style={styles.rightButtonTitle}>Delete My Data</Text>
              <Text style={styles.rightButtonDescription}>Permanently delete your account and all data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions About Your Data?</Text>
          <Text style={styles.contactText}>
            Contact our Data Protection Officer at privacy@tailtracker.com for any questions about how your data is handled.
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  introSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  categoryPurpose: {
    fontSize: 14,
    color: '#666666',
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryMeta: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    width: 80,
  },
  metaValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  dataItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dataItemType: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dataItemReason: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  rightsSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 12,
  },
  rightsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  rightsDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 20,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 64,
  },
  rightButtonContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  rightButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  rightButtonDescription: {
    fontSize: 13,
    color: '#666666',
  },
  contactSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default DataTransparency;