import React, { useEffect, useState } from "react";
import { useSnackbar } from "../context/SnackbarContext";
import api from "../utils/api";
import { FaClipboardList, FaLightbulb } from "react-icons/fa";
import "./DoctorCapacitySettings.css";

const DoctorCapacitySettings = ({ doctorId }) => {
  const snackbar = useSnackbar();
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("10");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Fetch capacities
  useEffect(() => {
    fetchCapacities();
  }, [doctorId]);

  const fetchCapacities = async () => {
    try {
      setLoading(true);
      const url = doctorId
        ? `/api/v1/doctor-capacity/doctor/${doctorId}`
        : "/api/v1/doctor-capacity/doctor/me";
      const { data } = await api.get(url);
      setCapacities(data.capacities || []);
    } catch (error) {
      console.error("Error fetching capacities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCapacity = async (e) => {
    e.preventDefault();
    if (!selectedDate || !maxCapacity) {
      snackbar.error("Please select date and capacity");
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        date: selectedDate,
        maxPatients: parseInt(maxCapacity),
        notes: `Capacity set to ${maxCapacity}`,
      };

      if (doctorId) {
        payload.doctorId = doctorId;
      }

      await api.post("/api/v1/doctor-capacity/set", payload);
      snackbar.success("Capacity set successfully");
      setSelectedDate("");
      setMaxCapacity("10");
      fetchCapacities();
    } catch (error) {
      snackbar.error(error.response?.data?.message || "Failed to set capacity");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCapacity = async (id) => {
    if (!window.confirm("Are you sure you want to remove this capacity?")) return;

    try {
      await api.delete(`/api/v1/doctor-capacity/${id}`);
      snackbar.success("Capacity removed");
      fetchCapacities();
    } catch (error) {
      snackbar.error("Failed to remove capacity");
    }
  };

  const getCapacityPercentage = (current, max) => {
    return Math.round((current / max) * 100);
  };

  const getCapacityStatus = (percentage) => {
    if (percentage < 50) return { status: "green", label: "Available" };
    if (percentage < 75) return { status: "yellow", label: "Almost Full" };
    return { status: "red", label: "Full" };
  };

  const getCapacityColor = (percentage) => {
    if (percentage < 50) return "#4caf50";
    if (percentage < 75) return "#ff9800";
    return "#f44336";
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    return maxDate.toISOString().split("T")[0];
  };

  return (
    <div className="doctor-capacity-settings">
      <h3><FaClipboardList style={{ marginRight: 8, color: '#0284c7' }} /> Doctor Capacity Settings</h3>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Set the maximum number of patients you want to see each day. This helps manage your schedule effectively.
      </p>

      {/* Set Capacity Form */}
      <div className="capacity-form-section">
        <h4>Set Daily Capacity</h4>
        <form onSubmit={handleSetCapacity} className="capacity-form">
          <div className="form-group">
            <label htmlFor="capacityDate">Select Date</label>
            <input
              id="capacityDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              required
              style={{
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="capacityMax">Max Patients</label>
            <div className="capacity-input-group">
              <input
                id="capacityMax"
                type="number"
                min="1"
                max="100"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                required
                style={{
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  flex: 1,
                }}
              />
              <span className="capacity-slider-label">{maxCapacity} patients</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="capacity-form-submit"
          >
            {formLoading ? "Setting..." : "Set Capacity"}
          </button>
        </form>
      </div>

      {/* Capacity List */}
      <div className="capacity-list-section">
        <h4>Your Capacity Schedule</h4>
        {loading ? (
          <p style={{ textAlign: "center", color: "#999" }}>Loading capacities...</p>
        ) : capacities.length > 0 ? (
          <div className="capacity-list">
            {capacities.map((capacity) => {
              const percentage = getCapacityPercentage(
                capacity.currentAppointments,
                capacity.maxCapacity
              );
              const { status, label } = getCapacityStatus(percentage);
              const date = new Date(capacity.date);
              const dateStr = date.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div key={capacity._id} className="capacity-item">
                  <div className="capacity-item-date">
                    <strong>{dateStr}</strong>
                  </div>

                  <div className="capacity-item-info">
                    <div className="capacity-stats">
                      <span className="appointments">
                        {capacity.currentAppointments} / {capacity.maxCapacity}
                      </span>
                      <span className="percentage">{percentage}%</span>
                    </div>

                    <div className="capacity-bar-container">
                      <div
                        className="capacity-bar-fill"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: getCapacityColor(percentage),
                        }}
                      ></div>
                    </div>

                    <div className="capacity-status">
                      <span
                        className={`status-badge status-${status}`}
                        style={{
                          backgroundColor:
                            status === "green"
                              ? "#c8e6c9"
                              : status === "yellow"
                              ? "#ffe0b2"
                              : "#ffcdd2",
                          color:
                            status === "green"
                              ? "#1b5e20"
                              : status === "yellow"
                              ? "#e65100"
                              : "#b71c1c",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#999", padding: "2rem" }}>
            No capacity set yet. Set your first capacity above!
          </p>
        )}
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", background: "#f0f8ff", borderRadius: "4px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
          <strong><FaLightbulb style={{ marginRight: 6, color: '#eab308' }} /> Tip:</strong> Set your capacity in advance so patients can see your availability. Your schedule will update automatically as appointments are booked.
        </p>
      </div>
    </div>
  );
};

export default DoctorCapacitySettings;
