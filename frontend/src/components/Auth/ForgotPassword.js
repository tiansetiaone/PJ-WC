import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import '../../style/Auth/ForgotPassword.css';
import withDeviceRestriction from '../../hocs/withDeviceRestriction';
import logoImages from "../../assets/logo-blasterc.png";


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hCaptchaToken, setHCaptchaToken] = useState(null);
  const hCaptchaRef = React.useRef(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!hCaptchaToken) {
      setError('Please complete the captcha verification');
      return;
    }

    if (email !== confirmEmail) {
      setError('Email addresses do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, hCaptchaToken })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error codes from backend
        if (data.code === 'EMAIL_NOT_FOUND') {
          throw new Error('No account found with this email address');
        } else if (data.code === 'INVALID_CAPTCHA') {
          throw new Error('Captcha verification failed. Please try again.');
        } else {
          throw new Error(data.error || 'Request failed');
        }
      }

      setSuccess(true);
      setTimeout(() => navigate('/check-email'), 2000);
    } catch (err) {
      setError(err.message);
      hCaptchaRef.current.resetCaptcha();
      setHCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="recover-container">
      {/* Left Side */}
      <div className="recover-left">
        <div className="branding-forgot">
          <img src={logoImages} alt="BLASTERC" className="logo-img" />
          <p className="tagline">Let's Grow Your Business with Us</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="recover-right">
        {success ? (
          <div className="recover-form">
            <h2 className="title">Recovery Link Sent!</h2>
            <p className="subtitle">
              We've sent a password reset link to your email address.
              You will be redirected to check your email...
            </p>
          </div>
        ) : (
          <form className="recover-form" onSubmit={handleSubmit}>
            <h2 className="title">Recover Your Account</h2>
            <p className="subtitle">
              Please enter the email address associated with your account. We will
              send a verification code to that email to help you reset your password.
            </p>

            {error && <div className="error-message">{error}</div>}

            <label>Email</label>
            <input
              type="email"
              placeholder="Registered email: e.g yourname@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Email Confirmation</label>
            <input
              type="email"
              placeholder="Retype registered email: e.g yourname@mail.com"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              required
            />

            <div className="hcaptcha-container">
              <HCaptcha
                sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY}
                onVerify={(token) => {
                  setHCaptchaToken(token);
                  setError(''); // Clear any previous captcha errors
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
              className="btn-send-forgot" 
              disabled={isLoading || !hCaptchaToken || email !== confirmEmail || !email}
            >
              {isLoading ? 'Sending...' : 'Send Verification Link'}
            </button>

            <p className="footer">
              Remember your password? <a href="/login">Log In now.</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default withDeviceRestriction(ForgotPassword);