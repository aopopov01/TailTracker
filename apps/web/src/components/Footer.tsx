/**
 * Footer Component
 * Displays company information and legal links
 * Used across all pages for consistent branding and legal compliance
 */

import { Link, useLocation } from 'react-router-dom';

interface FooterProps {
  variant?: 'minimal' | 'full';
  onCookieSettingsClick?: () => void;
}

export const Footer = ({ variant = 'minimal', onCookieSettingsClick }: FooterProps) => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  // Check if we're on a legal page to highlight the correct link
  const isLegalPage = (path: string) => location.pathname === path;

  if (variant === 'minimal') {
    return (
      <footer className="border-t py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <p>&copy; {currentYear} TailTracker, a product of Xciterr Ltd. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/terms"
                className={`hover:text-primary-600 transition-colors ${isLegalPage('/terms') ? 'text-primary-600' : ''}`}
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className={`hover:text-primary-600 transition-colors ${isLegalPage('/privacy') ? 'text-primary-600' : ''}`}
              >
                Privacy
              </Link>
              <Link
                to="/cookies"
                className={`hover:text-primary-600 transition-colors ${isLegalPage('/cookies') ? 'text-primary-600' : ''}`}
              >
                Cookies
              </Link>
              <Link
                to="/imprint"
                className={`hover:text-primary-600 transition-colors ${isLegalPage('/imprint') ? 'text-primary-600' : ''}`}
              >
                Imprint
              </Link>
              {onCookieSettingsClick && (
                <button
                  onClick={onCookieSettingsClick}
                  className="hover:text-primary-600 transition-colors"
                >
                  Cookie Settings
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Full variant with more details
  return (
    <footer className="border-t py-8" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/pets/logo.png" alt="TailTracker" className="h-8 w-8" />
              <span className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>TailTracker</span>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Your complete pet management platform. Track vaccinations, medical records, and more.
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Operated by Xciterr Ltd., Sofia, Bulgaria
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/terms"
                  className="transition-colors"
                  style={{ color: isLegalPage('/terms') ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="transition-colors"
                  style={{ color: isLegalPage('/privacy') ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="transition-colors"
                  style={{ color: isLegalPage('/cookies') ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/imprint"
                  className="transition-colors"
                  style={{ color: isLegalPage('/imprint') ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                >
                  Imprint
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Contact</h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <li>
                <a
                  href="mailto:info@xciterr.com"
                  className="hover:text-primary-600 transition-colors"
                >
                  info@xciterr.com
                </a>
              </li>
              <li>Sofia, Bulgaria</li>
              <li>Company ID: 206478710</li>
              {onCookieSettingsClick && (
                <li>
                  <button
                    onClick={onCookieSettingsClick}
                    className="hover:text-primary-600 transition-colors"
                  >
                    Cookie Settings
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            &copy; {currentYear} TailTracker, a product of Xciterr Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
