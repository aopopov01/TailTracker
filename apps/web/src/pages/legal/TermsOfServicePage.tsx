/**
 * Terms of Service Page
 * Legal terms for TailTracker usage
 */

import { Logo } from '@/components/Logo';

export const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Logo size="md" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-slate-500 mb-8">Last updated: December 2024</p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Company Identification */}
          <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-700">
              These Terms of Service ("Terms") govern your use of TailTracker, a product owned and operated by Xciterr Ltd (Ексайтерр ЕООД), Company ID: 206478710, Sofia, Bulgaria ("Company", "we", "us", or "our").
            </p>
            <p className="text-slate-700 mt-2 font-medium">
              By using TailTracker, you agree to these Terms with Xciterr Ltd.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-700 mb-4">
              Welcome to TailTracker. These Terms of Service govern your use of the TailTracker
              platform and services operated by Xciterr Ltd., a company
              registered in Bulgaria with registration number 206478710, headquartered in Sofia, Bulgaria.
            </p>
            <p className="text-slate-700 mb-4">
              By accessing or using TailTracker, you agree to be bound by these Terms. If you do not agree
              to these Terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Description of Service</h2>
            <p className="text-slate-700 mb-4">
              TailTracker is a pet management platform that allows users to track pet health records,
              vaccinations, medications, share pet care responsibilities with family members, and receive
              lost pet alerts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. User Accounts</h2>
            <p className="text-slate-700 mb-4">
              To use certain features of TailTracker, you must create an account. You are responsible for
              maintaining the confidentiality of your account credentials and for all activities that occur
              under your account. You agree to provide accurate and complete information when creating your
              account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Subscription Plans</h2>
            <p className="text-slate-700 mb-4">
              TailTracker offers free and paid subscription plans. Paid plans are billed on a monthly basis.
              You may cancel your subscription at any time. Refunds are provided in accordance with applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. User Content</h2>
            <p className="text-slate-700 mb-4">
              You retain ownership of any content you upload to TailTracker, including pet photos and health
              records. By uploading content, you grant us a license to store, display, and process this content
              solely for the purpose of providing our services to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Acceptable Use</h2>
            <p className="text-slate-700 mb-4">
              You agree not to use TailTracker for any unlawful purpose or in any way that could damage,
              disable, or impair our services. You agree not to upload any harmful, offensive, or illegal content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Disclaimer</h2>
            <p className="text-slate-700 mb-4">
              TailTracker is not a substitute for professional veterinary advice. Always consult a qualified
              veterinarian for medical decisions regarding your pet. We are not responsible for any decisions
              made based on information stored or displayed in our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-slate-700 mb-4">
              To the maximum extent permitted by law, Xciterr Ltd. shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of TailTracker.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">9. Changes to Terms</h2>
            <p className="text-slate-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of significant
              changes via email or through the platform. Continued use of TailTracker after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">10. Governing Law</h2>
            <p className="text-slate-700 mb-4">
              These Terms are governed by the laws of Bulgaria. Any disputes shall be resolved in the courts
              of Sofia, Bulgaria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">11. Contact Information</h2>
            <p className="text-slate-700 mb-4">
              For questions about these Terms, please contact us at:
            </p>
            <p className="text-slate-700">
              <strong>Xciterr Ltd.</strong><br />
              Sofia, Bulgaria<br />
              Registration Number: 206478710<br />
              Email: <a href="mailto:info@xciterr.com" className="text-primary-600 hover:text-primary-700">info@xciterr.com</a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} TailTracker, a product of Xciterr Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
