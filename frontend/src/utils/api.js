const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // Default method = GET
  const method = options.method || 'GET';

  const headers = {
    ...(options.headers || {})
  };

  // Tambahkan Authorization hanya kalau token ada
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData (untuk file upload)
  if (options.body instanceof FormData) {
    // Jangan set Content-Type untuk FormData, browser otomatis atur boundary
    delete headers['Content-Type'];
  } else if (
    options.body &&
    typeof options.body === 'object' &&
    !(options.body instanceof FormData)
  ) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
  });

  // Kalau error, coba ambil detail error dari response
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // Kalau bukan JSON, biarin default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
};





// utils/api.js (lanjutan)

// === Referral APIs (Admin) ===
export const getAllReferrals = () => fetchApi("/referrals/all");
export const getReferralRoles = () => fetchApi("/referrals/admin/roles");
export const createReferralRole = (data) =>
  fetchApi("/referrals/admin/roles", { method: "POST", body: data });
export const updateReferralRole = (id, data) =>
  fetchApi(`/referrals/admin/roles/${id}`, { method: "PUT", body: data });
export const deleteReferralRole = (id) =>
  fetchApi(`/referrals/admin/roles/${id}`, { method: "DELETE" });
export const setDefaultRole = (id) =>
  fetchApi(`/referrals/admin/roles/${id}/set-default`, { method: "POST" });

// === Profile APIs ===
export const getProfile = () => fetchApi("/profile");

// Fungsi updateProfile yang diperbaiki
export const updateProfile = (data) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Jika data adalah FormData, biarkan browser yang mengatur Content-Type
  if (!(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return fetchApi("/profile", {
    method: "PUT",
    headers,
    body: data
  });
};

// Fungsi untuk mengubah password
export const changePassword = (data) => 
  fetchApi("/profile/change-password", { 
    method: "POST", 
    body: data 
  });


// Fungsi untuk mengirim tiket dukungan
export const createTicket = (data) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Pastikan Content-Type adalah application/json jika body bukan FormData
  if (!(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return fetchApi("/support/tickets", {  // Ganti /tickets dengan /tickets/public untuk public access
    method: "POST",
    headers,
    body: data,
  });
};


// Fungsi untuk mengirim email
export const sendEmailResponse = async (ticketId, responseContent) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const body = JSON.stringify({
    ticketId,
    response: responseContent,
    via: 'email', // Tambahkan metode pengiriman
    action: 'reply' // Tindakan yang diambil
  });

  const res = await fetch(`${API_BASE}/support/tickets/${ticketId}/respond`, {
    method: 'POST',
    headers,
    body,
  });

  if (!res.ok) {
    throw new Error('Failed to send email response');
  }

  return res.json();
};

// Fungsi untuk mengirim balasan via Telegram
export const sendTelegramResponse = async (ticketId, phoneNumber, responseContent) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const body = JSON.stringify({
    ticketId,
    phoneNumber,
    response: responseContent,
    via: 'telegram', // Metode pengiriman
    action: 'reply' // Tindakan yang diambil
  });

  const res = await fetch(`${API_BASE}/support/tickets/${ticketId}/respond`, {
    method: 'POST',
    headers,
    body,
  });

  if (!res.ok) {
    throw new Error('Failed to send Telegram response');
  }

  return res.json();
};
