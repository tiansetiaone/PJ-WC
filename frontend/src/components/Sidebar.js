import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../style/Sidebar.css';

const Sidebar = ({ isOpen, onClose, isCollapsed }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [role, setRole] = useState("user"); // default user

  useEffect(() => {
    // Ambil data user dari localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role) {
          setRole(parsedUser.role); // set role dari localStorage
        }
      } catch (err) {
        console.error("Error parsing localStorage user:", err);
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.sidebar')) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, isMobile]);

  // MENU LIST untuk USER
  const userMenu = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/campaign", label: "Campaign", icon: "📢" },
    { path: "/deposits/list", label: "Deposit", icon: "💳" },
    { path: "/referral", label: "Referral", icon: "👤" },
    { path: "/contact/user", label: "Contact Support", icon: "🎧" },
  ];

  // MENU LIST untuk ADMIN
  const adminMenu = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/admin/user/list", label: "User Management", icon: "👥" },
    { path: "/campaign", label: "Campaign Management", icon: "📢" },
    { path: "/admin/deposits/list", label: "Deposit Management", icon: "💳" },
    { path: "/admin/referral/list", label: "Referral Settings", icon: "⚙️" },
    { path: "/admin/notifications", label: "Notification Management", icon: "🔔" },
    { path: "/contact/admin", label: "Ticket Support", icon: "🎧" },
  ];

  // Tentukan menu sesuai role
  const menuList = role === "admin" ? adminMenu : userMenu;

  return (
    <>
      {isMobile && isOpen && (
        <div className="sidebar-overlay active" onClick={onClose} />
      )}

      <nav className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <ul className="menu">
          {menuList.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={isMobile ? onClose : null}
              >
                <span className="icon">{item.icon}</span>
                {!isCollapsed && item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;
