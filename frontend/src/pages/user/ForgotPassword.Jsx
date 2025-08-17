import React, { useState } from "react";


const RecoverAccount = () => {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isHuman, setIsHuman] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && confirmEmail && email === confirmEmail && isHuman) {
      alert("Verification code sent to your email!");
    } else {
      alert("Please check your inputs and captcha.");
    }
  };

  return (
    <div className="recover-container">
      {/* Left Side */}
      <div className="recover-left">
        <div className="logo">BLASTERC</div>
        <h2 className="tagline">Let's Grow Your Business with Us</h2>
      </div>

      {/* Right Side */}
      <div className="recover-right">
        <form className="recover-form" onSubmit={handleSubmit}>
          <h2 className="title">Recover Your Account</h2>
          <p className="subtitle">
            Please enter the email address associated with your account. We will
            send a verification code to that email to help you reset your
            password.
          </p>

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

          <div className="captcha">
            <input
              type="checkbox"
              id="human"
              checked={isHuman}
              onChange={() => setIsHuman(!isHuman)}
            />
            <label htmlFor="human">I am human</label>
          </div>

          <button type="submit" className="btn-send" disabled={!isHuman}>
            Send Code
          </button>

          <p className="footer">
            Remember your password? <a href="/login">Log In now.</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RecoverAccount;
