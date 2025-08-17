import React, { useState } from "react";
import "./UploadProof.css";

export default function UploadProof() {
  const [fileName, setFileName] = useState("");
  const [etherscanLink, setEtherscanLink] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">Upload Proof of Transaction</h2>

      {/* Transfer Evidence */}
      <div className="form-group">
        <label className="required">Transfer Evidence</label>
        <div className="file-input-wrapper">
          <input
            type="file"
            accept="image/png, image/jpeg"
            id="transferEvidence"
            onChange={handleFileChange}
          />
          <label htmlFor="transferEvidence" className="file-label">
            {fileName || "Choose file"}
          </label>
        </div>
        <small>Import only PNG/JPG/JPEG file, max. 5 MB</small>
      </div>

      {/* Etherscan Link */}
      <div className="form-group">
        <label className="required">Etherscan Transaction Link</label>
        <div className="input-with-icon">
          <span className="link-icon">🔗</span>
          <input
            type="url"
            placeholder="https://etherscan.io/tx/..."
            value={etherscanLink}
            onChange={(e) => setEtherscanLink(e.target.value)}
          />
        </div>
        <small>This link will be convert into shorten link</small>
      </div>

      {/* Buttons */}
      <div className="btn-group">
        <button className="btn-back">Back</button>
        <button className="btn-submit">Submit</button>
      </div>
    </div>
  );
}
