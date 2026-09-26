import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../context/SnackbarContext";
import { Context } from "../main";
import { dobToAgeYears, ageToDob } from "../utils/ageUtils";
import { makeNIC } from "../utils/nicMaker";
import { useDispatch, useSelector } from "react-redux";
import {
  createDoctorRequest,
  resetDoctorCreate,
} from "../store/doctorCreateSlice";
import {
  updateDoctorRequest,
  resetDoctorUpdate,
} from "../store/doctorUpdateSlice";
import { fetchDoctorsRequest } from "../store/doctorsSlice";
import useClickSound from "../hooks/useClickSound";
import {
  FaUserMd,
  FaCamera,
  FaFileSignature,
  FaStamp,
  FaHeading,
  FaTimes,
  FaSave,
  FaStethoscope,
} from "react-icons/fa";
import { BsArrowLeft } from "react-icons/bs";
import { MdOutlineCloudUpload } from "react-icons/md";
import api from "../utils/api";
import "./AddNewDoctor.css";

const AddNewDoctor = ({ initialData, isEditing, onClose }) => {
  const snackbar = useSnackbar();
  const { isAuthenticated } = useContext(Context);
  const setupClickSound = useClickSound();
  const avatarInputRef = useRef(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [doctorDepartment, setDoctorDepartment] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [docAvatar, setDocAvatar] = useState("");
  const [docAvatarPreview, setDocAvatarPreview] = useState("");
  const [signImage, setSignImage] = useState("");
  const [signImagePreview, setSignImagePreview] = useState("");
  const [stampImage, setStampImage] = useState("");
  const [stampImagePreview, setStampImagePreview] = useState("");
  const [headerImage, setHeaderImage] = useState("");
  const [headerImagePreview, setHeaderImagePreview] = useState("");
  const [footerImage, setFooterImage] = useState("");
  const [footerImagePreview, setFooterImagePreview] = useState("");
  const [age, setAge] = useState("");

  const resolveImageUrl = (img) => {
    if (!img) return "";
    const url = typeof img === "string" ? img : img.url || "";
    if (!url) return "";
    if (
      url.startsWith("data:") ||
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }
    const base = api.defaults.baseURL || "";
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  };

  useEffect(() => {
    if (isEditing && initialData) {
      setFirstName(initialData.firstName || "");
      setLastName(initialData.lastName || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setNic(initialData.nic || "");
      setDob(initialData.dob ? initialData.dob.substring(0, 10) : "");
      setGender(initialData.gender || "");
      setDoctorDepartment(initialData.doctorDepartment || "");
      setQualifications(initialData.qualifications || "");
      setConsultationFee(initialData.consultationFee || "");
      setDocAvatarPreview(resolveImageUrl(initialData.docAvatar));
      setSignImagePreview(resolveImageUrl(initialData.signImage));
      setStampImagePreview(resolveImageUrl(initialData.stampImage));
      setHeaderImagePreview(resolveImageUrl(initialData.headerImage));
      setFooterImagePreview(resolveImageUrl(initialData.footerImage));
      const ageFromDob = initialData.dob ? dobToAgeYears(initialData.dob) : "";
      setAge(ageFromDob);
    }
  }, [isEditing, initialData]);

  const dispatch = useDispatch();
  const doctorCreate = useSelector((s) => s.doctorCreate);
  const doctorUpdate = useSelector((s) => s.doctorUpdate);
  const navigate = useNavigate();

  const isSubmitting = isEditing ? doctorUpdate?.updating : doctorCreate?.creating;

  const departmentsArray = [
    "General Medicine",
    "Pathology & Diagnostics",
    "Pediatrics",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Oncology",
    "Radiology",
    "Physical Therapy",
    "Dermatology",
    "ENT",
  ];

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocAvatar(file);
      const reader = new FileReader();
      reader.onload = () => setDocAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSignImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignImage(file);
      const reader = new FileReader();
      reader.onload = () => setSignImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleStampImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStampImage(file);
      const reader = new FileReader();
      reader.onload = () => setStampImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderImage(file);
      const reader = new FileReader();
      reader.onload = () => setHeaderImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFooterImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFooterImage(file);
      const reader = new FileReader();
      reader.onload = () => setFooterImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !phone || !gender || !doctorDepartment) {
      snackbar.error("Please fill in all required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("nic", nic);
    formData.append("dob", dob);
    formData.append("gender", gender);
    formData.append("doctorDepartment", doctorDepartment);
    formData.append("qualifications", qualifications);
    if (consultationFee) formData.append("consultationFee", consultationFee);

    if (docAvatar) formData.append("docAvatar", docAvatar);
    if (signImage) formData.append("signImage", signImage);
    if (stampImage) formData.append("stampImage", stampImage);
    if (headerImage) formData.append("headerImage", headerImage);
    if (footerImage) formData.append("footerImage", footerImage);

    if (isEditing) {
      dispatch(updateDoctorRequest({ id: initialData._id, formData }));
    } else {
      if (!password) {
        snackbar.error("Password is required for registration!");
        return;
      }
      formData.append("password", password);
      dispatch(createDoctorRequest(formData));
    }
  };

  useEffect(() => {
    if (!isEditing && doctorCreate?.success) {
      snackbar.success("Doctor registered successfully!");
      dispatch(resetDoctorCreate());
      navigate("/doctors");
    }
  }, [doctorCreate?.success, isEditing, dispatch, navigate, snackbar]);

  useEffect(() => {
    if (isEditing && doctorUpdate?.success) {
      dispatch(resetDoctorUpdate());
      dispatch(fetchDoctorsRequest({}));
      if (onClose) onClose();
    }
  }, [doctorUpdate?.success, isEditing, dispatch, onClose]);

  const formContent = (
    <div className={`modern-doctor-form-wrapper ${isEditing ? "modal-mode" : "page-mode"}`}>
      {/* Modal Top Header Bar */}
      <div className="doc-edit-modal-top-bar">
        <div className="doc-edit-modal-title">
          <FaUserMd style={{ color: "var(--accent, #1a9e9b)", fontSize: "1.2rem" }} />
          <span>{isEditing ? "Edit Doctor Profile" : "Register A New Doctor"}</span>
        </div>

        {isEditing && onClose && (
          <button
            type="button"
            className="doc-edit-modal-close-btn"
            onClick={onClose}
            title="Close modal"
          >
            <FaTimes />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="modern-doctor-edit-form">
        <div className="doc-edit-body-layout">
          {/* Left Column: Avatar & Quick Profile Box */}
          <div className="doc-edit-avatar-section">
            <div className="doc-avatar-uploader-card">
              <div
                className="doc-avatar-preview-box"
                onClick={() => avatarInputRef.current?.click()}
                title="Click to upload/change photo"
              >
                <img
                  src={docAvatarPreview || "/doc1.jpg"}
                  alt="Doctor Avatar"
                  onError={(e) => {
                    e.target.src = "/doc1.jpg";
                  }}
                />
                <div className="doc-avatar-overlay">
                  <FaCamera />
                  <span>Change Photo</span>
                </div>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                onChange={handleAvatar}
                accept="image/*"
                style={{ display: "none" }}
              />

              <button
                type="button"
                className="doc-avatar-upload-trigger-btn"
                onClick={() => avatarInputRef.current?.click()}
              >
                <MdOutlineCloudUpload style={{ fontSize: "1.1rem" }} />
                <span>Upload Avatar</span>
              </button>

              <div className="doc-avatar-hint">
                Recommended: JPG/PNG, Square 400x400px
              </div>
            </div>
          </div>

          {/* Right Column: Form Fields Grid */}
          <div className="doc-edit-fields-section">
            {/* Personal Info Row */}
            <div className="doc-fields-row">
              <div className="doc-field-group">
                <label>First Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="doc-field-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Contact Info Row */}
            <div className="doc-fields-row">
              <div className="doc-field-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="doc-field-group">
                <label>Mobile Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (e.target.value && age) setNic(makeNIC(e.target.value, age));
                  }}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* DOB, Age, Gender Row */}
            <div className="doc-fields-row three-cols">
              <div className="doc-field-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    const newAgeYears = dobToAgeYears(e.target.value);
                    setAge(newAgeYears);
                    if (phone && newAgeYears) setNic(makeNIC(phone, newAgeYears));
                  }}
                  disabled={isSubmitting}
                />
              </div>

              <div className="doc-field-group">
                <label>Age (Years)</label>
                <input
                  type="number"
                  placeholder="e.g. 42"
                  value={age}
                  min={0}
                  max={120}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAge(val);
                    setDob(ageToDob(val));
                    if (phone && val) setNic(makeNIC(phone, val));
                  }}
                  disabled={isSubmitting}
                />
              </div>

              <div className="doc-field-group">
                <label>Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Department, NIC, Fee Row */}
            <div className="doc-fields-row three-cols">
              <div className="doc-field-group">
                <label>Department *</label>
                <select
                  value={doctorDepartment}
                  onChange={(e) => setDoctorDepartment(e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select Department</option>
                  {departmentsArray.map((dept, idx) => (
                    <option value={dept} key={idx}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="doc-field-group">
                <label>National ID / NIC</label>
                <input
                  type="text"
                  placeholder="Auto-generated / ID"
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="doc-field-group">
                <label>Consultation Fee (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Qualifications & Password */}
            <div className="doc-fields-row">
              <div className="doc-field-group" style={{ flex: 2 }}>
                <label>Qualifications & Degrees</label>
                <input
                  type="text"
                  placeholder="e.g. MBBS, MD (General Medicine), DNB"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {!isEditing && (
                <div className="doc-field-group" style={{ flex: 1 }}>
                  <label>Password *</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prescription Branding Assets Section */}
        <div className="doc-prescription-assets-card">
          <div className="doc-assets-header">
            <FaFileSignature className="doc-assets-icon" />
            <div>
              <h4 className="doc-assets-title">Prescription Branding Assets (Optional)</h4>
              <p className="doc-assets-sub">Upload doctor signature, stamp, and letterhead headers</p>
            </div>
          </div>

          <div className="doc-assets-grid">
            {/* Signature Upload Tile */}
            <div className="doc-asset-tile">
              <div className="doc-asset-meta">
                <FaFileSignature />
                <span>Doctor Signature</span>
              </div>
              <div className="doc-asset-preview-row">
                {signImagePreview ? (
                  <img src={signImagePreview} alt="Sign Preview" className="doc-asset-thumb" />
                ) : (
                  <div className="doc-asset-thumb-placeholder">No Sign</div>
                )}
                <label className="doc-asset-upload-btn">
                  <span>{signImagePreview ? "Replace" : "Upload"}</span>
                  <input type="file" onChange={handleSignImage} accept="image/*" />
                </label>
              </div>
            </div>

            {/* Stamp Upload Tile */}
            <div className="doc-asset-tile">
              <div className="doc-asset-meta">
                <FaStamp />
                <span>Medical Stamp</span>
              </div>
              <div className="doc-asset-preview-row">
                {stampImagePreview ? (
                  <img src={stampImagePreview} alt="Stamp Preview" className="doc-asset-thumb" />
                ) : (
                  <div className="doc-asset-thumb-placeholder">No Stamp</div>
                )}
                <label className="doc-asset-upload-btn">
                  <span>{stampImagePreview ? "Replace" : "Upload"}</span>
                  <input type="file" onChange={handleStampImage} accept="image/*" />
                </label>
              </div>
            </div>

            {/* Header Letterhead Tile */}
            <div className="doc-asset-tile">
              <div className="doc-asset-meta">
                <FaHeading />
                <span>Header Letterhead</span>
              </div>
              <div className="doc-asset-preview-row">
                {headerImagePreview ? (
                  <img src={headerImagePreview} alt="Header Preview" className="doc-asset-thumb banner-thumb" />
                ) : (
                  <div className="doc-asset-thumb-placeholder banner-thumb">No Header</div>
                )}
                <label className="doc-asset-upload-btn">
                  <span>{headerImagePreview ? "Replace" : "Upload"}</span>
                  <input type="file" onChange={handleHeaderImage} accept="image/*" />
                </label>
              </div>
            </div>

            {/* Footer Letterhead Tile */}
            <div className="doc-asset-tile">
              <div className="doc-asset-meta">
                <FaHeading />
                <span>Footer Letterhead</span>
              </div>
              <div className="doc-asset-preview-row">
                {footerImagePreview ? (
                  <img src={footerImagePreview} alt="Footer Preview" className="doc-asset-thumb banner-thumb" />
                ) : (
                  <div className="doc-asset-thumb-placeholder banner-thumb">No Footer</div>
                )}
                <label className="doc-asset-upload-btn">
                  <span>{footerImagePreview ? "Replace" : "Upload"}</span>
                  <input type="file" onChange={handleFooterImage} accept="image/*" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="doc-edit-footer-actions">
          {isEditing && onClose && (
            <button
              ref={setupClickSound}
              type="button"
              className="doc-edit-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}

          <button
            ref={setupClickSound}
            type="submit"
            className="doc-edit-submit-btn"
            disabled={isSubmitting}
          >
            <FaSave />
            <span>
              {isSubmitting
                ? "Saving Changes..."
                : isEditing
                  ? "Update Doctor"
                  : "Register New Doctor"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );

  if (isEditing) {
    return formContent;
  }

  return (
    <section className="page doctor-register-page">
      <div className="doc-register-page-container">
        {/* Modern Themed Top Nav Bar */}
        <div className="doc-page-top-bar">
          <div className="doc-page-top-bar-left">
            <button
              ref={setupClickSound}
              type="button"
              className="doc-page-back-btn"
              onClick={() => navigate("/doctors")}
              title="Back to Doctors Directory"
            >
              <BsArrowLeft />
            </button>
            <div className="doc-page-title-group">
              <h1 className="doc-page-main-heading">
                <FaUserMd className="doc-page-heading-icon" />
                <span>Register New Doctor</span>
              </h1>
              <span className="doc-page-breadcrumb">Doctors Directory &rsaquo; Register New Doctor</span>
            </div>
          </div>
        </div>

        {formContent}
      </div>
    </section>
  );
};

export default AddNewDoctor;
