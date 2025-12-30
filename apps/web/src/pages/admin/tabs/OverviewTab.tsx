/**
 * Admin Overview Tab
 * Dashboard overview with stats and recent activity
 */

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  PawPrint,
  CreditCard,
  TrendingUp,
  Activity,
  Loader2,
  AlertCircle,
  UserPlus,
  Dog,
  Crown,
} from 'lucide-react';
import { getAdminStats, getRecentActivity } from '@tailtracker/shared-services';
import type { AdminStats, AdminActivity } from '@tailtracker/shared-types';

interface StatCardProps {
  title: string;
  value: number | string;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard = ({ title, value, trend, icon: Icon, color }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp
                className={`h-4 w-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}
              />
              <span
                className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {trend >= 0 ? '+' : ''}{trend} this week
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const SubscriptionBreakdown = ({ stats }: { stats: AdminStats }) => {
  const tiers = [
    { name: 'Free', count: stats.freeUsers, color: 'bg-slate-400' },
    { name: 'Premium', count: stats.premiumUsers, color: 'bg-blue-500' },
    { name: 'Pro', count: stats.proUsers, color: 'bg-purple-500' },
  ];

  const total = stats.totalUsers || 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Subscription Breakdown</h3>
      <div className="space-y-4">
        {tiers.map((tier) => {
          const percentage = ((tier.count / total) * 100).toFixed(1);
          return (
            <div key={tier.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-600">{tier.name}</span>
                <span className="text-sm text-slate-500">
                  {tier.count} ({percentage}%)
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${tier.color} rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ActivityIcon = ({ type }: { type: AdminActivity['type'] }) => {
  switch (type) {
    case 'user_signup':
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case 'pet_created':
      return <Dog className="h-4 w-4 text-blue-500" />;
    case 'subscription_change':
      return <Crown className="h-4 w-4 text-purple-500" />;
    default:
      return <Activity className="h-4 w-4 text-slate-400" />;
  }
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const RecentActivityFeed = ({ activities }: { activities: AdminActivity[] }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
            >
              <div className="mt-0.5">
                <ActivityIcon type={activity.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{activity.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const OverviewTab = () => {
  const {
    data: stats,
    isLoading: loadingStats,
    error: statsError,
  } = useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
  });

  const { data: activities } = useQuery<AdminActivity[]>({
    queryKey: ['adminRecentActivity'],
    queryFn: () => getRecentActivity(10),
  });

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-slate-600">Failed to load admin statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          trend={stats.newUsersThisWeek}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Pets"
          value={stats.totalPets}
          trend={stats.newPetsThisWeek}
          icon={PawPrint}
          color="green"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
          color="purple"
        />
        <StatCard
          title="Revenue (Monthly)"
          value={`€${stats.monthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubscriptionBreakdown stats={stats} />
        <RecentActivityFeed activities={activities || []} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.totalVaccinations}</p>
          <p className="text-sm text-slate-500">Vaccinations Tracked</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.totalMedicalRecords}</p>
          <p className="text-sm text-slate-500">Medical Records</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.lostPetsCount}</p>
          <p className="text-sm text-slate-500">Active Lost Pets</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.overdueVaccinations}</p>
          <p className="text-sm text-slate-500">Overdue Vaccinations</p>
        </div>
      </div>
    </div>
  );
};
