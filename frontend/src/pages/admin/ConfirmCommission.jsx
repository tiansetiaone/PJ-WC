import React from "react";
import "./ConfirmCommission.css";

const ConfirmCommission = ({ onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-title">Are you sure want to convert commission?</h2>
        <p className="modal-text">
          This action will convert your available commission based on the
          current rate.
        </p>
        <div className="modal-actions">
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
};

export default ConfirmCommission;
