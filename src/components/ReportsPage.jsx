import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import api from "../utils/api";
import "./ReportsPage.css";
import ReportRow from "./ReportRow";
import "./InvoiceEditor.css";
import { FaEye, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";
import SimpleBarChart from "./SimpleBarChart";
import PieChartCard from "./PieChartCard";
import LineChartCard from "./LineChartCard";
import "./ChartCards.css";
import ToggleSwitch from "./ToggleSwitch";
import Toolbar from "./Toolbar";
import { useSnackbar } from "../context/SnackbarContext";
import { BsDownload, BsFileExcel, BsHeartPulse } from "react-icons/bs";
import { IoRefresh } from "react-icons/io5";
import useClickSound from "../hooks/useClickSound";
import { playSettledSound } from "../utils/soundUtils";

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
              (doc) => doc._id === dashboardUser._id,
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

      // Prefer invoice stats endpoint for payments
      const q = [];
      if (s) q.push(`start=${encodeURIComponent(s)}`);
      if (e) q.push(`end=${encodeURIComponent(e)}`);
      if (grp) q.push(`group=${encodeURIComponent(grp)}`);
      if (doc) q.push(`doctor=${encodeURIComponent(doc)}`);
      const query = q.length ? `?${q.join("&")}` : "";

      const invRes = await api.get(`/api/v1/invoice/stats${query}`);
      const invData = invRes.data || {};
      const totalEarning = Number(invData.totalEarning || 0);
      const totalDue = Number(invData.totalDue || 0);
      const invGroups = Array.isArray(invData.groups) ? invData.groups : [];

      if (usePersisted) {
        const qparts = [];
        if (s) qparts.push(`start=${encodeURIComponent(s)}`);
        if (e) qparts.push(`end=${encodeURIComponent(e)}`);
        if (doc) qparts.push(`doctorId=${encodeURIComponent(doc)}`);
        if (activeTab === "refunded") {
          qparts.push("status=Refund");
        }
        qparts.push(`page=${pg}`);
        qparts.push(`limit=50`);
        if (querySearch && querySearch.trim()) {
          qparts.push(`q=${encodeURIComponent(querySearch.trim())}`);
        }
        const qstr = qparts.length ? `?${qparts.join("&")}` : "";
        const repRes = await api.get(`/api/v1/reports${qstr}`);
        const body = repRes.data || {};
        setReportTotal(body.total || 0);
        setReportEntries(body.entries || []);

        const totPaid = (body.entries || []).reduce(
          (sum, r) => sum + (Number(r.paid || r.revenue) || 0),
          0,
        );
        const totDue = (body.entries || []).reduce(
          (sum, r) => sum + (Number(r.due) || 0),
          0,
        );
        setTotals({
          paid: totPaid,
          totalDue: totDue,
          invoiced: totPaid + totDue,
        });
      } else {
        if (includeAppointments) {
          const repRes = await api.get(
            `/api/v1/reports/summary${query.replace("group=", "groupBy=")}`,
          );
          const repTotals = repRes.data.totals || { revenue: 0, due: 0 };
          setTotals({
            paid: repTotals.revenue || 0,
            totalDue: repTotals.due || 0,
            invoiced: (repTotals.revenue || 0) + (repTotals.due || 0),
          });
          setGroups(repRes.data.byPeriod || []);
        } else {
          setTotals({
            paid: totalEarning,
            totalDue,
            invoiced: totalEarning + totalDue,
          });
          setGroups(
            invGroups.map((g) => ({
              period: g.period,
              revenue: g.totalEarning,
              due: g.totalDue,
              count: g.count,
            })),
          );
        }
      }

      const apptsRes = await api.get("/api/v1/appointment/getall");
      const appts = apptsRes.data.appointments || [];
      setTotalAppointments(appts.length || 0);

      const now = new Date();
      const sDate = s
        ? new Date(s + "T00:00:00")
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const eDate = e
        ? new Date(e + "T23:59:59")
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const patientSet = new Set();
      appts.forEach((a) => {
        try {
          const d = new Date(a.appointment_date);
          if (d >= sDate && d <= eDate) {
            if (a.patientId) patientSet.add(String(a.patientId));
          }
        } catch (e) {}
      });
      setPatientsThisMonth(patientSet.size);
    } catch (err) {
      snackbar.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [start, end, groupBy, doctorId, usePersisted, persistedSubTab, reportPage]);

  // Invoice drawer
  const openInvoiceDrawer = async (appointmentId) => {
    setDrawerLoading(true);
    setDrawerAppointmentId(appointmentId);
    setDrawerOpen(true);
    try {
      const res = await api.get(`/api/v1/invoice/appointment/${appointmentId}`);
      setInvoicesForAppointment(res.data.invoices || []);
    } catch (e) {
      setInvoicesForAppointment([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerAppointmentId(null);
    setInvoicesForAppointment([]);
    setSelectedInvoice(null);
  };

  const editInvoice = (inv) => {
    setSelectedInvoice({ ...inv });
  };

  const saveInvoice = async () => {
    if (!selectedInvoice || !selectedInvoice._id) return;
    setInvoiceSaving(true);
    try {
      const payload = { ...selectedInvoice };
      delete payload.patient;
      delete payload.doctor;
      delete payload.appointment;
      await api.put(`/api/v1/invoice/${selectedInvoice._id}`, payload);
      const refreshed = await api.get(
        `/api/v1/invoice/appointment/${drawerAppointmentId}`,
      );
      setInvoicesForAppointment(refreshed.data.invoices || []);
      setSelectedInvoice(null);
      if (payload.status === "Paid") {
        playSettledSound();
      }
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
        `/api/v1/invoice/appointment/${drawerAppointmentId}`,
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
        `/api/v1/invoice/appointment/${drawerAppointmentId}`,
      );
      setInvoicesForAppointment(refreshed.data.invoices || []);
      playSettledSound();
      fetchSummary();
      snackbar.success("Invoice marked as settled");
    } catch (e) {
      snackbar.error("Failed to settle invoice");
    }
  };

  // Download Invoice / Receipt for an appointment or invoice
  const handleDownloadInvoice = async (entry) => {
    try {
      const apptId = entry.appointmentId?._id || entry.appointmentId;
      const invId = entry.appointmentId?.invoices?.[0]?._id || entry.appointmentId?.invoices?.[0];
      const targetId = invId || apptId;
      if (!targetId) {
        snackbar.error("No record found to download invoice");
        return;
      }
      const res = await api.get(`/api/v1/invoice/${targetId}/download`, {
        responseType: "blob",
      });
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
    } catch (err) {
      snackbar.error("Failed to download invoice");
    }
  };

  // Delete report entry (Admin only)
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
        const patId = r.patientId?.nic || (r.patientId?._id ? `P-${String(r.patientId._id).slice(-5).toUpperCase()}` : (r.appointmentId?.nic || "-"));
        const apptId = r.appointmentId?._id ? `APT-${String(r.appointmentId._id).slice(-6).toUpperCase()}` : (r.appointmentId || "-");
        const patName = r.patientId && (r.patientId.firstName || r.patientId.name)
          ? `${r.patientId.firstName || r.patientId.name} ${r.patientId.lastName || ""}`.trim()
          : (r.appointmentId?.name || "N/A");
        const dateStr = r.appointmentDate ? String(r.appointmentDate).slice(0, 10) : "";
        const docName = r.doctorId && (r.doctorId.firstName || r.doctorId.name)
          ? `Dr. ${r.doctorId.firstName || r.doctorId.name} ${r.doctorId.lastName || ""}`.trim()
          : (r.appointmentId?.doctor?.firstName ? `Dr. ${r.appointmentId.doctor.firstName} ${r.appointmentId.doctor.lastName || ""}`.trim() : "N/A");

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
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
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
    filteredSummaryGroups.forEach((g) =>
      rows.push([
        g.period,
        g.revenue || g.totalEarning || 0,
        g.due || g.totalDue || 0,
        Number(g.revenue || g.totalEarning || 0) + Number(g.due || g.totalDue || 0),
        g.count || g.invoices || g.appointments || 0,
      ]),
    );
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${groupBy || "summary"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Filter groups in summary view based on paid/due
  const filteredSummaryGroups = useMemo(() => {
    if (paymentTypeFilter === "paid") {
      return groups.filter((g) => Number(g.revenue || g.totalEarning || 0) > 0);
    }
    if (paymentTypeFilter === "due") {
      return groups.filter((g) => Number(g.due || g.totalDue || 0) > 0);
    }
    return groups;
  }, [groups, paymentTypeFilter]);

  return (
    <section className="reports-page page">
      <Toolbar>
        <div className="reports-top-bar">
          <div className="reports-header-row">
            <div className="reports-title-section">
              <h2 className="reports-title">Reports & Billing</h2>
              <span className="reports-subtitle">Financial summaries & transaction records</span>
            </div>

            <div className="reports-filters-group">
              <div className="reports-filter-item">
                <label htmlFor="report-start-date">From</label>
                <input
                  id="report-start-date"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="reports-filter-item">
                <label htmlFor="report-end-date">To</label>
                <input
                  id="report-end-date"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>

              {!usePersisted && (
                <>
                  <div className="reports-filter-item">
                    <label htmlFor="report-group-by">Group</label>
                    <select
                      id="report-group-by"
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  </div>

                  <div className="reports-filter-item">
                    <label htmlFor="report-payment-filter">Filter</label>
                    <select
                      id="report-payment-filter"
                      value={paymentTypeFilter}
                      onChange={(e) => setPaymentTypeFilter(e.target.value)}
                    >
                      <option value="all">All (Paid & Due)</option>
                      <option value="paid">Paid Only</option>
                      <option value="due">Due Only</option>
                    </select>
                  </div>
                </>
              )}

              <div className="reports-filter-item">
                <label htmlFor="report-doctor-select">Doctor</label>
                <select
                  id="report-doctor-select"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  disabled={dashboardUser && dashboardUser.role === "Doctor"}
                >
                  {dashboardUser && dashboardUser.role === "Admin" && (
                    <option value="">All Doctors</option>
                  )}
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="reports-actions">
                <button
                  ref={setupClickSound}
                  className="reports-action-btn"
                  onClick={() => fetchSummary({ start, end, groupBy, doctorId })}
                  disabled={loading}
                  title="Refresh data"
                >
                  {loading ? (
                    <BsHeartPulse style={{ color: "#ef4444" }} />
                  ) : (
                    <IoRefresh style={{ color: "#096dd9" }} />
                  )}
                </button>
                <button
                  ref={setupClickSound}
                  className="reports-action-btn"
                  onClick={downloadCSV}
                  title="Download CSV"
                >
                  <BsDownload style={{ color: "#10b981" }} />
                </button>
              </div>
            </div>
          </div>

          <div className="reports-sub-row">
            {/* Multi-field search box */}
            <div className="reports-search-box">
              <input
                placeholder="Search by Patient Name, Doctor, ID, Appointment ID, or Invoice #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={onSearchKey}
              />
              {searchTerm && (
                <button
                  className="reports-search-clear-btn"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
              <button
                ref={setupClickSound}
                className="reports-search-btn"
                onClick={() => {
                  setReportPage(1);
                  fetchSummary({ q: searchTerm, page: 1 });
                }}
                title="Search"
              >
                <FaSearch />
              </button>
            </div>

            {/* View Switcher: Persisted View (Main Default) vs Summary View */}
            <div className="reports-view-segmented">
              <button
                className={`reports-view-tab ${usePersisted ? "active" : ""}`}
                onClick={() => setUsePersisted(true)}
              >
                📋 Persisted Reports
              </button>
              <button
                className={`reports-view-tab ${!usePersisted ? "active" : ""}`}
                onClick={() => setUsePersisted(false)}
              >
                📊 Summary View
              </button>
            </div>
          </div>
        </div>
      </Toolbar>

      {/* Top Statistic Cards */}
      <div className="reports-cards">
        <div className="card">
          <p className="label">Total Amount</p>
          <h2 className="value">₹{fmt(totals.invoiced)}</h2>
          <small>
            Paid: ₹{fmt(totals.paid)} • Due: ₹{fmt(totals.totalDue)}
          </small>
        </div>
        {dashboardUser && dashboardUser.role === "Admin" && (
          <>
            <div className="card">
              <p className="label">Total Patients</p>
              <h2 className="value">{totalPatients}</h2>
              <small>All time registered</small>
            </div>
            <div className="card">
              <p className="label">Patients This Period</p>
              <h2 className="value">{patientsThisMonth}</h2>
              <small>Appointments: {totalAppointments}</small>
            </div>
            <div className="card">
              <p className="label">Report Records</p>
              <h2 className="value">{usePersisted ? reportTotal : filteredSummaryGroups.length}</h2>
              <small>{usePersisted ? "Total entries" : "Periods grouped"}</small>
            </div>
          </>
        )}
        <div className="card">
          <p className="label">Last Refreshed</p>
          <h2 className="value">{new Date().toLocaleDateString("en-GB")}</h2>
          <small>Realtime synchronization</small>
        </div>
      </div>

      {/* Summary View Graphs */}
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

      {/* Main Table Section */}
      <div className="table-wrap">
        {usePersisted ? (
          <div>
            {/* Sub-Navigation: All Transactions vs Refunded Appointments */}
            <div className="persisted-sub-nav">
              <button
                className={`persisted-nav-btn ${persistedSubTab === "all" ? "active" : ""}`}
                onClick={() => {
                  setPersistedSubTab("all");
                  setReportPage(1);
                  fetchSummary({ subTab: "all", page: 1 });
                }}
              >
                📋 All Transactions ({persistedSubTab === "all" ? reportTotal : ""})
              </button>
              <button
                className={`persisted-nav-btn refund-btn ${persistedSubTab === "refunded" ? "active" : ""}`}
                onClick={() => {
                  setPersistedSubTab("refunded");
                  setReportPage(1);
                  fetchSummary({ subTab: "refunded", page: 1 });
                }}
              >
                💸 Refunded Appointments {persistedSubTab === "refunded" ? `(${reportTotal})` : ""}
              </button>
            </div>

            <table className="reports-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Appointment ID</th>
                  <th>Patient Name</th>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Payment Status</th>
                  <th>Amount</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(reportEntries || []).map((r) => {
                  const patId = r.patientId?.nic || (r.patientId?._id ? `P-${String(r.patientId._id).slice(-5).toUpperCase()}` : (r.appointmentId?.nic || "-"));
                  const apptDisplayId = r.appointmentId?._id 
                    ? `APT-${String(r.appointmentId._id).slice(-6).toUpperCase()}` 
                    : (r.appointmentId ? `APT-${String(r.appointmentId).slice(-6).toUpperCase()}` : "-");
                  
                  const patName = r.patientId && (r.patientId.firstName || r.patientId.name)
                    ? `${r.patientId.firstName || r.patientId.name} ${r.patientId.lastName || ""}`.trim()
                    : (r.appointmentId?.name || r.patientId || "N/A");

                  const docName = r.doctorId && (r.doctorId.firstName || r.doctorId.name)
                    ? `Dr. ${r.doctorId.firstName || r.doctorId.name} ${r.doctorId.lastName || ""}`.trim()
                    : (r.appointmentId?.doctor?.firstName ? `Dr. ${r.appointmentId.doctor.firstName} ${r.appointmentId.doctor.lastName || ""}`.trim() : (r.doctorId || "N/A"));

                  const apptDate = r.appointmentDate
                    ? String(r.appointmentDate).slice(0, 10)
                    : (r.appointmentId?.appointment_date ? String(r.appointmentId.appointment_date).slice(0, 10) : "-");

                  const statusStr = r.status || "Due";
                  const isRefund = statusStr === "Refund" || r.appointmentId?.paymentStatus === "Refund";

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
                        <span className={`reports-status-pill ${isRefund ? "refund" : statusStr.toLowerCase()}`}>
                          {isRefund ? "Refunded" : statusStr}
                        </span>
                      </td>
                      <td>
                        <span className="reports-amount-val">₹{fmt(r.amount)}</span>
                      </td>
                      <td>
                        <div className="reports-actions-cell">
                          {/* Download Invoice button */}
                          <button
                            ref={setupClickSound}
                            className="reports-btn-action download"
                            title="Download Invoice / Receipt"
                            onClick={() => handleDownloadInvoice(r)}
                          >
                            <BsDownload />
                            <span>Download</span>
                          </button>

                          {/* View details drawer */}
                          <button
                            ref={setupClickSound}
                            className="reports-btn-action view"
                            title="View Invoices"
                            onClick={() => openInvoiceDrawer(r.appointmentId?._id || r.appointmentId)}
                          >
                            <FaEye />
                          </button>

                          {/* Delete only for Admin */}
                          {dashboardUser && dashboardUser.role === "Admin" && (
                            <button
                              ref={setupClickSound}
                              className="reports-btn-action delete"
                              title="Delete Report (Admin Only)"
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
                    <td colSpan={8} style={{ textAlign: "center", padding: "32px 16px", color: "#6b7280" }}>
                      {persistedSubTab === "refunded" 
                        ? "No refunded appointments found" 
                        : "No report entries found for the selected criteria"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {reportTotal > 50 && (
              <div className="reports-pagination">
                <button
                  className="reports-page-btn"
                  disabled={reportPage <= 1}
                  onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="reports-page-info">
                  Page {reportPage} of {Math.ceil(reportTotal / 50)} ({reportTotal} total)
                </span>
                <button
                  className="reports-page-btn"
                  disabled={reportPage * 50 >= reportTotal}
                  onClick={() => setReportPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Summary View Table */
          <div>
            <div className="summary-table-header-info">
              <span>Showing <strong>{filteredSummaryGroups.length}</strong> period records</span>
              {paymentTypeFilter !== "all" && (
                <span className="filter-badge">
                  Filtered: {paymentTypeFilter === "paid" ? "Paid Collections Only" : "Due Collections Only"}
                </span>
              )}
            </div>
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
                      <td style={{ color: "#059669", fontWeight: "600" }}>₹{fmt(paidVal)}</td>
                      <td style={{ color: "#dc2626", fontWeight: "600" }}>₹{fmt(dueVal)}</td>
                      <td>
                        <strong>₹{fmt(invTotal)}</strong>
                      </td>
                      <td>{countVal}</td>
                    </tr>
                  );
                })}
                {filteredSummaryGroups.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "32px 16px", color: "#6b7280" }}>
                      No data found for selected period and filters
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredSummaryGroups.length > 0 && (
                <tfoot>
                  <tr style={{ background: "#f8fafc", fontWeight: "700" }}>
                    <td>Grand Total</td>
                    <td style={{ color: "#059669" }}>
                      ₹{fmt(filteredSummaryGroups.reduce((s, g) => s + Number(g.revenue || g.totalEarning || 0), 0))}
                    </td>
                    <td style={{ color: "#dc2626" }}>
                      ₹{fmt(filteredSummaryGroups.reduce((s, g) => s + Number(g.due || g.totalDue || 0), 0))}
                    </td>
                    <td>
                      ₹{fmt(filteredSummaryGroups.reduce((s, g) => s + (Number(g.revenue || g.totalEarning || 0) + Number(g.due || g.totalDue || 0)), 0))}
                    </td>
                    <td>
                      {filteredSummaryGroups.reduce((s, g) => s + Number(g.count || g.invoices || g.appointments || 0), 0)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Drawer for invoices */}
      {drawerOpen && (
        <div className="invoice-overlay" onClick={closeDrawer}></div>
      )}
      {drawerOpen && (
        <div className="invoice-drawer">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
              paddingBottom: "10px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", color: "#1f2937" }}>
              Invoices for Appointment #{String(drawerAppointmentId).slice(-6).toUpperCase()}
            </h3>
            <div>
              <button className="btn" onClick={closeDrawer}>
                Close
              </button>
            </div>
          </div>
          {drawerLoading && <p>Loading invoices...</p>}
          {!drawerLoading && (
            <div>
              <div className="invoice-list">
                {invoicesForAppointment.map((inv) => (
                  <div key={inv._id} className="invoice-item">
                    <div className="meta">
                      <strong>{inv.invoiceNumber || inv._id}</strong>
                      <small>Total: ₹{fmt(inv.total)}</small>
                      <small>
                        Paid: ₹
                        {fmt(
                          (inv.payments || []).reduce(
                            (s, p) => s + (Number(p.amount) || 0),
                            0,
                          ),
                        )}
                      </small>
                      <small>Status: {inv.status}</small>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        className="btn-small"
                        onClick={() => editInvoice(inv)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-small"
                        onClick={() => settleInvoice(inv)}
                      >
                        Settle
                      </button>
                      <button
                        className="btn-small"
                        style={{ background: "#096dd9", color: "#fff" }}
                        onClick={() => handleDownloadInvoice({ appointmentId: inv._id })}
                      >
                        Download
                      </button>
                      {dashboardUser && dashboardUser.role === "Admin" && (
                        <button
                          className="btn-small"
                          style={{ background: "#dc2626", color: "#fff" }}
                          onClick={() => deleteInvoice(inv._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {invoicesForAppointment.length === 0 && (
                  <div style={{ padding: "16px 0", color: "#6b7280" }}>
                    No separate invoice records created for this appointment yet. You can download the consultation receipt directly from the table.
                  </div>
                )}
              </div>

              {selectedInvoice && (
                <div className="invoice-editor">
                  <h4>
                    Edit Invoice{" "}
                    {selectedInvoice.invoiceNumber || selectedInvoice._id}
                  </h4>
                  <label>
                    Invoice Number
                    <input
                      value={selectedInvoice.invoiceNumber || ""}
                      onChange={(e) =>
                        setSelectedInvoice((s) => ({
                          ...s,
                          invoiceNumber: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Total Amount (₹)
                    <input
                      type="number"
                      value={selectedInvoice.total || 0}
                      onChange={(e) =>
                        setSelectedInvoice((s) => ({
                          ...s,
                          total: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={selectedInvoice.status || "Unpaid"}
                      onChange={(e) =>
                        setSelectedInvoice((s) => ({
                          ...s,
                          status: e.target.value,
                        }))
                      }
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partial">Partial</option>
                      <option value="Paid">Paid</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </label>
                  <label>
                    Notes
                    <textarea
                      value={selectedInvoice.notes || ""}
                      onChange={(e) =>
                        setSelectedInvoice((s) => ({
                          ...s,
                          notes: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <div style={{ display: "flex", gap: 8, marginTop: "10px" }}>
                    <button
                      className="btn"
                      onClick={saveInvoice}
                      disabled={invoiceSaving}
                    >
                      {invoiceSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn"
                      onClick={() => setSelectedInvoice(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ReportsPage;
