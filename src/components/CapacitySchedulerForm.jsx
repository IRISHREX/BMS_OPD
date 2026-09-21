import React, { useContext, useEffect, useState, useRef } from "react";
import { useSnackbar } from "../context/SnackbarContext";
import api from "../utils/api";
import { Context } from "../main";
import "./CapacitySchedulerForm.css";
import { FaCalendarAlt, FaEllipsisV, FaInfoCircle, FaSave, FaUserFriends, FaRegFileAlt, FaCheck, FaTachometerAlt } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

const CapacitySchedulerForm = ({
  doctorId,
  allowAdminSelfManagement = true,
}) => {
  const snackbar = useSnackbar();
  const { admin } = useContext(Context);
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [notes, setNotes] = useState("");
  const [isWorkingDay, setIsWorkingDay] = useState(true);

  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const effectiveDoctorId =
    allowAdminSelfManagement && admin?.role === "Admin" && admin?._id
      ? admin._id
      : doctorId;

  useEffect(() => {
    if (effectiveDoctorId) {
      fetchCapacities();
    }
    
    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      // If end date is provided and different from start date, use bulk
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
        // Single date
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
    setActiveDropdown(null);
  };

  const handleEditCapacity = (cap) => {
    const dateStr = cap.serviceDate.split("T")[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
    setCapacity(cap.capacity.toString());
    setNotes(cap.notes || "");
    setIsWorkingDay(cap.isWorkingDay);
    setActiveDropdown(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    snackbar.info("Edit mode active. Save changes above.");
  };

  const getCapacityPercentage = (booked, max) => {
    return max === 0 ? 0 : Math.round((booked / max) * 100);
  };

  const getCapacityStatus = (percentage) => {
    if (percentage < 50) return { status: "green", label: "Available" };
    if (percentage < 75) return { status: "yellow", label: "Almost Full" };
    return { status: "red", label: "Full" };
  };

  const getCapacityColor = (percentage) => {
    if (percentage < 50) return "#10b981"; // Emerald
    if (percentage < 75) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
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

  const filledSummary = () => {
    if (capacities.length === 0) return { days: 0, avg: 0 };
    let totalPerc = 0;
    capacities.forEach(c => {
       totalPerc += getCapacityPercentage(c.bookedCount, c.capacity);
    });
    return {
       days: capacities.length,
       avg: Math.round(totalPerc / capacities.length)
    };
  };

  const summary = filledSummary();

  return (
    <div className="capacity-scheduler-form">
      {/* Header */}
      <div className="cs-header">
        <div className="cs-header-left">
          <div className="cs-icon-box">
            <FaCalendarAlt />
          </div>
          <div>
            <h2>Capacity Schedule Manager</h2>
            <p>Set your daily patient capacity and working days</p>
          </div>
        </div>
        <div className="cs-header-right">
           <div className="cs-date-range-badge">
             <FaCalendarAlt />
             <span>{summary.days > 0 ? "Upcoming Schedule" : "No Schedule"}</span>
           </div>
        </div>
      </div>

      {/* Set Capacity Form Box */}
      <div className="cs-form-box">
        <div className="cs-form-title">
          <FiPlus /> Set New Capacity
        </div>
        <form onSubmit={handleSetCapacity} className="cs-form">
          <div className="cs-form-row">
            
            <div className="cs-form-group cs-date-group">
              <label>Date Range (or Single Day)</label>
              <div className="cs-date-inputs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getMinDate()}
                  required
                />
                <span className="cs-to">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getMinDate()}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="cs-form-group">
              <label>Max Patients</label>
              <div className="cs-capacity-input">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
                <span className="cs-range-hint">(1 - 100)</span>
              </div>
            </div>

            <div className="cs-form-group cs-notes-group">
              <label>Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Walk-ins after 2 PM..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength="200"
              />
            </div>

            <div className="cs-form-group cs-toggle-group">
              <label>Working Day</label>
              <label className="cs-switch">
                <input
                  type="checkbox"
                  checked={isWorkingDay}
                  onChange={(e) => setIsWorkingDay(e.target.checked)}
                />
                <span className="cs-slider round"></span>
              </label>
            </div>

            <div className="cs-form-group cs-submit-group">
              <button
                type="submit"
                disabled={formLoading}
                className="cs-btn-submit"
              >
                <FaSave /> {formLoading ? "Saving..." : "Set Capacity"}
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* Schedule List */}
      <div className="cs-list-box">
        <div className="cs-list-header">
          <div className="cs-list-title">
            <FaCalendarAlt /> Your Schedule
          </div>
          <div className="cs-list-summary">
            {summary.days} days • {summary.avg}% filled
          </div>
        </div>

        {loading ? (
          <p className="cs-empty">Loading schedule...</p>
        ) : capacities.length > 0 ? (
          <div className="cs-cards-container">
            {capacities.map((cap) => {
              const percentage = getCapacityPercentage(cap.bookedCount, cap.capacity);
              const { status, label } = getCapacityStatus(percentage);
              const { dayName, monthDay, year } = formatDateBox(cap.serviceDate);

              return (
                <div key={cap._id} className={`cs-card ${!cap.isWorkingDay ? 'cs-off-day' : ''}`}>
                  
                  {/* Left: Date Box */}
                  <div className="cs-card-date">
                    <span className="cs-day-name">{dayName}</span>
                    <span className="cs-month-day">{monthDay}</span>
                    <span className="cs-year">{year}</span>
                  </div>

                  {/* Middle: Details */}
                  <div className="cs-card-details">
                    <div className="cs-stats-row">
                      <div className="cs-stat-box">
                        <div className="cs-stat-title"><FaUserFriends /> SLOTS</div>
                        <div className="cs-stat-val">{cap.bookedCount} / {cap.capacity}</div>
                      </div>
                      <div className="cs-stat-box">
                        <div className="cs-stat-title"><FaTachometerAlt /> FILLED</div>
                        <div className="cs-stat-val">{percentage}%</div>
                      </div>
                      <div className="cs-stat-box cs-notes-box">
                        <div className="cs-stat-title"><FaRegFileAlt /> Notes</div>
                        <div className="cs-stat-val cs-note-text">{cap.notes || "—"}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="cs-progress-container">
                      <div className="cs-progress-bg">
                        <div
                          className="cs-progress-fill"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: getCapacityColor(percentage),
                          }}
                        ></div>
                      </div>
                      <span className={`cs-status-pill ${status}`}>
                        <span className="cs-dot"></span> {label}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="cs-card-actions" ref={activeDropdown === cap._id ? dropdownRef : null}>
                    {cap.isWorkingDay ? (
                      <span className="cs-badge-working"><FaCheck /> Working</span>
                    ) : (
                      <span className="cs-badge-off">Off Day</span>
                    )}
                    
                    <button 
                      className="cs-menu-btn"
                      onClick={() => setActiveDropdown(activeDropdown === cap._id ? null : cap._id)}
                    >
                      <FaEllipsisV />
                    </button>
                    
                    {activeDropdown === cap._id && (
                      <div className="cs-dropdown-menu">
                        <button onClick={() => handleEditCapacity(cap)}>Edit</button>
                        <button className="cs-danger" onClick={() => handleDeleteCapacity(cap._id)}>Delete</button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <p className="cs-empty">No schedule found. Add new capacity to get started.</p>
        )}
      </div>

      <div className="cs-info-tip">
        <FaInfoCircle />
        <span><strong>Tip:</strong> Set your capacity in advance to help patients see your availability. Your schedule will update automatically as appointments are booked.</span>
      </div>
    </div>
  );
};

export default CapacitySchedulerForm;
