const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  // Handle FormData (for file uploads)
  if (options.body instanceof FormData) {
    // Jangan set Content-Type untuk FormData, browser otomatis atur boundary
    delete headers['Content-Type'];
  } else if (typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, { 
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText
    }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};
