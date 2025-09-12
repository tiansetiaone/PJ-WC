import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/use-toast";

import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import CheckEmail from "./components/Auth/CheckEmail";
import NotFound from "./components/Common/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

import MainLayout from "./layouts/MainLayout";
import CampaignDashboard from "./components/Campaigns/CampaignDashboard";
import CampaignDashboardUser from "./pages/user/CampaignDashboard";
import AdminCampaignList from "./components/Campaigns/AdminCampaignList";
import AdminCreateCampaign from "./components/Campaigns/AdminCreateCampaign";
import CampaignDetailModal from "./components/Campaigns/CampaignDetailModal";
import AdminDashboard from "./components/Admin/AdminDashboard";
import CreateCampaignPageWA from "./pages/user/CreateCampaignUser"; // Import the new page component
import CreateCampaignPageSMS from "./pages/user/CreateCampaignUser2"; // Import the new page component
import NotificationManagement from "./pages/admin/NotificationManagement";
import CreateNotification from "./pages/admin/CreateNotification";
import Deposit from "./pages/user/Deposit";
import TopUpCredit from "./pages/user/TopUpCredit";
import TopUpCredit2 from "./pages/user/TopUpCredit2";
import TopUpCredit3 from "./pages/user/TopUpCredit3";
import DepositManagement from "./pages/admin/DepositManagement";
import ReferralDashboard from "./pages/user/ReferralDashboard";
import EditProfile from "./pages/user/EditProfile";
import ContactSupport from "./pages/user/ContactSupport";
import DepositAmountsPage from "./pages/admin/DepositAmountsPage";
import LandingPage from "./pages/LandingPage";
import CampaignPricing from "./pages/admin/CampaignPricing";


import UserManagement from "./pages/admin/UserManagement";
import AdminRoute from "./components/Auth/AdminRoute";
import PrivateRoute from "./components/Auth/PrivateRoute";
import AccountChecking from "./components/Auth/AccountChecking";
import VerifyUser from "./pages/admin/VerifyUser";
import ReferralSettings from "./pages/admin/ReferralSettings";
import TicketSupport from "./pages/admin/TicketSupport";

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
      <div
        className="app-loading"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
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
        path="/campaigns/createwa"
        element={
          <PrivateRoute>
            <MainLayout>
              <CreateCampaignPageWA />
            </MainLayout>
          </PrivateRoute>
        }
      />

      {/* New Campaign Creation Route */}
      <Route
        path="/campaigns/createsms"
        element={
          <PrivateRoute>
            <MainLayout>
              <CreateCampaignPageSMS />
            </MainLayout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/deposits/list"
        element={
          <PrivateRoute>
            <MainLayout>
              <Deposit />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/deposits/topup"
        element={
          <PrivateRoute>
            <MainLayout>
              <TopUpCredit />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/deposits/topup2"
        element={
          <PrivateRoute>
            <MainLayout>
              <TopUpCredit2 />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/deposits/topup-credit-3"
        element={
          <PrivateRoute>
            <MainLayout>
              <TopUpCredit3 />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/referral"
        element={
          <PrivateRoute>
            <MainLayout>
              <ReferralDashboard />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/contact/user"
        element={
          <PrivateRoute>
            <MainLayout>
              <ContactSupport />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/edit-profil"
        element={
          <PrivateRoute>
            <MainLayout>
              <EditProfile />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route path="/account-checking" element={<AccountChecking />} />

      {/* Admin Routes */}

        <Route
          path="/admin/notifications"
          element={
          <AdminRoute>
            <MainLayout admin>
              <NotificationManagement />
            </MainLayout>
          </AdminRoute>
          }
        />
        <Route
          path="/admin/create/notifications"
          element={
          <AdminRoute>
            <MainLayout admin>
              <CreateNotification />
            </MainLayout>
          </AdminRoute>
          }
        />

      
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

      <Route
        path="/admin/deposits/list"
        element={
          <AdminRoute>
            <MainLayout admin>
              <DepositManagement />
            </MainLayout>
          </AdminRoute>
        }
      />
      
      <Route
        path="/admin/referral/list"
        element={
          <AdminRoute>
            <MainLayout admin>
              <ReferralSettings />
            </MainLayout>
          </AdminRoute>
        }
      />

            <Route
        path="/contact/admin"
        element={
          <AdminRoute>
            <MainLayout admin>
              <TicketSupport />
            </MainLayout>
          </AdminRoute>
        }
      />

        <Route
        path="/admin/user/list"
        element={
          <AdminRoute>
            <MainLayout admin>
              <UserManagement />
            </MainLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/create/amount"
        element={
          <AdminRoute>
            <MainLayout admin>
              <DepositAmountsPage />
            </MainLayout>
          </AdminRoute>
        }
      />


            <Route
        path="/admin/pricing"
        element={
          <AdminRoute>
            <MainLayout admin>
              <CampaignPricing />
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
