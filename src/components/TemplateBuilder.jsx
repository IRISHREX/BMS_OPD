import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../main";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import Sidebar from "./Sidebar";
import RadialMenu from "./RadialMenu";
import {
  FaArrowLeft,
  FaSave,
  FaPlus,
  FaTrash,
  FaGripVertical,
  FaEye,
  FaEyeSlash,
  FaBold,
  FaItalic,
  FaUnderline,
  FaPalette,
  FaColumns,
  FaTable,
  FaStethoscope,
  FaUserInjured,
  FaPills,
  FaFilePrescription,
  FaCheck,
  FaChevronUp,
  FaChevronDown,
  FaExchangeAlt,
  FaUndo,
} from "react-icons/fa";
import "./TemplateBuilder.css";

// Default prescription sections derived directly from schemas (appointmentSchema & templateSchema)
const INITIAL_SECTIONS = [
  {
    id: "complaints",
    key: "presentingComplaints",
    title: "Chief Complaints & History",
    column: "left",
    order: 0,
    visible: true,
    style: { fontSize: 9, bold: false, color: "#0f172a" },
    sampleText: "Fever and mild cough for 3 days. No past history of asthma.",
  },
  {
    id: "vitals",
    key: "diagnosys",
    title: "Vitals & Measurements",
    column: "left",
    order: 1,
    visible: true,
    style: { fontSize: 9, bold: false, color: "#0f172a" },
    items: [
      { label: "BP", val: "120/80 mmHg" },
      { label: "PR", val: "76 bpm" },
      { label: "SPO2", val: "99%" },
      { label: "Temp", val: "98.6°F" },
      { label: "Weight", val: "68 kg" },
      { label: "BMI", val: "22.4" },
    ],
  },
  {
    id: "findings",
    key: "clinical_findings",
    title: "Clinical Examination",
    column: "left",
    order: 2,
    visible: true,
    style: { fontSize: 9, bold: false, color: "#0f172a" },
    sampleText: "Pallor: Nil, Icterus: Nil, Chest: Clear, CVS: S1 S2 Normal.",
  },
  {
    id: "diagnosis",
    key: "provisionalDiagnosis",
    title: "Diagnosis / Impression",
    column: "right",
    order: 0,
    visible: true,
    style: { fontSize: 10, bold: true, color: "#1d4ed8" },
    sampleText: "Upper Respiratory Tract Infection (Acute Rhinitis)",
  },
  {
    id: "rxTable",
    key: "medicineAdvice",
    title: "Rx - Medicine Advice",
    column: "right",
    order: 1,
    visible: true,
    style: { fontSize: 9, bold: false, color: "#0f172a" },
    columns: [
      { key: "type", label: "Type", visible: true, width: "15%" },
      { key: "name", label: "Medicine Name", visible: true, width: "35%" },
      { key: "dose", label: "Dosage", visible: true, width: "15%" },
      { key: "frequency", label: "Frequency", visible: true, width: "15%" },
      { key: "duration", label: "Duration", visible: true, width: "10%" },
      { key: "notes", label: "Instructions", visible: true, width: "10%" },
    ],
    sampleRows: [
      {
        type: "Tab",
        name: "Paracetamol 500mg",
        dose: "1 tab",
        frequency: "1-0-1",
        duration: "3 days",
        notes: "After food",
      },
      {
        type: "Cap",
        name: "Amoxicillin 250mg",
        dose: "1 cap",
        frequency: "1-0-1",
        duration: "5 days",
        notes: "After food",
      },
      {
        type: "Syr",
        name: "Cetirizine Syrup",
        dose: "5 ml",
        frequency: "0-0-1",
        duration: "5 days",
        notes: "At bedtime",
      },
    ],
  },
  {
    id: "investigations",
    key: "testAdvice",
    title: "Investigation / Lab Tests",
    column: "right",
    order: 2,
    visible: true,
    style: { fontSize: 9, bold: false, color: "#0f172a" },
    sampleText: "CBC, ESR, Chest X-Ray (PA View)",
  },
  {
    id: "advice",
    key: "advice",
    title: "General & Dietary Advice",
    column: "right",
    order: 3,
    visible: true,
    style: { fontSize: 9, bold: false, color: "#0f172a" },
    sampleText: "Drink warm water. Rest adequately. Avoid cold food items.",
  },
  {
    id: "seal",
    key: "seal",
    title: "Follow-Up & Doctor Seal",
    column: "right",
    order: 4,
    visible: true,
    style: { fontSize: 9, bold: false, color: "#0f172a" },
    followUp: "Review after 5 days or SOS",
  },
];

