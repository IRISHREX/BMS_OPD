import React, { useState } from "react";
import "./MessageCard.css";
import {
  MdDelete,
  MdMarkEmailRead,
  MdMarkEmailUnread,
  MdReply,
  MdSend,
  MdClose,
} from "react-icons/md";
import {
  FaBell,
  FaFilePrescription,
  FaUser,
  FaUserDoctor,
  FaFilePdf,
  FaCalendarCheck,
  FaArrowUpRightFromSquare,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa6";
import useClickSound from "../hooks/useClickSound";

// Helper to determine message type icon & badge
const getMessageMeta = (message) => {
  const text = (message.message || "").toLowerCase();
  const senderName = `${message.firstName || ""} ${message.lastName || ""}`.toLowerCase();

  if (
    text.includes("prescription completed") ||
    text.includes("preview/") ||
    senderName.includes("system")
  ) {
    return {
      type: "system",
      icon: <FaFilePrescription />,
      badgeLabel: "Prescription Alert",
      badgeClass: "badge-prescription",
    };
  }

  if (text.includes("appointment")) {
    return {
      type: "appointment",
      icon: <FaCalendarCheck />,
      badgeLabel: "Appointment Update",
      badgeClass: "badge-appointment",
    };
  }

  if (message.email?.includes("notifications") || senderName.includes("notification")) {
    return {
      type: "system",
      icon: <FaBell />,
      badgeLabel: "System Notification",
      badgeClass: "badge-system",
    };
  }

  return {
    type: "user",
    icon: <FaUser />,
    badgeLabel: "Direct Message",
    badgeClass: "badge-user",
  };
};

// Helper for formatted date
const formatTimestamp = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return dateStr;
  }
};

