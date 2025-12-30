/**
 * Pending Change Banner
 * Shows when a subscription downgrade or cancellation is scheduled
 * Provides option to undo/reactivate
 */

import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ArrowDown, X, Loader2, Undo2 } from 'lucide-react';
import { reactivateSubscription, SUBSCRIPTION_PLANS } from '@tailtracker/shared-services';
import type { SubscriptionTier, SubscriptionOperationResult } from '@tailtracker/shared-types';
import { invalidateSubscriptionData } from '@/lib/cacheUtils';

interface PendingChangeBannerProps {
  currentTier: SubscriptionTier;
  downgradeToTier: SubscriptionTier;
  effectiveDate: string;
  onReactivated?: () => void;
}

export const PendingChangeBanner = ({
  currentTier,
  downgradeToTier,
  effectiveDate,
  onReactivated,
}: PendingChangeBannerProps) => {
  const isCancellation = downgradeToTier === 'free';
  const formattedDate = new Date(effectiveDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateSubscription,
    onSuccess: (result: SubscriptionOperationResult) => {
      if (result.success) {
        // Invalidate all subscription-related caches
        invalidateSubscriptionData();
        onReactivated?.();
      }
    },
  });

  const handleUndo = () => {
    reactivateMutation.mutate();
  };

  const currentPlan = SUBSCRIPTION_PLANS[currentTier];
  const targetPlan = SUBSCRIPTION_PLANS[downgradeToTier];

  return (
    <div
      className={`rounded-lg p-4 ${
        isCancellation
          ? 'bg-red-50 border border-red-200'
          : 'bg-amber-50 border border-amber-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`p-2 rounded-lg ${
            isCancellation ? 'bg-red-100' : 'bg-amber-100'
          }`}
        >
          {isCancellation ? (
            <X className={`h-5 w-5 text-red-600`} />
          ) : (
            <ArrowDown className={`h-5 w-5 text-amber-600`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={`font-medium ${
              isCancellation ? 'text-red-900' : 'text-amber-900'
            }`}
          >
            {isCancellation
              ? 'Cancellation Scheduled'
              : `Downgrade to ${targetPlan.name} Scheduled`}
          </h4>
          <p
            className={`mt-1 text-sm ${
              isCancellation ? 'text-red-700' : 'text-amber-700'
            }`}
          >
            {isCancellation ? (
              <>
                Your {currentPlan.name} subscription will be cancelled on{' '}
                <span className="font-medium">{formattedDate}</span>. You'll lose
                access to premium features after this date.
              </>
            ) : (
              <>
                Your subscription will change from {currentPlan.name} to{' '}
                {targetPlan.name} on{' '}
                <span className="font-medium">{formattedDate}</span>.
              </>
            )}
          </p>

          {/* Undo button */}
          <button
            onClick={handleUndo}
            disabled={reactivateMutation.isPending}
            className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isCancellation
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                : 'bg-amber-600 text-white hover:bg-amber-700 disabled:bg-amber-400'
            }`}
          >
            {reactivateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Undoing...
              </>
            ) : (
              <>
                <Undo2 className="h-4 w-4" />
                Undo {isCancellation ? 'Cancellation' : 'Downgrade'}
              </>
            )}
          </button>

          {reactivateMutation.error && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {reactivateMutation.error instanceof Error
                ? reactivateMutation.error.message
                : 'Failed to undo'}
            </div>
          )}

          {reactivateMutation.isSuccess && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <AlertCircle className="h-4 w-4" />
              Successfully restored your subscription!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingChangeBanner;
