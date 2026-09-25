import React, { useEffect, useState, useContext } from "react";
import "./preview.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPreviewRequest, resetPreview } from "../store/previewSlice";
import { dobToAge } from "../utils/ageUtils";
import { Context } from "../main";
import { PiPrescriptionBold, PiPrinter } from "react-icons/pi";
import api from "../utils/api";
import { BsDownload } from "react-icons/bs";
import MyDocument from "./MyDocument";
import ReactDOM from 'react-dom';
import { PDFViewer, pdf } from '@react-pdf/renderer';

// Helper: format date
const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB") : ""; // dd/mm/yyyy
const Preview = () => {
  const { patientId: routePatientId } = useParams();
  const location = useLocation();
  // Preview may receive either a patientId route param or an appointmentId via query or props
  const qs = new URLSearchParams(location.search);
  const appointmentIdFromQuery =
    qs.get("appointmentId") || qs.get("apptId") || null;
  const patientId = routePatientId || appointmentIdFromQuery;
  const dispatch = useDispatch();
  const preview = useSelector((s) => s.preview);
  const patient = preview.patient;
  const doctor = preview.doctor;
  const loading = preview.loading;
  const error = preview.error;
  const [editMode, setEditMode] = useState(false);
  const [printWithHeader, setPrintWithHeader] = useState(true);
  const [printWithFooter, setPrintWithFooter] = useState(true);
  const [savingPdf, setSavingPdf] = useState(false);
  const [pdfSaveMsg, setPdfSaveMsg] = useState("");
  const { isAuthenticated, admin } = useContext(Context);
  const navigate = useNavigate();
  const [generalSettings, setGeneralSettings] = useState(null);

  useEffect(() => {
    import("../utils/generalSettingsUtil").then(({ getGeneralSettings }) => {
      getGeneralSettings().then((s) => setGeneralSettings(s));
    });
  }, []);

  // Helper to construct full image URLs
  const getFullImageUrl = (imagePath, fallback) => {
    if (!imagePath) return fallback;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
      return imagePath;
    }
    const base = api.defaults.baseURL || "";
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${cleanBase}${cleanPath}`;
  };

  const defaultHdr = generalSettings?.defaultHeaderImage || "/Header.jpeg";
  const defaultFtr = generalSettings?.defaultFooterImage || "/Footer.png";

  const headerImageUrl = getFullImageUrl(doctor?.headerImage, defaultHdr);
  const pageFooterImageUrl = getFullImageUrl(doctor?.footerImage, defaultFtr);
  const doctorSignUrl = doctor?.signImage ? getFullImageUrl(doctor.signImage, null) : null;
  const doctorStampUrl = doctor?.stampImage ? getFullImageUrl(doctor.stampImage, null) : null;

  const [resolvedHeader, setResolvedHeader] = useState(null);
  const [resolvedFooter, setResolvedFooter] = useState(null);
  const [resolvedSign, setResolvedSign] = useState(null);
  const [resolvedStamp, setResolvedStamp] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Convert any image format (including non-standard JPEGs) to clean standard PNG data URI via Canvas
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
            const pngDataUri = canvas.toDataURL("image/png");
            resolve(pngDataUri);
          } catch (err) {
            console.warn("Canvas conversion failed, falling back to url:", err);
            resolve(url);
          }
        };
        img.onerror = () => {
          resolve(url);
        };
        img.src = url;
      });
    };

    const loadAllImages = async () => {
      const [hUri, fUri, sUri, stUri] = await Promise.all([
        convertToPngDataUri(headerImageUrl),
        convertToPngDataUri(pageFooterImageUrl),
        convertToPngDataUri(doctorSignUrl),
        convertToPngDataUri(doctorStampUrl),
      ]);

      if (isMounted) {
        setResolvedHeader(hUri || headerImageUrl);
        setResolvedFooter(fUri || pageFooterImageUrl);
        setResolvedSign(sUri || null);
        setResolvedStamp(stUri || null);
        setImagesLoaded(true);
      }
    };

    loadAllImages();
    return () => {
      isMounted = false;
    };
  }, [doctor?.headerImage, doctor?.signImage, doctor?.stampImage, doctor?.footerImage, doctor?._id, headerImageUrl, pageFooterImageUrl, doctorSignUrl, doctorStampUrl]);

  // Role check
  const canEdit = isAuthenticated && ["Admin", "Doctor"].includes(admin?.role);

  // Built-in Templates
  const BUILT_IN_TEMPLATES = [
    { _id: "template1", name: "Template 1: Right-side margin layout", layoutType: "Template 1: Right-side margin layout" },
    { _id: "template2", name: "Template 2: Left-side margin layout", layoutType: "Template 2: Left-side margin layout" },
    { _id: "template3", name: "Template 3: Orthopedic Layout", layoutType: "Template 3: Orthopedic Layout" },
    { _id: "default", name: "Default Layout (Single Column)", layoutType: "default" },
  ];

  const findMatchingTemplate = (target, list) => {
    if (!target) return null;
    const cleanTarget = String(target).toLowerCase().trim();
    return list.find(t => {
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

  const getInitialDefaultId = () => {
    const savedId = localStorage.getItem("defaultPrescriptionTemplateId");
    const savedName = localStorage.getItem("defaultPrescriptionTemplate");
    const candidate = savedId || savedName;
    if (candidate) {
      const match = findMatchingTemplate(candidate, BUILT_IN_TEMPLATES);
      if (match) return match._id;
    }
    return "template1";
  };

  const [dbTemplates, setDbTemplates] = useState([]);
  const allTemplates = [
    ...dbTemplates,
    ...BUILT_IN_TEMPLATES.filter(b => !dbTemplates.some(t => t.name === b.name || t._id === b._id))
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState(getInitialDefaultId);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const doctorParam = doctor?._id ? `?doctorId=${doctor._id}` : "";
        const { data } = await api.get(`/api/v1/template/my-templates${doctorParam}`);
        if (data.success && data.templates?.length > 0) {
          setDbTemplates(data.templates);
          
          const defaultTmpl = data.templates.find(t => t.isDefault);
          const savedTarget = localStorage.getItem("defaultPrescriptionTemplate") || localStorage.getItem("defaultPrescriptionTemplateId");
          
          const combined = [
            ...data.templates,
            ...BUILT_IN_TEMPLATES.filter(b => !data.templates.some(t => t.name === b.name || t._id === b._id))
          ];

          if (savedTarget) {
            const m = findMatchingTemplate(savedTarget, combined);
            if (m) {
              setSelectedTemplateId(m._id);
              return;
            }
          }

          if (defaultTmpl) {
            setSelectedTemplateId(defaultTmpl._id);
          } else {
            setSelectedTemplateId(data.templates[0]._id);
          }
        }
      } catch (error) {
        console.error("Failed to load templates", error);
      }
    };
    if (isAuthenticated) {
      fetchTemplates();
    }
  }, [isAuthenticated, doctor?._id]);

  useEffect(() => {
    const doctorPref = doctor?.prescriptionTemplate;
    const adminPref = admin?.prescriptionTemplate;
    const localPref = localStorage.getItem("defaultPrescriptionTemplate") || localStorage.getItem("defaultPrescriptionTemplateId");

    let targetPref = null;
    if (doctorPref && doctorPref !== "default") {
      targetPref = doctorPref;
    } else if (localPref) {
      targetPref = localPref;
    } else if (adminPref && adminPref !== "default") {
      targetPref = adminPref;
    } else if (doctorPref) {
      targetPref = doctorPref;
    }

    if (targetPref) {
      const match = findMatchingTemplate(targetPref, allTemplates);
      if (match) {
        setSelectedTemplateId(match._id);
      }
    }
  }, [doctor, admin, dbTemplates]);

  useEffect(() => {
    if (!patientId) return;

    // try to detect whether this is an appointment id (24 hex chars) or a patient id
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(patientId);
    dispatch(fetchPreviewRequest({ patientId }));
    return () => {
      dispatch(resetPreview());
    };
  }, [patientId, dispatch]);

  const activeTemplate = allTemplates.find(t => t._id === selectedTemplateId) || allTemplates[0];

  if (loading)
    return (
      <div className="prescription">
        <span className="loader" style={{ height: "3rem" }}></span>
      </div>
    );
  if (error)
    return (
      <div className="prescription">
        <div style={{ color: "red" }}>{error}</div>
      </div>
    );
  if (!patient)
    return (
      <div className="prescription">
        <div>Patient not found.</div>
      </div>
    );

  const report =
    Array.isArray(patient.report) && patient.report.length > 0
      ? patient.report[0]
      : null;
  const clinic = {
    name: doctor?.clinicName || doctor?.hospital || "",
    address: doctor?.qualifications || "MBBS",
    contact: doctor?.phone || doctor?.email || "",
  };
  const medicines = Array.isArray(report?.medicineAdvice)
    ? report.medicineAdvice.filter((m) => m.name) // Filter out empty/unselected medicines
    : report?.medicineAdvice
      ? [report?.medicineAdvice]
      : [];
  console.log(medicines);
  const previewFollowup =
    (report && report.advice && report.advice.followup_date) ||
    patient.reportdate ||
    report?.followUp ||
    "";

  // --- Download prescription PDF on demand ---
  const handleDownloadPdf = async () => {
    if (!report) {
      alert("No prescription data to download.");
      return;
    }
    setSavingPdf(true);
    setPdfSaveMsg("");
    try {
      const { pdf: makePdf } = await import('@react-pdf/renderer');
      const blob = await makePdf(
        <MyDocument
          header={resolvedHeader || headerImageUrl}
          footer={resolvedFooter || pageFooterImageUrl}
          p_data={patient}
          dr_data={doctor ? { ...doctor, headerImage: resolvedHeader, signImage: resolvedSign, stampImage: resolvedStamp } : doctor}
          report={report}
          activeTemplate={activeTemplate}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const patientName = patient?.name || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || "Patient";
      a.download = `Prescription_${patientName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setPdfSaveMsg("✓ PDF downloaded!");
      setTimeout(() => setPdfSaveMsg(""), 4000);
    } catch (err) {
      const msg = err?.message || "Download failed";
      setPdfSaveMsg("✗ " + msg);
      setTimeout(() => setPdfSaveMsg(""), 6000);
    } finally {
      setSavingPdf(false);
    }
  };

  // --- UI ---
  return (
    <section className="page modern-preview">
      <div className="back-btn-box" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <button className="back-btn add-btn" onClick={() => navigate("/")}>
          ← Go Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <label style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>Prescription Template:</label>
          <select
            className="form-control"
            value={selectedTemplateId}
            onChange={e => setSelectedTemplateId(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #1e40af",
              fontWeight: "600",
              backgroundColor: "#f8fafc",
              cursor: "pointer"
            }}
          >
            {allTemplates.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          {/* Download PDF directly */}
          <button
            onClick={handleDownloadPdf}
            disabled={savingPdf}
            title="Download prescription PDF"
            style={{
              padding: "7px 14px",
              borderRadius: "7px",
              border: "none",
              background: savingPdf ? "#6b7280" : "linear-gradient(135deg,#10b981,#059669)",
              color: "#fff",
              fontWeight: "700",
              fontSize: "13px",
              cursor: savingPdf ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "opacity 0.2s",
            }}
          >
            {savingPdf ? "Generating…" : "⬇ Download PDF"}
          </button>
          {pdfSaveMsg && (
            <span style={{ fontSize: "13px", fontWeight: "600", color: pdfSaveMsg.startsWith("✓") ? "#10b981" : "#ef4444" }}>
              {pdfSaveMsg}
            </span>
          )}
        </div>
      </div>
      {report && imagesLoaded ? (
        <PDFViewer
          key={`${patientId}-${doctor?._id || 'none'}-${resolvedHeader ? 'hdr' : 'nohdr'}-${selectedTemplateId}`}
          width="100%"
          height="600px"
        >
          <MyDocument
            header={resolvedHeader || headerImageUrl}
            footer={resolvedFooter || pageFooterImageUrl}
            p_data={patient}
            dr_data={doctor ? { ...doctor, headerImage: resolvedHeader, signImage: resolvedSign, stampImage: resolvedStamp } : doctor}
            report={report}
            activeTemplate={activeTemplate}
          />
        </PDFViewer>
      ) : report ? (
        <div className="prescription" style={{ minHeight: "400px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <span className="loader" style={{ height: "3rem" }}></span>
        </div>
      ) : (
        <div className="prescription">
          <p>No report available</p>
        </div>
      )}
    </section>
  );
};

export default Preview;

