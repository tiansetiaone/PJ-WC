import React, { useState, useEffect } from "react";
import { fetchApi } from "../../utils/api";
import { useToast } from "../../components/ui/use-toast";
import "../../style/user/CampaignList.css";

export default function CampaignList({ onUploadNumbers, onCampaignUpdate }) {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  const { addToast } = useToast();

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetchApi("/campaigns");
      const data = Array.isArray(response)
        ? response
        : response?.data
        ? response.data
        : [];

      const validatedData = data.map((campaign) => ({
        id: campaign.id || "",
        name: campaign.name || campaign.campaign_name || "",
        channel: campaign.channel || campaign.campaign_type || "",
        status: campaign.status || "",
        created_at: campaign.created_at || new Date().toISOString(),
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

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) {
      return;
    }
    try {
      await fetchApi(`/campaigns/${campaignId}`, { method: "DELETE" });
      addToast({
        title: "Success",
        description: "Campaign deleted successfully",
        variant: "default",
      });
      fetchCampaigns();
      if (onCampaignUpdate) onCampaignUpdate();
    } catch (error) {
      addToast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const filteredData = campaigns.filter((c) => {
    const nameMatch =
      c.name?.toLowerCase()?.includes(search.toLowerCase()) ?? false;
    const idMatch = c.id?.toString()?.includes(search) ?? false;
    const channelMatch = channelFilter ? c.channel === channelFilter : true;
    const statusMatch = statusFilter ? c.status === statusFilter : true;
    const monthMatch = monthFilter
      ? new Date(c.created_at).getMonth() + 1 === parseInt(monthFilter)
      : true;

    return (nameMatch || idMatch) && channelMatch && statusMatch && monthMatch;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => setCurrentPage(page);

  if (loading) {
    return <div className="loading">Loading campaigns...</div>;
  }

  return (
    <div className="campaign-container-list">
      <h3 className="title">Campaign Activity</h3>

      {/* Search Box */}
<div className="search-container">
  <input
    type="text"
    placeholder="Search campaign by campaign name or id campaign.."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="search-input"
  />
</div>

{/* Filters */}
<div className="filters">
  <select
    className="filter-select"
    value={channelFilter}
    onChange={(e) => setChannelFilter(e.target.value)}
  >
    <option value="">Channel</option>
    <option value="whatsapp">WhatsApp</option>
    <option value="sms">SMS</option>
  </select>

  <select
    className="filter-select"
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="">Status</option>
    <option value="on_process">Checking Campaign</option>
    <option value="completed">Campaign Success</option>
    <option value="failed">Campaign Failed</option>
  </select>

  <select
    className="filter-select"
    value={monthFilter}
    onChange={(e) => setMonthFilter(e.target.value)}
  >
    <option value="">Month</option>
    {[...Array(12)].map((_, i) => (
      <option key={i + 1} value={i + 1}>
        {new Date(0, i).toLocaleString("default", { month: "long" })}
      </option>
    ))}
  </select>
</div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="campaign-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>ID Campaign</th>
              <th>Campaign Name</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Campaign Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((c, index) => (
                <tr key={c.id}>
                  <td>{(currentPage - 1) * pageSize + index + 1}</td>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td className="capitalize">{c.channel}</td>
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
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn upload-btn"
                        onClick={() => onUploadNumbers(c.id)}
                      >
                        📤
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteCampaign(c.id)}
                      >
                        🗑️
                      </button>
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

      {/* Pagination */}
      <div className="table-footer">
        <div className="text-sm">
          {paginatedData.length} out of {filteredData.length} data
        </div>
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;

            return (
              <button
                key={pageNum}
                className={`page-btn ${pageNum === currentPage ? "active" : ""}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            className="page-btn"
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
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
