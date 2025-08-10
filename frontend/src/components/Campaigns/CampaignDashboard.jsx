import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import CampaignList from "./CampaignList";
import UploadNumbersModal from "./UploadNumbersModal";
import "../../style/CampaignDashboard.css"; // Import CSS native

export default function CampaignDashboard() {
  const navigate = useNavigate();
const [uploadModal, setUploadModal] = useState({ open: false, campaignId: null });


  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Campaign</h1>
        <button
          className="create-btn"
          onClick={() => navigate("/campaigns/new")}
        >
          + Create New Campaign
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="analytics-summary">
        <div className="analytics-card">
          <span className="analytics-label">Total</span>
          <span className="analytics-value">0</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-label">Checking</span>
          <span className="analytics-value">0</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-label">Success</span>
          <span className="analytics-value">0</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-label">Failed</span>
          <span className="analytics-value">0</span>
        </div>
      </div>

{/* Campaign Analytics */}
      <div className="section-card">
        <h2 className="section-title">Campaign Analytics</h2>
        <div className="empty-state">
          <img src="/images/analytics-empty.png" alt="No Campaign Analytics" />
          <p className="empty-title">No Campaign Analytics Yet</p>
          <p className="empty-subtitle">
            Track and measure the performance of your campaigns here. Review
            delivery rates, engagement, and results to optimize your next
            campaign.
          </p>
        </div>
      </div>

    {/* Campaign Activity */}
 <div className="section-card">
      <h2 className="section-title">Campaign Activity</h2>
      <CampaignList
        onUploadNumbers={(campaignId) =>
          setUploadModal({ open: true, campaignId })
        }
      />
      {/* Modal Upload Numbers */}
      {uploadModal.open && (
        <div className="modal">
          <h3>Upload Numbers for Campaign {uploadModal.campaignId}</h3>
          {/* form upload numbers */}
          <button onClick={() => setUploadModal({ open: false, campaignId: null })}>
            Close
          </button>
        </div>
      )}
    </div>


{/* Modal Upload */}
      {uploadModal.open && (
        <UploadNumbersModal
          campaignId={uploadModal.campaignId}
          onClose={() => setUploadModal({ open: false, campaignId: null })}
        />
      )}
    </div>
  );
}
