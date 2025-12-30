/**
 * Pricing Page
 * Displays subscription tiers and allows users to upgrade their plan
 * Integrates with Stripe Checkout for payment processing
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Sparkles, Zap, Loader2, Calendar, Mail, MapPin, Ban, CreditCard } from 'lucide-react';
import { SUBSCRIPTION_TIERS, type SubscriptionTier, type SubscriptionTierConfig } from '@tailtracker/shared-types';
import { createStripeCheckoutSession } from '@tailtracker/shared-services';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';

type BillingCycle = 'monthly' | 'annual';

// Get icon for tier
const getTierIcon = (tier: SubscriptionTier) => {
  switch (tier) {
    case 'free':
      return <Zap className="h-6 w-6" />;
    case 'premium':
      return <Sparkles className="h-6 w-6" />;
    case 'pro':
      return <Crown className="h-6 w-6" />;
  }
};

// Get tier color classes
const getTierColors = (tier: SubscriptionTier, isCurrentPlan: boolean) => {
  if (isCurrentPlan) {
    return {
      border: 'border-primary-500 ring-2 ring-primary-500',
      badge: 'bg-primary-500 text-white',
      button: 'bg-slate-100 text-slate-500 cursor-default',
      icon: 'text-primary-500',
    };
  }

  switch (tier) {
    case 'premium':
      return {
        border: 'border-slate-200 hover:border-primary-300',
        badge: 'bg-primary-100 text-primary-700',
        button: 'bg-primary-500 hover:bg-primary-600 text-white',
        icon: 'text-primary-500',
      };
    case 'pro':
      return {
        border: 'border-slate-200 hover:border-amber-300',
        badge: 'bg-amber-100 text-amber-700',
        button: 'bg-amber-500 hover:bg-amber-600 text-white',
        icon: 'text-amber-500',
      };
    default:
      return {
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-700',
        button: 'bg-slate-100 text-slate-500 cursor-default',
        icon: 'text-slate-500',
      };
  }
};

interface PricingCardProps {
  config: SubscriptionTierConfig;
  isCurrentPlan: boolean;
  isUpgrade: boolean;
  isHighlighted?: boolean;
  billingCycle: BillingCycle;
  onUpgrade: (tier: SubscriptionTier, billingCycle: BillingCycle) => void;
  isLoading: boolean;
  loadingTier: SubscriptionTier | null;
}

const PricingCard = ({
  config,
  isCurrentPlan,
  isUpgrade,
  isHighlighted,
  billingCycle,
  onUpgrade,
  isLoading,
  loadingTier,
}: PricingCardProps) => {
  const colors = getTierColors(config.tier, isCurrentPlan);
  const highlightClass = isHighlighted && !isCurrentPlan
    ? 'ring-4 ring-primary-300 animate-pulse'
    : '';
  const isButtonLoading = isLoading && loadingTier === config.tier;

  return (
    <div className={`card p-6 border-2 transition-all ${colors.border} ${isCurrentPlan ? 'scale-105' : ''} ${highlightClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-slate-50 ${colors.icon}`}>
            {getTierIcon(config.tier)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{config.name}</h3>
            {isCurrentPlan && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                Current Plan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        {config.pricing ? (
          <div>
            {billingCycle === 'monthly' ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {config.pricing.monthlyPrice.toFixed(2)}
                  </span>
                  <span className="text-slate-500">{config.pricing.currency}/month</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Billed monthly
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {(config.pricing.annualPrice / 12).toFixed(2)}
                  </span>
                  <span className="text-slate-500">{config.pricing.currency}/month</span>
                </div>
                <p className="text-sm text-green-600 mt-1 font-medium">
                  {config.pricing.annualPrice.toFixed(2)} {config.pricing.currency}/year
                  (save {Math.round((1 - config.pricing.annualPrice / (config.pricing.monthlyPrice * 12)) * 100)}%)
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">Free</span>
            <span className="text-slate-500">forever</span>
          </div>
        )}
      </div>

      {/* Limits Summary */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Pets</p>
            <p className="font-semibold text-slate-900">
              {config.limits.maxPets >= 999 ? 'Unlimited' : config.limits.maxPets}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Family Members</p>
            <p className="font-semibold text-slate-900">
              {config.limits.maxFamilyMembers >= 999 ? 'Unlimited' : config.limits.maxFamilyMembers}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Photos/Pet</p>
            <p className="font-semibold text-slate-900">{config.limits.maxPhotosPerPet}</p>
          </div>
          <div>
            <p className="text-slate-500">Documents/Appt</p>
            <p className="font-semibold text-slate-900">
              {config.limits.maxDocumentsPerAppointment === 0 ? 'None' : config.limits.maxDocumentsPerAppointment}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="flex flex-wrap gap-2 mb-4">
        {config.limits.canSyncCalendar && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <Calendar className="h-3 w-3" />
            Calendar Sync
          </span>
        )}
        {config.limits.canReceiveEmailReminders && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
            <Mail className="h-3 w-3" />
            Email Reminders
          </span>
        )}
        {config.limits.canCreateLostPets && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
            <MapPin className="h-3 w-3" />
            Create Lost Pet Alerts
          </span>
        )}
        {config.limits.isAdFree && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            <Ban className="h-3 w-3" />
            Ad-Free
          </span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {config.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <Check className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <span className="text-slate-600">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      {isCurrentPlan ? (
        <button disabled className={`w-full py-3 px-4 rounded-lg font-medium ${colors.button}`}>
          Current Plan
        </button>
      ) : isUpgrade && config.tier !== 'free' ? (
        <button
          onClick={() => onUpgrade(config.tier, billingCycle)}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${colors.button} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isButtonLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Upgrade to {config.name}
            </>
          )}
        </button>
      ) : (
        <button disabled className="w-full py-3 px-4 rounded-lg font-medium bg-slate-100 text-slate-400 cursor-not-allowed">
          {config.tier === 'free' ? 'Free Forever' : 'Downgrade Not Available'}
        </button>
      )}
    </div>
  );
};

