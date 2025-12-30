import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';

interface MedicalRecord {
  id: string;
  pet_id: string;
  record_type:
    | 'checkup'
    | 'surgery'
    | 'emergency'
    | 'prescription'
    | 'test_result'
    | 'other';
  title: string;
  description: string;
  date_of_record: string;
  veterinarian_id?: string | null;
  veterinarian?: any; // Optional joined veterinarian object
  cost?: number;
  notes?: string;
  document_urls?: string[] | null;
  created_at: string;
}

const RECORD_TYPE_INFO = {
  checkup: { label: 'Checkup', icon: 'medical', color: colors.success },
  surgery: { label: 'Surgery', icon: 'cut', color: colors.warning },
  emergency: { label: 'Emergency', icon: 'alert', color: colors.error },
  prescription: {
    label: 'Prescription',
    icon: 'medical',
    color: colors.primary,
  },
  test_result: {
    label: 'Test Result',
    icon: 'document-text',
    color: colors.info,
  },
  other: { label: 'Other', icon: 'ellipse', color: colors.textSecondary },
};

export default function MedicalRecordsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const petId = (route.params as any)?.petId;
  const petName = (route.params as any)?.petName || 'Pet';

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const loadMedicalRecords = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .order('date', { ascending: false });

      if (error) throw error;
      // NOTE: Type assertion needed - database schema differs from MedicalRecord interface
      setRecords((data || []) as any);
    } catch (error) {
      console.error('Error loading medical records:', error);
      Alert.alert('Error', 'Failed to load medical records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [petId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMedicalRecords();
  };

  useFocusEffect(
    useCallback(() => {
      loadMedicalRecords();
    }, [loadMedicalRecords])
  );

  const deleteRecord = async (recordId: string) => {
    Alert.alert(
      'Delete Medical Record',
      'Are you sure you want to delete this medical record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('medical_records')
                .delete()
                .eq('id', recordId);

              if (error) throw error;

              setRecords(prev => prev.filter(r => r.id !== recordId));
              Alert.alert('Success', 'Medical record deleted.');
            } catch (error) {
              console.error('Error deleting medical record:', error);
              Alert.alert('Error', 'Failed to delete medical record.');
            }
          },
        },
      ]
    );
  };

  const openAttachment = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to open attachment.');
    });
  };

  const getFilteredRecords = () => {
    if (selectedType === 'all') return records;
    return records.filter(record => record.record_type === selectedType);
  };

  const getTotalCost = () => {
    const filteredRecords = getFilteredRecords();
    return filteredRecords
      .filter(record => record.cost && record.cost > 0)
      .reduce((total, record) => total + (record.cost || 0), 0);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name='chevron-back' size={24} color={colors.white} />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{petName}'s Records</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          (navigation as any).navigate('AddMedicalRecord', { petId })
        }
      >
        <Ionicons name='add' size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabs}
      >
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedType === 'all' && styles.activeFilterTab,
          ]}
          onPress={() => setSelectedType('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedType === 'all' && styles.activeFilterTabText,
            ]}
          >
            All ({records.length})
          </Text>
        </TouchableOpacity>

        {Object.entries(RECORD_TYPE_INFO).map(([type, info]) => {
          const count = records.filter(r => r.record_type === type).length;
          if (count === 0) return null;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                selectedType === type && styles.activeFilterTab,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Ionicons
                name={info.icon as any}
                size={16}
                color={selectedType === type ? colors.primary : colors.gray400}
              />
              <Text
                style={[
                  styles.filterTabText,
                  selectedType === type && styles.activeFilterTabText,
                ]}
              >
                {info.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderSummaryCard = () => {
    const filteredRecords = getFilteredRecords();
    const totalCost = getTotalCost();
    const recentRecords = filteredRecords.filter(record => {
      const recordDate = new Date(record.date_of_record);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return recordDate >= thirtyDaysAgo;
    }).length;

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{filteredRecords.length}</Text>
          <Text style={styles.summaryLabel}>Total Records</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>
            {recentRecords}
          </Text>
          <Text style={styles.summaryLabel}>Last 30 Days</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.success }]}>
            ${totalCost.toFixed(0)}
          </Text>
          <Text style={styles.summaryLabel}>Total Cost</Text>
        </View>
      </View>
    );
  };

  const renderRecordItem = ({ item }: { item: MedicalRecord }) => {
    const typeInfo = RECORD_TYPE_INFO[item.record_type];

    return (
      <View style={styles.recordCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.typeContainer}>
              <View
                style={[
                  styles.typeIcon,
                  { backgroundColor: `${typeInfo.color}20` },
                ]}
              >
                <Ionicons
                  name={typeInfo.icon as any}
                  size={16}
                  color={typeInfo.color}
                />
              </View>
              <Text style={styles.recordTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <Text style={styles.recordDate}>
              {new Date(item.date_of_record).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.recordDescription} numberOfLines={3}>
            {item.description}
          </Text>

          <View style={styles.infoRow}>
            <Ionicons name='medical' size={16} color={colors.primary} />
            <Text style={styles.infoLabel}>Veterinarian:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.veterinarian}
            </Text>
          </View>

          {item.cost && item.cost > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name='card' size={16} color={colors.success} />
              <Text style={styles.infoLabel}>Cost:</Text>
              <Text style={styles.infoValue}>${item.cost.toFixed(2)}</Text>
            </View>
          )}

          {item.document_urls && item.document_urls.length > 0 && (
            <View style={styles.attachmentsContainer}>
              <Text style={styles.attachmentsLabel}>Attachments:</Text>
              <View style={styles.documentsList}>
                {item.document_urls.map((attachment, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.attachmentButton}
                    onPress={() => openAttachment(attachment)}
                  >
                    <Ionicons
                      name='document'
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.attachmentButtonText}>
                      File {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText} numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              (navigation as any).navigate('AddMedicalRecord', {
                petId,
                recordId: item.id,
              })
            }
          >
            <Ionicons name='create' size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteRecord(item.id)}
          >
            <Ionicons name='trash' size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name='document-text' size={64} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No Medical Records</Text>
      <Text style={styles.emptySubtitle}>
        {selectedType === 'all'
          ? `Keep track of ${petName}'s medical history by adding records.`
          : `No ${RECORD_TYPE_INFO[selectedType as keyof typeof RECORD_TYPE_INFO]?.label.toLowerCase()} records found.`}
      </Text>
      {selectedType === 'all' && (
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={() =>
            (navigation as any).navigate('AddMedicalRecord', { petId })
          }
        >
          <Text style={styles.emptyActionButtonText}>Add First Record</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary} />
          <Text style={styles.loadingText}>Loading medical records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredRecords = getFilteredRecords();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor={colors.primary} />

      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.gradient}
      >
        {renderHeader()}
      </LinearGradient>

      <View style={styles.content}>
        {records.length > 0 && (
          <>
            {renderFilterTabs()}
            {renderSummaryCard()}
          </>
        )}

        {filteredRecords.length > 0 ? (
          <FlatList
            data={filteredRecords}
            renderItem={renderRecordItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {renderEmptyState()}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  gradient: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  filterContainer: {
    paddingVertical: spacing.md,
  },
  filterTabs: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.xs,
  },
  activeFilterTab: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  activeFilterTabText: {
    color: colors.primary,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  recordCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  recordTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  recordDate: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardContent: {
    padding: spacing.md,
  },
  recordDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },
  attachmentsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  attachmentsLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  documentsList: {
    gap: spacing.sm,
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  attachmentButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  notesContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.errorContainer,
  },
  deleteButtonText: {
    color: colors.error,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['6xl'],
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyActionButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white,
  },
});
