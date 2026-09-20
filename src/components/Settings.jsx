import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaPills, FaShieldAlt, FaHospital, FaCog, FaReceipt, FaFileInvoice, FaHeading, FaClipboardList, FaCommentMedical } from "react-icons/fa";
import { FaStethoscope } from "react-icons/fa";
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
    id: "templates",
    name: "Prescription Templates",
    icon: <FaFileInvoice size={28} color="#ec4899" />,
    description: "Create and customize layout, sections, and print styles.",
    route: "/settings/templates",
  },
  {
    id: "header-footer",
    name: "Header & Footer Creator",
    icon: <FaHeading size={28} color="#6366f1" />,
    description: "Design bilingual headers and footers for printed prescriptions.",
    route: "/settings/header-footer",
  },
  {
    id: "capacity",
    name: "Doctor Capacity",
    icon: <FaClipboardList size={28} color="#0ea5e9" />,
    description: "Configure daily patient limits and scheduling caps.",
    route: "/settings/capacity",
  },
  {
    id: "invoices",
    name: "Invoice & Billing Settings",
    icon: <FaReceipt size={28} color="#06b6d4" />,
    description: "Manage billing preferences, tax, and invoice defaults.",
    route: "/settings/invoices",
  },
  {
    id: "medicine",
    name: "Medical Catalog",
    icon: <FaPills size={28} color="#10b981" />,
    description: "Manage diagnosis templates, medicines, tests, and advices.",
    route: "/settings/medicine",
  },
  {
    id: "roles",
    name: "Role Management",
    icon: <FaShieldAlt size={28} color="#8b5cf6" />,
    description: "Assign roles, permissions and manage staff accounts.",
    route: "/settings/roles",
  },
  {
    id: "general",
    name: "General & Theme",
    icon: <FaHospital size={28} color="#f59e0b" />,
    description: "Customize the dashboard appearance and theme modes.",
    route: "/settings/theme",
  },
  {
    id: "advanced",
    name: "Advanced & System Logs",
    icon: <FaCog size={28} color="#64748b" />,
    description: "Audit trail, real-time error logs, and data backups.",
    route: "/settings/advanced",
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
