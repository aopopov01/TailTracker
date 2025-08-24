import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  SlideInUp,
  SlideInDown,
  FadeIn,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Consistent color palette
const COLORS = {
  lightCyan: '#5DD4DC',
  midCyan: '#4BA8B5',
  deepNavy: '#1B3A57',
  white: '#FFFFFF',
  softGray: '#F8FAFB',
  mediumGray: '#94A3B8',
  lightGray: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

interface ModalAction {
  text: string;
  style?: 'default' | 'destructive' | 'primary';
  onPress: () => void;
}

interface TailTrackerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actions?: ModalAction[];
  showCloseButton?: boolean;
  animationType?: 'slide' | 'fade';
  icon?: keyof typeof Ionicons.glyphMap;
}

export const TailTrackerModal: React.FC<TailTrackerModalProps> = ({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  actions = [{ text: 'OK', onPress: onClose }],
  showCloseButton = true,
  animationType = 'slide',
  icon,
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          color: COLORS.success,
          backgroundColor: '#F0FDF4',
          borderColor: COLORS.success,
          defaultIcon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'warning':
        return {
          color: COLORS.warning,
          backgroundColor: '#FFFBEB',
          borderColor: COLORS.warning,
          defaultIcon: 'warning' as keyof typeof Ionicons.glyphMap,
        };
      case 'error':
        return {
          color: COLORS.error,
          backgroundColor: '#FEF2F2',
          borderColor: COLORS.error,
          defaultIcon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
        };
      default: // info
        return {
          color: COLORS.info,
          backgroundColor: '#EFF6FF',
          borderColor: COLORS.info,
          defaultIcon: 'information-circle' as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const typeConfig = getTypeConfig();
  const modalIcon = icon || typeConfig.defaultIcon;

  const AnimatedContainer = animationType === 'slide' 
    ? Animated.View 
    : Animated.View;

  const enterAnimation = animationType === 'slide' 
    ? SlideInUp.duration(300).springify()
    : FadeIn.duration(300);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View 
        entering={FadeIn.duration(200)}
        style={styles.modalOverlay}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <AnimatedContainer 
          entering={enterAnimation}
          style={[
            styles.modalContainer,
            { borderTopColor: typeConfig.borderColor }
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              {modalIcon && (
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: typeConfig.backgroundColor }
                ]}>
                  <Ionicons 
                    name={modalIcon} 
                    size={24} 
                    color={typeConfig.color} 
                  />
                </View>
              )}
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            
            {showCloseButton && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.mediumGray} />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          {message && (
            <View style={styles.contentContainer}>
              <Text style={styles.modalMessage}>{message}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.modalActions}>
            {actions.map((action, index) => {
              if (action.style === 'primary') {
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.primaryButton}
                    onPress={action.onPress}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[COLORS.lightCyan, COLORS.midCyan]}
                      style={styles.primaryButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.primaryButtonText}>
                        {action.text}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalButton,
                    action.style === 'destructive' && styles.destructiveButton
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalButtonText,
                    action.style === 'destructive' && styles.destructiveText
                  ]}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AnimatedContainer>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderTopWidth: 4,
    maxWidth: SCREEN_WIDTH - 40,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.deepNavy,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.deepNavy,
    opacity: 0.8,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.deepNavy,
  },
  destructiveButton: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  destructiveText: {
    color: COLORS.error,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default TailTrackerModal;