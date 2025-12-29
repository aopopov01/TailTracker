/**
 * Reusable Confirmation Modal Component
 * Replaces browser window.confirm with branded UI
 */

import { X, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'success';
  icon?: LucideIcon;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const variantStyles = {
  default: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
  },
  success: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
  },
};

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon: Icon,
  isLoading = false,
  children,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  const styles = variantStyles[variant];

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {Icon && (
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-full ${styles.iconBg}`}>
                <Icon className={`h-8 w-8 ${styles.iconColor}`} />
              </div>
            </div>
          )}

          {description && (
            <p className="text-center text-gray-600 mb-4">{description}</p>
          )}

          {children}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${styles.confirmButton}`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
