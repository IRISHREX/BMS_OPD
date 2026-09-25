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
const DownloadPrescriptionModal = ({ patientId, patientName = "Patient", appointmentData = null, onClose }) => {
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

      // 1. Resolve Templates & Set Default Template
      const BUILT_IN_TEMPLATES = [
        { _id: "template1", name: "Template 1: Right-side margin layout", layoutType: "Template 1: Right-side margin layout" },
        { _id: "template2", name: "Template 2: Left-side margin layout", layoutType: "Template 2: Left-side margin layout" },
        { _id: "template3", name: "Template 3: Orthopedic Layout", layoutType: "Template 3: Orthopedic Layout" },
        { _id: "default", name: "Default Layout (Single Column)", layoutType: "default" },
      ];

      let dbTemplates = [];
      try {
        const doctorParam = doc._id ? `?doctorId=${doc._id}` : "";
        const { data: tmplData } = await api.get(`/api/v1/template/my-templates${doctorParam}`);
        if (tmplData?.templates?.length > 0) {
          dbTemplates = tmplData.templates;
        }
      } catch (tmplErr) {
        console.warn("Could not load templates:", tmplErr);
      }

      const allTemplates = [
        ...dbTemplates,
        ...BUILT_IN_TEMPLATES.filter((b) => !dbTemplates.some((t) => t.name === b.name || t._id === b._id)),
      ];

      const findMatchingTemplate = (target, list) => {
        if (!target) return null;
        const cleanTarget = String(target).toLowerCase().trim();
        return list.find((t) => {
          const id = String(t._id || t.id || "").toLowerCase();
          const name = String(t.name || "").toLowerCase();
          const layout = String(t.layoutType || "").toLowerCase();
          return (
            id === cleanTarget ||
            name === cleanTarget ||
            layout === cleanTarget ||
            (cleanTarget.includes("template 3") && (id.includes("template3") || name.includes("template 3") || layout.includes("template 3"))) ||
            (cleanTarget.includes("orthopedic") && (name.includes("orthopedic") || layout.includes("orthopedic") || id.includes("template3"))) ||
            (cleanTarget.includes("template 2") && (id.includes("template2") || name.includes("template 2") || layout.includes("template 2"))) ||
            (cleanTarget.includes("template 1") && (id.includes("template1") || name.includes("template 1") || layout.includes("template 1"))) ||
            (cleanTarget === "default" && (id === "default" || name.includes("single column") || layout === "default"))
          );
        });
      };

      // Determine default set template target
      const docPref = pres.prescriptionTemplate || doc.prescriptionTemplate;
      const localPref = localStorage.getItem("defaultPrescriptionTemplate") || localStorage.getItem("defaultPrescriptionTemplateId");
      const defaultDbTmpl = dbTemplates.find((t) => t.isDefault);

      let targetTemplate = null;
      if (docPref && docPref !== "default") {
        targetTemplate = findMatchingTemplate(docPref, allTemplates);
      }
      if (!targetTemplate && localPref) {
        targetTemplate = findMatchingTemplate(localPref, allTemplates);
      }
      if (!targetTemplate && defaultDbTmpl) {
        targetTemplate = defaultDbTmpl;
      }
      if (!targetTemplate) {
        targetTemplate = allTemplates[0] || BUILT_IN_TEMPLATES[0];
      }

      // 2. Full Clinical Details & Patient Resolution
      const appt = (pres.appointmentId && typeof pres.appointmentId === "object") ? pres.appointmentId : (appointmentData || {});
      const user = (pres.patientId && typeof pres.patientId === "object") ? pres.patientId : {};

      // Name resolution: check appointment name first (contains actual full name), then user name/firstName, then patientName prop
      let resolvedName = appt.name || user.name || (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "");
      if (!resolvedName || resolvedName.toLowerCase() === "patient") {
        if (patientName && patientName.toLowerCase() !== "patient") {
          resolvedName = patientName;
        } else if (appointmentData?.name) {
          resolvedName = appointmentData.name;
        } else if (appt.name) {
          resolvedName = appt.name;
        }
      }
      if (!resolvedName) resolvedName = "Patient";

      const resolvedAddress = appt.address || appointmentData?.address || user.address || pres.address || "";
      const resolvedPhone = appt.phone || appointmentData?.phone || user.phone || pres.phone || "N/A";
      const resolvedAge = appt.age || appointmentData?.age || user.age || pres.age || "";
      const resolvedGender = appt.gender || appointmentData?.gender || user.gender || pres.gender || "Male";
      const resolvedNic = appt.nic || appointmentData?.nic || user.nic || pres.nic || "";
      const resolvedAppointmentId = appt._id || appointmentData?._id || pres.appointmentId?._id || pres.appointmentId;

      const report = {
        ...pres,
        initialComplain: typeof pres.provisionalDiagnosis === "object" ? pres.provisionalDiagnosis?.value : (pres.provisionalDiagnosis || pres.initialComplain || ""),
        presentingComplaints: pres.presentingComplaints || "",
        medicalHistory: pres.medicalHistory || "",
        clinical_findings: pres.clinicalFindings || pres.clinical_findings || {},
        clinicalFindings: pres.clinicalFindings || pres.clinical_findings || {},
        diagnosys_heading: pres.diagnosys_heading || "Provisional Diagnosis",
        provisionalDiagnosis: typeof pres.provisionalDiagnosis === "object" ? pres.provisionalDiagnosis?.value : (pres.provisionalDiagnosis || ""),
        pathologyReport: pres.pathologyReport || "",
        radiologyReport: pres.radiologyReport || "",
        femaleTests: pres.femaleTests || {},
        Gravida: pres.femaleTests?.Gravida || pres.Gravida || "",
        Parity: pres.femaleTests?.Parity || pres.Parity || "",
        LMP: pres.femaleTests?.LMP || pres.LMP || "",
        EDD: pres.femaleTests?.EDD || pres.EDD || "",
        POG: pres.femaleTests?.POG || pres.POG || "",
        LCB: pres.femaleTests?.LCB || pres.LCB || "",
        MOD: pres.femaleTests?.MOD || pres.MOD || "",
        diagnosys: pres.vitals || pres.diagnosys || {},
        vitals: pres.vitals || pres.diagnosys || {},
        medicineAdvice: (pres.medicines || pres.medicineAdvice || []).map((m) => ({
          name: m.name || "",
          type: m.type || "Tab",
          dose: m.dose || "",
          frequency: m.frequency || "",
          route: m.route || "Oral",
          duration: m.duration || "",
          instruction: m.instruction || m.instructions || m.notes || "",
          notes: m.notes || m.instruction || m.instructions || "",
        })),
        advice: pres.advice || {
          testAdvice: pres.advice?.testAdvice || [],
          medication: pres.advice?.medication || "",
          diet: pres.advice?.diet || "",
        },
        additionalAdvice: pres.additionalAdvice || "",
        followUp: pres.followUp || "",
        address: resolvedAddress,
        appointmentId: resolvedAppointmentId,
      };

      const pat = {
        ...user,
        ...appt,
        _id: user._id || appt._id || patientId,
        name: resolvedName,
        firstName: user.firstName || resolvedName.split(" ")[0] || "",
        lastName: user.lastName || resolvedName.split(" ").slice(1).join(" ") || "",
        age: resolvedAge,
        gender: resolvedGender,
        phone: resolvedPhone,
        address: resolvedAddress,
        nic: resolvedNic,
        dob: user.dob || appt.dob,
        appointmentId: resolvedAppointmentId,
        appointmentType: appt.appointmentType || appointmentData?.appointmentType || "OPD",
        type: appt.appointmentType || appointmentData?.appointmentType || "OPD",
      };

      const dr_data = {
        ...doc,
        name: doc.name || (doc.firstName ? `Dr. ${doc.firstName} ${doc.lastName || ""}`.trim() : "Doctor"),
        firstName: doc.firstName || "",
        lastName: doc.lastName || "",
        doctorDepartment: doc.doctorDepartment || doc.department || "General Medicine",
        qualifications: doc.qualifications || "MBBS",
        phone: doc.phone || "",
        email: doc.email || "",
        headerImage: hUri || hdrUrl,
        footerImage: fUri || ftrUrl,
        signImage: sUri || null,
        stampImage: stUri || null,
        prescriptionTemplate: targetTemplate?.name || targetTemplate?.layoutType || doc.prescriptionTemplate,
      };

      const { pdf: makePdf } = await import("@react-pdf/renderer");
      const MyDoc = (await import("./MyDocument")).default;

      const blob = await makePdf(
        <MyDoc
          header={hUri || hdrUrl}
          footer={fUri || ftrUrl}
          p_data={pat}
          dr_data={dr_data}
          report={report}
          activeTemplate={targetTemplate}
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
