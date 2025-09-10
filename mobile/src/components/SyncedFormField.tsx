/**
 * SyncedFormField Component
 * 
 * A form field component that automatically syncs changes between local and cloud databases.
 * Shows sync status and handles conflicts transparently for the user.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFieldSync } from '../hooks/useFieldSync';

interface SyncedFormFieldProps {
  localPetId: number;
  supabasePetId?: string;
  fieldName: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  maxLength?: number;
  editable?: boolean;
  required?: boolean;
  showSyncStatus?: boolean;
  debounceMs?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const SyncedFormField: React.FC<SyncedFormFieldProps> = ({
  localPetId,
  supabasePetId,
  fieldName,
  label,
  value,
  onValueChange,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  maxLength,
  editable = true,
  required = false,
  showSyncStatus = true,
  debounceMs = 1500,
  style,
  inputStyle,
  labelStyle
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    isSyncing,
    syncStatus,
    error,
    conflicts,
    syncField,
    resolveConflicts
  } = useFieldSync({
    localPetId,
    supabasePetId,
    debounceMs,
    autoResolveConflicts: true
  });

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
    setHasUnsavedChanges(false);
  }, [value]);

  /**
   * Handle input change
   */
  const handleValueChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    setHasUnsavedChanges(true);
    onValueChange(newValue);
    
    // Trigger sync if we have a Supabase pet ID
    if (supabasePetId) {
      syncField(fieldName, newValue);
    }
  }, [onValueChange, syncField, fieldName, supabasePetId]);

  /**
   * Get sync status icon and color
   */
  const getSyncStatusIcon = () => {
    if (!showSyncStatus || !supabasePetId) return null;

    if (isSyncing) {
      return (
        <View style={styles.syncStatus}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }

    switch (syncStatus) {
      case 'synced':
        return (
          <View style={styles.syncStatus}>
            <Ionicons name="cloud-done" size={16} color="#34C759" />
          </View>
        );
      case 'error':
        return (
          <View style={styles.syncStatus}>
            <Ionicons name="cloud-offline" size={16} color="#FF3B30" />
          </View>
        );
      case 'conflict':
        return (
          <View style={styles.syncStatus}>
            <Ionicons name="warning" size={16} color="#FF9500" />
          </View>
        );
      default:
        if (hasUnsavedChanges) {
          return (
            <View style={styles.syncStatus}>
              <Ionicons name="cloud-upload-outline" size={16} color="#8E8E93" />
            </View>
          );
        }
        return null;
    }
  };

  /**
   * Get sync status text
   */
  const getSyncStatusText = () => {
    if (!showSyncStatus || !supabasePetId) return null;

    if (isSyncing) return 'Syncing...';
    
    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'error':
        return 'Sync failed';
      case 'conflict':
        return 'Conflict detected';
      default:
        if (hasUnsavedChanges) return 'Pending sync';
        return null;
    }
  };

  /**
   * Handle conflict resolution
   */
  const handleResolveConflict = useCallback(async () => {
    if (conflicts.includes(fieldName)) {
      await resolveConflicts([{
        field: fieldName,
        resolution: 'local' // Use current local value
      }]);
    }
  }, [conflicts, fieldName, resolveConflicts]);

  const statusIcon = getSyncStatusIcon();
  const statusText = getSyncStatusText();
  const hasConflict = conflicts.includes(fieldName);
  const hasError = syncStatus === 'error';

  return (
    <View style={[styles.container, style]}>
      {/* Label with sync status */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {statusIcon}
      </View>

      {/* Input field */}
      <TextInput
        style={[
          styles.input,
          hasError && styles.inputError,
          hasConflict && styles.inputConflict,
          inputStyle
        ]}
        value={localValue}
        onChangeText={handleValueChange}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={editable}
        placeholderTextColor="#8E8E93"
      />

      {/* Status text and error/conflict handling */}
      {(statusText || error || hasConflict) && (
        <View style={styles.statusContainer}>
          {statusText && !error && !hasConflict && (
            <Text style={[
              styles.statusText,
              syncStatus === 'synced' && styles.statusTextSuccess,
              syncStatus === 'error' && styles.statusTextError
            ]}>
              {statusText}
            </Text>
          )}

          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}

          {hasConflict && (
            <View style={styles.conflictContainer}>
              <Text style={styles.conflictText}>
                This field has conflicting changes. Your local changes will be kept.
              </Text>
              <TouchableOpacity
                style={styles.resolveButton}
                onPress={handleResolveConflict}
              >
                <Text style={styles.resolveButtonText}>Resolve</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  required: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  syncStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    height: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1C1C1E',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  inputConflict: {
    borderColor: '#FF9500',
    backgroundColor: '#FFF9F0',
  },
  statusContainer: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusTextSuccess: {
    color: '#34C759',
  },
  statusTextError: {
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 2,
  },
  conflictContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    padding: 8,
    backgroundColor: '#FFF9F0',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  conflictText: {
    fontSize: 12,
    color: '#D60000',
    flex: 1,
    marginRight: 8,
  },
  resolveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SyncedFormField;