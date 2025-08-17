import React from "react";
import "./ConfirmProofModal.css";

export default function ConfirmProofModal({ onCancel, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Title */}
        <h2 className="modal-title">Are you sure proof of transfer is valid?</h2>

        {/* Description */}
        <p className="modal-desc">
          Please confirm that the proof of transfer you provided is correct and
          valid. Once confirmed, this action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="modal-buttons">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={onConfirm}>Yes, Sure</button>
        </div>
      </div>
    </div>
  );
}
