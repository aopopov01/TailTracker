/**
 * Upgrade Success Page
 * Shown after successful subscription upgrade with confetti and feature highlights
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Sparkles,
  Crown,
  ArrowRight,
  PartyPopper,
  Star,
  Zap,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@tailtracker/shared-services';
import type { SubscriptionTier, BillingCycle } from '@tailtracker/shared-types';
import { SUBSCRIPTION_TIERS } from '@tailtracker/shared-types';

interface LocationState {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  prorationAmount?: number;
}

// Simple confetti effect using CSS animations
const ConfettiPiece = ({ delay, left }: { delay: number; left: number }) => {
  const colors = ['#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      className="absolute w-3 h-3 opacity-80"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        animation: `confetti-fall 3s ease-in-out ${delay}s forwards`,
        transform: `rotate(${Math.random() * 360}deg)`,
        borderRadius: Math.random() > 0.5 ? '50%' : '0',
      }}
    />
  );
};

const Confetti = () => {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    left: Math.random() * 100,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <style>
        {`
          @keyframes confetti-fall {
            0% {
              top: -10%;
              opacity: 1;
            }
            100% {
              top: 100%;
              opacity: 0;
            }
          }
        `}
      </style>
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} delay={piece.delay} left={piece.left} />
      ))}
    </div>
  );
};

export const UpgradeSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  const state = location.state as LocationState | undefined;
  const tier = state?.tier || 'premium';
  const billingCycle = state?.billingCycle || 'monthly';
  const prorationAmount = state?.prorationAmount;

  const plan = SUBSCRIPTION_PLANS[tier];
  const isPro = tier === 'pro';

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Redirect if no state (direct access)
  useEffect(() => {
    if (!state) {
      // Allow viewing for demo purposes, but normally would redirect
      // navigate('/settings/subscription');
    }
  }, [state, navigate]);

  const price =
    billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {showConfetti && <Confetti />}

      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Success header */}
        <div className="text-center mb-12">
          <div
            className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
              isPro
                ? 'bg-gradient-to-br from-purple-100 to-purple-200'
                : 'bg-gradient-to-br from-primary-100 to-primary-200'
            }`}
          >
            <PartyPopper
              className={`h-12 w-12 ${
                isPro ? 'text-purple-600' : 'text-primary-600'
              }`}
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to {plan.name}!
          </h1>
          <p className="text-lg text-gray-600">
            You've unlocked amazing new features for your pets
          </p>
        </div>

        {/* Subscription card */}
        <div
          className={`rounded-2xl p-6 mb-8 ${
            isPro
              ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
              : 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {isPro ? (
              <Sparkles className="h-6 w-6" />
            ) : (
              <Crown className="h-6 w-6" />
            )}
            <span className="text-lg font-semibold">{plan.name} Plan</span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold">€{price?.toFixed(2)}</span>
            <span className="text-white/80">
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          </div>

          {prorationAmount !== undefined && prorationAmount > 0 && (
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-sm">
                <span className="font-medium">Charged today:</span> €
                {prorationAmount.toFixed(2)} (prorated)
              </p>
            </div>
          )}
        </div>

        {/* Features unlocked */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className={isPro ? 'text-purple-500' : 'text-primary-500'} />
            Features Now Available
          </h2>

          <div className="space-y-3">
            {SUBSCRIPTION_TIERS[tier].features.map((feature: string, index: number) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <CheckCircle
                  className={`h-5 w-5 flex-shrink-0 ${
                    isPro ? 'text-purple-500' : 'text-primary-500'
                  }`}
                />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="text-amber-500" />
            Get Started
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/pets/new')}
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium text-gray-900">Add more pets</span>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => navigate('/settings', { state: { tab: 'family' } })}
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium text-gray-900">
                Invite family members
              </span>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>

            {isPro && (
              <button
                onClick={() => navigate('/pets')}
                className="flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors sm:col-span-2"
              >
                <span className="font-medium text-purple-900">
                  Set up lost pet alerts
                </span>
                <ArrowRight className="h-5 w-5 text-purple-400" />
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
              isPro
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            Go to Dashboard
          </button>

          <button
            onClick={() => navigate('/settings', { state: { tab: 'subscription' } })}
            className="px-8 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeSuccessPage;