// Patient info fields from appointmentSchema
const INITIAL_PATIENT_FIELDS = [
  { key: "name", label: "Patient Name", val: "Rahul Sharma", visible: true },
  { key: "ageGender", label: "Age / Gender", val: "28 Y / Male", visible: true },
  { key: "patientId", label: "UHID / ID", val: "P-10024", visible: true },
  { key: "date", label: "Date", val: new Date().toLocaleDateString("en-GB"), visible: true },
  { key: "phone", label: "Phone", val: "9876543210", visible: true },
  { key: "address", label: "Address", val: "Kolkata, WB", visible: false },
];

const TemplateBuilder = () => {
  const { admin } = useContext(Context);
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  // Template List & Selection
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("new");
  const [templateName, setTemplateName] = useState("My Custom Prescription Template");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Visual Document Settings (Word Ribbon)
  const [fontFamily, setFontFamily] = useState("Inter");
  const [baseFontSize, setBaseFontSize] = useState(10);
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [showBorder, setShowBorder] = useState(true);
  const [layoutMode, setLayoutMode] = useState("two-column-left"); // 'two-column-left', 'two-column-right', 'single-column'
  const [headerHeight, setHeaderHeight] = useState(50); // mm
  const [footerHeight, setFooterHeight] = useState(15); // mm
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  // Canvas State: Sections & Patient Fields
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [patientFields, setPatientFields] = useState(INITIAL_PATIENT_FIELDS);
  const [selectedSectionId, setSelectedSectionId] = useState("rxTable");

  // Drag & Drop tracking
  const [draggedSectionId, setDraggedSectionId] = useState(null);

  // Fetch templates for current doctor / admin
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/v1/template/my-templates");
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
      snackbar.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Load a template into canvas
  const handleLoadTemplate = (tmpl) => {
    if (!tmpl || tmpl === "new") {
      setSelectedTemplateId("new");
      setTemplateName(`Template ${templates.length + 1}`);
      setSections(INITIAL_SECTIONS);
      setPatientFields(INITIAL_PATIENT_FIELDS);
      setHeaderHeight(50);
      setFooterHeight(15);
      setBaseFontSize(10);
      setShowBorder(true);
      setLayoutMode("two-column-left");
      setIsDefault(templates.length === 0);
      return;
    }

    setSelectedTemplateId(tmpl._id);
    setTemplateName(tmpl.name || "Custom Template");
    setHeaderHeight(tmpl.headerHeight || 50);
    setFooterHeight(tmpl.footerHeight || 15);
    setBaseFontSize(tmpl.fontSize || 10);
    setShowBorder(tmpl.showBorder !== false);
    setIsDefault(Boolean(tmpl.isDefault));
    setMargins(tmpl.margins || { top: 0, bottom: 0, left: 0, right: 0 });

    if (tmpl.layoutConfig) {
      if (tmpl.layoutConfig.fontFamily) setFontFamily(tmpl.layoutConfig.fontFamily);
      if (tmpl.layoutConfig.primaryColor) setPrimaryColor(tmpl.layoutConfig.primaryColor);
      if (tmpl.layoutConfig.layoutMode) setLayoutMode(tmpl.layoutConfig.layoutMode);
      if (tmpl.layoutConfig.sections) setSections(tmpl.layoutConfig.sections);
      if (tmpl.layoutConfig.patientFields) setPatientFields(tmpl.layoutConfig.patientFields);
    } else {
      // Fallback layout mapping for legacy templates
      const mode = tmpl.layoutType?.includes("Left-side") ? "two-column-right" : "two-column-left";
      setLayoutMode(mode);
      setSections(INITIAL_SECTIONS);
    }
  };

  // Section visibility toggle
  const toggleSectionVisibility = (secId) => {
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, visible: !s.visible } : s))
    );
  };

  // Move section between columns
  const switchSectionColumn = (secId) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== secId) return s;
        const nextCol = s.column === "left" ? "right" : "left";
        return { ...s, column: nextCol };
      })
    );
  };

  // Reorder within column (up/down)
  const moveSectionOrder = (secId, direction) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    const sameCol = sections
      .filter((s) => s.column === sec.column)
      .sort((a, b) => a.order - b.order);
    const idx = sameCol.findIndex((s) => s.id === secId);
    if (direction === "up" && idx > 0) {
      const prevSec = sameCol[idx - 1];
      setSections((all) =>
        all.map((s) => {
          if (s.id === sec.id) return { ...s, order: prevSec.order };
          if (s.id === prevSec.id) return { ...s, order: sec.order };
          return s;
        })
      );
    } else if (direction === "down" && idx < sameCol.length - 1) {
      const nextSec = sameCol[idx + 1];
      setSections((all) =>
        all.map((s) => {
          if (s.id === sec.id) return { ...s, order: nextSec.order };
          if (s.id === nextSec.id) return { ...s, order: sec.order };
          return s;
        })
      );
    }
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e, secId) => {
    setDraggedSectionId(secId);
    e.dataTransfer.setData("text/plain", secId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnSection = (e, targetSecId) => {
    e.preventDefault();
    if (!draggedSectionId || draggedSectionId === targetSecId) return;

    const sourceSec = sections.find((s) => s.id === draggedSectionId);
    const targetSec = sections.find((s) => s.id === targetSecId);
    if (!sourceSec || !targetSec) return;

    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sourceSec.id) {
          return { ...s, column: targetSec.column, order: targetSec.order };
        }
        if (s.id === targetSec.id) {
          return { ...s, order: sourceSec.order };
        }
        return s;
      })
    );
    setDraggedSectionId(null);
  };

  const handleDropOnColumn = (e, targetColumn) => {
    e.preventDefault();
    if (!draggedSectionId) return;
    setSections((prev) =>
      prev.map((s) => (s.id === draggedSectionId ? { ...s, column: targetColumn } : s))
    );
    setDraggedSectionId(null);
  };

  // Rx Table Column Toggle
  const toggleRxColumn = (colKey) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== "rxTable") return s;
        const cols = (s.columns || []).map((c) =>
          c.key === colKey ? { ...c, visible: !c.visible } : c
        );
        return { ...s, columns: cols };
      })
    );
  };

  // Save Template to Database
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      snackbar.error("Please enter a template name");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: templateName.trim(),
        headerHeight: Number(headerHeight),
        footerHeight: Number(footerHeight),
        fontSize: Number(baseFontSize),
        showBorder: Boolean(showBorder),
        margins,
        isDefault,
        layoutType:
          layoutMode === "two-column-left"
            ? "Template 1: Right-side margin layout"
            : layoutMode === "two-column-right"
            ? "Template 2: Left-side margin layout"
            : "single-column",
        visibility: {
          vitals: sections.find((s) => s.id === "vitals")?.visible !== false,
          symptoms: sections.find((s) => s.id === "complaints")?.visible !== false,
          diagnosis: sections.find((s) => s.id === "diagnosis")?.visible !== false,
          advice: sections.find((s) => s.id === "advice")?.visible !== false,
        },
        layoutConfig: {
          fontFamily,
          primaryColor,
          layoutMode,
          sections,
          patientFields,
        },
      };

      const isUpdate = selectedTemplateId && selectedTemplateId !== "new";
      const { data } = isUpdate
        ? await api.put(`/api/v1/template/${selectedTemplateId}`, payload)
        : await api.post("/api/v1/template", payload);

      if (data.success) {
        snackbar.success(data.message || "Template saved successfully!");
        fetchTemplates();
        if (data.template?._id) setSelectedTemplateId(data.template._id);
      }
    } catch (err) {
      console.error("Save template error:", err);
      snackbar.error(err.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      const { data } = await api.delete(`/api/v1/template/${id}`);
      if (data.success) {
        snackbar.success("Template deleted successfully");
        fetchTemplates();
        handleLoadTemplate("new");
      }
    } catch (err) {
      snackbar.error(err.response?.data?.message || "Failed to delete template");
    }
  };

  // Currently selected section for property inspector
  const activeSection = sections.find((s) => s.id === selectedSectionId) || sections[0];

  // Column distribution
  const leftSections = sections
    .filter((s) => (layoutMode === "single-column" ? true : s.column === "left"))
    .sort((a, b) => a.order - b.order);

  const rightSections = sections
    .filter((s) => (layoutMode === "single-column" ? false : s.column === "right"))
    .sort((a, b) => a.order - b.order);

  return (
    <div className="tmpl-builder-container">
      <Sidebar />
      <RadialMenu />

      {/* =========================================================================
         1. TOP NAVIGATION & TEMPLATE SWITCHER
         ========================================================================= */}
      <header className="tmpl-builder-topbar">
        <div className="tmpl-builder-title-group">
          <button onClick={() => navigate("/settings")} className="tmpl-builder-back-btn">
            <FaArrowLeft /> Back
          </button>
          <div>
            <input
              type="text"
              className="tmpl-builder-name-input"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Prescription Template Name"
              title="Click to rename template"
            />
          </div>
        </div>

        <div className="tmpl-builder-top-actions">
          {/* Saved Templates Dropdown */}
          <select
            className="tmpl-ribbon-select"
            value={selectedTemplateId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "new") handleLoadTemplate("new");
              else {
                const found = templates.find((t) => t._id === val);
                handleLoadTemplate(found);
              }
            }}
          >
            <option value="new">+ Create New Template</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} {t.isDefault ? "★ (Default)" : ""}
              </option>
            ))}
          </select>

          {/* Set as default checkbox */}
          <label className="tmpl-builder-default-label">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Set Default
          </label>

          {selectedTemplateId !== "new" && (
            <button
              className="tmpl-builder-btn"
              style={{ color: "#dc2626" }}
              onClick={() => handleDeleteTemplate(selectedTemplateId)}
              title="Delete this template"
            >
              <FaTrash />
            </button>
          )}

          <button
            className="tmpl-builder-btn primary"
            onClick={handleSaveTemplate}
            disabled={saving}
          >
            <FaSave /> {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </header>

      {/* =========================================================================
         2. MICROSOFT WORD RIBBON TOOLBAR
         ========================================================================= */}
      <div className="tmpl-builder-ribbon">
        {/* Typography */}
        <div className="tmpl-ribbon-group">
          <span className="tmpl-ribbon-label">Font</span>
          <select
            className="tmpl-ribbon-select"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            <option value="Inter">Inter (Modern Sans)</option>
            <option value="Arial">Arial (Standard)</option>
            <option value="Roboto">Roboto</option>
            <option value="Times New Roman">Times New Roman (Classic)</option>
            <option value="Georgia">Georgia (Serif)</option>
            <option value="Courier New">Courier (Monospace)</option>
          </select>

          <select
            className="tmpl-ribbon-select"
            value={baseFontSize}
            onChange={(e) => setBaseFontSize(Number(e.target.value))}
            title="Base Font Size (pt)"
          >
            {[8, 9, 10, 11, 12, 14].map((sz) => (
              <option key={sz} value={sz}>
                {sz} pt
              </option>
            ))}
          </select>
        </div>

        {/* Text Style Controls */}
        <div className="tmpl-ribbon-group">
          <span className="tmpl-ribbon-label">Style</span>
          <button
            className={`tmpl-ribbon-btn ${activeSection.style?.bold ? "active" : ""}`}
            onClick={() => {
              setSections((prev) =>
                prev.map((s) =>
                  s.id === activeSection.id
                    ? { ...s, style: { ...s.style, bold: !s.style?.bold } }
                    : s
                )
              );
            }}
            title="Toggle Bold on Selected Section"
          >
            <FaBold />
          </button>

          <button
            className={`tmpl-ribbon-btn ${showBorder ? "active" : ""}`}
            onClick={() => setShowBorder(!showBorder)}
            title="Toggle Document Grid Borders"
          >
            <FaTable />
          </button>

          {/* Theme Color */}
          <div className="tmpl-ribbon-color-picker" title="Primary Branding Color">
            <input
              type="color"
              className="tmpl-ribbon-color-input"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </div>
        </div>

        {/* Layout Columns */}
        <div className="tmpl-ribbon-group">
          <span className="tmpl-ribbon-label">Columns</span>
          <select
            className="tmpl-ribbon-select"
            value={layoutMode}
            onChange={(e) => setLayoutMode(e.target.value)}
          >
            <option value="two-column-left">2 Columns (Left Vitals / Right Rx)</option>
            <option value="two-column-right">2 Columns (Right Vitals / Left Rx)</option>
            <option value="single-column">1 Column (Full Width Stack)</option>
          </select>
        </div>

        {/* Header / Footer Heights */}
        <div className="tmpl-ribbon-group">
          <span className="tmpl-ribbon-label">Header:</span>
          <input
            type="number"
            min="0"
            max="100"
            value={headerHeight}
            onChange={(e) => setHeaderHeight(Number(e.target.value))}
            style={{ width: "55px", padding: "0.25rem", border: "1px solid #cbd5e1", borderRadius: "4px" }}
            title="Header zone height in mm"
          />
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>mm</span>

          <span className="tmpl-ribbon-label" style={{ marginLeft: "0.5rem" }}>Footer:</span>
          <input
            type="number"
            min="0"
            max="60"
            value={footerHeight}
            onChange={(e) => setFooterHeight(Number(e.target.value))}
            style={{ width: "55px", padding: "0.25rem", border: "1px solid #cbd5e1", borderRadius: "4px" }}
            title="Footer zone height in mm"
          />
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>mm</span>
        </div>

        {/* Quick Reset */}
        <div className="tmpl-ribbon-group">
          <button
            className="tmpl-ribbon-btn"
            style={{ width: "auto", padding: "0 8px" }}
            onClick={() => handleLoadTemplate("new")}
            title="Reset to default blueprint"
          >
            <FaUndo /> Reset
          </button>
        </div>
      </div>

      {/* =========================================================================
         3. 3-PANE WORKSPACE: SCHEMA PALETTE | WORD CANVAS | PROPERTIES
         ========================================================================= */}
      <div className="tmpl-builder-workspace">
        {/* --- LEFT SIDEBAR: Dynamic Schema Keys Palette --- */}
        <aside className="tmpl-builder-sidebar-left">
          <div className="tmpl-sidebar-header">
            <h3>Schema Keys & Blocks</h3>
            <p>Drag or click keys to insert and reposition in your prescription layout</p>
          </div>

          <div className="tmpl-sidebar-content">
            {/* Patient Info Keys */}
            <div className="tmpl-schema-category">
              <div className="tmpl-schema-cat-title">
                <FaUserInjured style={{ color: "#0284c7" }} /> Patient Demographics
              </div>
              <div className="tmpl-schema-pill-list">
                {patientFields.map((f) => (
                  <span
                    key={f.key}
                    className={`tmpl-schema-tag ${f.visible ? "active" : ""}`}
                    onClick={() => {
                      setPatientFields((all) =>
                        all.map((p) => (p.key === f.key ? { ...p, visible: !p.visible } : p))
                      );
                    }}
                    title="Click to toggle visibility in patient box"
                  >
                    {f.visible ? <FaCheck style={{ fontSize: "0.65rem" }} /> : "+"} {f.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Clinical Sections */}
            <div className="tmpl-schema-category">
              <div className="tmpl-schema-cat-title">
                <FaStethoscope style={{ color: "#16a34a" }} /> Clinical Sections
              </div>
              <div className="tmpl-schema-pill-list">
                {sections.map((s) => (
                  <div
                    key={s.id}
                    className={`tmpl-schema-tag ${s.visible ? "active" : ""}`}
                    onClick={() => setSelectedSectionId(s.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, s.id)}
                    title="Click to inspect, or drag onto canvas"
                  >
                    <FaGripVertical style={{ color: "#94a3b8" }} />
                    {s.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Medicine / Rx Table Columns */}
            <div className="tmpl-schema-category">
              <div className="tmpl-schema-cat-title">
                <FaPills style={{ color: "#7c3aed" }} /> Rx Table Columns
              </div>
              <div className="tmpl-schema-pill-list">
                {sections
                  .find((s) => s.id === "rxTable")
                  ?.columns?.map((c) => (
                    <span
                      key={c.key}
                      className={`tmpl-schema-tag ${c.visible ? "active" : ""}`}
                      onClick={() => toggleRxColumn(c.key)}
                      title="Toggle this column in the Medicine table"
                    >
                      {c.visible ? <FaCheck style={{ fontSize: "0.65rem" }} /> : "+"} {c.label}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </aside>

        {/* --- CENTER: MICROSOFT WORD A4 DOCUMENT CANVAS --- */}
        <main className="tmpl-builder-canvas-area">
          <div
            className="tmpl-a4-sheet"
            style={{
              fontFamily: fontFamily,
              fontSize: `${baseFontSize}pt`,
              border: showBorder ? "1px solid #cbd5e1" : "none",
            }}
          >
            {/* 1. Header Zone */}
            <div
              className="tmpl-doc-header"
              style={{
                height: `${headerHeight * 2.2}px`,
                borderBottomColor: primaryColor,
              }}
            >
              <div className="tmpl-doc-header-content">
                <div className="tmpl-doc-header-title" style={{ color: primaryColor }}>
                  {admin?.hospitalName || "NOVEL HEALTHCARE CLINIC & HOSPITAL"}
                </div>
                <div className="tmpl-doc-header-sub">
                  Dr. {admin?.firstName || "Doctor"} {admin?.lastName || "Physician"} • MBBS, MD •{" "}
                  {admin?.doctorDepartment || "General Medicine"}
                </div>
              </div>
              <div className="tmpl-height-handle" title="Header Height">
                ↕ Header ({headerHeight}mm)
              </div>
            </div>

            {/* 2. Document Body Area */}
            <div className="tmpl-doc-body">
              {/* Patient Info Bar */}
              <div className="tmpl-patient-box" style={{ borderColor: showBorder ? "#cbd5e1" : "transparent" }}>
                {patientFields
                  .filter((f) => f.visible)
                  .map((f) => (
                    <div key={f.key} className="tmpl-patient-item">
                      <strong>{f.label}:</strong>
                      <span>{f.val}</span>
                    </div>
                  ))}
              </div>

              {/* Multi-Column Layout Container */}
              <div
                className="tmpl-columns-layout"
                style={{
                  flexDirection:
                    layoutMode === "two-column-right"
                      ? "row-reverse"
                      : layoutMode === "single-column"
                      ? "column"
                      : "row",
                }}
              >
                {/* Column 1 (Left / Secondary) */}
                <div
                  className="tmpl-col-left"
                  style={{
                    width: layoutMode === "single-column" ? "100%" : "34%",
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnColumn(e, "left")}
                >
                  {leftSections
                    .filter((s) => s.visible)
                    .map((sec) => (
                      <div
                        key={sec.id}
                        className={`tmpl-section-card ${selectedSectionId === sec.id ? "selected" : ""}`}
                        onClick={() => setSelectedSectionId(sec.id)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, sec.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnSection(e, sec.id)}
                        style={{
                          border: showBorder ? "1px solid #e2e8f0" : "none",
                        }}
                      >
                        <div className="tmpl-section-header">
                          <div className="tmpl-section-title-wrap">
                            <FaGripVertical className="tmpl-drag-handle" />
                            <span
                              className="tmpl-section-title"
                              style={{
                                color: sec.style?.color || primaryColor,
                                fontWeight: sec.style?.bold ? 700 : 600,
                              }}
                            >
                              {sec.title}
                            </span>
                          </div>
                          <div className="tmpl-section-tools">
                            <button
                              className="tmpl-tool-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSectionOrder(sec.id, "up");
                              }}
                              title="Move up"
                            >
                              <FaChevronUp />
                            </button>
                            <button
                              className="tmpl-tool-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSectionOrder(sec.id, "down");
                              }}
                              title="Move down"
                            >
                              <FaChevronDown />
                            </button>
                            <button
                              className="tmpl-tool-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                switchSectionColumn(sec.id);
                              }}
                              title="Switch to opposite column"
                            >
                              <FaExchangeAlt />
                            </button>
                            <button
                              className="tmpl-tool-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSectionVisibility(sec.id);
                              }}
                              title="Hide section"
                            >
                              <FaEyeSlash />
                            </button>
                          </div>
                        </div>

                        {/* Section In-Canvas Content */}
                        <div className="tmpl-section-content">
                          {sec.id === "vitals" && (
                            <div className="tmpl-vitals-grid">
                              {sec.items?.map((it) => (
                                <div key={it.label} className="tmpl-vital-pill">
                                  <div className="tmpl-vital-pill-lbl">{it.label}</div>
                                  <div className="tmpl-vital-pill-val">{it.val}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {sec.id !== "vitals" && sec.id !== "rxTable" && (
                            <p style={{ margin: 0 }}>{sec.sampleText || "No data recorded."}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Column 2 (Right / Primary Rx Body) */}
                {layoutMode !== "single-column" && (
                  <div
                    className="tmpl-col-right"
                    style={{ width: "66%" }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnColumn(e, "right")}
                  >
                    {rightSections
                      .filter((s) => s.visible)
                      .map((sec) => (
                        <div
                          key={sec.id}
                          className={`tmpl-section-card ${selectedSectionId === sec.id ? "selected" : ""}`}
                          onClick={() => setSelectedSectionId(sec.id)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, sec.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropOnSection(e, sec.id)}
                          style={{
                            border: showBorder ? "1px solid #e2e8f0" : "none",
                          }}
                        >
                          <div className="tmpl-section-header">
                            <div className="tmpl-section-title-wrap">
                              <FaGripVertical className="tmpl-drag-handle" />
                              <span
                                className="tmpl-section-title"
                                style={{
                                  color: sec.style?.color || primaryColor,
                                  fontWeight: sec.style?.bold ? 700 : 600,
                                }}
                              >
                                {sec.title}
                              </span>
                            </div>
                            <div className="tmpl-section-tools">
                              <button
                                className="tmpl-tool-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSectionOrder(sec.id, "up");
                                }}
                                title="Move up"
                              >
                                <FaChevronUp />
                              </button>
                              <button
                                className="tmpl-tool-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSectionOrder(sec.id, "down");
                                }}
                                title="Move down"
                              >
                                <FaChevronDown />
                              </button>
                              <button
                                className="tmpl-tool-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  switchSectionColumn(sec.id);
                                }}
                                title="Switch to left column"
                              >
                                <FaExchangeAlt />
                              </button>
                              <button
                                className="tmpl-tool-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSectionVisibility(sec.id);
                                }}
                                title="Hide section"
                              >
                                <FaEyeSlash />
                              </button>
                            </div>
                          </div>

                          {/* Section In-Canvas Content */}
                          <div className="tmpl-section-content">
                            {sec.id === "rxTable" ? (
                              <div className="tmpl-rx-table-container">
                                {/* Rx Column Visibility Controls */}
                                <div className="tmpl-rx-col-toggles">
                                  {sec.columns?.map((col) => (
                                    <span
                                      key={col.key}
                                      className={`tmpl-rx-col-pill ${col.visible ? "active" : ""}`}
                                      onClick={() => toggleRxColumn(col.key)}
                                      title="Toggle column"
                                    >
                                      {col.visible ? <FaCheck style={{ fontSize: "0.6rem" }} /> : "+"} {col.label}
                                    </span>
                                  ))}
                                </div>

                                <table className="tmpl-rx-table">
                                  <thead>
                                    <tr>
                                      {sec.columns
                                        ?.filter((c) => c.visible)
                                        .map((c) => (
                                          <th
                                            key={c.key}
                                            style={{
                                              width: c.width,
                                              borderBottom: `2px solid ${primaryColor}`,
                                            }}
                                          >
                                            {c.label}
                                          </th>
                                        ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sec.sampleRows?.map((row, rIdx) => (
                                      <tr key={rIdx}>
                                        {sec.columns
                                          ?.filter((c) => c.visible)
                                          .map((c) => (
                                            <td key={c.key}>{row[c.key] || "-"}</td>
                                          ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : sec.id === "seal" ? (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", minHeight: "55px" }}>
                                <div>
                                  <strong>Next Visit:</strong> {sec.followUp}
                                </div>
                                <div style={{ textAlign: "center", borderTop: "1px solid #94a3b8", width: "130px", paddingTop: "4px" }}>
                                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Doctor's Signature</span>
                                </div>
                              </div>
                            ) : (
                              <p style={{ margin: 0 }}>{sec.sampleText || "No data recorded."}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer Zone */}
            <div
              className="tmpl-doc-footer"
              style={{
                height: `${footerHeight * 2.2}px`,
                borderTopColor: primaryColor,
              }}
            >
              <div className="tmpl-doc-footer-content">
                Clinic Address: 123 Health Ave, City • Emergency Contact: +91 98765 43210
              </div>
              <div className="tmpl-height-handle" style={{ top: "-8px", bottom: "auto" }}>
                ↕ Footer ({footerHeight}mm)
              </div>
            </div>
          </div>
        </main>

        {/* --- RIGHT SIDEBAR: Property Inspector --- */}
        <aside className="tmpl-builder-sidebar-right">
          <div className="tmpl-inspector-header">
            <h3>Format Inspector</h3>
          </div>

          <div className="tmpl-inspector-content">
            <div className="tmpl-field-group">
              <label className="tmpl-field-label">Selected Section:</label>
              <input
                type="text"
                className="tmpl-field-input"
                value={activeSection.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setSections((prev) =>
                    prev.map((s) => (s.id === activeSection.id ? { ...s, title: val } : s))
                  );
                }}
                placeholder="Section Title"
              />
            </div>

            <div className="tmpl-field-group">
              <label className="tmpl-field-label">Placement Column:</label>
              <select
                className="tmpl-ribbon-select"
                value={activeSection.column}
                onChange={(e) => {
                  const col = e.target.value;
                  setSections((prev) =>
                    prev.map((s) => (s.id === activeSection.id ? { ...s, column: col } : s))
                  );
                }}
              >
                <option value="left">Left Sidebar / Column 1</option>
                <option value="right">Right Main / Column 2</option>
              </select>
            </div>

            <div className="tmpl-field-group">
              <label className="tmpl-field-label">Text Color:</label>
              <input
                type="color"
                className="tmpl-ribbon-color-input"
                value={activeSection.style?.color || "#0f172a"}
                onChange={(e) => {
                  const color = e.target.value;
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === activeSection.id ? { ...s, style: { ...s.style, color } } : s
                    )
                  );
                }}
              />
            </div>

            <div className="tmpl-field-group">
              <label className="tmpl-field-label">Visibility:</label>
              <button
                className="tmpl-builder-btn"
                onClick={() => toggleSectionVisibility(activeSection.id)}
              >
                {activeSection.visible ? (
                  <>
                    <FaEye /> Visible
                  </>
                ) : (
                  <>
                    <FaEyeSlash /> Hidden
                  </>
                )}
              </button>
            </div>

            {activeSection.id === "rxTable" && (
              <div className="tmpl-field-group">
                <label className="tmpl-field-label">Configure Rx Columns:</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  {activeSection.columns?.map((col) => (
                    <label key={col.key} style={{ fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleRxColumn(col.key)}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TemplateBuilder;
