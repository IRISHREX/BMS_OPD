import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../main";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { PDFViewer } from "@react-pdf/renderer";
import MyDocument from "./MyDocument";
import {
  FaArrowLeft,
  FaCheck,
  FaEye,
  FaCheckCircle,
  FaStethoscope,
  FaTimes,
  FaPrint,
  FaSlidersH,
} from "react-icons/fa";
import "./TemplateBuilder.css";

// 4 Official Built-in Prescription Templates
const BUILT_IN_TEMPLATES = [
  {
    id: "template1",
    name: "Template 1: Right-side margin layout",
    layoutType: "Template 1: Right-side margin layout",
    category: "Two-Column",
    badge: "Popular OPD",
    badgeColor: "badge-blue",
    description:
      "Wide medication table on the left, with patient vitals, investigations, and provisional diagnosis structured on the right margin.",
    features: [
      "Rx Table on Left (67% width) with clear dosage columns",
      "Vitals, Investigations & Diagnosis in Right Margin (33%)",
      "Doctor Signature & Seal positioned inside Right Margin",
      "Optimized for general physicians and routine OPD visits",
    ],
    blueprint: "two-column-right",
  },
  {
    id: "template2",
    name: "Template 2: Left-side margin layout",
    layoutType: "Template 2: Left-side margin layout",
    category: "Two-Column",
    badge: "Diagnostic Focus",
    badgeColor: "badge-purple",
    description:
      "Patient vitals and clinical findings prominently displayed on the left margin, leading logically into medications on the right.",
    features: [
      "Vitals & Diagnostics on Left Margin (33% width)",
      "Rx Medications Table on Right (67% width)",
      "Dedicated Bottom Advice & Follow-Up block",
      "Great for internal medicine and diagnostic specialists",
    ],
    blueprint: "two-column-left",
  },
  {
    id: "template3",
    name: "Template 3: Orthopedic Layout",
    layoutType: "Template 3: Orthopedic Layout",
    category: "Multi-Panel Grid",
    badge: "Specialized Ortho",
    badgeColor: "badge-green",
    description:
      "Specialized multi-panel clinical grid with dedicated boxes for ortho vitals (BP, PR, SPO2, Temp, BMI, OB-GYN), medical history, exam, lab/radiology, diagnosis, advice, and follow-up.",
    features: [
      "Structured clinical boxes with crisp vector medical icons",
      "Ortho Vitals: BP, PR, SPO2, Temp, BMI, OB-GYN & Others",
      "Dedicated Medical History & Clinical Examination panels",
      "Doctor Signature outside panels with plenty of sign space",
    ],
    blueprint: "ortho-grid",
  },
  {
    id: "default",
    name: "Default Layout (Single Column)",
    layoutType: "default",
    category: "Single Column",
    badge: "Classic Standard",
    badgeColor: "badge-slate",
    description:
      "Traditional horizontal hospital layout with patient demographic strip, vitals line, full-width medication table, and doctor seal.",
    features: [
      "Classic horizontal letterhead flow",
      "Full-width medication grid (maximum space for drugs)",
      "Bottom seal with follow-up date and doctor signature",
      "Universal fit for standard pre-printed stationery",
    ],
    blueprint: "single-column",
  },
];

// Realistic sample data for instant PDF layout preview
const SAMPLE_PATIENT = {
  name: "Rahul Sharma",
  gender: "Male",
  dob: "1994-05-15",
  age: 30,
  phone: "9876543210",
  address: "123 Park Street, Kolkata",
  appointmentType: "OPD",
  appointmentId: "APP-2026-042",
};

const SAMPLE_DOCTOR = {
  firstName: "Doctor",
  lastName: "Consultant",
  qualifications: "MBBS, M.S.",
  doctorDepartment: "General & Orthopedics",
};

