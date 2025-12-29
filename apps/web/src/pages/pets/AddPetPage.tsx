/**
 * Add Pet Page
 * Uses the 7-step Pet Onboarding Wizard
 * Enforces subscription-based pet limits
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PetOnboardingWizard } from '@/components/PetOnboarding';
import { getPets } from '@tailtracker/shared-services';
import { useSubscription } from '@/hooks/useSubscription';

export const AddPetPage = () => {
  const navigate = useNavigate();
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);

  // Get fresh subscription data (not cached from user object)
  const { features, isLoading: subscriptionLoading } = useSubscription();

  // Check pet limit on mount
  useEffect(() => {
    const checkPetLimit = async () => {
      // Wait for subscription data to load
      if (subscriptionLoading) return;

      try {
        const pets = await getPets();
        const petLimit = features.maxPets;

        if (pets.length >= petLimit) {
          // User has reached their limit, redirect to pricing
          navigate('/pricing', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking pet limit:', error);
        // Continue to allow adding pet if check fails
      }
      setIsCheckingLimit(false);
    };

    checkPetLimit();
  }, [features.maxPets, subscriptionLoading, navigate]);

  // Show loading state while checking limit or loading subscription
  if (isCheckingLimit || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Checking your plan limits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/pets"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Pets
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Add a New Pet</h1>
          <p className="mt-1 text-slate-600">
            Create a complete profile for your furry friend in a few simple steps
          </p>
        </div>

        {/* Wizard */}
        <PetOnboardingWizard />
      </div>
    </div>
  );
};
