import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CampaignList from "./CampaignList";
import UploadNumbersModal from "./UploadNumbersModal";
import "../../style/CampaignDashboard.css"; // CSS native

export default function CampaignDashboard() {
  const navigate = useNavigate();
  const [uploadModal, setUploadModal] = useState({
    open: false,
    campaignId: null,
  });

  const stats = [
    { label: "Total", value: 255, color: "blue", icon: "🏴" },
    { label: "Checking", value: 3, color: "orange", icon: "🔍" },
    { label: "Success", value: 240, color: "green", icon: "✅" },
    { label: "Failed", value: 12, color: "red", icon: "❌" },
  ];



  return (
    <div className="cd-root">

      {/* Main Content */}
      <main className="cd-main">
        {/* Header */}
        <header className="cd-header">
          <h1>Campaign</h1>
          <button
            className="cd-btn-primary"
            onClick={() => navigate("/campaigns/new")}
          >
            + Create New Campaign
          </button>
        </header>

        {/* Stats */}
        <div className="cd-stats">
          {stats.map((s) => (
            <div key={s.label} className={`cd-stat cd-${s.color}`}>
              <div className="cd-stat-icon">{s.icon}</div>
              <div className="cd-stat-value">{s.value}</div>
              <div className="cd-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Analytics */}
        <div className="cd-card">
          <h3>Campaign Analytics</h3>
          <div className="cd-chart-placeholder">[Chart Here]</div>
        </div>

        {/* Campaign Activity */}
<div className="cd-card">
  {/* Campaign List (sudah ada) */}
  <CampaignList
    onUploadNumbers={(campaignId) =>
      setUploadModal({ open: true, campaignId })
    }
  />

  {/* Modal Upload Numbers */}
  {uploadModal.open && (
    <UploadNumbersModal
      campaignId={uploadModal.campaignId}
      onClose={() =>
        setUploadModal({ open: false, campaignId: null })
      }
    />
  )}
</div>
      </main>
    </div>
  );
}
