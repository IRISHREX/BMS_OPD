import React from "react";
import RequirePermission from "./RequirePermission";
import { FaTrashAlt, FaEdit, FaEye, FaUserNurse, FaCalendarAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { PiPhoneCallFill, PiIdentificationCardFill, PiGenderIntersexFill } from "react-icons/pi";
import { FaUserDoctor } from "react-icons/fa6";
import useClickSound from "../hooks/useClickSound";
import api from "../utils/api";

const AssistantCard = ({
  assistant,
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

  const avatarUrl = resolveAvatarUrl(assistant.docAvatar);

  const rawFirstName = assistant.firstName || "";
  const rawLastName = assistant.lastName || "";
  const fullName = `${rawFirstName} ${rawLastName}`.trim() || "Assistant";

  const nic = assistant.nic && assistant.nic.trim() ? assistant.nic.trim() : null;
  const dob = assistant.dob ? assistant.dob.substring(0, 10) : null;
  const assignedDocs = assistant.assignedDoctors || [];

  return (
    <div className="assistant-modern-card">
      {/* Top Accent Stripe */}
      <div className="assistant-card-accent-bar" />

      <div className="assistant-card-body">
        {/* Header: Avatar + Identity */}
        <div className="assistant-card-header">
          <div className="assistant-avatar-wrapper">
            <img
              src={avatarUrl}
              alt={fullName}
              className="assistant-avatar-img"
              onError={(e) => {
                e.target.src = "/doc1.jpg";
              }}
            />
            <span className="assistant-status-indicator" title="Active Assistant" />
          </div>

          <div className="assistant-identity-info">
            <h3 className="assistant-name-heading" title={fullName}>
              {fullName}
            </h3>

            <div className="assistant-role-badge">
              <FaUserNurse className="assistant-role-icon" />
              <span>Medical Assistant</span>
            </div>

            {/* Assigned Doctors Pill */}
            <div className="assistant-doctor-badge" title="Assigned Doctors">
              <FaUserDoctor className="assistant-doctor-icon" />
              <span>
                {assignedDocs.length > 0
                  ? assignedDocs
                      .map((d) => (d.firstName ? `Dr. ${d.firstName} ${d.lastName || ""}`.trim() : "Doctor"))
                      .join(", ")
                  : "No Assigned Doctor"}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="assistant-card-divider" />

        {/* Contact & Meta Details Grid */}
        <div className="assistant-details-grid">
          {assistant.email && (
            <div className="assistant-detail-item" title={assistant.email}>
              <div className="assistant-detail-icon-box email-box">
                <MdEmail />
              </div>
              <span className="assistant-detail-text">{assistant.email}</span>
            </div>
          )}

          {assistant.phone && (
            <div className="assistant-detail-item" title={assistant.phone}>
              <div className="assistant-detail-icon-box phone-box">
                <PiPhoneCallFill />
              </div>
              <span className="assistant-detail-text">{assistant.phone}</span>
            </div>
          )}

          {dob && (
            <div className="assistant-detail-item" title={`Date of Birth: ${dob}`}>
              <div className="assistant-detail-icon-box cal-box">
                <FaCalendarAlt />
              </div>
              <span className="assistant-detail-text">DOB: {dob}</span>
            </div>
          )}

          <div className="assistant-detail-meta-row">
            {nic && (
              <div className="assistant-meta-chip" title={`National ID: ${nic}`}>
                <PiIdentificationCardFill className="meta-chip-icon" />
                <span>NIC: {nic}</span>
              </div>
            )}

            {assistant.gender && (
              <div className="assistant-meta-chip" title={`Gender: ${assistant.gender}`}>
                <PiGenderIntersexFill className="meta-chip-icon" />
                <span>{assistant.gender}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Actions Footer */}
        <div className="assistant-card-footer">
          {allowAdminActions && (
            <RequirePermission allowedRoles={["Admin"]}>
              <div className="assistant-admin-actions">
                <button
                  ref={setupClickSound}
                  type="button"
                  title="Edit Assistant"
                  className="assistant-icon-btn edit-btn"
                  onClick={() => onEdit && onEdit(assistant)}
                >
                  <FaEdit />
                </button>
                <button
                  ref={setupClickSound}
                  type="button"
                  title="Delete Assistant"
                  className="assistant-icon-btn delete-btn"
                  onClick={() => onDelete && onDelete(assistant)}
                >
                  <FaTrashAlt />
                </button>
              </div>
            </RequirePermission>
          )}

          <button
            ref={setupClickSound}
            type="button"
            className="assistant-view-profile-btn"
            onClick={() => onView && onView(assistant)}
            title="View Profile Details"
          >
            <FaEye style={{ marginRight: 6 }} />
            <span>View Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantCard;
