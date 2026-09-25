import React, { useEffect, useState, useCallback } from "react";
import api from "../utils/api";
import { FaFilePdf, FaDownload, FaXmark, FaCalendarDays, FaSpinner } from "react-icons/fa6";
import "./DownloadPrescriptionModal.css";

/**
 * DownloadPrescriptionModal
 *
 * Props:
 *   patientId  – MongoDB _id of the patient
 *   patientName – display name (optional)
 *   onClose    – callback to dismiss the modal
 */
const DownloadPrescriptionModal = ({ patientId, patientName = "Patient", onClose }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null); // date string being downloaded

  const fetchFiles = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/v1/prescription/pdf-list/${patientId}`);
      setFiles(data.files || []);
    } catch (err) {
      console.error("Failed to fetch prescription PDFs:", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDownload = async (file) => {
    setDownloading(file.date);
    try {
      // Fetch fresh presigned URL then trigger download
      const { data } = await api.get(`/api/v1/prescription/pdf-list/${patientId}`);
      const fresh = (data.files || []).find((f) => f.date === file.date && f.prescriptionId === file.prescriptionId);
      const url = fresh?.presignedUrl || file.presignedUrl;
      if (!url) throw new Error("No download URL available");

      // Trigger download via temporary anchor
      const a = document.createElement("a");
      a.href = url;
      a.download = `Prescription_${patientName.replace(/\s+/g, "_")}_${file.date}.pdf`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert("Download failed: " + (err.message || "Unknown error"));
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown date";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="dpm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dpm-modal">
        <div className="dpm-header">
          <div className="dpm-title">
            <FaFilePdf className="dpm-title-icon" />
            <div>
              <h3>Saved Prescriptions</h3>
              <p className="dpm-subtitle">{patientName}</p>
            </div>
          </div>
          <button className="dpm-close" onClick={onClose} aria-label="Close">
            <FaXmark />
          </button>
        </div>

        <div className="dpm-body">
          {loading ? (
            <div className="dpm-empty">
              <FaSpinner className="dpm-spin" size={32} />
              <p>Loading prescriptions…</p>
            </div>
          ) : files.length === 0 ? (
            <div className="dpm-empty">
              <FaFilePdf size={40} style={{ opacity: 0.25 }} />
              <p>No saved prescriptions found.</p>
              <p className="dpm-hint">
                Generate and save a prescription from the Prescription editor to store PDFs here.
              </p>
            </div>
          ) : (
            <ul className="dpm-list">
              {files.map((file, idx) => (
                <li key={`${file.prescriptionId}-${file.date}`} className="dpm-item">
                  <span className="dpm-badge">{idx === 0 ? "Latest" : `#${idx + 1}`}</span>
                  <div className="dpm-item-info">
                    <FaCalendarDays className="dpm-cal-icon" />
                    <div>
                      <span className="dpm-date">{formatDate(file.date)}</span>
                      {file.savedAt && (
                        <span className="dpm-saved-at">
                          Saved {new Date(file.savedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={`dpm-download-btn ${downloading === file.date ? "dpm-loading" : ""}`}
                    onClick={() => handleDownload(file)}
                    disabled={!!downloading}
                    title="Download PDF"
                  >
                    {downloading === file.date ? (
                      <FaSpinner className="dpm-spin" size={16} />
                    ) : (
                      <FaDownload size={16} />
                    )}
                    <span>{downloading === file.date ? "Downloading…" : "Download"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dpm-footer">
          <p className="dpm-cap-note">Up to 3 prescriptions are retained per patient</p>
        </div>
      </div>
    </div>
  );
};

export default DownloadPrescriptionModal;
