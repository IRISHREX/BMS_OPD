import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer';
import { dobToAge } from "../utils/ageUtils";
import DynamicTemplate from "./DynamicTemplate";
import api from "../utils/api";

// Crisp Vector Icons for Orthopedic Template headers (safe for all PDF engines)
const IconUser = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </Svg>
);

const IconHeart = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </Svg>
);

const IconClipboard = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  </Svg>
);

const IconHistory = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
  </Svg>
);

const IconStethoscope = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-6H8V5h10v2z" />
  </Svg>
);

const IconLab = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M20.8 18.4L15 7.6V4h1c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1h1v3.6L3.2 18.4C2.45 19.8 3.45 22 5.04 22h13.92c1.59 0 2.59-2.2 1.84-3.6zM6 19l4.5-8.4V4h3v6.6L18 19H6z" />
  </Svg>
);

const IconRadiology = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </Svg>
);

const IconTarget = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
  </Svg>
);

const IconSearch = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </Svg>
);

const IconAdvice = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
  </Svg>
);

const IconCalendar = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path fill="#0a4a75" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
  </Svg>
);

const IconCheck = () => (
  <Svg width={7} height={7} viewBox="0 0 24 24">
    <Path fill="#0a4a75" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </Svg>
);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB") : ""; // dd/mm/yyyy

const cleanTrailingComma = (val) => {
  if (!val) return "";
  if (Array.isArray(val)) return val.filter(Boolean).join(", ");
  if (typeof val === "object") {
    if (val.value !== undefined) return cleanTrailingComma(val.value);
    return JSON.stringify(val);
  }
  const trimmed = String(val).trim();
  return trimmed.endsWith(",") ? trimmed.slice(0, -1) : trimmed;
};

