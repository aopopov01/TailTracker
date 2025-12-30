/**
 * Admin Settings Tab
 * Platform settings and audit logs
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invalidateAdminData } from '@/lib/cacheUtils';
import {
  Settings,
  FileText,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle,
  Clock,
  User,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  getPlatformSettings,
  updatePlatformSetting,
  getAdminAuditLogs,
  logAdminAction,
} from '@tailtracker/shared-services';
import type { PlatformSettings, AdminAuditTargetType } from '@tailtracker/shared-types';

type TabType = 'settings' | 'audit';

const ITEMS_PER_PAGE = 15;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ActionIcon = ({ action }: { action: string }) => {
  if (action.includes('delete')) {
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
  if (action.includes('update') || action.includes('change')) {
    return <Settings className="h-4 w-4 text-blue-500" />;
  }
  if (action.includes('create')) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  return <FileText className="h-4 w-4 text-slate-400" />;
};

const TargetBadge = ({ type }: { type: AdminAuditTargetType }) => {
  const colors: Record<AdminAuditTargetType, string> = {
    user: 'bg-blue-100 text-blue-700',
    pet: 'bg-green-100 text-green-700',
    subscription: 'bg-purple-100 text-purple-700',
    ad: 'bg-orange-100 text-orange-700',
    promo_code: 'bg-pink-100 text-pink-700',
    settings: 'bg-slate-100 text-slate-700',
    system: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${colors[type]}`}
    >
      {type.replace('_', ' ')}
    </span>
  );
};

interface SettingCardProps {
  title: string;
  description: string;
  settingKey: keyof PlatformSettings;
  value: string | number | boolean;
  type: 'boolean' | 'number' | 'text';
  onUpdate: (key: keyof PlatformSettings, value: string | number | boolean) => void;
  isPending: boolean;
}

const SettingCard = ({
  title,
  description,
  settingKey,
  value,
  type,
  onUpdate,
  isPending,
}: SettingCardProps) => {
  const [localValue, setLocalValue] = useState(value);
  const hasChanges = localValue !== value;

  const handleSave = () => {
    onUpdate(settingKey, localValue);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-slate-900">{title}</h4>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {type === 'boolean' ? (
            <button
              onClick={() => {
                const newValue = !localValue;
                setLocalValue(newValue);
                onUpdate(settingKey, newValue);
              }}
              disabled={isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localValue ? 'bg-primary-500' : 'bg-slate-200'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localValue ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          ) : type === 'number' ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={localValue as number}
                onChange={(e) => setLocalValue(Number(e.target.value))}
                className="w-20 px-2 py-1 text-right border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="p-1 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={localValue as string}
                onChange={(e) => setLocalValue(e.target.value)}
                className="w-48 px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="p-1 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SettingsTab = () => {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [page, setPage] = useState(1);

  // Settings query
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['platformSettings'],
    queryFn: getPlatformSettings,
    enabled: activeTab === 'settings',
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string | number | boolean }) =>
      updatePlatformSetting(key, value),
    onSuccess: (_, { key }) => {
      invalidateAdminData();
      logAdminAction('update_setting', 'settings', key);
    },
  });

  const handleUpdateSetting = (key: keyof PlatformSettings, value: string | number | boolean) => {
    updateSettingMutation.mutate({ key: String(key), value });
  };

  // Audit logs query
  const { data: auditData, isLoading: loadingAudit } = useQuery({
    queryKey: ['adminAuditLogs', page],
    queryFn: () => getAdminAuditLogs({ page, limit: ITEMS_PER_PAGE }),
    enabled: activeTab === 'audit',
  });

  const logs = auditData?.logs || [];
  const totalPages = Math.ceil((auditData?.total || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="h-4 w-4" />
          Platform Settings
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'audit'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Audit Log
        </button>
      </div>

      {/* Settings Section */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {loadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : !settings ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-slate-600">Failed to load settings</p>
              </div>
            </div>
          ) : (
            <>
              {/* System Settings */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-800">System Settings</h3>
                </div>
                <div className="space-y-3">
                  <SettingCard
                    title="Maintenance Mode"
                    description="When enabled, only admins can access the platform"
                    settingKey="maintenanceMode"
                    value={settings.maintenanceMode}
                    type="boolean"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                </div>
              </div>

              {/* Tier Limits */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Tier Limits</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <SettingCard
                    title="Free Tier - Max Pets"
                    description="Maximum pets for free users"
                    settingKey="maxPetsFree"
                    value={settings.maxPetsFree}
                    type="number"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                  <SettingCard
                    title="Premium Tier - Max Pets"
                    description="Maximum pets for premium users"
                    settingKey="maxPetsPremium"
                    value={settings.maxPetsPremium}
                    type="number"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                  <SettingCard
                    title="Free Tier - Max Family"
                    description="Maximum family members for free users"
                    settingKey="maxFamilyFree"
                    value={settings.maxFamilyFree}
                    type="number"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                  <SettingCard
                    title="Premium Tier - Max Family"
                    description="Maximum family members for premium users"
                    settingKey="maxFamilyPremium"
                    value={settings.maxFamilyPremium}
                    type="number"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                  <SettingCard
                    title="Free Tier - Max Photos"
                    description="Maximum photos per pet for free users"
                    settingKey="maxPhotosFree"
                    value={settings.maxPhotosFree}
                    type="number"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                  <SettingCard
                    title="Premium Tier - Max Photos"
                    description="Maximum photos per pet for premium users"
                    settingKey="maxPhotosPremium"
                    value={settings.maxPhotosPremium}
                    type="number"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                  <SettingCard
                    title="Pro Tier - Max Photos"
                    description="Maximum photos per pet for pro users"
                    settingKey="maxPhotosPro"
                    value={settings.maxPhotosPro}
                    type="number"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                </div>
              </div>

              {/* Notifications */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
                </div>
                <div className="space-y-3">
                  <SettingCard
                    title="Email Notifications"
                    description="Enable system-wide email notifications"
                    settingKey="emailNotificationsEnabled"
                    value={settings.emailNotificationsEnabled}
                    type="boolean"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                  <SettingCard
                    title="Push Notifications"
                    description="Enable system-wide push notifications"
                    settingKey="pushNotificationsEnabled"
                    value={settings.pushNotificationsEnabled}
                    type="boolean"
                    onUpdate={handleUpdateSetting}
                    isPending={updateSettingMutation.isPending}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Audit Log Section */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loadingAudit ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Admin
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Target
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-slate-500">
                            <Clock className="h-4 w-4" />
                            {formatDate(log.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-slate-700">
                            <User className="h-4 w-4 text-slate-400" />
                            {log.adminId.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 text-sm text-slate-700">
                            <ActionIcon action={log.action} />
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TargetBadge type={log.targetType} />
                            {log.targetId && (
                              <span className="text-xs text-slate-400 font-mono">
                                {log.targetId.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.details ? (
                            <span className="text-xs text-slate-500 font-mono">
                              {JSON.stringify(log.details).slice(0, 50)}
                              {JSON.stringify(log.details).length > 50 && '...'}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                  <p className="text-sm text-slate-600">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(page * ITEMS_PER_PAGE, auditData?.total || 0)} of{' '}
                    {auditData?.total || 0} logs
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-slate-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
