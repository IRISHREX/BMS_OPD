import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useSnackbar } from "../context/SnackbarContext";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Context } from "../main";
import api from "../utils/api";
import { playSaveSound, playDeleteSound } from "../utils/soundUtils";
import { fetchMessagesRequest } from "../store/messagesSlice";
import "./Messages.css";
import "./MessageCard.css";

import MessageList from "./MessageList";
import MessageFilter from "./MessageFilter";
import BulkActions from "./BulkActions";
import Pagination from "./Pagination";
import ComposeModal from "./ComposeModal";
import useClickSound from "../hooks/useClickSound";
import DownloadPrescriptionModal from "./DownloadPrescriptionModal";

import {
  FaInbox,
  FaEnvelopeOpenText,
  FaPenToSquare,
  FaFilter,
  FaCheckDouble,
  FaEnvelope,
  FaArrowRotateRight,
} from "react-icons/fa6";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Messages = () => {
  const snackbar = useSnackbar();
  const { isAuthenticated, admin: user } = useContext(Context);
  const dispatch = useDispatch();
  const setupClickSound = useClickSound();
  const navigate = useNavigate();

  const {
    messages = [],
    totalPages = 1,
    counts = { total: 0, read: 0, unread: 0 },
    loading,
  } = useSelector((s) => s.messages);

  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("messages_filters");
    return saved
      ? JSON.parse(saved)
      : {
          q: "",
          email: "",
          page: 1,
          doctorId: "",
          filterOption: "All",
          customStart: "",
          customEnd: "",
        };
  });

  useEffect(() => {
    sessionStorage.setItem("messages_filters", JSON.stringify(filters));
  }, [filters]);

  const [selected, setSelected] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [downloadPrescriptionPatient, setDownloadPrescriptionPatient] = useState(null);

  const debouncedQ = useDebounce(filters.q, 400);
  const debouncedEmail = useDebounce(filters.email, 400);

  const messageIdsOnPage = useMemo(
    () => messages.map((m) => m._id),
    [messages]
  );

  useEffect(() => {
    const fetchAndSetDoctors = async () => {
      if (!user) return;
      try {
        const { data } = await api.get(`/api/v1/user/doctors`);
        const doctors = data.doctors || [];
        setAllDoctors(doctors);

        if (user.role === "Doctor") {
          setFilters((prev) => ({ ...prev, doctorId: user._id }));
        }
      } catch (error) {
        snackbar.error("Failed to fetch doctors");
      }
    };

    fetchAndSetDoctors();
  }, [user]);

  const fetchMessages = useCallback(() => {
    const { page, doctorId, filterOption, customStart, customEnd } = filters;
    dispatch(
      fetchMessagesRequest({
        q: debouncedQ,
        email: debouncedEmail,
        page,
        doctorId,
        filterOption,
        customStart,
        customEnd,
      })
    );
  }, [filters, debouncedQ, debouncedEmail, dispatch]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const clearSearch = () => {
    setFilters({
      q: "",
      email: "",
      page: 1,
      doctorId: user?.role === "Doctor" ? user._id : "",
      filterOption: "All",
      customStart: "",
      customEnd: "",
    });
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setFilters((prev) => ({ ...prev, page: p }));
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelected(
      selected.length === messageIdsOnPage.length ? [] : messageIdsOnPage
    );
  };

  const updateMessageStatus = async (ids, read) => {
    const action = read ? "read" : "unread";
    if (ids.length === 0) return snackbar.info("No messages selected");

    try {
      await api.post(`/api/v1/message/bulk-update`, { ids, read });
      playSaveSound();
      snackbar.success(`Marked as ${action}`);
      setSelected([]);
      fetchMessages();
    } catch (err) {
      snackbar.error(`Failed to mark as ${action}`);
    }
  };

  const deleteMessages = async (ids) => {
    if (ids.length === 0) {
      snackbar.info("No messages selected");
      return;
    }

    snackbar.confirm(`Delete ${ids.length} selected message(s)?`, async () => {
      try {
        await api.post(`/api/v1/message/bulk-delete`, { ids });
        snackbar.success("Messages deleted successfully");
        playDeleteSound?.();
        setSelected([]);
        fetchMessages();
      } catch (err) {
        snackbar.error("Failed to delete messages");
      }
    });
  };

  const handleReply = async (originalMessage, replyText) => {
    try {
      const userPhone = String(user?.phone || "").replace(/\D/g, "");
      const validPhone = userPhone.length >= 10 ? userPhone.slice(0, 10) : "9876543210";

      await api.post("/api/v1/message/send", {
        firstName: user?.firstName || "Staff",
        lastName: user?.lastName || "Member",
        email: user?.email || "admin@hospital.com",
        phone: validPhone,
        message: `Re: ${originalMessage.message}\n\n${replyText}`,
        recipientEmail: originalMessage.email,
        recipient: originalMessage.recipient?._id,
      });
      snackbar.success("Reply sent successfully!");
      fetchMessages();
    } catch (error) {
      snackbar.error(error?.response?.data?.message || "Failed to send reply.");
    }
  };

  const handleDownloadPrescription = async (message) => {
    const phone = String(message.phone || "").replace(/\D/g, "");
    const name = `${message.firstName || ""} ${message.lastName || ""}`.trim() || "Patient";
    if (!phone) {
      snackbar.error("No phone number found in this message to look up patient.");
      return;
    }
    try {
      const { data } = await api.get(`/api/v1/user/patients?search=${phone}`);
      const patients = data.patients || data.users || [];
      const found = patients.find(
        (p) => String(p.phone || "").replace(/\D/g, "").endsWith(phone.slice(-10))
      );
      if (found) {
        setDownloadPrescriptionPatient({ patientId: found._id, name });
      } else {
        snackbar.error("Could not find a registered patient matching this message's phone number.");
      }
    } catch (err) {
      snackbar.error("Failed to look up patient: " + (err?.response?.data?.message || err.message));
    }
  };

  // Build doctor list according to the logged-in user's role
  const filteredDoctors = (() => {
    if (!user) return [];
    if (user.role === "Admin") return allDoctors;
    if (user.role === "Compounder") {
      const assigned = (user.assignedDoctors || []).map((ad) =>
        String(ad._id || ad)
      );
      return allDoctors.filter((doc) => assigned.includes(String(doc._id)));
    }
    return allDoctors.filter((doc) => String(doc._id) === String(user._id));
  })();

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <section className="page messages-page">
      <div className="msg-page-container">
        {/* Modern Themed Top Toolbar */}
        <div className="msg-page-top-bar">
          <div className="msg-page-top-bar-left">
            <div className="msg-page-icon-wrapper">
              <FaInbox />
            </div>
            <div className="msg-page-title-group">
              <div className="msg-page-main-heading-row">
                <h1 className="msg-page-main-heading">Messages & Notifications</h1>
                {counts.unread > 0 && (
                  <span className="msg-unread-pill-tag">
                    {counts.unread} New
                  </span>
                )}
              </div>
              <span className="msg-page-breadcrumb">
                Communications &rsaquo; Inbox & Alerts
              </span>
            </div>
          </div>

          <div className="msg-page-top-bar-right">
            <button
              ref={setupClickSound}
              type="button"
              className="msg-compose-cta-btn"
              onClick={() => setShowComposeModal(true)}
            >
              <FaPenToSquare />
              <span>Compose Message</span>
            </button>
          </div>
        </div>

        {/* Compose Modal */}
        {showComposeModal && (
          <ComposeModal
            onClose={() => {
              setShowComposeModal(false);
              fetchMessages();
            }}
            doctors={allDoctors}
            user={user}
          />
        )}

        {/* Filter Controls & Search Card */}
        <div className="msg-controls-card">
          <MessageFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearSearch}
            user={user}
            filteredDoctors={filteredDoctors}
          />

          {/* Metric Badges & Bulk Action Toolbar Row */}
          <div className="msg-summary-toolbar-row">
            {/* Metric Filter Badges */}
            <div className="msg-stat-badges-group">
              <div className="msg-stat-badge total">
                <FaEnvelope className="msg-stat-badge-icon" />
                <span className="msg-stat-badge-label">Total Messages</span>
                <span className="msg-stat-badge-value">{counts.total}</span>
              </div>

              <div
                className={`msg-stat-badge unread ${
                  counts.unread > 0 ? "active-unread" : ""
                }`}
              >
                <span className="msg-stat-dot" />
                <span className="msg-stat-badge-label">Unread</span>
                <span className="msg-stat-badge-value">{counts.unread}</span>
              </div>

              <div className="msg-stat-badge read">
                <FaCheckDouble className="msg-stat-badge-icon" />
                <span className="msg-stat-badge-label">Read</span>
                <span className="msg-stat-badge-value">{counts.read}</span>
              </div>
            </div>

            {/* Bulk Actions */}
            <BulkActions
              selected={selected}
              onSelectAll={toggleSelectAll}
              onUpdateStatus={updateMessageStatus}
              onDelete={deleteMessages}
              isAllSelected={
                selected.length > 0 &&
                selected.length === messageIdsOnPage.length
              }
            />
          </div>
        </div>

        {/* Messages Content List */}
        {loading ? (
          <div className="msg-loading-state">
            <div className="msg-spinner-ring" />
            <p>Loading messages & notifications...</p>
          </div>
        ) : messages.length > 0 ? (
          <div className="msg-list-wrapper">
            <MessageList
              messages={messages}
              selected={selected}
              onToggleSelect={toggleSelect}
              onUpdateStatus={updateMessageStatus}
              onDelete={deleteMessages}
              onReply={handleReply}
              onDownloadPrescription={handleDownloadPrescription}
            />

            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        ) : (
          <div className="msg-empty-state">
            <div className="msg-empty-icon-box">
              <FaEnvelopeOpenText />
            </div>
            <h3>No Messages Found</h3>
            <p>
              {filters.q || filters.filterOption !== "All" || filters.doctorId
                ? "No communications match your current filter criteria. Try clearing search filters."
                : "Your inbox is currently empty. New patient inquiries and prescription notifications will appear here."}
            </p>
            {(filters.q || filters.filterOption !== "All" || filters.doctorId) && (
              <button
                ref={setupClickSound}
                type="button"
                className="msg-empty-reset-btn"
                onClick={clearSearch}
              >
                <FaArrowRotateRight />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Download Prescription PDFs Modal */}
      {downloadPrescriptionPatient && (
        <DownloadPrescriptionModal
          patientId={downloadPrescriptionPatient.patientId}
          patientName={downloadPrescriptionPatient.name}
          onClose={() => setDownloadPrescriptionPatient(null)}
        />
      )}
    </section>
  );
};

export default Messages;
