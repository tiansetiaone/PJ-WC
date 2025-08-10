import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function CampaignDetailModal({ campaignId, open, onOpenChange }) {
  const [campaign, setCampaign] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !campaignId) return;

    const fetchCampaignDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch campaign details');

        setCampaign(data.data);
        setRecipients(data.data.recipients || []);
        setStats(data.data.stats || []);
      } catch (error) {
        console.error('Error fetching campaign details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [open, campaignId]);

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update status');

      setCampaign(prev => ({ ...prev, status: newStatus }));
      // Add success toast
    } catch (error) {
      console.error('Error updating status:', error);
      // Add error toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div>Loading...</div>
        ) : campaign ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Basic Information</h3>
                <div className="space-y-2 mt-2">
                  <p><span className="font-semibold">Name:</span> {campaign.name}</p>
                  <p><span className="font-semibold">Creator:</span> {campaign.creator_name} ({campaign.creator_email})</p>
                  <p><span className="font-semibold">Type:</span> 
                    <Badge variant="outline" className="ml-2 capitalize">
                      {campaign.campaign_type}
                    </Badge>
                  </p>
                  <p><span className="font-semibold">Date:</span> {new Date(campaign.campaign_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium">Status</h3>
                <div className="flex items-center gap-4 mt-2">
                  <Select
                    value={campaign.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-[180px]">
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
                </div>

                <h3 className="font-medium mt-4">Statistics</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {stats.map(stat => (
                    <div key={stat.status} className="border rounded p-2">
                      <div className="font-medium capitalize">{stat.status}</div>
                      <div>{stat.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium">Message Content</h3>
              <div className="mt-2 p-4 bg-gray-50 rounded">
                {campaign.message}
              </div>
              {campaign.image_url && (
                <div className="mt-4">
                  <img 
                    src={campaign.image_url} 
                    alt="Campaign" 
                    className="max-w-full h-auto rounded border"
                  />
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium">Recipients ({recipients.length})</h3>
              <div className="mt-2 border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed At</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.map(recipient => (
                      <TableRow key={recipient.id}>
                        <TableCell>{recipient.phone_number}</TableCell>
                        <TableCell>
                          <Badge variant={recipient.status === 'sent' ? 'default' : 'destructive'}>
                            {recipient.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{recipient.processed_at || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {recipient.error_message || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div>No campaign data found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}