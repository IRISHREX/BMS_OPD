import React, { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import {
  playSaveSound,
  playDeleteSound,
  playSettledSound,
  playClickSound,
} from "../utils/soundUtils";
import {
  FaHandshake,
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaMoneyBillWave,
  FaTrash,
  FaEdit,
  FaUserCheck,
  FaClock,
  FaTimesCircle,
  FaCalendarAlt,
  FaSync,
  FaCheckDouble,
  FaArrowRight,
  FaExclamationTriangle,
  FaUserTie,
  FaHospitalUser,
} from "react-icons/fa";
import "./ReferralsTable.css";

const ReferralsTable = () => {
  const snackbar = useSnackbar();

  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payoutFilter, setPayoutFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all"); // 'all', 'signed_in', 'regular'

  // Multi-Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Edit Modal State
  const [editingReferral, setEditingReferral] = useState(null);
  const [editCommissionPercent, setEditCommissionPercent] = useState(5);
  const [editCommissionStatus, setEditCommissionStatus] = useState("pending");
  const [editStatus, setEditStatus] = useState("submitted");

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/v1/referral/all?limit=1000");
      setReferrals(data.referrals || []);
    } catch (err) {
      console.error("Error fetching referrals:", err);
      snackbar.error("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  // Filtered referrals list
  const filteredReferrals = useMemo(() => {
    return referrals.filter((item) => {
      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const refName = (item.referredByName || item.applicantName || "").toLowerCase();
        const patName = (item.patientName || "").toLowerCase();
        const docName = (item.targetDoctorName || "").toLowerCase();
        const num = (item.referralNumber || "").toLowerCase();
        const phone = (item.patientPhone || item.applicantPhone || "").toLowerCase();

        if (
          !refName.includes(q) &&
          !patName.includes(q) &&
          !docName.includes(q) &&
          !num.includes(q) &&
          !phone.includes(q)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Commission Payout filter
      if (payoutFilter !== "all") {
        const commStatus = item.commissionStatus || "pending";
        if (commStatus !== payoutFilter) return false;
      }

      // Source filter (signed_in vs regular)
      if (sourceFilter === "signed_in" && !item.referredBy) return false;
      if (sourceFilter === "regular" && item.referredBy) return false;

      return true;
    });
  }, [referrals, search, statusFilter, payoutFilter, sourceFilter]);

  // Financial & referral metrics
  const stats = useMemo(() => {
    const total = referrals.length;
    const completed = referrals.filter((r) => r.status === "completed").length;
    let totalCommission = 0;
    let paidCommission = 0;
    let pendingCommission = 0;

    referrals.forEach((r) => {
      const amt = Number(r.commissionAmount) || 0;
      if (r.commissionStatus === "paid") {
        paidCommission += amt;
        totalCommission += amt;
      } else if (r.commissionStatus === "calculated") {
        pendingCommission += amt;
        totalCommission += amt;
      } else if (r.status === "completed") {
        // Uncalculated completed: estimated at 5% of 500 = 25
        const est = Math.round((500 * (r.commissionPercent || 5)) / 100);
        pendingCommission += est;
        totalCommission += est;
      }
    });

    return { total, completed, totalCommission, paidCommission, pendingCommission };
  }, [referrals]);

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReferrals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReferrals.map((r) => r._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Convert to Appointment
  const handleConvert = async (referralId) => {
    try {
      setActionLoading(true);
      const { data } = await api.post(`/api/v1/referral/${referralId}/convert-to-appointment`);
      if (data.success) {
        snackbar.success("Referral converted to official appointment successfully!");
        playSaveSound();
        await fetchReferrals();
      }
    } catch (err) {
      snackbar.error(err.response?.data?.message || "Failed to convert referral");
    } finally {
      setActionLoading(false);
    }
  };

  // Single Pay Commission
  const handlePayCommission = async (referral) => {
    snackbar.confirm(
      `Confirm paying commission of ₹${referral.commissionAmount || Math.round((500 * (referral.commissionPercent || 5)) / 100)} to ${referral.referredByName || referral.applicantName || "Referrer"}?`,
      async () => {
        try {
          setActionLoading(true);
          const { data } = await api.post(`/api/v1/referral/${referral._id}/pay`);
          if (data.success) {
            snackbar.success(data.message || "Commission paid successfully!");
            playSettledSound();
            await fetchReferrals();
          }
        } catch (err) {
          snackbar.error(err.response?.data?.message || "Payment failed");
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Bulk Auto-Pay Selected
  const handleBulkPay = async () => {
    if (selectedIds.length === 0) return;
    snackbar.confirm(
      `Are you sure you want to mark commission as Paid for ${selectedIds.length} selected referrals?`,
      async () => {
        try {
          setActionLoading(true);
          const { data } = await api.post("/api/v1/referral/bulk-pay", {
            referralIds: selectedIds,
          });
          if (data.success) {
            snackbar.success(data.message || "Bulk payouts processed!");
            playSettledSound();
            setSelectedIds([]);
            await fetchReferrals();
          }
        } catch (err) {
          snackbar.error(err.response?.data?.message || "Bulk payout failed");
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Bulk Delete Selected
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    snackbar.confirm(
      `Danger: Are you sure you want to permanently delete ${selectedIds.length} selected referrals?`,
      async () => {
        try {
          setActionLoading(true);
          const { data } = await api.post("/api/v1/referral/bulk-delete", {
            referralIds: selectedIds,
          });
          if (data.success) {
            snackbar.success(data.message || "Selected referrals deleted");
            playDeleteSound();
            setSelectedIds([]);
            await fetchReferrals();
          }
        } catch (err) {
          snackbar.error(err.response?.data?.message || "Bulk delete failed");
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Single Delete
  const handleDelete = (id) => {
    snackbar.confirm("Are you sure you want to delete this referral record?", async () => {
      try {
        setActionLoading(true);
        await api.delete(`/api/v1/referral/delete/${id}`);
        snackbar.success("Referral deleted successfully");
        playDeleteSound();
        await fetchReferrals();
      } catch (err) {
        snackbar.error(err.response?.data?.message || "Failed to delete");
      } finally {
        setActionLoading(false);
      }
    });
  };

  // Open Edit Modal
  const openEditModal = (ref) => {
    playClickSound();
    setEditingReferral(ref);
    setEditCommissionPercent(ref.commissionPercent !== undefined ? ref.commissionPercent : 5);
    setEditCommissionStatus(ref.commissionStatus || "pending");
    setEditStatus(ref.status || "submitted");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReferral) return;

    try {
      setActionLoading(true);
      // Update commission & status
      await api.put(`/api/v1/referral/${editingReferral._id}/commission`, {
        commissionPercent: Number(editCommissionPercent),
        commissionStatus: editCommissionStatus,
      });

      if (editStatus !== editingReferral.status) {
        await api.put(`/api/v1/referral/${editingReferral._id}/status`, {
          status: editStatus,
        });
      }

      snackbar.success("Referral & commission updated successfully!");
      playSaveSound();
      setEditingReferral(null);
      await fetchReferrals();
    } catch (err) {
      snackbar.error(err.response?.data?.message || "Failed to update referral");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="referrals-table-container">
      {/* Top Banner & Header */}
      <div className="referrals-header">
        <div>
          <h2 className="referrals-title">
            <FaHandshake className="title-icon" /> Referral Management & Commission Payouts
          </h2>
          <p className="referrals-subtitle">
            Track referral partners from the website and clinic, manage commission percentages, and process instant payouts upon patient consultation completion.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchReferrals}
          disabled={loading}
          className="btn-refresh"
          title="Refresh table"
        >
          <FaSync className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Metric Cards Bar */}
      <div className="referrals-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box total">
            <FaHospitalUser />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Referrals</span>
            <span className="metric-value">{stats.total}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box completed">
            <FaCheckCircle />
          </div>
          <div className="metric-info">
            <span className="metric-label">Completed Consults</span>
            <span className="metric-value green">{stats.completed}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box commission">
            <FaMoneyBillWave />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Commission</span>
            <span className="metric-value blue">₹{stats.totalCommission}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box paid">
            <FaUserCheck />
          </div>
          <div className="metric-info">
            <span className="metric-label">Paid Out</span>
            <span className="metric-value green">₹{stats.paidCommission}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box pending">
            <FaClock />
          </div>
          <div className="metric-info">
            <span className="metric-label">Pending Payouts</span>
            <span className="metric-value orange">₹{stats.pendingCommission}</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="referrals-toolbar">
        <div className="toolbar-search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search referrer, patient, doctor, phone, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="clear-search">
              &times;
            </button>
          )}
        </div>

        <div className="toolbar-filters">
          <div className="filter-item">
            <label>Patient Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Payout Status:</label>
            <select value={payoutFilter} onChange={(e) => setPayoutFilter(e.target.value)}>
              <option value="all">All Payouts</option>
              <option value="pending">Pending</option>
              <option value="calculated">Calculated (Ready)</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Referrer Type:</label>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="all">All Sources</option>
              <option value="signed_in">Signed-In Partner</option>
              <option value="regular">Guest / Regular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Multi-Selection Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-banner">
          <div className="bulk-selection-count">
            <FaCheckDouble style={{ marginRight: 6 }} />
            <span>{selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected</span>
          </div>

          <div className="bulk-buttons-group">
            <button
              type="button"
              onClick={handleBulkPay}
              disabled={actionLoading}
              className="btn-bulk-pay"
            >
              <FaMoneyBillWave style={{ marginRight: 6 }} /> Auto-Pay Selected
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="btn-bulk-delete"
            >
              <FaTrash style={{ marginRight: 6 }} /> Delete Selected
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="btn-bulk-clear"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Referrals Data Table */}
      <div className="table-responsive-wrapper">
        <table className="referrals-data-table">
          <thead>
            <tr>
              <th style={{ width: "40px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={
                    filteredReferrals.length > 0 &&
                    selectedIds.length === filteredReferrals.length
                  }
                  onChange={toggleSelectAll}
                  aria-label="Select all referrals"
                />
              </th>
              <th>Referral Name / Partner</th>
              <th>Patient Information</th>
              <th>Doctor & Department</th>
              <th>Patient Status</th>
              <th>Commission %</th>
              <th>Commission Amount</th>
              <th>Payout Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="table-empty-cell">
                  Loading referrals...
                </td>
              </tr>
            ) : filteredReferrals.length === 0 ? (
              <tr>
                <td colSpan="9" className="table-empty-cell">
                  No referrals found matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredReferrals.map((r) => {
                const isSelected = selectedIds.includes(r._id);
                const isCompleted = r.status === "completed";
                const isPaid = r.commissionStatus === "paid";
                const isSignedIn = Boolean(r.referredBy);
                const referrerName = r.referredByName || r.applicantName || "Guest / Direct";
                const commAmt =
                  r.commissionAmount ||
                  (isCompleted ? Math.round((500 * (r.commissionPercent || 5)) / 100) : 0);

                return (
                  <tr key={r._id} className={isSelected ? "row-selected" : ""}>
                    {/* Checkbox */}
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(r._id)}
                        aria-label={`Select referral ${r.referralNumber}`}
                      />
                    </td>

                    {/* Referrer Name */}
                    <td>
                      <div className="referrer-cell">
                        <span className="referrer-name">{referrerName}</span>
                        <div className="referrer-badges">
                          {isSignedIn ? (
                            <span className="badge-source signed-in" title="Logged in Partner Account">
                              <FaUserTie size={10} style={{ marginRight: 3 }} /> Partner (Signed In)
                            </span>
                          ) : (
                            <span className="badge-source regular" title="Website Guest / Patient Request">
                              Regular / Guest
                            </span>
                          )}
                          {r.applicantPhone && (
                            <span className="referrer-phone">{r.applicantPhone}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td>
                      <div className="patient-cell">
                        <span className="patient-name">{r.patientName}</span>
                        <span className="patient-meta">
                          {r.referralNumber || r._id.substring(0, 8)} • {r.gender}, {r.age || "N/A"} yrs
                        </span>
                        {r.patientPhone && <span className="patient-phone">{r.patientPhone}</span>}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td>
                      <div className="doctor-cell">
                        <span className="doc-name">{r.targetDoctorName || "Unassigned"}</span>
                        <span className="doc-dept">{r.department || "General OPD"}</span>
                      </div>
                    </td>

                    {/* Patient Status */}
                    <td>
                      <span className={`status-pill status-${r.status || "submitted"}`}>
                        {r.status || "submitted"}
                      </span>
                    </td>

                    {/* Commission % */}
                    <td>
                      <span className="commission-pct-badge">
                        {r.commissionPercent !== undefined ? r.commissionPercent : 5}%
                      </span>
                    </td>

                    {/* Commission Amount */}
                    <td>
                      <div className="commission-amt-cell">
                        <span className="amt-value">₹{commAmt}</span>
                        {!isCompleted && !isPaid && (
                          <small className="amt-hint">Upon completion</small>
                        )}
                      </div>
                    </td>

                    {/* Payout Status */}
                    <td>
                      <span className={`payout-pill payout-${r.commissionStatus || "pending"}`}>
                        {r.commissionStatus === "paid"
                          ? "✓ Paid"
                          : r.commissionStatus === "calculated"
                          ? "Ready to Pay"
                          : "Pending"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <div className="row-actions-group">
                        {/* Pay Button */}
                        {isCompleted && !isPaid && (
                          <button
                            type="button"
                            onClick={() => handlePayCommission(r)}
                            disabled={actionLoading}
                            className="btn-table-pay"
                            title="Pay Commission Now"
                          >
                            <FaMoneyBillWave /> Pay
                          </button>
                        )}

                        {/* Convert to Appointment */}
                        {!r.convertedToAppointment && (
                          <button
                            type="button"
                            onClick={() => handleConvert(r._id)}
                            disabled={actionLoading}
                            className="btn-table-convert"
                            title="Schedule as Appointment"
                          >
                            <FaArrowRight /> Convert
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          className="btn-table-edit"
                          title="Edit Commission & Status"
                        >
                          <FaEdit />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(r._id)}
                          disabled={actionLoading}
                          className="btn-table-delete"
                          title="Delete Referral"
                        >
                          <FaTrash />
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

      {/* Edit Referral & Commission Modal */}
      {editingReferral && (
        <div className="ref-modal-backdrop" onClick={() => setEditingReferral(null)}>
          <div className="ref-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ref-modal-header">
              <h3>
                <FaEdit style={{ marginRight: 8, color: "#0284c7" }} /> Edit Referral & Commission
              </h3>
              <button
                type="button"
                onClick={() => setEditingReferral(null)}
                className="ref-modal-close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="ref-modal-form">
              <div className="modal-info-banner">
                <div>
                  <strong>Referrer:</strong> {editingReferral.referredByName || editingReferral.applicantName || "Guest"}
                </div>
                <div>
                  <strong>Patient:</strong> {editingReferral.patientName} ({editingReferral.referralNumber || editingReferral._id.substring(0, 8)})
                </div>
              </div>

              {/* Commission Percentage */}
              <div className="ref-form-group">
                <label>Commission Percentage (%) *</label>
                <div className="input-suffix-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editCommissionPercent}
                    onChange={(e) => setEditCommissionPercent(e.target.value)}
                    required
                  />
                  <span className="suffix">%</span>
                </div>
                <small className="help-text">
                  Standard referral commission on doctor consultation bill.
                </small>
              </div>

              {/* Patient Status */}
              <div className="ref-form-group">
                <label>Referral Clinical Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="submitted">Submitted</option>
                  <option value="under-review">Under Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed (Eligible for Commission)</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Commission Payout Status */}
              <div className="ref-form-group">
                <label>Commission Payout Status</label>
                <select
                  value={editCommissionStatus}
                  onChange={(e) => setEditCommissionStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="calculated">Calculated (Ready)</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="ref-modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingReferral(null)}
                  className="btn-ref-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-ref-save"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralsTable;