const SAMPLE_REPORT = {
  createdAt: new Date().toISOString(),
  presentingComplaints: "Pain in right knee for 2 weeks, difficulty climbing stairs",
  medicalHistory: "Known case of HTN on Telmisartan. No prior surgeries.",
  clinical_findings: {
    patientCondition: {
      c1: "Joint tenderness right knee",
      c2: "Mild joint effusion",
      c3: "Range of motion 0-110 deg",
      c4: "McMurray test positive",
    },
  },
  pathologyReport: "CBC: Hb 13.2 g/dL, ESR 18 mm/hr, CRP Normal",
  radiologyReport: "X-Ray Both Knees AP: Mild medial joint space narrowing right knee",
  initialComplain: "Right Knee Medial Meniscus Strain / Early Osteoarthritis",
  diagnosys: {
    BP: "120/80",
    PR: "76",
    SPO2: "99",
    Temp: "98.6",
    Weight: "68",
    BMI: "22.4",
    Others: "G:0 P:0",
  },
  medicineAdvice: [
    { name: "Tab Aceclofenac + Paracetamol", type: "Tab", dose: "100/325mg", route: "Oral", frequency: "1-0-1", duration: "5 days", instruction: "After food" },
    { name: "Cap Omeprazole 20mg", type: "Cap", dose: "20mg", route: "Oral", frequency: "1-0-0", duration: "5 days", instruction: "Before breakfast" },
    { name: "Tab Calcium + Vitamin D3", type: "Tab", dose: "500mg", route: "Oral", frequency: "0-0-1", duration: "1 month", instruction: "After dinner" },
    { name: "Gel Diclofenac Topical", type: "Gel", dose: "Apply gently", route: "Local", frequency: "TDS", duration: "7 days", instruction: "External use" },
  ],
  advice: {
    testAdvice: [
      { testName: "MRI Right Knee Joint" },
      { testName: "X-Ray Both Knees AP & Lateral Standing" },
    ],
  },
  additionalAdvice: "Avoid deep squatting and cross-legged sitting. Quadriceps strengthening exercises.",
  followUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

const TemplateBuilder = () => {
  const { admin, setAdmin } = useContext(Context);
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  const [currentDefault, setCurrentDefault] = useState(
    () => localStorage.getItem("defaultPrescriptionTemplate") || "Template 1: Right-side margin layout"
  );
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Fetch current doctor's active prescription template
  useEffect(() => {
    const fetchCurrentDefault = async () => {
      try {
        setLoading(true);
        // 1. Try to load logged in user profile
        const { data: userData } = await api.get("/api/v1/user/me");
        if (userData?.user?.prescriptionTemplate) {
          setCurrentDefault(userData.user.prescriptionTemplate);
          localStorage.setItem("defaultPrescriptionTemplate", userData.user.prescriptionTemplate);
          setLoading(false);
          return;
        }

        // 2. Fallback to admin context
        if (admin?.prescriptionTemplate) {
          setCurrentDefault(admin.prescriptionTemplate);
          localStorage.setItem("defaultPrescriptionTemplate", admin.prescriptionTemplate);
          setLoading(false);
          return;
        }

        // 3. Fallback to DB templates
        const doctorParam = admin?._id ? `?doctorId=${admin._id}` : "";
        const { data: tmplData } = await api.get(`/api/v1/template/my-templates${doctorParam}`);
        if (tmplData?.success && tmplData.templates?.length > 0) {
          const defaultTmpl = tmplData.templates.find((t) => t.isDefault);
          if (defaultTmpl) {
            const defName = defaultTmpl.name || defaultTmpl.layoutType;
            setCurrentDefault(defName);
            localStorage.setItem("defaultPrescriptionTemplate", defName);
          }
        }
      } catch (err) {
        console.error("Failed to load current default template", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentDefault();
  }, [admin]);

  // Handler: Set as Default
  const handleSetDefault = async (tmpl) => {
    try {
      setUpdatingId(tmpl.id);

      // Persist in localStorage for instant seamless retrieval across all pages & printers
      localStorage.setItem("defaultPrescriptionTemplate", tmpl.name);
      localStorage.setItem("defaultPrescriptionTemplateId", tmpl.id);
      localStorage.setItem("defaultPrescriptionLayoutType", tmpl.layoutType);

      if (setAdmin) {
        setAdmin((prev) => ({ ...prev, prescriptionTemplate: tmpl.name }));
      }

      // 1. Explicitly save to Database for this Doctor / Admin (and sync across hospital if Admin)
      await api.put("/api/v1/user/prescription-template", {
        templateName: tmpl.name,
        doctorId: admin?._id,
        applyToAllDoctors: admin?.role === "Admin",
      });

      // Update local state
      setCurrentDefault(tmpl.name);
      snackbar.success(`"${tmpl.name}" is now saved in database as your default template!`);
    } catch (err) {
      console.error("Error setting default template", err);
      snackbar.error("Failed to set default template in database. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const isTemplateActive = (tmpl) => {
    if (!currentDefault) return tmpl.id === "template1";
    return (
      currentDefault === tmpl.name ||
      currentDefault === tmpl.layoutType ||
      currentDefault === tmpl.id ||
      (tmpl.id === "default" && (currentDefault === "default" || currentDefault.toLowerCase().includes("single column")))
    );
  };

  return (
    <div className="tmpl-gallery-page">
      {/* Header */}
      <div className="tmpl-gallery-header">
        <div className="tmpl-header-left">
          <button className="tmpl-back-btn" onClick={() => navigate("/settings")}>
            <FaArrowLeft /> Back to Settings
          </button>
          <div>
            <h1 className="tmpl-header-title">
              <FaPrint style={{ color: "#2563eb" }} /> Prescription Templates
            </h1>
            <p className="tmpl-header-subtitle">
              Choose your preferred prescription layout. Your selected default will automatically apply to all printed prescriptions and PDF downloads.
            </p>
          </div>
        </div>
      </div>

      {/* Active Default Banner */}
      <div className="tmpl-active-banner">
        <div className="tmpl-active-banner-info">
          <div className="tmpl-active-banner-icon">
            <FaCheckCircle />
          </div>
          <div>
            <div className="tmpl-active-banner-title">Current Active Default</div>
            <div className="tmpl-active-banner-name">
              {loading ? "Loading default..." : currentDefault || "Template 1: Right-side margin layout"}
            </div>
          </div>
        </div>
        <div style={{ fontSize: "0.85rem", color: "#3b82f6", fontWeight: 600 }}>
          Applied to OPD & Previews
        </div>
      </div>

      {/* 4 Available Templates Grid */}
      <div className="tmpl-grid">
        {BUILT_IN_TEMPLATES.map((tmpl) => {
          const isActive = isTemplateActive(tmpl);
          const isUpdating = updatingId === tmpl.id;

          return (
            <div
              key={tmpl.id}
              className={`tmpl-card ${isActive ? "is-active-default" : ""}`}
            >
              {/* Miniature Layout Blueprint */}
              <div
                className="tmpl-blueprint-wrap"
                onClick={() => setPreviewTemplate(tmpl)}
                title="Click to preview this template layout"
              >
                <div className="tmpl-blueprint">
                  <div className="bp-header">
                    <span>HOSPITAL HEADER</span>
                  </div>

                  {/* Blueprint Body by type */}
                  {tmpl.blueprint === "two-column-right" && (
                    <div className="bp-body-flex">
                      <div className="bp-main-rx">
                        <div className="bp-line blue" style={{ width: "40%" }}></div>
                        <div className="bp-line" style={{ width: "90%" }}></div>
                        <div className="bp-line" style={{ width: "85%" }}></div>
                        <div className="bp-line" style={{ width: "70%" }}></div>
                        <div className="bp-line" style={{ width: "80%" }}></div>
                        <div className="bp-line thin" style={{ marginTop: "auto", width: "50%" }}></div>
                      </div>
                      <div className="bp-margin-col">
                        <div className="bp-line blue" style={{ width: "70%" }}></div>
                        <div className="bp-line" style={{ width: "85%" }}></div>
                        <div className="bp-line" style={{ width: "65%" }}></div>
                        <div className="bp-line blue" style={{ width: "80%", marginTop: "4px" }}></div>
                        <div className="bp-line" style={{ width: "90%" }}></div>
                        <div className="bp-line" style={{ marginTop: "auto", width: "60%", background: "#0a4a75" }}></div>
                      </div>
                    </div>
                  )}

                  {tmpl.blueprint === "two-column-left" && (
                    <div className="bp-body-flex">
                      <div className="bp-margin-col">
                        <div className="bp-line blue" style={{ width: "70%" }}></div>
                        <div className="bp-line" style={{ width: "85%" }}></div>
                        <div className="bp-line" style={{ width: "65%" }}></div>
                        <div className="bp-line blue" style={{ width: "80%", marginTop: "4px" }}></div>
                        <div className="bp-line" style={{ width: "90%" }}></div>
                      </div>
                      <div className="bp-main-rx">
                        <div className="bp-line blue" style={{ width: "40%" }}></div>
                        <div className="bp-line" style={{ width: "90%" }}></div>
                        <div className="bp-line" style={{ width: "85%" }}></div>
                        <div className="bp-line" style={{ width: "70%" }}></div>
                        <div className="bp-line" style={{ width: "80%" }}></div>
                        <div className="bp-line thin" style={{ marginTop: "auto", width: "50%" }}></div>
                      </div>
                    </div>
                  )}

                  {tmpl.blueprint === "ortho-grid" && (
                    <div className="bp-ortho-grid">
                      <div className="bp-ortho-row">
                        <div className="bp-ortho-box blue" style={{ flex: 1.5 }}>
                          <div className="bp-line blue" style={{ width: "50%" }}></div>
                          <div className="bp-line thin"></div>
                        </div>
                        <div className="bp-ortho-box" style={{ flex: 1 }}>
                          <div className="bp-line green" style={{ width: "60%" }}></div>
                          <div className="bp-line thin"></div>
                        </div>
                      </div>
                      <div className="bp-ortho-row">
                        <div className="bp-ortho-box" style={{ flex: 1 }}>
                          <div className="bp-line green" style={{ width: "60%" }}></div>
                        </div>
                        <div className="bp-ortho-box blue" style={{ flex: 1.5 }}>
                          <div className="bp-line blue" style={{ width: "50%" }}></div>
                        </div>
                      </div>
                      <div className="bp-ortho-box blue" style={{ flex: 1 }}>
                        <div className="bp-line blue" style={{ width: "35%" }}></div>
                        <div className="bp-line thin"></div>
                        <div className="bp-line thin"></div>
                      </div>
                    </div>
                  )}

                  {tmpl.blueprint === "single-column" && (
                    <div className="bp-single-flow">
                      <div className="bp-demographics-strip">
                        <div className="bp-line" style={{ width: "70%" }}></div>
                      </div>
                      <div className="bp-full-table">
                        <div className="bp-line blue" style={{ width: "30%" }}></div>
                        <div className="bp-line" style={{ width: "95%" }}></div>
                        <div className="bp-line" style={{ width: "90%" }}></div>
                        <div className="bp-line" style={{ width: "85%" }}></div>
                        <div className="bp-line" style={{ width: "88%" }}></div>
                      </div>
                    </div>
                  )}

                  <div className="bp-footer">
                    <span style={{ fontSize: "5px" }}>CLINIC CONTACT & FOOTER</span>
                    <span style={{ fontSize: "5px", fontWeight: 700 }}>DR. SIGN</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="tmpl-card-body">
                <div className="tmpl-card-badge-row">
                  <span className={`tmpl-badge ${tmpl.badgeColor}`}>{tmpl.badge}</span>
                  <span className="tmpl-badge badge-slate">{tmpl.category}</span>
                </div>

                <h3 className="tmpl-card-title">{tmpl.name}</h3>
                <p className="tmpl-card-desc">{tmpl.description}</p>

                <ul className="tmpl-features-list">
                  {tmpl.features.map((feat, idx) => (
                    <li key={idx} className="tmpl-feature-item">
                      <FaCheck className="tmpl-feature-icon" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Actions */}
                <div className="tmpl-card-actions">
                  {isActive ? (
                    <button className="tmpl-btn-active-badge">
                      <FaCheck /> Active Default
                    </button>
                  ) : (
                    <button
                      className="tmpl-btn-default"
                      onClick={() => handleSetDefault(tmpl)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Setting Default..." : "Set as Default"}
                    </button>
                  )}
                  <button
                    className="tmpl-btn-preview"
                    onClick={() => setPreviewTemplate(tmpl)}
                    title="Live preview with sample data"
                  >
                    <FaEye /> Preview
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Sample PDF Preview Modal */}
      {previewTemplate && (
        <div className="tmpl-modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="tmpl-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="tmpl-modal-header">
              <h3 className="tmpl-modal-title">
                <FaEye style={{ color: "#2563eb" }} />
                Preview: {previewTemplate.name}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {!isTemplateActive(previewTemplate) && (
                  <button
                    className="tmpl-btn-default"
                    style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem" }}
                    onClick={() => {
                      handleSetDefault(previewTemplate);
                    }}
                  >
                    <FaCheck /> Set as Default
                  </button>
                )}
                <button
                  className="tmpl-modal-close-btn"
                  onClick={() => setPreviewTemplate(null)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="tmpl-modal-content">
              <PDFViewer width="100%" height="100%" showToolbar={true}>
                <MyDocument
                  p_data={SAMPLE_PATIENT}
                  dr_data={SAMPLE_DOCTOR}
                  report={SAMPLE_REPORT}
                  activeTemplate={{
                    name: previewTemplate.name,
                    layoutType: previewTemplate.layoutType,
                  }}
                />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateBuilder;
