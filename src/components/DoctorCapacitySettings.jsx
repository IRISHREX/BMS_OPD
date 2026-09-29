import React, { useEffect, useState, useContext, useMemo } from "react";
import { useSnackbar } from "../context/SnackbarContext";
import { Context } from "../main";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  FaCalendarAlt,
  FaUserMd,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCheck,
  FaTrash,
  FaClock,
  FaBan,
  FaLayerGroup,
  FaCheckSquare,
  FaRegSquare,
} from "react-icons/fa";
import "./DoctorCapacitySettings.css";

const DoctorCapacitySettings = ({ doctorId: initialDoctorId }) => {
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const { admin } = useContext(Context);

  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    initialDoctorId || (admin?.role === "Doctor" ? admin._id : "")
  );
  const [doctors, setDoctors] = useState([]);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]); // Array of 'YYYY-MM-DD' strings

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDateItem, setActiveDateItem] = useState(null); // Existing capacity object if any
  const [modalCapacity, setModalCapacity] = useState(20);
  const [modalIsWorkingDay, setModalIsWorkingDay] = useState(true);
  const [modalNotes, setModalNotes] = useState("");

  // Fetch doctors list for Admin
  useEffect(() => {
    if (admin?.role === "Admin") {
      (async () => {
        try {
          const { data } = await api.get("/api/v1/user/doctors");
          const docs = data.doctors || [];
          setDoctors(docs);
          if (!selectedDoctorId && docs.length > 0) {
            setSelectedDoctorId(docs[0]._id);
          }
        } catch (e) {
          console.error("Failed to load doctors list:", e);
        }
      })();
    }
  }, [admin]);

  // Fetch capacities for selected doctor
  const fetchCapacities = async () => {
    try {
      setLoading(true);
      const docId = selectedDoctorId || (admin?.role === "Doctor" ? admin._id : "");
      if (!docId) {
        setCapacities([]);
        return;
      }
      const { data } = await api.get(`/api/v1/capacity-scheduler?doctorId=${docId}`);
      setCapacities(data.capacities || data.data || []);
    } catch (error) {
      console.error("Error fetching capacities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacities();
  }, [selectedDoctorId]);

  // Map capacities by date string 'YYYY-MM-DD'
  const capacityMap = useMemo(() => {
    const map = {};
    (capacities || []).forEach((c) => {
      const rawDate = c.serviceDate || c.date;
      if (rawDate) {
        const key = typeof rawDate === "string" ? rawDate.slice(0, 10) : new Date(rawDate).toISOString().slice(0, 10);
        map[key] = c;
      }
    });
    return map;
  }, [capacities]);

  // Helper date format YYYY-MM-DD
  const formatDateKey = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete grid of 35 or 42
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Click on date tile
  const handleDateClick = (dayObj) => {
    const { dateKey } = dayObj;

    if (isMultiSelectMode) {
      // Toggle date in selectedDates
      setSelectedDates((prev) =>
        prev.includes(dateKey) ? prev.filter((d) => d !== dateKey) : [...prev, dateKey]
      );
    } else {
      // Open modal for single date
      openModalForDates([dateKey]);
    }
  };

  // Open modal
  const openModalForDates = (dates) => {
    if (!dates || dates.length === 0) return;

    if (dates.length === 1) {
      const existing = capacityMap[dates[0]];
      setActiveDateItem(existing || null);
      setModalCapacity(existing?.capacity !== undefined ? existing.capacity : 20);
      setModalIsWorkingDay(existing?.isWorkingDay !== undefined ? existing.isWorkingDay : true);
      setModalNotes(existing?.notes || "");
    } else {
      setActiveDateItem(null);
      setModalCapacity(20);
      setModalIsWorkingDay(true);
      setModalNotes("");
    }

    setSelectedDates(dates);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (!isMultiSelectMode) {
      setSelectedDates([]);
    }
    setActiveDateItem(null);
  };

  // Save Capacity from Modal
  const handleSaveModal = async (e) => {
    e.preventDefault();
    const docId = selectedDoctorId || (admin?.role === "Doctor" ? admin._id : "");
    if (!docId) {
      snackbar.error("Doctor is required");
      return;
    }

    if (!selectedDates.length) {
      snackbar.error("No dates selected");
      return;
    }

    try {
      setModalLoading(true);
      const capNum = parseInt(modalCapacity, 10) || 20;

      if (selectedDates.length === 1) {
        // Single date save
        await api.post("/api/v1/capacity-scheduler/set", {
          doctorId: docId,
          serviceDate: selectedDates[0],
          capacity: capNum,
          maxPatients: capNum,
          isWorkingDay: modalIsWorkingDay,
          notes: modalNotes.trim(),
        });
        snackbar.success(`Capacity saved for ${selectedDates[0]}`);
      } else {
        // Multi-date bulk save
        await api.post("/api/v1/capacity-scheduler/set-bulk", {
          doctorId: docId,
          dates: selectedDates,
          capacity: capNum,
          maxPatients: capNum,
          isWorkingDay: modalIsWorkingDay,
          notes: modalNotes.trim(),
        });
        snackbar.success(`Capacity saved across ${selectedDates.length} dates successfully!`);
        setSelectedDates([]);
        setIsMultiSelectMode(false);
      }

      await fetchCapacities();
      closeModal();
    } catch (err) {
      snackbar.error(err.response?.data?.message || "Failed to update capacity");
    } finally {
      setModalLoading(false);
    }
  };

  // Delete single capacity override
  const handleDeleteCapacity = async () => {
    if (!activeDateItem?._id) return;

    snackbar.confirm("Are you sure you want to remove this capacity configuration?", async () => {
      try {
        setModalLoading(true);
        await api.delete(`/api/v1/capacity-scheduler/${activeDateItem._id}`);
        snackbar.success("Capacity removed successfully");
        await fetchCapacities();
        closeModal();
      } catch (err) {
        snackbar.error(err.response?.data?.message || "Failed to delete capacity");
      } finally {
        setModalLoading(false);
      }
    });
  };

  const todayKey = formatDateKey(new Date());

  // Metrics summary
  const totalConfigured = Object.keys(capacityMap).length;
  const totalWorkingDays = Object.values(capacityMap).filter((c) => c.isWorkingDay).length;

  return (
    <section className="page">
      <div className="settings-page">
        {/* Navigation back */}
        <button onClick={() => navigate(-1)} className="back-btn add-btn" style={{ marginBottom: "1rem" }}>
          <FaArrowLeft style={{ marginRight: 6 }} /> Go Back
        </button>

        <div className="doctor-capacity-card">
          {/* Header & Doctor Switcher */}
          <div className="capacity-header-row">
            <div>
              <h2 className="capacity-title">
                <FaCalendarAlt className="header-icon" /> Doctor Daily Capacity Calendar
              </h2>
              <p className="capacity-subtitle">
                Interactive calendar to manage daily appointment limits, schedule off-days, and configure multi-date capacity.
              </p>
            </div>

            {admin?.role === "Admin" && doctors.length > 0 && (
              <div className="doctor-select-box">
                <FaUserMd className="doc-icon" />
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setSelectedDates([]);
                  }}
                  className="doctor-dropdown"
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      Dr. {d.firstName} {d.lastName} ({d.doctorDepartment || d.specialization || "General"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="capacity-stats-bar">
            <div className="stat-pill">
              <span className="stat-label">Configured Dates:</span>
              <span className="stat-value">{totalConfigured}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Active Working Days:</span>
              <span className="stat-value green">{totalWorkingDays}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Off-Days Scheduled:</span>
              <span className="stat-value red">{totalConfigured - totalWorkingDays}</span>
            </div>
          </div>

          {/* Calendar Toolbar */}
          <div className="calendar-controls-row">
            <div className="month-navigation">
              <button type="button" onClick={prevMonth} className="btn-nav" title="Previous Month">
                <FaChevronLeft />
              </button>
              <span className="month-label">
                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button type="button" onClick={nextMonth} className="btn-nav" title="Next Month">
                <FaChevronRight />
              </button>
              <button type="button" onClick={goToToday} className="btn-today">
                Today
              </button>
            </div>

            <div className="selection-actions">
              <button
                type="button"
                onClick={() => {
                  setIsMultiSelectMode(!isMultiSelectMode);
                  if (isMultiSelectMode) setSelectedDates([]);
                }}
                className={`btn-mode-toggle ${isMultiSelectMode ? "active" : ""}`}
              >
                {isMultiSelectMode ? <FaCheckSquare /> : <FaRegSquare />}
                <span>{isMultiSelectMode ? "Multi-Select Active" : "Multi-Select Mode"}</span>
              </button>

              {isMultiSelectMode && selectedDates.length > 0 && (
                <button
                  type="button"
                  onClick={() => openModalForDates(selectedDates)}
                  className="btn-apply-bulk"
                >
                  <FaLayerGroup /> Set Capacity for {selectedDates.length} Date{selectedDates.length > 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>

          {/* Multi-select informative banner */}
          {isMultiSelectMode && (
            <div className="multi-select-banner">
              <span>
                💡 <strong>Multi-select mode is ON:</strong> Click on dates in the calendar to select multiple days, then click <strong>Set Capacity</strong> above to apply limits all at once.
              </span>
              {selectedDates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDates([])}
                  className="btn-clear-selection"
                >
                  Clear Selection ({selectedDates.length})
                </button>
              )}
            </div>
          )}

          {/* Calendar Grid */}
          <div className="calendar-grid-container">
            {/* Weekday headers */}
            <div className="weekdays-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="weekday-header">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="days-grid">
              {calendarDays.map((dayObj) => {
                const { date, dateKey, isCurrentMonth } = dayObj;
                const cap = capacityMap[dateKey];
                const isSelected = selectedDates.includes(dateKey);
                const isToday = dateKey === todayKey;

                let capClass = "no-capacity";
                let capBadge = null;

                if (cap) {
                  if (!cap.isWorkingDay) {
                    capClass = "off-day";
                    capBadge = (
                      <span className="badge-off">
                        <FaBan className="badge-icon" /> Off Day
                      </span>
                    );
                  } else {
                    const maxCap = Number(cap.capacity || 20);
                    const booked = Number(cap.bookedCount || 0);
                    const pct = Math.round((booked / maxCap) * 100);

                    if (pct >= 80) capClass = "cap-red";
                    else if (pct >= 50) capClass = "cap-yellow";
                    else capClass = "cap-green";

                    capBadge = (
                      <span className="badge-capacity">
                        <strong>{maxCap}</strong> Max {booked > 0 ? `(${booked} booked)` : "Slots"}
                      </span>
                    );
                  }
                }

                return (
                  <div
                    key={dateKey}
                    onClick={() => handleDateClick(dayObj)}
                    className={`calendar-day-tile ${isCurrentMonth ? "current-month" : "other-month"} ${capClass} ${isSelected ? "selected-tile" : ""} ${isToday ? "today-tile" : ""}`}
                  >
                    <div className="tile-top">
                      <span className="day-number">{date.getDate()}</span>
                      {isToday && <span className="today-chip">Today</span>}
                      {isMultiSelectMode && (
                        <span className={`select-check ${isSelected ? "checked" : ""}`}>
                          {isSelected ? <FaCheck /> : null}
                        </span>
                      )}
                    </div>

                    <div className="tile-body">
                      {capBadge}
                      {cap?.notes && (
                        <div className="tile-note" title={cap.notes}>
                          <FaClock style={{ marginRight: 3 }} /> {cap.notes}
                        </div>
                      )}
                      {!cap && isCurrentMonth && (
                        <span className="tile-empty-hint">+ Set</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar Color Legend */}
          <div className="calendar-legend-bar">
            <div className="legend-item">
              <span className="legend-dot green"></span>
              <span>Available (&lt;50% booked)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot yellow"></span>
              <span>Moderate (50-75%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot red"></span>
              <span>Full (&gt;75%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot gray"></span>
              <span>Off Day / Leave</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot empty"></span>
              <span>Unconfigured (Default 20)</span>
            </div>
          </div>
        </div>

        {/* Modal: Set Capacity Dialog */}
        {isModalOpen && (
          <div className="capacity-modal-backdrop" onClick={closeModal}>
            <div
              className="capacity-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">
                    <FaCalendarAlt style={{ color: "#0284c7", marginRight: 8 }} />
                    {selectedDates.length === 1 ? "Configure Day Capacity" : `Configure ${selectedDates.length} Selected Dates`}
                  </h3>
                  <div className="modal-dates-chips">
                    {selectedDates.map((d) => (
                      <span key={d} className="modal-date-chip">
                        {new Date(d).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={closeModal} className="btn-close-modal">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="modal-body-form">
                {/* Working Day Toggle */}
                <div className="form-toggle-row">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={modalIsWorkingDay}
                      onChange={(e) => setModalIsWorkingDay(e.target.checked)}
                      className="custom-checkbox"
                    />
                    <span className="toggle-text">
                      <strong>Doctor Available (Working Day)</strong>
                      <small style={{ display: "block", color: "#64748b" }}>
                        Uncheck this if the doctor is on leave or the clinic is closed on this date.
                      </small>
                    </span>
                  </label>
                </div>

                {/* Capacity Input */}
                {modalIsWorkingDay && (
                  <div className="form-field-wrap">
                    <label htmlFor="modalMaxCapacity">Daily Max Patient Capacity *</label>
                    <div className="input-with-addon">
                      <input
                        id="modalMaxCapacity"
                        type="number"
                        min="1"
                        max="300"
                        value={modalCapacity}
                        onChange={(e) => setModalCapacity(e.target.value)}
                        required
                        className="modal-number-input"
                      />
                      <span className="input-addon">patients / day</span>
                    </div>
                  </div>
                )}

                {/* Notes Input */}
                <div className="form-field-wrap">
                  <label htmlFor="modalNotes">Clinical Notes / Timings (Optional)</label>
                  <input
                    id="modalNotes"
                    type="text"
                    placeholder="e.g. 10:00 AM - 1:00 PM OPD, Walk-ins welcome"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="modal-text-input"
                  />
                </div>

                {/* Modal Footer Actions */}
                <div className="modal-footer-actions">
                  {selectedDates.length === 1 && activeDateItem && (
                    <button
                      type="button"
                      onClick={handleDeleteCapacity}
                      disabled={modalLoading}
                      className="btn-danger-remove"
                    >
                      <FaTrash style={{ marginRight: 6 }} /> Delete Schedule
                    </button>
                  )}

                  <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-secondary-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="btn-primary-save"
                    >
                      {modalLoading ? "Saving..." : `Save Capacity${selectedDates.length > 1 ? ` (${selectedDates.length})` : ""}`}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DoctorCapacitySettings;
