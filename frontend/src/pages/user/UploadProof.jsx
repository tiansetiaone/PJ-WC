import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../style/user/UploadProof.css";

export default function UploadProof({ depositId, onClose }) {
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [etherscanLink, setEtherscanLink] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("File harus berupa PNG atau JPG");
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

    if (!file || !etherscanLink) {
      setError("File dan link etherscan wajib diisi.");
      return;
    }

    const userId = localStorage.getItem("user_id"); // ambil dari localStorage

    const formData = new FormData();
    formData.append("file", file);          // ⬅️ harus sama dengan backend (upload.single("file"))
    formData.append("tx_hash", etherscanLink);
    formData.append("user_id", userId);
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

      alert("Bukti berhasil dikirim!");
      navigate("/deposits/list");
    } catch (error) {
      console.error("Upload gagal:", error.response?.data || error.message);
      alert("Upload gagal, coba lagi.");
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">Upload Proof of Transaction</h2>

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
        <small>This link will be converted into a shorten link</small>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="btn-group">
        <button className="btn-back" onClick={onClose}>
          Back
        </button>
        <button className="btn-submit" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}
