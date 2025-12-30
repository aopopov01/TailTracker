/**
 * Register Page
 * User registration form with GDPR-compliant consent checkboxes
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRegistration } from '@tailtracker/shared-types';

// Current versions of legal documents (update when policies change)
const TERMS_VERSION = '2024.12';
const PRIVACY_VERSION = '2024.12';

interface RegistrationFormData extends UserRegistration {
  consentTerms: boolean;
  consentMarketing: boolean;
}

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, isLoading, error, authError, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    defaultValues: {
      consentTerms: false,
      consentMarketing: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegistrationFormData) => {
    clearError();

    // Include consent data in registration
    await signUp({
      ...data,
      // These will be stored in user metadata
      consentTerms: data.consentTerms,
      consentMarketing: data.consentMarketing,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 text-center">
        Create your account
      </h2>
      <p className="mt-2 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/auth/login" className="link">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        {/* Auth service error banner */}
        {authError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Connection Issue</p>
              <p className="mt-1 text-amber-700">{authError}</p>
            </div>
          </div>
        )}

        {/* Form submission error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="label">
              First name
            </label>
            <input
              {...register('firstName', {
                required: 'First name is required',
              })}
              type="text"
              autoComplete="given-name"
              className={`input ${errors.firstName ? 'input-error' : ''}`}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="label">
              Last name
            </label>
            <input
              {...register('lastName', {
                required: 'Last name is required',
              })}
              type="text"
              autoComplete="family-name"
              className={`input ${errors.lastName ? 'input-error' : ''}`}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message:
                    'Password must contain uppercase, lowercase, and number',
                },
              })}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-500"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm password
          </label>
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Consent Section */}
        <div className="space-y-4 pt-2">
          <p className="text-sm font-medium text-slate-700">Consent & Privacy</p>

          {/* Terms & Privacy Consent (Required) */}
          <div className="flex items-start">
            <input
              {...register('consentTerms', {
                required: 'You must agree to the Terms of Service and Privacy Policy',
              })}
              type="checkbox"
              id="consentTerms"
              className={`h-4 w-4 mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 ${
                errors.consentTerms ? 'border-red-500' : ''
              }`}
            />
            <label htmlFor="consentTerms" className="ml-2 text-sm text-slate-600">
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="link">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" target="_blank" className="link">
                Privacy Policy
              </Link>
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
          {errors.consentTerms && (
            <p className="text-sm text-red-600 -mt-2 ml-6">
              {errors.consentTerms.message}
            </p>
          )}

          {/* Marketing Consent (Optional) */}
          <div className="flex items-start">
            <input
              {...register('consentMarketing')}
              type="checkbox"
              id="consentMarketing"
              className="h-4 w-4 mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="consentMarketing" className="ml-2 text-sm text-slate-600">
              I would like to receive updates, tips, and promotional offers from TailTracker via email.
              <span className="text-slate-400 ml-1">(optional)</span>
            </label>
          </div>

          <p className="text-xs text-slate-500 ml-6">
            You can withdraw your consent at any time in your account settings or by contacting us at{' '}
            <a href="mailto:info@xciterr.com" className="link">info@xciterr.com</a>.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Create account'
          )}
        </button>

        <p className="text-xs text-center text-slate-500">
          By creating an account, you acknowledge that you have read our{' '}
          <Link to="/cookies" target="_blank" className="link">Cookie Policy</Link>.
        </p>
      </form>
    </div>
  );
};

// Export consent version constants for use elsewhere
export { TERMS_VERSION, PRIVACY_VERSION };
