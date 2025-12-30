/**
 * Imprint / Legal Notice Page
 * Company information and legal disclosure for TailTracker
 * Required by EU regulations (German Impressum, Bulgarian equivalent)
 */

import { Link } from 'react-router-dom';
import { Building2, Mail, Globe, Shield, FileText } from 'lucide-react';
import { Logo } from '@/components/Logo';

export const ImprintPage = () => {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Imprint / Legal Notice</h1>
        <p className="text-slate-500 mb-8">Information according to EU and Bulgarian regulations</p>

        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Company Information</h2>
            </div>

            <div className="space-y-4 text-slate-700">
              <div>
                <p className="font-semibold text-lg">Xciterr Ltd.</p>
                <p className="text-slate-500">(Ексайтерр ЕООД)</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Registration Number</p>
                  <p className="font-medium">206478710</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Legal Form</p>
                  <p className="font-medium">Limited Liability Company (EOOD)</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Registered Office</p>
                  <p className="font-medium">Sofia, Bulgaria</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Commercial Register</p>
                  <p className="font-medium">Bulgarian Commercial Register</p>
                </div>
              </div>
            </div>
          </div>

          {/* Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Management</h2>
            <div className="text-slate-700">
              <p className="text-sm text-slate-500 mb-1">Managing Director</p>
              <p className="font-medium">Alexander Popov</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Contact Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-slate-700">
              <div>
                <p className="text-sm text-slate-500 mb-1">Email</p>
                <a
                  href="mailto:info@xciterr.com"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  info@xciterr.com
                </a>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Website</p>
                <a
                  href="https://xciterr.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  xciterr.com
                </a>
              </div>
            </div>
          </div>

          {/* Platform Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Platform Information</h2>
            </div>

            <div className="text-slate-700">
              <p className="font-medium mb-2">TailTracker</p>
              <p className="text-slate-600 mb-4">
                TailTracker is a pet management platform operated by Xciterr Ltd.
                The platform provides pet owners with tools to track vaccinations,
                medical records, and other important pet health information.
              </p>
              <p className="text-sm text-slate-500">
                TailTracker is not a substitute for professional veterinary advice.
                Always consult a qualified veterinarian for medical decisions regarding your pet.
              </p>
            </div>
          </div>

          {/* Data Protection */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Data Protection</h2>
            </div>

            <div className="text-slate-700 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Data Protection Officer Contact</p>
                <a
                  href="mailto:info@xciterr.com"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  info@xciterr.com
                </a>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Supervisory Authority</p>
                <p className="font-medium">Commission for Personal Data Protection (Bulgaria)</p>
                <p className="text-sm text-slate-600">
                  Address: 2 Prof. Tsvetan Lazarov Blvd., Sofia 1592, Bulgaria
                </p>
              </div>
            </div>
          </div>

          {/* Legal Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Legal Documents</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Link
                to="/terms"
                className="p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
              >
                <p className="font-medium text-slate-900">Terms of Service</p>
                <p className="text-sm text-slate-500">Rules governing your use of TailTracker</p>
              </Link>

              <Link
                to="/privacy"
                className="p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
              >
                <p className="font-medium text-slate-900">Privacy Policy</p>
                <p className="text-sm text-slate-500">How we handle your personal data</p>
              </Link>

              <Link
                to="/cookies"
                className="p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
              >
                <p className="font-medium text-slate-900">Cookie Policy</p>
                <p className="text-sm text-slate-500">Information about cookies we use</p>
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Disclaimer</h2>
            <div className="text-slate-700 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Liability for Content</h3>
                <p className="text-sm text-slate-600">
                  The contents of our pages have been created with the utmost care. However, we cannot
                  guarantee the contents' accuracy, completeness, or topicality. We are not obligated to
                  monitor transmitted or stored third-party information or investigate circumstances that
                  indicate illegal activity.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Liability for Links</h3>
                <p className="text-sm text-slate-600">
                  Our website contains links to external websites of third parties, on whose contents we
                  have no influence. We cannot assume any liability for these external contents. The
                  respective provider or operator of the linked pages is always responsible for their content.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Copyright</h3>
                <p className="text-sm text-slate-600">
                  The content and works created by the site operators on these pages are subject to
                  copyright law. Duplication, processing, distribution, or any form of commercialization
                  of such material beyond the scope of the copyright law shall require the prior written
                  consent of its respective author or creator.
                </p>
              </div>
            </div>
          </div>
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
