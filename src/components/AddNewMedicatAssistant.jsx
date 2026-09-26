import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";
import { useSnackbar } from "../context/SnackbarContext";
import api from "../utils/api";
import { useDispatch, useSelector } from "react-redux";
import {
  createAdminRequest,
  resetAdminCreate,
} from "../store/adminCreateSlice";
import useClickSound from "../hooks/useClickSound";
import { BsArrowLeft } from "react-icons/bs";
import {
  FaUserNurse,
  FaEnvelope,
  FaPhoneAlt,
  FaIdCard,
  FaLock,
  FaCalendarAlt,
  FaVenusMars,
  FaStethoscope,
  FaUserPlus,
  FaUser,
  FaCheck,
} from "react-icons/fa";
import "./AddNewMedicatAssistant.css";

// Helper functions for dob & age calculation
const dobToAgeYears = (dobStr) => {
  if (!dobStr) return "";
  const bDate = new Date(dobStr);
  if (isNaN(bDate.getTime())) return "";
  const now = new Date();
  let years = now.getFullYear() - bDate.getFullYear();
  const mDiff = now.getMonth() - bDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < bDate.getDate())) {
    years--;
  }
  return years >= 0 ? String(years) : "";
};

const makeNIC = (phoneVal, ageVal) => {
  const p = (phoneVal || "").replace(/\D/g, "");
  const p4 = p.slice(-4);
  const a = (ageVal || "").toString().replace(/\D/g, "");
  if (!p4 && !a) return "";
  return `${p4}${a}`;
};

