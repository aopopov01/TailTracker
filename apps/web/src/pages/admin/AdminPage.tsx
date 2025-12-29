/**
 * Admin Dashboard Page
 * Main admin interface with tabbed navigation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PawPrint,
  CreditCard,
  Megaphone,
  Settings,
  Shield,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { isAdmin, getCurrentAdminUser } from '@tailtracker/shared-services';
import type { AdminUser } from '@tailtracker/shared-types';

import { OverviewTab } from './tabs/OverviewTab';
import { UsersTab } from './tabs/UsersTab';
import { PetsTab } from './tabs/PetsTab';
import { SubscriptionsTab } from './tabs/SubscriptionsTab';
import { AdsTab } from './tabs/AdsTab';
import { SettingsTab } from './tabs/SettingsTab';

type TabId = 'overview' | 'users' | 'pets' | 'subscriptions' | 'ads' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'pets', label: 'Pets', icon: PawPrint },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'ads', label: 'Ads & Promos', icon: Megaphone },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Check if user is admin
  const { data: isUserAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: isAdmin,
  });

  // Get admin user info
  const { data: adminUser } = useQuery<AdminUser | null>({
    queryKey: ['adminUser'],
    queryFn: getCurrentAdminUser,
    enabled: isUserAdmin === true,
  });

  // Redirect non-admins
  useEffect(() => {
    if (!checkingAdmin && isUserAdmin === false) {
      navigate('/dashboard', { replace: true });
    }
  }, [checkingAdmin, isUserAdmin, navigate]);

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'users':
        return <UsersTab />;
      case 'pets':
        return <PetsTab />;
      case 'subscriptions':
        return <SubscriptionsTab />;
      case 'ads':
        return <AdsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">
                  Logged in as {adminUser?.email || 'Admin'}
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                    {adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Back to App
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
};
