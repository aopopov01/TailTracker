/**
 * 404 Not Found Page
 * Displayed when user navigates to an invalid URL
 */

import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Logo size="md" />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary-50 border-2 border-primary-100 mb-6">
              <img
                src="/images/pets/Logo.png"
                alt="TailTracker"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-7xl font-bold text-primary-500">
              404
            </h1>
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Page Not Found
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            The page you're looking for doesn't exist.
            Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Home className="h-5 w-5" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-outline flex items-center gap-2 px-6 py-3"
            >
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} TailTracker. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
