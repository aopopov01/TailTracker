/**
 * Admin Dashboard Page
 * Overview with key metrics and stats
 */

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Dog,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { supabaseAdmin } from '../lib/supabase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Fetch dashboard stats
const fetchDashboardStats = async () => {
  const [usersResult, petsResult, subscriptionsResult, alertsResult] =
    await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('pets').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('users')
        .select('subscription_status')
        .in('subscription_status', ['premium', 'family']),
      supabaseAdmin.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'lost'),
    ]);

  return {
    totalUsers: usersResult.count || 0,
    totalPets: petsResult.count || 0,
    paidSubscriptions: subscriptionsResult.data?.length || 0,
    activeLostAlerts: alertsResult.count || 0,
  };
};

// Mock revenue data for chart
const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3500 },
  { name: 'Mar', revenue: 5200 },
  { name: 'Apr', revenue: 4800 },
  { name: 'May', revenue: 6100 },
  { name: 'Jun', revenue: 5400 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard = ({ title, value, change, icon, iconBg }: StatCardProps) => (
  <div className="stat-card">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <span
            className={`flex items-center text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of TailTracker platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={isLoading ? '...' : stats?.totalUsers || 0}
          change={12}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Total Pets"
          value={isLoading ? '...' : stats?.totalPets || 0}
          change={8}
          icon={<Dog className="h-6 w-6 text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard
          title="Paid Subscriptions"
          value={isLoading ? '...' : stats?.paidSubscriptions || 0}
          change={5}
          icon={<CreditCard className="h-6 w-6 text-admin-600" />}
          iconBg="bg-admin-100"
        />
        <StatCard
          title="Active Lost Alerts"
          value={isLoading ? '...' : stats?.activeLostAlerts || 0}
          change={-3}
          icon={<AlertTriangle className="h-6 w-6 text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      {/* Revenue Chart */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Revenue
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7c3aed"
                fill="#ede9fe"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Recent Signups</h3>
          <p className="text-sm text-gray-500 mb-4">Last 24 hours</p>
          <p className="text-3xl font-bold text-admin-600">24</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Pending Moderation
          </h3>
          <p className="text-sm text-gray-500 mb-4">Lost pet reports</p>
          <p className="text-3xl font-bold text-orange-600">3</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Failed Payments
          </h3>
          <p className="text-sm text-gray-500 mb-4">Last 7 days</p>
          <p className="text-3xl font-bold text-red-600">2</p>
        </div>
      </div>
    </div>
  );
};
