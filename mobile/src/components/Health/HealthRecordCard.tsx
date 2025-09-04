import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { HealthRecord } from '@/services/HealthRecordsService';
import { formatDate } from '@/utils/dateUtils';

interface HealthRecordCardProps {
  record: HealthRecord;
  onPress: (record: HealthRecord) => void;
  onEdit?: (record: HealthRecord) => void;
  onDelete?: (record: HealthRecord) => void;
}

export const HealthRecordCard: React.FC<HealthRecordCardProps> = ({
  record,
  onPress,
  onEdit,
  onDelete
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(record)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{record.title}</Text>
          <Text style={styles.date}>{formatDate(record.record_date)}</Text>
        </View>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(record)}
              style={styles.actionButton}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(record)}
              style={styles.actionButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {record.description && (
        <Text style={styles.description} numberOfLines={2}>
          {record.description}
        </Text>
      )}

      <View style={styles.details}>
        {record.veterinarian && (
          <Text style={styles.veterinarian}>
            Dr. {record.veterinarian.name}
            {record.veterinarian.clinic_name && ` - ${record.veterinarian.clinic_name}`}
          </Text>
        )}
        
        {record.weight && (
          <Text style={styles.measurement}>Weight: {record.weight} kg</Text>
        )}
        
        {record.temperature && (
          <Text style={styles.measurement}>Temperature: {record.temperature}°C</Text>
        )}
      </View>

      {record.photos && record.photos.length > 0 && (
        <View style={styles.photosContainer}>
          <View style={styles.photoPreview}>
            <Image 
              source={{ uri: record.photos[0].photo_url }}
              style={styles.photoThumbnail}
              resizeMode="cover"
            />
            {record.photos.length > 1 && (
              <View style={styles.morePhotosOverlay}>
                <Text style={styles.morePhotosText}>+{record.photos.length - 1}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {record.notes && (
        <Text style={styles.notes} numberOfLines={1}>
          Notes: {record.notes}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#7F8C8D',
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
  description: {
    fontSize: 14,
    color: '#34495E',
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    marginBottom: 12,
  },
  veterinarian: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
    marginBottom: 4,
  },
  measurement: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  photosContainer: {
    marginBottom: 8,
  },
  photoPreview: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  morePhotosOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notes: {
    fontSize: 12,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
});