// Helper to construct full image URLs
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath;
  }
  const base = api.defaults.baseURL || "";
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${cleanBase}${cleanPath}`;
};

// Common Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    margin: "0mm",
    padding: "0mm",
    fontSize: "9pt",
  },
  header_section: {
    margin: "0mm",
    padding: 0,
    maxHeight: "38mm",
    width: "210mm",
  },
  header_image: {
    width: "100%",
    maxHeight: "38mm",
  },
  footer_section: {
    margin: "0mm",
    padding: "0mm",
    maxHeight: "14mm",
    width: "210mm",
    position: "absolute",
    bottom: "0mm",
  },
  footer_image: {
    width: "100%",
    maxHeight: "14mm",
  },

  // --- Default Layout styles (original) ---
  main_section: {
    marginHorizontal: "10mm",
    marginBottom: "55mm",
    padding: "2mm",
    flexGrow: 1,
    border: "1 solid #000",
    borderBottom: "0 solid #000",
    height: "172mm",
    width: "190mm",
    textAlign: "justify",
  },
  seal: {
    position: "absolute",
    bottom: "15mm",
    marginHorizontal: "10mm",
    border: "1 solid #000",
    width: "190mm",
    height: "40mm",
    flexDirection: "row",
    padding: "2mm",
  },
  seal_left: {
    width: "65%",
    gap: "1mm",
  },
  seal_right: {
    width: "35%",
    height: "100%",
    fontSize: "11pt",
    display: "flex",
    justifyContent: "flex-end",
    textAlign: "right",
    paddingRight: "5mm",
    paddingBottom: "2mm",
  },

  // --- Shared Patient & Upper Box styles ---
  upper_box: {
    flexDirection: "row",
    borderBottom: "1 solid #000",
    paddingBottom: "2mm",
  },
  upper_left: {
    width: "72%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  personal_details: {
    display: "flex",
    flexDirection: "row",
    gap: "1mm",
    flexWrap: "wrap",
  },
  upper_right: {
    width: "28%",
  },
  heading_values: {
    flexDirection: "row",
    gap: "1mm",
  },
  heading: {
    fontWeight: "bold",
  },

  // --- Complaints and Examination Box (Template 1 & 2) ---
  complaints_box: {
    borderBottom: "1 solid #000",
    paddingVertical: "1.5mm",
    paddingHorizontal: "2mm",
    gap: "1mm",
  },

  // --- Two-Column Layout Outer Box ---
  two_col_frame: {
    marginHorizontal: "10mm",
    marginTop: "2mm",
    marginBottom: "16mm",
    border: "1 solid #000",
    width: "190mm",
    height: "216mm",
    display: "flex",
    flexDirection: "column",
  },
  two_col_body: {
    flexDirection: "row",
    flex: 1,
    height: "172mm",
  },

  // Sidebar / Margin Column
  margin_col: {
    width: "28%",
    display: "flex",
    flexDirection: "column",
    padding: "2mm",
    fontSize: "8.5pt",
  },
  sidebar_section: {
    marginBottom: "3mm",
  },
  sidebar_title: {
    fontWeight: "bold",
    fontSize: "9pt",
    marginBottom: "1mm",
    color: "#000",
  },
  sidebar_item: {
    fontSize: "8pt",
    marginBottom: "1mm",
  },

  // Rx Table Column
  rx_col: {
    width: "72%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  table_header: {
    flexDirection: "row",
    backgroundColor: "#cbd5e1",
    fontWeight: "bold",
    fontSize: "8pt",
    paddingVertical: "1.5mm",
    borderBottom: "1 solid #999",
  },
  table_row: {
    flexDirection: "row",
    fontSize: "8pt",
    borderBottom: "1 solid #e0e0e0",
    minHeight: "5.5mm",
    alignItems: "stretch",
  },
  table_row_empty: {
    flexDirection: "row",
    fontSize: "8pt",
    borderBottom: "1 solid #e0e0e0",
    height: "5.5mm",
  },
  cell_sn: {
    width: "7%",
    textAlign: "center",
    paddingVertical: "1mm",
  },
  cell_type: {
    width: "11%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  cell_med: {
    width: "36%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  cell_dose: {
    width: "11%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  cell_route: {
    width: "11%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  cell_freq: {
    width: "13%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  cell_dur: {
    width: "11%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  ortho_cell_sn: {
    width: "5%",
    textAlign: "center",
    paddingVertical: "1mm",
  },
  ortho_cell_med: {
    width: "22%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  ortho_cell_type: {
    width: "10%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  ortho_cell_dose: {
    width: "13%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  ortho_cell_freq: {
    width: "18%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  ortho_cell_dur: {
    width: "11%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  ortho_cell_inst: {
    width: "21%",
    paddingLeft: "1mm",
    paddingVertical: "1mm",
  },
  cell_border: {
    borderRight: "1 solid #999",
  },
  cell_border_light: {
    borderRight: "1 solid #e0e0e0",
  },

  // Advice & Follow-up box at bottom of Rx col
  rx_bottom_box: {
    padding: "2mm",
    borderTop: "1 solid #000",
  },

  // Doctor Signature
  doctor_sign: {
    fontWeight: "bold",
    fontSize: "10pt",
  },

  // Original single-column styles
  pData: {
    marginTop: "2mm",
    marginBottom: "4mm",
  },
  gravida_vitals: {
    marginTop: "2mm",
    marginBottom: "3mm",
  },
  gravida_section: {
    flexDirection: "row",
    gap: "4mm",
  },
  vitals_section: {
    marginTop: "2mm",
    flexDirection: "row",
    gap: "4mm",
    flexWrap: "wrap",
  },
  rxLogo: {
    width: 24,
    marginBottom: "1mm",
  },
  med_advice: {
    display: "flex",
    flexDirection: "column",
    border: "1 solid #ccc",
  },
  medic_header: {
    flexDirection: "row",
    gap: "1mm",
    fontWeight: "bold",
    backgroundColor: "#c0c7cf",
    padding: "1mm",
  },
  medic_row: {
    flexDirection: "row",
    gap: "1mm",
    padding: "1mm",
    borderTop: "1 solid #ccc",
  },

  // --- Template 3: Exact Replica Ortho Styles ---
  ortho_frame: {
    marginHorizontal: "4mm",
    marginTop: "1mm",
    marginBottom: "1mm",
    width: "202mm",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    fontSize: "8pt",
  },
  ortho_row_flex: {
    flexDirection: "row",
    gap: "1.5mm",
    marginBottom: "1.5mm"
  },
  ortho_panel: {
    border: "1 solid #c0d1e5",
    borderRadius: 4,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "#fff"
  },
  ortho_header: {
    backgroundColor: "#e8f0fe",
    color: "#0a4a75",
    fontWeight: "bold",
    padding: "1.5mm 2mm",
    fontSize: "8.5pt",
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "1 solid #c0d1e5",
  },
  ortho_content: {
    padding: "2mm",
    color: "#333",
  },
  ortho_field_row: {
    flexDirection: "row",
    marginBottom: "1mm",
    alignItems: "flex-end"
  },
  ortho_label: {
    fontWeight: "bold",
    marginRight: "2mm",
    color: "#0a4a75",
    fontSize: "7.5pt"
  },
  ortho_value: {
    flex: 1,
    borderBottom: "1 solid #c0d1e5",
    minHeight: "4mm",
  },
  ortho_value_short: {
    borderBottom: "1 solid #c0d1e5",
    minHeight: "4mm",
    minWidth: "15mm"
  },
  ortho_checkbox: {
    width: "3mm",
    height: "3mm",
    border: "1 solid #0a4a75",
    marginRight: "1mm",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.5mm"
  },
  ortho_check_item: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: "3mm",
    marginBottom: "1mm"
  },
});

// Helper for clinical findings text
const getClinicalText = (clinical_findings) => {
  if (!clinical_findings) return "";
  const conds = [];
  if (clinical_findings?.patientCondition?.c1) conds.push(clinical_findings.patientCondition.c1);
  if (clinical_findings?.patientCondition?.c2) conds.push(clinical_findings.patientCondition.c2);
  if (clinical_findings?.patientCondition?.c3) conds.push(clinical_findings.patientCondition.c3);
  if (clinical_findings?.patientCondition?.c4) conds.push(clinical_findings.patientCondition.c4);
  return conds.join(", ");
};

// Create Document Component
const MyDocument = ({ header, footer, p_data = {}, dr_data = {}, report = {}, activeTemplate }) => {
  // Resolve layout type
  const templateIdentifier =
    (typeof activeTemplate === "string" ? activeTemplate : activeTemplate?.layoutType || activeTemplate?.name) ||
    dr_data?.prescriptionTemplate ||
    "default";

  const isTemplate1 =
    templateIdentifier === "Template 1: Right-side margin layout" ||
    templateIdentifier === "right-margin" ||
    templateIdentifier === "template1" ||
    activeTemplate?.layoutConfig?.layoutMode === "two-column-right";

  const isTemplate2 =
    templateIdentifier === "Template 2: Left-side margin layout" ||
    templateIdentifier === "left-margin" ||
    templateIdentifier === "two-column" ||
    templateIdentifier === "template2" ||
    activeTemplate?.layoutConfig?.layoutMode === "two-column-left";

  const isTemplate3 =
    templateIdentifier === "Template 3: Orthopedic Layout" ||
    templateIdentifier === "template3" ||
    activeTemplate?.layoutConfig?.layoutMode === "ortho";

  const isDynamicJson = templateIdentifier === "dynamic-json";

  const isTwoColumn = isTemplate1 || isTemplate2;

  // Resolve appointment type flags for checkbox indicators
  const rawApptType = (
    p_data.appointmentType ||
    p_data.type ||
    report?.appointmentType ||
    "OPD"
  ).toString().trim().toLowerCase();

  const isFollowUp = rawApptType.includes("follow");
  const isEmergency = rawApptType === "emergency";
  const isOpd = !isFollowUp && !isEmergency; // Defaults to OPD

  const headerHeight = Number(activeTemplate?.headerHeight) || 38;
  const footerHeight = Number(activeTemplate?.footerHeight) || 14;
  const doctorFullName = dr_data ? `Dr. ${dr_data.firstName || ""} ${dr_data.lastName || ""}`.trim() : "";
  const primaryColor = activeTemplate?.layoutConfig?.primaryColor || "#000";

  // Template customizations: margins, font size, visibility, border
  const topMargin = Number(activeTemplate?.margins?.top) || 0;
  const bottomMargin = Number(activeTemplate?.margins?.bottom) || 0;
  const leftMargin = Number(activeTemplate?.margins?.left) || 0;
  const rightMargin = Number(activeTemplate?.margins?.right) || 0;
  const fontSize = activeTemplate?.fontSize ? `${activeTemplate.fontSize}pt` : "9pt";

  const showVitals = activeTemplate?.visibility?.vitals !== false;
  const showDiagnosis = activeTemplate?.visibility?.diagnosis !== false;
  const showAdvice = activeTemplate?.visibility?.advice !== false;
  const showBorder = activeTemplate?.showBorder !== false;

  // Calculate dynamic frame dimensions to guarantee strictly 1-page PDF
  const availableHeight = 297 - headerHeight - footerHeight - topMargin - bottomMargin - 6;
  const frameHeight = Math.max(160, Math.min(235, availableHeight));
  const frameWidth = isTemplate3
    ? Math.max(150, 202 - leftMargin - rightMargin)
    : Math.max(150, 190 - leftMargin - rightMargin);
  const marginLeft = isTemplate3
    ? Math.max(1, 4 + leftMargin)
    : Math.max(2, 10 + leftMargin);
  const marginTop = Math.max(1, 2 + topMargin);
  const marginBottom = Math.max(2, 16 + bottomMargin);

  // Prepare Medicines and Empty Rows (up to 14 rows total to fill grid)
  const medList = Array.isArray(report?.medicineAdvice)
    ? report.medicineAdvice.filter(m => m && (m.name || m.type || m.dose))
    : [];
  const TOTAL_GRID_ROWS = 14;
  const emptyRowsNeeded = Math.max(0, TOTAL_GRID_ROWS - Math.min(medList.length, 14));

  // Extract Female Patient Obstetric Info & Others Vitals
  const femaleParts = [];
  const g = report?.femaleTests?.Gravida || report?.Gravida;
  const p = report?.femaleTests?.Parity || report?.Parity;
  const lmp = report?.femaleTests?.LMP || report?.LMP;
  const edd = report?.femaleTests?.EDD || report?.EDD;
  const pog = report?.femaleTests?.POG || report?.POG;
  if (g) femaleParts.push(`G:${g}`);
  if (p && p !== "0+0" && p !== "+") femaleParts.push(`P:${p}`);
  if (lmp) femaleParts.push(`LMP:${formatDate(lmp)}`);
  if (pog) femaleParts.push(`POG:${pog}`);
  if (edd) femaleParts.push(`EDD:${formatDate(edd)}`);
  const femaleStr = femaleParts.join(" ");
  const othersText = [femaleStr, report?.diagnosys?.Others].filter(Boolean).join(" | ");

  const renderDoctorCredentials = (align = "center") => {
    const isRight = align === "flex-end" || align === "right";
    const hasSign = Boolean(dr_data?.signImage);
    const hasStamp = Boolean(dr_data?.stampImage);

    return (
      <View style={{ alignItems: isRight ? "flex-end" : "center", display: "flex", flexDirection: "column" }}>
        {(hasSign || hasStamp) ? (
          <View style={{ flexDirection: "row", gap: "2mm", marginBottom: "1mm", justifyContent: isRight ? "flex-end" : "center", alignItems: "center" }}>
            {hasSign && (
              <Image
                src={dr_data.signImage.startsWith("data:") ? dr_data.signImage : getFullImageUrl(dr_data.signImage)}
                style={{ height: "14mm", maxHeight: "14mm", objectFit: "contain" }}
              />
            )}
            {hasStamp && (
              <Image
                src={dr_data.stampImage.startsWith("data:") ? dr_data.stampImage : getFullImageUrl(dr_data.stampImage)}
                style={{ height: "20mm", maxHeight: "20mm", objectFit: "contain" }}
              />
            )}
          </View>
        ) : null}
        <Text style={styles.doctor_sign}>{doctorFullName}</Text>
        {dr_data?.qualifications && (
          <Text style={{ fontSize: "8pt", color: "#333", marginTop: "1mm", textAlign: isRight ? "right" : "center" }}>
            {dr_data.qualifications}
          </Text>
        )}
        {dr_data?.doctorDepartment && (
          <Text style={{ fontSize: "7pt", color: "#666", marginTop: "0.5mm", textAlign: isRight ? "right" : "center" }}>
            {dr_data.doctorDepartment}
          </Text>
        )}
      </View>
    );
  };

  // Render Sidebar / Margin Component (Vitals, Investigations, Provisional Diagnosis)
  const renderMarginContent = (isRightSide) => (
    <View style={[
      styles.margin_col,
      isRightSide ? {} : { borderRight: "1 solid #000" }
    ]}>
      {/* VITALS */}
      {showVitals && (
        <View style={styles.sidebar_section}>
          <Text style={styles.sidebar_title}>VITALS</Text>
          {report?.diagnosys?.BP && <Text style={styles.sidebar_item}>BP: {report.diagnosys.BP} mm of Hg</Text>}
          {report?.diagnosys?.PR && <Text style={styles.sidebar_item}>PR: {report.diagnosys.PR} bpm</Text>}
          {report?.diagnosys?.SPO2 && <Text style={styles.sidebar_item}>SPO2: {report.diagnosys.SPO2}% in RA</Text>}
          {report?.diagnosys?.Temp && <Text style={styles.sidebar_item}>Temp: {report.diagnosys.Temp}°F</Text>}
          {report?.diagnosys?.Others && <Text style={styles.sidebar_item}>Others: {report.diagnosys.Others}</Text>}
        </View>
      )}

      {/* INVESTIGATIONS */}
      {report?.advice?.testAdvice?.length > 0 && (
        <View style={styles.sidebar_section}>
          <Text style={styles.sidebar_title}>INVESTIGATIONS</Text>
          {report.advice.testAdvice.map((t, idx) => (
            <Text key={idx} style={styles.sidebar_item}>{t.testName}</Text>
          ))}
        </View>
      )}

      {/* AVAILABLE TEST REPORTS */}
      {(report?.pathologyReport || report?.radiologyReport || report?.availableReports?.pathology || report?.availableReports?.radiology) && (
        <View style={styles.sidebar_section}>
          <Text style={styles.sidebar_title}>AVAILABLE TEST REPORTS</Text>
          {(report?.pathologyReport || report?.availableReports?.pathology) && (
            <Text style={styles.sidebar_item}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Pathology: </Text>
              {cleanTrailingComma(report?.pathologyReport || report?.availableReports?.pathology)}
            </Text>
          )}
          {(report?.radiologyReport || report?.availableReports?.radiology) && (
            <Text style={styles.sidebar_item}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Radiology: </Text>
              {cleanTrailingComma(report?.radiologyReport || report?.availableReports?.radiology)}
            </Text>
          )}
        </View>
      )}

      {/* PROVISIONAL DIAGNOSIS */}
      {showDiagnosis && (
        <View style={styles.sidebar_section}>
          <Text style={styles.sidebar_title}>
            {report?.diagnosys_heading ? report.diagnosys_heading.toUpperCase() : "PROVISIONAL DIAGNOSIS"}
          </Text>
          <Text style={styles.sidebar_item}>
            {cleanTrailingComma(report?.initialComplain)}
          </Text>
        </View>
      )}

      {/* If Template 1 (Right-side margin), Dr Signature sits at bottom of this margin column */}
      {isRightSide && (
        <View style={{ marginTop: "auto", textAlign: "right", paddingRight: "2mm", paddingBottom: "2mm" }}>
          {renderDoctorCredentials()}
        </View>
      )}
    </View>
  );

  // Render Rx Table + Bottom Advice Component
  const renderRxContent = (isRightSide) => (
    <View style={[
      styles.rx_col,
      isRightSide ? {} : { borderRight: "1 solid #000" }
    ]}>
      {/* Table Section */}
      <View style={{ flex: 1 }}>
        {/* Table Header */}
        <View style={styles.table_header}>
          <Text style={[styles.cell_sn, styles.cell_border]}>SN</Text>
          <Text style={[styles.cell_type, styles.cell_border]}>Type</Text>
          <Text style={[styles.cell_med, styles.cell_border]}>Medicine</Text>
          <Text style={[styles.cell_dose, styles.cell_border]}>Dose</Text>
          <Text style={[styles.cell_route, styles.cell_border]}>Route</Text>
          <Text style={[styles.cell_freq, styles.cell_border]}>Frequency</Text>
          <Text style={styles.cell_dur}>Duration</Text>
        </View>

        {/* Medicine Rows */}
        {medList.slice(0, 14).map((med, index) => (
          <View key={index} style={styles.table_row}>
            <Text style={[styles.cell_sn, styles.cell_border_light]}>{index + 1}</Text>
            <Text style={[styles.cell_type, styles.cell_border_light]}>{med.type || ""}</Text>
            <Text style={[styles.cell_med, styles.cell_border_light]}>{med.name || ""}</Text>
            <Text style={[styles.cell_dose, styles.cell_border_light]}>{med.dose || ""}</Text>
            <Text style={[styles.cell_route, styles.cell_border_light]}>{med.route || ""}</Text>
            <Text style={[styles.cell_freq, styles.cell_border_light]}>{med.frequency || ""}</Text>
            <Text style={styles.cell_dur}>{med.duration || ""}</Text>
          </View>
        ))}

        {/* Advice Right after Medicines */}
        {showAdvice && report?.additionalAdvice && (
          <View style={{ padding: "2mm", borderBottom: "1 solid #e0e0e0" }}>
            <Text style={styles.heading}>Advice: </Text>
            <Text style={{ marginTop: "1mm", fontSize: "9pt" }}>{report.additionalAdvice}</Text>
          </View>
        )}

        {/* Empty rows to maintain table structure and vertical grid lines */}
        {Array.from({ length: emptyRowsNeeded }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.table_row_empty}>
            <Text style={[styles.cell_sn, styles.cell_border_light]}> </Text>
            <Text style={[styles.cell_type, styles.cell_border_light]}> </Text>
            <Text style={[styles.cell_med, styles.cell_border_light]}> </Text>
            <Text style={[styles.cell_dose, styles.cell_border_light]}> </Text>
            <Text style={[styles.cell_route, styles.cell_border_light]}> </Text>
            <Text style={[styles.cell_freq, styles.cell_border_light]}> </Text>
            <Text style={styles.cell_dur}> </Text>
          </View>
        ))}
      </View>

      {/* Bottom of Rx Column */}
      {isTemplate1 ? (
        // Template 1: Advice & Follow-up in Rx column (Doctor Name is on the right in Margin col)
        <View style={styles.rx_bottom_box}>
          {report?.followUp && (
            <View style={styles.heading_values}>
              <Text style={styles.heading}>Follow-up Date: </Text>
              <Text>{formatDate(report.followUp)}</Text>
            </View>
          )}
        </View>
      ) : (
        // Template 2: Advice & Follow-up on left, Doctor Name on right
        <View style={[styles.rx_bottom_box, { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }]}>
          <View style={{ flex: 1 }}>
            {report?.followUp && (
              <View style={styles.heading_values}>
                <Text style={styles.heading}>Follow-up Date: </Text>
                <Text>{formatDate(report.followUp)}</Text>
              </View>
            )}
          </View>
          <View style={{ textAlign: "right", paddingRight: "2mm" }}>
            {renderDoctorCredentials()}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={[styles.header_section, { maxHeight: `${headerHeight}mm` }]} fixed>
          <Image style={styles.header_image} src={header || "/Header.jpeg"} />
        </View>

        {isDynamicJson ? (
          <DynamicTemplate
            layoutConfig={activeTemplate?.layoutConfig || []}
            dataContext={{ p_data, report, doctorFullName, dr_data }}
            styles={styles}
          />
        ) : isTemplate3 ? (
          /* =========================================================================
             TEMPLATE 3 (ORTHOPEDIC LAYOUT)
             ========================================================================= */
          <View style={[
            styles.ortho_frame,
            {
              border: showBorder ? "1 solid #c0d1e5" : "none",
              width: `${frameWidth}mm`,
              height: "238mm",
              justifyContent: "space-between",
              marginLeft: `${marginLeft}mm`,
              marginRight: `${marginLeft}mm`,
              marginTop: `${marginTop}mm`,
              marginBottom: `${marginBottom}mm`,
              fontSize: fontSize,
            }
          ]}>
            {/* ROW 1 */}
            <View style={styles.ortho_row_flex}>
              {/* Patient Box */}
              <View style={[styles.ortho_panel, { flex: 1.5 }]}>
                <View style={styles.ortho_header}>
                  <IconUser />
                  <Text>Patient Details</Text>
                </View>
                <View style={styles.ortho_content}>
                  <View style={styles.ortho_field_row}>
                    <Text style={styles.ortho_label}>Name:</Text>
                    <Text style={styles.ortho_value}>{p_data.name || `${p_data.firstName || ''} ${p_data.lastName || ''}`.trim()}</Text>
                  </View>
                  <View style={styles.ortho_field_row}>
                    <Text style={styles.ortho_label}>Age / Sex:</Text>
                    <Text style={styles.ortho_value}>{p_data.dob ? dobToAge(p_data.dob) : p_data.age ? `${p_data.age} yrs` : ""} / {p_data.gender}</Text>
                  </View>
                  <View style={styles.ortho_field_row}>
                    <Text style={styles.ortho_label}>UHID / Reg. No.:</Text>
                    <Text style={styles.ortho_value}>{p_data.nic || (p_data._id ? String(p_data._id).slice(-6).toUpperCase() : '')}</Text>
                  </View>
                  <View style={styles.ortho_field_row}>
                    <Text style={styles.ortho_label}>Contact No.:</Text>
                    <Text style={styles.ortho_value}>{p_data.phone}</Text>
                  </View>
                  <View style={styles.ortho_field_row}>
                    <Text style={styles.ortho_label}>Address:</Text>
                    <Text style={styles.ortho_value}>{p_data.address || report?.address || ""}</Text>
                  </View>
                </View>
              </View>

              {/* Date & Vitals Column */}
              <View style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5mm" }}>
                {/* Date Box */}
                <View style={[styles.ortho_panel, { flex: 1 }]}>
                  <View style={[styles.ortho_content, { padding: "1.5mm" }]}>
                    <View style={styles.ortho_field_row}>
                      <Text style={styles.ortho_label}>Date:</Text>
                      <Text style={styles.ortho_value}>{formatDate(report?.createdAt || p_data.updatedAt)}</Text>
                    </View>
                    <View style={styles.ortho_field_row}>
                      <Text style={styles.ortho_label}>Prescription No.:</Text>
                      <Text style={styles.ortho_value}></Text>
                    </View>
                    <View style={[styles.ortho_field_row, { marginTop: "2mm", justifyContent: "space-between" }]}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={styles.ortho_checkbox}>{isOpd && <IconCheck />}</View>
                        <Text>OPD</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={styles.ortho_checkbox}>{isFollowUp && <IconCheck />}</View>
                        <Text>Follow-up</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={styles.ortho_checkbox}>{isEmergency && <IconCheck />}</View>
                        <Text>Emergency</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Vitals Box */}
                <View style={[styles.ortho_panel, { flex: 1.1 }]}>
                  <View style={[styles.ortho_header, { padding: "1mm 2mm" }]}>
                    <IconHeart />
                    <Text>Vitals</Text>
                  </View>
                  <View style={[styles.ortho_content, { padding: "1.5mm 2mm" }]}>
                    {/* Row 1: BP & PR */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: "1mm" }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-end", flex: 1 }}>
                        <Text style={styles.ortho_label}>BP:</Text>
                        <Text style={styles.ortho_value}>{report?.diagnosys?.BP || ""}</Text>
                        <Text style={{ marginLeft: "1mm", color: "#666", fontSize: "6.5pt" }}>mm of Hg</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "flex-end", flex: 1, marginLeft: "2mm" }}>
                        <Text style={styles.ortho_label}>PR:</Text>
                        <Text style={styles.ortho_value}>{report?.diagnosys?.PR || ""}</Text>
                        <Text style={{ marginLeft: "1mm", color: "#666", fontSize: "6.5pt" }}>bpm</Text>
                      </View>
                    </View>

                    {/* Row 2: SPO2 & Temp */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: "1mm" }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-end", flex: 1 }}>
                        <Text style={styles.ortho_label}>SPO2:</Text>
                        <Text style={styles.ortho_value}>{report?.diagnosys?.SPO2 || ""}</Text>
                        <Text style={{ marginLeft: "1mm", color: "#666", fontSize: "6.5pt" }}>% in RA</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "flex-end", flex: 1, marginLeft: "2mm" }}>
                        <Text style={styles.ortho_label}>Temp:</Text>
                        <Text style={styles.ortho_value}>{report?.diagnosys?.Temp || ""}</Text>
                        <Text style={{ marginLeft: "1mm", color: "#666", fontSize: "6.5pt" }}>°F</Text>
                      </View>
                    </View>

                    {/* Row 3: BMI & Others (with female patient obstetric details) */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-end", flex: 1 }}>
                        <Text style={styles.ortho_label}>BMI:</Text>
                        <Text style={styles.ortho_value}>{report?.diagnosys?.BMI || ""}</Text>
                        <Text style={{ marginLeft: "1mm", color: "#666", fontSize: "6.5pt" }}>kg/m²</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "flex-end", flex: 1.2, marginLeft: "2mm" }}>
                        <Text style={styles.ortho_label}>Others:</Text>
                        <Text style={[styles.ortho_value, { fontSize: "6.5pt" }]}>{othersText}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* ROW 2 */}
            <View style={styles.ortho_row_flex}>
              <View style={[styles.ortho_panel, { flex: 1 }]}>
                <View style={styles.ortho_header}>
                  <IconClipboard />
                  <Text>Chief Complaints (max 2-3)</Text>
                </View>
                <View style={[styles.ortho_content, { minHeight: "12mm" }]}>
                  <Text>{cleanTrailingComma(report?.presentingComplaints)}</Text>
                </View>
              </View>
              <View style={[styles.ortho_panel, { flex: 2 }]}>
                <View style={styles.ortho_header}>
                  <IconHistory />
                  <Text>Medical History</Text>
                </View>
                <View style={[styles.ortho_content, { minHeight: "12mm" }]}>
                  <Text>{cleanTrailingComma(report?.medicalHistory)}</Text>
                </View>
              </View>
            </View>

            {/* ROW 3 */}
            <View style={styles.ortho_row_flex}>
              <View style={[styles.ortho_panel, { flex: 1 }]}>
                <View style={styles.ortho_header}>
                  <IconStethoscope />
                  <Text>On Examination</Text>
                </View>
                <View style={[styles.ortho_content, { minHeight: "16mm" }]}>
                  <Text>{getClinicalText(report?.clinical_findings)}</Text>
                </View>
              </View>
              <View style={[styles.ortho_panel, { flex: 1 }]}>
                <View style={styles.ortho_header}>
                  <IconLab />
                  <Text>Laboratory Findings (if available)</Text>
                </View>
                <View style={[styles.ortho_content, { minHeight: "16mm" }]}>
                  <Text>{cleanTrailingComma(report?.pathologyReport || report?.pathologicalReport || report?.availableReports?.pathology)}</Text>
                </View>
              </View>
              <View style={[styles.ortho_panel, { flex: 1 }]}>
                <View style={styles.ortho_header}>
                  <IconRadiology />
                  <Text>Radiological Findings (if available)</Text>
                </View>
                <View style={[styles.ortho_content, { minHeight: "16mm" }]}>
                  <Text>{cleanTrailingComma(report?.radiologyReport || report?.radiologicalReport || report?.availableReports?.radiology)}</Text>
                </View>
              </View>
            </View>

            {/* ROW 4 */}
            <View style={[styles.ortho_panel, { marginBottom: "1.5mm" }]}>
              <View style={styles.ortho_header}>
                <IconTarget />
                <Text>Provisional / Working Diagnosis</Text>
              </View>
              <View style={[styles.ortho_content, { minHeight: "9mm" }]}>
                <Text>{cleanTrailingComma(report?.initialComplain)}</Text>
              </View>
            </View>

            {/* ROW 5 (Rx) */}
            <View style={[styles.ortho_panel, { minHeight: "52mm", flex: 1, marginBottom: "1.5mm" }]}>
              <View style={[styles.ortho_header, { backgroundColor: "#e2ffe2", color: "#166534", justifyContent: "center" }]}>
                <Text>Rx MEDICATIONS</Text>
              </View>
              <View style={[styles.table_header, { backgroundColor: "#f9f9f9", borderTop: "none" }]}>
                <Text style={[styles.ortho_cell_sn, styles.cell_border]}>Sl.</Text>
                <Text style={[styles.ortho_cell_med, styles.cell_border]}>Medicine</Text>
                <Text style={[styles.ortho_cell_type, styles.cell_border]}>Type</Text>
                <Text style={[styles.ortho_cell_dose, styles.cell_border]}>Dose & Route</Text>
                <Text style={[styles.ortho_cell_freq, styles.cell_border]}>Frequency</Text>
                <Text style={[styles.ortho_cell_dur, styles.cell_border]}>Duration</Text>
                <Text style={styles.ortho_cell_inst}>Instructions</Text>
              </View>
              {medList.slice(0, 8).map((med, index) => (
                <View key={index} style={styles.table_row}>
                  <Text style={[styles.ortho_cell_sn, styles.cell_border_light]}>{index + 1}</Text>
                  <Text style={[styles.ortho_cell_med, styles.cell_border_light]}>{med.name || ""}</Text>
                  <Text style={[styles.ortho_cell_type, styles.cell_border_light]}>{med.type || ""}</Text>
                  <Text style={[styles.ortho_cell_dose, styles.cell_border_light]}>{med.dose ? `${med.dose} ${med.route || ""}` : med.route || ""}</Text>
                  <Text style={[styles.ortho_cell_freq, styles.cell_border_light]}>{med.frequency || ""}</Text>
                  <Text style={[styles.ortho_cell_dur, styles.cell_border_light]}>{med.duration || ""}</Text>
                  <Text style={styles.ortho_cell_inst}>{med.instruction || med.instructions || med.notes || ""}</Text>
                </View>
              ))}
              {Array.from({ length: Math.max(0, 8 - medList.length) }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.table_row_empty}>
                  <Text style={[styles.ortho_cell_sn, styles.cell_border_light]}> </Text>
                  <Text style={[styles.ortho_cell_med, styles.cell_border_light]}> </Text>
                  <Text style={[styles.ortho_cell_type, styles.cell_border_light]}> </Text>
                  <Text style={[styles.ortho_cell_dose, styles.cell_border_light]}> </Text>
                  <Text style={[styles.ortho_cell_freq, styles.cell_border_light]}> </Text>
                  <Text style={[styles.ortho_cell_dur, styles.cell_border_light]}> </Text>
                  <Text style={styles.ortho_cell_inst}> </Text>
                </View>
              ))}
            </View>

            {/* ROW 6 */}
            <View style={styles.ortho_row_flex}>
              <View style={[styles.ortho_panel, { flex: 1 }]}>
                <View style={styles.ortho_header}>
                  <IconSearch />
                  <Text>Further Investigations Required</Text>
                </View>
                <View style={[styles.ortho_content, { minHeight: "14mm" }]}>
                  {report?.advice?.testAdvice?.length > 0 ? (
                    report.advice.testAdvice.map((t, idx) => (
                      <Text key={idx} style={{ fontSize: "7.5pt", color: "#333", marginBottom: "1mm" }}>- {t.testName}</Text>
                    ))
                  ) : null}
                </View>
              </View>
              <View style={[styles.ortho_panel, { flex: 1 }]}>
                <View style={styles.ortho_header}>
                  <IconAdvice />
                  <Text>Advice</Text>
                </View>
                <View style={[styles.ortho_content, { minHeight: "14mm" }]}>
                  <Text>{report?.additionalAdvice}</Text>
                </View>
              </View>
            </View>

            {/* ROW 7 */}
            <View style={[styles.ortho_row_flex, { alignItems: "center", justifyContent: "space-between", marginBottom: 0 }]}>
              <View style={[styles.ortho_panel, { width: "50%" }]}>
                <View style={styles.ortho_header}>
                  <IconCalendar />
                  <Text>Follow Up</Text>
                </View>
                <View style={[styles.ortho_content, { minHeight: "10mm", justifyContent: "center" }]}>
                  {report?.followUp ? (
                    <View style={styles.ortho_field_row}>
                      <Text style={styles.ortho_label}>Review after:</Text>
                      <Text style={{ fontWeight: "bold" }}>{formatDate(report.followUp)}</Text>
                    </View>
                  ) : (
                    <View style={styles.ortho_field_row}>
                      <Text style={styles.ortho_label}>Review after:</Text>
                      <Text style={styles.ortho_value_short}></Text>
                      <Text> Days / Weeks</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Doctor Signature, Stamp & Details (outside of all panels) */}
              <View style={{ width: "48%", alignItems: "flex-end", justifyContent: "flex-end", paddingRight: "4mm", paddingBottom: "2mm" }}>
                {renderDoctorCredentials("flex-end")}
              </View>
            </View>

          </View>
        ) : isTwoColumn ? (
          /* =========================================================================
             TEMPLATE 1 & TEMPLATE 2 (TWO-COLUMN MARGIN LAYOUTS)
             ========================================================================= */
          <View style={[
            styles.two_col_frame,
            {
              border: showBorder ? "1 solid #000" : "none",
              width: `${frameWidth}mm`,
              height: `${frameHeight}mm`,
              marginLeft: `${marginLeft}mm`,
              marginRight: `${marginLeft}mm`,
              marginTop: `${marginTop}mm`,
              marginBottom: `${marginBottom}mm`,
              fontSize: fontSize,
            }
          ]}>
            {/* Upper Box: Patient Details + Date/BMI/Weight */}
            <View style={[styles.upper_box, { padding: "2mm" }]}>
              <View style={styles.upper_left}>
                <View style={styles.personal_details}>
                  <Text style={styles.heading}>{p_data.name || `${p_data.firstName || ''} ${p_data.lastName || ''}`.trim()},</Text>
                  <Text>{p_data.gender},</Text>
                  <Text>
                    {p_data.dob
                      ? dobToAge(p_data.dob)
                      : p_data.age
                        ? `${p_data.age} years`
                        : ""}
                  </Text>
                  {p_data.phone && <Text>, +91{p_data.phone}</Text>}
                  {(p_data.address || report?.address) && <Text>, {p_data.address || report?.address}</Text>}
                </View>
                <View style={styles.heading_values}>
                  <Text style={styles.heading}>ID:</Text>
                  <Text>{p_data.appointmentId || p_data.nic || p_data._id}</Text>
                </View>
              </View>
              <View style={styles.upper_right}>
                <View style={styles.heading_values}>
                  <Text style={styles.heading}>Date:</Text>
                  <Text>{formatDate(report?.createdAt || p_data.updatedAt)}</Text>
                </View>
                {report?.diagnosys?.BMI && (
                  <View style={styles.heading_values}>
                    <Text style={styles.heading}>BMI:</Text>
                    <Text>{report.diagnosys.BMI} kg/m²</Text>
                  </View>
                )}
                {report?.diagnosys?.Weight && (
                  <View style={styles.heading_values}>
                    <Text style={styles.heading}>Weight:</Text>
                    <Text>{report.diagnosys.Weight} kg</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Complaints & Examination Strip */}
            <View style={styles.complaints_box}>
              {report?.presentingComplaints && (
                <View style={styles.heading_values}>
                  <Text style={styles.heading}>Presenting Complaints:</Text>
                  <Text>{cleanTrailingComma(report.presentingComplaints)}</Text>
                </View>
              )}
              <View style={styles.heading_values}>
                <Text style={styles.heading}>On Examination:</Text>
                <Text>
                  Patient is {getClinicalText(report?.clinical_findings) || "stable"}
                </Text>
              </View>
            </View>

            {/* Main Body: Two Columns */}
            <View style={styles.two_col_body}>
              {isTemplate1 ? (
                <>
                  {/* Template 1: Rx on Left, Margin on Right */}
                  {renderRxContent(false)}
                  {renderMarginContent(true)}
                </>
              ) : (
                <>
                  {/* Template 2: Margin on Left, Rx on Right */}
                  {renderMarginContent(false)}
                  {renderRxContent(true)}
                </>
              )}
            </View>
          </View>
        ) : (
          /* =========================================================================
             DEFAULT LAYOUT (ORIGINAL SINGLE COLUMN)
             ========================================================================= */
          <>
            <View style={[
              styles.main_section,
              {
                border: showBorder ? "1 solid #000" : "none",
                width: `${frameWidth}mm`,
                height: `${frameHeight}mm`,
                marginLeft: `${marginLeft}mm`,
                marginRight: `${marginLeft}mm`,
                marginTop: `${marginTop}mm`,
                fontSize: fontSize,
              }
            ]}>
              <View style={styles.upper_box}>
                <View style={styles.upper_left}>
                  <View style={styles.personal_details}>
                    <Text style={styles.heading}>{p_data.name || `${p_data.firstName || ''} ${p_data.lastName || ''}`.trim()},</Text>
                    <Text>{p_data.gender},</Text>
                    <Text>
                      {p_data.dob
                        ? dobToAge(p_data.dob)
                        : p_data.age
                          ? `${p_data.age} years`
                          : ""}
                    </Text>
                    {p_data.phone && <Text>,+91{p_data.phone}</Text>}
                    {(p_data.address || report?.address) && <Text>, {p_data.address || report?.address}</Text>}
                  </View>
                  <View style={styles.heading_values}>
                    <Text style={styles.heading}>ID:</Text>
                    <Text>{p_data.nic || (p_data._id ? String(p_data._id).slice(-6).toUpperCase() : '')}</Text>
                  </View>
                </View>
                <View style={styles.upper_right}>
                  <View style={styles.heading_values}>
                    <Text style={styles.heading}>Date:</Text>
                    <Text>{formatDate(report?.createdAt || p_data.updatedAt)}</Text>
                  </View>
                  {report?.diagnosys?.BMI && (
                    <View style={styles.heading_values}>
                      <Text style={styles.heading}>BMI:</Text>
                      <Text>{report.diagnosys.BMI} kg/m²</Text>
                    </View>
                  )}
                  {report?.diagnosys?.Weight && (
                    <View style={styles.heading_values}>
                      <Text style={styles.heading}>Weight:</Text>
                      <Text>{report.diagnosys.Weight} kg</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.pData}>
                <View style={styles.gravida_vitals}>
                  {report?.Gravida && (
                    <View style={styles.gravida_section}>
                      <View style={styles.heading_values}>
                        <Text style={styles.heading}>G</Text>
                        <Text>{report.Gravida}</Text>
                        <Text style={styles.heading}>P</Text>
                        <Text>{report.Parity}</Text>
                      </View>
                      {report?.LMP && (
                        <View style={styles.heading_values}>
                          <Text style={styles.heading}>LMP:</Text>
                          <Text>{formatDate(report.LMP)}</Text>
                        </View>
                      )}
                      {report?.EDD && (
                        <View style={styles.heading_values}>
                          <Text style={styles.heading}>EDD:</Text>
                          <Text>{formatDate(report.EDD)}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.vitals_section}>
                    {report?.diagnosys?.BP && (
                      <View style={styles.heading_values}>
                        <Text style={styles.heading}>BP:</Text>
                        <Text>{report.diagnosys.BP} mm of Hg</Text>
                      </View>
                    )}
                    {report?.diagnosys?.PR && (
                      <View style={styles.heading_values}>
                        <Text style={styles.heading}>PR:</Text>
                        <Text>{report.diagnosys.PR} bpm</Text>
                      </View>
                    )}
                    {report?.diagnosys?.SPO2 && (
                      <View style={styles.heading_values}>
                        <Text style={styles.heading}>SPO2:</Text>
                        <Text>{report.diagnosys.SPO2}% in RA</Text>
                      </View>
                    )}
                    {report?.diagnosys?.Temp && (
                      <View style={styles.heading_values}>
                        <Text style={styles.heading}>Temp:</Text>
                        <Text>{report.diagnosys.Temp}°F</Text>
                      </View>
                    )}
                    {report?.diagnosys?.Others && (
                      <View style={styles.heading_values}>
                        <Text style={styles.heading}>Others:</Text>
                        <Text>{report.diagnosys.Others}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {report?.presentingComplaints && (
                  <View style={[styles.heading_values, { marginBottom: "2mm" }]}>
                    <Text style={styles.heading}>Presenting Complaints:</Text>
                    <Text>{cleanTrailingComma(report.presentingComplaints)}</Text>
                  </View>
                )}

                {report?.medicalHistory && (
                  <View style={[styles.heading_values, { marginBottom: "2mm" }]}>
                    <Text style={styles.heading}>Medical History:</Text>
                    <Text>{cleanTrailingComma(report.medicalHistory)}</Text>
                  </View>
                )}

                {report?.clinical_findings && (
                  <View style={{ marginBottom: "2mm" }}>
                    <View style={styles.heading_values}>
                      <Text style={styles.heading}>On Examination:</Text>
                      <Text>
                        Patient is {getClinicalText(report?.clinical_findings)}
                      </Text>
                    </View>
                  </View>
                )}

                {report?.advice?.testAdvice?.length > 0 && (
                  <View style={[styles.heading_values, { marginBottom: "2mm", flexWrap: "wrap" }]}>
                    <Text style={styles.heading}>Investigations:</Text>
                    {report.advice.testAdvice.map((t, i) => (
                      <Text key={i}>
                        {t.testName}
                        {report.advice.testAdvice.length - 1 !== i && ", "}
                      </Text>
                    ))}
                  </View>
                )}

                {(report?.pathologyReport || report?.radiologyReport || report?.availableReports?.pathology || report?.availableReports?.radiology) && (
                  <View style={[styles.heading_values, { marginBottom: "2mm", flexWrap: "wrap" }]}>
                    <Text style={styles.heading}>Available Reports:</Text>
                    {[
                      (report?.pathologyReport || report?.availableReports?.pathology) && `Pathology: ${cleanTrailingComma(report?.pathologyReport || report?.availableReports?.pathology)}`,
                      (report?.radiologyReport || report?.availableReports?.radiology) && `Radiology: ${cleanTrailingComma(report?.radiologyReport || report?.availableReports?.radiology)}`,
                    ].filter(Boolean).map((text, i, arr) => (
                      <Text key={i}>{text}{i < arr.length - 1 ? " | " : ""}</Text>
                    ))}
                  </View>
                )}

                <View style={styles.heading_values}>
                  <Text style={styles.heading}>
                    {report?.diagnosys_heading ? report.diagnosys_heading : "Provisional Diagnosis"}:
                  </Text>
                  <Text>{cleanTrailingComma(report?.initialComplain)}</Text>
                </View>
              </View>

              <Image style={styles.rxLogo} src="/Rx_logo.png" />
              <View style={styles.med_advice}>
                <View style={styles.medic_header}>
                  <Text style={{ width: "6%" }}>SN</Text>
                  <Text style={{ width: "10%" }}>Type</Text>
                  <Text style={{ width: "34%" }}>Medicine</Text>
                  <Text style={{ width: "10%" }}>Dose</Text>
                  <Text style={{ width: "15%" }}>Route</Text>
                  <Text style={{ width: "15%" }}>Frequency</Text>
                  <Text style={{ width: "10%" }}>Duration</Text>
                </View>
                {medList.map((med, index) => (
                  index < 15 && (
                    <View key={index} style={styles.medic_row}>
                      <Text style={{ width: "6%" }}>{index + 1}</Text>
                      <Text style={{ width: "10%" }}>{med.type}</Text>
                      <Text style={{ width: "34%" }}>{med.name}</Text>
                      <Text style={{ width: "10%" }}>{med.dose}</Text>
                      <Text style={{ width: "15%" }}>{med.route}</Text>
                      <Text style={{ width: "15%" }}>{med.frequency}</Text>
                      <Text style={{ width: "10%" }}>{med.duration}</Text>
                    </View>
                  )
                ))}

                {report?.additionalAdvice && (
                  <View style={{ padding: "2mm", borderTop: "1 solid #000" }}>
                    <Text style={styles.heading}>Advice:</Text>
                    <Text style={{ marginTop: "1mm", fontSize: "9pt" }}>{report.additionalAdvice}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.seal} fixed>
              <View style={styles.seal_left}>
                {report?.followUp && (
                  <View style={styles.heading_values}>
                    <Text style={styles.heading}>Follow-up Date:</Text>
                    <Text>{formatDate(report.followUp)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.seal_right}>
                {renderDoctorCredentials()}
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={[styles.footer_section, { maxHeight: `${footerHeight}mm` }]} fixed>
          <Image style={styles.footer_image} src={footer || "/G.Jakaria_footer1.png"} />
        </View>
      </Page>
    </Document>
  );
};

export default MyDocument;
