import React, { useState, useEffect, useContext, useMemo } from "react";
import CountUp from "react-countup";
import { useSelector } from "react-redux";
import api from "../utils/api";
import "./ReportsPage.css";
import ReportRow from "./ReportRow";
import "./InvoiceEditor.css";
import {
  FaEye,
  FaSearch,
  FaTimes,
  FaFileMedical,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaUsers,
  FaCalendarCheck,
  FaFileInvoice,
  FaUserMd,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";
import SimpleBarChart from "./SimpleBarChart";
import PieChartCard from "./PieChartCard";
import LineChartCard from "./LineChartCard";
import "./ChartCards.css";
import ToggleSwitch from "./ToggleSwitch";
import { useSnackbar } from "../context/SnackbarContext";
import {
  BsDownload,
  BsFileExcel,
  BsHeartPulse,
  BsReceiptCutoff,
  BsBarChartFill,
  BsCashCoin,
  BsCardChecklist,
} from "react-icons/bs";
import { IoRefresh } from "react-icons/io5";
import { LuFilterX } from "react-icons/lu";
import useClickSound from "../hooks/useClickSound";
import { playSettledSound } from "../utils/soundUtils";
import { formatAppointmentId, formatPatientId } from "../utils/idUtils";
import DownloadPrescriptionModal from "./DownloadPrescriptionModal";
import { FaFilePdf, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { generateFullReceiptHtml } from "../utils/generalSettingsUtil";

const fmt = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const ReportsPage = () => {
  const snackbar = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState(() => sessionStorage.getItem("reports_start") || "");
  const [end, setEnd] = useState(() => sessionStorage.getItem("reports_end") || "");
  const [groupBy, setGroupBy] = useState(() => sessionStorage.getItem("reports_groupBy") || "day");
  const [doctorId, setDoctorId] = useState(() => sessionStorage.getItem("reports_doctorId") || "");
  const [doctors, setDoctors] = useState([]);
  const [dashboardUser, setDashboardUser] = useState(null);
  const [includeAppointments, setIncludeAppointments] = useState(true);

  const [totals, setTotals] = useState({ paid: 0, totalDue: 0, invoiced: 0 });
  const [groups, setGroups] = useState([]);
  const [downloadPrescriptionPatient, setDownloadPrescriptionPatient] = useState(null);

  // Default to Persisted View as main view
  const [usePersisted, setUsePersisted] = useState(() => {
    const saved = sessionStorage.getItem("reports_usePersisted");
    return saved !== null ? saved === "true" : true;
  });

  // Persisted Sub-Tab: "all" or "refunded"
  const [persistedSubTab, setPersistedSubTab] = useState(() => {
    return sessionStorage.getItem("reports_persistedSubTab") || "all";
  });

  // Summary View Payment Status filter: "all", "paid", "due"
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");

  const [reportEntries, setReportEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem("reports_searchTerm") || "");

  useEffect(() => {
    sessionStorage.setItem("reports_start", start);
    sessionStorage.setItem("reports_end", end);
    sessionStorage.setItem("reports_groupBy", groupBy);
    sessionStorage.setItem("reports_doctorId", doctorId);
    sessionStorage.setItem("reports_searchTerm", searchTerm);
    sessionStorage.setItem("reports_usePersisted", String(usePersisted));
    sessionStorage.setItem("reports_persistedSubTab", persistedSubTab);
  }, [start, end, groupBy, doctorId, searchTerm, usePersisted, persistedSubTab]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerAppointmentId, setDrawerAppointmentId] = useState(null);
  const [drawerInfo, setDrawerInfo] = useState(null);
  const [invoicesForAppointment, setInvoicesForAppointment] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [reportTotal, setReportTotal] = useState(0);
  const [patientsThisMonth, setPatientsThisMonth] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);

  const setupClickSound = useClickSound();

  useEffect(() => {
    (async () => {
      try {
        const { data: userRes } = await api.get("/api/v1/user/dashboard/me");
        setDashboardUser(userRes.user);
      } catch (e) {
        setDashboardUser(null);
      }
    })();
    (async () => {
      try {
        const { data } = await api.get("/api/v1/user/patients");
        setTotalPatients(data.count);
      } catch (e) {
        console.error("Failed to fetch total patients", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/v1/user/doctors");
        let allDoctors = data.doctors || [];
        if (dashboardUser) {
          if (dashboardUser.role === "Doctor") {
            allDoctors = allDoctors.filter(
              (doc) => doc._id === dashboardUser._id
            );
            setDoctorId(dashboardUser._id);
          } else if (dashboardUser.role === "Compounder") {
            const assignedIds = (dashboardUser.assignedDoctors || []).map(
              (d) => (d._id ? d._id.toString() : d.toString())
            );
            allDoctors = allDoctors.filter((doc) =>
              assignedIds.includes(doc._id ? doc._id.toString() : doc.toString())
            );
            if (allDoctors.length > 0) setDoctorId(allDoctors[0]._id);
          }
        }
        setDoctors(allDoctors);
      } catch (e) {
        setDoctors([]);
      }
    })();
  }, [dashboardUser]);

  const fetchSummary = async (opts = {}) => {
    setLoading(true);
    try {
      const s = opts.start !== undefined ? opts.start : start;
      const e = opts.end !== undefined ? opts.end : end;
      const grp = opts.groupBy !== undefined ? opts.groupBy : groupBy;
      const doc = opts.doctorId !== undefined ? opts.doctorId : doctorId;
      const querySearch = opts.q !== undefined ? opts.q : searchTerm;
      const activeTab = opts.subTab !== undefined ? opts.subTab : persistedSubTab;
      const pg = opts.page !== undefined ? opts.page : reportPage;

      // 1. Fetch Summary Statistics & Analytics Groups
      try {
        const summaryRes = await api.get("/api/v1/reports/summary", {
          params: {
            start: s,
            end: e,
            groupBy: grp,
            doctorId: doc,
          },
        });
        if (summaryRes.data) {
          const rev = Number(summaryRes.data.totals?.revenue || 0);
          const due = Number(summaryRes.data.totals?.due || 0);
          setTotals({
            paid: rev,
            totalDue: due,
            invoiced: rev + due,
          });
          setGroups(summaryRes.data.byPeriod || []);
        }
      } catch (err) {
        console.warn("Reports summary fetch error:", err);
      }

      // 2. Fetch Persisted Detailed Report Entries
      try {
        const reportsRes = await api.get("/api/v1/reports", {
          params: {
            start: s,
            end: e,
            doctorId: doc,
            q: querySearch,
            status: activeTab === "refunded" ? "Refund" : undefined,
            page: pg,
            limit: 50,
          },
        });
        if (reportsRes.data) {
          setReportEntries(reportsRes.data.entries || []);
          setReportTotal(
            reportsRes.data.total !== undefined
              ? reportsRes.data.total
              : reportsRes.data.entries ? reportsRes.data.entries.length : 0
          );
        }
      } catch (err) {
        console.warn("Reports list fetch error:", err);
      }

      // 3. Fetch Appointments for count metrics
      try {
        const apptRes = await api.get("/api/v1/appointment/getall");
        if (apptRes.data && apptRes.data.appointments) {
          const allAppts = apptRes.data.appointments;
          setTotalAppointments(allAppts.length);
          const now = new Date();
          const thisMonthAppts = allAppts.filter((a) => {
            const d = new Date(a.appointment_date || a.createdAt);
            return (
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear()
            );
          });
          setPatientsThisMonth(thisMonthAppts.length);
        }
      } catch (err) {
        console.warn("Appointments fetch error:", err);
      }
    } catch (e) {
      console.error("Failed to load reports summary:", e);
      snackbar.error("Failed to load reports summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [start, end, groupBy, doctorId, includeAppointments, persistedSubTab, reportPage]);

  const onSearchKey = (e) => {
    if (e.key === "Enter") {
      setReportPage(1);
      fetchSummary({ q: searchTerm, page: 1 });
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setReportPage(1);
    fetchSummary({ q: "", page: 1 });
  };

  // Filter groups in Summary View according to paymentTypeFilter ("all", "paid", "due")
  const filteredSummaryGroups = useMemo(() => {
    if (!groups) return [];
    if (paymentTypeFilter === "all") return groups;
    if (paymentTypeFilter === "paid") {
      return groups.filter((g) => (g.revenue || g.totalEarning || 0) > 0);
    }
    if (paymentTypeFilter === "due") {
      return groups.filter((g) => (g.due || g.totalDue || 0) > 0);
    }
    return groups;
  }, [groups, paymentTypeFilter]);

  const openInvoiceDrawer = async (appointmentId, record = null) => {
    setDrawerAppointmentId(appointmentId);
    setDrawerInfo(record);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setSelectedInvoice(null);
    try {
      const res = await api.get(`/api/v1/invoice/appointment/${appointmentId}`);
      setInvoicesForAppointment(res.data.invoices || []);
      if (res.data.invoices && res.data.invoices.length > 0) {
        setSelectedInvoice(res.data.invoices[0]);
      }
    } catch (e) {
      snackbar.error("Failed to load invoices for appointment");
      setInvoicesForAppointment([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeInvoiceDrawer = () => {
    setDrawerOpen(false);
    setDrawerAppointmentId(null);
    setDrawerInfo(null);
    setInvoicesForAppointment([]);
    setSelectedInvoice(null);
  };

  const saveInvoice = async (inv) => {
    setInvoiceSaving(true);
    try {
      const payload = {
        appointmentId: inv.appointmentId,
        patientId: inv.patientId,
        doctorId: inv.doctorId,
        doctorFee: inv.doctorFee,
        medicines: inv.medicines,
        total: inv.total,
        status: inv.status,
        discount: inv.discount,
        tax: inv.tax,
        paid: inv.paid,
        notes: inv.notes,
        paymentStatus: inv.paymentStatus,
      };
      if (inv._id) {
        await api.put(`/api/v1/invoice/${inv._id}`, payload);
      } else {
        await api.post(`/api/v1/invoice`, payload);
      }
      const refreshed = await api.get(
        `/api/v1/invoice/appointment/${drawerAppointmentId}`
      );
      setInvoicesForAppointment(refreshed.data.invoices || []);
      fetchSummary();
      snackbar.success("Invoice updated");
    } catch (e) {
      snackbar.error("Failed to save invoice");
    } finally {
      setInvoiceSaving(false);
    }
  };

  const deleteInvoice = async (id) => {
    if (!window.confirm("Delete invoice? This cannot be undone.")) return;
    try {
      await api.delete(`/api/v1/invoice/${id}`);
      const refreshed = await api.get(
        `/api/v1/invoice/appointment/${drawerAppointmentId}`
      );
      setInvoicesForAppointment(refreshed.data.invoices || []);
      fetchSummary();
      snackbar.success("Invoice deleted");
    } catch (e) {
      snackbar.error("Failed to delete invoice");
    }
  };

  const settleInvoice = async (inv) => {
    try {
      await api.post(`/api/v1/invoice/${inv._id}/settle`);
      const refreshed = await api.get(
        `/api/v1/invoice/appointment/${drawerAppointmentId}`
      );
      setInvoicesForAppointment(refreshed.data.invoices || []);
      playSettledSound();
      fetchSummary();
      snackbar.success("Invoice marked as settled");
    } catch (e) {
      snackbar.error("Failed to settle invoice");
    }
  };

  const generateClientReceiptHtml = async (entry) => {
    const patName =
      entry.appointmentId?.name ||
      (entry.patientId && (entry.patientId.firstName || entry.patientId.name)
        ? `${entry.patientId.firstName || entry.patientId.name} ${entry.patientId.lastName || ""}`.trim()
        : "Patient");
    const docName =
      entry.doctorId && (entry.doctorId.firstName || entry.doctorId.name)
        ? `Dr. ${entry.doctorId.firstName || entry.doctorId.name} ${entry.doctorId.lastName || ""}`.trim()
        : entry.appointmentId?.doctor?.firstName
          ? `Dr. ${entry.appointmentId.doctor.firstName} ${entry.appointmentId.doctor.lastName || ""}`.trim()
          : "Attending Doctor";
    const apptDisplayId = entry.appointmentId?._id
      ? `APT-${String(entry.appointmentId._id).slice(-6).toUpperCase()}`
      : entry.appointmentId
        ? `APT-${String(entry.appointmentId).slice(-6).toUpperCase()}`
        : `RPT-${String(entry._id || "INV").slice(-6).toUpperCase()}`;
    const dateStr = entry.appointmentDate
      ? new Date(entry.appointmentDate).toLocaleString()
      : new Date().toLocaleString();
    const phone = entry.patientId?.phone || entry.appointmentId?.phone || "N/A";
    const status = entry.status || "Paid";
    const amount = Number(entry.amount || entry.paid || 0);

    return await generateFullReceiptHtml({
      receiptNo: apptDisplayId,
      patientName: patName,
      doctorName: docName,
      department: entry.appointmentId?.department || "General",
      dateTime: dateStr,
      phone,
      paymentStatus: status,
      docFee: amount,
      platformFee: 0,
      totalAmount: amount,
      printedByName: "Admin",
    });
  };

  const handleDownloadInvoice = async (entry) => {
    const apptId = entry.appointmentId?._id || entry.appointmentId;
    const invId =
      entry.appointmentId?.invoices?.[0]?._id || entry.appointmentId?.invoices?.[0];
    const targetId = invId || apptId || entry._id;

    if (targetId) {
      try {
        const res = await api.get(`/api/v1/invoice/${targetId}/download`, {
          responseType: "blob",
        });
        if (res.data && res.data.size > 0) {
          const blob = new Blob([res.data], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `receipt-${String(targetId).slice(-6).toUpperCase()}.html`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          snackbar.success("Invoice downloaded successfully");
          return;
        }
      } catch (err) {
        console.warn("Backend receipt download fallback", err);
      }
    }

    try {
      const html = await generateClientReceiptHtml(entry);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${String(targetId || "REC").slice(-6).toUpperCase()}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      snackbar.success("Invoice receipt downloaded");
    } catch (err) {
      snackbar.error("Failed to download invoice");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("Are you sure you want to delete this report entry?")) {
      try {
        await api.delete(`/api/v1/reports/${reportId}`);
        snackbar.success("Report entry deleted successfully");
        fetchSummary();
      } catch (err) {
        snackbar.error("Failed to delete report entry");
      }
    }
  };

  const downloadCSV = () => {
    if (usePersisted) {
      const rows = [
        [
          "Patient ID",
          "Appointment ID",
          "Patient Name",
          "Date",
          "Doctor",
          "Payment Status",
          "Amount",
          "Paid",
          "Due",
        ],
      ];
      reportEntries.forEach((r) => {
        const patId =
          r.appointmentId?.nic ||
          r.patientId?.nic ||
          (r.patientId?._id
            ? `P-${String(r.patientId._id).slice(-5).toUpperCase()}`
            : "-");
        const apptId = r.appointmentId?._id
          ? `APT-${String(r.appointmentId._id).slice(-6).toUpperCase()}`
          : r.appointmentId || "-";
        const patName =
          r.appointmentId?.name ||
          (r.patientId && (r.patientId.firstName || r.patientId.name)
            ? `${r.patientId.firstName || r.patientId.name} ${r.patientId.lastName || ""}`.trim()
            : "") ||
          "N/A";
        const dateStr = r.appointmentDate ? String(r.appointmentDate).slice(0, 10) : "";
        const docName =
          r.doctorId && (r.doctorId.firstName || r.doctorId.name)
            ? `Dr. ${r.doctorId.firstName || r.doctorId.name} ${r.doctorId.lastName || ""}`.trim()
            : r.appointmentId?.doctor?.firstName
              ? `Dr. ${r.appointmentId.doctor.firstName} ${r.appointmentId.doctor.lastName || ""}`.trim()
              : "N/A";

        rows.push([
          patId,
          apptId,
          patName,
          dateStr,
          docName,
          r.status || "Due",
          r.amount || 0,
          r.paid || r.revenue || 0,
          r.due || 0,
        ]);
      });
      const csv = rows
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reports-${persistedSubTab}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    const rows = [["Period", "Paid", "Due", "Invoiced", "Count"]];
    filteredSummaryGroups.forEach((g) => {
      const paidVal = g.revenue || g.totalEarning || 0;
      const dueVal = g.due || g.totalDue || 0;
      const countVal = g.count || g.invoices || g.appointments || 0;
      rows.push([g.period, paidVal, dueVal, Number(paidVal) + Number(dueVal), countVal]);
    });
    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleClearAllFilters = () => {
    const defaultDoc =
      dashboardUser && dashboardUser.role === "Doctor" ? dashboardUser._id : "";
    setStart("");
    setEnd("");
    setDoctorId(defaultDoc);
    setSearchTerm("");
    setGroupBy("day");
    setPaymentTypeFilter("all");
    setReportPage(1);
    sessionStorage.removeItem("reports_start");
    sessionStorage.removeItem("reports_end");
    sessionStorage.removeItem("reports_doctorId");
    sessionStorage.removeItem("reports_searchTerm");
    sessionStorage.removeItem("reports_groupBy");
    sessionStorage.removeItem("reports_persistedSubTab");
    fetchSummary({
      start: "",
      end: "",
      doctorId: defaultDoc,
      q: "",
      page: 1,
      groupBy: "day",
    });
    snackbar.info("Filters reset successfully");
  };

  const totalPages = Math.ceil(reportTotal / 50) || 1;

  return (
    <>
      <section className="reports-page page">
        <div className="rpt-page-container">
          {/* Modern Themed Top Toolbar */}
          <div className="rpt-page-top-bar">
            <div className="rpt-page-top-bar-left">
              <div className="rpt-page-icon-wrapper">
                <FaFileInvoiceDollar />
              </div>
              <div className="rpt-page-title-group">
                <h1 className="rpt-page-main-heading">Reports & Billing</h1>
                <span className="rpt-page-breadcrumb">
                  Finance & OPD &rsaquo; Revenue & Billing Records
                </span>
              </div>
            </div>

            <div className="rpt-page-top-bar-right">
              {/* Segmented View Switcher */}
              <div className="rpt-view-segmented-tabs">
                <button
                  ref={setupClickSound}
                  type="button"
                  className={`rpt-view-tab-btn ${usePersisted ? "active" : ""}`}
                  onClick={() => setUsePersisted(true)}
                >
                  <BsCardChecklist />
                  <span>Detailed Reports</span>
                </button>
                <button
                  ref={setupClickSound}
                  type="button"
                  className={`rpt-view-tab-btn ${!usePersisted ? "active" : ""}`}
                  onClick={() => setUsePersisted(false)}
                >
                  <BsBarChartFill />
                  <span>Analytics Summary</span>
                </button>
              </div>

              {/* Action Buttons */}
              <button
                ref={setupClickSound}
                type="button"
                className="rpt-export-btn"
                onClick={downloadCSV}
                title="Export CSV data"
              >
                <BsDownload />
                <span>Export CSV</span>
              </button>

              <button
                ref={setupClickSound}
                type="button"
                className="rpt-refresh-btn"
                onClick={() => fetchSummary({ start, end, groupBy, doctorId })}
                disabled={loading}
                title="Refresh Report Data"
              >
                {loading ? <BsHeartPulse style={{ color: "#ef4444" }} /> : <IoRefresh />}
              </button>
            </div>
          </div>

          {/* Filter Controls & Search Card */}
          <div className="rpt-controls-card">
            {/* Row 1: Date, Doctor, and Quick Filters */}
            <div className="rpt-filters-row">
              <div className="rpt-filter-item">
                <label htmlFor="rpt-start-date">From</label>
                <input
                  id="rpt-start-date"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>

              <div className="rpt-filter-item">
                <label htmlFor="rpt-end-date">To</label>
                <input
                  id="rpt-end-date"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>

              {!usePersisted && (
                <>
                  <div className="rpt-filter-item">
                    <label htmlFor="rpt-group-by">Group</label>
                    <select
                      id="rpt-group-by"
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                    >
                      <option value="day">By Day</option>
                      <option value="week">By Week</option>
                      <option value="month">By Month</option>
                    </select>
                  </div>

                  <div className="rpt-payment-toggles">
                    <button
                      type="button"
                      className={`rpt-payment-toggle-btn ${paymentTypeFilter === "all" ? "active" : ""}`}
                      onClick={() => setPaymentTypeFilter("all")}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={`rpt-payment-toggle-btn ${paymentTypeFilter === "paid" ? "active" : ""}`}
                      onClick={() => setPaymentTypeFilter("paid")}
                    >
                      Paid
                    </button>
                    <button
                      type="button"
                      className={`rpt-payment-toggle-btn ${paymentTypeFilter === "due" ? "active" : ""}`}
                      onClick={() => setPaymentTypeFilter("due")}
                    >
                      Due
                    </button>
                  </div>
                </>
              )}

              <div className="rpt-filter-item">
                <label htmlFor="rpt-doc-select">Doctor</label>
                <select
                  id="rpt-doc-select"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  disabled={dashboardUser && dashboardUser.role === "Doctor"}
                >
                  {dashboardUser && dashboardUser.role === "Admin" && (
                    <option value="">All Doctors</option>
                  )}
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      Dr. {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                ref={setupClickSound}
                type="button"
                className="rpt-clear-filter-btn"
                onClick={handleClearAllFilters}
                title="Clear all filters"
              >
                <LuFilterX style={{ fontSize: "0.95rem", color: "#ef4444" }} />
                <span>Clear Filters</span>
              </button>
            </div>

            {/* Row 2: Search Input */}
            <div className="rpt-search-row">
              <FaSearch className="rpt-search-icon" />
              <input
                type="text"
                placeholder="Search by patient name, doctor, phone, NIC, appointment ID, or invoice #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={onSearchKey}
                className="rpt-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="rpt-search-clear-btn"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
              <button
                ref={setupClickSound}
                type="button"
                className="rpt-search-submit-btn"
                onClick={() => {
                  setReportPage(1);
                  fetchSummary({ q: searchTerm, page: 1 });
                }}
                title="Search records"
              >
                <FaSearch />
              </button>
            </div>
          </div>

          {/* Metric KPI Cards Grid */}
          <div className="rpt-kpi-grid">
            {/* KPI 1: Invoiced Revenue */}
            <div className="rpt-kpi-card">
              <div className="rpt-kpi-icon-wrap revenue">
                <FaMoneyBillWave />
              </div>
              <div className="rpt-kpi-content">
                <p className="rpt-kpi-label">Total Invoiced</p>
                <h3 className="rpt-kpi-value">
                  <CountUp end={totals.invoiced || 0} separator="," prefix="₹" duration={1.5} />
                </h3>
                <div className="rpt-kpi-breakdown-row">
                  <span className="rpt-kpi-sub-pill paid">Paid: ₹{fmt(totals.paid)}</span>
                  <span className="rpt-kpi-sub-pill due">Due: ₹{fmt(totals.totalDue)}</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Total Patients */}
            <div className="rpt-kpi-card">
              <div className="rpt-kpi-icon-wrap patients">
                <FaUsers />
              </div>
              <div className="rpt-kpi-content">
                <p className="rpt-kpi-label">Total Patients</p>
                <h3 className="rpt-kpi-value">
                  <CountUp end={totalPatients || 0} separator="," duration={1.5} />
                </h3>
                <p className="rpt-kpi-subtext">All time registered patients</p>
              </div>
            </div>

            {/* KPI 3: Period Appointments */}
            <div className="rpt-kpi-card">
              <div className="rpt-kpi-icon-wrap appointments">
                <FaCalendarCheck />
              </div>
              <div className="rpt-kpi-content">
                <p className="rpt-kpi-label">Period Consultations</p>
                <h3 className="rpt-kpi-value">
                  <CountUp end={patientsThisMonth || 0} separator="," duration={1.5} />
                </h3>
                <p className="rpt-kpi-subtext">Appointments: {totalAppointments}</p>
              </div>
            </div>

            {/* KPI 4: Transaction Records */}
            <div className="rpt-kpi-card">
              <div className="rpt-kpi-icon-wrap records">
                <FaFileInvoice />
              </div>
              <div className="rpt-kpi-content">
                <p className="rpt-kpi-label">Report Records</p>
                <h3 className="rpt-kpi-value">
                  <CountUp
                    end={usePersisted ? reportTotal : filteredSummaryGroups.length}
                    separator=","
                    duration={1.5}
                  />
                </h3>
                <p className="rpt-kpi-subtext">
                  {usePersisted ? "Total Billed Encounters" : "Periods Grouped"}
                </p>
              </div>
            </div>
          </div>

          {/* Analytics Summary View (Charts) */}
          {!usePersisted && (
            <div className="charts-container">
              <PieChartCard
                title="Collections Breakdown"
                data={[
                  { name: "Paid", value: totals.paid || 0 },
                  { name: "Due", value: totals.totalDue || 0 },
                ]}
              />
              <LineChartCard
                title="Revenue Trend"
                data={filteredSummaryGroups.map((g) => ({
                  name: g.period,
                  value: g.revenue || g.totalEarning || 0,
                }))}
              />
              <SimpleBarChart data={filteredSummaryGroups} />
            </div>
          )}

          {/* Main Table Card */}
          <div className="rpt-table-card">
            {usePersisted ? (
              <>
                {/* Sub-Navigation: All Transactions vs Refunded Appointments */}
                <div className="rpt-table-subnav">
                  <div className="rpt-subnav-btn-group">
                    <button
                      ref={setupClickSound}
                      type="button"
                      className={`rpt-subnav-pill ${persistedSubTab === "all" ? "active" : ""}`}
                      onClick={() => {
                        setPersistedSubTab("all");
                        setReportPage(1);
                        fetchSummary({ subTab: "all", page: 1 });
                      }}
                    >
                      <BsReceiptCutoff />
                      <span>
                        All Transactions {persistedSubTab === "all" ? `(${reportTotal})` : ""}
                      </span>
                    </button>
                    <button
                      ref={setupClickSound}
                      type="button"
                      className={`rpt-subnav-pill refund ${persistedSubTab === "refunded" ? "active" : ""}`}
                      onClick={() => {
                        setPersistedSubTab("refunded");
                        setReportPage(1);
                        fetchSummary({ subTab: "refunded", page: 1 });
                      }}
                    >
                      <BsCashCoin />
                      <span>
                        Refunded Appointments {persistedSubTab === "refunded" ? `(${reportTotal})` : ""}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Table Data */}
                <div className="rpt-table-scroll">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Appointment ID</th>
                        <th>Patient Name</th>
                        <th>Date</th>
                        <th>Doctor</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th style={{ textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportEntries || []).map((r) => {
                        const patId =
                          r.appointmentId?.nic ||
                          r.patientId?.nic ||
                          (r.patientId?._id
                            ? `P-${String(r.patientId._id).slice(-5).toUpperCase()}`
                            : r.appointmentId?._id
                              ? `P-${String(r.appointmentId._id).slice(-5).toUpperCase()}`
                              : "-");
                        const apptDisplayId = r.appointmentId?._id
                          ? `APT-${String(r.appointmentId._id).slice(-6).toUpperCase()}`
                          : r.appointmentId
                            ? `APT-${String(r.appointmentId).slice(-6).toUpperCase()}`
                            : "-";

                        const patName =
                          r.appointmentId?.name ||
                          (r.patientId && (r.patientId.firstName || r.patientId.name)
                            ? `${r.patientId.firstName || r.patientId.name} ${r.patientId.lastName || ""}`.trim()
                            : "") ||
                          (typeof r.patientId === "string" ? r.patientId : "N/A");

                        const docName =
                          r.doctorId && (r.doctorId.firstName || r.doctorId.name)
                            ? `Dr. ${r.doctorId.firstName || r.doctorId.name} ${r.doctorId.lastName || ""}`.trim()
                            : r.appointmentId?.doctor?.firstName
                              ? `Dr. ${r.appointmentId.doctor.firstName} ${r.appointmentId.doctor.lastName || ""}`.trim()
                              : r.doctorId || "N/A";

                        const apptDate = r.appointmentDate
                          ? String(r.appointmentDate).slice(0, 10)
                          : r.appointmentId?.appointment_date
                            ? String(r.appointmentId.appointment_date).slice(0, 10)
                            : "-";

                        const statusStr = r.status || "Due";
                        const isRefund =
                          statusStr === "Refund" || r.appointmentId?.paymentStatus === "Refund";

                        return (
                          <tr key={r._id}>
                            <td className="cell-id-badge">
                              <code>{patId}</code>
                            </td>
                            <td className="cell-id-badge" title={r.appointmentId?._id || r.appointmentId}>
                              <code>{apptDisplayId}</code>
                            </td>
                            <td>
                              <strong>{patName}</strong>
                            </td>
                            <td>{apptDate}</td>
                            <td>{docName}</td>
                            <td>
                              <span
                                className={`reports-status-pill ${
                                  isRefund ? "refund" : statusStr.toLowerCase()
                                }`}
                              >
                                {isRefund ? "Refunded" : statusStr}
                              </span>
                            </td>
                            <td>
                              <span className="reports-amount-val">₹{fmt(r.amount)}</span>
                            </td>
                            <td>
                              <div className="reports-actions-cell">
                                {/* Prescription PDF Modal */}
                                <button
                                  ref={setupClickSound}
                                  type="button"
                                  className="reports-btn-action pdf"
                                  title="Download Saved Prescription PDFs"
                                  onClick={() => {
                                    const pid =
                                      r.patientId?._id ||
                                      r.patientId ||
                                      r.appointmentId?._id ||
                                      r.appointmentId ||
                                      r._id;
                                    const pname =
                                      (r.appointmentId && typeof r.appointmentId === "object"
                                        ? r.appointmentId.name
                                        : null) ||
                                      (r.patientId && typeof r.patientId === "object"
                                        ? r.patientId.name ||
                                          `${r.patientId.firstName || ""} ${r.patientId.lastName || ""}`.trim()
                                        : null) ||
                                      r.name ||
                                      "Patient";
                                    if (pid)
                                      setDownloadPrescriptionPatient({
                                        patientId: pid,
                                        name: pname,
                                        appointment: r.appointmentId || r,
                                      });
                                  }}
                                >
                                  <FaFilePdf />
                                </button>

                                {/* Download Receipt */}
                                <button
                                  ref={setupClickSound}
                                  type="button"
                                  className="reports-btn-action download"
                                  title="Download Invoice / Receipt"
                                  onClick={() => handleDownloadInvoice(r)}
                                >
                                  <BsDownload />
                                </button>

                                {/* View Invoices Drawer */}
                                <button
                                  ref={setupClickSound}
                                  type="button"
                                  className="reports-btn-action view"
                                  title="View Invoices"
                                  onClick={() =>
                                    openInvoiceDrawer(r.appointmentId?._id || r.appointmentId, r)
                                  }
                                >
                                  <FaEye />
                                </button>

                                {/* Delete Report (Admin only) */}
                                {dashboardUser && dashboardUser.role === "Admin" && (
                                  <button
                                    ref={setupClickSound}
                                    type="button"
                                    className="reports-btn-action delete"
                                    title="Delete Report Entry"
                                    onClick={() => handleDeleteReport(r._id)}
                                  >
                                    <MdDelete />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {(!reportEntries || reportEntries.length === 0) && (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              textAlign: "center",
                              padding: "36px 16px",
                              color: "var(--text-muted, #94a3b8)",
                            }}
                          >
                            {persistedSubTab === "refunded"
                              ? "No refunded appointments found."
                              : "No report entries found for the selected criteria."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {reportTotal > 50 && (
                  <div className="reports-pagination">
                    <span className="reports-page-info">
                      Showing Page <strong>{reportPage}</strong> of <strong>{totalPages}</strong> (
                      <strong>{reportTotal}</strong> total entries)
                    </span>

                    <div className="reports-page-buttons">
                      <button
                        ref={setupClickSound}
                        type="button"
                        className="reports-page-btn"
                        disabled={reportPage <= 1}
                        onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                      >
                        <FaChevronLeft />
                        <span>Prev</span>
                      </button>
                      <button
                        ref={setupClickSound}
                        type="button"
                        className="reports-page-btn"
                        disabled={reportPage * 50 >= reportTotal}
                        onClick={() => setReportPage((p) => p + 1)}
                      >
                        <span>Next</span>
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Summary View Table */
              <div className="rpt-table-scroll">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Invoiced Total</th>
                      <th>Transactions Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaryGroups.map((g) => {
                      const paidVal = g.revenue || g.totalEarning || 0;
                      const dueVal = g.due || g.totalDue || 0;
                      const invTotal = Number(paidVal) + Number(dueVal);
                      const countVal = g.count || g.invoices || g.appointments || 0;

                      return (
                        <tr key={g.period}>
                          <td>
                            <strong>{g.period}</strong>
                          </td>
                          <td style={{ color: "#059669", fontWeight: "700" }}>₹{fmt(paidVal)}</td>
                          <td style={{ color: "#dc2626", fontWeight: "700" }}>₹{fmt(dueVal)}</td>
                          <td>
                            <strong className="reports-amount-val">₹{fmt(invTotal)}</strong>
                          </td>
                          <td>{countVal}</td>
                        </tr>
                      );
                    })}

                    {filteredSummaryGroups.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: "center",
                            padding: "36px 16px",
                            color: "var(--text-muted, #94a3b8)",
                          }}
                        >
                          No summary records found for the selected period and filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Breakdown Floating Modal */}
        {drawerOpen && (
          <div className="rpt-invoice-modal-overlay" onClick={closeInvoiceDrawer}>
            <div
              className="rpt-invoice-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rpt-invoice-modal-header">
                <div className="rpt-invoice-modal-title-group">
                  <h3 className="rpt-invoice-modal-title">
                    <FaFileInvoiceDollar />
                    <span>Invoices for Appointment</span>
                  </h3>
                  <span className="rpt-invoice-modal-sub">
                    {drawerInfo
                      ? `APT-${String(drawerAppointmentId).slice(-6).toUpperCase()} • Patient: ${
                          drawerInfo.appointmentId?.name ||
                          (drawerInfo.patientId && typeof drawerInfo.patientId === "object"
                            ? drawerInfo.patientId.name ||
                              `${drawerInfo.patientId.firstName || ""} ${drawerInfo.patientId.lastName || ""}`.trim()
                            : "Patient")
                        }`
                      : `Appointment #${String(drawerAppointmentId).slice(-6).toUpperCase()}`}
                  </span>
                </div>
                <button
                  ref={setupClickSound}
                  type="button"
                  className="rpt-invoice-modal-close-btn"
                  onClick={closeInvoiceDrawer}
                  title="Close Modal"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="rpt-invoice-modal-body">
                {drawerLoading ? (
                  <div className="msg-loading-state" style={{ padding: "32px 16px" }}>
                    <div className="msg-spinner-ring" />
                    <p>Loading invoice records...</p>
                  </div>
                ) : invoicesForAppointment.length > 0 ? (
                  invoicesForAppointment.map((inv) => {
                    const statusStr = inv.status || inv.paymentStatus || "Paid";
                    const isPaid = statusStr.toLowerCase() === "paid";
                    return (
                      <div key={inv._id} className="rpt-invoice-item-card">
                        <div className="rpt-inv-card-header">
                          <span className="rpt-inv-num">
                            Invoice #{String(inv._id).slice(-6).toUpperCase()}
                          </span>
                          <span
                            className={`reports-status-pill ${
                              isPaid ? "paid" : "due"
                            }`}
                          >
                            {statusStr}
                          </span>
                        </div>
                        <div className="rpt-inv-grid">
                          <div className="rpt-inv-field">
                            <span className="rpt-inv-field-label">Total Amount</span>
                            <span className="rpt-inv-field-value">
                              ₹{fmt(inv.total || inv.amount || 0)}
                            </span>
                          </div>
                          <div className="rpt-inv-field">
                            <span className="rpt-inv-field-label">Doctor Fee</span>
                            <span className="rpt-inv-field-value">
                              ₹{fmt(inv.doctorFee || 0)}
                            </span>
                          </div>
                          {inv.discount > 0 && (
                            <div className="rpt-inv-field">
                              <span className="rpt-inv-field-label">Discount</span>
                              <span className="rpt-inv-field-value" style={{ color: "#10b981" }}>
                                - ₹{fmt(inv.discount)}
                              </span>
                            </div>
                          )}
                          {inv.notes && (
                            <div className="rpt-inv-field" style={{ gridColumn: "1 / -1" }}>
                              <span className="rpt-inv-field-label">Notes</span>
                              <span className="rpt-inv-subtext">{inv.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="rpt-inv-actions">
                          {!isPaid && (
                            <button
                              ref={setupClickSound}
                              type="button"
                              className="rpt-inv-btn settle"
                              onClick={() => settleInvoice(inv)}
                            >
                              Settle Invoice
                            </button>
                          )}
                          <button
                            ref={setupClickSound}
                            type="button"
                            className="rpt-inv-btn delete"
                            onClick={() => deleteInvoice(inv._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rpt-invoice-empty-msg">
                    No invoices recorded for this appointment.
                  </div>
                )}
              </div>

              <div className="rpt-invoice-modal-footer">
                <button
                  ref={setupClickSound}
                  type="button"
                  className="rpt-invoice-close-btn"
                  onClick={closeInvoiceDrawer}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Download Prescription PDFs Modal */}
        {downloadPrescriptionPatient && (
          <DownloadPrescriptionModal
            patientId={downloadPrescriptionPatient.patientId}
            patientName={downloadPrescriptionPatient.name}
            onClose={() => setDownloadPrescriptionPatient(null)}
          />
        )}
      </section>
    </>
  );
};

export default ReportsPage;
