import React, { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext();

export const SIDEBAR_MODES = {
  FULL: "full",
  COMPACT: "compact",
  HIDDEN: "hidden",
};

export const SidebarProvider = ({ children }) => {
  // Initialize mode from localStorage, defaulting to 'full'
  const [sidebarMode, setSidebarModeState] = useState(() => {
    const saved = localStorage.getItem("bms_sidebar_mode");
    if (saved && Object.values(SIDEBAR_MODES).includes(saved)) {
      return saved;
    }
    // Default to full on large screens, hidden/drawer on small screens
    return window.innerWidth < 1024 ? SIDEBAR_MODES.HIDDEN : SIDEBAR_MODES.FULL;
  });

  // Drawer overlay state (used when mode is 'hidden' or on mobile screens)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile && sidebarMode !== SIDEBAR_MODES.HIDDEN) {
        // Automatically collapse to drawer mode on smaller screens
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarMode]);

  const setSidebarMode = (mode) => {
    if (Object.values(SIDEBAR_MODES).includes(mode)) {
      setSidebarModeState(mode);
      localStorage.setItem("bms_sidebar_mode", mode);
      if (mode !== SIDEBAR_MODES.HIDDEN) {
        setIsDrawerOpen(false);
      }
    }
  };

  const toggleSidebarMode = () => {
    if (sidebarMode === SIDEBAR_MODES.FULL) {
      setSidebarMode(SIDEBAR_MODES.COMPACT);
    } else if (sidebarMode === SIDEBAR_MODES.COMPACT) {
      setSidebarMode(SIDEBAR_MODES.FULL);
    } else {
      setSidebarMode(SIDEBAR_MODES.FULL);
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{
        sidebarMode,
        setSidebarMode,
        toggleSidebarMode,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        isMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export default SidebarContext;
