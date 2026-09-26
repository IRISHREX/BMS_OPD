import api from "../utils/api";
import Modal from "react-modal";
import React, { useContext, useEffect, useState, useMemo, useRef } from "react";
import { useSnackbar } from "../context/SnackbarContext";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoctorsRequest } from "../store/doctorsSlice";
import { resetDoctorUpdate } from "../store/doctorUpdateSlice";
import { playDeleteSound } from "../utils/soundUtils";
import CapacitySchedulerForm from "./CapacitySchedulerForm";
import AddNewDoctor from "./AddNewDoctor";
import DoctorCard from "./DoctorCard";
import RequirePermission from "./RequirePermission";
import useClickSound from "../hooks/useClickSound";
import {
  FaSearch,
  FaUserMd,
  FaTimes,
  FaEdit,
  FaStethoscope,
  FaCalendarAlt,
  FaIdCard,
  FaGraduationCap,
} from "react-icons/fa";
import { MdAdd, MdEmail, MdOutlineMedicalServices } from "react-icons/md";
import { PiPhoneCallFill, PiIdentificationCardFill, PiGenderIntersexFill } from "react-icons/pi";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import "./Doctors.css";

const Doctors = () => {
  const snackbar = useSnackbar();
  const [searchTerm, setSearchTerm] = useState(
    () => sessionStorage.getItem("doctors_searchTerm") || ""
  );
  const [departmentFilter, setDepartmentFilter] = useState(
    () => sessionStorage.getItem("doctors_deptFilter") || "all"
  );
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("overview");
  const modalScrollRef = useRef(null);
  const editModalScrollRef = useRef(null);

  const { isAuthenticated } = useContext(Context);
  const dispatch = useDispatch();
  const storeDoctors = useSelector((s) => s.doctors.doctors || []);
  const doctorsLoading = useSelector((s) => s.doctors.loading);
  const doctorUpdate = useSelector((s) => s.doctorUpdate);

  const navigate = useNavigate();
  const setupClickSound = useClickSound();

  useEffect(() => {
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  }, [activeModalTab, showViewModal]);

  useEffect(() => {
    if (editModalScrollRef.current) {
      editModalScrollRef.current.scrollTop = 0;
    }
  }, [showUpdateModal]);

  useEffect(() => {
    sessionStorage.setItem("doctors_searchTerm", searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    sessionStorage.setItem("doctors_deptFilter", departmentFilter);
  }, [departmentFilter]);

  useEffect(() => {
    dispatch(fetchDoctorsRequest({ query: searchTerm }));
  }, [searchTerm, dispatch]);

  useEffect(() => {
    if (doctorUpdate?.success) {
      setShowUpdateModal(false);
      dispatch(fetchDoctorsRequest({ query: searchTerm }));
      dispatch(resetDoctorUpdate());
    }
  }, [doctorUpdate?.success, dispatch, searchTerm]);

  // Extract unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    const depts = new Set();
    storeDoctors.forEach((doc) => {
      if (doc.doctorDepartment && doc.doctorDepartment.trim()) {
        depts.add(doc.doctorDepartment.trim());
      }
    });
    return Array.from(depts).sort();
  }, [storeDoctors]);

  // Filter doctors by selected department in addition to search query
  const filteredDoctors = useMemo(() => {
    if (departmentFilter === "all") return storeDoctors;
    return storeDoctors.filter(
      (doc) => (doc.doctorDepartment || "").trim() === departmentFilter
    );
  }, [storeDoctors, departmentFilter]);

  const handleClearSearch = () => {
    setSearchTerm("");
    sessionStorage.removeItem("doctors_searchTerm");
  };

  const handleRedirect = () => {
    navigate("/doctor/addnew");
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

  const getDoctorDisplayName = (doc) => {
    if (!doc) return "";
    const raw = `${doc.firstName || ""} ${doc.lastName || ""}`.trim();
    if (raw.toLowerCase().startsWith("dr.") || raw.toLowerCase().startsWith("dr ")) {
      return raw;
    }
    return `Dr. ${raw}`;
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <section className="page doctors-page">
      <div className="doctors-body">
        {/* Modern Header / Toolbar Bar */}
        <div className="doctors-top-bar">
          <div className="doctors-header-left">
            <h1 className="doctors-page-title">
              <FaUserMd style={{ color: "var(--accent, #1a9e9b)" }} />
              <span>Doctors</span>
            </h1>
            <span className="doctors-count-badge">
              {filteredDoctors.length} {filteredDoctors.length === 1 ? "Doctor" : "Doctors"}
            </span>
          </div>

          <div className="doctors-header-controls">
            {/* Department Filter Selector */}
            {uniqueDepartments.length > 0 && (
              <div className="doctors-dept-select-wrap">
                <select
                  className="doctors-dept-select"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  aria-label="Filter by department"
                >
                  <option value="all">All Departments ({storeDoctors.length})</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clearable Search Box */}
            <div className="doctors-search-box">
              <FaSearch className="search-prefix-icon" />
              <input
                type="text"
                placeholder="Search by name, phone, dept, NIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="doctors-search-clear-btn"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Add New Doctor Button */}
            <RequirePermission allowedRoles={["Admin"]}>
              <button
                ref={setupClickSound}
                type="button"
                className="doctors-add-btn"
                onClick={handleRedirect}
                title="Add New Doctor"
              >
                <MdAdd style={{ fontSize: "1.15rem" }} />
                <span>Add Doctor</span>
              </button>
            </RequirePermission>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="doctors-grid">
          {doctorsLoading ? (
            <div className="doctors-empty-state">
              <span className="loader" />
              <p style={{ marginTop: 16 }}>Loading doctors list...</p>
            </div>
          ) : filteredDoctors && filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc) => (
              <DoctorCard
                key={doc._id}
                doctor={doc}
                onView={(u) => {
                  setSelectedDoctor(u);
                  setActiveModalTab("overview");
                  setShowViewModal(true);
                }}
                onEdit={(u) => {
                  setSelectedDoctor(u);
                  setShowUpdateModal(true);
                }}
                onDelete={(u) => {
                  snackbar.confirm(
                    "Are you sure you want to delete this doctor?",
                    async () => {
                      try {
                        await api.delete(`/api/v1/user/user/${u._id}`);
                        playDeleteSound();
                        snackbar.success("Doctor deleted");
                        dispatch(fetchDoctorsRequest({ query: searchTerm }));
                      } catch (err) {
                        snackbar.error("Delete failed");
                      }
                    }
                  );
                }}
              />
            ))
          ) : (
            <div className="doctors-empty-state">
              <FaUserMd className="doctors-empty-icon" />
              <h3>No Registered Doctors Found</h3>
              <p>
                {searchTerm || departmentFilter !== "all"
                  ? "Try clearing your filters or search keywords."
                  : "Click 'Add Doctor' above to register your first doctor."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Edit Doctor Modal */}
      <Modal
        isOpen={showUpdateModal}
        onRequestClose={() => setShowUpdateModal(false)}
        contentLabel="Update Doctor"
        style={{
          overlay: {
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(8px)",
          },
          content: {
            maxWidth: "840px",
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
        <div className="doctor-edit-modal-scrollable-body" ref={editModalScrollRef}>
          <AddNewDoctor
            isEditing={true}
            initialData={selectedDoctor}
            onClose={() => setShowUpdateModal(false)}
          />
        </div>
      </Modal>

      {/* Modern View Doctor Profile & Capacity Scheduler Modal */}
      <Modal
        isOpen={showViewModal}
        onRequestClose={() => setShowViewModal(false)}
        contentLabel="Doctor Profile"
        style={{
          overlay: {
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(8px)",
          },
          content: {
            maxWidth: "760px",
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
        {selectedDoctor && (
          <div className="doctor-view-modal-scrollable-body" ref={modalScrollRef}>
            <div className="doctor-view-modal-content">
              {/* Modal Top Bar */}
              <div className="doc-modal-top-bar">
              <div className="doc-modal-title">
                <FaUserMd style={{ color: "var(--accent, #1a9e9b)" }} />
                <span>Doctor Profile</span>
              </div>

              <div className="doc-modal-header-actions">
                <RequirePermission allowedRoles={["Admin"]}>
                  <button
                    ref={setupClickSound}
                    type="button"
                    className="doc-modal-quick-edit-btn"
                    onClick={() => {
                      setShowViewModal(false);
                      setShowUpdateModal(true);
                    }}
                    title="Edit Doctor Details"
                  >
                    <FaEdit />
                    <span>Edit Profile</span>
                  </button>
                </RequirePermission>

                <button
                  type="button"
                  className="doc-modal-close-icon-btn"
                  onClick={() => setShowViewModal(false)}
                  title="Close modal"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Doctor Hero Profile Banner */}
            <div className="doc-modal-hero">
              <div className="doc-modal-avatar-box">
                <img
                  src={resolveAvatarUrl(selectedDoctor.docAvatar)}
                  alt={getDoctorDisplayName(selectedDoctor)}
                  onError={(e) => {
                    e.target.src = "/doc1.jpg";
                  }}
                />
                <span className="doc-status-indicator" title="Available for OPD" />
              </div>

              <div className="doc-modal-hero-info">
                <h2 className="doc-modal-hero-name">
                  {getDoctorDisplayName(selectedDoctor)}
                </h2>

                {selectedDoctor.qualifications && (
                  <div className="doc-modal-hero-qual">
                    {selectedDoctor.qualifications}
                  </div>
                )}

                <div className="doc-modal-hero-badges">
                  <div className="doc-dept-badge">
                    <FaStethoscope className="doc-dept-icon" />
                    <span>{selectedDoctor.doctorDepartment || "General Medicine"}</span>
                  </div>

                  {selectedDoctor.consultationFee && (
                    <div className="doc-meta-chip fee-chip">
                      <RiMoneyRupeeCircleLine className="meta-chip-icon" />
                      <span>₹{selectedDoctor.consultationFee} / Consult</span>
                    </div>
                  )}

                  {selectedDoctor.gender && (
                    <div className="doc-meta-chip">
                      <span>{selectedDoctor.gender}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="doc-modal-tabs">
              <button
                ref={setupClickSound}
                type="button"
                className={`doc-modal-tab-btn ${activeModalTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveModalTab("overview")}
              >
                <FaIdCard />
                <span>Overview & Contact</span>
              </button>

              <button
                ref={setupClickSound}
                type="button"
                className={`doc-modal-tab-btn ${activeModalTab === "schedule" ? "active" : ""}`}
                onClick={() => setActiveModalTab("schedule")}
              >
                <FaCalendarAlt />
                <span>OPD Capacity & Schedule</span>
              </button>
            </div>

            {/* Tab 1: Overview & Contact Details */}
            {activeModalTab === "overview" && (
              <div className="doc-info-tiles-grid">
                <div className="doc-info-tile">
                  <div className="doc-info-tile-icon-box email-icon">
                    <MdEmail />
                  </div>
                  <div className="doc-info-tile-content">
                    <span className="doc-info-tile-label">Email Address</span>
                    <span className="doc-info-tile-value" title={selectedDoctor.email}>
                      {selectedDoctor.email || "Not Provided"}
                    </span>
                  </div>
                </div>

                <div className="doc-info-tile">
                  <div className="doc-info-tile-icon-box phone-icon">
                    <PiPhoneCallFill />
                  </div>
                  <div className="doc-info-tile-content">
                    <span className="doc-info-tile-label">Phone Number</span>
                    <span className="doc-info-tile-value" title={selectedDoctor.phone}>
                      {selectedDoctor.phone || "Not Provided"}
                    </span>
                  </div>
                </div>

                <div className="doc-info-tile">
                  <div className="doc-info-tile-icon-box dept-icon">
                    <MdOutlineMedicalServices />
                  </div>
                  <div className="doc-info-tile-content">
                    <span className="doc-info-tile-label">Medical Department</span>
                    <span className="doc-info-tile-value">
                      {selectedDoctor.doctorDepartment || "General Medicine"}
                    </span>
                  </div>
                </div>

                <div className="doc-info-tile">
                  <div className="doc-info-tile-icon-box nic-icon">
                    <PiIdentificationCardFill />
                  </div>
                  <div className="doc-info-tile-content">
                    <span className="doc-info-tile-label">NIC / Registration No</span>
                    <span className="doc-info-tile-value">
                      {selectedDoctor.nic || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="doc-info-tile">
                  <div className="doc-info-tile-icon-box gender-icon">
                    <PiGenderIntersexFill />
                  </div>
                  <div className="doc-info-tile-content">
                    <span className="doc-info-tile-label">Gender</span>
                    <span className="doc-info-tile-value">
                      {selectedDoctor.gender || "Not Specified"}
                    </span>
                  </div>
                </div>

                <div className="doc-info-tile">
                  <div className="doc-info-tile-icon-box fee-icon">
                    <RiMoneyRupeeCircleLine />
                  </div>
                  <div className="doc-info-tile-content">
                    <span className="doc-info-tile-label">Consultation Fee</span>
                    <span className="doc-info-tile-value">
                      {selectedDoctor.consultationFee ? `₹${selectedDoctor.consultationFee}` : "Standard OPD Rate"}
                    </span>
                  </div>
                </div>

                {selectedDoctor.qualifications && (
                  <div className="doc-info-tile full-width">
                    <div className="doc-info-tile-icon-box qual-icon">
                      <FaGraduationCap />
                    </div>
                    <div className="doc-info-tile-content">
                      <span className="doc-info-tile-label">Qualifications & Degrees</span>
                      <span className="doc-info-tile-value">
                        {selectedDoctor.qualifications}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: OPD Capacity & Schedule Manager */}
            {activeModalTab === "schedule" && (
              <div style={{ marginBottom: "20px" }}>
                <RequirePermission allowedRoles={["Admin"]}>
                  <CapacitySchedulerForm
                    doctorId={selectedDoctor._id}
                    allowAdminSelfManagement={false}
                  />
                </RequirePermission>
              </div>
            )}

            {/* Modal Footer */}
            <div className="doc-modal-footer">
              <button
                ref={setupClickSound}
                type="button"
                className="doc-modal-close-btn"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
        )}
      </Modal>
    </section>
  );
};

export default Doctors;
