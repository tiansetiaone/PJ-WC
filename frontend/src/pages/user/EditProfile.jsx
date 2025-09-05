import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/user/EditProfile.css";
import { getProfile, updateProfile, changePassword } from "../../utils/api";

export default function EditProfile() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    whatsapp_number: "",
    usdt_network: "TRC20",
    usdt_address: "",
    email: "",
    profile_image: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      if (response.success) {
        const userData = response.data;
        setForm({
          name: userData.name || "",
          username: userData.username || "",
          whatsapp_number: userData.whatsapp_number || "",
          usdt_network: userData.usdt_network || "TRC20",
          usdt_address: userData.usdt_address || "",
          email: userData.email || "",
          profile_image: userData.profile_image || "",
          password: "",
          confirmPassword: "",
          currentPassword: "",
        });
      }
    } catch (err) {
      setError("Gagal memuat data profil: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validasi file size (1MB maksimal)
      if (file.size > 1024 * 1024) {
        setError("Ukuran file maksimal 1MB");
        return;
      }

      // Validasi file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError("Format file harus JPEG, JPG, atau PNG");
        return;
      }

      setForm({ ...form, profile_image: file });
    }
  };

const handleDeletePhoto = async () => {
  try {
    setLoading(true);
    setError("");

    // Untuk menghapus foto, kita perlu mengirim null/empty value
    const updateData = {
      profile_image: null // Menghapus foto
    };

    const response = await updateProfile(updateData);

    if (response.success) {
      setMessage("Foto profil berhasil dihapus");
      setForm(prev => ({ ...prev, profile_image: "" }));

      // Update user data di localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.profile_image = ""; // Menghapus gambar dari localStorage
        localStorage.setItem("user", JSON.stringify(user));
      }
    }
  } catch (err) {
    setError("Gagal menghapus foto profil: " + err.message);
  } finally {
    setLoading(false);
  }
};



const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setMessage("");

  // Validasi nomor WhatsApp
  if (form.whatsapp_number && !/^\+?[0-9]{10,15}$/.test(form.whatsapp_number)) {
    setError("Format nomor WhatsApp tidak valid. Gunakan format: +628123456789");
    setLoading(false);
    return;
  }

  // Validasi password
  if (form.password && form.password !== form.confirmPassword) {
    setError("Password dan konfirmasi password tidak cocok");
    setLoading(false);
    return;
  }

  // Jika ada password yang diubah, lakukan change password
  if (form.password && form.password === form.confirmPassword) {
  try {
    const passwordData = {
      currentPassword: form.currentPassword || "",  // Pastikan jika kosong tetap kirimkan
      newPassword: form.password,
    };

    console.log('Submitting password change data:', passwordData); // Log data yang dikirim

    const passwordResponse = await changePassword(passwordData); // Panggil fungsi changePassword
    console.log('Password change response:', passwordResponse); // Log response dari server

    if (passwordResponse.success) {
      setMessage("Password berhasil diubah");
    }
  } catch (err) {
    console.error('Password change error:', err); // Log jika error
    setError("Gagal mengubah password: " + err.message);
  }
}


  // Lanjutkan dengan pembaruan profil lainnya
  try {
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("username", form.username);
    formData.append("whatsapp_number", form.whatsapp_number);
    formData.append("usdt_network", form.usdt_network);
    formData.append("usdt_address", form.usdt_address);

    if (form.profile_image instanceof File) {
      formData.append("profile_image", form.profile_image);
    }

    const response = await updateProfile(formData);
    if (response.success) {
      setMessage("Profil berhasil diperbarui");
      // Update user data di localStorage jika profil berhasil diperbarui
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.name = form.name;
        user.username = form.username;
        user.whatsapp_number = form.whatsapp_number;
        user.usdt_network = form.usdt_network;
        user.usdt_address = form.usdt_address;

        // Update image jika ada perubahan
        if (response.data.profile_image) {
          user.profile_image = response.data.profile_image;
        }

        localStorage.setItem("user", JSON.stringify(user));
      }
    }
  } catch (err) {
    setError("Gagal memperbarui profil: " + err.message);
  } finally {
    setLoading(false);
  }
};


