import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ModalAction, ModalConfig } from '../types/Modal';

export const useTailTrackerModal = () => {
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    visible: false,
    title: '',
    actions: [],
  });

  const showModal = (config: Omit<ModalConfig, 'visible'>) => {
    setModalConfig({ ...config, visible: true });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const showInfo = (
    title: string,
    message: string,
    icon?: keyof typeof Ionicons.glyphMap
  ) => {
    showModal({
      title,
      message,
      type: 'info',
      icon: icon || 'information-circle',
      actions: [{ text: 'Got it', style: 'primary', onPress: hideModal }],
    });
  };

  const showSuccess = (
    title: string,
    message: string,
    icon?: keyof typeof Ionicons.glyphMap,
    onClose?: () => void
  ) => {
    showModal({
      title,
      message,
      type: 'success',
      icon: icon || 'checkmark-circle',
      actions: [
        {
          text: 'Great!',
          style: 'primary',
          onPress: () => {
            hideModal();
            onClose?.();
          },
        },
      ],
    });
  };

  const showWarning = (
    title: string,
    message: string,
    icon?: keyof typeof Ionicons.glyphMap
  ) => {
    showModal({
      title,
      message,
      type: 'warning',
      icon: icon || 'warning',
      actions: [{ text: 'OK', style: 'primary', onPress: hideModal }],
    });
  };

  const showError = (
    title: string,
    message: string,
    icon?: keyof typeof Ionicons.glyphMap,
    onClose?: () => void
  ) => {
    showModal({
      title,
      message,
      type: 'error',
      icon: icon || 'alert-circle',
      actions: [
        {
          text: 'Try Again',
          style: 'primary',
          onPress: () => {
            hideModal();
            onClose?.();
          },
        },
      ],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel',
    isDestructive: boolean = false
  ) => {
    showModal({
      title,
      message,
      type: isDestructive ? 'warning' : 'info',
      icon: isDestructive ? 'warning' : 'help-circle',
      actions: [
        { text: cancelText, style: 'default', onPress: hideModal },
        {
          text: confirmText,
          style: isDestructive ? 'destructive' : 'primary',
          onPress: () => {
            hideModal();
            onConfirm();
          },
        },
      ],
    });
  };

  return {
    modalConfig,
    showModal,
    hideModal,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showConfirm,
  };
};
