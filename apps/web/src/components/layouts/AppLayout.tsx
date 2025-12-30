/**
 * App Layout
 * Main application layout with clean, minimal navigation
 * Supports light/dark theme via CSS variables
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Dog,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Pets', href: '/pets', icon: Dog },
  { name: 'My Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin', href: '/admin', icon: Shield, adminOnly: true },
];

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const { user, signOut } = useAuth();
  useAuthStore(); // Keep for auth state tracking
  const location = useLocation();

  // Check if user has admin role (from user object, no extra query needed)
  const isUserAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const isActive = (href: string) => location.pathname.startsWith(href);

  // Filter navigation items based on admin role
  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || isUserAdmin
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          className="fixed inset-y-0 left-0 w-64 shadow-lg"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderRight: '1px solid var(--color-border)'
          }}
        >
          <div
            className="flex items-center justify-between h-16 px-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <Logo size="md" linkTo="/dashboard" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-item ${isActive(item.href) ? 'nav-item-active' : ''}`}
              >
                <item.icon className="nav-item-icon" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div
          className="flex flex-col flex-grow"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderRight: '1px solid var(--color-border)'
          }}
        >
          <div
            className="flex items-center h-16 px-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <Logo size="md" linkTo="/dashboard" />
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive(item.href) ? 'nav-item-active' : ''}`}
              >
                <item.icon className="nav-item-icon" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            {/* User Card with Inline Subscription Badge */}
            <div
              className="mb-3 p-3 rounded-xl"
              style={{ backgroundColor: 'var(--color-bg-hover)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {user?.firstName || 'User'}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Mobile header */}
        <div
          className="sticky top-0 z-40 lg:hidden backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Logo size="md" linkTo="/dashboard" />
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8 flex-1">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer
          variant="minimal"
          onCookieSettingsClick={() => setCookieSettingsOpen(true)}
        />
      </div>

      {/* Cookie Settings Modal */}
      <CookieConsent
        isOpen={cookieSettingsOpen}
        onClose={() => setCookieSettingsOpen(false)}
      />
    </div>
  );
};
