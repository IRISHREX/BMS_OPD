import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import Sidebar from "./Sidebar";
import RadialMenu from "./RadialMenu";
import { exportToExcel, exportToCSV, exportToPDF } from "../utils/exportUtils";
import {
  FaFileExcel,
  FaFileCsv,
  FaFilePdf,
  FaDatabase,
  FaExclamationTriangle,
  FaBell,
  FaCog,
  FaDownload,
  FaCalendarAlt,
  FaUsers,
  FaNotesMedical,
} from "react-icons/fa";
import "./BackupManager.css";

const BackupManager = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [downloadingAppts, setDownloadingAppts] = useState(false);
  const [downloadingPatients, setDownloadingPatients] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Stats from backend
  const [stats, setStats] = useState({
    usedMB: 0,
    limitMB: 1024,
    usedPercentage: 0,
    isStorageExceeded: false,
    breakdown: { appointmentsMB: 0, usersMB: 0, otherMB: 0 },
    totalAppointments: 0,
    appointmentThreshold: 1000,
    isAppointmentsExceeded: false,
    totalPatients: 0,
    lastBackupDate: null,
  });

  // Settings form
  const [customLimitMB, setCustomLimitMB] = useState(1024);
  const [customApptThreshold, setCustomApptThreshold] = useState(1000);
  const [savingSettings, setSavingSettings] = useState(false);

  // Appointment filters
  const [apptRange, setApptRange] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/v1/backup/stats");
      if (data.success) {
        setStats(data.stats);
        setCustomLimitMB(data.stats.limitMB);
        setCustomApptThreshold(data.stats.appointmentThreshold);
      }
    } catch (error) {
      console.error("Failed to load backup statistics:", error);
      snackbar.error(error.response?.data?.message || "Failed to load backup statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Save custom thresholds
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const limit = Number(customLimitMB);
    const threshold = Number(customApptThreshold);
    if (isNaN(limit) || limit <= 0) {
      snackbar.warning("Storage limit must be a positive number in MB.");
      return;
    }
    if (isNaN(threshold) || threshold <= 0) {
      snackbar.warning("Appointment threshold must be a positive number.");
      return;
    }

    try {
      setSavingSettings(true);
      const { data } = await api.put("/api/v1/backup/settings", {
        storageLimitMB: limit,
        appointmentThreshold: threshold,
      });
      if (data.success) {
        snackbar.success("Threshold settings updated successfully");
        setShowSettings(false);
        fetchStats();
      }
    } catch (error) {
      snackbar.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Download Appointments Handler
  const handleExportAppointments = async (format) => {
    try {
      setDownloadingAppts(true);
      let url = `/api/v1/backup/export/appointments?range=${apptRange}`;
      if (apptRange === "custom") {
        if (!customFrom && !customTo) {
          snackbar.warning("Please select at least a From or To date for custom export.");
          setDownloadingAppts(false);
          return;
        }
        if (customFrom && customTo && new Date(customFrom) > new Date(customTo)) {
          snackbar.warning("'From' date cannot be after 'To' date.");
          setDownloadingAppts(false);
          return;
        }
        if (customFrom) url += `&from=${customFrom}`;
        if (customTo) url += `&to=${customTo}`;
      }

      const { data } = await api.get(url);
      if (!data.success || !data.records || data.records.length === 0) {
        snackbar.info("No appointment records found for the selected range.");
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `appointments-backup-${apptRange}-${timestamp}`;

      if (format === "excel") {
        exportToExcel(data.records, filename);
        snackbar.success(`Exported ${data.records.length} appointments to Excel!`);
      } else if (format === "csv") {
        exportToCSV(data.records, filename);
        snackbar.success(`Exported ${data.records.length} appointments to CSV!`);
      } else if (format === "pdf") {
        exportToPDF(data.records, `Appointments Backup (${apptRange.toUpperCase()})`, filename);
        snackbar.success(`Exported ${data.records.length} appointments to PDF!`);
      }

      // Refresh stats to update lastBackupDate
      fetchStats();
    } catch (error) {
      snackbar.error(error.response?.data?.message || "Failed to export appointments");
    } finally {
      setDownloadingAppts(false);
    }
  };

  // Download Patients Handler
  const handleExportPatients = async (format) => {
    try {
      setDownloadingPatients(true);
      const { data } = await api.get("/api/v1/backup/export/patients");
      if (!data.success || !data.records || data.records.length === 0) {
        snackbar.info("No patient records available for export.");
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `patients-backup-${timestamp}`;

      if (format === "excel") {
        exportToExcel(data.records, filename);
        snackbar.success(`Exported ${data.records.length} patient records to Excel!`);
      } else if (format === "csv") {
        exportToCSV(data.records, filename);
        snackbar.success(`Exported ${data.records.length} patient records to CSV!`);
      } else if (format === "pdf") {
        exportToPDF(data.records, "Patients Directory Backup", filename);
        snackbar.success(`Exported ${data.records.length} patient records to PDF!`);
      }

      fetchStats();
    } catch (error) {
      snackbar.error(error.response?.data?.message || "Failed to export patients");
    } finally {
      setDownloadingPatients(false);
    }
  };

  // Determine progress color
  const progressPercent = stats.usedPercentage || 0;
  const progressColorClass =
    progressPercent >= 90 ? "danger" : progressPercent >= 70 ? "warning" : "normal";

  return (
    <>
      <Sidebar />
      <RadialMenu />
      <section className="page backup-page">
        <div className="backup-header">
          <button onClick={() => navigate("/settings/advanced")} className="back-btn add-btn">
            ← Back to Advanced Settings
          </button>
          <h1>System Backups & Data Export</h1>
          <p>
            Safeguard your clinic records with offline backups and real-time database capacity monitoring.
          </p>
        </div>

        {/* 1. Threshold Alert: 1,000 Appointments Completed */}
        {stats.isAppointmentsExceeded && (
          <div className="backup-alert warning">
            <FaExclamationTriangle className="alert-icon" />
            <div>
              <strong>Action Recommended:</strong> You have reached{" "}
              <strong>{stats.totalAppointments} completed appointments</strong> (threshold:{" "}
              {stats.appointmentThreshold}). Please take an offline backup of your appointments to ensure data integrity.
            </div>
          </div>
        )}

        {/* 2. Threshold Alert: Storage Capacity Exceeded */}
        {stats.isStorageExceeded && (
          <div className="backup-alert danger">
            <FaBell className="alert-icon" />
            <div>
              <strong>Storage Alert:</strong> Database storage ({stats.usedMB} MB) has exceeded your limit of{" "}
              {stats.limitMB} MB! Please export older appointments and archive them to prevent database saturation.
            </div>
          </div>
        )}

        {/* 3. Real-Time Storage Space & Threshold Gauge */}
        <div className="storage-card">
          <div className="storage-card-header">
            <h3>
              <FaDatabase /> Database Storage Capacity
            </h3>
            <button
              className="btn"
              onClick={() => setShowSettings(!showSettings)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "0.85rem",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              <FaCog /> {showSettings ? "Close Settings" : "Configure Thresholds"}
            </button>
          </div>

          <div className="storage-progress-container">
            <div className="storage-progress-bar-bg">
              <div
                className={`storage-progress-bar-fill ${progressColorClass}`}
                style={{ width: `${Math.min(100, Math.max(2, progressPercent))}%` }}
              ></div>
            </div>
            <div className="storage-meta-labels">
              <span>
                <strong>{stats.usedMB} MB</strong> used of <strong>{stats.limitMB} MB</strong> (
                {(stats.limitMB / 1024).toFixed(1)} GB limit)
              </span>
              <span>
                <strong>{progressPercent}%</strong> capacity
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="storage-stats-grid">
            <div className="stat-item">
              <div className="stat-item-label">Total Storage</div>
              <div className="stat-item-value">{stats.usedMB} MB</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-label">Appointments Size</div>
              <div className="stat-item-value">{stats.breakdown?.appointmentsMB || 0} MB</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-label">Users / Patients Size</div>
              <div className="stat-item-value">{stats.breakdown?.usersMB || 0} MB</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-label">Total Appointments</div>
              <div className="stat-item-value">{stats.totalAppointments}</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-label">Total Patients</div>
              <div className="stat-item-value">{stats.totalPatients}</div>
            </div>
          </div>

          {/* Inline Settings Box */}
          {showSettings && (
            <form onSubmit={handleSaveSettings} className="settings-inline-box">
              <div className="settings-field-group">
                <label>Storage Limit (MB):</label>
                <input
                  type="number"
                  min="100"
                  max="51200"
                  value={customLimitMB}
                  onChange={(e) => setCustomLimitMB(e.target.value)}
                  required
                />
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  ({(customLimitMB / 1024).toFixed(1)} GB)
                </span>
              </div>

              <div className="settings-field-group">
                <label>Appointment Alert Threshold:</label>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={customApptThreshold}
                  onChange={(e) => setCustomApptThreshold(e.target.value)}
                  required
                />
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>records</span>
              </div>

              <button
                type="submit"
                className="btn add-btn"
                disabled={savingSettings}
                style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              >
                {savingSettings ? "Saving..." : "Save Thresholds"}
              </button>
            </form>
          )}
        </div>

        {/* 4. Backup Cards Grid */}
        <div className="backup-grid">
          {/* Card A: Appointments Backup */}
          <div className="backup-section-card">
            <h3>
              <FaNotesMedical color="#2563eb" /> Appointments Backup
            </h3>
            <p>
              Export clinical appointments with patient identifiers, consultation fees, vitals, diagnosis, and doctor assignments.
            </p>

            {/* Date Range Chips */}
            <div className="range-chips-wrap">
              <button
                type="button"
                className={`range-chip ${apptRange === "today" ? "active" : ""}`}
                onClick={() => setApptRange("today")}
              >
                Today
              </button>
              <button
                type="button"
                className={`range-chip ${apptRange === "week" ? "active" : ""}`}
                onClick={() => setApptRange("week")}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className={`range-chip ${apptRange === "month" ? "active" : ""}`}
                onClick={() => setApptRange("month")}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                className={`range-chip ${apptRange === "all" ? "active" : ""}`}
                onClick={() => setApptRange("all")}
              >
                All Time
              </button>
              <button
                type="button"
                className={`range-chip ${apptRange === "custom" ? "active" : ""}`}
                onClick={() => setApptRange("custom")}
              >
                <FaCalendarAlt /> Custom Range
              </button>
            </div>

            {/* Custom Range Picker */}
            {apptRange === "custom" && (
              <div className="custom-date-row">
                <div>
                  <label>From Date:</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label>To Date:</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Export Buttons */}
            <div className="export-buttons-group">
              <button
                className="btn-export btn-export-excel"
                onClick={() => handleExportAppointments("excel")}
                disabled={downloadingAppts}
                title="Download formatted Excel spreadsheet"
              >
                <FaFileExcel size={20} />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                className="btn-export btn-export-csv"
                onClick={() => handleExportAppointments("csv")}
                disabled={downloadingAppts}
                title="Download CSV spreadsheet"
              >
                <FaFileCsv size={20} />
                <span>CSV (.csv)</span>
              </button>

              <button
                className="btn-export btn-export-pdf"
                onClick={() => handleExportAppointments("pdf")}
                disabled={downloadingAppts}
                title="Download formatted PDF table"
              >
                <FaFilePdf size={20} />
                <span>PDF Document</span>
              </button>
            </div>
          </div>

          {/* Card B: Patients Backup */}
          <div className="backup-section-card">
            <h3>
              <FaUsers color="#059669" /> Patients Directory Backup
            </h3>
            <p>
              Export comprehensive patient master directory including contact numbers, ages, demographic info, total visits, and last consultation timestamps.
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "0.85rem 1rem",
                marginBottom: "1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Registered Patients:</span>
              <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
                {stats.totalPatients} records
              </span>
            </div>

            {stats.lastBackupDate && (
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 1rem 0" }}>
                Last Backup taken on: <strong>{new Date(stats.lastBackupDate).toLocaleDateString()}</strong>
              </p>
            )}

            {/* Export Buttons */}
            <div className="export-buttons-group">
              <button
                className="btn-export btn-export-excel"
                onClick={() => handleExportPatients("excel")}
                disabled={downloadingPatients}
                title="Download patient directory as Excel"
              >
                <FaFileExcel size={20} />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                className="btn-export btn-export-csv"
                onClick={() => handleExportPatients("csv")}
                disabled={downloadingPatients}
                title="Download patient directory as CSV"
              >
                <FaFileCsv size={20} />
                <span>CSV (.csv)</span>
              </button>

              <button
                className="btn-export btn-export-pdf"
                onClick={() => handleExportPatients("pdf")}
                disabled={downloadingPatients}
                title="Download patient directory as PDF"
              >
                <FaFilePdf size={20} />
                <span>PDF Document</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BackupManager;
