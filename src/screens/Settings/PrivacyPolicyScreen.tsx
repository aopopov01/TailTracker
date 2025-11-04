import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PrivacyPolicyScreenProps {
  navigation?: any;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({
  navigation,
}) => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const privacyPolicyContent = {
    lastUpdated: 'January 20, 2025',
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content: `TailTracker Inc. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our TailTracker mobile application (the "App") and related services.

By using TailTracker, you consent to the data practices described in this policy.`,
      },
      {
        id: 'information-collected',
        title: 'Information We Collect',
        content: `Personal Information:
• Account Information: Name, email address, phone number
• Profile Information: User preferences, account settings
• Payment Information: Billing details for premium subscriptions (processed securely through Apple App Store/Google Play Store)

Pet Information:
• Pet Profiles: Name, breed, age, weight, photos, personality traits
• Health Records: Vaccination history, medications, veterinary visits, health notes
• Emergency Contacts: Veterinarian information, emergency contacts

Location Data:
• Real-time Location: GPS coordinates when using tracking features
• Location History: Past location data for tracking pets and safe zones
• Geofencing Data: Safe zone boundaries and alert triggers
• Background Location: When explicitly enabled for pet safety monitoring

Usage and Technical Data:
• App Usage: Features used, time spent in app, interaction patterns
• Device Information: Device model, operating system, app version
• Log Data: Error logs, crash reports, performance metrics
• Analytics Data: Aggregated usage statistics for app improvement

Photos and Media:
• Pet Photos: Images uploaded for pet profiles and identification
• User-Generated Content: Notes, comments, and shared information`,
      },
      {
        id: 'how-we-use',
        title: 'How We Use Your Information',
        content: `Core App Functionality:
• Create and manage pet profiles
• Enable location tracking and safety monitoring
• Send safety alerts and notifications
• Provide health record management
• Facilitate family sharing features

Safety and Emergency Services:
• Monitor pet locations and safe zones
• Generate lost pet alerts and notifications
• Provide emergency contact information
• Create lost pet posters with QR codes

Service Improvement:
• Analyze app usage to improve features
• Identify and fix technical issues
• Develop new features and services
• Enhance user experience

Communication:
• Send important service notifications
• Provide customer support
• Share updates about app features
• Process subscription management

Legal and Security:
• Comply with legal obligations
• Prevent fraud and abuse
• Protect user safety and security
• Enforce our terms of service`,
      },
      {
        id: 'information-sharing',
        title: 'Information Sharing',
        content: `We Do Not Sell Your Data:
TailTracker does not sell, rent, or trade your personal information to third parties for marketing purposes.

Limited Sharing for Service Provision:
We may share information with:

Service Providers:
• Google Firebase (authentication, analytics, crash reporting)
• Supabase (database and backend services)
• Stripe (payment processing for premium subscriptions)
• Google Maps Platform (mapping and location services)
• Apple/Google (app distribution and in-app payment processing)
• Cloud storage providers (secure data backup and synchronization)

Family Sharing:
• Pet information shared with authorized family members
• Location data shared with designated caregivers
• Emergency contact access as configured by user

Legal Requirements:
• When required by law or legal process
• To protect rights, property, or safety
• In case of emergency situations involving pet or human safety

Business Transfers:
• In connection with merger, acquisition, or asset sale
• Users will be notified of any ownership changes`,
      },
      {
        id: 'data-security',
        title: 'Data Security',
        content: `Encryption and Protection:
• In Transit: All data encrypted using TLS 1.3
• At Rest: Database encryption with AES-256
• Local Storage: Device-level encryption utilized
• Access Controls: Multi-factor authentication and role-based access

Security Measures:
• Regular security audits and assessments
• Secure coding practices and vulnerability testing
• Employee access controls and training
• Incident response and breach notification procedures

Payment Security:
• PCI DSS compliance for payment processing
• No storage of credit card information on our servers
• Payment processing through secure providers
• All payment data encrypted in transit and at rest`,
      },
      {
        id: 'data-retention',
        title: 'Data Retention',
        content: `Retention Periods:
• Account Data: Retained while account is active
• Location History: 30 days (Premium) / 7 days (Free)
• Pet Photos: Until manually deleted by user
• Health Records: Until manually deleted by user
• Analytics Data: 24 months maximum (anonymized)
• Crash Reports: 12 months maximum

Data Deletion:
• Account Deletion: Complete removal within 30 days
• Individual Data: Immediate deletion upon user request
• Backup Purging: Backup data removed within 90 days
• Third-party Deletion: Coordinated deletion from service providers`,
      },
      {
        id: 'your-rights',
        title: 'Your Privacy Rights',
        content: `Access and Control:
• View all collected personal data
• Export data in machine-readable format
• Correct inaccurate information
• Delete specific data or entire account

Location Privacy:
• Enable/disable location tracking
• Control background location access
• Set location sharing preferences
• Delete location history

Communication Preferences:
• Opt-out of marketing communications
• Customize notification settings
• Control emergency contact sharing

Regional Rights:

GDPR (European Union):
• Right to be informed about data processing
• Right of access to your personal data
• Right to rectification of inaccurate data
• Right to erasure ("right to be forgotten")
• Right to restrict processing
• Right to data portability
• Right to object to processing
• Rights related to automated decision making

CCPA (California):
• Right to know about personal information collected
• Right to delete personal information
• Right to opt-out of sale (we don't sell data)
• Right to non-discrimination for exercising rights

Other Jurisdictions:
We comply with applicable data protection laws in all jurisdictions where we operate.`,
      },
      {
        id: 'childrens-privacy',
        title: "Children's Privacy",
        content: `TailTracker is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover that we have collected information from a child under 13, we will delete such information immediately.

Parents and guardians who believe their child under 13 has provided personal information should contact us immediately at privacy@tailtracker.com.`,
      },
      {
        id: 'contact',
        title: 'Contact Information',
        content: `Data Protection Officer:
Email: privacy@tailtracker.com
Response Time: 48 hours for inquiries, 30 days for requests

Customer Support:
Email: support@tailtracker.com

Mailing Address:
TailTracker Inc.
123 Tech Street, Suite 100
San Francisco, CA 94105
United States`,
      },
      {
        id: 'changes',
        title: 'Changes to Privacy Policy',
        content: `We may update this Privacy Policy periodically. When we make changes, we will:
• Update the "Last Updated" date
• Notify users through the app
• Send email notifications for material changes
• Provide 30 days notice before significant changes take effect

Continued use of the App after changes constitutes acceptance of the updated policy.`,
      },
    ],
  };

  const CollapsibleSection: React.FC<{ section: any }> = ({ section }) => {
    const isExpanded = expandedSections[section.id];

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          accessibilityRole='button'
          accessibilityState={{ expanded: isExpanded }}
          accessibilityHint={`${isExpanded ? 'Collapse' : 'Expand'} ${section.title} section`}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color='#666'
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionText}>{section.content}</Text>
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
            accessibilityRole='button'
            accessibilityLabel='Go back'
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
              size={24}
              color='#007AFF'
            />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>TailTracker Privacy Policy</Text>
          <Text style={styles.lastUpdated}>
            Last Updated: {privacyPolicyContent.lastUpdated}
          </Text>
          <Text style={styles.introText}>
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your data.
          </Text>
        </View>

        {privacyPolicyContent.sections.map(section => (
          <CollapsibleSection key={section.id} section={section} />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This privacy policy is written in plain language to ensure clarity
            and understanding. For questions about specific technical or legal
            aspects, please contact our Data Protection Officer.
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  sectionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    minHeight: 56,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 12,
  },
  sectionContent: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  sectionText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  footer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default PrivacyPolicyScreen;
