import React from "react";
import "./logout-modal.css";

export default function LogoutModal({
  open = false,
  onCancel = () => {},
  onConfirm = () => {},
}) {
  if (!open) return null;

  return (
    <div className="logout-overlay">
      <div className="logout-modal">
        <h3 className="logout-title">Are you sure want to log out?</h3>
        <p className="logout-message">
          You will be logged out of your account and may need to log in again to
          continue using the services.
        </p>
        <div className="logout-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Yes, Sure
          </button>
        </div>
      </div>
    </div>
  );
}
