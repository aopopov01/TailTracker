/**
 * Admin Subscriptions Tab
 * Subscription management with charts and revenue reports
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Crown,
  DollarSign,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { getAdminSubscriptions, getAdminStats } from '@tailtracker/shared-services';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@tailtracker/shared-types';

type FilterTier = SubscriptionTier | 'all';
type FilterStatus = 'all' | 'active' | 'canceled' | 'expired' | 'trialing';

const ITEMS_PER_PAGE = 10;

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Current tier pricing (EUR)
const TIER_PRICING = {
  premium: { monthly: 5.99, yearly: 60.0 },
  pro: { monthly: 8.99, yearly: 90.0 },
};

const TierBadge = ({ tier }: { tier: SubscriptionTier }) => {
  const classes = {
    free: 'bg-slate-100 text-slate-700',
    premium: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
  };
  const icons = {
    free: null,
    premium: <Crown className="h-3 w-3" />,
    pro: <Crown className="h-3 w-3" />,
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize inline-flex items-center gap-1 ${classes[tier]}`}
    >
      {icons[tier]}
      {tier}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const classes: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    canceled: 'bg-red-100 text-red-700',
    expired: 'bg-slate-200 text-slate-600',
    trialing: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
        classes[status] || 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

export const SubscriptionsTab = () => {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<FilterTier>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminSubscriptions', search, tierFilter, statusFilter, page],
    queryFn: () =>
      getAdminSubscriptions({
        search: search || undefined,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      }),
  });

  const subscriptions = data?.subscriptions || [];
  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  // Calculate tier distribution for chart
  const tierData = stats
    ? [
        { name: 'Free', value: stats.freeUsers, color: '#94a3b8' },
        { name: 'Premium', value: stats.premiumUsers, color: '#3b82f6' },
        { name: 'Pro', value: stats.proUsers, color: '#a855f7' },
      ]
    : [];

  const totalSubscribers = tierData.reduce((sum, t) => sum + t.value, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          icon={DollarSign}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          icon={Crown}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Premium Users"
          value={stats?.premiumUsers || 0}
          icon={TrendingUp}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Pro Users"
          value={stats?.proUsers || 0}
          icon={Crown}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Subscription Distribution
          </h3>
          <div className="space-y-4">
            {tierData.map((tier) => {
              const percentage = ((tier.value / totalSubscribers) * 100).toFixed(1);
              return (
                <div key={tier.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-600">{tier.name}</span>
                    <span className="text-sm text-slate-500">
                      {tier.value.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: tier.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-slate-700">Premium ({formatCurrency(TIER_PRICING.premium.monthly)}/mo)</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency((stats?.premiumUsers || 0) * TIER_PRICING.premium.monthly)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm font-medium text-slate-700">Pro ({formatCurrency(TIER_PRICING.pro.monthly)}/mo)</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency((stats?.proUsers || 0) * TIER_PRICING.pro.monthly)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">Total MRR</span>
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(
                    (stats?.premiumUsers || 0) * TIER_PRICING.premium.monthly +
                    (stats?.proUsers || 0) * TIER_PRICING.pro.monthly
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Limits Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Tier Limits Configuration</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Feature</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">Free</th>
                <th className="text-center py-2 px-3 font-medium text-blue-600">Premium</th>
                <th className="text-center py-2 px-3 font-medium text-purple-600">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-3 text-slate-700">Max Pets</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.free.limits.maxPets}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.premium.limits.maxPets}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.pro.limits.maxPets}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Max Family Members</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.free.limits.maxFamilyMembers}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.premium.limits.maxFamilyMembers}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.pro.limits.maxFamilyMembers}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Photos per Pet</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.free.limits.maxPhotosPerPet}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.premium.limits.maxPhotosPerPet}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.pro.limits.maxPhotosPerPet}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Documents per Appointment</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.free.limits.maxDocumentsPerAppointment}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.premium.limits.maxDocumentsPerAppointment}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.pro.limits.maxDocumentsPerAppointment}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Calendar Sync</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.free.limits.canSyncCalendar ? '✓' : '✗'}</td>
                <td className="py-2 px-3 text-center text-green-600">{SUBSCRIPTION_TIERS.premium.limits.canSyncCalendar ? '✓' : '✗'}</td>
                <td className="py-2 px-3 text-center text-green-600">{SUBSCRIPTION_TIERS.pro.limits.canSyncCalendar ? '✓' : '✗'}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Email Reminders</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.free.limits.canReceiveEmailReminders ? '✓' : '✗'}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.premium.limits.canReceiveEmailReminders ? '✓' : '✗'}</td>
                <td className="py-2 px-3 text-center text-green-600">{SUBSCRIPTION_TIERS.pro.limits.canReceiveEmailReminders ? '✓' : '✗'}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Create Lost Pet Alerts</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.free.limits.canCreateLostPets ? '✓' : '✗'}</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.premium.limits.canCreateLostPets ? '✓' : '✗'}</td>
                <td className="py-2 px-3 text-center text-green-600">{SUBSCRIPTION_TIERS.pro.limits.canCreateLostPets ? '✓' : '✗'}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Ad-Free</td>
                <td className="py-2 px-3 text-center">{SUBSCRIPTION_TIERS.free.limits.isAdFree ? '✓' : '✗'}</td>
                <td className="py-2 px-3 text-center text-green-600">{SUBSCRIPTION_TIERS.premium.limits.isAdFree ? '✓' : '✗'}</td>
                <td className="py-2 px-3 text-center text-green-600">{SUBSCRIPTION_TIERS.pro.limits.isAdFree ? '✓' : '✗'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Note: All tiers have access to vaccinations, medical records, in-app reminders, and receiving lost pet alerts.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user email..."
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
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value as FilterTier);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
            >
              <option value="all">All Tiers</option>
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
              <option value="trialing">Trialing</option>
              <option value="canceled">Canceled</option>
              <option value="expired">Expired</option>
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-slate-600">Failed to load subscriptions</p>
            </div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No subscriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ends
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Trial
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-700 truncate max-w-[200px]">
                          {sub.userEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={sub.tier} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(sub.startedAt ?? null)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(sub.endsAt ?? null)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.trialEndsAt ? (
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                          <Clock className="h-4 w-4" />
                          {formatDate(sub.trialEndsAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
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
              {Math.min(page * ITEMS_PER_PAGE, data?.total || 0)} of {data?.total || 0}{' '}
              subscriptions
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
    </div>
  );
};
