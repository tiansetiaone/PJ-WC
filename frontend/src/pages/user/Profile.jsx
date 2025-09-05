import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/user/Profile.css";
import { fetchApi, getProfile } from  "../../utils/api";

export default function Profile({ logout, onMenuClick }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);


    // Ambil profil user saat Header mount
    useEffect(() => {
      getProfile()
        .then((res) => {
          if (res.success) {
            setProfileData(res.data);
          }
        })
        .catch((err) => console.error("Gagal ambil profil:", err));
    }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    }
  }, []);


useEffect(() => {
    fetchApi("/users/profile").then((res) => setUser(res.data));
  }, []);

    // Fungsi untuk navigasi dengan menutup dropdown
  const handleNavigation = (path) => {
    if (onMenuClick) {
      onMenuClick(); // Tutup dropdown
    }
    navigate(path);
  };

  const handleEditProfile = () => {
    navigate("/edit-profil");
  };


    const handleViewProfile = () => {
    handleNavigation("/profile");
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    if (onMenuClick) {
      onMenuClick(); // Tutup dropdown saat klik logout
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">Profile</h2>
        <div className="profile-info">
 {profileData?.profile_image ? (
              <img
                src={`http://localhost:5000${profileData.profile_image}`}
                alt="Profile"
                className="profile-pic"
                onError={(e) => {
                  console.error('Failed to load profile image:', e.target.src);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
          <div>
            <p className="profile-name">{userData?.name || "User Name"}</p>
            <p className="profile-email">{userData?.email || "user@email"}</p>
          </div>
        </div>
        

        <div className="profile-action" onClick={handleEditProfile}>
          <span className="profile-icon">👤</span>
          <span>Edit Profile</span>
        </div>

        <div className="logout-button" onClick={() => setShowLogoutModal(true)}>
          <span className="logout-icon">↪</span>
          <span>Log Out</span>
        </div>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p className="modal-title">Are you sure want to log out?</p>
            <p className="modal-text">
              You will be logged out of your account and may need to log in
              again to continue using the services.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button className="btn-confirm" onClick={logout}>
                Yes, Sure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}