import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Vaccination } from '@/services/HealthRecordsService';
import { formatDate, isDateInPast, getDaysUntilDate } from '@/utils/dateUtils';

interface VaccinationCardProps {
  vaccination: Vaccination;
  onPress: (vaccination: Vaccination) => void;
  onEdit?: (vaccination: Vaccination) => void;
  onDelete?: (vaccination: Vaccination) => void;
}

export const VaccinationCard: React.FC<VaccinationCardProps> = ({
  vaccination,
  onPress,
  onEdit,
  onDelete
}) => {
  const isOverdue = vaccination.next_due_date && isDateInPast(vaccination.next_due_date);
  const isDueSoon = vaccination.next_due_date && getDaysUntilDate(vaccination.next_due_date) <= 30 && getDaysUntilDate(vaccination.next_due_date) > 0;
  
  const getStatusColor = () => {
    if (isOverdue) return '#E74C3C';
    if (isDueSoon) return '#F39C12';
    return '#27AE60';
  };

  const getStatusText = () => {
    if (!vaccination.next_due_date) return 'Complete';
    if (isOverdue) return 'Overdue';
    if (isDueSoon) return `Due in ${getDaysUntilDate(vaccination.next_due_date)} days`;
    return 'Up to date';
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: getStatusColor() }]}
      onPress={() => onPress(vaccination)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.vaccineName}>{vaccination.vaccine_name}</Text>
          <Text style={styles.date}>
            Administered: {formatDate(vaccination.date_administered)}
          </Text>
          {vaccination.next_due_date && (
            <Text style={styles.nextDue}>
              Next due: {formatDate(vaccination.next_due_date)}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(vaccination)}
              style={styles.actionButton}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(vaccination)}
              style={styles.actionButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {vaccination.veterinarian && (
        <Text style={styles.veterinarian}>
          Administered by: Dr. {vaccination.veterinarian.name}
          {vaccination.veterinarian.clinic_name && ` - ${vaccination.veterinarian.clinic_name}`}
        </Text>
      )}

      {vaccination.batch_number && (
        <Text style={styles.batchNumber}>Batch: {vaccination.batch_number}</Text>
      )}

      {vaccination.certificate_photo_url && (
        <View style={styles.certificateContainer}>
          <Image 
            source={{ uri: vaccination.certificate_photo_url }}
            style={styles.certificateThumbnail}
            resizeMode="cover"
          />
          <Text style={styles.certificateLabel}>Certificate</Text>
        </View>
      )}

      {vaccination.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          Notes: {vaccination.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  vaccineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  nextDue: {
    fontSize: 14,
    color: '#34495E',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editText: {
    color: '#3498DB',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  veterinarian: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
    marginBottom: 6,
  },
  batchNumber: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  certificateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  certificateThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
  },
  certificateLabel: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '500',
  },
  notes: {
    fontSize: 13,
    color: '#95A5A6',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});