/**
 * Admin Layout
 * Sidebar navigation and main content area
 */

import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  AlertTriangle,
  Settings,
  LogOut,
  Dog,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'Lost Pet Alerts', href: '/lost-pets', icon: AlertTriangle },
  { name: 'System', href: '/system', icon: Settings },
];

export const AdminLayout = () => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-admin-600 flex items-center justify-center">
              <Dog className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">TailTracker</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700">
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
