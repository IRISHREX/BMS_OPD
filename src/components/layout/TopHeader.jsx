import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Context } from "../../main";
import { useSidebar, SIDEBAR_MODES } from "../../context/SidebarContext";
import { BiMenu, BiSidebar } from "react-icons/bi";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { BsLayoutSidebarInset, BsLayoutSidebar } from "react-icons/bs";
import { FaUserCircle, FaBell } from "react-icons/fa";
import { playClickSound } from "../../utils/soundUtils";
import "./TopHeader.css";

const PAGE_TITLES = {
  "/": "Dashboard Overview",
  "/doctor-dashboard": "Doctor Clinical Workspace",
  "/add-appointment": "Appointments Management",
  "/prescription": "Prescription & OPD Consultation",
  "/doctors": "Doctors Directory",
  "/doctor/addnew": "Register New Doctor",
  "/compounders": "Medical Assistants",
  "/helper/addnew": "Register Assistant",
  "/medicines": "Medicine Store & Inventory",
  "/tests": "Diagnostics & Lab Tests",
  "/messages": "Communications & Notices",
  "/reports": "Clinical & Operational Reports",
  "/settings": "System Settings",
  "/settings/profile": "User Profile",
  "/settings/medicine": "Medicine Catalog Settings",
  "/settings/invoices": "Billing & Invoice Settings",
  "/settings/roles": "Role & Access Control",
  "/settings/theme": "Visual Theme Settings",
  "/settings/advanced": "Advanced Configuration",
  "/settings/advanced/backups": "System Backups",
  "/settings/advanced/logs": "Audit & System Logs",
  "/settings/header-footer": "Prescription Header/Footer",
  "/settings/templates": "Prescription Templates",
  "/settings/capacity": "Doctor Daily Capacity",
};

const TopHeader = () => {
  const { admin } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sidebarMode,
    setSidebarMode,
    toggleDrawer,
    isMobile,
  } = useSidebar();

  const currentTitle =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith("/preview")
      ? "Prescription Print Preview"
      : location.pathname.startsWith("/invoice")
      ? "Invoice Viewer"
      : "BMS OPD Clinic");

  const handleModeChange = (mode) => {
    playClickSound();
    setSidebarMode(mode);
  };

  const handleDrawerClick = () => {
    playClickSound();
    toggleDrawer();
  };

  const displayName = admin?.name || admin?.firstName
    ? `${admin?.firstName || ""} ${admin?.lastName || ""}`.trim() || admin?.name
    : "User";

  const userRole = admin?.role || "Staff";

  return (
    <header className="top-header-bar">
      <div className="top-header-left">
        {/* Drawer button (shown on mobile or when sidebar is hidden) */}
        {(isMobile || sidebarMode === SIDEBAR_MODES.HIDDEN) && (
          <button
            className="header-icon-btn drawer-toggle-btn"
            onClick={handleDrawerClick}
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <BiMenu className="btn-svg" />
          </button>
        )}

        <div className="breadcrumb-box">
          <span className="breadcrumb-sub">OPD Management</span>
          <h1 className="breadcrumb-title">{currentTitle}</h1>
        </div>
      </div>

      <div className="top-header-right">
        {/* Mode Switcher Buttons (Hidden on mobile) */}
        {!isMobile && (
          <div className="mode-switcher-pill" title="Switch Sidebar View Mode">
            <button
              className={`mode-btn ${sidebarMode === SIDEBAR_MODES.FULL ? "active" : ""}`}
              onClick={() => handleModeChange(SIDEBAR_MODES.FULL)}
              title="Full View (Icons + Labels)"
              aria-label="Full View"
            >
              <BsLayoutSidebarInset />
              <span className="mode-label">Full</span>
            </button>
            <button
              className={`mode-btn ${sidebarMode === SIDEBAR_MODES.COMPACT ? "active" : ""}`}
              onClick={() => handleModeChange(SIDEBAR_MODES.COMPACT)}
              title="Compact View (Icons with Tooltips)"
              aria-label="Compact View"
            >
              <BsLayoutSidebar />
              <span className="mode-label">Compact</span>
            </button>
            <button
              className={`mode-btn ${sidebarMode === SIDEBAR_MODES.HIDDEN ? "active" : ""}`}
              onClick={() => handleModeChange(SIDEBAR_MODES.HIDDEN)}
              title="Full Screen Canvas (Drawer Mode)"
              aria-label="Drawer Mode"
            >
              <FiMaximize2 />
              <span className="mode-label">Full Canvas</span>
            </button>
          </div>
        )}

        {/* User Pill */}
        <div
          className="user-pill-badge"
          onClick={() => {
            playClickSound();
            navigate("/settings/profile");
          }}
          title="Go to Profile"
        >
          {admin?.avatar?.url ? (
            <img src={admin.avatar.url} alt={displayName} className="user-avatar-img" />
          ) : (
            <FaUserCircle className="user-avatar-icon" />
          )}
          <div className="user-info-text">
            <span className="user-info-name">{displayName}</span>
            <span className="user-info-role">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
