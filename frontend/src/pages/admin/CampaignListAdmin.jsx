import React, { useState, useEffect } from "react";
import { fetchApi } from "../../utils/api";
import { useToast } from "../../components/ui/use-toast";
import CampaignInfo from "./CampaignInfo";
import "../../style/admin/CampaignList.css";

export default function CampaignListAdmin({ onCampaignUpdate }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const pageSize = 10;

  const { addToast } = useToast();

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetchApi("/campaigns/admin/campaigns");
      const data = Array.isArray(response)
        ? response
        : response?.data
        ? response.data
        : [];

      const validatedData = data.map((campaign) => ({
        id: campaign.id || "",
        name: campaign.name || campaign.campaign_name || "",
        numbers: campaign.numbers || campaign.total_numbers || 0,
        status: campaign.status || "",
        user: campaign.user || campaign.creator_name || "Unknown",
        created_at: campaign.created_at || new Date().toISOString(),
        message: campaign.message || "",
        image: campaign.image || null,
      }));

      setCampaigns(validatedData);
    } catch (err) {
      addToast({
        title: "Error",
        description: err.message || "Failed to load campaigns",
        variant: "error",
      });
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const updateCampaignStatus = async (campaignId, status) => {
    try {
      await fetchApi(`/campaigns/admin/campaigns/${campaignId}/status`, {
        method: "PUT",
        body: { status },
      });

      addToast({
        title: "Success",
        description: `Campaign updated to ${status}`,
        variant: "success",
      });

      // Refresh campaign list setelah update
      fetchCampaigns();

      // callback ke parent kalau ada
      if (onCampaignUpdate) onCampaignUpdate();

      // Tutup modal kalau ada
      setSelectedCampaign(null);
    } catch (err) {
      addToast({
        title: "Error",
        description: err.message || "Failed to update campaign",
        variant: "error",
      });
    }
  };

  const handleApprove = (id) => updateCampaignStatus(id, "success");
  const handleReject = (id) => updateCampaignStatus(id, "failed");
  const handleView = (campaign) => setSelectedCampaign(campaign);
  const closeModal = () => setSelectedCampaign(null);

  const filteredData = campaigns.filter((c) => {
    const searchMatch =
      c.name?.toLowerCase()?.includes(search.toLowerCase()) ||
      c.user?.toLowerCase()?.includes(search.toLowerCase());
    const statusMatch = statusFilter ? c.status === statusFilter : true;
    const monthMatch = monthFilter
      ? new Date(c.created_at).toLocaleString("default", { month: "long" }) ===
        monthFilter
      : true;
    return searchMatch && statusMatch && monthMatch;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading campaigns...
      </div>
    );
  }

  return (
    <div className="campaign-list-container">
      <h2 className="campaign-title">Campaign Requests</h2>

      {/* Search & Filters */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search campaign by campaign name or user's request.."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Status</option>
          <option value="on_process">Checking Campaign</option>
          <option value="success">Campaign Success</option>
          <option value="failed">Campaign Failed</option>
        </select>
        <select
          className="filter-select"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="">Month</option>
          {Array.from({ length: 12 }, (_, i) => {
            const date = new Date(0, i);
            const month = date.toLocaleString("default", { month: "long" });
            return (
              <option key={month} value={month}>
                {month}
              </option>
            );
          })}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="campaign-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Campaign Name</th>
              <th>User's Request</th>
              <th>Sum. Number</th>
              <th>Status</th>
              <th>Register Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((c, index) => (
                <tr key={c.id}>
                  <td>{(currentPage - 1) * pageSize + index + 1}</td>
                  <td>{c.name}</td>
                  <td>{c.user}</td>
                  <td>{c.numbers.toLocaleString()} numbers</td>
                  <td>
                    <span
                      className={`status-badge ${
                        c.status === "on_process"
                          ? "status-checking"
                          : c.status === "success"
                          ? "status-success"
                          : "status-failed"
                      }`}
                    >
                      {c.status === "on_process"
                        ? "Checking Campaign"
                        : c.status === "success"
                        ? "Campaign Success"
                        : "Campaign Failed"}
                    </span>
                  </td>
                  <td>
                    {new Date(c.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <div className="action-buttons-list">
                      <button
                        className="action-btn upload-btn"
                        onClick={() => handleView(c)}
                      >
                        👁
                      </button>
                      {c.status === "on_process" && (
                        <>
                          <button
                            className="action-btn approve-btn"
                            onClick={() => handleApprove(c.id)}
                          >
                            ✔
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleReject(c.id)}
                          >
                            ✖
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No campaigns found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedCampaign && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CampaignInfo
              campaign={selectedCampaign}
              onClose={closeModal}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="table-footer">
        <div className="text-sm text-gray-500">
          {paginatedData.length} of {filteredData.length} data
        </div>
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                className={`page-btn ${pageNum === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            className="page-btn"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
