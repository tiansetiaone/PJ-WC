import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import '../../style/Auth/account-checking.css';

export default function AccountChecking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, isActive } = location.state || {};

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  return (
    <div className="checking-wrap">
      <div className="checking-left">
        <img src="/logo-blasterc.svg" alt="Blasterc Logo" className="logo" />
        <h1 className="tagline">Let's Grow Your Business with Us</h1>
      </div>

      <div className="checking-right">
        <div className="content-box">
          <img
            src="/illustration-checking.png"
            alt="Checking Illustration"
            className="illustration"
          />
          
          {isActive === 1 ? (
            <>
              <h2 className="title">Registration Successful!</h2>
              <p className="desc">
                Your account has been successfully created. We've sent a 
                confirmation email to {email}. You can now login to your account.
              </p>
            </>
          ) : (
            <>
              <h2 className="title">Account Under Verification</h2>
              <p className="desc">
                We're reviewing your account details now. Once approved, we'll 
                send you an email to {email}. Please check your inbox regularly.
              </p>
            </>
          )}
          
          <button 
            className="btn-back"
            onClick={() => navigate('/login')}
          >
            Back to Log In
          </button>
        </div>
      </div>
    </div>
  );
}