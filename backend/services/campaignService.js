import api from './api'; // Asumsikan Anda sudah memiliki setup axios

export const campaignService = {
  // Get campaign stats untuk user biasa
  getUserCampaignStats: async () => {
    try {
      // Mengambil semua campaign user, lalu menghitung statistik di frontend
      const response = await api.get('/campaigns');
      const campaigns = response.data.data;
      
      // Hitung statistik berdasarkan status campaign
      const stats = {
        total: campaigns.length,
        checking: campaigns.filter(c => c.status === 'on_process').length,
        success: campaigns.filter(c => c.status === 'success').length,
        failed: campaigns.filter(c => c.status === 'failed').length
      };
      
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch campaign stats' 
      };
    }
  },
  
  // Get campaign stats untuk admin (menggunakan endpoint khusus admin)
  getAdminCampaignStats: async () => {
    try {
      const response = await api.get('/campaigns/admin/stats');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching admin campaign stats:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch admin campaign stats' 
      };
    }
  },
  
  // Get semua campaign untuk user
  getUserCampaigns: async () => {
    try {
      const response = await api.get('/campaigns');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch campaigns' 
      };
    }
  }
};