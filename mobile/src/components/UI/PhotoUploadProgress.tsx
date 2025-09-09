/**
 * TailTracker Photo Upload Progress Component
 * 
 * Beautiful photo upload with progress animations, previews,
 * and delightful feedback that makes uploading feel instant.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

import premiumAnimations from '../../design-system/animations/premiumAnimations';
import { useMaterialTheme } from '../../theme/MaterialThemeProvider';
import hapticUtils from '../../utils/hapticUtils';

const { width: screenWidth } = Dimensions.get('window');

// ====================================
// TYPES AND INTERFACES
// ====================================

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface PhotoUploadProps {
  photo?: {
    uri: string;
    width?: number;
    height?: number;
    type?: string;
    name?: string;
  };
  progress?: UploadProgress;
  status: 'idle' | 'selecting' | 'uploading' | 'success' | 'error';
  onSelectPhoto?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  title?: string;
  subtitle?: string;
  maxWidth?: number;
  maxHeight?: number;
  borderRadius?: number;
  showProgress?: boolean;
  hapticFeedback?: boolean;
  style?: ViewStyle;
}

// ====================================
// PHOTO UPLOAD PROGRESS COMPONENT
// ====================================

export const PhotoUploadProgress: React.FC<PhotoUploadProps> = ({
  photo,
  progress = { loaded: 0, total: 100, percentage: 0 },
  status,
  onSelectPhoto,
  onCancel,
  onRetry,
  title = "Add Photo",
  subtitle = "Tap to select or take a photo",
  maxWidth = screenWidth - 32,
  maxHeight = 200,
  borderRadius = 16,
  showProgress = true,
  hapticFeedback = true,
  style,
}) => {
  const { theme } = useMaterialTheme();
  
  // Animation values
  const containerScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const progressOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);
  const errorShake = useSharedValue(0);
  const imageOpacity = useSharedValue(0);
  const placeholderOpacity = useSharedValue(1);
  
  // State
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // ====================================
  // STATE ANIMATION HANDLERS
  // ====================================
  
  const handleSelectingState = useCallback(() => {
    containerScale.value = withSequence(
      withTiming(0.95, premiumAnimations.timings.quick),
      withSpring(1)
    );
    
    if (hapticFeedback) {
      runOnJS(hapticUtils.feedback)('light');
    }
  }, [hapticFeedback, containerScale]);
  
  const handleUploadingState = useCallback(() => {
    overlayOpacity.value = withTiming(0.8, premiumAnimations.timings.standard);
    progressOpacity.value = withTiming(1, premiumAnimations.timings.standard);
    
    if (hapticFeedback) {
      runOnJS(hapticUtils.feedback)('medium');
    }
  }, [hapticFeedback, overlayOpacity, progressOpacity]);
  
  const handleSuccessState = useCallback(() => {
    overlayOpacity.value = withTiming(0, premiumAnimations.timings.standard);
    progressOpacity.value = withTiming(0, premiumAnimations.timings.fast);
    
    const successAnimation = premiumAnimations.success.checkmark();
    successScale.value = withTiming(successAnimation.scale, premiumAnimations.timings.standard);
    
    if (hapticFeedback) {
      runOnJS(hapticUtils.success)();
    }
    
    // Hide success indicator after animation
    setTimeout(() => {
      successScale.value = withTiming(0, premiumAnimations.timings.standard);
    }, 2000);
  }, [hapticFeedback, overlayOpacity, progressOpacity, successScale]);
  
  const handleErrorState = useCallback(() => {
    overlayOpacity.value = withTiming(0, premiumAnimations.timings.fast);
    progressOpacity.value = withTiming(0, premiumAnimations.timings.fast);
    
    const errorAnimation = premiumAnimations.forms.error();
    errorShake.value = withSequence(...errorAnimation.translateX.map((x: number) => withTiming(x, { duration: 50 })));
    
    if (hapticFeedback) {
      runOnJS(hapticUtils.error)();
    }
  }, [hapticFeedback, errorShake, overlayOpacity, progressOpacity]);
  
  const handleIdleState = useCallback(() => {
    overlayOpacity.value = withTiming(0, premiumAnimations.timings.standard);
    progressOpacity.value = withTiming(0, premiumAnimations.timings.fast);
    successScale.value = withTiming(0, premiumAnimations.timings.fast);
    errorShake.value = withTiming(0, premiumAnimations.timings.fast);
  }, [errorShake, overlayOpacity, progressOpacity, successScale]);
  
  // ====================================
  // ANIMATION EFFECTS
  // ====================================
  
  // Handle status changes
  useEffect(() => {
    switch (status) {
      case 'selecting':
        handleSelectingState();
        break;
      case 'uploading':
        handleUploadingState();
        break;
      case 'success':
        handleSuccessState();
        break;
      case 'error':
        handleErrorState();
        break;
      default:
        handleIdleState();
        break;
    }
  }, [status, handleErrorState, handleIdleState, handleSelectingState, handleSuccessState, handleUploadingState]);
  
  // Handle progress changes
  useEffect(() => {
    if (status === 'uploading' && showProgress) {
      progressWidth.value = withSpring(
        (progress.percentage / 100) * (maxWidth - 32)
      );
    }
  }, [progress.percentage, status, showProgress, maxWidth, progressWidth]);
  
  // Handle photo changes
  useEffect(() => {
    if (photo?.uri) {
      placeholderOpacity.value = withTiming(0, premiumAnimations.timings.fast);
      setImageLoaded(false);
    } else {
      placeholderOpacity.value = withTiming(1, premiumAnimations.timings.fast);
      imageOpacity.value = withTiming(0, premiumAnimations.timings.fast);
    }
  }, [photo?.uri, imageOpacity, placeholderOpacity]);
  
  // ====================================
  // EVENT HANDLERS
  // ====================================
  
  const handlePress = useCallback(() => {
    if (status === 'error') {
      onRetry?.();
    } else if (status === 'idle' || status === 'success') {
      onSelectPhoto?.();
    }
  }, [status, onRetry, onSelectPhoto]);
  
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    imageOpacity.value = withSpring(1);
  }, [imageOpacity]);
  
  // ====================================
  // ANIMATED STYLES
  // ====================================
  
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: containerScale.value },
        { translateX: errorShake.value },
      ],
    };
  });
  
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: progressWidth.value,
      opacity: progressOpacity.value,
    };
  });
  
  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });
  
  const animatedSuccessStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: successScale.value }],
      opacity: successScale.value,
    };
  });
  
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
    };
  });
  
  const animatedPlaceholderStyle = useAnimatedStyle(() => {
    return {
      opacity: placeholderOpacity.value,
    };
  });
  
  // ====================================
  // RENDER HELPERS
  // ====================================
  
  const renderPlaceholder = () => (
    <Animated.View style={[styles.placeholder, animatedPlaceholderStyle]}>
      <LinearGradient
        colors={[theme.colors.primary, `${theme.colors.primary}80`]}
        style={styles.placeholderGradient}
      >
        <Ionicons
          name="camera-outline"
          size={48}
          color="#FFFFFF"
          style={styles.placeholderIcon}
        />
        <Text style={styles.placeholderTitle}>{title}</Text>
        <Text style={styles.placeholderSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </Animated.View>
  );
  
  const renderPhoto = () => {
    if (!photo?.uri) return null;
    
    return (
      <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          onLoad={handleImageLoad}
          resizeMode="cover"
        />
      </Animated.View>
    );
  };
  
  const renderProgressOverlay = () => (
    <Animated.View style={[styles.progressOverlay, animatedOverlayStyle]}>
      <BlurView intensity={20} tint="dark" style={styles.progressBlur}>
        <View style={styles.progressContent}>
          <Text style={styles.progressTitle}>Uploading...</Text>
          <Text style={styles.progressPercentage}>{Math.round(progress.percentage)}%</Text>
          
          {showProgress && (
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, animatedProgressStyle]}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
          )}
          
          <Text style={styles.progressDetails}>
            {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
          </Text>
          
          {onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );
  
  const renderSuccessIndicator = () => (
    <Animated.View style={[styles.successIndicator, animatedSuccessStyle]}>
      <View style={styles.successBackground}>
        <Ionicons name="checkmark-circle" size={60} color="#10B981" />
      </View>
    </Animated.View>
  );
  
  const renderErrorState = () => {
    if (status !== 'error') return null;
    
    return (
      <View style={styles.errorOverlay}>
        <Ionicons name="alert-circle" size={32} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Upload failed
        </Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: theme.colors.error }]}
            onPress={onRetry}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.error }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  const renderCancelButton = () => {
    if (status !== 'uploading' || !onCancel) return null;
    
    return (
      <TouchableOpacity
        style={styles.topRightButton}
        onPress={onCancel}
      >
        <View style={styles.topButtonBackground}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  };
  
  // ====================================
  // UTILS
  // ====================================
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };
  
  const getContainerHeight = () => {
    if (photo?.uri && imageLoaded) {
      const { width: imgWidth, height: imgHeight } = photo;
      if (imgWidth && imgHeight) {
        const aspectRatio = imgHeight / imgWidth;
        const calculatedHeight = Math.min(maxWidth * aspectRatio, maxHeight);
        return Math.max(calculatedHeight, 120);
      }
    }
    return 200;
  };
  
  // ====================================
  // RENDER COMPONENT
  // ====================================
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: maxWidth,
          height: getContainerHeight(),
          borderRadius,
        },
        animatedContainerStyle,
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        disabled={status === 'uploading'}
        activeOpacity={0.9}
      >
        {renderPlaceholder()}
        {renderPhoto()}
        {renderProgressOverlay()}
        {renderSuccessIndicator()}
        {renderErrorState()}
        {renderCancelButton()}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  touchable: {
    flex: 1,
  },
  
  // Placeholder
  placeholder: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderIcon: {
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // Image
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  
  // Progress Overlay
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  progressBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContent: {
    alignItems: 'center',
    padding: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressDetails: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  
  // Success Indicator
  successIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Error State
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Top Right Button
  topRightButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  topButtonBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PhotoUploadProgress;