/**
 * Plan Selection Modal
 * Allows users to view and select subscription plans with monthly/annual toggle
 * Shows proration preview for upgrades
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X,
  Check,
  Sparkles,
  Crown,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  SUBSCRIPTION_PLANS,
  calculateProrationPreview,
  upgradeSubscriptionManaged,
  downgradeSubscription,
  getFullSubscription,
} from '@tailtracker/shared-services';
import type {
  SubscriptionTier,
  BillingCycle,
  ProrationPreview,
} from '@tailtracker/shared-types';
import { SUBSCRIPTION_TIERS } from '@tailtracker/shared-types';
import { useAuth } from '@/hooks/useAuth';
import { invalidateSubscriptionData } from '@/lib/cacheUtils';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
}

const TIER_ORDER: SubscriptionTier[] = ['free', 'premium', 'pro'];

export const PlanSelectionModal = ({
  isOpen,
  onClose,
  currentTier,
}: PlanSelectionModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [prorationPreview, setProrationPreview] = useState<ProrationPreview | null>(null);

  // Fetch current subscription details
  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => (user?.id ? getFullSubscription(user.id) : null),
    enabled: isOpen && !!user?.id,
  });

  // Calculate proration when tier selection changes
  useEffect(() => {
    const calculateProration = async () => {
      if (!selectedTier || !user?.id || selectedTier === currentTier) {
        setProrationPreview(null);
        return;
      }

      const preview = await calculateProrationPreview(user.id, selectedTier, billingCycle);
      setProrationPreview(preview);
    };

    calculateProration();
  }, [selectedTier, billingCycle, currentTier, user?.id]);

  // Upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTier) throw new Error('No tier selected');
      return upgradeSubscriptionManaged({ targetTier: selectedTier, billingCycle });
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate all subscription-related caches
        invalidateSubscriptionData();
        toast.success(`Successfully upgraded to ${selectedTier}!`);
        onClose();
        navigate('/settings/subscription/success', {
          state: {
            tier: selectedTier,
            billingCycle,
            prorationAmount: result.prorationAmount,
          },
        });
      } else {
        toast.error(result.error || 'Failed to upgrade subscription');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'An error occurred while upgrading');
    },
  });

  // Downgrade mutation
  const downgradeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTier) throw new Error('No tier selected');
      return downgradeSubscription({ targetTier: selectedTier });
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate all subscription-related caches
        invalidateSubscriptionData();
        toast.success(`Scheduled downgrade to ${selectedTier}. Your current plan will remain active until the end of the billing period.`);
        onClose();
      } else {
        toast.error(result.error || 'Failed to schedule downgrade');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'An error occurred while scheduling downgrade');
    },
  });

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

  const isUpgrade = selectedTier
    ? TIER_ORDER.indexOf(selectedTier) > TIER_ORDER.indexOf(currentTier)
    : false;

  const handleConfirm = () => {
    if (!selectedTier) return;

    if (isUpgrade) {
      upgradeMutation.mutate();
    } else {
      downgradeMutation.mutate();
    }
  };

  const isLoading = upgradeMutation.isPending || downgradeMutation.isPending;
  const error = upgradeMutation.error || downgradeMutation.error;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="px-6 pt-8 pb-4 text-center border-b">
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="mt-2 text-gray-600">
              Select the plan that best fits your needs
            </p>

            {/* Billing cycle toggle */}
            <div className="mt-6 inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <span className="ml-1 text-xs text-green-600 font-semibold">
                  Save ~17%
                </span>
              </button>
            </div>
          </div>

          {/* Plans grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['free', 'premium', 'pro'] as SubscriptionTier[]).map((tier) => {
                const plan = SUBSCRIPTION_PLANS[tier];
                const isSelected = selectedTier === tier;
                const isCurrent = currentTier === tier;
                const isPro = tier === 'pro';

                const price =
                  billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
                const priceLabel =
                  billingCycle === 'monthly' ? '/month' : '/year';

                return (
                  <div
                    key={tier}
                    onClick={() => !isCurrent && setSelectedTier(tier)}
                    className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-gray-200 bg-gray-50 cursor-default'
                        : isSelected
                          ? isPro
                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20'
                            : 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {/* Popular badge */}
                    {plan.popular && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {/* Current badge */}
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gray-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Current Plan
                        </span>
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                        isPro
                          ? 'bg-purple-100 text-purple-600'
                          : tier === 'premium'
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isPro ? (
                        <Sparkles className="h-6 w-6" />
                      ) : tier === 'premium' ? (
                        <Crown className="h-6 w-6" />
                      ) : (
                        <Check className="h-6 w-6" />
                      )}
                    </div>

                    {/* Plan name */}
                    <h3 className="mt-4 text-lg font-bold text-center text-gray-900">
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="mt-2 text-center">
                      <span className="text-3xl font-bold text-gray-900">
                        {price === 0 ? 'Free' : `€${price.toFixed(2)}`}
                      </span>
                      {price > 0 && (
                        <span className="text-gray-500">{priceLabel}</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-sm text-center text-gray-600">
                      {plan.description}
                    </p>

                    {/* Features */}
                    <ul className="mt-4 space-y-2">
                      {SUBSCRIPTION_TIERS[tier].features.slice(0, 6).map((feature: string, index: number) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <Check
                            className={`h-4 w-4 flex-shrink-0 ${
                              isPro
                                ? 'text-purple-500'
                                : tier === 'premium'
                                  ? 'text-primary-500'
                                  : 'text-green-500'
                            }`}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Selection indicator */}
                    {isSelected && !isCurrent && (
                      <div className="mt-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium ${
                            isPro ? 'text-purple-600' : 'text-primary-600'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                          Selected
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Proration preview for upgrades */}
            {selectedTier && isUpgrade && prorationPreview && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Upgrade Summary</h4>
                    <p className="mt-1 text-sm text-blue-700">
                      Your upgrade will take effect immediately.
                      {prorationPreview.prorationAmount > 0 && (
                        <>
                          {' '}
                          You'll be charged{' '}
                          <span className="font-semibold">
                            €{prorationPreview.prorationAmount.toFixed(2)}
                          </span>{' '}
                          (prorated for the remaining {prorationPreview.daysRemaining} days).
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Downgrade notice */}
            {selectedTier && !isUpgrade && selectedTier !== currentTier && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-900">Downgrade Notice</h4>
                    <p className="mt-1 text-sm text-amber-700">
                      Your downgrade will take effect at the end of your current billing
                      period
                      {subscription?.currentPeriodEnd && (
                        <>
                          {' '}
                          on{' '}
                          <span className="font-semibold">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      . You'll continue to have access to all {currentTier} features until
                      then.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">
                    {error instanceof Error ? error.message : 'An error occurred'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={!selectedTier || selectedTier === currentTier || isLoading}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedTier === 'pro'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : selectedTier && isUpgrade ? (
                `Upgrade to ${SUBSCRIPTION_PLANS[selectedTier].name}`
              ) : selectedTier ? (
                `Downgrade to ${SUBSCRIPTION_PLANS[selectedTier].name}`
              ) : (
                'Select a Plan'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelectionModal;
