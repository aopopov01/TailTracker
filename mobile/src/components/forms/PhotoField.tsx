import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

interface PhotoFieldProps {
  label: string;
  photoUrl?: string;
  onSelectPhoto: () => void;
  required?: boolean;
  error?: string;
}

/**
 * Photo selection field with image preview
 * Handles image display and selection interaction
 */
export function PhotoField({
  label,
  photoUrl,
  onSelectPhoto,
  required = false,
  error,
}: PhotoFieldProps) {
  const hasError = Boolean(error);
  const hasPhoto = Boolean(photoUrl);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredIndicator}> *</Text>}
      </Text>
      
      <TouchableOpacity 
        style={styles.photoContainer} 
        onPress={onSelectPhoto}
      >
        {hasPhoto ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.placeholder, hasError && styles.placeholderError]}>
            <Ionicons name="camera" size={32} color={colors.gray400} />
            <Text style={styles.placeholderText}>Add Photo</Text>
          </View>
        )}
        
        <View style={styles.overlay}>
          <Ionicons name="camera" size={20} color={colors.white} />
        </View>
      </TouchableOpacity>
      
      {hasError && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  requiredIndicator: {
    color: colors.error,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  placeholderError: {
    borderColor: colors.error,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.error,
    marginTop: spacing.xs,
  },
});