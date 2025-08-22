import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/use-toast';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import CheckEmail from './components/Auth/CheckEmail';
import NotFound from './components/Common/NotFound';

import MainLayout from './layouts/MainLayout';
import CampaignDashboard from './components/Campaigns/CampaignDashboard';
import CampaignDashboardUser from './pages/user/CampaignDashboard';
import AdminCampaignList from './components/Campaigns/AdminCampaignList';
import AdminCreateCampaign from './components/Campaigns/AdminCreateCampaign';
import CampaignDetailModal from './components/Campaigns/CampaignDetailModal';
import AdminDashboard from './components/Admin/AdminDashboard';
import CreateCampaignPage from './components/Campaigns/CreateCampaignModal'; // Import the new page component

import AdminRoute from './components/Auth/AdminRoute';
import PrivateRoute from './components/Auth/PrivateRoute';
import AccountChecking from './components/Auth/AccountChecking';
import VerifyUser from './pages/admin/VerifyUser';

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

const AppRoutes = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/check-email" element={<CheckEmail />} />
      
      {/* User Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/campaign"
        element={
          <PrivateRoute>
            <MainLayout>
              <CampaignDashboardUser />
            </MainLayout>
          </PrivateRoute>
        }
      />

      {/* New Campaign Creation Route */}
      <Route
        path="/campaigns/new"
        element={
          <PrivateRoute>
            <MainLayout>
              <CreateCampaignPage />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route path="/account-checking" element={<AccountChecking />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <MainLayout admin>
              <AdminDashboard />
            </MainLayout>
          </AdminRoute>
        }
      />


            {/* Add this new route for verification */}
      <Route
        path="/admin/verify-user/:id"
        element={
          <AdminRoute>
            <MainLayout admin>
              <VerifyUser />
            </MainLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/campaigns"
        element={
          <AdminRoute>
            <MainLayout admin>
              <AdminCampaignList />
            </MainLayout>
          </AdminRoute>
        }
      />


      <Route
        path="/admin/campaigns/create"
        element={
          <AdminRoute>
            <MainLayout admin>
              <AdminCreateCampaign />
            </MainLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/campaigns/:id"
        element={
          <AdminRoute>
            <MainLayout admin>
              <CampaignDetailModal />
            </MainLayout>
          </AdminRoute>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;