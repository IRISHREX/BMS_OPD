import api from "../utils/api";
import Modal from "react-modal";
import React, { useContext, useEffect, useState, useMemo, useRef } from "react";
import { useSnackbar } from "../context/SnackbarContext";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";
import RequirePermission from "./RequirePermission";
import AssistantCard from "./AssistantCard";
import useClickSound from "../hooks/useClickSound";
import {
  playSaveSound,
  playLoadSound,
  playDeleteSound,
} from "../utils/soundUtils";
import {
  FaSearch,
  FaUserNurse,
  FaTimes,
  FaEdit,
  FaCalendarAlt,
  FaIdCard,
} from "react-icons/fa";
import { MdAdd, MdEmail } from "react-icons/md";
import { PiPhoneCallFill, PiIdentificationCardFill, PiGenderIntersexFill } from "react-icons/pi";
import { FaUserDoctor } from "react-icons/fa6";
import "./Compounders.css";

const Compounders = () => {
  const snackbar = useSnackbar();
  const { isAuthenticated } = useContext(Context);
  const navigate = useNavigate();
  const setupClickSound = useClickSound();
  const modalScrollRef = useRef(null);
  const editModalScrollRef = useRef(null);

  const [compounders, setCompounders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    () => sessionStorage.getItem("compounders_searchTerm") || ""
  );
  const [doctorFilter, setDoctorFilter] = useState(
    () => sessionStorage.getItem("compounders_docFilter") || "all"
  );
  const [availableDoctors, setAvailableDoctors] = useState([]);

  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updateFields, setUpdateFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nic: "",
    dob: "",
    gender: "Male",
    assignedDoctors: [],
  });

  useEffect(() => {
    sessionStorage.setItem("compounders_searchTerm", searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    sessionStorage.setItem("compounders_docFilter", doctorFilter);
  }, [doctorFilter]);

  const fetchCompounders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/v1/user/compounders");
      setCompounders(data.compounders || []);
    } catch (err) {
      snackbar.error(
        err?.response?.data?.message || "Failed to fetch assistants"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get("/api/v1/user/doctors");
      setAvailableDoctors(data.doctors || []);
    } catch (err) {
      console.warn("Failed to fetch doctors list for filter:", err);
    }
  };

  useEffect(() => {
    fetchCompounders();
    fetchDoctors();
  }, []);

  // Filtered Compounders list by search and assigned doctor
  const filteredCompounders = useMemo(() => {
    return compounders.filter((c) => {
      const fullName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const nic = (c.nic || "").toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        nic.includes(q);

      if (!matchesSearch) return false;

      if (doctorFilter === "all") return true;
      if (doctorFilter === "unassigned") {
        return !c.assignedDoctors || c.assignedDoctors.length === 0;
      }

      return (c.assignedDoctors || []).some(
        (doc) => (typeof doc === "object" ? doc._id : doc) === doctorFilter
      );
    });
  }, [compounders, searchTerm, doctorFilter]);

  const handleClearSearch = () => {
    setSearchTerm("");
    sessionStorage.removeItem("compounders_searchTerm");
  };

  const handleOpenEdit = (assistant) => {
    setSelectedAssistant(assistant);
    setUpdateFields({
      firstName: assistant.firstName || "",
      lastName: assistant.lastName || "",
      email: assistant.email || "",
      phone: assistant.phone || "",
      nic: assistant.nic || "",
      dob: assistant.dob ? assistant.dob.substring(0, 10) : "",
      gender: assistant.gender || "Male",
      assignedDoctors: (assistant.assignedDoctors || []).map((d) =>
        typeof d === "object" ? d._id : d
      ),
    });
    setShowViewModal(false);
    setShowUpdateModal(true);
  };

  const handleToggleDoctorAssignment = (docId) => {
    setUpdateFields((prev) => {
      const current = prev.assignedDoctors || [];
      if (current.includes(docId)) {
        return { ...prev, assignedDoctors: current.filter((id) => id !== docId) };
      } else {
        return { ...prev, assignedDoctors: [...current, docId] };
      }
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssistant?._id) return;
    try {
      setIsSubmitting(true);
      playLoadSound();
      await api.put(`/api/v1/user/user/${selectedAssistant._id}`, updateFields);
      playSaveSound();
      snackbar.success("Assistant updated successfully");
      setShowUpdateModal(false);
      fetchCompounders();
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to update assistant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssistant = (assistant) => {
    snackbar.confirm(
      `Are you sure you want to delete assistant ${assistant.firstName} ${assistant.lastName || ""}?`,
      async () => {
        try {
          await api.delete(`/api/v1/user/user/${assistant._id}`);
          playDeleteSound();
          snackbar.success("Assistant deleted successfully");
          fetchCompounders();
        } catch (err) {
          snackbar.error(err?.response?.data?.message || "Delete failed");
        }
      }
    );
  };

  const resolveAvatarUrl = (img) => {
    if (!img) return "/doc1.jpg";
    const url = typeof img === "string" ? img : img?.url || "";
    if (!url) return "/doc1.jpg";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    const base = api.defaults.baseURL || import.meta.env.VITE_BASE_URL || "";
    const cleanBase = base.replace(/\/+$/, "");
    const cleanPath = url.replace(/^\/+/, "");
    return `${cleanBase}/${cleanPath}`;
  };

  if (!isAuthenticated) return <Navigate to={"/login"} />;

  return (
    <section className="page assistants-page">
      <div className="assistants-body">
        {/* Modern Top Header / Toolbar */}
        <div className="assistants-top-bar">
          <div className="assistants-header-left">
            <h1 className="assistants-page-title">
              <FaUserNurse style={{ color: "var(--accent, #1a9e9b)" }} />
              <span>Assistants</span>
            </h1>
            <span className="assistants-count-badge">
              {filteredCompounders.length}{" "}
              {filteredCompounders.length === 1 ? "Assistant" : "Assistants"}
            </span>
          </div>

          <div className="assistants-header-controls">
            {/* Filter by Assigned Doctor */}
            {availableDoctors.length > 0 && (
              <div className="assistants-doc-select-wrap">
                <select
                  className="assistants-doc-select"
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  aria-label="Filter by assigned doctor"
                >
                  <option value="all">All Assigned Doctors ({availableDoctors.length})</option>
                  <option value="unassigned">Unassigned Assistants</option>
                  {availableDoctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.firstName} {doc.lastName || ""} ({doc.doctorDepartment || "General"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clearable Search Box */}
            <div className="assistants-search-box">
              <FaSearch className="search-prefix-icon" />
              <input
                type="text"
                placeholder="Search by name, phone, email, NIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="assistants-search-clear-btn"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Add New Assistant Button */}
            <RequirePermission allowedRoles={["Admin", "Doctor"]}>
              <button
                ref={setupClickSound}
                type="button"
                className="assistants-add-btn"
                onClick={() => navigate("/helper/addnew")}
                title="Register New Assistant"
              >
                <MdAdd style={{ fontSize: "1.15rem" }} />
                <span>Add Assistant</span>
              </button>
            </RequirePermission>
          </div>
        </div>

        {/* Assistants Grid */}
        <div className="assistants-grid">
          {loading ? (
            <div className="assistants-empty-state">
              <span className="loader" />
              <p style={{ marginTop: 16 }}>Loading assistants directory...</p>
            </div>
          ) : filteredCompounders && filteredCompounders.length > 0 ? (
            filteredCompounders.map((ast) => (
              <AssistantCard
                key={ast._id}
                assistant={ast}
                onView={(u) => {
                  setSelectedAssistant(u);
                  setShowViewModal(true);
                }}
                onEdit={(u) => handleOpenEdit(u)}
                onDelete={(u) => handleDeleteAssistant(u)}
              />
            ))
          ) : (
            <div className="assistants-empty-state">
              <FaUserNurse className="assistants-empty-icon" />
              <h3>No Registered Assistants Found</h3>
              <p>
                {searchTerm || doctorFilter !== "all"
                  ? "Try clearing your filters or search keywords."
                  : "Click 'Add Assistant' above to register your first assistant."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern View Assistant Profile Modal */}
      <Modal
        isOpen={showViewModal}
        onRequestClose={() => setShowViewModal(false)}
        contentLabel="Assistant Profile"
        style={{
          overlay: {
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(8px)",
          },
          content: {
            maxWidth: "680px",
            margin: "auto",
            borderRadius: "18px",
            padding: 0,
            maxHeight: "92vh",
            overflow: "hidden",
            border: "1px solid var(--border-color, #e2e8f0)",
            background: "var(--bg-card, #ffffff)",
            color: "var(--text-main, #1e293b)",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        {selectedAssistant && (
          <div className="assistant-view-modal-scrollable-body" ref={modalScrollRef}>
            <div className="assistant-view-modal-content">
              {/* Modal Top Bar */}
              <div className="assistant-modal-top-bar">
                <div className="assistant-modal-title">
                  <FaUserNurse style={{ color: "var(--accent, #1a9e9b)", fontSize: "1.2rem" }} />
                  <span>Assistant Profile</span>
                </div>

                <div className="assistant-modal-header-actions">
                  <RequirePermission allowedRoles={["Admin"]}>
                    <button
                      ref={setupClickSound}
                      type="button"
                      className="assistant-modal-quick-edit-btn"
                      onClick={() => handleOpenEdit(selectedAssistant)}
                      title="Edit Assistant Details"
                    >
                      <FaEdit />
                      <span>Edit Profile</span>
                    </button>
                  </RequirePermission>

                  <button
                    type="button"
                    className="assistant-modal-close-icon-btn"
                    onClick={() => setShowViewModal(false)}
                    title="Close modal"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Hero Profile Banner */}
              <div className="assistant-modal-hero">
                <div className="assistant-modal-avatar-box">
                  <img
                    src={resolveAvatarUrl(selectedAssistant.docAvatar)}
                    alt={`${selectedAssistant.firstName} ${selectedAssistant.lastName || ""}`}
                    onError={(e) => {
                      e.target.src = "/doc1.jpg";
                    }}
                  />
                  <span className="assistant-status-indicator" title="Active Assistant" />
                </div>

                <div className="assistant-modal-hero-info">
                  <h2 className="assistant-modal-hero-name">
                    {selectedAssistant.firstName} {selectedAssistant.lastName || ""}
                  </h2>

                  <div className="assistant-role-badge">
                    <FaUserNurse className="assistant-role-icon" />
                    <span>Medical Assistant / Compounder</span>
                  </div>

                  <div className="assistant-modal-hero-badges">
                    {selectedAssistant.gender && (
                      <div className="assistant-meta-chip">
                        <span>{selectedAssistant.gender}</span>
                      </div>
                    )}
                    {selectedAssistant.dob && (
                      <div className="assistant-meta-chip">
                        <FaCalendarAlt className="meta-chip-icon" />
                        <span>DOB: {selectedAssistant.dob.substring(0, 10)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2-Column Info Tiles Grid */}
              <div className="assistant-info-tiles-grid">
                <div className="assistant-info-tile">
                  <div className="assistant-info-tile-icon-box email-icon">
                    <MdEmail />
                  </div>
                  <div className="assistant-info-tile-content">
                    <span className="assistant-info-tile-label">Email Address</span>
                    <span className="assistant-info-tile-value">
                      {selectedAssistant.email || "Not Provided"}
                    </span>
                  </div>
                </div>

                <div className="assistant-info-tile">
                  <div className="assistant-info-tile-icon-box phone-icon">
                    <PiPhoneCallFill />
                  </div>
                  <div className="assistant-info-tile-content">
                    <span className="assistant-info-tile-label">Phone Number</span>
                    <span className="assistant-info-tile-value">
                      {selectedAssistant.phone || "Not Provided"}
                    </span>
                  </div>
                </div>

                <div className="assistant-info-tile">
                  <div className="assistant-info-tile-icon-box nic-icon">
                    <PiIdentificationCardFill />
                  </div>
                  <div className="assistant-info-tile-content">
                    <span className="assistant-info-tile-label">National ID / NIC</span>
                    <span className="assistant-info-tile-value">
                      {selectedAssistant.nic || "Not Registered"}
                    </span>
                  </div>
                </div>

                <div className="assistant-info-tile">
                  <div className="assistant-info-tile-icon-box gender-icon">
                    <PiGenderIntersexFill />
                  </div>
                  <div className="assistant-info-tile-content">
                    <span className="assistant-info-tile-label">Gender</span>
                    <span className="assistant-info-tile-value">
                      {selectedAssistant.gender || "Not Specified"}
                    </span>
                  </div>
                </div>

                {/* Full Width Assigned Doctors Tile */}
                <div className="assistant-info-tile full-width">
                  <div className="assistant-info-tile-icon-box doc-icon">
                    <FaUserDoctor />
                  </div>
                  <div className="assistant-info-tile-content">
                    <span className="assistant-info-tile-label">Assigned Doctors</span>
                    <div className="assistant-assigned-docs-list">
                      {(selectedAssistant.assignedDoctors || []).length > 0 ? (
                        selectedAssistant.assignedDoctors.map((doc, idx) => {
                          const docName = typeof doc === "object" ? `Dr. ${doc.firstName} ${doc.lastName || ""}` : "Doctor";
                          const dept = typeof doc === "object" ? doc.doctorDepartment : null;
                          return (
                            <span key={idx} className="assistant-assigned-doc-pill">
                              <FaUserDoctor />
                              <span>{docName} {dept ? `(${dept})` : ""}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="assistant-unassigned-text">No doctors currently assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="assistant-modal-footer">
                <button
                  ref={setupClickSound}
                  type="button"
                  className="assistant-modal-close-btn"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modern Edit Assistant Modal */}
      <Modal
        isOpen={showUpdateModal}
        onRequestClose={() => setShowUpdateModal(false)}
        contentLabel="Edit Assistant"
        style={{
          overlay: {
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(8px)",
          },
          content: {
            maxWidth: "680px",
            margin: "auto",
            borderRadius: "18px",
            padding: 0,
            maxHeight: "92vh",
            overflow: "hidden",
            border: "1px solid var(--border-color, #e2e8f0)",
            background: "var(--bg-card, #ffffff)",
            color: "var(--text-main, #1e293b)",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        <div className="assistant-edit-modal-scrollable-body" ref={editModalScrollRef}>
          <div className="assistant-edit-modal-content">
            {/* Top Bar */}
            <div className="assistant-modal-top-bar">
              <div className="assistant-modal-title">
                <FaEdit style={{ color: "var(--accent, #1a9e9b)" }} />
                <span>Edit Assistant Profile</span>
              </div>
              <button
                type="button"
                className="assistant-modal-close-icon-btn"
                onClick={() => setShowUpdateModal(false)}
                title="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="assistant-edit-form">
              {/* Personal Info Row */}
              <div className="ast-fields-row">
                <div className="ast-field-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={updateFields.firstName}
                    onChange={(e) =>
                      setUpdateFields((f) => ({ ...f, firstName: e.target.value }))
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="ast-field-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={updateFields.lastName}
                    onChange={(e) =>
                      setUpdateFields((f) => ({ ...f, lastName: e.target.value }))
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Contact Info Row */}
              <div className="ast-fields-row">
                <div className="ast-field-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={updateFields.email}
                    onChange={(e) =>
                      setUpdateFields((f) => ({ ...f, email: e.target.value }))
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="ast-field-group">
                  <label>Mobile Number *</label>
                  <input
                    type="text"
                    placeholder="Mobile Number"
                    value={updateFields.phone}
                    onChange={(e) =>
                      setUpdateFields((f) => ({ ...f, phone: e.target.value }))
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* DOB, Gender, NIC Row */}
              <div className="ast-fields-row three-cols">
                <div className="ast-field-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={updateFields.dob}
                    onChange={(e) =>
                      setUpdateFields((f) => ({ ...f, dob: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="ast-field-group">
                  <label>Gender *</label>
                  <select
                    value={updateFields.gender}
                    onChange={(e) =>
                      setUpdateFields((f) => ({ ...f, gender: e.target.value }))
                    }
                    disabled={isSubmitting}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="ast-field-group">
                  <label>National ID / NIC</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789"
                    value={updateFields.nic}
                    onChange={(e) =>
                      setUpdateFields((f) => ({ ...f, nic: e.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Assigned Doctors Selector */}
              <div className="ast-assign-doctors-card">
                <label className="ast-assign-title">
                  <FaUserDoctor style={{ color: "var(--accent, #1a9e9b)" }} />
                  <span>Assigned Doctors</span>
                </label>
                <div className="ast-assign-doctors-grid">
                  {availableDoctors && availableDoctors.length > 0 ? (
                    availableDoctors.map((doc) => {
                      const isSelected = (updateFields.assignedDoctors || []).includes(doc._id);
                      return (
                        <div
                          key={doc._id}
                          className={`ast-doctor-toggle-pill ${isSelected ? "selected" : ""}`}
                          onClick={() => handleToggleDoctorAssignment(doc._id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            tabIndex={-1}
                          />
                          <span>
                            Dr. {doc.firstName} {doc.lastName || ""} ({doc.doctorDepartment || "General"})
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="ast-no-docs-text">No doctors available for assignment</div>
                  )}
                </div>
              </div>

              {/* Form Footer */}
              <div className="assistant-modal-footer-actions">
                <button
                  ref={setupClickSound}
                  type="button"
                  className="assistant-cancel-btn"
                  onClick={() => setShowUpdateModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  ref={setupClickSound}
                  type="submit"
                  className="assistant-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default Compounders;
