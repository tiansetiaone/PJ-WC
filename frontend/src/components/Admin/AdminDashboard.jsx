import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../style/admin/AdminDashboard.css"; // import css terpisah

const AdminDashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState({ registered: 0, failed: 0 });
  const [campaignStats, setCampaignStats] = useState({ success: 0, failed: 0 });
  const [depositStats, setDepositStats] = useState({ received: 0, failed: 0 });
  const [referralStats, setReferralStats] = useState({
    current_earnings: 0,
    converted_earnings: 0,
    total_registered: 0,
    total_visited: 0,
  });
  const navigate = useNavigate();

  // 🔹 Format tanggal agar tidak "Invalid Date" - changed to English
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // fallback kalau gagal parse
    return date.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });
  };

  // 🔹 Ambil data notifikasi dari backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token"); 
        const res = await axios.get("http://localhost:5000/api/notifications/admin", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data); 
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchNotifications();
  }, []);

  // 🔹 Ambil data user stats dari backend
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/profile/stats/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (res.data.success) {
          setUserStats(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching user stats:", err);
      }
    };
    fetchUserStats();
  }, []);

  useEffect(() => {
    const fetchCampaignStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/campaigns/admin/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (res.data.success) {
          setCampaignStats(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching campaign stats:", err);
      }
    };
    fetchCampaignStats();
  }, []);

  // 🔹 Ambil data deposit stats
  useEffect(() => {
    const fetchDepositStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/deposits/admin/deposit-stats", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.data.success) {
          setDepositStats(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching deposit stats:", err);
      }
    };
    fetchDepositStats();
  }, []);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/referrals/admin/global-stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // hasil query gabungan SQL: total_registered, total_visited, total_payouts, total_pending, total_commissions
        setReferralStats({
          current_earnings: res.data.total_pending || 0,
          converted_earnings: res.data.total_payouts || 0,
          total_registered: res.data.total_registered || 0,
          total_visited: res.data.total_visited || 0,
        });
      } catch (err) {
        console.error("Error fetching referral data:", err);
      }
    };

    fetchReferralData();
  }, []);

  // 🔹 Komponen Card
  const Card = ({ title, stats, link, onClick }) => (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
        <button className="btn-link" onClick={onClick}>
          {link} →
        </button>
      </div>
      <div className="card-stats">
        {stats.map((s, i) => (
          <div key={i} className="stat-block">
            <p className="stat-label">{s.label}</p>
            <p className={`stat-value ${s.type}`}>
              {s.type === "green" ? "✔" : "✖"} {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      {/* 🔹 Grid Statistik */}
      <div className="grid">
        <Card
          title="User"
          stats={[
            { label: "Registered", value: userStats.registered, type: "green" },
            { label: "Failed", value: userStats.failed, type: "red" },
          ]}
          link="View User"
          onClick={() => navigate("/admin/user/list")}
        />

        <Card
          title="Campaign"
          stats={[
            { label: "Success", value: campaignStats.success, type: "green" },
            { label: "Failed", value: campaignStats.failed, type: "red" },
          ]}
          link="View Campaign"
          onClick={() => navigate("/campaign")}
        />

        <Card
          title="Deposit"
          stats={[
            { label: "Received", value: depositStats.received, type: "green" },
            { label: "Failed", value: depositStats.failed, type: "red" },
          ]}
          link="View Deposit"
          onClick={() => navigate("/admin/deposits/list")}
        />

        <Card
          title="Referral"
          stats={[
            {
              label: "Payouts",
              value: referralStats.converted_earnings,
              type: "green",
            },
            {
              label: "Visited",
              value: referralStats.total_visited,
              type: "red",
            },
          ]}
          link="View Referral"
          onClick={() => navigate("/admin/referral/list")}
        />
      </div>

      {/* 🔹 What's New Section */}
      <section className="news-section">
        <h2 className="news-title">What's New</h2>

        {notifications.length === 0 ? (
          <p className="news-empty">No new notifications yet.</p>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="news-card">
              {/* Tanggal */}
              <p className="news-date">{formatDate(notif.created_at)}</p>
              {/* Judul */}
              <h3 className="news-heading">{notif.title}</h3>
              {/* Konten */}
              <p className="news-body">{notif.content}</p>
            </div>
          ))
        )}
      </section>

      <button className="btn-primary" onClick={() => navigate("/admin/notifications")}>+ Create New Notification</button>
    </div>
  );
};

export default AdminDashboard;