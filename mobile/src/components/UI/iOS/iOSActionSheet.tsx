import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export interface ActionSheetAction {
  title: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  disabled?: boolean;
}

interface iOSActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  hapticFeedback?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const IOSActionSheet: React.FC<iOSActionSheetProps> = ({
  visible,
  onClose,
  title,
  message,
  actions,
  hapticFeedback = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleActionPress = async (action: ActionSheetAction) => {
    if (action.disabled) return;

    if (hapticFeedback && Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    action.onPress();
    onClose();
  };

  const getActionButtonStyle = (actionStyle: string = 'default') => {
    const baseStyle = {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginBottom: 1,
      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
      alignItems: 'center' as const,
    };

    return baseStyle;
  };

  const getActionTextStyle = (actionStyle: string = 'default', disabled: boolean = false) => {
    let color = '#007AFF';
    let fontWeight: '400' | '600' = '400';

    switch (actionStyle) {
      case 'cancel':
        fontWeight = '600';
        color = isDark ? '#FFFFFF' : '#000000';
        break;
      case 'destructive':
        color = '#FF3B30';
        break;
      default:
        color = '#007AFF';
        break;
    }

    return {
      fontSize: 20,
      fontWeight,
      color: disabled ? (isDark ? '#8E8E93' : '#C7C7CC') : color,
    };
  };

  const cancelActions = actions.filter(action => action.style === 'cancel');
  const otherActions = actions.filter(action => action.style !== 'cancel');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView
          intensity={20}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
      </TouchableOpacity>

      <SafeAreaView style={styles.container}>
        <View style={styles.actionSheetContainer}>
          {/* Main Actions Group */}
          <View style={[
            styles.actionsGroup,
            { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }
          ]}>
            {(title || message) && (
              <View style={styles.headerContainer}>
                {title && (
                  <Text style={[
                    styles.title,
                    { color: isDark ? '#8E8E93' : '#8E8E93' }
                  ]}>
                    {title}
                  </Text>
                )}
                {message && (
                  <Text style={[
                    styles.message,
                    { color: isDark ? '#8E8E93' : '#8E8E93' },
                    title && { marginTop: 4 }
                  ]}>
                    {message}
                  </Text>
                )}
              </View>
            )}

            {otherActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  getActionButtonStyle(action.style),
                  index > 0 || (title || message) ? styles.actionBorder : {},
                  { backgroundColor: 'transparent' }
                ]}
                onPress={() => handleActionPress(action)}
                disabled={action.disabled}
                activeOpacity={0.7}
              >
                <Text style={getActionTextStyle(action.style, action.disabled)}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Actions Group */}
          {cancelActions.length > 0 && (
            <View style={[
              styles.actionsGroup,
              styles.cancelGroup,
              { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }
            ]}>
              {cancelActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    getActionButtonStyle(action.style),
                    { backgroundColor: 'transparent' }
                  ]}
                  onPress={() => handleActionPress(action)}
                  disabled={action.disabled}
                  activeOpacity={0.7}
                >
                  <Text style={getActionTextStyle(action.style, action.disabled)}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  actionSheetContainer: {
    width: '100%',
  },
  actionsGroup: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cancelGroup: {
    marginBottom: 0,
  },
  headerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  actionBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A3A3C',
  },
});