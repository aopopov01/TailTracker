/**
 * Mark As Found Modal Component
 * Celebratory modal for marking a lost pet as found
 */

import { useState } from 'react';
import { PartyPopper, Loader2, X } from 'lucide-react';

interface MarkAsFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
  petName: string;
}

export const MarkAsFoundModal = ({
  isOpen,
  onClose,
  onConfirm,
  petName,
}: MarkAsFoundModalProps) => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(notes.trim() || undefined);
      setNotes('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNotes('');
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
          <h2 className="text-lg font-semibold text-gray-900">
            Great News!
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Celebratory Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 animate-pulse">
              <PartyPopper className="h-10 w-10 text-green-600" />
            </div>
          </div>

          {/* Message */}
          <p className="text-center text-gray-700 text-lg mb-2">
            You found <span className="font-semibold text-green-700">{petName}</span>!
          </p>
          <p className="text-center text-gray-500 text-sm mb-6">
            This will mark {petName} as found and notify anyone who was helping search.
          </p>

          {/* Optional Notes */}
          <div className="space-y-2">
            <label
              htmlFor="found-notes"
              className="block text-sm font-medium text-gray-700"
            >
              Add a note (optional)
            </label>
            <textarea
              id="found-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Found by a kind neighbor, was hiding in the garden..."
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Marking as Found...
              </>
            ) : (
              <>
                <PartyPopper className="h-4 w-4" />
                Mark as Found
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