// Safe doctor avatar resolver
const resolveAvatarUrl = (avatarObj) => {
  if (!avatarObj) return "/doc1.jpg";
  const url = typeof avatarObj === "object" ? avatarObj.url : avatarObj;
  if (!url || typeof url !== "string") return "/doc1.jpg";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const base =
    api.defaults.baseURL || import.meta.env.VITE_BASE_URL || "http://localhost:5000";
  return `${base.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
};

const AddNewMedicatAssistant = () => {
  const snackbar = useSnackbar();
  const { isAuthenticated, setIsAuthenticated, admin } = useContext(Context);
  const setupClickSound = useClickSound();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const adminCreate = useSelector((s) => s.adminCreate);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [assignedDoctors, setAssignedDoctors] = useState([]);

  const role = admin?.role || admin?.userRole || "Admin";

  useEffect(() => {
    const fetchDoctors = async () => {
      if (role !== "Admin") return;
      try {
        const { data } = await api.get("/api/v1/user/doctors");
        setAvailableDoctors(data.doctors || []);
      } catch (err) {
        console.error("Error fetching doctors for assignment", err);
        snackbar.error("Failed to fetch doctors for assignment");
      }
    };

    if (role === "Doctor" && admin?._id) {
      setAssignedDoctors([admin._id]);
    }
    fetchDoctors();
  }, [role, admin]);

  const handleToggleDoctor = (docId) => {
    if (assignedDoctors.includes(docId)) {
      setAssignedDoctors(assignedDoctors.filter((id) => id !== docId));
    } else {
      setAssignedDoctors([...assignedDoctors, docId]);
    }
  };

  const handleSelectAllDoctors = () => {
    setAssignedDoctors(availableDoctors.map((d) => d._id));
  };

  const handleClearAllDoctors = () => {
    setAssignedDoctors([]);
  };

  const handleAddNewAssistant = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !gender || !password) {
      snackbar.error("Please fill in all required fields!");
      return;
    }

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      nic,
      dob,
      gender,
      password,
      assignedDoctors,
    };
    dispatch(createAdminRequest(payload));
  };

  // Reset form and redirect on success
  useEffect(() => {
    if (adminCreate?.success) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setNic("");
      setDob("");
      setAge("");
      setGender("");
      setPassword("");
      setAssignedDoctors([]);
      dispatch(resetAdminCreate());
      setIsAuthenticated(true);
      navigate("/compounders");
    }
  }, [adminCreate?.success, dispatch, navigate, setIsAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <section className="page assistant-register-page">
      <div className="ast-register-page-container">
        {/* Modern Themed Top Toolbar */}
        <div className="ast-page-top-bar">
          <div className="ast-page-top-bar-left">
            <button
              ref={setupClickSound}
              type="button"
              className="ast-page-back-btn"
              onClick={() => navigate("/compounders")}
              title="Back to Assistants Directory"
            >
              <BsArrowLeft />
            </button>
            <div className="ast-page-title-group">
              <h1 className="ast-page-main-heading">
                <FaUserNurse className="ast-page-heading-icon" />
                <span>Register New Assistant</span>
              </h1>
              <span className="ast-page-breadcrumb">
                Assistants Directory &rsaquo; Register New Assistant
              </span>
            </div>
          </div>
        </div>

        {/* Main Themed Card Form */}
        <div className="ast-register-card">
          <div className="ast-form-header">
            <div className="ast-form-header-icon">
              <FaUserPlus />
            </div>
            <div>
              <h2 className="ast-form-header-title">Assistant Account Information</h2>
              <p className="ast-form-header-subtitle">
                Enter personal details, credentials, and doctor assignments for the medical assistant
              </p>
            </div>
          </div>

          <form onSubmit={handleAddNewAssistant} className="ast-form-body">
            {/* Row 1: Names */}
            <div className="ast-fields-row">
              <div className="ast-field-group">
                <label>
                  First Name <span className="ast-required-star">*</span>
                </label>
                <div className="ast-field-input-wrapper">
                  <FaUser className="ast-field-input-icon" />
                  <input
                    type="text"
                    placeholder="e.g. Rahul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={adminCreate.creating}
                    required
                  />
                </div>
              </div>

              <div className="ast-field-group">
                <label>
                  Last Name <span className="ast-required-star">*</span>
                </label>
                <div className="ast-field-input-wrapper">
                  <FaUser className="ast-field-input-icon" />
                  <input
                    type="text"
                    placeholder="e.g. Verma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={adminCreate.creating}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Contact Info */}
            <div className="ast-fields-row">
              <div className="ast-field-group">
                <label>
                  Email Address <span className="ast-required-star">*</span>
                </label>
                <div className="ast-field-input-wrapper">
                  <FaEnvelope className="ast-field-input-icon" />
                  <input
                    type="email"
                    placeholder="assistant@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={adminCreate.creating}
                    required
                  />
                </div>
              </div>

              <div className="ast-field-group">
                <label>
                  Mobile Number <span className="ast-required-star">*</span>
                </label>
                <div className="ast-field-input-wrapper">
                  <FaPhoneAlt className="ast-field-input-icon" />
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (e.target.value && age) {
                        setNic(makeNIC(e.target.value, age));
                      }
                    }}
                    disabled={adminCreate.creating}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 3: DOB & Gender */}
            <div className="ast-fields-row">
              <div className="ast-field-group">
                <label>Date of Birth</label>
                <div className="ast-field-input-wrapper">
                  <FaCalendarAlt className="ast-field-input-icon" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      const calculatedAge = dobToAgeYears(e.target.value);
                      setAge(calculatedAge);
                      if (phone && calculatedAge) {
                        setNic(makeNIC(phone, calculatedAge));
                      }
                    }}
                    disabled={adminCreate.creating}
                  />
                </div>
              </div>

              <div className="ast-field-group">
                <label>
                  Gender <span className="ast-required-star">*</span>
                </label>
                <div className="ast-field-input-wrapper">
                  <FaVenusMars className="ast-field-input-icon" />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={adminCreate.creating}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 4: NIC & Password */}
            <div className="ast-fields-row">
              <div className="ast-field-group">
                <label>National ID / NIC</label>
                <div className="ast-field-input-wrapper">
                  <FaIdCard className="ast-field-input-icon" />
                  <input
                    type="text"
                    placeholder="Auto-generated or ID number"
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    disabled={adminCreate.creating}
                  />
                </div>
              </div>

              <div className="ast-field-group">
                <label>
                  Password <span className="ast-required-star">*</span>
                </label>
                <div className="ast-field-input-wrapper">
                  <FaLock className="ast-field-input-icon" />
                  <input
                    type="password"
                    placeholder="Enter login password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={adminCreate.creating}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Doctor Assignment Section */}
            <div className="ast-doctor-assignment-section">
              <div className="ast-doc-section-header">
                <div className="ast-doc-section-title-wrap">
                  <FaStethoscope className="ast-doc-section-icon" />
                  <span className="ast-doc-section-title">
                    Doctor Assignment
                  </span>
                  <span className="ast-doc-section-count">
                    {role === "Admin"
                      ? `${assignedDoctors.length} Selected`
                      : "Doctor Assigned"}
                  </span>
                </div>

                {role === "Admin" && availableDoctors.length > 0 && (
                  <div className="ast-doc-section-actions">
                    <button
                      type="button"
                      className="ast-doc-action-btn"
                      onClick={handleSelectAllDoctors}
                      disabled={adminCreate.creating}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="ast-doc-action-btn"
                      onClick={handleClearAllDoctors}
                      disabled={adminCreate.creating}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {role === "Admin" ? (
                availableDoctors.length > 0 ? (
                  <div className="ast-doctors-grid">
                    {availableDoctors.map((doc) => {
                      const isSelected = assignedDoctors.includes(doc._id);
                      return (
                        <div
                          key={doc._id}
                          className={`ast-doctor-card-toggle ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => handleToggleDoctor(doc._id)}
                        >
                          <input
                            type="checkbox"
                            className="ast-doc-checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by container click
                            disabled={adminCreate.creating}
                          />
                          <img
                            src={resolveAvatarUrl(doc.docAvatar)}
                            alt={doc.firstName}
                            className="ast-doc-avatar-small"
                            onError={(e) => {
                              e.target.src = "/doc1.jpg";
                            }}
                          />
                          <div className="ast-doc-info-text">
                            <span className="ast-doc-name-text">
                              Dr. {doc.firstName} {doc.lastName}
                            </span>
                            <span className="ast-doc-dept-badge">
                              {doc.doctorDepartment || "General Medicine"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ast-no-doctors-hint">
                    No active doctors found in the system.
                  </div>
                )
              ) : (
                <div className="ast-doctor-self-assign-box">
                  <img
                    src={resolveAvatarUrl(admin?.docAvatar)}
                    alt={admin?.firstName || "Doctor"}
                    className="ast-doctor-self-avatar"
                    onError={(e) => {
                      e.target.src = "/doc1.jpg";
                    }}
                  />
                  <div className="ast-doctor-self-text">
                    <span className="ast-doctor-self-label">
                      Assigned Direct Doctor
                    </span>
                    <span className="ast-doctor-self-name">
                      Dr. {admin?.firstName} {admin?.lastName}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="ast-form-footer">
              <button
                ref={setupClickSound}
                type="button"
                className="ast-cancel-btn"
                onClick={() => navigate("/compounders")}
                disabled={adminCreate.creating}
              >
                Cancel
              </button>

              <button
                ref={setupClickSound}
                type="submit"
                className="ast-submit-btn"
                disabled={adminCreate.creating}
              >
                <FaUserPlus />
                <span>
                  {adminCreate.creating
                    ? "Registering..."
                    : "Register Assistant"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AddNewMedicatAssistant;
