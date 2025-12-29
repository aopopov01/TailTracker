/**
 * WizardProgress Component
 * Displays step indicator for the pet onboarding wizard
 */

import { Check } from 'lucide-react';
import { ONBOARDING_STEPS } from './types';

interface WizardProgressProps {
  currentStep: number;
}

export const WizardProgress = ({ currentStep }: WizardProgressProps) => {
  return (
    <div className="w-full mb-8">
      {/* Step indicators */}
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{
              width: `${(currentStep / (ONBOARDING_STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Step circles */}
        {ONBOARDING_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="relative flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center z-10
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-primary-500 text-white'
                      : isCurrent
                        ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                        : 'bg-slate-200 text-slate-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step label - only show on larger screens */}
              <div className="hidden md:block mt-2 text-center">
                <p
                  className={`text-xs font-medium ${
                    isCurrent
                      ? 'text-primary-600'
                      : isCompleted
                        ? 'text-slate-600'
                        : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current step info - mobile friendly */}
      <div className="mt-4 text-center md:hidden">
        <p className="text-sm font-medium text-primary-600">
          Step {currentStep + 1}: {ONBOARDING_STEPS[currentStep].title}
        </p>
        <p className="text-xs text-slate-500">
          {ONBOARDING_STEPS[currentStep].description}
        </p>
      </div>
    </div>
  );
};
