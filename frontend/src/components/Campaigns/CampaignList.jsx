import React, { useState, useEffect } from "react";
import { fetchApi } from '../../utils/api';
import { useToast } from "../ui/use-toast";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button"; // Added Button import

export default function CampaignList({ onUploadNumbers }) {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  const { toast } = useToast();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await fetchApi('/campaigns');
        
        // Ensure the response is an array with proper data structure
        const data = Array.isArray(response) 
          ? response 
          : response?.data 
            ? response.data 
            : [];
        
        // Ensure each campaign has required fields
        const validatedData = data.map(campaign => ({
          id: campaign.id || '',
          name: campaign.name || campaign.campaign_name || '',
          channel: campaign.channel || campaign.campaign_type || '',
          status: campaign.status || '',
          created_at: campaign.created_at || new Date().toISOString()
        }));

        setCampaigns(validatedData);
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
        toast({
          title: "Error",
          description: err.message || "Failed to load campaigns",
          variant: "destructive",
        });
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [toast]);

  // Filter data with safety checks
  const filteredData = campaigns.filter((c) => {
    const nameMatch = c.name?.toLowerCase()?.includes(search.toLowerCase()) ?? false;
    const idMatch = c.id?.toString()?.includes(search) ?? false;
    const channelMatch = channelFilter ? c.channel === channelFilter : true;
    const statusMatch = statusFilter ? c.status === statusFilter : true;
    const monthMatch = monthFilter 
      ? new Date(c.created_at).getMonth() + 1 === parseInt(monthFilter) 
      : true;

    return (nameMatch || idMatch) && channelMatch && statusMatch && monthMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => setCurrentPage(page);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading campaigns...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter & Search */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          type="text"
          placeholder="Search campaign by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3"
        />
        
        <select 
          value={channelFilter} 
          onChange={(e) => setChannelFilter(e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">All Channels</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
        </select>
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">All Status</option>
          <option value="on_process">Checking Campaign</option>
          <option value="completed">Campaign Success</option>
          <option value="failed">Campaign Failed</option>
        </select>
        
        <select 
          value={monthFilter} 
          onChange={(e) => setMonthFilter(e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">All Months</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">ID Campaign</th>
              <th className="p-3 text-left">Campaign Name</th>
              <th className="p-3 text-left">Channel</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Created At</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((c, index) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{(currentPage - 1) * pageSize + index + 1}</td>
                  <td className="p-3">{c.id}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3 capitalize">{c.channel}</td>
                  <td className="p-3">
                    <Badge 
                      variant={
                        c.status === "completed" 
                          ? "success" 
                          : c.status === "failed" 
                            ? "destructive" 
                            : "secondary"
                      }
                    >
                      {c.status === "on_process" ? "Checking Campaign" : 
                       c.status === "completed" ? "Campaign Success" : 
                       c.status === "failed" ? "Campaign Failed" : c.status}
                    </Badge>
                  </td>
                  <td className="p-3">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Button 
                      size="sm"
                      onClick={() => onUploadNumbers(c.id)}
                      disabled={c.status === "completed"}
                    >
                      Upload Numbers
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  No campaigns found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {paginatedData.length} of {filteredData.length} campaigns
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
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
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}