import { EventEmitter } from 'events';

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
  showCloseButton?: boolean;
  icon?: string;
}

class ModalService extends EventEmitter {
  private static instance: ModalService;

  private constructor() {
    super();
  }

  static getInstance(): ModalService {
    if (!ModalService.instance) {
      ModalService.instance = new ModalService();
    }
    return ModalService.instance;
  }

  showModal(config: Omit<ModalConfig, 'visible'>) {
    this.emit('show', { ...config, visible: true });
  }

  hideModal() {
    this.emit('hide');
  }

  showInfo(title: string, message: string, icon?: string) {
    this.showModal({
      title,
      message,
      type: 'info',
      icon: icon || 'information-circle',
      actions: [
        {
          text: 'Got it',
          style: 'primary',
          onPress: () => this.hideModal()
        }
      ]
    });
  }

  showSuccess(title: string, message: string, icon?: string) {
    this.showModal({
      title,
      message,
      type: 'success',
      icon: icon || 'checkmark-circle',
      actions: [
        {
          text: 'OK',
          style: 'primary',
          onPress: () => this.hideModal()
        }
      ]
    });
  }

  showError(title: string, message: string, icon?: string) {
    this.showModal({
      title,
      message,
      type: 'error',
      icon: icon || 'alert-circle',
      actions: [
        {
          text: 'OK',
          style: 'primary',
          onPress: () => this.hideModal()
        }
      ]
    });
  }

  showWarning(title: string, message: string, icon?: string) {
    this.showModal({
      title,
      message,
      type: 'warning',
      icon: icon || 'warning',
      actions: [
        {
          text: 'OK',
          style: 'primary',
          onPress: () => this.hideModal()
        }
      ]
    });
  }

  showConfirm(
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel',
    isDestructive: boolean = false
  ) {
    this.showModal({
      title,
      message,
      type: 'warning',
      icon: 'help-circle',
      actions: [
        {
          text: cancelText,
          style: 'default',
          onPress: () => this.hideModal()
        },
        {
          text: confirmText,
          style: isDestructive ? 'destructive' : 'primary',
          onPress: () => {
            this.hideModal();
            onConfirm();
          }
        }
      ]
    });
  }

  alert(
    title: string,
    message?: string,
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'destructive' }>,
    options?: { cancelable?: boolean }
  ) {
    const actions: ModalAction[] = buttons?.map(button => ({
      text: button.text,
      style: button.style === 'destructive' ? 'destructive' : button.style === 'default' ? 'default' : 'primary',
      onPress: button.onPress || (() => this.hideModal())
    })) || [
      {
        text: 'OK',
        style: 'primary',
        onPress: () => this.hideModal()
      }
    ];

    this.showModal({
      title,
      message,
      type: 'info',
      actions,
      showCloseButton: options?.cancelable
    });
  }
}

export const modalService = ModalService.getInstance();