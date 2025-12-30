/**
 * Cancellation Flow Modal
 * 3-step cancellation flow with reason selection, win-back offer, and confirmation
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  X,
  AlertTriangle,
  Gift,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Heart,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  cancelSubscription,
  getFullSubscription,
} from '@tailtracker/shared-services';
import type { SubscriptionTier, SubscriptionOperationResult } from '@tailtracker/shared-types';
import { SUBSCRIPTION_TIERS } from '@tailtracker/shared-types';
import { useAuth } from '@/hooks/useAuth';
import { invalidateSubscriptionData } from '@/lib/cacheUtils';

interface CancellationFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
}

type CancellationStep = 'reason' | 'offer' | 'confirm';

const CANCELLATION_REASONS = [
  { id: 'too_expensive', label: 'Too expensive', icon: '💰' },
  { id: 'not_using', label: "Not using the app enough", icon: '📱' },
  { id: 'missing_features', label: 'Missing features I need', icon: '🔧' },
  { id: 'switching_service', label: 'Switching to another service', icon: '🔄' },
  { id: 'temporary', label: 'Only needed temporarily', icon: '⏰' },
  { id: 'technical_issues', label: 'Technical issues', icon: '🐛' },
  { id: 'other', label: 'Other reason', icon: '📝' },
];

export const CancellationFlowModal = ({
  isOpen,
  onClose,
  currentTier,
}: CancellationFlowModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [step, setStep] = useState<CancellationStep>('reason');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReasonText, setOtherReasonText] = useState('');

  // Fetch subscription for period end date
  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => (user?.id ? getFullSubscription(user.id) : null),
    enabled: isOpen && !!user?.id,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: (result: SubscriptionOperationResult) => {
      if (result.success) {
        // Invalidate all subscription-related caches
        invalidateSubscriptionData();
        setStep('confirm');
      }
    },
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('reason');
      setSelectedReason(null);
      setOtherReasonText('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tierConfig = SUBSCRIPTION_TIERS[currentTier];
  const periodEndDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : 'the end of your billing period';

  const handleProceedToOffer = () => {
    if (!selectedReason) return;
    setStep('offer');
  };

  const handleConfirmCancel = () => {
    cancelMutation.mutate();
  };

  const handleKeepSubscription = () => {
    onClose();
  };

  const renderReasonStep = () => (
    <>
      {/* Header */}
      <div className="px-6 pt-8 pb-4 text-center border-b">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">We're sorry to see you go</h2>
        <p className="mt-2 text-gray-600">
          Please tell us why you're cancelling so we can improve
        </p>
      </div>

      {/* Reasons */}
      <div className="p-6">
        <div className="space-y-3">
          {CANCELLATION_REASONS.map((reason) => (
            <button
              key={reason.id}
              onClick={() => setSelectedReason(reason.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                selectedReason === reason.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{reason.icon}</span>
              <span className="font-medium text-gray-900">{reason.label}</span>
              {selectedReason === reason.id && (
                <CheckCircle className="h-5 w-5 text-primary-500 ml-auto" />
              )}
            </button>
          ))}
        </div>

        {/* Other reason text input */}
        {selectedReason === 'other' && (
          <textarea
            value={otherReasonText}
            onChange={(e) => setOtherReasonText(e.target.value)}
            placeholder="Please tell us more..."
            className="mt-4 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            rows={3}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Never mind
        </button>
        <button
          onClick={handleProceedToOffer}
          disabled={!selectedReason}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </>
  );

  const renderOfferStep = () => (
    <>
      {/* Header */}
      <div className="px-6 pt-8 pb-4 text-center border-b">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Gift className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Wait! Here's a special offer</h2>
        <p className="mt-2 text-gray-600">
          We'd hate to lose you. How about a discount?
        </p>
      </div>

      {/* Offer content */}
      <div className="p-6">
        {/* Special offer card */}
        <div className="bg-gradient-to-br from-purple-500 to-primary-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Exclusive Offer
            </span>
          </div>
          <h3 className="text-2xl font-bold mb-2">50% Off for 3 Months</h3>
          <p className="text-white/90 mb-4">
            Continue enjoying {tierConfig.name} features at half the price
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              €{((tierConfig.pricing?.monthlyPrice ?? 0) / 2).toFixed(2)}
            </span>
            <span className="text-white/80 line-through">
              €{tierConfig.pricing?.monthlyPrice?.toFixed(2)}
            </span>
            <span className="text-white/90">/month</span>
          </div>
        </div>

        {/* Benefits reminder */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            You'll lose access to:
          </h4>
          <ul className="space-y-2">
            {tierConfig.features.slice(0, 4).map((feature: string, index: number) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-1.5 w-1.5 bg-red-400 rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleKeepSubscription}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Gift className="h-5 w-5" />
            Claim 50% Off & Stay
          </button>
          <button
            onClick={handleConfirmCancel}
            disabled={cancelMutation.isPending}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {cancelMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              'No thanks, cancel anyway'
            )}
          </button>
        </div>

        {cancelMutation.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {cancelMutation.error instanceof Error
              ? cancelMutation.error.message
              : 'An error occurred'}
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <button
          onClick={() => setStep('reason')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </>
  );

  const renderConfirmStep = () => (
    <>
      {/* Header */}
      <div className="px-6 pt-8 pb-4 text-center border-b">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Cancellation Scheduled</h2>
        <p className="mt-2 text-gray-600">Your subscription has been cancelled</p>
      </div>

      {/* Confirmation content */}
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Access until {periodEndDate}</h4>
              <p className="mt-1 text-sm text-blue-700">
                You'll continue to have full access to all {tierConfig.name} features until
                your current billing period ends.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>What happens next:</strong>
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Your subscription will downgrade to Free on {periodEndDate}</li>
            <li>You won't be charged again</li>
            <li>Your data will be preserved</li>
            <li>You can resubscribe anytime</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Changed your mind?{' '}
            <button
              onClick={onClose}
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Reactivate your subscription
            </button>{' '}
            from the Settings page before {periodEndDate}.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t flex justify-center">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Done
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Step content */}
          {step === 'reason' && renderReasonStep()}
          {step === 'offer' && renderOfferStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
      </div>
    </div>
  );
};

export default CancellationFlowModal;
