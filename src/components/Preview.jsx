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
import { PDFViewer } from '@react-pdf/renderer';

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
  const { isAuthenticated, admin } = useContext(Context);
  const navigate = useNavigate();

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

  const headerImageUrl = getFullImageUrl(doctor?.headerImage, "/Header.png");
  const footerImageUrl = getFullImageUrl(doctor?.signImage, "/Footer.png");

  // Role check
  const canEdit = isAuthenticated && ["Admin", "Doctor"].includes(admin?.role);

  // Built-in Templates
  const BUILT_IN_TEMPLATES = [
    { _id: "template1", name: "Template 1: Right-side margin layout", layoutType: "Template 1: Right-side margin layout" },
    { _id: "template2", name: "Template 2: Left-side margin layout", layoutType: "Template 2: Left-side margin layout" },
    { _id: "default", name: "Default Layout (Single Column)", layoutType: "default" },
  ];

  const [dbTemplates, setDbTemplates] = useState([]);
  const allTemplates = [
    ...BUILT_IN_TEMPLATES,
    ...dbTemplates.filter(t => !BUILT_IN_TEMPLATES.some(b => b.name === t.name || b.layoutType === t.layoutType))
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState("template1");
  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await api.get("/api/v1/template/my-templates");
        if (data.success && data.templates?.length > 0) {
          setDbTemplates(data.templates);
          const defaultTmpl = data.templates.find(t => t.isDefault);
          if (defaultTmpl) {
            setSelectedTemplateId(defaultTmpl._id);
          }
        }
      } catch (error) {
        console.error("Failed to load templates", error);
      }
    };
    if (isAuthenticated) {
      fetchTemplates();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (doctor?.prescriptionTemplate) {
      const match = allTemplates.find(
        t => t.layoutType === doctor.prescriptionTemplate || t.name === doctor.prescriptionTemplate
      );
      if (match) {
        setSelectedTemplateId(match._id);
      }
    }
  }, [doctor]);

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
        <span className="loader" style={{height:"3rem"}}></span>      
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

  // --- UI ---
  return (
    <section className="page modern-preview">
      <div className="back-btn-box" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="back-btn add-btn" onClick={() => navigate("/")}>
          ← Go Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        </div>
      </div>
      {report ? (
        <PDFViewer width="100%" height="600px">
          <MyDocument header={headerImageUrl} footer={footerImageUrl} p_data={patient} dr_data={doctor} report={report} activeTemplate={activeTemplate} />
        </PDFViewer>
      ) : (
        <div className="prescription">
          <p>No report available</p>
        </div>
      )}
    </section>
  );
};

export default Preview;

