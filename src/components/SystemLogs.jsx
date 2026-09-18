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
  FaCodeBranch,
  FaTerminal,
  FaTable,
  FaCog,
  FaBell,
  FaCopy,
} from "react-icons/fa";
import "./SystemLogs.css";

const CATEGORIES = [
  "ALL",
  "Appointment",
  "Billing",
  "Report",
  "Staff",
  "Auth",
  "Backup",
  "Template",
  "User",
  "System",
  "Referral",
  "Settings",
];

const SystemLogs = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  // View mode: 'table' or 'terminal'
  const [viewMode, setViewMode] = useState("table");

  // Logs state
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    maxLogsLimit: 500,
    autoDeleteEnabled: true,
    capacityPercent: 0,
    todayTotal: 0,
    todayErrors: 0,
    todayWarns: 0,
    systemHealth: "HEALTHY",
    shouldPromptDownload: false,
    daysSinceLastDownload: 0,
    lastDownloadDate: null,
  });
  const [counts, setCounts] = useState({
    all: 0,
    error: 0,
    warn: 0,
    info: 0,
    success: 0,
  });

  // Settings State
  const [settings, setSettings] = useState({
    maxLogsLimit: 500,
    autoDeleteEnabled: true,
    alertFrequencyDays: 7,
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

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
  const terminalConsoleRef = useRef(null);

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

  // Fetch log settings
  const fetchSettings = async () => {
    try {
      const { data } = await api.get("/api/v1/logs/settings");
      if (data.success && data.settings) {
        setSettings({
          maxLogsLimit: data.settings.maxLogsLimit || 500,
          autoDeleteEnabled: data.settings.autoDeleteEnabled !== false,
          alertFrequencyDays: data.settings.alertFrequencyDays || 7,
        });
      }
    } catch (err) {
      console.error("Failed to fetch log settings:", err);
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
          limit: viewMode === "terminal" ? 100 : 25,
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
    [page, selectedLevel, selectedCategory, search, dateRange, viewMode]
  );

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-scroll terminal when logs change in terminal mode
  useEffect(() => {
    if (viewMode === "terminal" && terminalConsoleRef.current) {
      terminalConsoleRef.current.scrollTop = terminalConsoleRef.current.scrollHeight;
    }
  }, [logs, viewMode]);

  // Auto-refresh interval handling
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchLogs(true);
        fetchStats();
      }, 10000);
    } else {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    }
    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [autoRefresh, fetchLogs]);

  // Mark Logs as Downloaded (Dismiss Prompt)
  const handleMarkDownloaded = async () => {
    try {
      const { data } = await api.post("/api/v1/logs/downloaded");
      if (data.success) {
        fetchStats();
      }
    } catch (err) {
      console.warn("Failed to mark logs as downloaded:", err);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const { data } = await api.put("/api/v1/logs/settings", settings);
      if (data.success) {
        snackbar.success("Log settings updated successfully!");
        setShowSettingsModal(false);
        fetchStats();
        fetchLogs(true);
      }
    } catch (err) {
      snackbar.error(err.response?.data?.message || "Failed to update log settings");
    } finally {
      setSavingSettings(false);
    }
  };

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
    handleMarkDownloaded();
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
    handleMarkDownloaded();
    snackbar.success(`Exported ${logs.length} logs to JSON!`);
  };

  // Export Logs as Raw .log Command Stream
  const handleExportLogStream = () => {
    if (logs.length === 0) {
      snackbar.info("No logs to export.");
      return;
    }
    const stream = logs
      .map((l) => {
        const time = new Date(l.createdAt).toISOString();
        const level = (l.level || "INFO").padEnd(7);
        const cat = (l.category || "System").padEnd(12);
        const action = (l.action || "-").padEnd(24);
        const reqInfo = l.url && l.url !== "-" ? `${l.method} ${l.url} (${l.statusCode})` : "INTERNAL";
        const userInfo = `${l.user?.name || "System"} [${l.user?.role || "System"}]`;
        return `[${time}] [${level}] [${cat}] [${action}] ${reqInfo} | ${userInfo} (IP: ${l.ip || "-"}) -> ${l.message}`;
      })
      .join("\n");

    const blob = new Blob([stream], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `command-stream-${new Date().toISOString().slice(0, 10)}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleMarkDownloaded();
    snackbar.success(`Exported ${logs.length} log command records!`);
  };

  // Copy Terminal Output
  const handleCopyTerminal = () => {
    const text = logs
      .map(
        (l) =>
          `[${new Date(l.createdAt).toLocaleTimeString()}] [${l.level}] [${l.action}] ${l.method || ""} ${l.url || ""} -> ${l.message} (${l.user?.name || "System"})`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    snackbar.success("Command stream copied to clipboard!");
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
          <div className="syslogs-header-top">
            <button onClick={() => navigate("/settings/advanced")} className="back-btn add-btn">
              ← Go Back to Advanced Settings
            </button>
            <div className="syslogs-view-toggle">
              <button
                className={`syslogs-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table Audit View"
              >
                <FaTable /> Table View
              </button>
              <button
                className={`syslogs-toggle-btn ${viewMode === "terminal" ? "active" : ""}`}
                onClick={() => setViewMode("terminal")}
                title="Terminal Command Execution View"
              >
                <FaTerminal /> Command Stream
              </button>
            </div>
          </div>
          <h1>System Logs & Audit Trail</h1>
          <p>Real-time audit records, command executions, system diagnostics, and operational tracking</p>
        </div>

        {/* 7-Day / Capacity Download Alert Banner */}
        {stats.shouldPromptDownload && (
          <div className="syslogs-alert-banner">
            <div className="syslogs-alert-left">
              <div className="syslogs-alert-icon">
                <FaBell />
              </div>
              <div className="syslogs-alert-text">
                <div className="syslogs-alert-title">
                  Log Archive Recommendation
                </div>
                <div className="syslogs-alert-desc">
                  System logs have accumulated ({stats.totalLogs} / {stats.maxLogsLimit || 500} records,{" "}
                  {stats.daysSinceLastDownload >= 999
                    ? "never downloaded"
                    : `running for ${stats.daysSinceLastDownload} days`}
                  ). We recommend archiving logs to keep the system fast and retain history.
                </div>
              </div>
            </div>
            <div className="syslogs-alert-actions">
              <button className="syslogs-btn-download-alert" onClick={handleExportCSV}>
                <FaFileDownload /> Download CSV
              </button>
              <button className="syslogs-btn-download-alert secondary" onClick={handleExportJSON}>
                JSON
              </button>
              <button
                className="syslogs-btn-dismiss"
                onClick={handleMarkDownloaded}
                title="Mark as downloaded and reset 7-day notification timer"
              >
                Dismiss & Reset
              </button>
            </div>
          </div>
        )}

        {/* Stats & Capacity Row */}
        <div className="syslogs-stats-grid">
          {/* Storage Capacity Card */}
          <div className="syslogs-stat-card capacity">
            <div className="syslogs-stat-info" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="syslogs-stat-label">Storage Capacity</div>
                <button
                  className="syslogs-config-link"
                  onClick={() => setShowSettingsModal(true)}
                  title="Configure max limit & auto-delete"
                >
                  <FaCog /> Configure
                </button>
              </div>
              <div className="syslogs-stat-val" style={{ fontSize: "1.35rem" }}>
                {stats.totalLogs} / {stats.maxLogsLimit || 500}{" "}
                <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#64748b" }}>
                  ({stats.capacityPercent || 0}%)
                </span>
              </div>
              <div className="syslogs-progress-bar-bg">
                <div
                  className="syslogs-progress-bar-fill"
                  style={{
                    width: `${Math.min(100, stats.capacityPercent || 0)}%`,
                    backgroundColor:
                      stats.capacityPercent > 85
                        ? "#dc2626"
                        : stats.capacityPercent > 65
                        ? "#d97706"
                        : "#2563eb",
                  }}
                />
              </div>
              <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "4px" }}>
                {stats.autoDeleteEnabled !== false
                  ? `Auto-delete oldest logs when > ${stats.maxLogsLimit || 500}`
                  : "Auto-deletion disabled"}
              </div>
            </div>
          </div>

          <div className="syslogs-stat-card total">
            <div className="syslogs-stat-info">
              <div className="syslogs-stat-label">Total Filtered</div>
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

          <div className="syslogs-stat-card health">
            <div className="syslogs-stat-info">
              <div className="syslogs-stat-label">System Health</div>
              <div
                className="syslogs-stat-val"
                style={{
                  fontSize: "1.25rem",
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
              <button className="syslogs-btn" onClick={handleExportCSV} title="Export as CSV">
                <FaFileDownload /> CSV
              </button>
              <button className="syslogs-btn" onClick={handleExportJSON} title="Export as JSON">
                <FaCodeBranch /> JSON
              </button>
              <button className="syslogs-btn" onClick={handleExportLogStream} title="Export as raw .log file">
                <FaTerminal /> .LOG
              </button>
              <button
                className="syslogs-btn"
                onClick={() => setShowSettingsModal(true)}
                title="Configure 500 limit & auto-delete"
              >
                <FaCog /> Settings
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
                  placeholder="Search commands, actions, messages, users, IPs..."
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
                Auto-Refresh (10s)
              </label>
            </div>
          </div>
        </div>

        {/* View Mode 1: TERMINAL COMMAND STREAM VIEW */}
        {viewMode === "terminal" ? (
          <div className="syslogs-terminal-wrapper">
            <div className="syslogs-terminal-bar">
              <div className="syslogs-terminal-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="syslogs-terminal-title">
                ⚡ BMS Live Command Execution Stream (Max: {stats.maxLogsLimit || 500} items)
              </div>
              <div className="syslogs-terminal-actions">
                <button onClick={handleCopyTerminal} title="Copy command stream">
                  <FaCopy /> Copy
                </button>
              </div>
            </div>
            <div className="syslogs-terminal-console" ref={terminalConsoleRef}>
              {loading ? (
                <div className="syslogs-terminal-line info">
                  [SYSTEM] Initializing and streaming log events...
                </div>
              ) : logs.length === 0 ? (
                <div className="syslogs-terminal-line warn">
                  [SYSTEM] No commands or log events recorded matching the current filter.
                </div>
              ) : (
                logs.map((log) => {
                  const dateStr = new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 19);
                  const lvl = log.level || "INFO";
                  const reqStr = log.url && log.url !== "-" ? `${log.method} ${log.url}` : "";
                  const userStr = log.user?.name || "System";
                  const ipStr = log.ip && log.ip !== "-" ? log.ip : "";

                  return (
                    <div
                      key={log._id}
                      className={`syslogs-terminal-line ${lvl.toLowerCase()}`}
                      onClick={() => setSelectedLog(log)}
                      title="Click to view full event details"
                    >
                      <span className="term-time">[{dateStr}]</span>{" "}
                      <span className={`term-level ${lvl.toLowerCase()}`}>[{lvl}]</span>{" "}
                      <span className="term-cat">[{log.category || "General"}]</span>{" "}
                      <span className="term-action">CMD: {log.action}</span>{" "}
                      {reqStr && <span className="term-route">{reqStr}</span>}{" "}
                      <span className="term-user">@{userStr}{ipStr ? `(${ipStr})` : ""}</span>{" "}
                      <span className="term-msg">➜ {log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* View Mode 2: AUDIT TABLE VIEW */
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
                    <th>Command / Action & Description</th>
                    <th>User</th>
                    <th>IP / Endpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      title="Click to view full log details"
                    >
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
                            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                              ({log.user.role})
                            </span>
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
        )}

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
                      Metadata & Execution Payload:
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

        {/* Configure Limit & Retention Modal */}
        {showSettingsModal && (
          <div className="syslogs-modal-overlay" onClick={() => setShowSettingsModal(false)}>
            <div className="syslogs-modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
              <div className="syslogs-modal-header">
                <h2>Configure Log Capacity & Limits</h2>
                <button className="syslogs-modal-close" onClick={() => setShowSettingsModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSaveSettings} className="syslogs-modal-body">
                <div>
                  <label style={{ display: "block", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                    Max Logs Capacity Limit (Default: 500)
                  </label>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "8px" }}>
                    Sets the maximum allowed log records before older logs are automatically deleted (FIFO).
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    {[200, 500, 1000, 2000].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        className={`syslogs-pill ${settings.maxLogsLimit === preset ? "active" : ""}`}
                        onClick={() => setSettings({ ...settings, maxLogsLimit: preset })}
                      >
                        {preset} Logs
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="50"
                    max="10000"
                    value={settings.maxLogsLimit}
                    onChange={(e) => setSettings({ ...settings, maxLogsLimit: Number(e.target.value) })}
                    className="syslogs-search-input"
                    style={{ width: "100%", paddingLeft: "12px" }}
                    required
                  />
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={settings.autoDeleteEnabled}
                      onChange={(e) => setSettings({ ...settings, autoDeleteEnabled: e.target.checked })}
                    />
                    <div>
                      <strong style={{ display: "block", color: "#1e293b", fontSize: "0.9rem" }}>
                        Auto-Delete Oldest Logs
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Automatically purge oldest entries when total exceeds {settings.maxLogsLimit}.
                      </span>
                    </div>
                  </label>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <label style={{ display: "block", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                    Download Reminder Alert Frequency (Days)
                  </label>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "6px" }}>
                    Prompt admin to download & archive logs every X days (default: 7 days).
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.alertFrequencyDays}
                    onChange={(e) => setSettings({ ...settings, alertFrequencyDays: Number(e.target.value) })}
                    className="syslogs-search-input"
                    style={{ width: "100%", paddingLeft: "12px" }}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                  <button type="button" className="syslogs-btn" onClick={() => setShowSettingsModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="syslogs-btn refresh" disabled={savingSettings}>
                    {savingSettings ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
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