// EditProfile.jsx - Sesuaikan dengan path yang benar
const renderAvatar = () => {
  if (form.profile_image) {
    if (form.profile_image instanceof File) {
      return (
        <img 
          src={URL.createObjectURL(form.profile_image)} 
          alt="Profile" 
          className="avatar-image" 
        />
      );
    } else if (typeof form.profile_image === "string" && form.profile_image !== "") {
      // Path sudah benar karena static serving dari /uploads
      const imageUrl = form.profile_image.startsWith('http') 
        ? form.profile_image 
        : `http://localhost:5000${form.profile_image}`;
      
      console.log('Rendering image from URL:', imageUrl);
      
      return (
        <img 
          src={imageUrl} 
          alt="Profile" 
          className="avatar-image" 
          onError={(e) => {
            console.error('Image failed to load:', imageUrl);
            // Fallback ke avatar text jika image gagal load
            e.target.style.display = 'none';
          }}
        />
      );
    }
  }

  return (
    <div className="avatar">
      {form.name ? form.name.charAt(0).toUpperCase() : "U"}
    </div>
  );
};

  if (loading && !form.name) {
    return <div className="edit-profile-container">Loading...</div>;
  }

  return (
    <div className="edit-profile-container">
      <div className="header-with-back">
        {/* <button onClick={() => navigate("/profile")} className="btn-back">
          ← Kembali
        </button> */}
        <h2 className="page-title">Edit Profile</h2>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="edit-profile-card">
        <div className="profile-photo-section">
          {renderAvatar()}
          <input 
            type="file" 
            id="profile-upload" 
            accept=".jpeg,.jpg,.png" 
            onChange={handleFileChange} 
            style={{ display: "none" }} 
          />
          <label htmlFor="profile-upload" className="btn-upload">
            Upload Photo
          </label>
          <p className="file-info">Allowed files: JPEG/JPG/PNG (1 MB)</p>
          <button 
            className="btn-delete-photo" 
            onClick={handleDeletePhoto} 
            disabled={!form.profile_image || loading}
          >
            Delete Photo
          </button>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name <span>*</span></label>
            <input 
              type="text" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Username <span>*</span></label>
            <input 
              type="text" 
              name="username" 
              value={form.username} 
              onChange={handleChange} 
              required 
            />
          </div>

    
<div className="form-group">
  <label>WhatsApp Number</label>
  <input 
    type="text" 
    name="whatsapp_number" 
    value={form.whatsapp_number} 
    onChange={handleChange} 
    placeholder="Contoh: +628123456789" 
  />
</div>

<div className="form-group">
  <label>USDT Network</label>
  <select 
    name="usdt_network" 
    value={form.usdt_network} 
    onChange={handleChange}
  >
    <option value="TRC20">TRC20</option>
    <option value="BEP20">BEP20</option>
    <option value="ERC20">ERC20</option>
  </select>
</div>

<div className="form-group">
  <label>USDT Wallet Address</label>
  <input 
    type="text" 
    name="usdt_address" 
    value={form.usdt_address} 
    onChange={handleChange} 
    placeholder="Masukkan alamat wallet USDT Anda" 
  />
</div>

<div className="form-group">
  <label>Email</label>
  <input
    type="email"
    name="email"
    value={form.email}
    onChange={handleChange}
    disabled
  />
  <small className="field-note">Email tidak dapat diubah</small>
</div>


          {/* Section untuk ganti password - perlu endpoint terpisah */}
          {/* <div className="password-section">
            <h3>Change Password</h3>
            <div className="form-group">
  <label>Current Password</label>
  <input
    type="password"
    name="currentPassword"
    value={form.currentPassword}
    onChange={handleChange}
    placeholder="Masukkan password lama"
  />
</div>

            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                name="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="Kosongkan jika tidak ingin mengubah password" 
              />
            </div>

            <div className="form-group">
              <label>Password Confirmation</label>
              <input 
                type="password" 
                name="confirmPassword" 
                value={form.confirmPassword} 
                onChange={handleChange} 
                placeholder="Konfirmasi password baru" 
              />
            </div>
            <small className="field-note">
              Untuk mengubah password, gunakan menu "Change Password" yang terpisah
            </small>
          </div> */}

          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? "Menyimpan..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}