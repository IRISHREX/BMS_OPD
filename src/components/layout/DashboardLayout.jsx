import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import { BiMenu } from "react-icons/bi";
import { SidebarProvider, useSidebar, SIDEBAR_MODES } from "../../context/SidebarContext";
import "./DashboardLayout.css";

const DashboardLayoutContent = ({ children }) => {
  const { sidebarMode, isDrawerOpen, openDrawer, closeDrawer, isMobile } = useSidebar();

  const isDrawer = isMobile || sidebarMode === SIDEBAR_MODES.HIDDEN;

  return (
    <div
      className={`dashboard-shell mode-${sidebarMode} ${
        isDrawer ? "is-drawer-layout" : ""
      }`}
    >
      {/* Floating Drawer Trigger Button (Only visible on mobile or when sidebar is hidden) */}
      {isDrawer && !isDrawerOpen && (
        <button
          className="floating-drawer-toggle"
          onClick={openDrawer}
          title="Open Menu"
          aria-label="Open Navigation Menu"
        >
          <BiMenu />
        </button>
      )}

      {/* Sidebar navigation */}
      <Sidebar />

      {/* Backdrop overlay for Drawer mode */}
      {isDrawer && isDrawerOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeDrawer}
          aria-label="Close sidebar drawer overlay"
        />
      )}

      {/* Main Content Column (Takes 100% of remaining width and height) */}
      <div className="dashboard-content-wrapper">
        <main className="dashboard-main-area">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
};

export default DashboardLayout;
