import React, { useState } from "react";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { playSaveSound, playLoadSound } from "../utils/soundUtils";
import { RiSendPlaneFill } from "react-icons/ri";
import { MdCancel } from "react-icons/md";
import { FaPenToSquare, FaUserDoctor, FaXmark } from "react-icons/fa6";
import useClickSound from "../hooks/useClickSound";

const ComposeModal = ({ onClose, doctors, user }) => {
  const snackbar = useSnackbar();
  const setupClickSound = useClickSound();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!recipient || !message.trim()) {
      return snackbar.error("Please select a recipient doctor and write a message.");
    }
    try {
      setSending(true);
      playLoadSound();
      await api.post("/api/v1/message/send", {
        firstName: user?.firstName || "Staff",
        lastName: user?.lastName || "Member",
        email: user?.email || "admin@hospital.com",
        phone: user?.phone || "0000000000",
        message: message.trim(),
        recipient,
      });
      playSaveSound();
      snackbar.success("Message sent successfully!");
      onClose();
    } catch (error) {
      snackbar.error(error?.response?.data?.message || "Failed to send message. Please try again.");
      playLoadSound();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-compose-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header Bar */}
        <div className="msg-modal-top-bar">
          <div className="msg-modal-title">
            <FaPenToSquare className="msg-modal-title-icon" />
            <span>Compose New Message</span>
          </div>
          <button
            ref={setupClickSound}
            type="button"
            className="msg-modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <FaXmark />
          </button>
        </div>

        {/* Modal Body */}
        <div className="msg-modal-body">
          {/* Recipient Selector */}
          <div className="msg-modal-field">
            <label>
              <FaUserDoctor style={{ marginRight: 4 }} /> Recipient Doctor *
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="msg-modal-select"
              disabled={sending}
            >
              <option value="">Select a Doctor to message...</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  Dr. {doc.firstName} {doc.lastName} ({doc.doctorDepartment || "General"})
                </option>
              ))}
            </select>
          </div>

          {/* Message Textarea */}
          <div className="msg-modal-field">
            <label>Message Content *</label>
            <textarea
              rows="6"
              placeholder="Write your clinical notes, queries, or updates here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="msg-modal-textarea"
              disabled={sending}
              autoFocus
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="msg-modal-footer">
          <button
            ref={setupClickSound}
            type="button"
            onClick={onClose}
            className="msg-modal-cancel-btn"
            disabled={sending}
          >
            <MdCancel />
            <span>Cancel</span>
          </button>
          <button
            ref={setupClickSound}
            type="button"
            onClick={handleSend}
            className="msg-modal-send-btn"
            disabled={sending || !recipient || !message.trim()}
          >
            <RiSendPlaneFill />
            <span>{sending ? "Sending..." : "Send Message"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
