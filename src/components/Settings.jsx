import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaPills, FaShieldAlt, FaHospital, FaCog, FaReceipt, FaFileInvoice } from "react-icons/fa";
import "./Settings.css";

const settings = [
  {
    id: "profile",
    name: "My Profile",
    icon: <FaUserCircle size={28} color="#0284c7" />,
    description: "View your profile, change password and account details.",
    route: "/settings/profile",
  },
  {
    id: "medicine",
    name: "Medicine Settings",
    icon: <FaPills size={28} color="#10b981" />,
    description: "Manage medicines: add, edit or delete medicine records.",
    route: "/settings/medicine",
  },
  {
    id: "roles",
    name: "Role Management",
    icon: <FaShieldAlt size={28} color="#8b5cf6" />,
    description: "Assign roles, permissions and manage users.",
    route: "/settings/roles",
  },
  {
    id: "general",
    name: "General Settings",
    icon: <FaHospital size={28} color="#f59e0b" />,
    description: "Customize the dashboard appearance and theme.",
    route: "/settings/theme",
  },
  {
    id: "advanced",
    name: "Advanced Settings",
    icon: <FaCog size={28} color="#64748b" />,
    description: "Configure advanced options and system preferences.",
    route: "/settings/advanced",
  },
  {
    id: "invoices",
    name: "Invoice Settings",
    icon: <FaReceipt size={28} color="#06b6d4" />,
    description: "Create, edit and manage invoices.",
    route: "/settings/invoices",
  },
  {
    id: "templates",
    name: "Prescription Templates",
    icon: <FaFileInvoice size={28} color="#ec4899" />,
    description: "Create and manage custom PDF layouts for prescriptions.",
    route: "/settings/templates",
  }
];

const Settings = () => {
  const navigate = useNavigate();

  return (
    <section className="page">
      <div className="settings-page">
        <div className="settings-header">
          <h2>Settings</h2>
          <p>Select a setting to configure</p>
        </div>

        <div className="settings-grid">
          {settings.map((s) => (
            <div
              key={s.id}
              className="settings-card"
              onClick={() => navigate(s.route)}
              role="button"
              tabIndex={0}
            >
              <div className="settings-card-icon">{s.icon}</div>
              <div className="settings-card-body">
                <h3>{s.name}</h3>
                <p>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Settings;
