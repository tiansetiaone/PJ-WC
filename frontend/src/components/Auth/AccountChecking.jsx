import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../style/Auth/account-checking.css";
import logoImage from "../../assets/logo-blasterc.png";
import logoImageCheckEmail from "../../assets/verification-sent.png";

export default function AccountChecking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, isActive } = location.state || {};

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  return (
    <div className="checking-wrap">
      <div className="checking-left">
        <div className="branding-checking">
          <img src={logoImage} alt="BLASTERC" className="logo-img" />
          <p className="tagline">Let's Grow Your Business with Us</p>
        </div>
      </div>

      <div className="checking-right">
        <div className="content-box">
        <img src={logoImageCheckEmail} alt="Email Sent" className="checkemail-image" />

          {isActive === 1 ? (
            <>
              <h2 className="title">Registration Successful!</h2>
              <p className="desc">Your account has been successfully created. We've sent a confirmation email to {email}. You can now login to your account.</p>
            </>
          ) : (
            <>
              <h2 className="title">Account Under Verification</h2>
              <p className="desc">We're reviewing your account details now. Once approved, we'll send you an email to {email}. Please check your inbox regularly.</p>
            </>
          )}

          <button className="btn-back-checking" onClick={() => navigate("/login")}>
            Back to Log In
          </button>
        </div>
      </div>
    </div>
  );
}
