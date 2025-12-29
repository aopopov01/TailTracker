/**
 * Subscriptions Analytics Page
 * Revenue metrics, tier distribution, and subscription management
 */

import { useQuery } from '@tanstack/react-query';
import { CreditCard, TrendingUp, Users, AlertCircle, Loader2 } from 'lucide-react';
import { supabaseAdmin } from '../lib/supabase';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const fetchSubscriptionStats = async () => {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('subscription_status');

  if (error) throw error;

  const stats = {
    free: 0,
    premium: 0,
    family: 0,
    cancelled: 0,
    expired: 0,
  };

  users?.forEach((user) => {
    const status = user.subscription_status as keyof typeof stats;
    if (status in stats) {
      stats[status]++;
    }
  });

  return stats;
};

const COLORS = ['#e5e7eb', '#7c3aed', '#3b82f6', '#f59e0b', '#ef4444'];

// Mock monthly data
const monthlyRevenue = [
  { month: 'Jan', premium: 2400, pro: 1200 },
  { month: 'Feb', premium: 2800, pro: 1400 },
  { month: 'Mar', premium: 3200, pro: 1800 },
  { month: 'Apr', premium: 3600, pro: 2000 },
  { month: 'May', premium: 4100, pro: 2200 },
  { month: 'Jun', premium: 4500, pro: 2600 },
];

export const SubscriptionsPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: fetchSubscriptionStats,
  });

  const pieData = stats
    ? [
        { name: 'Free', value: stats.free },
        { name: 'Premium', value: stats.premium },
        { name: 'Pro', value: stats.family },
        { name: 'Cancelled', value: stats.cancelled },
        { name: 'Expired', value: stats.expired },
      ]
    : [];

  const totalUsers = stats
    ? Object.values(stats).reduce((a, b) => a + b, 0)
    : 0;
  const paidUsers = stats ? stats.premium + stats.family : 0;
  const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-admin-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600">Revenue and subscription analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Revenue</p>
            <p className="text-2xl font-bold text-gray-900">$7,100</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-admin-100 flex items-center justify-center">
            <Users className="h-6 w-6 text-admin-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Paid Users</p>
            <p className="text-2xl font-bold text-gray-900">{paidUsers}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{conversionRate}%</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Churn Rate</p>
            <p className="text-2xl font-bold text-gray-900">2.3%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tier Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Tier */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Tier
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="premium" name="Premium" fill="#7c3aed" />
                <Bar dataKey="pro" name="Pro" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tier Breakdown Table */}
      <div className="card mt-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tier Breakdown</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                Tier
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                Users
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                % of Total
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                Monthly Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="table-row">
              <td className="px-6 py-4 font-medium">Free</td>
              <td className="px-6 py-4 text-right">{stats?.free || 0}</td>
              <td className="px-6 py-4 text-right">
                {totalUsers > 0
                  ? (((stats?.free || 0) / totalUsers) * 100).toFixed(1)
                  : 0}
                %
              </td>
              <td className="px-6 py-4 text-right">$0</td>
            </tr>
            <tr className="table-row">
              <td className="px-6 py-4 font-medium">
                <span className="badge badge-premium">Premium</span>
              </td>
              <td className="px-6 py-4 text-right">{stats?.premium || 0}</td>
              <td className="px-6 py-4 text-right">
                {totalUsers > 0
                  ? (((stats?.premium || 0) / totalUsers) * 100).toFixed(1)
                  : 0}
                %
              </td>
              <td className="px-6 py-4 text-right">
                ${((stats?.premium || 0) * 4.99).toFixed(2)}
              </td>
            </tr>
            <tr className="table-row">
              <td className="px-6 py-4 font-medium">
                <span className="badge badge-info">Pro</span>
              </td>
              <td className="px-6 py-4 text-right">{stats?.family || 0}</td>
              <td className="px-6 py-4 text-right">
                {totalUsers > 0
                  ? (((stats?.family || 0) / totalUsers) * 100).toFixed(1)
                  : 0}
                %
              </td>
              <td className="px-6 py-4 text-right">
                ${((stats?.family || 0) * 9.99).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
