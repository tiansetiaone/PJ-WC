import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import '../../style/ResetPassword.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hCaptchaToken, setHCaptchaToken] = useState(null);
  const hCaptchaRef = React.useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!hCaptchaToken) {
      setError('Please complete the captcha verification');
      return; 
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          newPassword, 
          hCaptchaToken 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');

      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.message);
      hCaptchaRef.current.resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-box">
        <h1>BLASTERC</h1>
        <p className="tagline">Let's Grow Your Business with Us</p>
        
        <h2>Last Step, Create New Password</h2>
        
        {success ? (
          <div className="success-message">
            <h2>Password Updated Successfully!</h2>
            <p>Your password has been successfully updated.</p>
            <p>You will be redirected to login page shortly...</p>
          </div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="6"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="6"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="hcaptcha-container">
                <HCaptcha
                  sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY}
                  onVerify={(token) => setHCaptchaToken(token)}
                  onError={() => setHCaptchaToken(null)}
                  ref={hCaptchaRef}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                className="bg-blue-700 text-white w-full py-2 rounded disabled:opacity-50 submit-btn"
              >
                {isLoading ? 'Updating...' : 'Save New Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;