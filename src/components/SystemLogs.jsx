import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import Sidebar from "./Sidebar";
import RadialMenu from "./RadialMenu";
import { exportToCSV } from "../utils/exportUtils";
import {
  FaShieldAlt,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaSearch,
  FaSyncAlt,
  FaTrashAlt,
  FaFileDownload,
  FaTimes,
  FaUserCircle,
  FaNetworkWired,
  FaCodeBranch,
} from "react-icons/fa";
import "./SystemLogs.css";

const CATEGORIES = [
  "ALL",
  "Auth",
  "Appointment",
  "Backup",
  "Template",
  "User",
  "System",
  "Billing",
  "Referral",
  "Settings",
];

const SystemLogs = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  // Logs state
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayErrors: 0,
    todayWarns: 0,
    systemHealth: "HEALTHY",
  });
  const [counts, setCounts] = useState({
    all: 0,
    error: 0,
    warn: 0,
    info: 0,
    success: 0,
  });

  // Filters state
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshTimerRef = useRef(null);

  // Detail Modal & Clear Modal state
  const [selectedLog, setSelectedLog] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearOlderThan, setClearOlderThan] = useState("all");
  const [clearing, setClearing] = useState(false);

  // Fetch log statistics
  const fetchStats = async () => {
    try {
      const { data } = await api.get("/api/v1/logs/stats");
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch log stats:", err);
    }
  };

  // Fetch logs list
  const fetchLogs = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) setRefreshing(true);
        else setLoading(true);

        const params = {
          page,
          limit: 25,
          level: selectedLevel !== "ALL" ? selectedLevel : undefined,
          category: selectedCategory !== "ALL" ? selectedCategory : undefined,
          search: search.trim() || undefined,
        };

        const now = new Date();
        if (dateRange === "today") {
          params.from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        } else if (dateRange === "24h") {
          params.from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        } else if (dateRange === "7d") {
          params.from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        }

        const { data } = await api.get("/api/v1/logs", { params });
        if (data.success) {
          setLogs(data.logs || []);
          setTotalPages(data.pagination.totalPages || 1);
          setTotalLogs(data.pagination.total || 0);
          setCounts(data.counts || {});
        }
      } catch (err) {
        console.error("Failed to load system logs:", err);
        snackbar.error(err.response?.data?.message || "Failed to load system logs");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, selectedLevel, selectedCategory, search, dateRange]
  );

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh interval handling
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchLogs(true);
        fetchStats();
      }, 15000);
    } else {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    }
    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [autoRefresh, fetchLogs]);

  // Handle Clear Logs
  const handleClearLogs = async () => {
    try {
      setClearing(true);
      const payload = {};
      if (clearOlderThan === "7d") payload.olderThanDays = 7;
      if (clearOlderThan === "30d") payload.olderThanDays = 30;

      const { data } = await api.delete("/api/v1/logs/clear", { data: payload });
      if (data.success) {
        snackbar.success(data.message || "Logs cleared successfully");
        setShowClearModal(false);
        fetchLogs(true);
        fetchStats();
      }
    } catch (err) {
      snackbar.error(err.response?.data?.message || "Failed to clear logs");
    } finally {
      setClearing(false);
    }
  };

  // Export Logs to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      snackbar.info("No logs to export.");
      return;
    }
    const exportData = logs.map((l, index) => ({
      SL: index + 1,
      Timestamp: new Date(l.createdAt).toLocaleString(),
      Level: l.level,
      Category: l.category,
      Action: l.action,
      Message: l.message,
      User: l.user?.name || "System",
      Role: l.user?.role || "System",
      IP: l.ip || "-",
      Method: l.method || "-",
      URL: l.url || "-",
      Status: l.statusCode || "-",
    }));
    exportToCSV(exportData, `system-logs-${new Date().toISOString().slice(0, 10)}`);
    snackbar.success(`Exported ${exportData.length} logs to CSV!`);
  };

  // Export Logs to JSON
  const handleExportJSON = () => {
    if (logs.length === 0) {
      snackbar.info("No logs to export.");
      return;
    }
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    snackbar.success(`Exported ${logs.length} logs to JSON!`);
  };

  const getLevelIcon = (lvl) => {
    switch (lvl) {
      case "ERROR":
        return <FaExclamationCircle />;
      case "WARN":
        return <FaExclamationTriangle />;
      case "SUCCESS":
        return <FaCheckCircle />;
      default:
        return <FaInfoCircle />;
    }
  };

  return (
    <>
      <Sidebar />
      <RadialMenu />

      <section className="page syslogs-page">
        {/* Header */}
        <div className="syslogs-header">
          <button onClick={() => navigate("/settings/advanced")} className="back-btn add-btn">
            ← Go Back to Advanced Settings
          </button>
          <h1>System Logs & Audit Trail</h1>
          <p>Real-time audit records, authentication activities, system diagnostics, and error tracking</p>
        </div>

        {/* Stats Row */}
        <div className="syslogs-stats-grid">
          <div className="syslogs-stat-card total">
            <div className="syslogs-stat-info">
              <div className="syslogs-stat-label">Total Logs (Filtered)</div>
              <div className="syslogs-stat-val">{totalLogs}</div>
            </div>
            <div className="syslogs-stat-icon">
              <FaShieldAlt />
            </div>
          </div>

          <div className="syslogs-stat-card error">
            <div className="syslogs-stat-info">
              <div className="syslogs-stat-label">Errors (Today)</div>
              <div className="syslogs-stat-val" style={{ color: stats.todayErrors > 0 ? "#dc2626" : undefined }}>
                {stats.todayErrors}
              </div>
            </div>
            <div className="syslogs-stat-icon">
              <FaExclamationCircle />
            </div>
          </div>

          <div className="syslogs-stat-card warn">
            <div className="syslogs-stat-info">
              <div className="syslogs-stat-label">Warnings (Today)</div>
              <div className="syslogs-stat-val">{stats.todayWarns}</div>
            </div>
            <div className="syslogs-stat-icon">
              <FaExclamationTriangle />
            </div>
          </div>

          <div className="syslogs-stat-card health">
            <div className="syslogs-stat-info">
              <div className="syslogs-stat-label">System Health</div>
              <div
                className="syslogs-stat-val"
                style={{
                  fontSize: "1.3rem",
                  color: stats.systemHealth === "HEALTHY" ? "#16a34a" : "#dc2626",
                }}
              >
                {stats.systemHealth}
              </div>
            </div>
            <div className="syslogs-stat-icon">
              <FaCheckCircle />
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="syslogs-toolbar">
          <div className="syslogs-toolbar-row">
            {/* Level Pills */}
            <div className="syslogs-level-pills">
              <button
                className={`syslogs-pill ${selectedLevel === "ALL" ? "active" : ""}`}
                onClick={() => {
                  setSelectedLevel("ALL");
                  setPage(1);
                }}
              >
                All ({counts.all || 0})
              </button>
              <button
                className={`syslogs-pill error ${selectedLevel === "ERROR" ? "active" : ""}`}
                onClick={() => {
                  setSelectedLevel("ERROR");
                  setPage(1);
                }}
              >
                <FaExclamationCircle /> Errors ({counts.error || 0})
              </button>
              <button
                className={`syslogs-pill warn ${selectedLevel === "WARN" ? "active" : ""}`}
                onClick={() => {
                  setSelectedLevel("WARN");
                  setPage(1);
                }}
              >
                <FaExclamationTriangle /> Warn ({counts.warn || 0})
              </button>
              <button
                className={`syslogs-pill info ${selectedLevel === "INFO" ? "active" : ""}`}
                onClick={() => {
                  setSelectedLevel("INFO");
                  setPage(1);
                }}
              >
                <FaInfoCircle /> Info ({counts.info || 0})
              </button>
              <button
                className={`syslogs-pill success ${selectedLevel === "SUCCESS" ? "active" : ""}`}
                onClick={() => {
                  setSelectedLevel("SUCCESS");
                  setPage(1);
                }}
              >
                <FaCheckCircle /> Success ({counts.success || 0})
              </button>
            </div>

            {/* Toolbar Action Buttons */}
            <div className="syslogs-toolbar-actions">
              <button
                className="syslogs-btn refresh"
                onClick={() => fetchLogs(true)}
                disabled={refreshing}
                title="Refresh logs"
              >
                <FaSyncAlt className={refreshing ? "syslogs-spinning" : ""} /> Refresh
              </button>
              <button className="syslogs-btn" onClick={handleExportCSV} title="Export current logs as CSV">
                <FaFileDownload /> CSV
              </button>
              <button className="syslogs-btn" onClick={handleExportJSON} title="Export current logs as JSON">
                <FaCodeBranch /> JSON
              </button>
              <button
                className="syslogs-btn clear-logs"
                onClick={() => setShowClearModal(true)}
                title="Clear logs database"
              >
                <FaTrashAlt /> Clear
              </button>
            </div>
          </div>

          <div className="syslogs-toolbar-row">
            <div className="syslogs-controls">
              {/* Search Box */}
              <div className="syslogs-search-box">
                <FaSearch className="syslogs-search-icon" />
                <input
                  type="text"
                  className="syslogs-search-input"
                  placeholder="Search logs, actions, users, IPs..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Category Select */}
              <select
                className="syslogs-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    Category: {cat}
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              <select
                className="syslogs-select"
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Time: All Time</option>
                <option value="today">Time: Today</option>
                <option value="24h">Time: Last 24 Hours</option>
                <option value="7d">Time: Last 7 Days</option>
              </select>

              {/* Auto Refresh Toggle */}
              <label className="syslogs-auto-refresh">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-Refresh (15s)
              </label>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="syslogs-table-card">
          {loading ? (
            <div className="syslogs-empty">
              <FaSyncAlt className="syslogs-spinning syslogs-empty-icon" />
              <p>Loading system logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="syslogs-empty">
              <FaShieldAlt className="syslogs-empty-icon" />
              <p>No log records match the current filters.</p>
            </div>
          ) : (
            <table className="syslogs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Level</th>
                  <th>Category</th>
                  <th>Action & Description</th>
                  <th>User</th>
                  <th>IP / Route</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} onClick={() => setSelectedLog(log)} title="Click to view full log details">
                    <td className="syslogs-time">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        {new Date(log.createdAt).toISOString().slice(0, 10)}
                      </div>
                    </td>
                    <td>
                      <span className={`syslogs-level-badge ${log.level.toLowerCase()}`}>
                        {getLevelIcon(log.level)} {log.level}
                      </span>
                    </td>
                    <td>
                      <span className="syslogs-category-badge">{log.category}</span>
                    </td>
                    <td>
                      <div className="syslogs-msg-cell">
                        <span className="syslogs-action-tag">{log.action}</span>
                        <span>{log.message}</span>
                      </div>
                    </td>
                    <td>
                      <div className="syslogs-user-tag">
                        <FaUserCircle style={{ color: "#94a3b8" }} />
                        <span>{log.user?.name || "System"}</span>
                        {log.user?.role && log.user.role !== "System" && (
                          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>({log.user.role})</span>
                        )}
                      </div>
                    </td>
                    <td className="syslogs-time">
                      <div>{log.ip || "-"}</div>
                      {log.url && log.url !== "-" && (
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          {log.method} {log.url}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="syslogs-pagination">
              <div className="syslogs-page-info">
                Page {page} of {totalPages} ({totalLogs} records)
              </div>
              <div className="syslogs-page-btns">
                <button
                  className="syslogs-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="syslogs-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Log Details Modal */}
        {selectedLog && (
          <div className="syslogs-modal-overlay" onClick={() => setSelectedLog(null)}>
            <div className="syslogs-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="syslogs-modal-header">
                <h2>Log Event Details</h2>
                <button className="syslogs-modal-close" onClick={() => setSelectedLog(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="syslogs-modal-body">
                <div className="syslogs-detail-row">
                  <div className="syslogs-detail-label">Level:</div>
                  <div className="syslogs-detail-val">
                    <span className={`syslogs-level-badge ${selectedLog.level.toLowerCase()}`}>
                      {getLevelIcon(selectedLog.level)} {selectedLog.level}
                    </span>
                  </div>
                </div>
                <div className="syslogs-detail-row">
                  <div className="syslogs-detail-label">Category:</div>
                  <div className="syslogs-detail-val">
                    <span className="syslogs-category-badge">{selectedLog.category}</span>
                  </div>
                </div>
                <div className="syslogs-detail-row">
                  <div className="syslogs-detail-label">Action:</div>
                  <div className="syslogs-detail-val">
                    <span className="syslogs-action-tag">{selectedLog.action}</span>
                  </div>
                </div>
                <div className="syslogs-detail-row">
                  <div className="syslogs-detail-label">Message:</div>
                  <div className="syslogs-detail-val">{selectedLog.message}</div>
                </div>
                <div className="syslogs-detail-row">
                  <div className="syslogs-detail-label">Timestamp:</div>
                  <div className="syslogs-detail-val">
                    {new Date(selectedLog.createdAt).toLocaleString()} ({selectedLog.createdAt})
                  </div>
                </div>
                <div className="syslogs-detail-row">
                  <div className="syslogs-detail-label">User:</div>
                  <div className="syslogs-detail-val">
                    {selectedLog.user?.name || "System"} ({selectedLog.user?.role || "System"}){" "}
                    {selectedLog.user?.email ? `• ${selectedLog.user.email}` : ""}
                  </div>
                </div>
                <div className="syslogs-detail-row">
                  <div className="syslogs-detail-label">Client IP:</div>
                  <div className="syslogs-detail-val">{selectedLog.ip || "-"}</div>
                </div>
                {selectedLog.url && selectedLog.url !== "-" && (
                  <div className="syslogs-detail-row">
                    <div className="syslogs-detail-label">Request:</div>
                    <div className="syslogs-detail-val">
                      <strong>{selectedLog.method}</strong> {selectedLog.url} (Status: {selectedLog.statusCode})
                    </div>
                  </div>
                )}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div className="syslogs-detail-label" style={{ marginBottom: "0.5rem" }}>
                      Metadata & Payload:
                    </div>
                    <pre className="syslogs-json-box">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clear Logs Confirmation Modal */}
        {showClearModal && (
          <div className="syslogs-modal-overlay" onClick={() => setShowClearModal(false)}>
            <div className="syslogs-modal-card" style={{ maxWidth: "450px" }} onClick={(e) => e.stopPropagation()}>
              <div className="syslogs-modal-header">
                <h2>Purge System Logs</h2>
                <button className="syslogs-modal-close" onClick={() => setShowClearModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="syslogs-modal-body">
                <p style={{ color: "#475569" }}>
                  Select which log entries you would like to permanently remove:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="clearOpt"
                      value="7d"
                      checked={clearOlderThan === "7d"}
                      onChange={(e) => setClearOlderThan(e.target.value)}
                    />
                    Clear logs older than 7 days
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="clearOpt"
                      value="30d"
                      checked={clearOlderThan === "30d"}
                      onChange={(e) => setClearOlderThan(e.target.value)}
                    />
                    Clear logs older than 30 days
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#dc2626", fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="clearOpt"
                      value="all"
                      checked={clearOlderThan === "all"}
                      onChange={(e) => setClearOlderThan(e.target.value)}
                    />
                    Purge ALL logs (irreversible)
                  </label>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                  <button className="syslogs-btn" onClick={() => setShowClearModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="syslogs-btn clear-logs"
                    onClick={handleClearLogs}
                    disabled={clearing}
                  >
                    {clearing ? "Purging..." : "Confirm Purge"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default SystemLogs;
