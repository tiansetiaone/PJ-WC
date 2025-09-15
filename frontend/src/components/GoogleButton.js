import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../../src/style/Auth/GoogleButton.css'; // Buat file CSS untuk modal

const GoogleButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const abortController = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Deteksi apakah berada di halaman register
  const isRegisterPage = location.pathname === '/register';

  const showErrorModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSuccess = async (credentialResponse) => {
    abortController.current = new AbortController();
    
    console.log('Google Auth Started:', {
      isRegisterPage,
      hasToken: !!credentialResponse.credential,
      location: location.pathname
    });

    try {
      const payload = {
        token: credentialResponse.credential,
        action: isRegisterPage ? 'register' : 'login'
      };

      // Jika di halaman register dan ada referral code di URL, tambahkan
      if (isRegisterPage) {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
          payload.referral_code = refCode;
          console.log('Referral code found:', refCode);
        }
      }

      console.log('Sending payload to backend:', payload);

      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/google`,
        payload,
        {
          signal: abortController.current.signal,
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Backend response:', res.data);

      if (res.data?.token && res.data?.user) {
        login(res.data.user, res.data.token);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        if (res.data.user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        const errorData = err.response?.data;
        console.error('Google auth error details:', {
          error: err,
          response: err.response,
          data: errorData,
          status: err.response?.status,
          isRegisterPage
        });

        if (errorData?.code === 'ACCOUNT_NOT_REGISTERED') {
          // Tampilkan modal untuk akun belum terdaftar
          showErrorModal('Account not registered. Please register first.');
          
          // Juga tampilkan toast notification
          toast.error('Account not registered. Please register first.');
          
          // Redirect ke halaman register setelah 2 detik
          setTimeout(() => {
            navigate('/register');
          }, 2000);
          
        } else if (errorData?.code === 'PENDING_APPROVAL') {
          if (isRegisterPage) {
            toast.success('Registration successful! Your account is pending admin approval.');
            navigate('/account-checking', { 
              state: { 
                email: errorData.email,
                isActive: false 
              } 
            });
          } else {
            toast.info('Your account is pending admin approval. Please wait for approval before logging in.');
          }
        } else if (errorData?.code === 'INVALID_REFERRAL') {
          toast.error('Invalid referral code. Please check and try again.');
        } else {
          const errorMessage = errorData?.error || 'Google authentication failed';
          toast.error(errorMessage);
          showErrorModal(errorMessage);
        }
      } else {
        console.log('Request cancelled');
      }
    }
  };

  return (
    <>
      <div className="google-auth-wrapper">
        <GoogleOAuthProvider 
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
          onScriptLoadError={() => {
            console.error('Failed to load Google script');
            toast.error('Failed to load Google authentication');
          }}
        >
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.error('Google login error');
              toast.error('Google login failed');
            }}
            useOneTap={!isRegisterPage}
            auto_select={!isRegisterPage}
            text={isRegisterPage ? "signup_with" : "signin_with"}
            cancel_on_tap_outside={false}
            ux_mode="popup"
          />
        </GoogleOAuthProvider>
      </div>

      {/* Modal untuk error messages */}
      {showModal && (
        <div className="modal-overlay-gbutton">
          <div className="modal-content-gbutton">
            <div className="modal-header-gbutton">
              <h3>Authentication Notice</h3>
              <button className="modal-close-gbutton" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <p>{modalMessage}</p>
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={closeModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleButton;