/**
 * Admin Dashboard App
 * Main routing and layout structure
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { LostPetsPage } from './pages/LostPetsPage';
import { SystemPage } from './pages/SystemPage';
import { LoginPage } from './pages/LoginPage';

function App() {
  // TODO: Implement proper admin authentication check
  const isAuthenticated = true;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {isAuthenticated ? (
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/lost-pets" element={<LostPetsPage />} />
            <Route path="/system" element={<SystemPage />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
