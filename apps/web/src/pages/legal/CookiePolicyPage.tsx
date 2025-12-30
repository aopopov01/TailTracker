/**
 * Cookie Policy Page
 * GDPR-compliant cookie policy for TailTracker
 */

import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export const CookiePolicyPage = () => {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Cookie Policy</h1>
        <p className="text-slate-500 mb-8">Last updated: December 2024</p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Company Identification */}
          <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-700">
              This Cookie Policy explains how Xciterr Ltd ("we", "us", or "our") uses cookies on TailTracker.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-700 mb-4">
              This Cookie Policy explains how Xciterr Ltd. (Ексайтерр ЕООД), Company ID: 206478710, Sofia, Bulgaria ("Company", "we", "us", or "our") uses cookies
              and similar technologies on the TailTracker platform. This policy is part of our commitment
              to protecting your privacy and complying with the General Data Protection Regulation (GDPR)
              and the ePrivacy Directive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. What Are Cookies?</h2>
            <p className="text-slate-700 mb-4">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile)
              when you visit a website. They help websites remember your preferences and improve your
              browsing experience. Cookies can be "session" cookies (deleted when you close your browser)
              or "persistent" cookies (remain on your device for a set period or until you delete them).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Types of Cookies We Use</h2>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-800 mb-3">3.1 Essential Cookies (Required)</h3>
              <p className="text-slate-700 mb-3">
                These cookies are necessary for the website to function properly. They cannot be disabled.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2 font-medium text-slate-700">Cookie</th>
                      <th className="pb-2 font-medium text-slate-700">Purpose</th>
                      <th className="pb-2 font-medium text-slate-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr>
                      <td className="py-1">sb-auth-token</td>
                      <td className="py-1">User authentication and session management</td>
                      <td className="py-1">Session</td>
                    </tr>
                    <tr>
                      <td className="py-1">cookie-consent</td>
                      <td className="py-1">Stores your cookie preferences</td>
                      <td className="py-1">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-1">XSRF-TOKEN</td>
                      <td className="py-1">Security - prevents cross-site request forgery</td>
                      <td className="py-1">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-800 mb-3">3.2 Analytics Cookies (Optional)</h3>
              <p className="text-slate-700 mb-3">
                These cookies help us understand how visitors interact with our website, allowing us to
                improve our services. We only use these with your consent.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2 font-medium text-slate-700">Cookie</th>
                      <th className="pb-2 font-medium text-slate-700">Purpose</th>
                      <th className="pb-2 font-medium text-slate-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr>
                      <td className="py-1">_ga</td>
                      <td className="py-1">Google Analytics - distinguishes users</td>
                      <td className="py-1">2 years</td>
                    </tr>
                    <tr>
                      <td className="py-1">_gid</td>
                      <td className="py-1">Google Analytics - distinguishes users</td>
                      <td className="py-1">24 hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-3">3.3 Marketing Cookies (Optional)</h3>
              <p className="text-slate-700 mb-3">
                These cookies may be used to track your browsing habits and show you relevant
                advertisements. We only use these with your explicit consent.
              </p>
              <p className="text-slate-600 text-sm italic">
                Currently, TailTracker does not use marketing cookies. If this changes, we will
                update this policy and request your consent.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Managing Your Cookie Preferences</h2>
            <p className="text-slate-700 mb-4">
              When you first visit TailTracker, you will see a cookie consent banner allowing you to
              accept or customize your cookie preferences. You can change these preferences at any time
              by clicking the "Cookie Settings" link in the footer.
            </p>
            <p className="text-slate-700 mb-4">
              You can also control cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>
                <strong>Chrome:</strong> Settings → Privacy and security → Cookies
              </li>
              <li>
                <strong>Firefox:</strong> Settings → Privacy & Security → Cookies
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Privacy → Cookies
              </li>
              <li>
                <strong>Edge:</strong> Settings → Cookies and site permissions
              </li>
            </ul>
            <p className="text-slate-700 mt-4">
              Note: Disabling essential cookies may affect the functionality of our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Third-Party Cookies</h2>
            <p className="text-slate-700 mb-4">
              Some cookies on our platform are placed by third-party services we use:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>
                <strong>Supabase:</strong> Our database provider, used for authentication
              </li>
              <li>
                <strong>Stripe:</strong> Our payment processor (only if you make a payment)
              </li>
              <li>
                <strong>Google Analytics:</strong> Website analytics (with your consent)
              </li>
            </ul>
            <p className="text-slate-700 mt-4">
              These third parties have their own privacy and cookie policies, which we encourage you to review.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Data Protection</h2>
            <p className="text-slate-700 mb-4">
              Information collected through cookies is subject to our{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
              . We do not sell any data collected through cookies. Cookie data is stored securely
              and retained only as long as necessary for its purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Changes to This Policy</h2>
            <p className="text-slate-700 mb-4">
              We may update this Cookie Policy from time to time. Significant changes will be
              communicated through our platform, and the "Last updated" date will be revised.
              Continued use of TailTracker after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Contact Us</h2>
            <p className="text-slate-700 mb-4">
              If you have questions about this Cookie Policy, please contact us:
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
