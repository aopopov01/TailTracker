import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TermsOfServiceScreenProps {
  navigation?: any;
}

export const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ navigation }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const termsContent = {
    lastUpdated: "January 20, 2025",
    sections: [
      {
        id: "acceptance",
        title: "1. Acceptance of Terms",
        content: `By downloading, installing, accessing, or using the TailTracker mobile application ("App") and related services ("Services"), you ("User" or "you") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use our Services.

These Terms constitute a legally binding agreement between you and TailTracker Inc. ("TailTracker," "we," "us," or "our"), a corporation incorporated under the laws of Delaware, United States.`
      },
      {
        id: "service-description",
        title: "2. Description of Service",
        content: `TailTracker is a comprehensive pet management platform that provides:

Core Services:
• Digital pet profiles and health record management
• Location tracking and safe zone monitoring
• Lost pet alert system and community features
• Vaccination and medication reminders
• Family sharing and multi-user access
• Emergency contact management

Premium Services:
• Advanced health analytics and insights
• Extended location history and tracking
• Unlimited pet profiles and photo storage
• Priority customer support
• Export capabilities for health records
• Professional features for multi-pet management`
      },
      {
        id: "user-accounts",
        title: "3. User Accounts and Registration",
        content: `Account Creation:
• You must be at least 13 years of age to create an account
• You must provide accurate, current, and complete information
• You are responsible for maintaining the confidentiality of your account credentials
• You agree to notify us immediately of any unauthorized use of your account

Account Responsibilities:
• You are solely responsible for all activities under your account
• You may not share your account with others or allow others to access your account
• You may not create multiple accounts to circumvent service limitations
• You agree to keep your contact information current and accurate

Account Termination:
• You may terminate your account at any time through the App settings
• We may suspend or terminate your account for violation of these Terms
• Upon termination, your data will be deleted according to our Privacy Policy
• Subscription fees are non-refundable upon account termination`
      },
      {
        id: "subscription-billing",
        title: "4. Subscription Terms and Billing",
        content: `Premium Subscription Plans:

TailTracker Premium:
• Monthly Plan: €5.99/month
• Annual Plan: €50.00/year (30% savings)

TailTracker Pro:
• Monthly Plan: €8.99/month
• Annual Plan: €80.00/year (26% savings)

Billing Terms:
• Subscription fees are billed in advance on a monthly or annual basis
• Payment will be charged to your payment method at confirmation of purchase
• Subscriptions automatically renew unless canceled at least 24 hours before renewal
• You will be charged for renewal within 24 hours prior to the end of the current period
• Subscription management is available through your device's app store settings

Free Trial Terms:
• Free trials automatically convert to paid subscriptions unless canceled
• You may cancel during the trial period without charge
• Cancellation takes effect at the end of the trial period
• Previous trial users are not eligible for additional free trials

Price Changes:
• We reserve the right to modify subscription prices with 30 days' notice
• Price changes will not affect current subscribers until their next renewal period
• Continued use after price changes constitutes acceptance of new pricing

Refund Policy:
• All subscription fees are non-refundable except as required by applicable law
• Requests for refunds must be made through the respective app store
• We do not provide refunds for unused portions of subscription periods
• Exceptional circumstances may be considered on a case-by-case basis`
      },
      {
        id: "acceptable-use",
        title: "5. Acceptable Use Policy",
        content: `Permitted Uses:
You may use TailTracker for:
• Managing your own pets' information and health records
• Sharing pet information with authorized family members and caregivers
• Participating in the community features in a respectful manner
• Using location services for legitimate pet safety purposes

Prohibited Uses:
You may not:
• Use the Service for any unlawful purpose or to violate any laws
• Impersonate any person or entity or falsely represent your affiliation
• Upload, transmit, or share content that is harmful, threatening, abusive, or obscene
• Attempt to gain unauthorized access to other users' accounts or data
• Use automated scripts, bots, or other automated means to access the Service
• Reverse engineer, decompile, or attempt to extract the source code
• Share, sell, or distribute your account credentials to third parties
• Use the Service to stalk, harass, or harm animals or other users
• Post false information about lost or found pets
• Spam other users or abuse the communication features

Content Standards:
All user-generated content must:
• Be accurate and truthful, especially regarding pet information
• Respect the privacy and rights of others
• Comply with applicable laws and regulations
• Not infringe on intellectual property rights
• Not contain malicious code or security threats`
      },
      {
        id: "intellectual-property",
        title: "6. Intellectual Property Rights",
        content: `TailTracker Intellectual Property:
• TailTracker owns all rights to the App, including software, designs, trademarks, and content
• The TailTracker name, logo, and related marks are our registered trademarks
• You may not use our trademarks without prior written permission
• All software is licensed, not sold, to you

User Content:
• You retain ownership of content you upload, including pet photos and information
• You grant TailTracker a limited license to use your content to provide the Service
• You represent that you have all necessary rights to the content you upload
• You may request deletion of your content at any time through the App

Third-Party Content:
• The Service may include content from third parties, including veterinary information
• Third-party content is the responsibility of its respective owners
• We do not endorse or guarantee the accuracy of third-party content
• Use of third-party content is subject to their respective terms and conditions`
      },
      {
        id: "privacy-data",
        title: "7. Privacy and Data Protection",
        content: `Data Collection and Use:
• Our collection and use of personal information is governed by our Privacy Policy
• You consent to our data practices as described in the Privacy Policy
• We implement appropriate security measures to protect your data
• You have rights regarding your personal data as described in the Privacy Policy

Location Data:
• Location services are essential for our pet tracking and safety features
• You may control location sharing through your device and App settings
• Location data is used solely for providing our Services and ensuring pet safety
• We do not sell or share location data with third parties for marketing purposes

Family Sharing:
• You may share pet information with designated family members and caregivers
• You are responsible for obtaining consent from family members before sharing their information
• Shared users must comply with these Terms and our Privacy Policy
• You may revoke sharing access at any time`
      },
      {
        id: "disclaimers",
        title: "8. Disclaimers and Limitations of Liability",
        content: `Service Disclaimers:
• TailTracker is provided "as is" without warranties of any kind
• We do not guarantee uninterrupted or error-free operation
• We are not responsible for loss of data due to technical issues
• Location tracking may be affected by device limitations, network coverage, or environmental factors
• We do not guarantee the accuracy of third-party veterinary information

Medical Disclaimers:
• TailTracker is not a substitute for professional veterinary care
• Health features are for informational purposes only
• Always consult a licensed veterinarian for medical advice
• We are not responsible for decisions made based on App information
• Emergency situations require immediate contact with veterinary services

Limitation of Liability:
• Our total liability is limited to the amount you paid for the Service in the past 12 months
• We are not liable for indirect, incidental, special, or consequential damages
• We are not liable for loss of profits, data, or business opportunities
• Some jurisdictions do not allow limitations of liability, so these limitations may not apply to you

Force Majeure:
• We are not liable for delays or failures due to circumstances beyond our control
• This includes natural disasters, government actions, network outages, or other emergencies
• We will make reasonable efforts to restore service during such events`
      },
      {
        id: "dispute-resolution",
        title: "9. Dispute Resolution",
        content: `Governing Law:
• These Terms are governed by the laws of the State of Delaware, United States
• Any disputes will be resolved in the state or federal courts of Delaware
• You consent to the personal jurisdiction of Delaware courts

Arbitration Agreement:
For disputes involving amounts less than $10,000:
• Disputes will be resolved through binding arbitration
• Arbitration will be conducted by the American Arbitration Association (AAA)
• Arbitration will take place in Delaware or remotely
• Each party will bear their own costs and attorney's fees
• Class action arbitrations are not permitted

Exceptions to Arbitration:
The following disputes are not subject to arbitration:
• Disputes involving intellectual property rights
• Disputes involving emergency relief or injunctive relief
• Small claims court proceedings
• Disputes involving violations of our Acceptable Use Policy

Informal Resolution:
• Before pursuing formal dispute resolution, parties agree to negotiate in good faith
• Written notice of disputes must be provided with 30 days for informal resolution
• Formal proceedings may only begin after informal resolution efforts have failed`
      },
      {
        id: "modifications",
        title: "10. Modifications to Terms",
        content: `Right to Modify:
• We reserve the right to modify these Terms at any time
• Material changes will be communicated through the App or by email
• Continued use after changes constitutes acceptance of modified Terms
• If you disagree with changes, your sole remedy is to discontinue use

Notice of Changes:
• We will provide at least 30 days' notice of material changes
• Notice will be provided through the App, email, or our website
• Changes will not apply retroactively
• You may terminate your account if you disagree with changes`
      },
      {
        id: "termination",
        title: "11. Termination",
        content: `Termination by You:
• You may terminate your account at any time through the App settings
• Upon termination, your access to premium features will cease immediately
• Your data will be deleted according to our data retention policy
• Outstanding subscription fees remain due and payable

Termination by TailTracker:
We may terminate or suspend your account if:
• You violate these Terms or our Acceptable Use Policy
• You engage in fraudulent or illegal activities
• You fail to pay subscription fees
• We discontinue the Service (with 30 days' notice)

Effect of Termination:
• All rights and licenses granted to you will immediately cease
• Provisions regarding intellectual property, liability, and dispute resolution will survive
• You remain liable for all obligations incurred prior to termination
• We will delete your data according to our Privacy Policy`
      },
      {
        id: "contact-support",
        title: "12. Contact Information",
        content: `For questions about these Terms:

Email: legal@tailtracker.com

Mailing Address:
TailTracker Inc.
123 Tech Street, Suite 100
San Francisco, CA 94105
United States

Customer Support: support@tailtracker.com`
      },
      {
        id: "special-provisions",
        title: "13. Special Provisions",
        content: `Emergency Situations:
• In pet or human safety emergencies, we may share information with emergency services
• Emergency sharing is limited to information necessary to address the situation
• Emergency actions are taken in good faith and are not subject to liability claims
• You consent to emergency information sharing when you use location services

Third-Party Services:
• The Service integrates with third-party services including maps, payment processors, and cloud services
• Use of third-party services is subject to their respective terms and privacy policies
• We are not responsible for third-party service availability or performance
• Third-party service changes may affect TailTracker functionality

Beta Features:
• We may offer beta or experimental features
• Beta features are provided "as is" without warranties
• Beta features may be discontinued at any time without notice
• Feedback on beta features may be used to improve the Service

Accessibility:
• We strive to make TailTracker accessible to users with disabilities
• If you encounter accessibility issues, please contact support@tailtracker.com
• We will make reasonable efforts to address accessibility concerns
• Accessibility features are continuously improved based on user feedback`
      }
    ]
  };

  const CollapsibleSection: React.FC<{ section: any }> = ({ section }) => {
    const isExpanded = expandedSections[section.id];
    
    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          accessibilityHint={`${isExpanded ? 'Collapse' : 'Expand'} ${section.title} section`}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>TailTracker Terms of Service</Text>
          <Text style={styles.lastUpdated}>Last Updated: {termsContent.lastUpdated}</Text>
          <Text style={styles.introText}>
            By using TailTracker, you agree to these terms. Please read them carefully.
          </Text>
        </View>

        {termsContent.sections.map((section) => (
          <CollapsibleSection key={section.id} section={section} />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using TailTracker, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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

export default TermsOfServiceScreen;