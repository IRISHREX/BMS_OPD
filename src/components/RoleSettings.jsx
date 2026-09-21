import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import useClickSound from "../hooks/useClickSound";
import {
  FaTrashAlt,
  FaEye,
  FaKey,
  FaUserShield,
  FaUserMd,
  FaUserNurse,
  FaUserInjured,
  FaUsers,
  FaSearch,
  FaTimes,
  FaCopy,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { IoRefresh } from "react-icons/io5";
import { MdArrowBack } from "react-icons/md";
import "./RoleSettings.css";

const ROLE_OPTIONS = ["Admin", "Doctor", "Compounder", "Patient"];

// Change Password Modal
const ChangePasswordModal = ({ isOpen, userId, userName, onClose, onSuccess }) => {
  const snackbar = useSnackbar();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      snackbar.error("Password must be at least 8 characters long!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/api/v1/user/change-password`, {
        userId,
        newPassword,
      });

      if (response.data.success) {
        snackbar.success("Password changed successfully!");
        setNewPassword("");
        onSuccess();
        onClose();
      }
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="role-modal-overlay" onClick={onClose}>
      <div className="role-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="role-modal-header">
          <h3 className="role-modal-title">
            <FaKey style={{ color: "#d97706" }} /> Change Password
          </h3>
          <button className="role-modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="role-modal-body">
            <p style={{ margin: "0 0 1rem 0", color: "#64748b", fontSize: "0.9rem" }}>
              Set a new security password for:{" "}
              <strong style={{ color: "#0f172a" }}>{userName}</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                New Password (minimum 8 characters)
              </label>
              <input
                type="password"
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div className="role-modal-footer">
            <button
              type="button"
              className="role-btn secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="role-btn primary"
              disabled={loading || !newPassword || newPassword.length < 8}
            >
              {loading ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View User Details Modal
const UserDetailsModal = ({
  user,
  onClose,
  onChangePassword,
  onDelete,
  onCopyId,
  copiedId,
}) => {
  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
  const avatarUrl = user.docAvatar ? `http://localhost:5000${user.docAvatar}` : null;
  const roleClass = (user.role || "").toLowerCase();

  return (
    <div className="role-modal-overlay" onClick={onClose}>
      <div className="role-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="role-modal-header">
          <h3 className="role-modal-title">
            <FaEye style={{ color: "var(--accent, #1a9e9b)" }} /> User Profile Details
          </h3>
          <button className="role-modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="role-modal-body">
          <div className="role-detail-hero">
            <div className="role-detail-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="role-avatar-img" />
              ) : (
                initials
              )}
            </div>
            <div className="role-detail-hero-info">
              <h3>{`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed User"}</h3>
              <div style={{ marginTop: "4px" }}>
                <span className={`role-badge ${roleClass}`}>{user.role || "User"}</span>
              </div>
              <div className="role-detail-hero-id">
                <span>ID: {user._id}</span>
                <button
                  className="role-copy-id-btn"
                  onClick={() => onCopyId(user._id)}
                  title="Copy ID"
                >
                  {copiedId === user._id ? (
                    <>
                      <FaCheck style={{ color: "#16a34a" }} /> Copied
                    </>
                  ) : (
                    <>
                      <FaCopy /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="role-detail-grid">
            <div className="role-detail-item">
              <span className="role-detail-label">Email Address</span>
              <span className="role-detail-val">{user.email || "N/A"}</span>
            </div>

            <div className="role-detail-item">
              <span className="role-detail-label">Phone Number</span>
              <span className="role-detail-val">{user.phone || "N/A"}</span>
            </div>

            <div className="role-detail-item">
              <span className="role-detail-label">National ID / NIC</span>
              <span className="role-detail-val">{user.nic || "N/A"}</span>
            </div>

            <div className="role-detail-item">
              <span className="role-detail-label">Gender</span>
              <span className="role-detail-val">{user.gender || "N/A"}</span>
            </div>

            <div className="role-detail-item">
              <span className="role-detail-label">Date of Birth</span>
              <span className="role-detail-val">
                {user.dob ? String(user.dob).slice(0, 10) : "N/A"}
              </span>
            </div>

            {user.doctorDepartment && (
              <div className="role-detail-item">
                <span className="role-detail-label">Department</span>
                <span className="role-detail-val">{user.doctorDepartment}</span>
              </div>
            )}

            <div className="role-detail-item full-width">
              <span className="role-detail-label">Registered On</span>
              <span className="role-detail-val">
                {user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="role-modal-footer">
          <button
            type="button"
            className="role-btn secondary"
            onClick={() => {
              onClose();
              onChangePassword(user);
            }}
          >
            <FaKey /> Change Password
          </button>
          <button
            type="button"
            className="role-btn danger"
            onClick={() => {
              onClose();
              onDelete(user);
            }}
          >
            <FaTrashAlt /> Delete User
          </button>
          <button type="button" className="role-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Bulk Delete Confirmation Modal
const BulkDeleteModal = ({
  isOpen,
  selectedUsers,
  currentAdminId,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen) return null;

  const willExcludeCurrentAdmin = selectedUsers.some(
    (u) => String(u._id) === String(currentAdminId),
  );
  const actualCount = willExcludeCurrentAdmin
    ? selectedUsers.length - 1
    : selectedUsers.length;

  return (
    <div className="role-modal-overlay" onClick={onClose}>
      <div className="role-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="role-modal-header">
          <h3 className="role-modal-title" style={{ color: "#b91c1c" }}>
            <FaExclamationTriangle /> Confirm Bulk Deletion
          </h3>
          <button className="role-modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="role-modal-body">
          <div className="role-bulk-warning-box">
            <FaExclamationTriangle className="role-bulk-warning-icon" />
            <div>
              <strong>Irreversible Action</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                You are about to permanently delete <strong>{actualCount}</strong> user
                account{actualCount === 1 ? "" : "s"}. Associated records such as appointments
                and compounder assignments will be unlinked or cleared.
              </p>
            </div>
          </div>

          {willExcludeCurrentAdmin && (
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1e40af",
                padding: "0.65rem 0.85rem",
                borderRadius: "8px",
                fontSize: "0.82rem",
                marginBottom: "0.75rem",
              }}
            >
              🛡️ <strong>Safety Protection:</strong> Your active administrator account is
              safeguarded and will not be deleted.
            </div>
          )}

          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>
            Selected Users ({selectedUsers.length}):
          </div>

          <div className="role-selected-list">
            {selectedUsers.map((u) => (
              <div key={u._id} className="role-selected-item">
                <span>
                  <strong>{`${u.firstName || ""} ${u.lastName || ""}`.trim() || "User"}</strong>{" "}
                  <span style={{ color: "#64748b" }}>({u.email || u.phone || u._id})</span>
                </span>
                <span className={`role-badge ${(u.role || "").toLowerCase()}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="role-modal-footer">
          <button
            type="button"
            className="role-btn secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="role-btn danger"
            onClick={onConfirm}
            disabled={isDeleting || actualCount === 0}
          >
            {isDeleting ? "Deleting..." : `Delete ${actualCount} User(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main RoleSettings Component
const RoleSettings = () => {
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const setupClickSound = useClickSound();
  const currentAdmin = useSelector((state) => state.auth?.admin);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [copiedId, setCopiedId] = useState(null);
  const [detailsModalUser, setDetailsModalUser] = useState(null);
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    userId: null,
    userName: "",
  });
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/v1/user/all`);
      setUsers(data.users || []);
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Summary KPI counts
  const kpiStats = useMemo(() => {
    const counts = {
      total: users.length,
      admin: 0,
      doctor: 0,
      compounder: 0,
      patient: 0,
    };
    users.forEach((u) => {
      const r = (u.role || "").toLowerCase();
      if (counts[r] !== undefined) {
        counts[r] += 1;
      }
    });
    return counts;
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== "All" && u.role !== roleFilter) {
        return false;
      }
      // Search query
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      const nic = (u.nic || "").toLowerCase();
      const role = (u.role || "").toLowerCase();

      return (
        fullName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        nic.includes(q) ||
        role.includes(q)
      );
    });
  }, [users, roleFilter, query]);

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const currentPageData = useMemo(() => {
    const startIdx = (page - 1) * perPage;
    return filteredUsers.slice(startIdx, startIdx + perPage);
  }, [filteredUsers, page, perPage]);

  // Selection handlers
  const handleToggleSelectAllPage = () => {
    const newSet = new Set(selectedIds);
    const currentPageIds = currentPageData.map((u) => u._id);
    const allPageSelected = currentPageIds.every((id) => newSet.has(id));

    if (allPageSelected) {
      currentPageIds.forEach((id) => newSet.delete(id));
    } else {
      currentPageIds.forEach((id) => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  const handleToggleRow = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Copy ID with feedback
  const handleCopyId = (id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      snackbar.success("User ID copied to clipboard");
    }
  };

  // Role modification
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/api/v1/user/role/${userId}`, { role: newRole });
      snackbar.success(`Role updated to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to update role");
    }
  };

  // Single User Deletion
  const handleDeleteUser = async (user) => {
    if (String(user._id) === String(currentAdmin?._id)) {
      snackbar.error("You cannot delete your own active administrator account!");
      return;
    }

    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "this user";
    if (window.confirm(`Are you sure you want to permanently delete "${userName}"?`)) {
      try {
        await api.delete(`/api/v1/user/user/${user._id}`);
        snackbar.success(`User "${userName}" deleted`);
        setUsers((prev) => prev.filter((u) => u._id !== user._id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(user._id);
          return next;
        });
      } catch (err) {
        snackbar.error(err?.response?.data?.message || "Delete failed");
      }
    }
  };

  // Bulk Deletion
  const handleConfirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    const idsToDelete = Array.from(selectedIds);

    try {
      // Backend bulk delete endpoint
      const { data } = await api.post(`/api/v1/user/bulk-delete`, {
        userIds: idsToDelete,
      });

      snackbar.success(data.message || `Deleted ${idsToDelete.length} users`);
      setUsers((prev) => prev.filter((u) => !selectedIds.has(u._id)));
      setSelectedIds(new Set());
      setBulkDeleteModalOpen(false);
    } catch (err) {
      // Fallback: parallel delete if bulk endpoint is unavailable
      try {
        const deletePromises = idsToDelete
          .filter((id) => String(id) !== String(currentAdmin?._id))
          .map((id) => api.delete(`/api/v1/user/user/${id}`));

        await Promise.all(deletePromises);
        snackbar.success(`Deleted ${deletePromises.length} user(s) successfully`);
        setUsers((prev) => prev.filter((u) => !selectedIds.has(u._id)));
        setSelectedIds(new Set());
        setBulkDeleteModalOpen(false);
      } catch (fallbackErr) {
        snackbar.error(
          err?.response?.data?.message || fallbackErr?.message || "Bulk deletion failed",
        );
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const selectedUsersList = useMemo(() => {
    return users.filter((u) => selectedIds.has(u._id));
  }, [users, selectedIds]);

  const isAllPageSelected =
    currentPageData.length > 0 &&
    currentPageData.every((u) => selectedIds.has(u._id));

  return (
    <section className="page" style={{ background: "transparent" }}>
      <div className="role-settings-container">
        {/* Header */}
        <div className="role-header-section">
          <div className="role-header-left">
            <button
              ref={setupClickSound}
              onClick={() => navigate(-1)}
              className="role-back-btn"
            >
              <MdArrowBack /> Settings
            </button>
            <div className="role-title-group">
              <h1>Role Management & Staff Directory</h1>
              <p>Manage user access permissions, review staff accounts, and perform user operations</p>
            </div>
          </div>

          <button
            ref={setupClickSound}
            onClick={fetchUsers}
            className="role-refresh-btn"
            title="Refresh directory"
            disabled={loading}
          >
            <IoRefresh className={loading ? "spin" : ""} size={18} />
          </button>
        </div>

        {/* KPI Metrics Summary Cards */}
        <div className="role-kpi-grid">
          <div
            className={`role-kpi-card all ${roleFilter === "All" ? "active" : ""}`}
            onClick={() => {
              setRoleFilter("All");
              setPage(1);
            }}
          >
            <div className="role-kpi-icon-wrap">
              <FaUsers />
            </div>
            <div className="role-kpi-info">
              <span className="role-kpi-count">{kpiStats.total}</span>
              <span className="role-kpi-label">Total Users</span>
            </div>
          </div>

          <div
            className={`role-kpi-card admin ${roleFilter === "Admin" ? "active" : ""}`}
            onClick={() => {
              setRoleFilter("Admin");
              setPage(1);
            }}
          >
            <div className="role-kpi-icon-wrap">
              <FaUserShield />
            </div>
            <div className="role-kpi-info">
              <span className="role-kpi-count">{kpiStats.admin}</span>
              <span className="role-kpi-label">Administrators</span>
            </div>
          </div>

          <div
            className={`role-kpi-card doctor ${roleFilter === "Doctor" ? "active" : ""}`}
            onClick={() => {
              setRoleFilter("Doctor");
              setPage(1);
            }}
          >
            <div className="role-kpi-icon-wrap">
              <FaUserMd />
            </div>
            <div className="role-kpi-info">
              <span className="role-kpi-count">{kpiStats.doctor}</span>
              <span className="role-kpi-label">Doctors</span>
            </div>
          </div>

          <div
            className={`role-kpi-card compounder ${roleFilter === "Compounder" ? "active" : ""}`}
            onClick={() => {
              setRoleFilter("Compounder");
              setPage(1);
            }}
          >
            <div className="role-kpi-icon-wrap">
              <FaUserNurse />
            </div>
            <div className="role-kpi-info">
              <span className="role-kpi-count">{kpiStats.compounder}</span>
              <span className="role-kpi-label">Assistants</span>
            </div>
          </div>

          <div
            className={`role-kpi-card patient ${roleFilter === "Patient" ? "active" : ""}`}
            onClick={() => {
              setRoleFilter("Patient");
              setPage(1);
            }}
          >
            <div className="role-kpi-icon-wrap">
              <FaUserInjured />
            </div>
            <div className="role-kpi-info">
              <span className="role-kpi-count">{kpiStats.patient}</span>
              <span className="role-kpi-label">Patients</span>
            </div>
          </div>
        </div>

        {/* Control Card (Filter Pills + Search) */}
        <div className="role-control-card">
          <div className="role-filter-row">
            {/* Role Filter Tabs */}
            <div className="role-tabs-wrap">
              <button
                className={`role-tab-btn ${roleFilter === "All" ? "active" : ""}`}
                onClick={() => {
                  setRoleFilter("All");
                  setPage(1);
                }}
              >
                All <span className="role-tab-badge">{kpiStats.total}</span>
              </button>
              <button
                className={`role-tab-btn ${roleFilter === "Admin" ? "active" : ""}`}
                onClick={() => {
                  setRoleFilter("Admin");
                  setPage(1);
                }}
              >
                Admin <span className="role-tab-badge">{kpiStats.admin}</span>
              </button>
              <button
                className={`role-tab-btn ${roleFilter === "Doctor" ? "active" : ""}`}
                onClick={() => {
                  setRoleFilter("Doctor");
                  setPage(1);
                }}
              >
                Doctor <span className="role-tab-badge">{kpiStats.doctor}</span>
              </button>
              <button
                className={`role-tab-btn ${roleFilter === "Compounder" ? "active" : ""}`}
                onClick={() => {
                  setRoleFilter("Compounder");
                  setPage(1);
                }}
              >
                Assistant <span className="role-tab-badge">{kpiStats.compounder}</span>
              </button>
              <button
                className={`role-tab-btn ${roleFilter === "Patient" ? "active" : ""}`}
                onClick={() => {
                  setRoleFilter("Patient");
                  setPage(1);
                }}
              >
                Patient <span className="role-tab-badge">{kpiStats.patient}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="role-search-wrap">
              <div className="role-search-box">
                <FaSearch className="role-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, NIC..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
                {query && (
                  <button
                    className="role-search-clear"
                    onClick={() => {
                      setQuery("");
                      setPage(1);
                    }}
                    title="Clear search"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Floating / Inline Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="role-bulk-bar">
              <div className="role-bulk-info">
                <span className="role-bulk-count-badge">
                  {selectedIds.size} Selected
                </span>
                <span>Actions available for selected users</span>
              </div>
              <div className="role-bulk-actions-group">
                <button
                  className="role-bulk-clear-btn"
                  onClick={handleClearSelection}
                >
                  Clear Selection
                </button>
                <button
                  className="role-bulk-delete-btn"
                  onClick={() => setBulkDeleteModalOpen(true)}
                >
                  <FaTrashAlt /> Delete Selected ({selectedIds.size})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="role-table-card">
          <div className="role-table-responsive">
            <table className="role-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      className="role-checkbox"
                      checked={isAllPageSelected}
                      onChange={handleToggleSelectAllPage}
                      title="Select all on this page"
                    />
                  </th>
                  <th>User Details</th>
                  <th>Contact Information</th>
                  <th>Assigned Role</th>
                  <th>Registered</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "3rem" }}>
                      <span className="loader" style={{ display: "inline-block" }}></span>
                      <p style={{ marginTop: "0.5rem", color: "#64748b" }}>Loading directory...</p>
                    </td>
                  </tr>
                ) : currentPageData.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="role-empty-state">
                        <FaUsers size={36} style={{ color: "#cbd5e1" }} />
                        <h3>No matching users found</h3>
                        <p>
                          Try clearing the search query or changing the active role filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((u) => {
                    const isSelected = selectedIds.has(u._id);
                    const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";
                    const avatarUrl = u.docAvatar
                      ? `http://localhost:5000${u.docAvatar}`
                      : null;
                    const roleClass = (u.role || "").toLowerCase();

                    return (
                      <tr key={u._id} className={isSelected ? "selected" : ""}>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            className="role-checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(u._id)}
                          />
                        </td>

                        <td>
                          <div className="role-user-cell">
                            <div className="role-avatar-circle">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt="Avatar"
                                  className="role-avatar-img"
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            <div className="role-user-names">
                              <span className="role-user-fullname">
                                {`${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                                  "Unnamed User"}
                              </span>
                              <span className="role-user-nic">
                                NIC: {u.nic || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="role-contact-cell">
                            <span className="role-contact-email">
                              {u.email || "No email"}
                            </span>
                            <span className="role-contact-phone">
                              {u.phone || "No phone"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="role-badge-cell">
                            <span className={`role-badge ${roleClass}`}>
                              {u.role || "User"}
                            </span>
                            <select
                              className="role-select"
                              value={u.role || "Patient"}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </td>

                        <td>
                          <div
                            className="role-actions-cell"
                            style={{ justifyContent: "flex-end" }}
                          >
                            <button
                              ref={setupClickSound}
                              className="role-action-icon-btn view"
                              title="View Details"
                              onClick={() => setDetailsModalUser(u)}
                            >
                              <FaEye />
                            </button>

                            <button
                              ref={setupClickSound}
                              className="role-action-icon-btn key"
                              title="Change Password"
                              onClick={() =>
                                setPasswordModal({
                                  isOpen: true,
                                  userId: u._id,
                                  userName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
                                })
                              }
                            >
                              <FaKey />
                            </button>

                            <button
                              ref={setupClickSound}
                              className="role-action-icon-btn delete"
                              title="Delete User"
                              onClick={() => handleDeleteUser(u)}
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="role-pagination-bar">
            <div className="role-pagination-info">
              Showing{" "}
              <strong>
                {filteredUsers.length === 0
                  ? 0
                  : (page - 1) * perPage + 1}
                -
                {Math.min(page * perPage, filteredUsers.length)}
              </strong>{" "}
              of <strong>{filteredUsers.length}</strong> users
            </div>

            <div className="role-pagination-controls">
              <button
                className="role-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>

              <span className="role-page-indicator">
                Page {page} of {pageCount}
              </span>

              <button
                className="role-page-btn"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* View Details Modal */}
        <UserDetailsModal
          user={detailsModalUser}
          onClose={() => setDetailsModalUser(null)}
          onChangePassword={(u) =>
            setPasswordModal({
              isOpen: true,
              userId: u._id,
              userName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
            })
          }
          onDelete={(u) => handleDeleteUser(u)}
          onCopyId={handleCopyId}
          copiedId={copiedId}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={passwordModal.isOpen}
          userId={passwordModal.userId}
          userName={passwordModal.userName}
          onClose={() =>
            setPasswordModal({ isOpen: false, userId: null, userName: "" })
          }
          onSuccess={fetchUsers}
        />

        {/* Bulk Delete Confirmation Modal */}
        <BulkDeleteModal
          isOpen={bulkDeleteModalOpen}
          selectedUsers={selectedUsersList}
          currentAdminId={currentAdmin?._id}
          onClose={() => setBulkDeleteModalOpen(false)}
          onConfirm={handleConfirmBulkDelete}
          isDeleting={isBulkDeleting}
        />
      </div>
    </section>
  );
};

export default RoleSettings;
