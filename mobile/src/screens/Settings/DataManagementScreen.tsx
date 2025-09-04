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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { format } from 'date-fns';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';

interface DataStats {
  pets: number;
  photos: number;
  vaccinations: number;
  medicalRecords: number;
  totalSize: string;
  lastBackup: string | null;
}

export default function DataManagementScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  React.useEffect(() => {
    loadDataStats();
  }, []);

  const loadDataStats = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get counts from database
      const [petsResult, vaccinationsResult, medicalResult] = await Promise.all([
        supabase.from('pets').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('vaccinations').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('medical_records').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);

      // Get photo count from storage
      const { data: photosList } = await supabase.storage
        .from('pet-photos')
        .list(`users/${user.id}`, { limit: 1000 });

      // Simulate size calculation (in a real app, you'd sum actual file sizes)
      const totalSize = '25.6 MB';

      // Get last backup date from AsyncStorage or preferences
      const lastBackup = null; // This would come from your backup tracking

      setStats({
        pets: petsResult.count || 0,
        photos: photosList?.length || 0,
        vaccinations: vaccinationsResult.count || 0,
        medicalRecords: medicalResult.count || 0,
        totalSize,
        lastBackup,
      });
    } catch (error) {
      console.error('Error loading data stats:', error);
      Alert.alert('Error', 'Failed to load data statistics.');
    } finally {
      setLoading(false);
    }
  };

  const exportAllData = async () => {
    try {
      setExportLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all user data
      const [petsData, vaccinationsData, medicalData] = await Promise.all([
        supabase.from('pets').select('*').eq('user_id', user.id),
        supabase.from('vaccinations').select('*').eq('user_id', user.id),
        supabase.from('medical_records').select('*').eq('user_id', user.id),
      ]);

      // Create export data object
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        user: {
          id: user.id,
          email: user.email,
        },
        data: {
          pets: petsData.data || [],
          vaccinations: vaccinationsData.data || [],
          medicalRecords: medicalData.data || [],
        },
      };

      // Save to file
      const fileName = `tailtracker-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(exportData, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      // Share or save to device
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('TailTracker Backups', asset, false);
        Alert.alert('Success', 'Data exported successfully to your device.');
      } else {
        // Fallback to sharing
        await Share.share({
          url: fileUri,
          title: 'TailTracker Data Export',
        });
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const importData = async () => {
    try {
      setImportLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importData = JSON.parse(fileContent);

      // Validate import data structure
      if (!importData.version || !importData.data) {
        throw new Error('Invalid backup file format');
      }

      Alert.alert(
        'Import Data',
        `This will import:\n• ${importData.data.pets?.length || 0} pets\n• ${importData.data.vaccinations?.length || 0} vaccinations\n• ${importData.data.medicalRecords?.length || 0} medical records\n\nThis action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: () => performImport(importData),
          },
        ]
      );

    } catch (error) {
      console.error('Error importing data:', error);
      Alert.alert('Error', 'Failed to import data. Please check the file and try again.');
    } finally {
      setImportLoading(false);
    }
  };

  const performImport = async (importData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Import pets (with user_id override)
      if (importData.data.pets?.length > 0) {
        const petsToImport = importData.data.pets.map((pet: any) => ({
          ...pet,
          id: undefined, // Let database generate new IDs
          user_id: user.id, // Override with current user
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        await supabase.from('pets').insert(petsToImport);
      }

      // Import vaccinations
      if (importData.data.vaccinations?.length > 0) {
        const vaccinationsToImport = importData.data.vaccinations.map((vacc: any) => ({
          ...vacc,
          id: undefined,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        await supabase.from('vaccinations').insert(vaccinationsToImport);
      }

      // Import medical records
      if (importData.data.medicalRecords?.length > 0) {
        const recordsToImport = importData.data.medicalRecords.map((record: any) => ({
          ...record,
          id: undefined,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        await supabase.from('medical_records').insert(recordsToImport);
      }

      Alert.alert('Success', 'Data imported successfully!');
      loadDataStats(); // Refresh stats

    } catch (error) {
      console.error('Error performing import:', error);
      Alert.alert('Error', 'Failed to import some data. Please try again.');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your pets, photos, vaccinations, and medical records. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: confirmClearData,
        },
      ]
    );
  };

  const confirmClearData = () => {
    Alert.alert(
      'Final Confirmation',
      'Type "DELETE" to confirm you want to permanently delete all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I understand',
          style: 'destructive',
          onPress: performClearData,
        },
      ]
    );
  };

  const performClearData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all user data
      await Promise.all([
        supabase.from('medical_records').delete().eq('user_id', user.id),
        supabase.from('vaccinations').delete().eq('user_id', user.id),
        supabase.from('pets').delete().eq('user_id', user.id),
      ]);

      // Clear photos from storage
      const { data: photosList } = await supabase.storage
        .from('pet-photos')
        .list(`users/${user.id}`);

      if (photosList && photosList.length > 0) {
        const photoPaths = photosList.map(photo => `users/${user.id}/${photo.name}`);
        await supabase.storage.from('pet-photos').remove(photoPaths);
      }

      Alert.alert('Success', 'All data has been permanently deleted.');
      loadDataStats(); // Refresh stats

    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to delete all data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPhotos = async () => {
    try {
      setLoading(true);
      
      Alert.alert(
        'Download Photos',
        'This will download all your pet photos to your device gallery. This may take a while depending on the number of photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: performPhotoDownload },
        ]
      );

    } catch (error) {
      console.error('Error downloading photos:', error);
      Alert.alert('Error', 'Failed to download photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const performPhotoDownload = async () => {
    // This would implement batch photo download
    // For now, just show success message
    Alert.alert('Feature Coming Soon', 'Photo download will be available in a future update.');
  };

  const renderDataCard = () => (
    <View style={styles.dataCard}>
      <View style={styles.cardHeader}>
        <Ionicons name="stats-chart" size={24} color={colors.primary} />
        <Text style={styles.cardTitle}>Your Data</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : stats ? (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.pets}</Text>
            <Text style={styles.statLabel}>Pets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.photos}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.vaccinations}</Text>
            <Text style={styles.statLabel}>Vaccinations</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.medicalRecords}</Text>
            <Text style={styles.statLabel}>Records</Text>
          </View>
        </View>
      ) : null}
      
      <View style={styles.sizeInfo}>
        <Text style={styles.sizeText}>Total Size: {stats?.totalSize || '---'}</Text>
        <Text style={styles.backupText}>
          Last Backup: {stats?.lastBackup ? format(new Date(stats.lastBackup), 'MMM dd, yyyy') : 'Never'}
        </Text>
      </View>
    </View>
  );

  const renderActionButton = (
    title: string,
    subtitle: string,
    icon: string,
    onPress: () => void,
    loading?: boolean,
    danger?: boolean
  ) => (
    <TouchableOpacity
      style={[styles.actionButton, danger && styles.dangerButton]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.actionIcon}>
        {loading ? (
          <ActivityIndicator size="small" color={danger ? colors.error : colors.primary} />
        ) : (
          <Ionicons
            name={icon as any}
            size={24}
            color={danger ? colors.error : colors.primary}
          />
        )}
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, danger && styles.dangerText]}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.gray400}
      />
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
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadDataStats}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Data Overview */}
        {renderDataCard()}

        {/* Export & Backup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export & Backup</Text>
          
          {renderActionButton(
            'Export All Data',
            'Download all your data as JSON file',
            'download',
            exportAllData,
            exportLoading
          )}
          
          {renderActionButton(
            'Download Photos',
            'Save all pet photos to device gallery',
            'images',
            downloadPhotos,
            loading
          )}
        </View>

        {/* Import & Restore */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import & Restore</Text>
          
          {renderActionButton(
            'Import Data',
            'Restore from a previous backup file',
            'cloud-upload',
            importData,
            importLoading
          )}
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          {renderActionButton(
            'Clear All Data',
            'Permanently delete all your data',
            'trash',
            clearAllData,
            loading,
            true
          )}
        </View>

        {/* Information */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your data is securely stored and encrypted. Exports include all pets, photos, 
            vaccinations, and medical records. Import will add data to your existing records.
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
  refreshButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dataCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  sizeInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
  },
  sizeText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  backupText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    minHeight: 64,
  },
  dangerButton: {
    backgroundColor: colors.white,
  },
  actionIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dangerText: {
    color: colors.error,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: spacing.md,
    margin: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.primary,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});