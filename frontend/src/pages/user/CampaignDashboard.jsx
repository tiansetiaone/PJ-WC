import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CampaignListUser from "./CampaignList";
import CampaignListAdmin from "../admin/CampaignListAdmin";
import UploadNumbersModal from "./UploadNumbersModal";
import { fetchApi } from "../../utils/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import "../../style/user/CampaignDashboardUser.css";

export default function CampaignDashboard() {
  const navigate = useNavigate();
  const [uploadModal, setUploadModal] = useState({
    open: false,
    campaignId: null,
  });
  const [stats, setStats] = useState([
    { label: "Total", value: 0, color: "blue", icon: "🏴" },
    { label: "Checking", value: 0, color: "orange", icon: "🔍" },
    { label: "Success", value: 0, color: "green", icon: "✅" },
    { label: "Failed", value: 0, color: "red", icon: "❌" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = userData.role === "admin";

  const [monthlyData, setMonthlyData] = useState([]);

  // Fetch campaign stats
  const fetchCampaignStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = isAdmin
        ? "/campaigns/admin/stats"
        : "/campaigns/stats";
      const response = await fetchApi(endpoint);
      if (response.success) {
        const { data } = response;
        setStats([
          { label: "Total", value: Number(data.total) || 0, color: "blue", icon: "🏴" },
          { label: "Checking", value: Number(data.on_process) || 0, color: "orange", icon: "🔍" },
          { label: "Success", value: Number(data.success) || 0, color: "green", icon: "✅" },
          { label: "Failed", value: Number(data.failed) || 0, color: "red", icon: "❌" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching campaign stats:", err);
      setError("Gagal memuat statistik campaign");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchCampaignStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Data grafik dari stats khusus success & failed
  const chartData = [
    {
      name: "Campaign Result",
      success: stats.find((s) => s.label === "Success")?.value || 0,
      failed: stats.find((s) => s.label === "Failed")?.value || 0,
    },
  ];

  const fetchMonthlyStats = async () => {
  try {
    const endpoint = isAdmin
      ? "/campaigns/admin/stats/monthly"
      : "/campaigns/stats/monthly";
    const response = await fetchApi(endpoint);
    if (response.success) {
      setMonthlyData(response.data);
    }
  } catch (err) {
    console.error("Error fetching monthly stats:", err);
  }
};

useEffect(() => {
  fetchMonthlyStats();
}, []);

  return (
    <div className="cd-root">
      {/* Main Content */}
      <main className="cd-main">
        <header className="cd-header">
          <h1>{isAdmin ? "Campaign Management" : "Campaign"}</h1>
          {!isAdmin && (
            <button
              className="cd-btn-primary"
              onClick={() => navigate("/campaigns/new")}
            >
              + Create New Campaign
            </button>
          )}
        </header>

        {/* Error */}
        {error && (
          <div className="cd-error">
            {error}
            <button onClick={fetchCampaignStats} className="cd-retry-btn">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Stats & Analytics hanya untuk User */}
        {!isAdmin && (
          <>
            {/* Stats */}
            <div className="cd-stats">
              {stats.map((s) => (
                <div key={s.label} className={`cd-stat cd-${s.color}`}>
                  <div className="cd-stat-icon">{s.icon}</div>
                  <div className="cd-stat-value">
                    {loading ? "..." : s.value.toLocaleString()}
                  </div>
                  <div className="cd-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Analytics */}
<div className="cd-card">
  <h3>Campaign Analytics</h3>
  <div className="cd-chart-wrapper" style={{ width: "100%", height: "300px" }}>
    {loading ? (
      "Memuat data..."
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="success" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
</div>
          </>
        )}

        {/* Campaign List */}
        <div className="cd-card">
          {isAdmin ? (
            <CampaignListAdmin onCampaignUpdate={fetchCampaignStats} />
          ) : (
            <>
              <CampaignListUser
                onUploadNumbers={(campaignId) =>
                  setUploadModal({ open: true, campaignId })
                }
                onCampaignUpdate={fetchCampaignStats}
              />
              {uploadModal.open && (
                <UploadNumbersModal
                  campaignId={uploadModal.campaignId}
                  onClose={() =>
                    setUploadModal({ open: false, campaignId: null })
                  }
                  onSuccess={fetchCampaignStats}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
