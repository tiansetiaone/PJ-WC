import React from "react";
import "./ConfirmConvert.css";

const ConfirmConvert = ({ onCancel, onConfirm }) => {
  return (
    <div className="confirm-container">
      <div className="confirm-box">
        <h2 className="confirm-title">
          Are you sure want to convert earnings?
        </h2>
        <p className="confirm-text">
          This action will convert your available earnings based on the current
          rate.
        </p>
        <div className="confirm-buttons">
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

export default ConfirmConvert;
