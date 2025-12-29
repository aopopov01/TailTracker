/**
 * Pricing Page
 * Displays subscription tiers and allows users to upgrade their plan
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Sparkles, Zap, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_TIERS, type SubscriptionTier, type SubscriptionTierConfig } from '@tailtracker/shared-types';
import { useSubscription } from '@/hooks/useSubscription';

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
}

const PricingCard = ({ config, isCurrentPlan, isUpgrade }: PricingCardProps) => {
  const colors = getTierColors(config.tier, isCurrentPlan);

  return (
    <div className={`card p-6 border-2 transition-all ${colors.border} ${isCurrentPlan ? 'scale-105' : ''}`}>
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
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">
                {config.pricing.monthlyPrice.toFixed(2)}
              </span>
              <span className="text-slate-500">{config.pricing.currency}/month</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              or {config.pricing.annualPrice.toFixed(2)} {config.pricing.currency}/year (save {Math.round((1 - config.pricing.annualPrice / (config.pricing.monthlyPrice * 12)) * 100)}%)
            </p>
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
            <p className="text-slate-500">Lost Pet Alerts</p>
            <p className="font-semibold text-slate-900">
              {config.limits.canCreateLostPets ? 'Create & Receive' : 'Receive Only'}
            </p>
          </div>
        </div>
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
      ) : isUpgrade ? (
        <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${colors.button}`}>
          Upgrade to {config.name}
        </button>
      ) : (
        <button disabled className="w-full py-3 px-4 rounded-lg font-medium bg-slate-100 text-slate-400 cursor-not-allowed">
          Downgrade Not Available
        </button>
      )}
    </div>
  );
};

export const PricingPage = () => {
  // Get fresh subscription data (not cached from user object)
  const { tier: currentTier, isLoading } = useSubscription();
  const tierOrder: SubscriptionTier[] = ['free', 'premium', 'pro'];
  const currentTierIndex = tierOrder.indexOf(currentTier);

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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tierOrder.map((tier, index) => (
            <PricingCard
              key={tier}
              config={SUBSCRIPTION_TIERS[tier]}
              isCurrentPlan={tier === currentTier}
              isUpgrade={index > currentTierIndex}
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
