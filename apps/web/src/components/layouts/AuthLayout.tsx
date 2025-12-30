/**
 * Auth Layout
 * Layout for authentication pages with clean, minimal design
 */

import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-surface">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
        <Logo size="lg" />
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-2xl sm:px-10 border border-slate-100">
          <Outlet />
        </div>
      </div>

      <div className="mt-8">
        <Footer variant="minimal" />
      </div>
    </div>
  );
};
