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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';

interface VaccinationRecord {
  id: string;
  pet_id: string;
  vaccine_name: string;
  date_administered: string;
  next_due_date?: string;
  veterinarian: string;
  batch_number?: string;
  notes?: string;
  created_at: string;
}

export default function VaccinationListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const petId = route.params?.petId;
  const petName = route.params?.petName || 'Pet';
  const petSpecies = route.params?.petSpecies || 'dog';

  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVaccinations = async () => {
    try {
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('pet_id', petId)
        .order('date_administered', { ascending: false });

      if (error) throw error;
      setVaccinations(data || []);
    } catch (error) {
      console.error('Error loading vaccinations:', error);
      Alert.alert('Error', 'Failed to load vaccination records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVaccinations();
  };

  useFocusEffect(
    useCallback(() => {
      loadVaccinations();
    }, [petId])
  );

  const deleteVaccination = async (vaccinationId: string) => {
    Alert.alert(
      'Delete Vaccination Record',
      'Are you sure you want to delete this vaccination record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('vaccinations')
                .delete()
                .eq('id', vaccinationId);

              if (error) throw error;
              
              // Remove from local state
              setVaccinations(prev => prev.filter(v => v.id !== vaccinationId));
              Alert.alert('Success', 'Vaccination record deleted.');
            } catch (error) {
              console.error('Error deleting vaccination:', error);
              Alert.alert('Error', 'Failed to delete vaccination record.');
            }
          },
        },
      ]
    );
  };

  const getVaccinationStatus = (vaccination: VaccinationRecord) => {
    if (!vaccination.next_due_date) return { status: 'completed', color: colors.success };
    
    const now = new Date();
    const dueDate = new Date(vaccination.next_due_date);
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
      return { status: 'overdue', color: colors.error };
    } else if (daysDiff <= 30) {
      return { status: 'due_soon', color: colors.warning };
    } else {
      return { status: 'current', color: colors.success };
    }
  };

  const getStatusText = (status: string, daysDiff?: number) => {
    switch (status) {
      case 'overdue':
        return 'Overdue';
      case 'due_soon':
        return 'Due Soon';
      case 'current':
        return 'Current';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={colors.white} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{petName}'s Vaccinations</Text>
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddVaccination', { petId, petSpecies })}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderSummaryCard = () => {
    const upcomingVaccinations = vaccinations.filter(v => {
      if (!v.next_due_date) return false;
      const dueDate = new Date(v.next_due_date);
      const now = new Date();
      return dueDate.getTime() > now.getTime();
    }).length;

    const overdueVaccinations = vaccinations.filter(v => {
      if (!v.next_due_date) return false;
      const dueDate = new Date(v.next_due_date);
      const now = new Date();
      return dueDate.getTime() < now.getTime();
    }).length;

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{vaccinations.length}</Text>
          <Text style={styles.summaryLabel}>Total Records</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.warning }]}>
            {upcomingVaccinations}
          </Text>
          <Text style={styles.summaryLabel}>Due Soon</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.error }]}>
            {overdueVaccinations}
          </Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
      </View>
    );
  };

  const renderVaccinationItem = ({ item }: { item: VaccinationRecord }) => {
    const { status, color } = getVaccinationStatus(item);
    
    return (
      <View style={styles.vaccinationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.vaccineName} numberOfLines={2}>
              {item.vaccine_name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: color }]}>
              <Text style={styles.statusText}>{getStatusText(status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={styles.infoLabel}>Administered:</Text>
            <Text style={styles.infoValue}>
              {new Date(item.date_administered).toLocaleDateString()}
            </Text>
          </View>

          {item.next_due_date && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color={colors.warning} />
              <Text style={styles.infoLabel}>Next Due:</Text>
              <Text style={styles.infoValue}>
                {new Date(item.next_due_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="medical" size={16} color={colors.success} />
            <Text style={styles.infoLabel}>Veterinarian:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.veterinarian}
            </Text>
          </View>

          {item.batch_number && (
            <View style={styles.infoRow}>
              <Ionicons name="barcode" size={16} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Batch:</Text>
              <Text style={styles.infoValue}>{item.batch_number}</Text>
            </View>
          )}

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText} numberOfLines={3}>
                {item.notes}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditVaccination', { 
              vaccinationId: item.id,
              petId,
              petSpecies
            })}
          >
            <Ionicons name="create" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteVaccination(item.id)}
          >
            <Ionicons name="trash" size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medical" size={64} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No Vaccination Records</Text>
      <Text style={styles.emptySubtitle}>
        Keep track of {petName}'s vaccination history by adding records.
      </Text>
      <TouchableOpacity
        style={styles.emptyActionButton}
        onPress={() => navigation.navigate('AddVaccination', { petId, petSpecies })}
      >
        <Text style={styles.emptyActionButtonText}>Add First Vaccination</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading vaccination records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.gradient}
      >
        {renderHeader()}
      </LinearGradient>

      <View style={styles.content}>
        {vaccinations.length > 0 && renderSummaryCard()}
        
        {vaccinations.length > 0 ? (
          <FlatList
            data={vaccinations}
            renderItem={renderVaccinationItem}
            keyExtractor={(item) => item.id}
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
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
  vaccinationCard: {
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
  vaccineName: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 22,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  cardContent: {
    padding: spacing.md,
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
    backgroundColor: colors.primaryLight,
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
    backgroundColor: colors.errorLight,
  },
  deleteButtonText: {
    color: colors.error,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
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