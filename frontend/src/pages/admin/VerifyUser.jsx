import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../utils/api'; // Import your API utility
import '../../style/admin/VerifyUser.css';

const VerifyUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBlockReason, setShowBlockReason] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApi(`/auth/admin/users/${id}`);
        setUser(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch user data');
        console.error('Fetch user error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  // Handle both approve and block actions
  const handleVerificationAction = async (action) => {
    if (action === 'block' && !blockReason.trim()) {
      setError('Please provide a reason for blocking');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const payload = {
        user_id: id,
        action
      };

      if (action === 'block') {
        payload.reason = blockReason;
      }

const response = await fetchApi('/auth/admin/verify-user', {
  method: 'POST',
  body: JSON.stringify(payload), // ✅ stringify
  headers: { 'Content-Type': 'application/json' }
});


      navigate('/admin/dashboard', {
        state: {
          notification: {
            type: 'success',
            message: `User ${action === 'approve' ? 'approved' : 'blocked'} successfully`,
            autoClose: 3000
          }
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to complete verification');
      console.error('Verification error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="verify-container loading-state">
        <div className="loading-spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="verify-container error-state">
        <div className="error-message">
          <h2>Error Occurred</h2>
          <p>{error}</p>
          <button 
            className="btn-retry"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
          <button 
            className="btn-back"
            onClick={() => navigate('/admin/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No user found
  if (!user) {
    return (
      <div className="verify-container not-found">
        <h2>User Not Found</h2>
        <p>The requested user does not exist or you don't have permission to view it.</p>
        <button 
          className="btn-back"
          onClick={() => navigate('/admin/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Main render
  return (
    <div className="verify-container">
      <div className="verify-header">
        <h1>User Verification</h1>
        <p>Review user details before taking action</p>
      </div>

      <div className="user-details-card">
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">User ID:</span>
            <span className="detail-value">{user.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{user.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Registered:</span>
            <span className="detail-value">
{new Date(user.created_at).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
            </span>
          </div>
        </div>
      </div>

      <div className="verification-actions">
        <button
          type="button"
          className={`action-btn approve-btn ${actionLoading ? 'loading' : ''}`}
          onClick={() => handleVerificationAction('approve')}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <>
              <span className="spinner"></span>
              Approving...
            </>
          ) : (
            'Approve User'
          )}
        </button>

        <div className="block-action-container">
          <button
            type="button"
            className={`action-btn block-btn ${showBlockReason ? 'active' : ''}`}
            onClick={() => setShowBlockReason(!showBlockReason)}
            disabled={actionLoading}
          >
            Block User
          </button>

          {showBlockReason && (
            <div className="block-reason-wrapper">
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for blocking..."
                className="reason-textarea"
                disabled={actionLoading}
              />
              <button
                type="button"
                className={`confirm-block-btn ${!blockReason.trim() ? 'disabled' : ''}`}
                onClick={() => handleVerificationAction('block')}
                disabled={actionLoading || !blockReason.trim()}
              >
                {actionLoading ? (
                  <>
                    <span className="spinner"></span>
                    Blocking...
                  </>
                ) : (
                  'Confirm Block'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="action-error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default VerifyUser;