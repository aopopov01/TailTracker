import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

interface DataCategory {
  id: string;
  title: string;
  description: string;
  size: string;
  icon: string;
  color: string;
}

export default function DataManagementScreen() {
  const navigation = useNavigation();
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const dataCategories: DataCategory[] = [
    {
      id: 'pets',
      title: 'Pet Profiles',
      description: 'Pet information, photos, and medical records',
      size: '2.4 MB',
      icon: 'paw',
      color: colors.primary,
    },
    {
      id: 'vaccinations',
      title: 'Vaccination Records',
      description: 'Vaccination history and reminders',
      size: '0.8 MB',
      icon: 'medical',
      color: colors.success,
    },
    {
      id: 'photos',
      title: 'Photos & Videos',
      description: 'Pet photos and videos stored locally',
      size: '15.2 MB',
      icon: 'camera',
      color: colors.warning,
    },
    {
      id: 'location',
      title: 'Location History',
      description: 'GPS tracking and location data',
      size: '1.1 MB',
      icon: 'location',
      color: colors.info,
    },
    {
      id: 'cache',
      title: 'App Cache',
      description: 'Temporary files and cached data',
      size: '5.7 MB',
      icon: 'server',
      color: colors.textSecondary,
    },
  ];

  const totalSize = dataCategories.reduce((sum, category) => {
    const sizeNum = parseFloat(category.size.replace(' MB', ''));
    return sum + sizeNum;
  }, 0);

  const exportAllData = async () => {
    Alert.alert(
      'Export All Data',
      'This will create a complete backup of your TailTracker data in JSON format. The export will be emailed to your registered address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setIsExporting(true);
            try {
              // Simulate export process
              await new Promise(resolve => setTimeout(resolve, 3000));
              Alert.alert(
                'Export Complete',
                'Your data export has been emailed to you. Please check your inbox.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Export Failed', 'Unable to export data. Please try again.');
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  const exportCategory = (category: DataCategory) => {
    Alert.alert(
      `Export ${category.title}`,
      `Export only ${category.title.toLowerCase()} data to a file?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            console.log(`Exporting ${category.id} data`);
            Alert.alert('Export Started', `Exporting ${category.title}...`);
          },
        },
      ]
    );
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will delete temporary files and cached data to free up space. Your personal data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              // Simulate cache clearing
              await new Promise(resolve => setTimeout(resolve, 2000));
              Alert.alert('Cache Cleared', 'Successfully cleared 5.7 MB of cached data.');
            } catch (error) {
              Alert.alert('Error', 'Unable to clear cache. Please try again.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const manageStorage = () => {
    Alert.alert(
      'Storage Management',
      'Open device storage settings to manage TailTracker data and permissions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings' },
      ]
    );
  };

  const syncData = () => {
    Alert.alert(
      'Sync Data',
      'Manually sync your data with cloud storage. This will upload any pending changes and download the latest data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync Now',
          onPress: () => {
            console.log('Starting manual sync');
            Alert.alert('Sync Started', 'Syncing your data...');
          },
        },
      ]
    );
  };

  const renderDataCategory = (category: DataCategory) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryItem}
      onPress={() => exportCategory(category)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
        <Ionicons name={category.icon as any} size={20} color={category.color} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
      </View>
      <View style={styles.categoryMeta}>
        <Text style={styles.categorySize}>{category.size}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
      </View>
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
        <Text style={styles.headerTitle}>Data Management</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Storage Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Overview</Text>
          
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <Ionicons name="pie-chart" size={24} color={colors.primary} />
              <View style={styles.storageInfo}>
                <Text style={styles.storageTitle}>Total Data Size</Text>
                <Text style={styles.storageSize}>{totalSize.toFixed(1)} MB</Text>
              </View>
            </View>
            <Text style={styles.storageDescription}>
              Data stored locally on your device. Cloud backup is automatically synced.
            </Text>
          </View>
        </View>

        {/* Data Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Categories</Text>
          <View style={styles.categoriesContainer}>
            {dataCategories.map(renderDataCategory)}
          </View>
        </View>

        {/* Data Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={exportAllData} disabled={isExporting}>
            <Ionicons name="download" size={20} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Export All Data</Text>
              <Text style={styles.actionDescription}>
                Download complete backup of all your TailTracker data
              </Text>
            </View>
            {isExporting ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={syncData}>
            <Ionicons name="sync" size={20} color={colors.success} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Sync Data</Text>
              <Text style={styles.actionDescription}>
                Manually sync with cloud storage
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={clearCache} disabled={isClearing}>
            <Ionicons name="refresh" size={20} color={colors.warning} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Clear Cache</Text>
              <Text style={styles.actionDescription}>
                Free up space by clearing temporary files
              </Text>
            </View>
            {isClearing ? (
              <ActivityIndicator color={colors.warning} />
            ) : (
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={manageStorage}>
            <Ionicons name="settings" size={20} color={colors.textSecondary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Storage Settings</Text>
              <Text style={styles.actionDescription}>
                Manage app storage and permissions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Data Policy Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Policy</Text>
          
          <View style={styles.policyCard}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <View style={styles.policyContent}>
              <Text style={styles.policyTitle}>Data Retention Policy</Text>
              <Text style={styles.policyDescription}>
                • Pet medical records: Kept for 7 years{'\n'}
                • Location data: Automatically deleted after 30 days{'\n'}
                • Photos: Stored until manually deleted{'\n'}
                • Cache: Cleared automatically when needed
              </Text>
            </View>
          </View>

          <View style={styles.policyCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <View style={styles.policyContent}>
              <Text style={styles.policyTitle}>Data Security</Text>
              <Text style={styles.policyDescription}>
                All data is encrypted at rest and in transit. Cloud backups are automatically encrypted with your device key.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}const styles = StyleSheet.create({
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
  storageCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  storageInfo: {
    marginLeft: spacing.md,
  },
  storageTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  storageSize: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  storageDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  categoriesContainer: {
    backgroundColor: colors.white,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  categoryMeta: {
    alignItems: 'flex-end',
  },
  categorySize: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  actionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  policyCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  policyContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  policyTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  policyDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});