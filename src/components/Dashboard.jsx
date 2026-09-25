import React, { useCallback, useContext, useEffect, useState } from "react";
import InvoiceViewer from "./InvoiceViewer";
import Reports from "./Reports";
import { Context } from "../main";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import api, { rescheduleAppointment } from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { GoCheckCircleFill } from "react-icons/go";
import { AiFillCloseCircle } from "react-icons/ai";
import { FaUserMd, FaUsers, FaWallet } from "react-icons/fa";
import Prescription from "./Prescription";
import Modal from "react-modal";
import { FaTrash } from "react-icons/fa";
import RequirePermission from "./RequirePermission";
import DownloadPrescriptionModal from "./DownloadPrescriptionModal";
import {
  MdOutlineContentPasteSearch,
  MdOutlineDelete,
  MdSchedule,
} from "react-icons/md";
import { RiCalendarScheduleFill } from "react-icons/ri";
import { FaEye } from "react-icons/fa";
import { FaFilePdf } from "react-icons/fa6";
import { IoReceipt } from "react-icons/io5";
import RescheduleModal from "./RescheduleModal";
import DashboardSlotChecker from "./DashboardSlotChecker";
import {
  playSaveSound,
  playLoadSound,
  playDeleteSound,
  playSettledSound,
} from "../utils/soundUtils";
import "./Dashboard.css";
import { RiExpandHorizontalSFill } from "react-icons/ri";
import { FaPrescriptionBottleMedical } from "react-icons/fa6";
import { IoIosShareAlt } from "react-icons/io";
import CreateReferralTab from "./tabs/CreateReferralTab";
import RadialMenu from "./RadialMenu";
import useClickSound from "../hooks/useClickSound";
import { RiExpandVerticalLine } from "react-icons/ri";

