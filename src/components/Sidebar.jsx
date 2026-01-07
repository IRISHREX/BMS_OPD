import React, { useContext, useState } from "react";
import { TiHome } from "react-icons/ti";
import { RiLogoutBoxFill } from "react-icons/ri";
import { FaBell, FaRegFileAlt, FaUserMd, FaUserNurse, FaUserPlus, FaChartBar } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoPersonAddSharp } from "react-icons/io5";
import { FaPrescription } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";

import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { Context } from "../main";
import { useNavigate } from "react-router-dom";
import RequirePermission from "./RequirePermission";
import { IoIosPersonAdd } from "react-icons/io";


const Sidebar = () => {
  const snackbar = useSnackbar();
  const [show, setShow] = useState(false);

  const { isAuthenticated, setIsAuthenticated } = useContext(Context);

  const handleLogout = async () => {
    try {
      const res = await api.get(`/api/v1/user/admin/logout`, {
        withCredentials: true,
      });

      // 1. Update React state
      setIsAuthenticated(false);
      snackbar.success(res.data.message);

      // 2. Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // 3. Force a hard reload to the login page to clear all in-memory state
      // and fetch a fresh version of the app.
      window.location.href = "/login";

    } catch (err) {
      // Even if logout fails, attempt to clear local state and redirect
      setIsAuthenticated(false);
      localStorage.clear();
      sessionStorage.clear();
      snackbar.error(err?.response?.data?.message || 'Logout failed');
      window.location.href = "/login";
    }
  };

  const navigateTo = useNavigate();

  const createNavAction = (path) => () => {
    navigateTo(path);
    setShow(!show);
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
          <TiHome onClick={navActions.home} title="Dashboard" />
          
          <RequirePermission allowedRoles={["Admin", "Doctor"]}>
            <FaChartBar onClick={navActions['doctor-dashboard']} title="Doctor Dashboard" />
          </RequirePermission>

          <RequirePermission allowedRoles={["Admin"]}>
            <FaUserMd onClick={navActions.doctors} title="Doctors" />
          </RequirePermission>

          <RequirePermission allowedRoles={["Admin"]}>
            <IoPersonAddSharp onClick={navActions.addNewDoctor} title="Add New Doctor" />
          </RequirePermission>

          <RequirePermission allowedRoles={["Admin", "Doctor"]}>
            <FaUserNurse onClick={navActions.compounders} title="Compounders" />
            <IoIosPersonAdd onClick={navActions.addNewHelper} title="Create Compounder" />
          </RequirePermission>

          <RequirePermission allowedRoles={["Admin", "Doctor", "Compounder"]}>
            <FaBell onClick={navActions.messages} title="Messages" />
            <FaRegFileAlt onClick={navActions.reports} title="Reports" />
          </RequirePermission>

          <RequirePermission allowedRoles={["Admin", "Doctor"]}>
            <IoMdSettings onClick={navActions.settings} title="Settings" />
          </RequirePermission>

          <RiLogoutBoxFill onClick={handleLogout} title="Logout" />
        </div>
      </nav>
      <div
        className="wrapper"
        style={!isAuthenticated ? { display: "none" } : { display: "flex" }}
      >
        <GiHamburgerMenu className="hamburger" onClick={() => setShow(!show)} />
      </div>
    </>
  );
};

export default Sidebar;
