import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import CampaignDetailModal from './CampaignDetailModal';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800'
};

export default function AdminCampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Mock data fetch - ganti dengan API sebenarnya
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCampaigns([
        {
          id: 1,
          name: 'Promo Summer',
          creator_name: 'Admin User',
          creator_email: 'admin@example.com',
          campaign_type: 'WhatsApp',
          status: 'pending',
          progress: 0,
          created_at: new Date().toISOString()
        },
        // ... tambahkan data lain
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleStatusChange = async (id, status) => {
    // Implement status change logic
    console.log(`Change campaign ${id} to ${status}`);
  };

  // Add pagination state
const [pagination, setPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
});

// Replace mock data with real API call
const fetchCampaigns = async () => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }).toString();

    const response = await fetch(`/api/admin/campaigns?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error || 'Failed to fetch campaigns');

    setCampaigns(data.data);
    setPagination(data.pagination);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    // Add toast notification here
  } finally {
    setLoading(false);
  }
};

// Add useEffect to fetch data when filters or pagination changes
useEffect(() => {
  fetchCampaigns();
}, [filters, pagination.page]);

// Add pagination controls at the bottom of the table
<div className="flex items-center justify-between mt-4">
  <div className="text-sm text-muted-foreground">
    Showing {campaigns.length} of {pagination.total} campaigns
  </div>
  <div className="flex gap-2">
    <Button
      variant="outline"
      disabled={pagination.page === 1}
      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
    >
      Previous
    </Button>
    <Button
      variant="outline"
      disabled={pagination.page >= pagination.totalPages}
      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
    >
      Next
    </Button>
  </div>
</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Campaign Management</h2>
        <div className="flex gap-2">
          <Select onValueChange={(value) => setFilters({...filters, status: value})}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, type: value})}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          <Input 
            placeholder="Search campaigns..." 
            className="w-[250px]"
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>#{campaign.id.toString().padStart(6, '0')}</TableCell>
                <TableCell>
                  <Button 
                    variant="link" 
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    {campaign.name}
                  </Button>
                </TableCell>
                <TableCell>
                  <div>{campaign.creator_name}</div>
                  <div className="text-gray-500 text-sm">{campaign.creator_email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {campaign.campaign_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[campaign.status]}`}>
                    {campaign.status.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={campaign.progress} 
                      className="h-2 w-[100px]"
                    />
                    <span>{campaign.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(campaign.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={campaign.status}
                    onValueChange={(value) => handleStatusChange(campaign.id, value)}
                    disabled={campaign.status === 'completed'}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedCampaign && (
        <CampaignDetailModal
          campaignId={selectedCampaign.id}
          open={!!selectedCampaign}
          onOpenChange={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}