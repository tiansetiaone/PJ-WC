import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

const GoogleButton = () => {
  const navigate = useNavigate();
  const abortController = useRef(null);

  // Cleanup effect untuk abort request saat komponen unmount
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

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      // Abaikan error yang disebabkan oleh abort
      if (!axios.isCancel(err)) {
        console.error('Login error:', err.response?.data || err.message);
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