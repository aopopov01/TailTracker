/**
 * Privacy Policy Page
 * GDPR-compliant privacy policy for TailTracker
 */

import { Logo } from '@/components/Logo';

export const PrivacyPolicyPage = () => {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 mb-8">Last updated: December 2024</p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Company Identification */}
          <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-700 font-medium mb-2">
              TailTracker is a product of Xciterr Ltd (Ексайтерр ЕООД), Company ID: 206478710, headquartered in Sofia, Bulgaria.
            </p>
            <p className="text-slate-700">
              Xciterr Ltd is the data controller responsible for your personal data collected through TailTracker.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-700 mb-4">
              Xciterr Ltd. ("Company", "we", "us", or "our") operates TailTracker. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <p className="text-slate-700 mb-4">
              We are committed to protecting your privacy and complying with the General Data Protection
              Regulation (GDPR) and other applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Data Controller</h2>
            <p className="text-slate-700 mb-4">
              The data controller responsible for your personal data is:
            </p>
            <p className="text-slate-700">
              <strong>Xciterr Ltd.</strong><br />
              Sofia, Bulgaria<br />
              Registration Number: 206478710<br />
              Director: Alexander Popov<br />
              Email: <a href="mailto:info@xciterr.com" className="text-primary-600 hover:text-primary-700">info@xciterr.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Information We Collect</h2>
            <p className="text-slate-700 mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
              <li><strong>Pet Information:</strong> Pet names, species, breed, date of birth, health records, vaccination history, photos</li>
              <li><strong>Usage Data:</strong> How you interact with our platform, features used, timestamps</li>
              <li><strong>Device Information:</strong> Browser type, IP address, device identifiers</li>
              <li><strong>Payment Information:</strong> Processed securely through our payment provider; we do not store full payment details</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. How We Use Your Information</h2>
            <p className="text-slate-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Provide and maintain our services</li>
              <li>Process your transactions</li>
              <li>Send you reminders about pet health events (vaccinations, medications)</li>
              <li>Enable family sharing features</li>
              <li>Facilitate lost pet alerts (with your consent)</li>
              <li>Improve our platform and develop new features</li>
              <li>Communicate with you about updates and support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Legal Basis for Processing (GDPR)</h2>
            <p className="text-slate-700 mb-4">We process your personal data based on:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Contract:</strong> Processing necessary to provide our services to you</li>
              <li><strong>Consent:</strong> Where you have given explicit consent (e.g., marketing communications)</li>
              <li><strong>Legitimate Interests:</strong> For improving our services and preventing fraud</li>
              <li><strong>Legal Obligation:</strong> Where required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Data Sharing</h2>
            <p className="text-slate-700 mb-4">
              We do not sell your personal data. We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Family Members:</strong> Only pet information you choose to share through our family sharing feature</li>
              <li><strong>Service Providers:</strong> Trusted third parties who assist in operating our platform (hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Data Retention</h2>
            <p className="text-slate-700 mb-4">
              We retain your personal data for as long as your account is active or as needed to provide
              services. You may request deletion of your data at any time. After account deletion, we may
              retain certain data for legal compliance purposes for up to 5 years.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Your Rights (GDPR)</h2>
            <p className="text-slate-700 mb-4">Under GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-slate-700 mt-4">
              To exercise these rights, contact us at <a href="mailto:info@xciterr.com" className="text-primary-600 hover:text-primary-700">info@xciterr.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">9. Data Security</h2>
            <p className="text-slate-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal data,
              including encryption, secure servers, and access controls. However, no method of transmission
              over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">10. International Transfers</h2>
            <p className="text-slate-700 mb-4">
              Your data may be transferred to and processed in countries outside the European Economic Area
              (EEA). We ensure appropriate safeguards are in place for such transfers in compliance with GDPR.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">11. Cookies</h2>
            <p className="text-slate-700 mb-4">
              We use essential cookies to operate our platform. We may also use analytics cookies with your
              consent to understand how users interact with our services. You can manage cookie preferences
              in your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">12. Children's Privacy</h2>
            <p className="text-slate-700 mb-4">
              TailTracker is not intended for children under 16. We do not knowingly collect personal data
              from children under 16. If you believe we have collected such data, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">13. Changes to This Policy</h2>
            <p className="text-slate-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              via email or through the platform. The "Last updated" date at the top indicates when the policy
              was last revised.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">14. Contact Us</h2>
            <p className="text-slate-700 mb-4">
              If you have questions about this Privacy Policy or wish to exercise your data rights, contact us:
            </p>
            <p className="text-slate-700">
              <strong>Xciterr Ltd.</strong><br />
              Sofia, Bulgaria<br />
              Registration Number: 206478710<br />
              Email: <a href="mailto:info@xciterr.com" className="text-primary-600 hover:text-primary-700">info@xciterr.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">15. Supervisory Authority</h2>
            <p className="text-slate-700 mb-4">
              You have the right to lodge a complaint with the Bulgarian Commission for Personal Data Protection
              or another supervisory authority in your country of residence.
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
