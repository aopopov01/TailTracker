/**
 * Unified Modal Types - Single Source of Truth
 */

import { Ionicons } from '@expo/vector-icons';

export type ModalType = 'info' | 'success' | 'warning' | 'error';
export type ModalActionStyle = 'primary' | 'default' | 'destructive';

export interface ModalAction {
  text: string;
  style?: ModalActionStyle;
  onPress?: () => void;
}

export interface ModalConfig {
  visible: boolean;
  title: string;
  message?: string;
  type?: ModalType;
  actions?: ModalAction[];
  icon?: keyof typeof Ionicons.glyphMap;
  showCloseButton?: boolean;
}