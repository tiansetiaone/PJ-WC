import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import '../../style/Auth/ResetPassword.css';
import withDeviceRestriction from '../../hocs/withDeviceRestriction';
import logoImages from "../../assets/logo-blasterc.png";
import logoImageCheckEmail from "../../assets/verification-sent.png";

const ResetPassword = () => {
  const { token } = useParams(); // Mengambil token dari URL parameter
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hCaptchaToken, setHCaptchaToken] = useState(null);
  const hCaptchaRef = React.useRef(null);
  const navigate = useNavigate();


  // Validasi token saat komponen mount
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Invalid reset link. Token is missing');
      return;
    }

    if (!hCaptchaToken) {
      setError('Please complete the captcha verification');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
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
      
      if (!response.ok) {
        // Handle specific error codes from backend
        if (data.code === 'INVALID_TOKEN') {
          throw new Error('Invalid or expired reset link. Please request a new password reset.');
        } else if (data.code === 'WEAK_PASSWORD') {
          throw new Error('Password must be at least 8 characters');
        } else if (data.code === 'INVALID_CAPTCHA') {
          throw new Error('Captcha verification failed. Please try again.');
        } else {
          throw new Error(data.error || 'Password reset failed');
        }
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000); // Redirect to login after success
    } catch (err) {
      setError(err.message);
      hCaptchaRef.current?.resetCaptcha();
      setHCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-container">
      {/* Left Side */}
      <div className="reset-left">
        <div className="branding-reset">
          <img src={logoImages} alt="BLASTERC" className="logo-img" />
          <p className="tagline">Let's Grow Your Business with Us</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="reset-right">
        {success ? (
          <div className="success-message">
            <img src={logoImageCheckEmail} alt="Email Sent" className="checkemail-image" />
            <h2>Password Updated Successfully!</h2>
            <p>Your password has been successfully updated.</p>
            <p>You will be redirected to login page shortly...</p>
          </div>
        ) : (
          <>
            <h2>Last Step, Create New Password</h2>
            <p>
              Please enter your new password below. Make sure it's at least 8 characters long.
            </p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="reset-form">
              {/* New Password Field */}
              <label htmlFor="newpassword">New Password</label>
              <div className="input-group-reset">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="8"
                />
                <span
                  className="toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? '👁' : '👁'}
                </span>
              </div>
<label htmlFor="newpass">New Password Confirmation</label>
              {/* Confirm Password Field */}
              <div className="input-group-reset">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="8"
                />
                <span
                  className="toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? '👁' : '👁'}
                </span>
              </div>

              <div className="hcaptcha-container">
                <HCaptcha
                  sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY}
                  onVerify={(token) => {
                    setHCaptchaToken(token);
                    setError('');
                  }}
                  onError={() => {
                    setHCaptchaToken(null);
                    setError('Captcha verification failed');
                  }}
                  onExpire={() => {
                    setHCaptchaToken(null);
                    setError('Captcha expired. Please verify again.');
                  }}
                  ref={hCaptchaRef}
                />
              </div>

              <button 
                type="submit" 
                className="btn-save"
                disabled={isLoading || !hCaptchaToken || newPassword !== confirmPassword || newPassword.length < 8}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span> Updating...
                  </>
                ) : (
                  'Save New Password'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default withDeviceRestriction(ResetPassword);