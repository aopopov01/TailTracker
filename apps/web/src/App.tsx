/**
 * TailTracker Web Application
 * Main application component with routing
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth, useRealtimeUpdates } from '@/hooks';

// Layouts
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { AppLayout } from '@/components/layouts/AppLayout';

// Contexts - Only for authenticated routes
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PetsPage } from '@/pages/pets/PetsPage';
import { PetDetailPage } from '@/pages/pets/PetDetailPage';
import { AddPetPage } from '@/pages/pets/AddPetPage';
import { EditPetPage } from '@/pages/pets/EditPetPage';
import { DigitalPassportPage } from '@/pages/pets/DigitalPassportPage';
import { VaccinationsPage } from '@/pages/pets/VaccinationsPage';
import { AddVaccinationPage } from '@/pages/pets/AddVaccinationPage';
import { EditVaccinationPage } from '@/pages/pets/EditVaccinationPage';
import { MedicalRecordsPage } from '@/pages/pets/MedicalRecordsPage';
import { AddMedicalRecordPage } from '@/pages/pets/AddMedicalRecordPage';
import { EditMedicalRecordPage } from '@/pages/pets/EditMedicalRecordPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { RemindersPage } from '@/pages/RemindersPage';
import { ReminderDetailPage } from '@/pages/ReminderDetailPage';
import { PricingPage } from '@/pages/PricingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { TermsOfServicePage } from '@/pages/legal/TermsOfServicePage';
import { PrivacyPolicyPage } from '@/pages/legal/PrivacyPolicyPage';
import { CookiePolicyPage } from '@/pages/legal/CookiePolicyPage';
import { ImprintPage } from '@/pages/legal/ImprintPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { UpgradeSuccessPage } from '@/pages/UpgradeSuccessPage';
import { FamilySharingPage } from '@/pages/FamilySharingPage';
import { SharedPetsPage } from '@/pages/SharedPetsPage';
import { SharedPetDetailPage } from '@/pages/SharedPetDetailPage';

// Components
import { CookieConsent } from '@/components/CookieConsent';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
      <p className="mt-4 text-slate-500 text-sm">Loading...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitialized } = useAuth();

  // Show loading only during initial auth check
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitialized } = useAuth();

  // Show loading only during initial auth check
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  // Enable realtime updates from Supabase
  useRealtimeUpdates();

  return (
    <>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/imprint" element={<ImprintPage />} />

      {/* Auth Routes */}
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Protected App Routes - Providers only wrap authenticated routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SubscriptionProvider>
              <PreferencesProvider>
                <AppLayout />
              </PreferencesProvider>
            </SubscriptionProvider>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="pets" element={<PetsPage />} />
        <Route path="pets/:id" element={<PetDetailPage />} />
        <Route path="pets/:id/edit" element={<EditPetPage />} />
        <Route path="pets/:id/passport" element={<DigitalPassportPage />} />
        <Route path="pets/:id/vaccinations" element={<VaccinationsPage />} />
        <Route path="pets/:id/vaccinations/new" element={<AddVaccinationPage />} />
        <Route path="pets/:id/vaccinations/:vacId/edit" element={<EditVaccinationPage />} />
        <Route path="pets/:id/medical-records" element={<MedicalRecordsPage />} />
        <Route path="pets/:id/medical-records/new" element={<AddMedicalRecordPage />} />
        <Route path="pets/:id/medical-records/:recordId/edit" element={<EditMedicalRecordPage />} />
        <Route path="pets/new" element={<AddPetPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="family-sharing" element={<FamilySharingPage />} />
        <Route path="shared-pets" element={<SharedPetsPage />} />
        <Route path="shared-pets/:id" element={<SharedPetDetailPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="reminders/:id" element={<ReminderDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/subscription/success" element={<UpgradeSuccessPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <CookieConsent />
    <Toaster position="top-right" richColors duration={4000} />
    </>
  );
}

export default App;
