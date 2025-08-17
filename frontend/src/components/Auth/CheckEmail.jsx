import React from "react";
import { useNavigate } from "react-router-dom";
import "../../style/Auth/CheckEmail.css";

const CheckEmail = () => {
  const navigate = useNavigate();

  const handleCheckEmail = () => {
  // Coba buka Gmail di tab baru
  const gmailWindow = window.open("https://mail.google.com", "_blank");
  
  // Jika pop-up diblokir, beri tahu user
  if (!gmailWindow || gmailWindow.closed || typeof gmailWindow.closed === 'undefined') {
    alert('Please check your email inbox. You can manually go to mail.google.com');
  }
  
  // Navigasi ke home
  navigate("/");
};

  return (
    <div className="checkemail-container">
      {/* Bagian Kiri */}
      <div className="checkemail-left">
        <img src="/logo.png" alt="Logo" className="checkemail-logo" />
        <h1 className="checkemail-title">Let's Grow Your Business with Us</h1>
      </div>

      {/* Bagian Kanan */}
      <div className="checkemail-right">
        <img
          src="/images/email-sent.png"
          alt="Email Sent"
          className="checkemail-image"
        />
        <h2 className="checkemail-heading">Link Verification Sent</h2>
        <p className="checkemail-text">
          We have sent a verification link to the email address associated with
          your account. Please check your inbox or spam folder, then click the
          link to proceed with resetting your password.
        </p>
<button
  className="checkemail-button"
  onClick={handleCheckEmail}
>
  Check Your Email
</button>
      </div>
    </div>
  );
};

export default CheckEmail;
