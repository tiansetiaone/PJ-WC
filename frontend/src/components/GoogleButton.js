import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const GoogleButton = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const abortController = useRef(null);

  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const handleSuccess = async (credentialResponse) => {
    abortController.current = new AbortController();
    
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/google`,
        { token: credentialResponse.credential },
        {
          signal: abortController.current.signal,
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (res.data?.token && res.data?.user) {
        // Gunakan fungsi login dari auth context
        login(res.data.user, res.data.token);
        
        // Simpan di localStorage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        // Redirect berdasarkan role
        if (res.data.user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Login error:', err.response?.data || err.message);
        // Anda mungkin ingin menampilkan error ke user
        alert('Google login failed: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="google-auth-wrapper">
      <GoogleOAuthProvider 
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        onScriptLoadError={() => console.error('Failed to load Google script')}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log('Google login flow ended')}
          useOneTap
          auto_select
          cancel_on_tap_outside={false}
          ux_mode="popup"
        />
      </GoogleOAuthProvider>
    </div>
  );
};

export default GoogleButton;