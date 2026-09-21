import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { TiHome } from "react-icons/ti";
import {
  FaBell,
  FaRegFileAlt,
  FaUserMd,
  FaUserNurse,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import { RiCalendarScheduleFill } from "react-icons/ri";
import { IoMdSettings } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";
import { MdLocalHospital } from "react-icons/md";

import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { Context } from "../main";
import { logout } from "../store/authSlice";
import { playClickSound } from "../utils/soundUtils";
import RequirePermission from "./RequirePermission";
import { useSidebar, SIDEBAR_MODES } from "../context/SidebarContext";
import "./Sidebar.css";

const Sidebar = () => {
  const snackbar = useSnackbar();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, setIsAuthenticated, setAdmin, admin } = useContext(Context);
  const {
    sidebarMode,
    toggleSidebarMode,
    isDrawerOpen,
    closeDrawer,
    isMobile,
  } = useSidebar();

  const handleLogout = async () => {
    playClickSound();
    sessionStorage.setItem("logged_out", "true");
    try {
      const res = await api.get(`/api/v1/user/admin/logout`, {
        withCredentials: true,
      });

      dispatch(logout());
      setIsAuthenticated(false);
      setAdmin({});
      snackbar.success(res?.data?.message || "Logged out successfully");

      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem("logged_out", "true");
      window.location.href = "/login";
    } catch (err) {
      dispatch(logout());
      setIsAuthenticated(false);
      setAdmin({});
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem("logged_out", "true");
      snackbar.error(err?.response?.data?.message || "Logout failed");
      window.location.href = "/login";
    }
  };

  const handleNav = (path) => {
    playClickSound();
    navigate(path);
    if (isMobile || sidebarMode === SIDEBAR_MODES.HIDDEN) {
      closeDrawer();
    }
  };

  if (!isAuthenticated) return null;

  const isCurrentRoute = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: TiHome,
      roles: ["Admin", "Doctor", "Compounder"],
    },
    {
      name: "Doctor Workspace",
      path: "/doctor-dashboard",
      icon: FaChartBar,
      roles: ["Admin", "Doctor"],
    },

    {
      name: "Doctors Directory",
      path: "/doctors",
      icon: FaUserMd,
      roles: ["Admin"],
    },
    {
      name: "Assistants",
      path: "/compounders",
      icon: FaUserNurse,
      roles: ["Admin", "Doctor"],
    },
    {
      name: "Messages",
      path: "/messages",
      icon: FaBell,
      roles: ["Admin", "Doctor", "Compounder"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FaRegFileAlt,
      roles: ["Admin", "Doctor", "Compounder"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: IoMdSettings,
      roles: ["Admin", "Doctor", "Compounder"],
    },
  ];

  // Determine CSS classes based on mode & drawer state
  const isDrawer = isMobile || sidebarMode === SIDEBAR_MODES.HIDDEN;
  const sidebarClasses = [
    "bms-sidebar",
    `mode-${sidebarMode}`,
    isDrawer ? "drawer-mode" : "",
    isDrawer && isDrawerOpen ? "drawer-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isFull = !isDrawer && sidebarMode === SIDEBAR_MODES.FULL;

  return (
    <aside className={sidebarClasses}>
      {/* Brand Header */}
      <div className="sidebar-brand-header">
        <div className="brand-logo-wrap" onClick={() => handleNav("/")}>
          <div className="brand-logo-icon">
            <MdLocalHospital />
          </div>
          {(isFull || isDrawer) && (
            <div className="brand-text-box">
              <span className="brand-title">BMS OPD</span>
              <span className="brand-subtitle">Clinical Portal</span>
            </div>
          )}
        </div>

        {/* Close button inside drawer */}
        {isDrawer && isDrawerOpen && (
          <button
            className="drawer-close-btn"
            onClick={closeDrawer}
            title="Close Menu"
          >
            <FaTimes />
          </button>
        )}

        {/* Collapse / Expand toggle button (Desktop only) */}
        {!isDrawer && (
          <button
            className="sidebar-collapse-toggle"
            onClick={() => {
              playClickSound();
              toggleSidebarMode();
            }}
            title={isFull ? "Collapse to Compact View" : "Expand to Full View"}
            aria-label="Toggle Sidebar"
          >
            {isFull ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav-container">
        <ul className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrentRoute(item.path);

            return (
              <RequirePermission key={item.path} allowedRoles={item.roles}>
                <li className="sidebar-nav-item">
                  <button
                    className={`sidebar-nav-link ${active ? "active" : ""}`}
                    onClick={() => handleNav(item.path)}
                    data-tooltip={item.name}
                    aria-label={item.name}
                  >
                    <div className="nav-icon-box">
                      <Icon className="nav-icon" />
                    </div>
                    {(isFull || isDrawer) && (
                      <span className="nav-label">{item.name}</span>
                    )}
                    {active && <div className="active-indicator" />}
                  </button>
                </li>
              </RequirePermission>
            );
          })}
        </ul>
      </nav>

      {/* User / Logout Footer */}
      <div className="sidebar-footer">
        {(isFull || isDrawer) ? (
          <div className="sidebar-user-card">
            <div className="user-details">
              <span className="user-name">
                {admin?.name || admin?.firstName || "Staff"}
              </span>
              <span className="user-role-badge">
                {admin?.role || "Medical"}
              </span>
            </div>
            <button
              className="footer-logout-btn"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <FiLogOut />
            </button>
          </div>
        ) : (
          <button
            className="footer-logout-btn-compact"
            onClick={handleLogout}
            data-tooltip="Logout"
            aria-label="Logout"
          >
            <div className="nav-icon-box">
              <FiLogOut className="nav-icon" />
            </div>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
