import React, { useEffect, useState, useContext } from "react";
import { useSnackbar } from "../context/SnackbarContext";
import { Context } from "../main";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { FaClipboardList, FaLightbulb, FaTrash, FaUserMd, FaArrowLeft } from "react-icons/fa";
import "./DoctorCapacitySettings.css";

const DoctorCapacitySettings = ({ doctorId: initialDoctorId }) => {
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const { admin } = useContext(Context);

  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("20");
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId || (admin?.role === "Doctor" ? admin._id : ""));
  const [doctors, setDoctors] = useState([]);

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

  // Fetch capacities
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

  const handleSetCapacity = async (e) => {
    e.preventDefault();
    if (!selectedDate || !maxCapacity) {
      snackbar.error("Please select date and capacity");
      return;
    }

    const docId = selectedDoctorId || (admin?.role === "Doctor" ? admin._id : "");
    if (!docId) {
      snackbar.error("Doctor is required");
      return;
    }

    try {
      setFormLoading(true);
      const capNumber = parseInt(maxCapacity, 10) || 20;
      const payload = {
        doctorId: docId,
        serviceDate: selectedDate,
        date: selectedDate,
        capacity: capNumber,
        maxPatients: capNumber,
        notes: `Capacity set to ${capNumber}`,
      };

      await api.post("/api/v1/capacity-scheduler/set", payload);
      snackbar.success("Capacity set successfully");
      setSelectedDate("");
      setMaxCapacity("20");
      fetchCapacities();
    } catch (error) {
      snackbar.error(error.response?.data?.message || "Failed to set capacity");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCapacity = (id) => {
    snackbar.confirm("Are you sure you want to remove this capacity override?", async () => {
      try {
        await api.delete(`/api/v1/capacity-scheduler/${id}`);
        snackbar.success("Capacity removed");
        fetchCapacities();
      } catch (error) {
        snackbar.error(error.response?.data?.message || "Failed to remove capacity");
      }
    });
  };

  const getCapacityPercentage = (booked, max) => {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.round(((booked || 0) / max) * 100));
  };

  const getCapacityStatus = (percentage) => {
    if (percentage < 50) return { status: "green", label: "Available" };
    if (percentage < 75) return { status: "yellow", label: "Almost Full" };
    return { status: "red", label: "Full" };
  };

  const getCapacityColor = (percentage) => {
    if (percentage < 50) return "#10b981";
    if (percentage < 75) return "#f59e0b";
    return "#ef4444";
  };

  const getMinDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    return maxDate.toISOString().split("T")[0];
  };

  return (
    <section className="page">
      <div className="settings-page">
        <button onClick={() => navigate(-1)} className="back-btn add-btn" style={{ marginBottom: "1rem" }}>
          <FaArrowLeft style={{ marginRight: 6 }} /> Go Back
        </button>

        <div className="doctor-capacity-settings">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <h3><FaClipboardList style={{ marginRight: 8, color: "#0284c7" }} /> Doctor Daily Capacity</h3>
              <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "0.9rem" }}>
                Configure daily max patient limits and schedule capacity.
              </p>
            </div>

            {admin?.role === "Admin" && doctors.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaUserMd color="#0284c7" />
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      Dr. {d.firstName} {d.lastName} ({d.doctorDepartment || "General"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Set Capacity Form */}
          <div className="capacity-form-section">
            <h4>Set Daily Capacity</h4>
            <form onSubmit={handleSetCapacity} className="capacity-form">
              <div className="form-group">
                <label htmlFor="capacityDate">Service Date</label>
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
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="capacityMax">Max Patients Limit</label>
                <div className="capacity-input-group" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    id="capacityMax"
                    type="number"
                    min="1"
                    max="200"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    required
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      width: "120px",
                    }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>patients / day</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="capacity-form-submit btn btn-primary"
                style={{ padding: "0.75rem 1.5rem", borderRadius: "6px", cursor: "pointer", alignSelf: "flex-end" }}
              >
                {formLoading ? "Saving..." : "Save Limit"}
              </button>
            </form>
          </div>

          {/* Capacity List */}
          <div className="capacity-list-section" style={{ marginTop: "2rem" }}>
            <h4>Active Schedules</h4>
            {loading ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Loading capacity records...</p>
            ) : capacities.length > 0 ? (
              <div className="capacity-list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {capacities.map((item) => {
                  const max = Number(item.capacity || item.maxCapacity || item.maxPatients || 20);
                  const booked = Number(item.bookedCount || item.currentAppointments || 0);
                  const percentage = getCapacityPercentage(booked, max);
                  const { status, label } = getCapacityStatus(percentage);
                  const rawDate = item.serviceDate || item.date;
                  const dateStr = rawDate ? new Date(rawDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }) : "Date N/A";

                  return (
                    <div
                      key={item._id}
                      className="capacity-item"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem 1.25rem",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      <div className="capacity-item-date" style={{ minWidth: "160px" }}>
                        <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>{dateStr}</strong>
                        {item.notes && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{item.notes}</div>}
                      </div>

                      <div className="capacity-item-info" style={{ display: "flex", alignItems: "center", gap: "1.5rem", flex: 1, justifyContent: "flex-end" }}>
                        <div className="capacity-stats" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                          <span style={{ fontWeight: 600, color: "#334155" }}>
                            {booked} / {max} booked
                          </span>
                          <span style={{ color: "#64748b" }}>({percentage}%)</span>
                        </div>

                        <div className="capacity-bar-container" style={{ width: "120px", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            className="capacity-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              height: "100%",
                              backgroundColor: getCapacityColor(percentage),
                              borderRadius: "4px",
                            }}
                          />
                        </div>

                        <span
                          className={`status-badge status-${status}`}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor:
                              status === "green" ? "#dcfce7" : status === "yellow" ? "#fef3c7" : "#fee2e2",
                            color:
                              status === "green" ? "#15803d" : status === "yellow" ? "#b45309" : "#b91c1c",
                          }}
                        >
                          {label}
                        </span>

                        <button
                          onClick={() => handleDeleteCapacity(item._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px 8px",
                          }}
                          title="Remove capacity limit"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: "2rem", background: "#f8fafc", borderRadius: "8px" }}>
                No capacity limit overrides set yet. The default doctor limit will be used.
              </p>
            )}
          </div>

          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#1e40af", display: "flex", alignItems: "center" }}>
              <FaLightbulb style={{ marginRight: 8, color: "#f59e0b", flexShrink: 0 }} />
              Setting a daily capacity ensures appointments will automatically lock when the daily limit is reached.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorCapacitySettings;
