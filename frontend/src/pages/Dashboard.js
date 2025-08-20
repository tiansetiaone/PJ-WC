import React, { useEffect, useState } from "react";
import { fetchApi } from "../utils/api";
import '../style/Dashboard.css';
import AdminDashboard from '../components/Admin/AdminDashboard';

// Komponen DashboardCredit
const DashboardCredit = () => {
  const [credit, setCredit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredit = async () => {
      try {
        const res = await fetchApi("/deposits/credit/total");
        if (res.success) {
          setCredit(res.totalCredit);
        }
      } catch (err) {
        console.error("Failed to fetch credit:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCredit();
  }, []);

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h2>Credit</h2>
      </div>
      <p className="credit-value">
        {loading ? "Loading..." : credit}
      </p>
      <p className="credit-info">
        {credit > 0
          ? `Your current balance is ${credit}`
          : "You don't have any balance, top up now."}
      </p>
      <button className="btn-primary">+ Top Up Credit</button>
    </div>
  );
};

// Komponen What's New / Notifications
const WhatsNew = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetchApi("/notifications");
        if (Array.isArray(res)) {
          setNotifications(res);
        } else if (res.success && Array.isArray(res.data)) {
          // jika backend kirim dengan { success, data }
          setNotifications(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="news-section">
      <h2 className="news-heading">What's New</h2>
      {loading ? (
        <p>Loading news...</p>
      ) : notifications.length === 0 ? (
        <p>No updates available.</p>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className="news-card">
            <p className="news-date">
              {new Date(n.created_at).toLocaleString("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
            <h3 className="news-title">{n.title}</h3>
            <p>{n.content}</p>
          </div>
        ))
      )}
    </div>
  );
};

// Komponen UserDashboard
const UserDashboard = () => {
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [onProcessCount, setOnProcessCount] = useState(0);
  const [loadingCampaign, setLoadingCampaign] = useState(true);

  useEffect(() => {
    const fetchCampaignStats = async () => {
      try {
        const res = await fetchApi("/campaigns");
        if (res.success) {
          const campaigns = res.data || [];
          const success = campaigns.filter(c => c.status === "success").length;
          const failed = campaigns.filter(c => c.status === "failed").length;
          const onProcess = campaigns.filter(c => c.status === "on_process").length;

          setSuccessCount(success);
          setFailedCount(failed);
          setOnProcessCount(onProcess);
        }
      } catch (err) {
        console.error("Failed to fetch campaigns:", err.message);
      } finally {
        setLoadingCampaign(false);
      }
    };

    fetchCampaignStats();
  }, []);

  return (
    <div>
      {/* Credit & Campaign Stats */}
      <div className="dashboard-grid">
        <DashboardCredit />

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Campaign</h2>
          </div>
          <div className="campaign-stats">
            <div className="stat success">
              <span className="stat-number">
                {loadingCampaign ? "..." : successCount}
              </span>
              <span>Success</span>
            </div>
            <div className="stat failed">
              <span className="stat-number">
                {loadingCampaign ? "..." : failedCount}
              </span>
              <span>Failed</span>
            </div>
            <div className="stat on-process">
              <span className="stat-number">
                {loadingCampaign ? "..." : onProcessCount}
              </span>
              <span>On Process</span>
            </div>
          </div>
          <button className="btn-link">View Campaign →</button>
        </div>
      </div>

      {/* What's New Section */}
      <WhatsNew />
       <button className="btn-primary">+ Create Campaign</button>
    </div>
  );
};

// Komponen utama Dashboard
const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const role = user.role || 'user';

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="welcome-text">Welcome, {user.name || 'User'}!</p>

      {role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
};

export default Dashboard;
