/**
 * Verify Email Page
 * Displayed after registration when email verification is required
 */

import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

export const VerifyEmailPage = () => {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
        <Mail className="h-6 w-6 text-primary-600" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">
        Verify your email
      </h2>
      <p className="mt-2 text-gray-600">
        We've sent a verification link to your email address. Please click the
        link to verify your account.
      </p>
      <div className="mt-6 space-y-4">
        <p className="text-sm text-gray-500">
          Didn't receive the email? Check your spam folder or{' '}
          <button className="text-primary-600 hover:text-primary-500 font-medium">
            resend the verification email
          </button>
          .
        </p>
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
};
