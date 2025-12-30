/**
 * Upgrade Modal Component
 * Prompts users to upgrade when they try to access premium features
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, X, Check, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@tailtracker/shared-services';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  featureDescription?: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
}

export const UpgradeModal = ({
  isOpen,
  onClose,
  feature,
  featureDescription,
  requiredTier,
  currentTier,
}: UpgradeModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  // Prevent body scroll when modal is open
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

  const requiredPlan = SUBSCRIPTION_PLANS[requiredTier];
  const pricing = requiredPlan.price;
  const isPro = requiredTier === 'pro';

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing', { state: { highlightTier: requiredTier } });
  };

  // Get key benefits for the required tier
  const tierBenefits: Record<SubscriptionTier, string[]> = {
    free: [],
    premium: [
      'Up to 2 pets',
      'Up to 3 photos per pet',
      '2 family members',
      'Calendar sync',
      'Ad-free experience',
    ],
    pro: [
      'Up to 10 pets',
      'Up to 10 photos per pet',
      '5 family members',
      'Calendar sync',
      'Email reminders',
      'Create lost pet alerts',
      'Ad-free experience',
    ],
  };

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

          {/* Header with gradient */}
          <div
            className={`px-6 pt-8 pb-6 text-center ${
              isPro
                ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                : 'bg-gradient-to-br from-primary-500 to-primary-700'
            }`}
          >
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              {isPro ? (
                <Sparkles className="h-8 w-8 text-white" />
              ) : (
                <Crown className="h-8 w-8 text-white" />
              )}
            </div>

            {/* Title */}
            <h3 className="mt-4 text-xl font-bold text-white">Upgrade to {requiredPlan.name}</h3>
            <p className="mt-2 text-sm text-white/80">
              {featureDescription || `Unlock ${feature} and more premium features`}
            </p>
          </div>

          <div className="p-6">
            {/* Feature highlight */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{feature}</span> requires{' '}
                <span
                  className={`font-semibold ${isPro ? 'text-purple-600' : 'text-primary-600'}`}
                >
                  {requiredPlan.name}
                </span>{' '}
                plan
              </p>
              <p className="mt-1 text-xs text-gray-500">
                You're currently on the{' '}
                <span className="font-medium">{SUBSCRIPTION_PLANS[currentTier].name}</span> plan
              </p>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                What you'll get with {requiredPlan.name}:
              </p>
              <ul className="space-y-2">
                {tierBenefits[requiredTier].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check
                      className={`h-4 w-4 flex-shrink-0 ${
                        isPro ? 'text-purple-500' : 'text-primary-500'
                      }`}
                    />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div className="mb-6 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-gray-900">
                  {pricing.monthly.toFixed(2)}
                </span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                or{' '}
                <span className="font-medium">
                  {pricing.yearly.toFixed(2)}/year
                </span>{' '}
                (save {Math.round((1 - pricing.yearly / (pricing.monthly * 12)) * 100)}%)
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleUpgrade}
                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isPro
                    ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                    : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                }`}
              >
                Upgrade to {requiredPlan.name}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