import PieChartCard from "./PieChartCard";
import LineChartCard from "./LineChartCard";
import SimpleBarChart from "./SimpleBarChart";
import "./ChartCards.css";

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [filterOption, setFilterOption] = useState(() => sessionStorage.getItem("dash_filterOption") || "Today");
  const [customStart, setCustomStart] = useState(() => sessionStorage.getItem("dash_customStart") || "");
  const [customEnd, setCustomEnd] = useState(() => sessionStorage.getItem("dash_customEnd") || "");
  const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem("dash_searchTerm") || ""); // For text search
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => sessionStorage.getItem("dash_selectedDoctorId") || ""); // For doctor filter
  const navigate = useNavigate();
  const location = useLocation();
  const [doctors, setDoctors] = useState([]); // For total count card
  const [doctorFilterList, setDoctorFilterList] = useState([]); // For dropdown
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  // const [filterPrescibed, setFilterPrescibed] = useState({
  //   status: "Completed",
  //   prescribed: "filterPrescibed",
  // });
  const [filterPrescibed, setfilterPrescibed] = useState(() => sessionStorage.getItem("dash_filterPrescibed") || "Unprescribed");

  useEffect(() => {
    sessionStorage.setItem("dash_filterOption", filterOption);
    sessionStorage.setItem("dash_customStart", customStart);
    sessionStorage.setItem("dash_customEnd", customEnd);
    sessionStorage.setItem("dash_searchTerm", searchTerm);
    sessionStorage.setItem("dash_selectedDoctorId", selectedDoctorId);
    sessionStorage.setItem("dash_filterPrescibed", filterPrescibed);
  }, [filterOption, customStart, customEnd, searchTerm, selectedDoctorId, filterPrescibed]);

  const setupClickSound = useClickSound();

  const fmt = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };
  // Modal and prescription state
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [downloadPrescriptionPatient, setDownloadPrescriptionPatient] = useState(null); // { patientId, name }
  const [selectedPatientData, setSelectedPatientData] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointmentToReschedule, setSelectedAppointmentToReschedule] =
    useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [slotCheckerOpen, setSlotCheckerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(
    () => typeof window !== "undefined" && window.innerWidth > 900
  );

  const [dashboardTotals, setDashboardTotals] = useState({ paid: 0, due: 0 });
  const [dashboardGroups, setDashboardGroups] = useState([]);

  const fetchDashboardCharts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/invoice/stats?group=day');
      const groups = Array.isArray(data.groups) ? data.groups : [];
      setDashboardTotals({
        paid: Number(data.totalEarning || 0),
        due: Number(data.totalDue || 0)
      });
      setDashboardGroups(groups.map(g => ({
        period: g.period,
        revenue: g.totalEarning,
        due: g.totalDue,
        count: g.count
      })));
    } catch (e) {
      console.error("Failed to load dashboard chart data");
    }
  }, []);

  useEffect(() => {
    fetchDashboardCharts();
  }, [fetchDashboardCharts]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsExpanded(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { isAuthenticated, admin } = useContext(Context);
  const snackbar = useSnackbar();

  // Component-level fetchAppointments so it can be called from anywhere (e.g. closePrescriptionModal)
  const fetchAppointments = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/v1/appointment/getall`);
      setAppointments(data.appointments);
    } catch (error) {
      setAppointments([]);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchDashboardCharts();

    const onUpdated = () => {
      fetchAppointments();
      fetchDashboardCharts();
    };
    window.addEventListener("appointments:updated", onUpdated);
    return () => window.removeEventListener("appointments:updated", onUpdated);
  }, [location.pathname, fetchAppointments, fetchDashboardCharts]);

  // Role-limited metrics
  const metrics = React.useMemo(() => {
    const now = new Date();
    const todayYmd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toLocaleDateString("en-CA");
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const getDoctorId = (appt) => {
      if (!appt) return null;
      if (appt.doctor && (appt.doctor._id || appt.doctor.id))
        return String(appt.doctor._id || appt.doctor.id);
      if (appt.doctorId) return String(appt.doctorId);
      return null;
    };

    const isVisible = (appt) => {
      if (!admin || !admin.role) return true;
      if (admin.role === "Admin") return true;
      if (admin.role === "Doctor")
        return String(getDoctorId(appt)) === String(admin._id);
      if (admin.role === "Compounder") {
        const assigned = (admin.assignedDoctors || []).map((d) =>
          String(d._id || d),
        );
        return assigned.includes(String(getDoctorId(appt)));
      }
      return true;
    };

    let patientsToday = new Set();
    let apptsTodayCount = 0;
    let paidToday = 0;
    let dueToday = 0;
    let patientsMonth = new Set();
    let apptsMonthCount = 0;
    let paidMonth = 0;
    let dueMonth = 0;
    let pendingActionCount = 0;

    (appointments || []).forEach((a) => {
      try {
        if (!isVisible(a)) return;
        const d = new Date(a.appointment_date);
        const ymd = d.toLocaleDateString("en-CA");
        const isPaid = String(a.paymentStatus || "").toLowerCase() === "paid";
        const isRefund = String(a.paymentStatus || "").toLowerCase() === "refund";

        let apptPaid = 0;
        let apptDue = 0;
        if (Array.isArray(a.invoices) && a.invoices.length > 0) {
          a.invoices.forEach((inv) => {
            if (inv && typeof inv === "object") {
              const invPaid = (inv.payments || []).reduce(
                (sum, p) => sum + (Number(p.amount) || 0),
                0,
              );
              const invTotal = Number(inv.total || inv.subtotal || 0);
              apptPaid += invPaid;
              apptDue += Math.max(0, invTotal - invPaid);
            }
          });
        } else {
          const price = Number(a.price || a.feesAmount || a.amount || 0) || 0;
          if (isPaid) apptPaid += price;
          else if (!isRefund) apptDue += price;
        }

        const patientKey = a.patientId
          ? (typeof a.patientId === "object"
              ? String(a.patientId._id || a.patientId.id)
              : String(a.patientId))
          : (a.phone
              ? `phone:${String(a.phone).trim()}`
              : (a.name
                  ? `name:${String(a.name).trim().toLowerCase()}`
                  : String(a._id)));

        if (ymd === todayYmd) {
          apptsTodayCount++;
          if (patientKey) patientsToday.add(patientKey);
          paidToday += apptPaid;
          dueToday += apptDue;
          if (a.status === "Pending" || a.status === "Accepted") {
            pendingActionCount++;
          }
        }

        if (d >= monthStart && d <= monthEnd) {
          apptsMonthCount++;
          if (patientKey) patientsMonth.add(patientKey);
          paidMonth += apptPaid;
          dueMonth += apptDue;
        }
      } catch (e) { }
    });

    const todayPeriod = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayGroup = (dashboardGroups || []).find(
      (g) => g.period === todayPeriod || (g.period && g.period.endsWith(todayPeriod))
    );

    const finalPaidToday = todayGroup !== undefined ? Number(todayGroup.revenue || 0) : paidToday;
    const finalDueToday = todayGroup !== undefined ? Number(todayGroup.due || 0) : dueToday;
    const finalPaidMonth = dashboardTotals?.paid !== undefined && dashboardTotals.paid > 0 ? Number(dashboardTotals.paid) : paidMonth;
    const finalTotalDue = dashboardTotals?.due !== undefined ? Number(dashboardTotals.due) : dueMonth;

    return {
      patientsViewedToday: patientsToday.size,
      apptsTodayCount,
      paidToday: finalPaidToday,
      dueToday: finalDueToday,
      patientsThisMonth: patientsMonth.size,
      apptsMonthCount,
      paidThisMonth: finalPaidMonth,
      dueThisMonth: finalTotalDue,
      pendingActionCount,
    };
  }, [appointments, admin, dashboardGroups, dashboardTotals]);

  const handleUpdatePaymentStatus = async (appointmentId, paymentStatus) => {
    try {
      const appt = appointments.find((a) => a._id === appointmentId);
      const rawStatus = appt?.status || "Pending";
      const currentStatus = rawStatus === "Rejected" ? "Canceled" : rawStatus;

      const body = { paymentStatus };
      if (paymentStatus === "Refund") {
        body.status = "Canceled";
      } else if (paymentStatus === "Paid" && currentStatus === "Pending") {
        body.status = "Accepted";
      }

      const { data } = await api.put(
        `/api/v1/appointment/status/${appointmentId}`,
        body,
      );
      const updated = data.appointment || null;
      if (updated) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === appointmentId ? updated : a)),
        );
      } else {
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === appointmentId
              ? {
                ...a,
                paymentStatus,
                status:
                  paymentStatus === "Refund"
                    ? "Canceled"
                    : paymentStatus === "Paid" && a.status === "Pending"
                      ? "Accepted"
                      : a.status,
              }
              : a,
          ),
        );
      }
      playSaveSound();
      snackbar.success(data.message || "Payment status updated");
      if (paymentStatus === "Paid") {
        playSettledSound();
      }
    } catch (e) {
      snackbar.error(
        e?.response?.data?.message || "Failed to update payment status",
      );
    }
  };

  // Set up doctor filter list based on user role
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get(`/api/v1/user/doctors`);
        setDoctors(data.doctors || []);

        if (admin && admin.role) {
          if (admin.role === "Admin") {
            setDoctorFilterList(data.doctors || []);
            setSelectedDoctorId(""); // Admin can see all by default
          } else if (admin.role === "Doctor") {
            setDoctorFilterList(data.doctors || []);
            setSelectedDoctorId(admin._id); // Doctor sees only their own
            setfilterPrescibed("Unprescribed");
          } else if (admin.role === "Compounder") {
            // Compounder sees only their assigned doctors
            const assignedDoctorIds = (admin.assignedDoctors || []).map(
              (d) => d._id,
            );
            const assignedDoctorsList = (data.doctors || []).filter((doc) =>
              assignedDoctorIds.includes(doc._id),
            );
            setDoctorFilterList(assignedDoctorsList);
            if (assignedDoctorsList.length > 0) {
              setSelectedDoctorId(assignedDoctorsList[0]._id); // Default to first assigned doctor
            } else {
              setSelectedDoctorId("");
            }
          }
        }
      } catch (error) {
        snackbar.error(
          error.response?.data?.message || "Failed to fetch doctors",
        );
        setDoctors([]);
        setDoctorFilterList([]);
      }
    };
    if (isAuthenticated && admin) {
      fetchDoctors();
    }
  }, [isAuthenticated, admin]);

  // Delete single appointment by ID
  const handleDeleteAppointment = async (id) => {
    snackbar.confirm("Delete this appointment?", async () => {
      try {
        await api.delete(`/api/v1/appointment/delete/${id}`);
        setAppointments((prev) => prev.filter((a) => a._id !== id));
        setSelectedAppointments((prev) => prev.filter((x) => x !== id));
        playDeleteSound();
        snackbar.success("Appointment deleted");
      } catch (err) {
        snackbar.error("Delete failed");
      }
    });
  };

  // Bulk delete selected appointments
  const handleBulkDelete = async () => {
    if (selectedAppointments.length === 0) {
      return snackbar.info("No appointments selected");
    }
    snackbar.confirm(
      `Delete ${selectedAppointments.length} appointments?`,
      async () => {
        try {
          await api.post(`/api/v1/appointment/bulk-delete`, {
            ids: selectedAppointments,
          });
          setAppointments((prev) =>
            prev.filter((a) => !selectedAppointments.includes(a._id)),
          );
          setSelectedAppointments([]);
          playDeleteSound();
          snackbar.success("Bulk delete complete");
        } catch (err) {
          snackbar.error("Bulk delete failed");
        }
      },
    );
  };

  // Toggle select for bulk delete
  const toggleSelectAppointment = (id) => {
    setSelectedAppointments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      // Let backend enforce rules. When requesting Completed, backend will ensure paymentStatus is Paid.
      // If requesting Completed from UI, include paymentStatus: 'Paid' so harmonizeStatusPayment accepts Completed
      const body =
        status === "Completed" ? { status, paymentStatus: "Paid" } : { status };
      const { data } = await api.put(
        `/api/v1/appointment/status/${appointmentId}`,
        body,
      );
      const updatedAppt = data.appointment || null;
      if (updatedAppt) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === appointmentId ? updatedAppt : a)),
        );
      }
      playSaveSound();
      snackbar.success(data.message || "Status updated");
    } catch (error) {
      snackbar.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const [invoicesList, setInvoicesList] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);

  const handleInvoiceClick = async (appointmentId) => {
    try {
      const { data } = await api.get(
        `/api/v1/invoice/appointment/${appointmentId}`,
      );
      let invoices = [];
      if (Array.isArray(data.invoices)) {
        invoices = data.invoices;
      } else if (Array.isArray(data.invoice)) {
        invoices = data.invoice;
      } else if (data.invoices) {
        invoices = [data.invoices];
      } else if (data.invoice) {
        invoices = [data.invoice];
      } else if (Array.isArray(data)) {
        invoices = data;
      } else if (data && data._id) {
        invoices = [data];
      }

      if (!invoices || invoices.length === 0) {
        snackbar.info("No invoice found for this appointment");
        return;
      }

      const inv = invoices[0];
      const printUrl = `/api/v1/invoice/${inv._id || inv.id}/download`;

      const resp = await api.get(printUrl);
      const htmlContent = typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data);

      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.write(`<script>window.onload = function() { window.print(); };</script>`);
      frameDoc.close();

      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    } catch (e) {
      snackbar.error("Failed to print invoice for appointment");
    }
  };

  const handlePrescriptionClick = async (patientId, appointmentId = null) => {
    const rawPid = patientId?._id || patientId;
    setSelectedPatientId(rawPid);
    setSelectedAppointmentId(appointmentId);
    // Fetch patient data
    try {
      const { data } = await api.get(`/api/v1/user/patient/${rawPid}`);
      setSelectedPatientData(data.patient);
      setPrescriptionModalOpen(true);
    } catch (error) {
      setSelectedPatientData(null);
      snackbar.error("Failed to fetch patient data");
    }
  };

  const closePrescriptionModal = () => {
    setPrescriptionModalOpen(false);
    setSelectedPatientId(null);
    setSelectedPatientData(null);
    setSelectedAppointmentId(null);
    fetchAppointments();
  };

  const handleRescheduleClick = (appointment) => {
    setSelectedAppointmentToReschedule(appointment);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleConfirm = async (appointmentId, newDate) => {
    setIsRescheduling(true);
    try {
      const response = await rescheduleAppointment(appointmentId, newDate);
      snackbar.success("Appointment rescheduled successfully!");
      setRescheduleModalOpen(false);
      setSelectedAppointmentToReschedule(null);
      // Refresh appointments list
      const fetchAppointments = async () => {
        try {
          const { data } = await api.get("/api/v1/appointment/getall");
          setAppointments(data.appointments);
        } catch (error) {
          console.error("Error fetching appointments:", error);
        }
      };
      fetchAppointments();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      const errorMessage = error?.message || "Failed to reschedule appointment";
      snackbar.error(errorMessage);
    } finally {
      setIsRescheduling(false);
    }
  };

  const closeRescheduleModal = () => {
    setRescheduleModalOpen(false);
    setSelectedAppointmentToReschedule(null);
  };

  useEffect(() => {
    let filtered = (appointments || []).filter((appointment) => {
      try {
        // Filter by selected doctor
        if (selectedDoctorId && appointment.doctorId !== selectedDoctorId) {
          return false;
        }

        const apptDate = new Date(appointment.appointment_date);
        const apptYmd = apptDate.toLocaleDateString("en-CA");
        const today = new Date();
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        const todayYmd = startOfToday.toLocaleDateString("en-CA");

        // Filter by dropdown
        if (filterOption === "Today" && apptYmd !== todayYmd) return false;
        if (filterOption === "Old" && apptYmd >= todayYmd) return false;
        if (filterOption === "Upcoming" && apptYmd <= todayYmd) return false;
        if (filterOption === "Custom" && customStart && customEnd) {
          const start = new Date(customStart + "T00:00:00");
          const end = new Date(customEnd + "T23:59:59");
          if (apptDate < start || apptDate > end) return false;
        }

        // Filter by prescribed status (Completed = Prescribed, otherwise Non Prescribed)
        if (filterPrescibed !== "All") {
          const isPrescribed = appointment.status === "Completed";
          if (filterPrescibed === "Prescribed" && !isPrescribed) {
            return false;
          }
          if (filterPrescibed === "Unprescribed" && isPrescribed) {
            return false;
          }
        }

        // Search term across name, phone, date and invoice number
        if (searchTerm && searchTerm.trim() !== "") {
          const q = searchTerm.toLowerCase().trim();
          const name = (
            appointment.name ||
            `${appointment.firstName || ""} ${appointment.lastName || ""}`
          ).toLowerCase();
          const phone = (
            appointment.phone ||
            appointment.mobile ||
            appointment.patientPhone ||
            ""
          )
            .toString()
            .toLowerCase();
          const dateStr = (appointment.appointment_date || "")
            .toString()
            .toLowerCase();

          let invoiceNums = [];
          if (Array.isArray(appointment.invoices)) {
            appointment.invoices.forEach((inv) => {
              if (typeof inv === "object" && inv !== null) {
                if (inv.invoiceNumber) invoiceNums.push(inv.invoiceNumber.toLowerCase());
                if (inv._id) invoiceNums.push(inv._id.toString().toLowerCase());
              } else if (inv) {
                invoiceNums.push(inv.toString().toLowerCase());
              }
            });
          }
          if (appointment.invoiceNumber) {
            invoiceNums.push(appointment.invoiceNumber.toString().toLowerCase());
          }

          const matchesInvoice = invoiceNums.some((num) => num.includes(q));

          if (!name.includes(q) && !phone.includes(q) && !dateStr.includes(q) && !matchesInvoice) {
            return false;
          }
        }

        return true;
      } catch (err) {
        // If any error occurs during filtering (e.g., invalid date), include the item by default
        return true;
      }
    });

    // After all filters are applied, set the state
    setFilteredAppointments(filtered);
  }, [
    appointments,
    selectedDoctorId,
    searchTerm,
    filterOption,
    customStart,
    customEnd,
    filterPrescibed,
  ]);

  const prescibeFilterChange = (event) => {
    setfilterPrescibed(event.target.value);
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <section className="dashboard page">
        <div className="charts-container dashboard-charts" style={{ marginTop: '0' }}>
          <PieChartCard
            title="Collections Breakdown"
            data={[
              { name: "Paid", value: dashboardTotals.paid || 0 },
              { name: "Due", value: dashboardTotals.due || 0 },
              { name: "Refund", value: dashboardTotals.refund || 0 },
            ]}
          />
          <LineChartCard
            title="Revenue Trend"
            data={dashboardGroups.map((g) => ({
              name: g.period,
              value: g.revenue || 0,
            }))}
          />
          <SimpleBarChart data={dashboardGroups} />
        </div>
        {/* Role-based quick metrics */}
        <div className="dashboard-metrics-container">
          {/* Card 1: Patients Today */}
          <div className="dashboard-metric-card metric-cyan hover-glow">
            <div className="metric-card-top">
              <div className="metric-icon-box cyan">
                <FaUserMd size={20} />
              </div>
              <span className="metric-badge cyan">Today</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-main-value">{metrics.patientsViewedToday}</div>
              <p className="metric-main-title">Patients Today</p>
            </div>
            <div className="metric-card-footer">
              <span className="metric-footer-label">Paid: ₹{fmt(metrics.paidToday)}</span>
              <span className="metric-footer-sub">Due: ₹{fmt(metrics.dueToday)}</span>
            </div>
          </div>

          {/* Card 2: Patients This Month */}
          <div className="dashboard-metric-card metric-purple hover-glow">
            <div className="metric-card-top">
              <div className="metric-icon-box purple">
                <FaUsers size={20} />
              </div>
              <span className="metric-badge purple">This Month</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-main-value">{metrics.patientsThisMonth}</div>
              <p className="metric-main-title">Patients This Month</p>
            </div>
            <div className="metric-card-footer">
              <span className="metric-footer-label">Total Visits</span>
              <span className="metric-footer-sub">{metrics.apptsMonthCount} Appts</span>
            </div>
          </div>

          {/* Card 3: Today's Revenue */}
          <div className="dashboard-metric-card metric-emerald hover-glow">
            <div className="metric-card-top">
              <div className="metric-icon-box emerald">
                <FaWallet size={20} />
              </div>
              <span className="metric-badge emerald">Collections</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-main-value">₹{fmt(metrics.paidToday)}</div>
              <p className="metric-main-title">Today's Revenue</p>
            </div>
            <div className="metric-card-footer">
              <span className="metric-footer-label">Month Total</span>
              <span className="metric-footer-sub">₹{fmt(dashboardTotals.paid || metrics.paidThisMonth)}</span>
            </div>
          </div>

          {/* Card 4: Action / Pending Queue */}
          <div className="dashboard-metric-card metric-amber hover-glow">
            <div className="metric-card-top">
              <div className="metric-icon-box amber">
                <MdSchedule size={20} />
              </div>
              <span className="metric-badge amber">Attention</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-main-value">{metrics.pendingActionCount}</div>
              <p className="metric-main-title">Pending Queue</p>
            </div>
            <div className="metric-card-footer">
              <span className="metric-footer-label">Total Due</span>
              <span className="metric-footer-sub">₹{fmt(dashboardTotals.due !== undefined ? dashboardTotals.due : metrics.dueToday)}</span>
            </div>
          </div>
        </div>

        {/* Reports summary (today/month/total) */}
        <Reports appointments={appointments} showSummary={false} />

        {/* Middle banner / navbar-like filter area */}
        <div className="banner middle-banner">
          <div className="filter-box">
            <select
              name="dateFilter"
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Today">Today</option>
              <option value="Old">Old</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Custom">Custom</option>
            </select>

            {/* Doctor Filter Dropdown */}
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={admin?.role === "Doctor"}
              style={{ background: "#009688" }}
            >
              {admin?.role !== "Doctor" && (
                <option value="">All Doctors</option>
              )}
              {doctorFilterList.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.firstName} {doc.lastName}
                </option>
              ))}
            </select>

            <select
              value={filterPrescibed}
              // onChange={prescibeFilterChange}
              onChange={(e) => setfilterPrescibed(e.target.value)}
              className="prescribed-filter"
            >
              <option value="Prescribed">Prescribed Data</option>
              <option value="Unprescribed">Non Prescribed</option>
              <option value="All">All</option>
            </select>

            {/* <input
                type="text"
                placeholder="Search by doctor name"
                onChange={(e) => setSearchTerm(e.target.value)}
              /> */}

            {filterOption === "Custom" && (
              <div className="custom-dates">
                <input
                  type="date"
                  placeholder="Start date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <input
                  type="date"
                  placeholder="End date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="search-box dashboard-home-search-box">
            <MdOutlineContentPasteSearch size={"1.8rem"} color="grey" />
            <input
              type="text"
              placeholder="Search by name/phone/date/invoice #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="banner table-banner">
          <div className="heading-box">
            <h5>Appointments</h5>
            <div className="btn-box">
              <button
                className="btn"
                onClick={() => navigate("/add-appointment")}
              >
                <FaPrescriptionBottleMedical /> Book Appointment
              </button>
              <button
                ref={setupClickSound}
                className="btn"
                onClick={() => setSlotCheckerOpen(true)}
              >
                <MdSchedule /> View Slots
              </button>
              <RequirePermission allowedRoles={["Admin"]}>
                <button
                  ref={setupClickSound}
                  className="btn btn-danger"
                  onClick={handleBulkDelete}
                  disabled={selectedAppointments.length === 0}
                >
                  <MdOutlineDelete /> Delete ({selectedAppointments.length})
                </button>
              </RequirePermission>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "45px", minWidth: "45px", textAlign: "center" }}>
                    <RequirePermission allowedRoles={["Admin"]}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const filteredAppointments = (
                            appointments || []
                          ).filter((appointment) => {
                            try {
                              const apptDate = new Date(
                                appointment.appointment_date,
                              );
                              const apptYmd =
                                apptDate.toLocaleDateString("en-CA");
                              const today = new Date();
                              const startOfToday = new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                today.getDate(),
                              );
                              const todayYmd =
                                startOfToday.toLocaleDateString("en-CA");

                              // Filter by dropdown
                              if (filterOption === "Today") {
                                if (apptYmd !== todayYmd) return false;
                              } else if (filterOption === "Old") {
                                if (apptYmd >= todayYmd) return false;
                              } else if (filterOption === "Upcoming") {
                                // future (strictly greater than today)
                                if (apptYmd <= todayYmd) return false;
                              } else if (filterOption === "Custom") {
                                if (customStart && customEnd) {
                                  const start = new Date(
                                    customStart + "T00:00:00",
                                  );
                                  const end = new Date(customEnd + "T23:59:59");
                                  if (apptDate < start || apptDate > end)
                                    return false;
                                }
                              }

                              // Search term across name, phone, date and invoice number
                              if (searchTerm && searchTerm.trim() !== "") {
                                const q = searchTerm.toLowerCase().trim();
                                const name = (
                                  appointment.name ||
                                  `${appointment.firstName || ""} ${appointment.lastName || ""
                                  }`
                                ).toLowerCase();
                                const phone = (
                                  appointment.phone ||
                                  appointment.mobile ||
                                  appointment.patientPhone ||
                                  ""
                                )
                                  .toString()
                                  .toLowerCase();
                                const dateStr = (
                                  appointment.appointment_date || ""
                                )
                                  .toString()
                                  .toLowerCase();

                                let invoiceNums = [];
                                if (Array.isArray(appointment.invoices)) {
                                  appointment.invoices.forEach((inv) => {
                                    if (typeof inv === "object" && inv !== null) {
                                      if (inv.invoiceNumber) invoiceNums.push(inv.invoiceNumber.toLowerCase());
                                      if (inv._id) invoiceNums.push(inv._id.toString().toLowerCase());
                                    } else if (inv) {
                                      invoiceNums.push(inv.toString().toLowerCase());
                                    }
                                  });
                                }
                                if (appointment.invoiceNumber) {
                                  invoiceNums.push(appointment.invoiceNumber.toString().toLowerCase());
                                }

                                const matchesInvoice = invoiceNums.some((num) => num.includes(q));

                                if (
                                  !name.includes(q) &&
                                  !phone.includes(q) &&
                                  !dateStr.includes(q) &&
                                  !matchesInvoice
                                ) {
                                  return false;
                                }
                              }
                              return true;
                            } catch (err) {
                              return true;
                            }
                          });
                          setSelectedAppointments(
                            e.target.checked
                              ? filteredAppointments.map((a) => a._id)
                              : [],
                          );
                        }}
                      />
                    </RequirePermission>
                  </th>
                  <th style={{ textAlign: "left" }}>Name</th>
                  <th style={{ width: "130px", minWidth: "110px", textAlign: "center", position: "relative" }}>
                    Date
                    <button
                      ref={setupClickSound}
                      className="expand-btn icon-btn"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {/* <RiExpandHorizontalSFill /> */}
                      <RiExpandVerticalLine />
                    </button>
                  </th>
                  <th style={{ width: "110px", textAlign: "center" }}>Type</th>
                  {/* <th>Created By</th> */}
                  {isExpanded && <th style={{ textAlign: "center" }}>Phone</th>}
                  {isExpanded && <th style={{ textAlign: "center" }}>Gender</th>}
                  {/* <th>Payment Mode</th> */}
                  {/* <th>Fees Amount</th> */}
                  {isExpanded && <th style={{ textAlign: "center" }}>Payment Status</th>}
                  {isExpanded && <th style={{ textAlign: "center" }}>Status</th>}
                  <RequirePermission allowedRoles={["Admin"]}>
                    {isExpanded && <th style={{ textAlign: "left" }}>Doctor</th>}
                    {isExpanded && <th style={{ textAlign: "left" }}>Department</th>}
                  </RequirePermission>
                  {isExpanded && <th style={{ textAlign: "center" }}>Visited Before</th>}
                  {isExpanded && <th style={{ textAlign: "left" }}>Booked By</th>}
                  <th style={{ width: "140px", textAlign: "center" }}>Prescription</th>
                  <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments && filteredAppointments.length > 0 ? (
                  // <div>
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td style={{ width: "45px", minWidth: "45px", textAlign: "center" }}>
                        <RequirePermission allowedRoles={["Admin"]}>
                          <input
                            type="checkbox"
                            checked={selectedAppointments.includes(
                              appointment._id,
                            )}
                            onChange={() =>
                              toggleSelectAppointment(appointment._id)
                            }
                          />
                        </RequirePermission>
                      </td>
                      <td style={{ textAlign: "left", fontWeight: 500 }}>
                        {appointment.name ||
                          `${appointment.firstName} ${appointment.lastName}`}
                      </td>
                      <td style={{ textAlign: "center" }}>{appointment.appointment_date.substring(0, 10)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`appt-type-badge ${
                          (appointment.appointmentType || "OPD").toLowerCase().replace(/[^a-z0-9]/g, "-")
                        }`}>
                          {appointment.appointmentType || "OPD"}
                        </span>
                      </td>
                      {/* <td>{appointment?.booked_by || "You"}</td> */}
                      {isExpanded && (
                        <td style={{ textAlign: "center" }}>{appointment.phone || appointment.mobile}</td>
                      )}
                      {isExpanded && <td style={{ textAlign: "center" }}>{appointment.gender}</td>}
                      {/* <td>{appointment.paymentMode || "Cash"}</td> */}
                      {/* <td>{appointment.price || appointment.feesAmount || "0"}</td> */}
                      {isExpanded && (
                        <td style={{ minWidth: "6.5rem" }}>
                          {(() => {
                            const currentPayment = appointment.paymentStatus || "Pending";
                            const rawStatus = appointment.status || "Pending";
                            const currentStatus = rawStatus === "Rejected" ? "Canceled" : rawStatus;

                            const isCanceled = currentStatus === "Canceled" || currentStatus === "Cancelled";
                            const isCompleted = currentStatus === "Completed";
                            const isRefunded = currentPayment === "Refund";
                            const isPaid = currentPayment === "Paid";
                            const isPendingPayment = currentPayment === "Pending";

                            const isPaymentDisabled = isRefunded || isCanceled || isCompleted;

                            return (
                              <select
                                value={currentPayment}
                                onChange={(e) =>
                                  handleUpdatePaymentStatus(
                                    appointment._id,
                                    e.target.value,
                                  )
                                }
                                disabled={isPaymentDisabled}
                                className={
                                  currentPayment === "Pending"
                                    ? "value-rejected"
                                    : currentPayment === "Refund"
                                      ? "value-refund"
                                      : "value-completed"
                                }
                                style={{
                                  fontSize: "0.875rem",
                                  cursor: isPaymentDisabled ? "not-allowed" : "pointer",
                                }}
                              >
                                <option value="Pending" className="value-rejected" disabled={isPaid}>
                                  Pending
                                </option>
                                <option value="Paid" className="value-completed">
                                  Paid
                                </option>
                                <option value="Refund" className="value-refund" disabled={isPendingPayment || isCompleted}>
                                  Refund
                                </option>
                              </select>
                            );
                          })()}
                        </td>
                      )}
                      {isExpanded && (
                        <td style={{ minWidth: "8rem" }}>
                          {(() => {
                            const currentPayment = appointment.paymentStatus || "Pending";
                            const rawStatus = appointment.status || "Pending";
                            const currentStatus = rawStatus === "Rejected" ? "Canceled" : rawStatus;

                            const isCanceled = currentStatus === "Canceled" || currentStatus === "Cancelled";
                            const isCompleted = currentStatus === "Completed";
                            const isRefunded = currentPayment === "Refund";
                            const isPaid = currentPayment === "Paid";

                            const isStatusDisabled = isCanceled || isCompleted || isRefunded;

                            return (
                              <select
                                name="status"
                                disabled={isStatusDisabled}
                                className={
                                  currentStatus === "Pending"
                                    ? "value-pending"
                                    : currentStatus === "Accepted"
                                      ? "value-accepted"
                                      : currentStatus === "Completed"
                                        ? "value-completed"
                                        : "value-canceled"
                                }
                                value={currentStatus}
                                onChange={(e) =>
                                  handleUpdateStatus(
                                    appointment._id,
                                    e.target.value,
                                  )
                                }
                                style={{
                                  fontSize: "0.875rem",
                                  cursor: isStatusDisabled ? "not-allowed" : "pointer",
                                }}
                              >
                                <option value="Pending" className="value-pending" disabled={isPaid}>
                                  Pending
                                </option>
                                <option value="Accepted" className="value-accepted">
                                  Accepted
                                </option>
                                <option value="Canceled" className="value-canceled" disabled={isPaid}>
                                  Canceled
                                </option>
                                <option
                                  value="Completed"
                                  className="value-completed"
                                  disabled={!isPaid}
                                >
                                  Completed
                                </option>
                              </select>
                            );
                          })()}
                        </td>
                      )}
                      <RequirePermission allowedRoles={["Admin"]}>
                        {isExpanded && (
                          <td>{`${appointment.doctor.firstName} ${appointment.doctor.lastName}`}</td>
                        )}
                        {isExpanded && <td>{appointment.department}</td>}
                      </RequirePermission>
                      {isExpanded && (
                        <td>
                          {appointment.hasVisited === true ? (
                            <GoCheckCircleFill className="green" />
                          ) : (
                            <AiFillCloseCircle className="red" />
                          )}
                        </td>
                      )}
                      {isExpanded && (
                        <td>
                          {appointment.book_by_name
                            ? appointment.book_by_name
                            : appointment.patientId || "-"}
                        </td>
                      )}
                      <td>
                        <RequirePermission allowedRoles={["Admin", "Doctor"]}>
                          <button
                            className="btn btn-primary prescribe-btn"
                            onClick={() =>
                              handlePrescriptionClick(
                                appointment.patientId?._id || appointment.patientId,
                                appointment._id
                              )
                            }
                          >
                            Prescription
                          </button>
                        </RequirePermission>
                      </td>
                      <td>
                        <RadialMenu>
                          {/* TODO:functionalities need to be implemented */}
                          <button
                            ref={setupClickSound}
                            className="icon-btn"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#0859afff",
                              cursor: "pointer",
                            }}
                            onClick={() => handleRescheduleClick(appointment)}
                            title="Reschedule"
                          >
                            <RiCalendarScheduleFill />
                          </button>
                          <button
                            ref={setupClickSound}
                            className="icon-btn"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#5bbe8eff",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(`/preview/${appointment.patientId}`)
                            }
                          >
                            <FaEye title="View prescription" />
                          </button>
                          {/* Download saved prescription PDFs */}
                          <button
                            ref={setupClickSound}
                            className="icon-btn"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#e74c4c",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              const pid = appointment.patientId?._id || appointment.patientId;
                              const pname = appointment.firstName
                                ? `${appointment.firstName} ${appointment.lastName || ""}`.trim()
                                : "Patient";
                              setDownloadPrescriptionPatient({ patientId: pid, name: pname });
                            }}
                            title="Download saved prescription PDFs"
                          >
                            <FaFilePdf />
                          </button>
                          <button
                            ref={setupClickSound}
                            className="icon-btn"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#760692ff",
                              cursor: "pointer",
                            }}
                            onClick={() => handleInvoiceClick(appointment._id)}
                          >
                            <IoReceipt title="Invoice" />
                          </button>
                          <button
                            ref={setupClickSound}
                            className="icon-btn"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#686868",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(`/referral/${appointment._id}`)
                            }
                          >
                            <IoIosShareAlt title="Referral" />
                          </button>
                          <RequirePermission allowedRoles={["Admin"]}>
                            <button
                              ref={setupClickSound}
                              className="icon-btn"
                              onClick={() =>
                                handleDeleteAppointment(appointment._id)
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "#b10c0c",
                                cursor: "pointer",
                              }}
                            >
                              <FaTrash title="Delete" />
                            </button>
                          </RequirePermission>
                        </RadialMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="100%"
                      style={{ textAlign: "center", padding: "3rem 1.5rem" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: "#64748b" }}>
                        <RiCalendarScheduleFill size={44} style={{ color: "#94a3b8" }} />
                        <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#334155" }}>
                          No Appointments Found
                        </span>
                        <span style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: "340px" }}>
                          No appointments match the current filter or search criteria.
                        </span>
                        {(filterOption !== "Today" || searchTerm || selectedDoctorId) && (
                          <button
                            className="btn btn-secondary"
                            style={{ marginTop: "0.5rem", padding: "6px 16px", fontSize: "0.85rem", cursor: "pointer" }}
                            onClick={() => {
                              setFilterOption("Today");
                              setSearchTerm("");
                              if (admin?.role === "Admin") setSelectedDoctorId("");
                            }}
                          >
                            Reset Filters to Today
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>



          {/* Prescription modal - only for prescription */}
          <Modal
            isOpen={prescriptionModalOpen}
            onRequestClose={closePrescriptionModal}
            contentLabel="Prescription Modal"
            ariaHideApp={false}
            className="prescription-modal-container"
            overlayClassName="prescription-modal-overlay"
            style={{
              overlay: {
                zIndex: 9999,
              },
            }}
          >
            <Prescription
              patientId={selectedPatientId}
              patientData={selectedPatientData}
              appointmentId={selectedAppointmentId}
              onClose={closePrescriptionModal}
            />
          </Modal>

          {/* Reschedule modal */}
          {selectedAppointmentToReschedule && (
            <RescheduleModal
              isOpen={rescheduleModalOpen}
              onClose={closeRescheduleModal}
              appointment={selectedAppointmentToReschedule}
              onSave={handleRescheduleConfirm}
              isLoading={isRescheduling}
            />
          )}

          {/* Slot Checker Modal */}
          <DashboardSlotChecker
            isOpen={slotCheckerOpen}
            onClose={() => setSlotCheckerOpen(false)}
          />

          {/* Download Prescription PDFs Modal */}
          {downloadPrescriptionPatient && (
            <DownloadPrescriptionModal
              patientId={downloadPrescriptionPatient.patientId}
              patientName={downloadPrescriptionPatient.name}
              onClose={() => setDownloadPrescriptionPatient(null)}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default Dashboard;