export const PricingPage = () => {
  // Get fresh subscription data (not cached from user object)
  const { tier: currentTier, isLoading } = useSubscription();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const highlightTier = (location.state as { highlightTier?: SubscriptionTier })?.highlightTier;
  const tierOrder: SubscriptionTier[] = ['free', 'premium', 'pro'];
  const currentTierIndex = tierOrder.indexOf(currentTier);

  // State for billing cycle toggle and checkout
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle upgrade - create Stripe checkout session
  const handleUpgrade = async (tier: SubscriptionTier, cycle: BillingCycle) => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      window.location.href = `/auth/login?returnTo=/pricing&tier=${tier}&cycle=${cycle}`;
      return;
    }

    if (tier === 'free') return;

    setIsCheckoutLoading(true);
    setLoadingTier(tier);
    setError(null);

    try {
      const result = await createStripeCheckoutSession({
        tier: tier as 'premium' | 'pro',
        billingCycle: cycle,
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      if (result.success && result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        setError(result.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsCheckoutLoading(false);
      setLoadingTier(null);
    }
  };

  // Show loading while fetching subscription
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading your plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/pets"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Pets
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Upgrade Your Plan
            </h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              Unlock more features for your furry friends. Choose the plan that best fits your needs.
            </p>
          </div>
        </div>

        {/* Current Plan Info */}
        <div className="card p-4 mb-8 bg-primary-50 border-primary-200">
          <div className="flex items-center justify-center gap-3">
            <Crown className="h-5 w-5 text-primary-600" />
            <p className="text-primary-700">
              You're currently on the <strong>{SUBSCRIPTION_TIERS[currentTier].name}</strong> plan
              {currentTier === 'free' && (
                <span className="ml-1">
                  ({SUBSCRIPTION_TIERS.free.limits.maxPets} pet limit reached? Upgrade below!)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tierOrder.map((tier, index) => (
            <PricingCard
              key={tier}
              config={SUBSCRIPTION_TIERS[tier]}
              isCurrentPlan={tier === currentTier}
              isUpgrade={index > currentTierIndex}
              isHighlighted={tier === highlightTier}
              billingCycle={billingCycle}
              onUpgrade={handleUpgrade}
              isLoading={isCheckoutLoading}
              loadingTier={loadingTier}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="card p-8 bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-sm text-slate-600">
                Yes! You can upgrade at any time. Your new features will be available immediately.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-slate-600">
                We accept all major credit cards through our secure payment provider, Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-2">
                What happens to my pets if I downgrade?
              </h3>
              <p className="text-sm text-slate-600">
                Your pets will be stored in our database for 30 days. If you downgrade to a plan with fewer pet slots, you'll be asked to select which pets to keep active. The remaining pets will be hidden from your account but can be restored if you upgrade again within 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-8">
          <p className="text-slate-500">
            Have questions? <a href="mailto:support@tailtracker.app" className="text-primary-600 hover:text-primary-700">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
};
