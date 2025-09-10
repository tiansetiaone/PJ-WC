import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../style/user/UploadProof.css";

export default function UploadProof({ depositId, onClose }) {
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [etherscanLink, setEtherscanLink] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("File harus berupa PNG, JPG, atau PDF");
      setFile(null);
      setFileName("");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5 MB");
      setFile(null);
      setFileName("");
      return;
    }

    setError("");
    setFileName(selectedFile.name);
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validasi: minimal salah satu harus diisi
    if (!file && !etherscanLink) {
      setError("Please fill in at least one of: proof of transfer or etherscan link");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    
    // Hanya append file jika ada
    if (file) {
      formData.append("file", file);
    }
    
    // Hanya append tx_hash jika ada
    if (etherscanLink) {
      formData.append("tx_hash", etherscanLink);
    }
    
    formData.append("deposit_id", depositId);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/deposits/submit-evidence",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Data sent successfully! Current deposit status: Checking");
      if (onClose) onClose();
      navigate("/deposits/list");
    } catch (error) {
      console.error("Upload Failed:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Upload failed, try again!.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">Upload Proof of Transaction (Optional)</h2>
  
      <div className="form-group">
        <label>Transfer Evidence (Optional)</label>
        <div className="file-input-wrapper">
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg, application/pdf"
            id="transferEvidence"
            onChange={handleFileChange}
          />
          <label htmlFor="transferEvidence" className="file-label">
            {fileName || "Choose file (optional)"}
          </label>
        </div>
        <small>PNG, JPG, atau PDF, max. 5 MB</small>
      </div>

      <div className="form-group">
        <label>Etherscan Transaction Link (Optional)</label>
        <div className="input-with-icon">
          <span className="link-icon">🔗</span>
          <input
            type="url"
            placeholder="https://etherscan.io/tx/... (optional)"
            value={etherscanLink}
            onChange={(e) => setEtherscanLink(e.target.value)}
          />
        </div>
        <small>This link will be converted into a shorten link</small>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="btn-group">
        <button className="btn-back" onClick={onClose} disabled={isSubmitting}>
          Back
        </button>
        <button 
          className="btn-submit" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}