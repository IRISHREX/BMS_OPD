import React, { useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import ForgottenPassword from "./components/ForgottenPassword";
import Appoinment from "./components/Appointment"
import AddNewDoctor from "./components/AddNewDoctor";
import Messages from "./components/Messages";
import Doctors from "./components/Doctors";
import Compounders from "./components/Compounders";
import { Context } from "./main";
import api from "./utils/api";
import DashboardLayout from "./components/layout/DashboardLayout";
import { SnackbarProvider } from "./context/SnackbarContext";
import SnackbarContainer from "./components/SnackbarContainer";
import AddNewAdmin from "./components/AddNewMedicatAssistant";
import "./App.css";
import Prescription from "./components/Prescription";
import Preview from "./components/Preview";
import Settings from "./components/Settings";
import Profile from "./components/Profile";
import MedicineSettings from "./components/MedicineSettings";
import RoleSettings from "./components/RoleSettings";
import GeneralSettings from "./components/ThemeSettings";
import AdvancedSettings from "./components/AdvancedSettings";
import RequireAuth from "./components/RequireAuth";
import InvoiceSettings from "./components/InvoiceSettings";
import InvoicePage from "./components/InvoicePage";
import ReportsPage from "./components/ReportsPage";
import MedicineStore from "./components/MedicineStore";
import CyberPunk404 from "./components/ErrorPage";
import DoctorDashboard from "./components/DoctorDashboard";
import CreateReferralTab from "./components/tabs/CreateReferralTab";
import ReferralPage from "./components/ReferralPage";
import HeaderFooterCreator from "./components/HeaderFooterCreator";
import TemplateBuilder from "./components/TemplateBuilder";
import PublicDoctorBooking from "./components/PublicDoctorBooking";
import BackupManager from "./components/BackupManager";
import SystemLogs from "./components/SystemLogs";
import DoctorCapacitySettings from "./components/DoctorCapacitySettings";
import TestManagement from "./components/TestManagement";
import AdviceManagement from "./components/AdviceManagement";
import InteractiveBackground from "./components/InteractiveBackground";

const App = () => {
  const { isAuthenticated, setIsAuthenticated, admin, setAdmin } =
    useContext(Context);

  useEffect(() => {
    const fetchUser = async () => {
      // If user recently logged out, don't try to re-hydrate automatically
      if (sessionStorage.getItem("logged_out") === "true") {
        setIsAuthenticated(false);
        setAdmin({});
        return;
      }
      try {
        const response = await api.get(`/api/v1/user/dashboard/me`);
        setIsAuthenticated(true);
        setAdmin(response.data.user);
      } catch (error) {
        setIsAuthenticated(false);
        setAdmin({});
      }
    };
    fetchUser();
  }, []);

  return (
    <SnackbarProvider>
      <InteractiveBackground />
      <Router>
        <Routes>
          {/* Public Standalone Pages (No Sidebar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgotten-password" element={<ForgottenPassword />} />
          <Route path="/book-appointment" element={<PublicDoctorBooking />} />

          {/* Authenticated Application Pages (Wrapped in multi-mode DashboardLayout) */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <Dashboard />
              </RequireAuth>
            } />
            <Route path="/add-appointment" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <Appoinment />
              </RequireAuth>
            } />
            <Route path="/doctor/addnew" element={
              <RequireAuth allowedRoles={["Admin"]}>
                <AddNewDoctor />
              </RequireAuth>
            } />
            <Route path="/helper/addnew" element={
              <RequireAuth allowedRoles={["Admin","Doctor"]}>
                <AddNewAdmin />
              </RequireAuth>
            } />
            <Route path="/messages" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <Messages />
              </RequireAuth>
            } />
            <Route path="/prescription" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <Prescription />
              </RequireAuth>
            } />
            <Route path="/doctors" element={
              <RequireAuth allowedRoles={["Admin","Doctor"]}>
                <Doctors />
              </RequireAuth>
            } />
            <Route path="/doctor-dashboard" element={
              <RequireAuth allowedRoles={["Admin", "Doctor"]}>
                <DoctorDashboard />
              </RequireAuth>
            } />
            <Route path="/compounders" element={
              <RequireAuth allowedRoles={["Admin","Doctor"]}>
                <Compounders />
              </RequireAuth>
            } />
            <Route path="/medicines" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <MedicineStore />
              </RequireAuth>
            } />
            <Route path="/tests" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <TestManagement />
              </RequireAuth>
            } />
            <Route path="/settings/tests" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <TestManagement />
              </RequireAuth>
            } />
            <Route path="/settings/advice" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <AdviceManagement />
              </RequireAuth>
            } />
            <Route path="/settings" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <Settings />
              </RequireAuth>
            } />
            <Route path="/settings/profile" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <Profile />
              </RequireAuth>
            } />
            <Route path="/reports" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <ReportsPage />
              </RequireAuth>
            } />
            <Route path="/settings/medicine" element={
              <RequireAuth allowedRoles={["Admin","Doctor"]}>
                <MedicineSettings />
              </RequireAuth>
            } />
            <Route path="/settings/invoices" element={
              <RequireAuth allowedRoles={["Admin","Doctor","Compounder"]}>
                <InvoiceSettings />
              </RequireAuth>
            } />
            <Route path="/settings/roles" element={
              <RequireAuth allowedRoles={["Admin"]}>
                <RoleSettings />
              </RequireAuth>
            } />
            <Route path="/settings/theme" element={
              <RequireAuth allowedRoles={["Admin","Doctor"]}>
                <GeneralSettings />
              </RequireAuth>
            } />
            <Route path="/settings/advanced" element={
              <RequireAuth allowedRoles={["Admin"]}>
                <AdvancedSettings />
              </RequireAuth>
            } />
            <Route path="/settings/advanced/backups" element={
              <RequireAuth allowedRoles={["Admin"]}>
                <BackupManager />
              </RequireAuth>
            } />
            <Route path="/settings/advanced/logs" element={
              <RequireAuth allowedRoles={["Admin"]}>
                <SystemLogs />
              </RequireAuth>
            } />
            <Route path="/settings/header-footer" element={
              <RequireAuth allowedRoles={["Admin","Doctor"]}>
                <HeaderFooterCreator />
              </RequireAuth>
            } />
            <Route path="/settings/templates" element={
              <RequireAuth allowedRoles={["Admin","Doctor"]}>
                <TemplateBuilder />
              </RequireAuth>
            } />
            <Route path="/settings/capacity" element={
              <RequireAuth allowedRoles={["Admin","Doctor"]}>
                <DoctorCapacitySettings />
              </RequireAuth>
            } />
            <Route path="/preview/:patientId" element={<Preview />} />
            <Route path="/invoice/:invoiceId" element={<InvoicePage />} />
            <Route path="/referral/:referralId" element={<ReferralPage />} />
          </Route>

          <Route path="*" element={<CyberPunk404 />} />
        </Routes>
        <SnackbarContainer />
      </Router>
    </SnackbarProvider>
  );
};

export default App;
