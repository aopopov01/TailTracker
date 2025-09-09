import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';


const LEGAL_LINKS = [
  {
    title: 'Privacy Policy',
    subtitle: 'How we protect your data',
    url: 'https://tailtracker.app/privacy',
    icon: 'shield-checkmark',
  },
  {
    title: 'Terms of Service',
    subtitle: 'Terms and conditions of use',
    url: 'https://tailtracker.app/terms',
    icon: 'document-text',
  },
  {
    title: 'Open Source Licenses',
    subtitle: 'Third-party software licenses',
    url: 'https://tailtracker.app/licenses',
    icon: 'code-slash',
  },
  {
    title: 'Acknowledgments',
    subtitle: 'Credits and attributions',
    url: 'https://tailtracker.app/credits',
    icon: 'heart',
  },
];


export default function AboutScreen() {
  const navigation = useNavigation();

  const openURL = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };


  const renderLegalLink = (link: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.legalLink}
      onPress={() => openURL(link.url)}
    >
      <View style={styles.linkIcon}>
        <Ionicons name={link.icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.linkText}>
        <Text style={styles.linkTitle}>{link.title}</Text>
        <Text style={styles.linkSubtitle}>{link.subtitle}</Text>
      </View>
      <Ionicons name="open" size={16} color={colors.gray400} />
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About TailTracker</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <View style={styles.appInfo}>
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <Ionicons name="paw" size={48} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.appName}>TailTracker</Text>
          <Text style={styles.tagline}>Where Every Tail Has a Story</Text>
          <Text style={styles.version}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
          <Text style={styles.buildInfo}>
            Build {(Constants.expoConfig?.runtimeVersion as string) || '1'} • 
            {Constants.platform?.ios ? ' iOS' : ' Android'}
          </Text>
        </View>


        {/* Features Highlight */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Ionicons name="medical" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Digital Pet Passports</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Vaccination Tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Lost Pet Alerts</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="share-social" size={24} color={colors.primary} />
              <Text style={styles.featureText}>QR Code Sharing</Text>
            </View>
          </View>
        </View>



        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:hello@tailtracker.app')}
          >
            <Ionicons name="mail" size={20} color={colors.white} />
            <Text style={styles.contactButtonText}>hello@tailtracker.app</Text>
          </TouchableOpacity>
        </View>

        {/* Legal & Compliance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Privacy</Text>
          <View style={styles.legalContainer}>
            {LEGAL_LINKS.map(renderLegalLink)}
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.companyCard}>
            <Text style={styles.companyText}>
              <Text style={styles.companyLabel}>Company: </Text>
              TailTracker Technologies Inc.
            </Text>
            <Text style={styles.companyText}>
              <Text style={styles.companyLabel}>Founded: </Text>
              2024
            </Text>
            <Text style={styles.companyText}>
              <Text style={styles.companyLabel}>Location: </Text>
              San Francisco, CA
            </Text>
            <Text style={styles.companyText}>
              <Text style={styles.companyLabel}>Registration: </Text>
              Delaware, USA
            </Text>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2024 TailTracker Technologies Inc. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ for pets and their families
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appInfo: {
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  appIconContainer: {
    marginBottom: spacing.md,
  },
  appIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.primaryContainer,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  appName: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  version: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  buildInfo: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray400,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
  featureItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginHorizontal: '1%',
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  featureText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
  },
  contactButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  legalContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  linkIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  linkText: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  linkSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  companyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  companyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  companyLabel: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    marginTop: spacing.md,
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  copyrightSubtext: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray400,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});