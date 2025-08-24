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
