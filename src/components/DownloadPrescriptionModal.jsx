import React, { useEffect, useState, useCallback } from "react";
import api from "../utils/api";
import { FaFilePdf, FaDownload, FaXmark, FaCalendarDays, FaSpinner, FaUserDoctor } from "react-icons/fa6";
import "./DownloadPrescriptionModal.css";

/**
 * DownloadPrescriptionModal
 *
 * Fetches saved prescription data records (up to 3) for the patient.
 * On clicking a date, dynamically generates and downloads the PDF on the fly.
 */
const DownloadPrescriptionModal = ({ patientId, patientName = "Patient", onClose }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/v1/prescription/patient/${patientId}`);
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error("Failed to fetch patient prescriptions:", err);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const getFullImageUrl = (imagePath, fallback = null) => {
    if (!imagePath) return fallback;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
      return imagePath;
    }
    const base = api.defaults.baseURL || "";
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${cleanBase}${cleanPath}`;
  };

  const convertToPngDataUri = (url) => {
    if (!url) return Promise.resolve(null);
    if (url.startsWith("data:image/png")) return Promise.resolve(url);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 800;
          canvas.height = img.naturalHeight || img.height || 200;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(url);
        }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  };

  const handleDownload = async (pres) => {
    setGeneratingId(pres._id);
    try {
      const { getGeneralSettings } = await import("../utils/generalSettingsUtil");
      const generalSettings = await getGeneralSettings();
      const defaultHdr = generalSettings?.defaultHeaderImage || "/Header.jpeg";
      const defaultFtr = generalSettings?.defaultFooterImage || "/Footer.png";

      const doc = pres.doctorId || {};
      const hdrUrl = getFullImageUrl(doc.headerImage, defaultHdr);
      const ftrUrl = getFullImageUrl(doc.footerImage, defaultFtr);
      const sgnUrl = doc.signImage ? getFullImageUrl(doc.signImage) : null;
      const stmpUrl = doc.stampImage ? getFullImageUrl(doc.stampImage) : null;

      const [hUri, fUri, sUri, stUri] = await Promise.all([
        convertToPngDataUri(hdrUrl),
        convertToPngDataUri(ftrUrl),
        convertToPngDataUri(sgnUrl),
        convertToPngDataUri(stmpUrl),
      ]);

      const report = {
        ...pres,
        initialComplain: typeof pres.provisionalDiagnosis === "object" ? pres.provisionalDiagnosis?.value : pres.provisionalDiagnosis,
        medicineAdvice: pres.medicines || [],
        clinical_findings: pres.clinicalFindings || {},
        diagnosys: pres.vitals || {},
        additionalAdvice: pres.additionalAdvice || "",
        followUp: pres.followUp || "",
        advice: pres.advice || {},
      };

      const pat = pres.patientId || { name: patientName, _id: patientId };

      const { pdf: makePdf } = await import("@react-pdf/renderer");
      const MyDoc = (await import("./MyDocument")).default;

      const blob = await makePdf(
        <MyDoc
          header={hUri || hdrUrl}
          footer={fUri || ftrUrl}
          p_data={pat}
          dr_data={{ ...doc, headerImage: hUri || hdrUrl, signImage: sUri || null, stampImage: stUri || null }}
          report={report}
          activeTemplate={doc.prescriptionTemplate || "Template 3: Orthopedic Layout"}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date(pres.createdAt).toISOString().slice(0, 10);
      const safeName = (pat.name || `${pat.firstName || ""} ${pat.lastName || ""}`.trim() || patientName).replace(/\s+/g, "_");
      a.download = `Prescription_${safeName}_${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF: " + (err.message || "Unknown error"));
    } finally {
      setGeneratingId(null);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "Unknown date";
    const d = new Date(isoStr);
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
          ) : prescriptions.length === 0 ? (
            <div className="dpm-empty">
              <FaFilePdf size={40} style={{ opacity: 0.25 }} />
              <p>No saved prescriptions found.</p>
              <p className="dpm-hint">
                Save a prescription from the editor to see it here.
              </p>
            </div>
          ) : (
            <ul className="dpm-list">
              {prescriptions.map((pres, idx) => {
                const isGen = generatingId === pres._id;
                const docName = pres.doctorId ? `Dr. ${pres.doctorId.firstName || ""} ${pres.doctorId.lastName || ""}`.trim() : "";
                const medCount = (pres.medicines || []).length;

                return (
                  <li key={pres._id} className="dpm-item">
                    <span className="dpm-badge">{idx === 0 ? "Latest" : `#${idx + 1}`}</span>
                    <div className="dpm-item-info">
                      <FaCalendarDays className="dpm-cal-icon" />
                      <div>
                        <span className="dpm-date">{formatDate(pres.createdAt)}</span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px", fontSize: "11px", color: "#64748b" }}>
                          {docName && <span><FaUserDoctor style={{ marginRight: 3, verticalAlign: "middle" }} />{docName}</span>}
                          {medCount > 0 && <span>• {medCount} {medCount === 1 ? "medicine" : "medicines"}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`dpm-download-btn ${isGen ? "dpm-loading" : ""}`}
                      onClick={() => handleDownload(pres)}
                      disabled={!!generatingId}
                      title="Generate and Download PDF"
                    >
                      {isGen ? (
                        <FaSpinner className="dpm-spin" size={16} />
                      ) : (
                        <FaDownload size={16} />
                      )}
                      <span>{isGen ? "Generating…" : "Download PDF"}</span>
                    </button>
                  </li>
                );
              })}
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
