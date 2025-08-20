/**
 * Style Guide Demo - Living Documentation
 * 
 * Interactive demonstration of the complete TailTracker design system
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Dimensions,
} from 'react-native';
import { AnimatedButton, BlurFade } from '../components/magic-ui';

const { width: screenWidth } = Dimensions.get('window');

// Design Tokens (from STYLE_GUIDE.md)
const designTokens = {
  colors: {
    primary: {
      brand: '#3B82F6',
      brandLight: '#60A5FA',
      brandDark: '#1D4ED8',
      loyal: '#8B5CF6',
      caring: '#06B6D4',
      playful: '#F59E0B',
      gentle: '#10B981',
    },
    semantic: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      happy: '#22C55E',
      excited: '#F59E0B',
      calm: '#06B6D4',
      sleepy: '#8B5CF6',
      alert: '#EF4444',
    },
    neutral: {
      text: {
        primary: '#111827',
        secondary: '#374151',
        tertiary: '#6B7280',
        quaternary: '#9CA3AF',
      },
      background: {
        primary: '#FFFFFF',
        secondary: '#F9FAFB',
        tertiary: '#F3F4F6',
      },
      border: {
        subtle: '#F3F4F6',
        default: '#E5E7EB',
        strong: '#D1D5DB',
        interactive: '#9CA3AF',
      },
    },
  },
  typography: {
    display: {
      large: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
      medium: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
      small: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
    },
    heading: {
      h1: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
      h2: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
      h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
      h4: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
    },
    body: {
      large: { fontSize: 18, lineHeight: 26, fontWeight: '400' },
      medium: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
      small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    },
    ui: {
      button: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
      label: { fontSize: 14, lineHeight: 16, fontWeight: '500' },
      caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

const StyleGuideDemo: React.FC = () => {
  const [activeSection, setActiveSection] = useState('colors');

  const sections = [
    { id: 'colors', title: '🎨 Colors', icon: '🎨' },
    { id: 'typography', title: '📝 Typography', icon: '📝' },
    { id: 'spacing', title: '📏 Spacing', icon: '📏' },
    { id: 'components', title: '🧩 Components', icon: '🧩' },
    { id: 'patterns', title: '🎯 Patterns', icon: '🎯' },
  ];

  const renderColorDemo = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, designTokens.typography.heading.h2]}>
        Color System
      </Text>
      
      {/* Primary Colors */}
      <View style={styles.colorGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Primary Colors
        </Text>
        <View style={styles.colorGrid}>
          {Object.entries(designTokens.colors.primary).map(([name, color]) => (
            <BlurFade key={name} delay={0} direction="up">
              <View style={styles.colorCard}>
                <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                <Text style={styles.colorName}>{name}</Text>
                <Text style={styles.colorValue}>{color}</Text>
              </View>
            </BlurFade>
          ))}
        </View>
      </View>

      {/* Semantic Colors */}
      <View style={styles.colorGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Semantic Colors
        </Text>
        <View style={styles.colorGrid}>
          {Object.entries(designTokens.colors.semantic).map(([name, color]) => (
            <BlurFade key={name} delay={100} direction="up">
              <View style={styles.colorCard}>
                <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                <Text style={styles.colorName}>{name}</Text>
                <Text style={styles.colorValue}>{color}</Text>
              </View>
            </BlurFade>
          ))}
        </View>
      </View>

      {/* Pet Status Colors */}
      <View style={styles.statusDemo}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Pet Status Indicators
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, { backgroundColor: designTokens.colors.semantic.happy }]}>
            <Text style={styles.statusEmoji}>😊</Text>
            <Text style={styles.statusText}>Happy</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: designTokens.colors.semantic.excited }]}>
            <Text style={styles.statusEmoji}>🎾</Text>
            <Text style={styles.statusText}>Excited</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: designTokens.colors.semantic.calm }]}>
            <Text style={styles.statusEmoji}>😌</Text>
            <Text style={styles.statusText}>Calm</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: designTokens.colors.semantic.sleepy }]}>
            <Text style={styles.statusEmoji}>😴</Text>
            <Text style={styles.statusText}>Sleepy</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTypographyDemo = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, designTokens.typography.heading.h2]}>
        Typography System
      </Text>

      {/* Display Text */}
      <View style={styles.typeGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Display Text
        </Text>
        <BlurFade delay={0} direction="up">
          <Text style={[designTokens.typography.display.large, styles.typeExample]}>
            Display Large - Hero Headlines
          </Text>
        </BlurFade>
        <BlurFade delay={100} direction="up">
          <Text style={[designTokens.typography.display.medium, styles.typeExample]}>
            Display Medium - Section Headers
          </Text>
        </BlurFade>
        <BlurFade delay={200} direction="up">
          <Text style={[designTokens.typography.display.small, styles.typeExample]}>
            Display Small - Card Titles
          </Text>
        </BlurFade>
      </View>

      {/* Headings */}
      <View style={styles.typeGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Headings
        </Text>
        <Text style={[designTokens.typography.heading.h1, styles.typeExample]}>
          H1 - Page Titles
        </Text>
        <Text style={[designTokens.typography.heading.h2, styles.typeExample]}>
          H2 - Section Titles
        </Text>
        <Text style={[designTokens.typography.heading.h3, styles.typeExample]}>
          H3 - Subsection Titles
        </Text>
        <Text style={[designTokens.typography.heading.h4, styles.typeExample]}>
          H4 - Component Titles
        </Text>
      </View>

      {/* Body Text */}
      <View style={styles.typeGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Body Text
        </Text>
        <Text style={[designTokens.typography.body.large, styles.typeExample]}>
          Body Large - Important content and descriptions
        </Text>
        <Text style={[designTokens.typography.body.medium, styles.typeExample]}>
          Body Medium - Standard content and paragraph text
        </Text>
        <Text style={[designTokens.typography.body.small, styles.typeExample]}>
          Body Small - Supporting content and metadata
        </Text>
      </View>

      {/* UI Text */}
      <View style={styles.typeGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          UI Text
        </Text>
        <Text style={[designTokens.typography.ui.button, styles.typeExample]}>
          Button Text - Call to Actions
        </Text>
        <Text style={[designTokens.typography.ui.label, styles.typeExample]}>
          Label Text - Form Labels
        </Text>
        <Text style={[designTokens.typography.ui.caption, styles.typeExample]}>
          Caption Text - Helper Text
        </Text>
      </View>
    </View>
  );

  const renderSpacingDemo = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, designTokens.typography.heading.h2]}>
        Spacing System
      </Text>

      <View style={styles.spacingDemo}>
        {Object.entries(designTokens.spacing).map(([name, value]) => (
          <BlurFade key={name} delay={0} direction="up">
            <View style={styles.spacingItem}>
              <View style={styles.spacingLabel}>
                <Text style={styles.spacingName}>{name}</Text>
                <Text style={styles.spacingValue}>{value}px</Text>
              </View>
              <View style={[styles.spacingBar, { width: value * 4 }]} />
            </View>
          </BlurFade>
        ))}
      </View>

      {/* Spacing in Action */}
      <View style={styles.spacingExample}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Spacing in Action
        </Text>
        <View style={[styles.exampleCard, { padding: designTokens.spacing.lg }]}>
          <Text style={[designTokens.typography.heading.h3, { marginBottom: designTokens.spacing.sm }]}>
            Pet Profile Card
          </Text>
          <View style={[styles.petInfo, { gap: designTokens.spacing.xs }]}>
            <Text style={designTokens.typography.body.medium}>Name: Buddy</Text>
            <Text style={designTokens.typography.body.small}>Breed: Golden Retriever</Text>
            <Text style={designTokens.typography.body.small}>Age: 3 years</Text>
          </View>
          <View style={[styles.cardActions, { marginTop: designTokens.spacing.md, gap: designTokens.spacing.sm }]}>
            <AnimatedButton variant="shimmer" size="sm">View Profile</AnimatedButton>
            <AnimatedButton variant="pulsating" size="sm">Quick Check</AnimatedButton>
          </View>
        </View>
      </View>
    </View>
  );

  const renderComponentDemo = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, designTokens.typography.heading.h2]}>
        Component Library
      </Text>

      {/* Button Variants */}
      <View style={styles.componentGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Button Components
        </Text>
        <View style={styles.buttonGrid}>
          <AnimatedButton variant="shimmer" size="sm">Small</AnimatedButton>
          <AnimatedButton variant="shimmer" size="md">Medium</AnimatedButton>
          <AnimatedButton variant="shimmer" size="lg">Large</AnimatedButton>
        </View>
        <View style={styles.buttonGrid}>
          <AnimatedButton variant="pulsating" size="md">Pulsating</AnimatedButton>
          <AnimatedButton variant="rainbow" size="md">Rainbow</AnimatedButton>
          <AnimatedButton variant="shine" size="md">Shine</AnimatedButton>
        </View>
      </View>

      {/* Card Components */}
      <View style={styles.componentGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Card Components
        </Text>
        <BlurFade delay={0} direction="up">
          <View style={styles.demoCard}>
            <Text style={[designTokens.typography.heading.h3, { color: designTokens.colors.neutral.text.primary }]}>
              Pet Health Card
            </Text>
            <View style={styles.healthIndicators}>
              <View style={[styles.healthDot, { backgroundColor: designTokens.colors.semantic.success }]} />
              <Text style={designTokens.typography.body.small}>All vaccinations up to date</Text>
            </View>
            <Text style={[designTokens.typography.body.small, { color: designTokens.colors.neutral.text.tertiary }]}>
              Last checkup: 2 weeks ago
            </Text>
          </View>
        </BlurFade>
      </View>
    </View>
  );

  const renderPatternsDemo = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, designTokens.typography.heading.h2]}>
        Design Patterns
      </Text>

      {/* Emergency Pattern */}
      <View style={styles.patternGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Emergency Action Pattern
        </Text>
        <BlurFade delay={0} direction="up">
          <View style={[styles.emergencyCard, { borderLeftColor: designTokens.colors.semantic.error }]}>
            <Text style={styles.emergencyIcon}>🚨</Text>
            <View style={styles.emergencyContent}>
              <Text style={[designTokens.typography.heading.h4, { color: designTokens.colors.semantic.error }]}>
                Emergency Veterinary Care
              </Text>
              <Text style={designTokens.typography.body.small}>
                24/7 access to emergency vet services
              </Text>
            </View>
            <AnimatedButton variant="pulsating" size="sm" pulseColor={designTokens.colors.semantic.error}>
              Call Now
            </AnimatedButton>
          </View>
        </BlurFade>
      </View>

      {/* Premium Feature Pattern */}
      <View style={styles.patternGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Premium Feature Pattern
        </Text>
        <BlurFade delay={200} direction="up">
          <View style={[styles.premiumCard, { borderColor: designTokens.colors.primary.loyal }]}>
            <Text style={styles.premiumBadge}>✨ PREMIUM</Text>
            <Text style={[designTokens.typography.heading.h4, { color: designTokens.colors.primary.loyal }]}>
              Advanced Health Analytics
            </Text>
            <Text style={designTokens.typography.body.small}>
              Get detailed insights into your pet's health trends
            </Text>
            <AnimatedButton variant="rainbow" size="sm">
              Upgrade Now
            </AnimatedButton>
          </View>
        </BlurFade>
      </View>

      {/* Success Celebration Pattern */}
      <View style={styles.patternGroup}>
        <Text style={[styles.groupTitle, designTokens.typography.heading.h3]}>
          Success Celebration Pattern
        </Text>
        <BlurFade delay={400} direction="up">
          <View style={[styles.successCard, { backgroundColor: designTokens.colors.semantic.success + '10' }]}>
            <Text style={styles.successIcon}>🎉</Text>
            <View style={styles.successContent}>
              <Text style={[designTokens.typography.heading.h4, { color: designTokens.colors.semantic.success }]}>
                Milestone Achieved!
              </Text>
              <Text style={designTokens.typography.body.small}>
                Buddy completed all required vaccinations
              </Text>
            </View>
          </View>
        </BlurFade>
      </View>
    </View>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'colors':
        return renderColorDemo();
      case 'typography':
        return renderTypographyDemo();
      case 'spacing':
        return renderSpacingDemo();
      case 'components':
        return renderComponentDemo();
      case 'patterns':
        return renderPatternsDemo();
      default:
        return renderColorDemo();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, designTokens.typography.display.medium]}>
          TailTracker Design System
        </Text>
        <Text style={[styles.headerSubtitle, designTokens.typography.body.medium]}>
          Complete style guide and component library
        </Text>
      </View>

      {/* Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navigation}
        contentContainerStyle={styles.navigationContent}
      >
        {sections.map((section) => (
          <Pressable
            key={section.id}
            style={[
              styles.navItem,
              activeSection === section.id && styles.navItemActive,
            ]}
            onPress={() => setActiveSection(section.id)}
          >
            <Text style={styles.navIcon}>{section.icon}</Text>
            <Text
              style={[
                styles.navText,
                activeSection === section.id && styles.navTextActive,
              ]}
            >
              {section.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentSection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.neutral.background.secondary,
  },
  header: {
    padding: designTokens.spacing['2xl'],
    backgroundColor: designTokens.colors.neutral.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.neutral.border.default,
  },
  headerTitle: {
    color: designTokens.colors.neutral.text.primary,
    marginBottom: designTokens.spacing.xs,
  },
  headerSubtitle: {
    color: designTokens.colors.neutral.text.tertiary,
  },
  navigation: {
    backgroundColor: designTokens.colors.neutral.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.neutral.border.default,
  },
  navigationContent: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    marginRight: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: designTokens.colors.neutral.background.tertiary,
    minWidth: 100,
  },
  navItemActive: {
    backgroundColor: designTokens.colors.primary.brand,
  },
  navIcon: {
    fontSize: 16,
    marginBottom: designTokens.spacing.xs,
  },
  navText: {
    ...designTokens.typography.ui.caption,
    color: designTokens.colors.neutral.text.secondary,
    textAlign: 'center',
  },
  navTextActive: {
    color: designTokens.colors.neutral.background.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: designTokens.spacing['2xl'],
  },
  sectionTitle: {
    color: designTokens.colors.neutral.text.primary,
    marginBottom: designTokens.spacing['2xl'],
  },
  colorGroup: {
    marginBottom: designTokens.spacing['3xl'],
  },
  groupTitle: {
    color: designTokens.colors.neutral.text.primary,
    marginBottom: designTokens.spacing.lg,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
  },
  colorCard: {
    alignItems: 'center',
    padding: designTokens.spacing.md,
    backgroundColor: designTokens.colors.neutral.background.primary,
    borderRadius: designTokens.borderRadius.md,
    minWidth: (screenWidth - 64 - 24) / 3, // 3 columns with spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.md,
    marginBottom: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.neutral.border.subtle,
  },
  colorName: {
    ...designTokens.typography.ui.label,
    color: designTokens.colors.neutral.text.primary,
    textTransform: 'capitalize',
  },
  colorValue: {
    ...designTokens.typography.ui.caption,
    color: designTokens.colors.neutral.text.tertiary,
    fontFamily: 'monospace',
  },
  statusDemo: {
    marginTop: designTokens.spacing['2xl'],
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: designTokens.spacing.sm,
  },
  statusIndicator: {
    flex: 1,
    alignItems: 'center',
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md,
  },
  statusEmoji: {
    fontSize: 20,
    marginBottom: designTokens.spacing.xs,
  },
  statusText: {
    ...designTokens.typography.ui.caption,
    color: designTokens.colors.neutral.background.primary,
    fontWeight: '600',
  },
  typeGroup: {
    marginBottom: designTokens.spacing['2xl'],
  },
  typeExample: {
    color: designTokens.colors.neutral.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  spacingDemo: {
    backgroundColor: designTokens.colors.neutral.background.primary,
    borderRadius: designTokens.borderRadius.md,
    padding: designTokens.spacing.lg,
    marginBottom: designTokens.spacing['2xl'],
  },
  spacingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  },
  spacingLabel: {
    width: 80,
  },
  spacingName: {
    ...designTokens.typography.ui.label,
    color: designTokens.colors.neutral.text.primary,
  },
  spacingValue: {
    ...designTokens.typography.ui.caption,
    color: designTokens.colors.neutral.text.tertiary,
    fontFamily: 'monospace',
  },
  spacingBar: {
    height: 8,
    backgroundColor: designTokens.colors.primary.brand,
    borderRadius: 4,
    marginLeft: designTokens.spacing.md,
  },
  spacingExample: {
    marginTop: designTokens.spacing['2xl'],
  },
  exampleCard: {
    backgroundColor: designTokens.colors.neutral.background.primary,
    borderRadius: designTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: designTokens.colors.neutral.border.default,
  },
  petInfo: {
    marginBottom: designTokens.spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
  },
  componentGroup: {
    marginBottom: designTokens.spacing['3xl'],
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    flexWrap: 'wrap',
  },
  demoCard: {
    backgroundColor: designTokens.colors.neutral.background.primary,
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: designTokens.colors.neutral.border.default,
  },
  healthIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: designTokens.spacing.sm,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: designTokens.spacing.sm,
  },
  patternGroup: {
    marginBottom: designTokens.spacing['3xl'],
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.neutral.background.primary,
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.md,
    borderLeftWidth: 4,
    gap: designTokens.spacing.md,
  },
  emergencyIcon: {
    fontSize: 32,
  },
  emergencyContent: {
    flex: 1,
  },
  premiumCard: {
    backgroundColor: designTokens.colors.neutral.background.primary,
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  premiumBadge: {
    ...designTokens.typography.ui.caption,
    color: designTokens.colors.primary.loyal,
    fontWeight: '700',
    marginBottom: designTokens.spacing.xs,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.md,
    gap: designTokens.spacing.md,
  },
  successIcon: {
    fontSize: 32,
  },
  successContent: {
    flex: 1,
  },
});

export default StyleGuideDemo;