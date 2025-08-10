import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import '../../style/ForgotPassword.css';

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
      if (!response.ok) throw new Error(data.error || 'Request failed');

      setSuccess(true);
      setTimeout(() => navigate('/check-email'), 2000);
    } catch (err) {
      setError(err.message);
      hCaptchaRef.current.resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h1>BLASTERC</h1>
        <p className="tagline">Let's Grow Your Business with Us</p>
        
        {success ? (
          <div className="success-message">
            <h2>Recovery Link Sent!</h2>
            <p>We've sent a password reset link to your email address.</p>
            <p>You will be redirected to check your email...</p>
          </div>
        ) : (
          <>
            <h2>Recover Your Account</h2>
            <p>Please enter the email address associated with your account.</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="yourname@mail.com"
                  className="w-full p-2 border rounded"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Confirmation</label>
                <input
                  type="email"
                  placeholder="Retype your email"
                  className="w-full p-2 border rounded"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  required
                />
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="human-check"
                  className="mr-2"
                  required
                />
                <label htmlFor="human-check">I am human</label>
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
                disabled={isLoading || !email || email !== confirmEmail}
                className="bg-blue-700 text-white w-full py-2 rounded disabled:opacity-50 submit-btn"
              >
                {isLoading ? 'Sending...' : 'Send Verification Link'}
              </button>
            </form>

            <p className="login-link">
              Remember your password? <a href="/login" className="text-blue-600">Log in now</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;