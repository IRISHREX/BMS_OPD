import React, { useContext, useState } from "react";
import { TiHome } from "react-icons/ti";
import { FaBell, FaRegFileAlt, FaUserMd, FaUserNurse, FaChartBar } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";
import { BiAlignLeft } from "react-icons/bi";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { Context } from "../main";
import { logout } from "../store/authSlice";
import { playClickSound } from "../utils/soundUtils";
import RequirePermission from "./RequirePermission";
import "./Sidebar.css";

const Sidebar = () => {
  const snackbar = useSnackbar();
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();
  const navigateTo = useNavigate();

  const { isAuthenticated, setIsAuthenticated, setAdmin } = useContext(Context);

  const handleLogout = async () => {
    playClickSound();
    sessionStorage.setItem("logged_out", "true");
    try {
      const res = await api.get(`/api/v1/user/admin/logout`, {
        withCredentials: true,
      });

      // 1. Update Redux & Context state
      dispatch(logout());
      setIsAuthenticated(false);
      setAdmin({});
      snackbar.success(res?.data?.message || "Logged out successfully");

      // 2. Clear storage but keep logout marker
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem("logged_out", "true");

      // 3. Navigate to login
      window.location.href = "/login";
    } catch (err) {
      // Even if logout fails, attempt to clear local state and redirect
      dispatch(logout());
      setIsAuthenticated(false);
      setAdmin({});
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem("logged_out", "true");
      snackbar.error(err?.response?.data?.message || 'Logout failed');
      window.location.href = "/login";
    }
  };

  const createNavAction = (path) => () => {
    playClickSound();
    navigateTo(path);
    setShow(false);
  };

  const navActions = {
    home: createNavAction("/"),
    doctors: createNavAction("/doctors"),
    "doctor-dashboard": createNavAction("/doctor-dashboard"),
    messages: createNavAction("/messages"),
    reports: createNavAction("/reports"),
    addNewDoctor: createNavAction("/doctor/addnew"),
    addNewHelper: createNavAction("/helper/addnew"),
    compounders: createNavAction("/compounders"),
    settings: createNavAction("/settings"),
  };

  return (
    <>
      <nav
        style={!isAuthenticated ? { display: "none" } : { display: "flex" }}
        className={show ? "show sidebar" : "sidebar"}
      >
        <div className="links">
          <TiHome className="sidebar-icon" onClick={navActions.home} title="Dashboard" />
          
          <RequirePermission allowedRoles={["Admin", "Doctor"]}>
            <FaChartBar className="sidebar-icon" onClick={navActions['doctor-dashboard']} title="Doctor Dashboard" />
          </RequirePermission>

          <RequirePermission allowedRoles={["Admin"]}>
            <FaUserMd className="sidebar-icon" onClick={navActions.doctors} title="Doctors" />
          </RequirePermission>

          <RequirePermission allowedRoles={["Admin", "Doctor"]}>
            <FaUserNurse className="sidebar-icon" onClick={navActions.compounders} title="Assistants" />
          </RequirePermission>

          <RequirePermission allowedRoles={["Admin", "Doctor", "Compounder"]}>
            <FaBell className="sidebar-icon" onClick={navActions.messages} title="Messages" />
            <FaRegFileAlt className="sidebar-icon" onClick={navActions.reports} title="Reports" />
          </RequirePermission>

          <RequirePermission allowedRoles={["Admin", "Doctor"]}>
            <IoMdSettings className="sidebar-icon" onClick={navActions.settings} title="Settings" />
          </RequirePermission>

          <FiLogOut className="sidebar-icon" onClick={handleLogout} title="Logout" />
        </div>
      </nav>
      <div
        className="wrapper"
        style={!isAuthenticated ? { display: "none" } : { display: "flex" }}
      >
        <BiAlignLeft className="hamburger icon-btn" onClick={() => { playClickSound(); setShow(!show); }} />
      </div>
    </>
  );
};

export default Sidebar;
