import React, { useState, useEffect } from "react";
import { fetchApi } from "../../utils/api";
import "../../style/user/ReferralDashboard.css";
import ConvertEarnings from "./ConvertEarnings";
import logoImageCheckEmail from "../../assets/verification-sent.png";

export default function ReferralDashboard() {
  const [referralLink, setReferralLink] = useState("");
  const [stats, setStats] = useState({
    current_earnings: 0,
    converted_earnings: 0,
    total_registered: 0,
    total_visited: 0,
  });
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [convertedHistory, setConvertedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConvertModal, setShowConvertModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchApi("/referrals");
        setReferralLink(data.referral_link);
        setRegisteredUsers(data.referrals || []);
        setStats(data.stats || {});

        const history = await fetchApi("/referrals/converted-history");
        setConvertedHistory(history || []);
      } catch (err) {
        console.error("Error loading referral data", err);
        setError(err.message || "Failed to load referral data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="referral-dashboard">
      <main className="main-content-referral">
        <header className="header-referral">
          <h1>Referral</h1>
          <button className="btn-primary" onClick={() => setShowConvertModal(true)}>
            Convert Earnings
          </button>
        </header>

        {/* Top Section */}
        <section className="top-section">
          <div className="card earn-card">
            <h2>Earn with Blasterc</h2>
            <p>Invite your friends to Blasterc dashboard, if they sign up, you will get commission to be converted to USDT.</p>
            <div className="steps">
              <div>
                <strong>Send Invitation</strong>
                <p>Send your referral link to friends and let them know how useful Blasterc is!</p>
              </div>
              <div>
                <strong>Registration</strong>
                <p>Let your friends sign up to our services using your personal referral code!</p>
              </div>
              <div>
                <strong>Use Blasterc Hourly</strong>
                <p>You get commission to be converted to USDT.</p>
              </div>
            </div>
          </div>

          <div className="card share-card">
            <h2>Share The Referral Link!</h2>
            <p>Invite your friends to Blasterc dashboard, if they sign up, you will get commission to be converted to USDT.</p>
            <div className="share-icons">
              <button className="icon-btn">🟢</button>
              <button className="icon-btn">❌</button>
              <button className="icon-btn">📩</button>
            </div>
            <div className="link-box">
              <input type="text" value={referralLink} readOnly />
              <button
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  alert("Referral link copied!");
                }}
              >
                Copy Link
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="stats">
          <div className="stat-card">
            <p>Current Earnings</p>
            <h2>${stats.current_earnings}</h2>
            <span>Earning from shared link.</span>
          </div>
          <div className="stat-card">
            <p>Convert Earnings</p>
            <h2>${stats.converted_earnings}</h2>
            <span>Lifetime convert.</span>
          </div>
          <div className="stat-card">
            <p>Total Visited</p>
            <h2>{stats.total_visited}</h2>
            <span>By clicked shared link.</span>
          </div>
          <div className="stat-card">
            <p>Total Registered</p>
            <h2>{stats.total_registered}</h2>
            <span>Converted from total visit.</span>
          </div>
        </section>

        {/* Registered Users */}
        <section className="table-section">
          <h2>Registered Users</h2>
          {registeredUsers.length > 0 ? (
            <>
              <input type="text" placeholder="Search user..." />
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredUsers.map((user, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.registered_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="empty-box">
              <img src={logoImageCheckEmail} alt="Email Sent" className="checkemail-image" />
              <p>No Registered Users Yet</p>
              <span>There are no users registered to your account at the moment. Please invite or register users to start managing them here.</span>
            </div>
          )}
        </section>

        {/* Converted Earnings History */}
        <section className="table-section">
          <h2>Converted Earnings History</h2>
          {convertedHistory.length > 0 ? (
            <>
              <input type="text" placeholder="Search history..." />
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Amount</th>
                    <th>Convert Date</th>
                  </tr>
                </thead>
                <tbody>
                  {convertedHistory.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{item.amount}</td>
                      <td>{new Date(item.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="empty-box">
             <img src={logoImageCheckEmail} alt="Email Sent" className="checkemail-image" />
              <p>No Convert History Yet</p>
              <span>You haven’t made any earnings conversions yet. Once you convert your earnings, the history will appear here.</span>
            </div>
          )}
        </section>
      </main>

      {/* 🔥 Modal Convert Earnings */}
{showConvertModal && (
  <div className="modal-overlay">
    <div className="modal-content-referral">
      <ConvertEarnings
        onClose={() => setShowConvertModal(false)}
        onSuccess={() => window.location.reload()}
      />
      <button
        className="modal-close"
        onClick={() => setShowConvertModal(false)}
      >
        ✖
      </button>
    </div>
  </div>
)}
    </div>
  );
}
