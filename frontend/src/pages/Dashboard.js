import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../utils/api";
import '../style/Dashboard.css';
import AdminDashboard from '../components/Admin/AdminDashboard';
import SelectCampaign from "../pages/user/SelectCampaign";

// Komponen DashboardCredit
const DashboardCredit = () => {
  const [credit, setCredit] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    const fetchCredit = async () => {
      try {
        // Menggunakan endpoint getUserById dengan ID user yang sedang login
        const res = await fetchApi(`/auth/users/${user.id}`);
        if (res) {
          setCredit(res.total_credit || 0);
          setBalance(res.balance || 0);
        }
      } catch (err) {
        console.error("Failed to fetch credit:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) {
      fetchCredit();
    } else {
      setLoading(false);
    }
  }, [user.id]);

   return (
    <div className="dashboard-card">
      <div className="card-header">
        <h2>Credit</h2>
      </div>
      
      <div className="balance-credit-container">
{/* <div className="balance-section">
  <h3>Balance</h3>
  <p className="balance-value">
    {loading ? "Loading..." : `$${balance.toLocaleString('en-US')} USDT`}
  </p>
  <p className="balance-info-dashboard">
    {balance > 0
      ? `Your current balance is $${balance.toLocaleString('en-US')}`
      : "You don't have any balance, top up now."}
  </p>
</div> */}
        
        <div className="credit-section">
          {/* <h3>Credit</h3> */}
          <p className="credit-value">
            {loading ? "Loading..." : credit}
          </p>
          <p className="credit-info">
            {credit > 0
              ? `Your current credits is ${credit}`
              : "You don't have any credits."}
          </p>
        </div>
      </div>
      
      <button className="btn-primary" onClick={() => navigate("/deposits/topup")}>
        + Top Up Credit
      </button>
    </div>
  );
};

// Komponen What's New / Notifications
const WhatsNew = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Helper format tanggal ke English
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // fallback
    return date.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetchApi("/notifications");
        if (Array.isArray(res)) {
          setNotifications(res);
        } else if (res.success && Array.isArray(res.data)) {
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
            {/* ✅ pakai formatDate */}
            <p className="news-date">{formatDate(n.created_at)}</p>
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
  const navigate = useNavigate();
   const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);

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
      <button 
      className="btn-link" 
      onClick={() => navigate("/campaign")}>
      View Campaign →
    </button>
        </div>
      </div>

      {/* What's New Section */}
      <WhatsNew />
       <button className="btn-primary" onClick={() => setShowSelectModal(true)}>+ Create Campaign</button>

       {showSelectModal && (
         <div
           className="sc-overlay"
           onClick={(e) => {
             if (e.target === e.currentTarget) {
               setShowSelectModal(false); // ⬅️ close modal kalau klik di luar
             }
           }}
         >
           <div className="sc-modal">
             <SelectCampaign
               onBack={() => setShowSelectModal(false)}
               onNext={() => {
                 if (selectedChannel === "whatsapp") {
                   navigate("/campaigns/createwa");
                 } else if (selectedChannel === "sms") {
                   navigate("/campaigns/createsms");
                 }
                 setShowSelectModal(false);
               }}
               onSelectChannel={(ch) => setSelectedChannel(ch)}
               selected={selectedChannel}
             />
           </div>
         </div>
       )}
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
