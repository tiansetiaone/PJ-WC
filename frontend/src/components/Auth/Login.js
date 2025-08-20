import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import GoogleButton from '../GoogleButton';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useAuth } from '../../context/AuthContext';
import '../../style/Login.css';
import logoImage from "../../assets/logo-blasterc.png";

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [hCaptchaToken, setHCaptchaToken] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const hCaptchaRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleHCaptchaVerify = (token) => {
    setHCaptchaToken(token);
    if (error.includes('captcha')) {
      setError('');
    }
  };

  const handleHCaptchaError = (err) => {
    console.error('hCaptcha Error:', err);
    setHCaptchaToken(null);
    setError('Captcha verification failed. Please try again.');
  };

  const handleHCaptchaExpire = () => {
    setHCaptchaToken(null);
    setError('Captcha session expired. Please verify again.');
  };

  useEffect(() => {
    console.log('hCaptcha Site Key:', process.env.REACT_APP_HCAPTCHA_SITE_KEY);
  }, []);

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!form.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!form.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!hCaptchaToken) {
      setError('Please complete the captcha verification');
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          hCaptchaToken
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        login(data.user, data.token);
        
        if (rememberMe) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }

        // ⬇️ cek query param redirect
        const params = new URLSearchParams(location.search);
        const redirect = params.get("redirect");

        if (redirect) {
          navigate(redirect, { replace: true });
        } else if (data.user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
        if (hCaptchaRef.current) {
          hCaptchaRef.current.resetCaptcha();
          setHCaptchaToken(null);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      if (hCaptchaRef.current) {
        hCaptchaRef.current.resetCaptcha();
        setHCaptchaToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Disable button jika form tidak valid atau loading
  const isSubmitDisabled = isLoading || !hCaptchaToken || !form.email || !form.password || form.password.length < 6;

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="branding">
          <img src={logoImage} alt="BLASTERC" className="logo-img" />
          <p className="tagline">Let's Grow Your Business with Us</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form">
          <h2>Log In to Blasterc</h2>
          <p className="subtitle">Ready to reach your audience via WhatsApp & SMS.</p>

          <div className="google-login">
            <GoogleButton />
            <div className="separator">
              <div className='border1'></div>
              <span>or</span>
              <div className='border1'></div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="yourname@mail.com"
                value={form.email}
                onChange={handleChange}
                required
                className={formErrors.email ? 'input-error' : ''}
              />
              {formErrors.email && <span className="error-text">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Type your password..."
                value={form.password}
                onChange={handleChange}
                required
                minLength="6"
                className={formErrors.password ? 'input-error' : ''}
              />
              {formErrors.password && <span className="error-text">{formErrors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="/forgot-password" className="forgot-password">
                Forgot your password?
              </a>
            </div>

            <div className="hcaptcha-container">
              <HCaptcha
                sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY}
                onVerify={handleHCaptchaVerify}
                onExpire={handleHCaptchaExpire}
                onError={handleHCaptchaError}
                ref={hCaptchaRef}
              />
              {!hCaptchaToken && error.includes('captcha') && (
                <span className="error-text" style={{ display: 'block', marginTop: '5px' }}>
                  {error}
                </span>
              )}
            </div>

            <button 
              type="submit" 
              className={`login-button ${isSubmitDisabled ? 'button-disabled' : ''}`}
              disabled={isSubmitDisabled}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>

            <div className="register-link">
              Don't have an account yet? <a href="/register">Register yours here</a>.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;