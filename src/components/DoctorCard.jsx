import React from "react";
import RequirePermission from "./RequirePermission";
import { FaTrashAlt, FaEdit, FaEye, FaUserMd, FaStethoscope } from "react-icons/fa";
import { MdEmail, MdOutlineMedicalServices } from "react-icons/md";
import { PiPhoneCallFill, PiIdentificationCardFill } from "react-icons/pi";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import useClickSound from "../hooks/useClickSound";

import api from "../utils/api";

const DoctorCard = ({
  doctor,
  onView,
  onEdit,
  onDelete,
  allowAdminActions = true,
}) => {
  const setupClickSound = useClickSound();

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

  const avatarUrl = resolveAvatarUrl(doctor.docAvatar);

  // Format name with Dr. prefix if not already present
  const rawFirstName = doctor.firstName || "";
  const rawLastName = doctor.lastName || "";
  const fullName = `${rawFirstName} ${rawLastName}`.trim();
  const displayName = fullName.toLowerCase().startsWith("dr.") || fullName.toLowerCase().startsWith("dr ")
    ? fullName
    : `Dr. ${fullName}`;

  const department = doctor.doctorDepartment || "General Medicine";
  const qualifications = doctor.qualifications || null;
  const fee = doctor.consultationFee ? Number(doctor.consultationFee) : null;
  const nic = doctor.nic && doctor.nic.trim() ? doctor.nic.trim() : null;

  return (
    <div className="doctor-modern-card">
      {/* Top Accent Stripe */}
      <div className="doc-card-accent-bar" />

      <div className="doc-card-body">
        {/* Header: Avatar + Identity */}
        <div className="doc-card-header">
          <div className="doc-avatar-wrapper">
            <img
              src={avatarUrl}
              alt={displayName}
              className="doc-avatar-img"
              onError={(e) => {
                e.target.src = "/doc1.jpg";
              }}
            />
            <span className="doc-status-indicator" title="Available for OPD" />
          </div>

          <div className="doc-identity-info">
            <h3 className="doc-name-heading" title={displayName}>
              {displayName}
            </h3>

            {qualifications && (
              <p className="doc-qualifications-sub" title={qualifications}>
                {qualifications}
              </p>
            )}

            <div className="doc-dept-badge" title={`Department: ${department}`}>
              <FaStethoscope className="doc-dept-icon" />
              <span>{department}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="doc-card-divider" />

        {/* Contact & Meta Details Grid */}
        <div className="doc-details-grid">
          {doctor.email && (
            <div className="doc-detail-item" title={doctor.email}>
              <div className="doc-detail-icon-box email-box">
                <MdEmail />
              </div>
              <span className="doc-detail-text">{doctor.email}</span>
            </div>
          )}

          {doctor.phone && (
            <div className="doc-detail-item" title={doctor.phone}>
              <div className="doc-detail-icon-box phone-box">
                <PiPhoneCallFill />
              </div>
              <span className="doc-detail-text">{doctor.phone}</span>
            </div>
          )}

          <div className="doc-detail-meta-row">
            {nic && (
              <div className="doc-meta-chip" title={`National ID: ${nic}`}>
                <PiIdentificationCardFill className="meta-chip-icon" />
                <span>NIC: {nic}</span>
              </div>
            )}

            {doctor.gender && (
              <div className="doc-meta-chip" title={`Gender: ${doctor.gender}`}>
                <span>{doctor.gender}</span>
              </div>
            )}

            {fee !== null && fee > 0 && (
              <div className="doc-meta-chip fee-chip" title={`Consultation Fee: ₹${fee}`}>
                <RiMoneyRupeeCircleLine className="meta-chip-icon" />
                <span>₹{fee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Actions Footer */}
        <div className="doc-card-footer">
          {allowAdminActions && (
            <RequirePermission allowedRoles={["Admin"]}>
              <div className="doc-admin-actions">
                <button
                  ref={setupClickSound}
                  type="button"
                  title="Edit Doctor"
                  className="doc-icon-btn edit-btn"
                  onClick={() => onEdit && onEdit(doctor)}
                >
                  <FaEdit />
                </button>
                <button
                  ref={setupClickSound}
                  type="button"
                  title="Delete Doctor"
                  className="doc-icon-btn delete-btn"
                  onClick={() => onDelete && onDelete(doctor)}
                >
                  <FaTrashAlt />
                </button>
              </div>
            </RequirePermission>
          )}

          <button
            ref={setupClickSound}
            type="button"
            className="doc-view-profile-btn"
            onClick={() => onView && onView(doctor)}
            title="View Details & OPD Schedule"
          >
            <FaEye style={{ marginRight: 6 }} />
            <span>View Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
