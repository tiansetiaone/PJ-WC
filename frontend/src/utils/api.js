import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

// Buat instance axios dengan konfigurasi default
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Interceptor untuk menambahkan token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk handle token expired
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired atau invalid
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login'; // Redirect ke login
    }
    return Promise.reject(error);
  }
);

// Fungsi fetchApi yang diperbaiki
export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      // Handle token expired
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Biarkan errorMessage default
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch API error:', error);
    throw error;
  }
};

// === Referral APIs (Admin) ===
export const getAllReferrals = () => apiClient.get("/referrals/all");
export const getReferralRoles = () => apiClient.get("/referrals/admin/roles");
export const createReferralRole = (data) => apiClient.post("/referrals/admin/roles", data);
export const updateReferralRole = (id, data) => apiClient.put(`/referrals/admin/roles/${id}`, data);
export const deleteReferralRole = (id) => apiClient.delete(`/referrals/admin/roles/${id}`);
export const setDefaultRole = (id) => apiClient.post(`/referrals/admin/roles/${id}/set-default`);

// === Profile APIs ===
export const getProfile = () => apiClient.get("/profile");
export const updateProfile = (data) => {
  if (data instanceof FormData) {
    return apiClient.put("/profile", data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return apiClient.put("/profile", data);
};
export const changePassword = (data) => apiClient.post("/profile/change-password", data);

// === Commission Settings APIs ===
export const createCommissionSetting = (data) => apiClient.post("/referrals/admin/settings", data);
export const getCommissionSettings = () => apiClient.get("/referrals/admin/settings");
export const setActiveCommissionSetting = (id) => apiClient.post(`/referrals/admin/settings/${id}/activate`);
export const getCommissionSettingById = (id) => apiClient.get(`/referrals/admin/settings/${id}`);
export const updateCommissionSetting = (id, data) => apiClient.put(`/referrals/admin/settings/${id}`, data);
export const deleteCommissionSetting = (id) => apiClient.delete(`/referrals/admin/settings/${id}`);

// === Support APIs ===
export const createTicket = (data) => {
  if (data instanceof FormData) {
    return apiClient.post("/support/tickets", data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return apiClient.post("/support/tickets", data);
};

export const sendEmailResponse = (ticketId, responseContent) => 
  apiClient.post(`/support/tickets/${ticketId}/respond`, {
    response: responseContent,
    via: 'email',
    action: 'reply'
  });

export const sendTelegramResponse = (ticketId, phoneNumber, responseContent) => 
  apiClient.post(`/support/tickets/${ticketId}/respond`, {
    phoneNumber,
    response: responseContent,
    via: 'telegram',
    action: 'reply'
  });