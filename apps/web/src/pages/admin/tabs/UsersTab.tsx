/**
 * Admin Users Tab
 * User management with search, filter, and CRUD operations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateAdminData } from '@/lib/cacheUtils';
import {
  Search,
  Filter,
  MoreVertical,
  UserCog,
  Trash2,
  Crown,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  PawPrint,
  Edit,
  X,
  Save,
  User,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import {
  getAdminUsers,
  updateUserRole,
  updateUserSubscription,
  toggleUserStatus,
  deleteUser,
  logAdminAction,
  updateUserProfile,
} from '@tailtracker/shared-services';
import type { AdminUser, AdminRole, SubscriptionTier } from '@tailtracker/shared-types';
import { syncPlatform } from '@/utils/syncPlatform';
import { CreateUserModal } from '@/components/Admin';
import { useAuth } from '@/hooks/useAuth';

type FilterRole = AdminRole | 'all';
type FilterSubscription = SubscriptionTier | 'all';
type FilterStatus = 'all' | 'active' | 'suspended';

const ITEMS_PER_PAGE = 10;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const RoleBadge = ({ role }: { role: AdminRole }) => {
  const classes = {
    user: 'bg-slate-100 text-slate-700',
    admin: 'bg-blue-100 text-blue-700',
    super_admin: 'bg-purple-100 text-purple-700',
  };
  const labels = {
    user: 'User',
    admin: 'Admin',
    super_admin: 'Super Admin',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${classes[role]}`}>
      {labels[role]}
    </span>
  );
};

const SubscriptionBadge = ({ tier }: { tier: SubscriptionTier }) => {
  const classes = {
    free: 'bg-slate-100 text-slate-700',
    premium: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${classes[tier]}`}>
      {tier}
    </span>
  );
};

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isActive ? 'Active' : 'Suspended'}
    </span>
  );
};

// ===================================
// EDIT USER MODAL
// ===================================

interface EditUserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  subscriptionTier: SubscriptionTier;
  phone: string;
  city: string;
}

interface UserEditModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (updates: Partial<EditUserFormData>) => void;
  isSaving: boolean;
}

const UserEditModal = ({ user, onClose, onSave, isSaving }: UserEditModalProps) => {
  const [formData, setFormData] = useState<EditUserFormData>({
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    phone: user.phone || '',
    city: user.city || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Edit User Profile</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {/* Subscription Tier */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Subscription Tier
            </label>
            <select
              value={formData.subscriptionTier}
              onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as SubscriptionTier })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// ===================================
// USER ACTIONS MENU
// ===================================