const MessageCard = ({
  message,
  isSelected,
  onToggleSelect,
  onUpdateStatus,
  onDelete,
  onReply,
  onDownloadPrescription,
}) => {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const setupClickSound = useClickSound();

  const meta = getMessageMeta(message);

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReply(message, replyText);
      setReplyText("");
      setShowReply(false);
    }
  };

  // Parse text for URLs and convert prescription links into formatted pill badges
  const renderMessageContent = (content) => {
    if (!content) return "";
    const elements = [];
    const regex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
    let lastIndex = 0;
    let match;

    const pushText = (s) => {
      if (!s) return;
      const parts = s.split("\n");
      parts.forEach((part, idx) => {
        elements.push(part);
        if (idx < parts.length - 1) {
          elements.push(<br key={`br-${elements.length}`} />);
        }
      });
    };

    while ((match = regex.exec(content)) !== null) {
      const idx = match.index;
      if (idx > lastIndex) {
        pushText(content.substring(lastIndex, idx));
      }
      const rawUrl = match[0];
      const href = /^https?:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`;

      // If this is a preview URL, make it a nice action pill
      if (rawUrl.includes("/preview/")) {
        elements.push(
          <a
            key={`link-${elements.length}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="msg-preview-link-pill"
            title="Open Prescription Preview"
          >
            <FaArrowUpRightFromSquare style={{ fontSize: "0.75rem" }} />
            <span>View Prescription Preview</span>
          </a>
        );
      } else {
        elements.push(
          <a
            key={`link-${elements.length}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="msg-inline-link"
          >
            {rawUrl}
          </a>
        );
      }

      lastIndex = idx + match[0].length;
    }

    if (lastIndex < content.length) {
      pushText(content.substring(lastIndex));
    }

    if (elements.length === 0) return content;
    return elements.map((el, i) =>
      typeof el === "string" ? <span key={`t-${i}`}>{el}</span> : el
    );
  };

  const isLongMessage = (message.message || "").length > 140;

  return (
    <div
      className={`modern-msg-card ${!message.read ? "unread" : "read"} ${
        isSelected ? "selected" : ""
      }`}
    >
      {/* Selection Checkbox */}
      <div className="msg-card-checkbox-wrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(message._id)}
          className="msg-card-checkbox"
        />
      </div>

      {/* Type Avatar Badge */}
      <div className={`msg-type-avatar ${meta.badgeClass}`}>
        {meta.icon}
        {!message.read && <span className="msg-unread-pulse-dot" title="Unread Message" />}
      </div>

      {/* Main Content Area */}
      <div className="msg-card-body">
        {/* Header: Sender & Tag */}
        <div className="msg-card-header">
          <div className="msg-sender-info">
            <h3 className="msg-sender-name">
              {message.firstName} {message.lastName}
            </h3>
            <span className={`msg-type-tag ${meta.badgeClass}`}>
              {meta.badgeLabel}
            </span>
          </div>

          <div className="msg-meta-details">
            {message.email && (
              <span className="msg-meta-item">
                <FaEnvelope className="msg-meta-icon" />
                <span>{message.email}</span>
              </span>
            )}
            {message.phone && (
              <span className="msg-meta-item">
                <FaPhone className="msg-meta-icon" />
                <span>{message.phone}</span>
              </span>
            )}
          </div>
        </div>

        {/* Message Text Body */}
        <div
          className={`msg-text-content ${isExpanded ? "expanded" : ""}`}
          onClick={() => isLongMessage && setIsExpanded(!isExpanded)}
          style={{ cursor: isLongMessage ? "pointer" : "default" }}
          title={isLongMessage ? (isExpanded ? "Click to collapse" : "Click to expand") : ""}
        >
          {renderMessageContent(message.message)}
        </div>

        {isLongMessage && (
          <button
            type="button"
            className="msg-expand-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : "Read More..."}
          </button>
        )}

        {/* Card Sub-Footer: Recipient & Timestamp */}
        <div className="msg-card-subfooter">
          {message.recipient && (
            <div className="msg-recipient-chip">
              <FaUserDoctor className="msg-chip-icon" />
              <span>
                To: Dr. {message.recipient.firstName} {message.recipient.lastName}
              </span>
            </div>
          )}

          <div className="msg-timestamp-badge">
            <span>{formatTimestamp(message.createdAt)}</span>
          </div>
        </div>

        {/* Quick Reply Form Drawer */}
        {showReply && (
          <form onSubmit={handleReplySubmit} className="msg-reply-drawer">
            <div className="msg-reply-input-wrap">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response to this sender..."
                rows="3"
                className="msg-reply-textarea"
                autoFocus
              />
            </div>
            <div className="msg-reply-actions">
              <button
                ref={setupClickSound}
                type="button"
                onClick={() => setShowReply(false)}
                className="msg-reply-cancel-btn"
              >
                <MdClose />
                <span>Cancel</span>
              </button>
              <button
                ref={setupClickSound}
                type="submit"
                className="msg-reply-send-btn"
                disabled={!replyText.trim()}
              >
                <MdSend />
                <span>Send Reply</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Right Actions Bar */}
      <div className="msg-card-actions">
        {/* Toggle Read / Unread */}
        <button
          ref={setupClickSound}
          type="button"
          onClick={() => onUpdateStatus([message._id], !message.read)}
          className={`msg-action-btn ${message.read ? "read-btn" : "unread-btn"}`}
          title={message.read ? "Mark as Unread" : "Mark as Read"}
        >
          {message.read ? <MdMarkEmailUnread /> : <MdMarkEmailRead />}
        </button>

        {/* Quick Reply */}
        <button
          ref={setupClickSound}
          type="button"
          onClick={() => setShowReply(!showReply)}
          className={`msg-action-btn reply-btn ${showReply ? "active" : ""}`}
          title="Quick Reply"
        >
          <MdReply />
        </button>

        {/* Download PDF Prescription Button */}
        {onDownloadPrescription && (
          <button
            ref={setupClickSound}
            type="button"
            onClick={() => onDownloadPrescription(message)}
            className="msg-action-btn pdf-btn"
            title="Download Prescription PDFs"
          >
            <FaFilePdf />
          </button>
        )}

        {/* Delete Single Message */}
        <button
          ref={setupClickSound}
          type="button"
          onClick={() => onDelete([message._id])}
          className="msg-action-btn delete-btn"
          title="Delete Message"
        >
          <MdDelete />
        </button>
      </div>
    </div>
  );
};

export default MessageCard;
