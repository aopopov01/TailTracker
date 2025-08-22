import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform
} from 'react-native';
import { PrivacyPolicyAccess } from '../../components/Privacy';

export const PrivacySettingsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy & Data</Text>
          <Text style={styles.subtitle}>
            Managing your privacy preferences and understanding how we protect your data
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
            <PrivacyPolicyAccess />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Collection Summary</Text>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                TailTracker collects location data, pet information, and usage analytics to provide core functionality:
              </Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>
                  • Location data for pet tracking and safe zones
                </Text>
                <Text style={styles.bulletPoint}>
                  • Pet photos and profiles for identification
                </Text>
                <Text style={styles.bulletPoint}>
                  • Usage analytics to improve app performance
                </Text>
                <Text style={styles.bulletPoint}>
                  • Account information for authentication
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <View style={styles.rightsContainer}>
              <Text style={styles.rightsText}>
                You have the right to:
              </Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>
                  • Access and export your data
                </Text>
                <Text style={styles.bulletPoint}>
                  • Request data deletion
                </Text>
                <Text style={styles.bulletPoint}>
                  • Control location sharing settings
                </Text>
                <Text style={styles.bulletPoint}>
                  • Opt out of analytics (where applicable)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Security</Text>
            <View style={styles.securityContainer}>
              <Text style={styles.securityText}>
                Your data is protected with:
              </Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>
                  • End-to-end encryption for location data
                </Text>
                <Text style={styles.bulletPoint}>
                  • Secure cloud storage with AES-256 encryption
                </Text>
                <Text style={styles.bulletPoint}>
                  • Regular security audits and monitoring
                </Text>
                <Text style={styles.bulletPoint}>
                  • No data sharing with advertisers
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.contactText}>
              For privacy questions or data requests, contact us at:
            </Text>
            <Text style={styles.contactEmail}>privacy@tailtracker.com</Text>
          </View>

          <View style={styles.footer}>
            <PrivacyPolicyAccess 
              showAsButton 
              style={styles.fullPolicyButton}
            >
              View Full Privacy Policy
            </PrivacyPolicyAccess>
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 32,
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 12,
    lineHeight: 21,
  },
  bulletPoints: {
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 20,
  },
  rightsContainer: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 8,
  },
  rightsText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 12,
    fontWeight: '500',
  },
  securityContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 12,
    fontWeight: '500',
  },
  contactText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
  },
  fullPolicyButton: {
    marginHorizontal: 0,
  },
});

export default PrivacySettingsScreen;