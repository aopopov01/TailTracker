import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Linking,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// eslint-disable-next-line import/no-unresolved
import Constants from 'expo-constants';
import * as MailComposer from 'expo-mail-composer';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'technical' | 'subscription' | 'data';
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How do I add a new pet to my profile?',
    answer: 'Tap the "+" button on the Pets screen, then fill out your pet\'s information including name, breed, birth date, and upload a photo. You can also add medical conditions and dietary restrictions.',
    category: 'general',
  },
  {
    question: 'How does the vaccination reminder system work?',
    answer: 'When you add a vaccination record, TailTracker automatically calculates the next due date based on standard vaccination schedules. You\'ll receive push notifications 1 week and 1 day before the due date.',
    category: 'general',
  },
  {
    question: 'What should I do if my pet goes missing?',
    answer: 'Go to your pet\'s profile and tap "Report Lost". This will send alerts to other TailTracker users in your area (5km radius) and create a digital lost pet poster that you can share on social media.',
    category: 'general',
  },
  {
    question: 'How do I cancel my premium subscription?',
    answer: 'Go to Settings > Subscription Management and tap "Cancel Subscription". Your premium features will remain active until the end of your current billing period.',
    category: 'subscription',
  },
  {
    question: 'Can I share my pet\'s profile with my veterinarian?',
    answer: 'Yes! Go to your pet\'s profile, tap the share button, and generate a QR code. Your vet can scan this to access your pet\'s complete medical history.',
    category: 'general',
  },
  {
    question: 'Is my pet\'s data secure?',
    answer: 'Absolutely. All data is encrypted both in transit and at rest. We use industry-standard security practices and never share your personal information with third parties.',
    category: 'data',
  },
  {
    question: 'The app is running slowly. What can I do?',
    answer: 'Try closing and reopening the app, or restart your device. If issues persist, check for app updates in your app store, or clear the app cache in your device settings.',
    category: 'technical',
  },
  {
    question: 'How do I export my pet\'s data?',
    answer: 'Go to Settings > Data Management > Export All Data. This will create a JSON file with all your pet information that you can save or share.',
    category: 'data',
  },
];


export default function SupportScreen() {
  const navigation = useNavigation();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'general', label: 'General' },
    { key: 'technical', label: 'Technical' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'data', label: 'Data & Privacy' },
  ];

  const filteredFAQs = FAQ_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });


  const sendFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback before sending.');
      return;
    }

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: ['feedback@tailtracker.app'],
          subject: 'TailTracker App Feedback',
          body: `Feedback:\n${feedbackText}\n\nApp Version: ${Constants.expoConfig?.version || 'Unknown'}`,
        });
        setFeedbackText('');
        Alert.alert('Success', 'Thank you for your feedback!');
      } else {
        Alert.alert('Error', 'Unable to send feedback. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    }
  };

  const renderFAQItem = (item: FAQItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.faqItem}
      onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
    >
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQuestionText}>{item.question}</Text>
        <Ionicons
          name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.gray400}
        />
      </View>
      {expandedFAQ === index && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      )}
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
        <Text style={styles.headerTitle}>Support & Help</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.gray400}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.gray400} />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.key && styles.categoryTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ Items */}
          <View style={styles.faqContainer}>
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map(renderFAQItem)
            ) : (
              <View style={styles.noResults}>
                <Ionicons name="help-circle" size={48} color={colors.gray300} />
                <Text style={styles.noResultsText}>No FAQs found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try adjusting your search or category filter
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Feedback</Text>
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>Help us improve TailTracker</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Share your thoughts, suggestions, or report bugs..."
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.gray400}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendFeedback}>
              <Text style={styles.sendButtonText}>Send Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>
          
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Linking.openURL('https://tailtracker.app/privacy')}
          >
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.resourceText}>Privacy Policy</Text>
            <Ionicons name="open" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Linking.openURL('https://tailtracker.app/terms')}
          >
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={styles.resourceText}>Terms of Service</Text>
            <Ionicons name="open" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Linking.openURL('https://tailtracker.app/blog')}
          >
            <Ionicons name="library" size={20} color={colors.primary} />
            <Text style={styles.resourceText}>Blog & Updates</Text>
            <Ionicons name="open" size={16} color={colors.gray400} />
          </TouchableOpacity>
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
  section: {
    marginTop: spacing.md,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  categoriesContainer: {
    marginBottom: spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    marginRight: spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.white,
  },
  faqContainer: {
    backgroundColor: colors.white,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  faqQuestionText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.gray50,
  },
  faqAnswerText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray400,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  feedbackContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  feedbackLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    minHeight: 100,
    marginBottom: spacing.md,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  resourceText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginLeft: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});