interface UserActionsMenuProps {
  user: AdminUser;
  displayedRole: AdminRole;
  displayedTier: SubscriptionTier;
  hasPendingRole: boolean;
  hasPendingTier: boolean;
  onRoleChange: (role: AdminRole) => void;
  onSubscriptionChange: (tier: SubscriptionTier) => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEditProfile: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const UserActionsMenu = ({
  user,
  displayedRole,
  displayedTier,
  hasPendingRole,
  hasPendingTier,
  onRoleChange,
  onSubscriptionChange,
  onToggleStatus,
  onDelete,
  onEditProfile,
  isOpen,
  onToggle,
}: UserActionsMenuProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Calculate dropdown position based on button location
  const updatePosition = useCallback(() => {
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56 = 14rem = 224px

      setMenuPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap
        left: Math.max(8, rect.right + window.scrollX - menuWidth), // Align right edge, min 8px from edge
      });
    }
  }, [isOpen]);

  // Update position when menu opens and on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  // Dropdown content rendered via Portal
  const dropdownContent = isOpen ? (
    <div
      ref={menuRef}
      className="fixed w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[9999]"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
      }}
    >
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-1">
          Change Role {hasPendingRole && <span className="text-orange-500">(unsaved)</span>}
        </p>
        <div className="flex gap-1">
          {(['user', 'admin', 'super_admin'] as AdminRole[]).map((role) => (
            <button
              key={role}
              onClick={() => onRoleChange(role)}
              className={`px-2 py-1 text-xs rounded ${
                displayedRole === role
                  ? hasPendingRole
                    ? 'bg-orange-100 text-orange-700 font-medium ring-2 ring-orange-300'
                    : 'bg-primary-100 text-primary-700 font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'super_admin' ? 'Super' : role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-1">
          Change Subscription {hasPendingTier && <span className="text-orange-500">(unsaved)</span>}
        </p>
        <div className="flex gap-1">
          {(['free', 'premium', 'pro'] as SubscriptionTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => onSubscriptionChange(tier)}
              className={`px-2 py-1 text-xs rounded capitalize ${
                displayedTier === tier
                  ? hasPendingTier
                    ? 'bg-orange-100 text-orange-700 font-medium ring-2 ring-orange-300'
                    : 'bg-primary-100 text-primary-700 font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onEditProfile}
        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
      >
        <Edit className="h-4 w-4 text-blue-500" />
        <span>Edit Full Profile</span>
      </button>
      <button
        onClick={onToggleStatus}
        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
      >
        {user.isActive ? (
          <>
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            <span>Suspend User</span>
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span>Reactivate User</span>
          </>
        )}
      </button>
      <button
        onClick={onDelete}
        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        <span>Delete User</span>
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className={`p-1 rounded transition-colors ${isOpen ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
      >
        <MoreVertical className={`h-4 w-4 ${isOpen ? 'text-slate-700' : 'text-slate-500'}`} />
      </button>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};

export const UsersTab = () => {
  const queryClient = useQueryClient();
  const { user: currentUser, refreshUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<FilterSubscription>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<AdminUser>>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['adminUsers', search, roleFilter, subscriptionFilter, statusFilter, page],
    queryFn: () =>
      getAdminUsers({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        subscriptionTier: subscriptionFilter !== 'all' ? subscriptionFilter : undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        page,
        limit: ITEMS_PER_PAGE,
      }),
  });

  /**
   * Comprehensive platform sync - clears ALL cached data
   * and refreshes everything from the database
   */
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Use global sync to clear all caches across the platform
      await syncPlatform(queryClient);

      // Refetch admin data after sync
      await refetch();

      console.log('[UsersTab] Platform sync completed');
    } catch (error) {
      console.error('[UsersTab] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Track a change locally WITHOUT saving to database
  const trackChange = (userId: string, field: 'role' | 'subscriptionTier', value: AdminRole | SubscriptionTier) => {
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(userId) || {};
      newMap.set(userId, { ...existing, [field]: value });
      return newMap;
    });
    setOpenMenuId(null);
  };

  // Get display value (pending change or original)
  const getDisplayValue = <K extends keyof AdminUser>(user: AdminUser, field: K): AdminUser[K] => {
    const pending = pendingChanges.get(user.id);
    if (pending && field in pending) {
      return pending[field as keyof typeof pending] as AdminUser[K];
    }
    return user[field];
  };

  // Check if field has pending change
  const hasPendingChange = (userId: string, field: 'role' | 'subscriptionTier'): boolean => {
    const pending = pendingChanges.get(userId);
    return pending !== undefined && field in pending;
  };

  // Save ALL pending changes to database
  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    try {
      // Save all pending changes
      for (const [userId, changes] of pendingChanges) {
        // Update role if changed
        if (changes.role) {
          await updateUserRole(userId, changes.role as AdminRole);
          logAdminAction('update_user_role', 'user', userId, { newRole: changes.role });
        }
        // Update subscription if changed
        if (changes.subscriptionTier) {
          await updateUserSubscription(userId, changes.subscriptionTier as SubscriptionTier);
          logAdminAction('update_user_subscription', 'user', userId, { newTier: changes.subscriptionTier });
        }
      }

      // Check if the current user's subscription or role was changed
      // If so, refresh their auth data to sync the sidebar badge and other UI elements
      // Note: pendingChanges is keyed by users table ID, but currentUser.id is auth user ID
      // So we need to find the user by authUserId first
      if (currentUser?.id && data?.users) {
        const currentAdminUser = data.users.find(u => u.authUserId === currentUser.id);
        if (currentAdminUser) {
          const currentUserChanges = pendingChanges.get(currentAdminUser.id);
          if (currentUserChanges?.subscriptionTier || currentUserChanges?.role) {
            await refreshUser();
          }
        }
      }

      // Clear pending changes
      setPendingChanges(new Map());

      // Refresh data
      invalidateAdminData();
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, disabled }: { userId: string; disabled: boolean }) =>
      toggleUserStatus(userId, disabled),
    onSuccess: (_, { userId }) => {
      invalidateAdminData();
      logAdminAction('toggle_user_status', 'user', userId);
      setOpenMenuId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: (_, userId) => {
      invalidateAdminData();
      logAdminAction('delete_user', 'user', userId);
      setOpenMenuId(null);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<EditUserFormData> }) =>
      updateUserProfile(userId, updates),
    onSuccess: (result) => {
      if (result.success) {
        invalidateAdminData();
        setEditingUser(null);
      } else {
        console.error('Failed to update profile:', result.error);
        alert(`Failed to update profile: ${result.error || 'Unknown error'}`);
      }
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleEditProfile = (user: AdminUser) => {
    setEditingUser(user);
    setOpenMenuId(null);
  };

  const handleSaveProfile = (updates: Partial<EditUserFormData>) => {
    if (editingUser) {
      updateProfileMutation.mutate({ userId: editingUser.id, updates });
    }
  };

  const handleDelete = (user: AdminUser) => {
    if (window.confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const users = data?.users || [];
  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as FilterRole);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={subscriptionFilter}
              onChange={(e) => {
                setSubscriptionFilter(e.target.value as FilterSubscription);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
            </select>
            <Crown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as FilterStatus);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <UserCog className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          {/* Save Button - Always visible, disabled when no changes */}
          <button
            onClick={handleSaveAll}
            disabled={pendingChanges.size === 0 || isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              pendingChanges.size > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={pendingChanges.size > 0 ? 'Save pending changes' : 'No changes to save'}
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
            <span className="text-sm">Save{pendingChanges.size > 0 ? ` (${pendingChanges.size})` : ''}</span>
          </button>
          {/* Sync Button - Clears ALL caches across the platform */}
          <button
            onClick={handleSync}
            disabled={isSyncing || isFetching}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Sync entire platform - clears all cached data"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 ${isSyncing || isFetching ? 'animate-spin' : ''}`} />
            <span className="text-sm text-slate-600 hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
          {/* Create User Button */}
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Create User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-slate-600">Failed to load users</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pets
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {user.fullName ||
                              (user.firstName || user.lastName
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : 'No name')}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {hasPendingChange(user.id, 'role') ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 ring-2 ring-orange-300">
                          {getDisplayValue(user, 'role') === 'super_admin' ? 'Super Admin' :
                           getDisplayValue(user, 'role').charAt(0).toUpperCase() + getDisplayValue(user, 'role').slice(1)}
                        </span>
                      ) : (
                        <RoleBadge role={user.role} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hasPendingChange(user.id, 'subscriptionTier') ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full capitalize bg-orange-100 text-orange-700 ring-2 ring-orange-300">
                          {getDisplayValue(user, 'subscriptionTier')}
                        </span>
                      ) : (
                        <SubscriptionBadge tier={user.subscriptionTier} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={user.isActive} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-slate-600">
                        <PawPrint className="h-4 w-4" />
                        {user.petCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserActionsMenu
                        user={user}
                        displayedRole={getDisplayValue(user, 'role')}
                        displayedTier={getDisplayValue(user, 'subscriptionTier')}
                        hasPendingRole={hasPendingChange(user.id, 'role')}
                        hasPendingTier={hasPendingChange(user.id, 'subscriptionTier')}
                        isOpen={openMenuId === user.id}
                        onToggle={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                        onRoleChange={(role) => trackChange(user.id, 'role', role)}
                        onSubscriptionChange={(tier) => trackChange(user.id, 'subscriptionTier', tier)}
                        onToggleStatus={() => toggleStatusMutation.mutate({ userId: user.id, disabled: user.isActive })}
                        onDelete={() => handleDelete(user)}
                        onEditProfile={() => handleEditProfile(user)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, data?.total || 0)} of {data?.total || 0} users
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
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveProfile}
          isSaving={updateProfileMutation.isPending}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onSuccess={() => {
          invalidateAdminData();
        }}
      />
    </div>
  );
};
