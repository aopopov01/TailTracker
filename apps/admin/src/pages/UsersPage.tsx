/**
 * Users Management Page
 * List, search, and manage user accounts
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MoreVertical, Loader2, Mail, User, Calendar } from 'lucide-react';
import { supabaseAdmin } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface UserData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_status: string;
  created_at: string;
}

const fetchUsers = async (search: string): Promise<UserData[]> => {
  let query = supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, subscription_status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'premium':
      return <span className="badge badge-premium">Premium</span>;
    case 'family':
      return <span className="badge badge-info">Pro</span>;
    case 'expired':
      return <span className="badge badge-danger">Expired</span>;
    case 'cancelled':
      return <span className="badge badge-warning">Cancelled</span>;
    default:
      return <span className="badge bg-gray-100 text-gray-800">Free</span>;
  }
};

export const UsersPage = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: () => fetchUsers(debouncedSearch),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    // Debounce search
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage user accounts and subscriptions</p>
        </div>
        <button className="btn-primary">Export Users</button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                User
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                Email
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                Status
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                Joined
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-admin-600" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-red-600">
                  Error loading users
                </td>
              </tr>
            ) : users?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users?.map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-admin-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-admin-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : 'Unnamed User'}
                        </p>
                        <p className="text-sm text-gray-500">{user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user.subscription_status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
