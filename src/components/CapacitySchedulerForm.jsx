import React, { useContext, useEffect, useState } from "react";
import { useSnackbar } from "../context/SnackbarContext";
import api from "../utils/api";
import { Context } from "../main";
import "./CapacitySchedulerForm.css";
import {
  FaCalendarAlt,
  FaInfoCircle,
  FaSave,
  FaUserFriends,
  FaRegFileAlt,
  FaCheck,
  FaTachometerAlt,
  FaPlus,
  FaClock,
  FaEdit,
  FaTrashAlt,
} from "react-icons/fa";
import useClickSound from "../hooks/useClickSound";

const CapacitySchedulerForm = ({
  doctorId,
  allowAdminSelfManagement = true,
}) => {
  const snackbar = useSnackbar();
  const { admin } = useContext(Context);
  const setupClickSound = useClickSound();
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [notes, setNotes] = useState("");
  const [isWorkingDay, setIsWorkingDay] = useState(true);

  const effectiveDoctorId =
    allowAdminSelfManagement && admin?.role === "Admin" && admin?._id
      ? admin._id
      : doctorId;

  useEffect(() => {
    if (effectiveDoctorId) {
      fetchCapacities();
    }
  }, [effectiveDoctorId]);

  const fetchCapacities = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const ninetyDaysLater = new Date();
      ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

      const getDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const startStr = getDateString(today);
      const endStr = getDateString(ninetyDaysLater);

      const { data } = await api.get(`/api/v1/capacity-scheduler`, {
        params: {
          doctorId: effectiveDoctorId,
          startDate: startStr,
          endDate: endStr,
        },
      });

      if (data.success) {
        setCapacities(data.data || []);
      }
    } catch (error) {
      snackbar.error("Failed to load capacity schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleSetCapacity = async (e) => {
    e.preventDefault();

    if (!startDate) {
      snackbar.error("Please select a start date!");
      return;
    }

    if (capacity < 1 || capacity > 100) {
      snackbar.error("Capacity must be between 1 and 100!");
      return;
    }

    setFormLoading(true);
    try {
      if (endDate && endDate !== startDate) {
        const response = await api.post(`/api/v1/capacity-scheduler/set-bulk`, {
          doctorId: effectiveDoctorId,
          startDate,
          endDate,
          capacity: parseInt(capacity),
          isWorkingDay,
          notes,
        });
        if (response.data.success) {
          snackbar.success(response.data.message || "Capacity schedule updated successfully!");
        }
      } else {
        const response = await api.post(`/api/v1/capacity-scheduler/set`, {
          doctorId: effectiveDoctorId,
          serviceDate: startDate,
          capacity: parseInt(capacity),
          isWorkingDay,
          notes,
        });
        if (response.data.success) {
          snackbar.success("Capacity updated successfully!");
        }
      }

      setStartDate("");
      setEndDate("");
      setCapacity("20");
      setNotes("");
      setIsWorkingDay(true);
      fetchCapacities();
    } catch (error) {
      snackbar.error(
        error?.response?.data?.message || "Failed to set capacity"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCapacity = async (id) => {
    if (window.confirm("Are you sure you want to delete this capacity record?")) {
      try {
        const response = await api.delete(`/api/v1/capacity-scheduler/${id}`);
        if (response.data.success) {
          snackbar.success("Capacity removed successfully!");
          fetchCapacities();
        }
      } catch (error) {
        snackbar.error("Failed to delete capacity");
      }
    }
  };

  const handleEditCapacity = (cap) => {
    const dateStr = cap.serviceDate.split("T")[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
    setCapacity(cap.capacity.toString());
    setNotes(cap.notes || "");
    setIsWorkingDay(cap.isWorkingDay);
    snackbar.info("Edit mode active. Update capacity details in the form above.");
  };

  const getCapacityPercentage = (booked, max) => {
    return max === 0 ? 0 : Math.round((booked / max) * 100);
  };

  const getCapacityStatus = (percentage) => {
    if (percentage < 50) return { status: "green", label: "Available" };
    if (percentage < 75) return { status: "yellow", label: "Filling Up" };
    return { status: "red", label: "Full" };
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const formatDateBox = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00Z");
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const year = date.getFullYear();
    return { dayName, monthDay, year };
  };

  const summary = (() => {
    if (capacities.length === 0) return { days: 0, avg: 0 };
    let totalPerc = 0;
    capacities.forEach((c) => {
      totalPerc += getCapacityPercentage(c.bookedCount, c.capacity);
    });
    return {
      days: capacities.length,
      avg: Math.round(totalPerc / capacities.length),
    };
  })();

  return (
    <div className="capacity-scheduler-form">
      {/* Set Capacity Form Card */}
      <div className="cs-modern-form-box">
        <div className="cs-form-box-heading">
          <FaPlus className="cs-heading-icon" />
          <span>{startDate && endDate ? "Edit Capacity Schedule" : "Set New Capacity"}</span>
        </div>

        <form onSubmit={handleSetCapacity} className="cs-modern-form">
          {/* Row 1: Date Range, Capacity, Toggle */}
          <div className="cs-form-row top-row">
            <div className="cs-form-field date-field">
              <label>Date Range (or Single Day)</label>
              <div className="cs-date-row">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getMinDate()}
                  required
                />
                <span className="cs-date-separator">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getMinDate()}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="cs-form-field capacity-field">
              <label>Max Patients</label>
              <div className="cs-capacity-row">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
                <span className="cs-unit-hint">patients/day</span>
              </div>
            </div>

            <div className="cs-form-field toggle-field">
              <label>Working Day</label>
              <div className="cs-switch-wrap">
                <label className="cs-switch">
                  <input
                    type="checkbox"
                    checked={isWorkingDay}
                    onChange={(e) => setIsWorkingDay(e.target.checked)}
                  />
                  <span className="cs-slider round"></span>
                </label>
                <span className={`cs-toggle-status ${isWorkingDay ? "working" : "off"}`}>
                  {isWorkingDay ? "Working" : "Off Day"}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Notes & Submit Button */}
          <div className="cs-form-row bottom-row">
            <div className="cs-form-field notes-field">
              <label>Notes / Remarks (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Morning OPD only, Walk-ins after 2 PM..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength="200"
              />
            </div>

            <button
              ref={setupClickSound}
              type="submit"
              disabled={formLoading}
              className="cs-modern-submit-btn"
            >
              <FaSave />
              <span>{formLoading ? "Saving..." : "Save Schedule"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Schedule List Section */}
      <div className="cs-schedule-list-section">
        <div className="cs-list-section-header">
          <div className="cs-list-section-title">
            <FaCalendarAlt style={{ color: "var(--accent, #1a9e9b)" }} />
            <span>Configured Schedule</span>
          </div>

          <div className="cs-list-summary-badges">
            <span className="cs-badge-pill">
              <FaClock style={{ marginRight: 4 }} />
              {summary.days} {summary.days === 1 ? "Day" : "Days"} Scheduled
            </span>
            {summary.days > 0 && (
              <span className="cs-badge-pill accent-pill">
                Avg {summary.avg}% Filled
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="cs-loading-box">
            <span className="loader" />
            <p style={{ marginTop: 12, fontSize: "0.85rem" }}>Loading schedule records...</p>
          </div>
        ) : capacities.length > 0 ? (
          <div className="cs-cards-list">
            {capacities.map((cap) => {
              const percentage = getCapacityPercentage(cap.bookedCount, cap.capacity);
              const { status, label } = getCapacityStatus(percentage);
              const { dayName, monthDay, year } = formatDateBox(cap.serviceDate);

              return (
                <div
                  key={cap._id}
                  className={`cs-modern-card ${!cap.isWorkingDay ? "off-day-card" : ""}`}
                >
                  {/* Date Badge */}
                  <div className="cs-modern-date-badge">
                    <span className="cs-date-day">{dayName}</span>
                    <span className="cs-date-num">{monthDay}</span>
                    <span className="cs-date-year">{year}</span>
                  </div>

                  {/* Card Content */}
                  <div className="cs-modern-card-content">
                    <div className="cs-card-metrics-row">
                      <div className="cs-metric-chip">
                        <FaUserFriends className="cs-metric-icon" />
                        <span className="cs-metric-text">
                          <strong>{cap.bookedCount}</strong> / {cap.capacity} Booked
                        </span>
                      </div>

                      <div className="cs-metric-chip">
                        <FaTachometerAlt className="cs-metric-icon" />
                        <span className="cs-metric-text">
                          <strong>{percentage}%</strong> Filled
                        </span>
                      </div>

                      {cap.isWorkingDay ? (
                        <span className="cs-status-tag working-tag">
                          <FaCheck style={{ fontSize: "0.7rem", marginRight: 4 }} /> Working
                        </span>
                      ) : (
                        <span className="cs-status-tag off-tag">Off Day</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="cs-progress-row">
                      <div className="cs-progress-track">
                        <div
                          className={`cs-progress-fill ${status}`}
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        />
                      </div>
                      <span className={`cs-capacity-status-pill ${status}`}>
                        {label}
                      </span>
                    </div>

                    {cap.notes && (
                      <div className="cs-card-notes-line">
                        <FaRegFileAlt style={{ flexShrink: 0 }} />
                        <span>{cap.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Inline Action Buttons (No dropdown clipping) */}
                  <div className="cs-card-inline-actions">
                    <button
                      ref={setupClickSound}
                      type="button"
                      className="cs-inline-action-btn edit"
                      onClick={() => handleEditCapacity(cap)}
                      title="Edit Schedule"
                    >
                      <FaEdit />
                    </button>
                    <button
                      ref={setupClickSound}
                      type="button"
                      className="cs-inline-action-btn delete"
                      onClick={() => handleDeleteCapacity(cap._id)}
                      title="Delete Schedule"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="cs-empty-notice">
            <FaCalendarAlt style={{ fontSize: "2rem", opacity: 0.5, marginBottom: 8 }} />
            <p>No capacity records scheduled yet.</p>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Use the form above to configure working days and daily patient quotas.
            </span>
          </div>
        )}
      </div>

      <div className="cs-modern-info-tip">
        <FaInfoCircle />
        <span>
          <strong>Tip:</strong> Daily capacity limits prevent OPD overcrowding. Real-time patient counts update automatically as appointments are booked.
        </span>
      </div>
    </div>
  );
};

export default CapacitySchedulerForm;
