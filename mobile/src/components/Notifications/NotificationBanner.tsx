/**
 * TailTracker In-App Notification Banner
 * 
 * This component displays in-app notifications when the app is active,
 * providing consistent UX across platforms as identified in the QA report.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  State,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 100;
const ANIMATION_DURATION = 300;
const AUTO_DISMISS_DURATION = 5000;

export interface NotificationBannerData {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  priority: 'low' | 'default' | 'high' | 'critical';
  type: string;
  actions?: Array<{
    id: string;
    title: string;
    style?: 'default' | 'destructive';
  }>;
  onPress?: () => void;
  onDismiss?: () => void;
  onActionPress?: (actionId: string) => void;
}

interface NotificationBannerProps {
  notification: NotificationBannerData | null;
  onDismiss: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<NotificationBannerData | null>(null);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-BANNER_HEIGHT - insets.top - 20)).current;
  const panAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Auto-dismiss timer
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (notification && !isVisible) {
      showNotification(notification);
    } else if (!notification && isVisible) {
      hideNotification();
    }
  }, [notification, isVisible]);

  const showNotification = (notif: NotificationBannerData) => {
    setCurrentNotification(notif);
    setIsVisible(true);
    
    // Haptic feedback based on priority
    if (notif.priority === 'critical') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (notif.priority === 'high') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    // Auto-dismiss timer (unless critical)
    if (notif.priority !== 'critical') {
      dismissTimer.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_DURATION);
    }
  };

  const hideNotification = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -BANNER_HEIGHT - insets.top - 20,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      setCurrentNotification(null);
      slideAnim.setValue(-BANNER_HEIGHT - insets.top - 20);
      panAnim.setValue(0);
      scaleAnim.setValue(0.95);
    });
  };

  const handleDismiss = () => {
    if (currentNotification) {
      onDismiss(currentNotification.id);
      currentNotification.onDismiss?.();
    }
  };

  const handlePress = () => {
    if (currentNotification?.onPress) {
      currentNotification.onPress();
      handleDismiss();
    }
  };

  const handleActionPress = (actionId: string) => {
    if (currentNotification?.onActionPress) {
      currentNotification.onActionPress(actionId);
      handleDismiss();
    }
  };

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: panAnim } }],
    { useNativeDriver: true }
  );

  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Dismiss if swiped up significantly or with high velocity
      if (translationY < -50 || velocityY < -500) {
        Animated.timing(panAnim, {
          toValue: -200,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          handleDismiss();
        });
      } else {
        // Snap back to original position
        Animated.spring(panAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  if (!isVisible || !currentNotification) {
    return null;
  }

  const bannerStyle = {
    backgroundColor: getPriorityColor(currentNotification.priority),
    borderLeftColor: getPriorityAccentColor(currentNotification.priority),
  };

  const transformStyle = {
    transform: [
      { translateY: Animated.add(slideAnim, panAnim) },
      { scale: scaleAnim },
    ],
  };

  return (
    <PanGestureHandler
      onGestureEvent={handlePanGestureEvent}
      onHandlerStateChange={handlePanStateChange}
    >
      <Animated.View
        style={[
          styles.container,
          { paddingTop: insets.top + 10 },
          transformStyle,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          style={[styles.banner, bannerStyle]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={95} tint="light" style={styles.blurView} />
          ) : (
            <View style={[styles.blurView, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]} />
          )}
          
          <View style={styles.content}>
            {/* Icon or Image */}
            <View style={styles.iconContainer}>
              {currentNotification.imageUrl ? (
                <Image
                  source={{ uri: currentNotification.imageUrl }}
                  style={styles.notificationImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.iconBackground, { backgroundColor: getPriorityAccentColor(currentNotification.priority) }]}>
                  <Ionicons
                    name={currentNotification.icon || getDefaultIcon(currentNotification.type)}
                    size={24}
                    color="#FFF"
                  />
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {currentNotification.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {currentNotification.body}
              </Text>
              
              {/* Actions */}
              {currentNotification.actions && currentNotification.actions.length > 0 && (
                <View style={styles.actionsContainer}>
                  {currentNotification.actions.slice(0, 2).map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      onPress={() => handleActionPress(action.id)}
                      style={[
                        styles.actionButton,
                        action.style === 'destructive' && styles.destructiveActionButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          action.style === 'destructive' && styles.destructiveActionButtonText,
                        ]}
                      >
                        {action.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.dismissButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Priority Indicator */}
          <View style={styles.priorityIndicator} />
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

// Helper functions
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return 'rgba(255, 59, 48, 0.1)';
    case 'high':
      return 'rgba(255, 149, 0, 0.1)';
    case 'low':
      return 'rgba(142, 142, 147, 0.1)';
    default:
      return 'rgba(0, 122, 255, 0.1)';
  }
};

const getPriorityAccentColor = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return '#FF3B30';
    case 'high':
      return '#FF9500';
    case 'low':
      return '#8E8E93';
    default:
      return '#007AFF';
  }
};

const getDefaultIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'lost_pet_alert':
    case 'emergency_alert':
      return 'alert-circle';
    case 'pet_found':
      return 'heart';
    case 'vaccination_reminder':
    case 'medication_reminder':
      return 'medical';
    case 'appointment_reminder':
      return 'calendar';
    case 'location_alert':
      return 'location';
    case 'family_invite':
      return 'people';
    case 'social_interaction':
      return 'chatbubble';
    default:
      return 'notifications';
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  banner: {
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    minHeight: BANNER_HEIGHT,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  destructiveActionButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  destructiveActionButtonText: {
    color: '#FFF',
  },
  dismissButton: {
    padding: 4,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});