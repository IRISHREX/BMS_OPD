import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { dobToAge } from "../utils/ageUtils";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB") : ""; // dd/mm/yyyy

const cleanTrailingComma = (val) => {
  if (!val) return "";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  const trimmed = String(val).trim();
  return trimmed.endsWith(",") ? trimmed.slice(0, -1) : trimmed;
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
    maxHeight: "50mm",
    width: "210mm",
  },
  header_image: {
    width: "100%",
  },
  footer_section: {
    margin: "0mm",
    padding: "0mm",
    maxHeight: "15mm",
    width: "210mm",
    position: "absolute",
    bottom: "0mm",
  },
  footer_image: {
    width: "100%",
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
  bottom_label: {
    position: "absolute",
    bottom: "1mm",
    width: "210mm",
    textAlign: "center",
    fontSize: "7pt",
    color: "#666",
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

  const isTwoColumn = isTemplate1 || isTemplate2;

  const headerHeight = Number(activeTemplate?.headerHeight) || 50;
  const footerHeight = Number(activeTemplate?.footerHeight) || 15;
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
  const frameWidth = Math.max(150, 190 - leftMargin - rightMargin);
  const marginLeft = Math.max(2, 10 + leftMargin);
  const marginTop = Math.max(1, 2 + topMargin);
  const marginBottom = Math.max(2, 16 + bottomMargin);

  // Prepare Medicines and Empty Rows (up to 14 rows total to fill grid)
  const medList = Array.isArray(report?.medicineAdvice)
    ? report.medicineAdvice.filter(m => m && (m.name || m.type || m.dose))
    : [];
  const TOTAL_GRID_ROWS = 14;
  const emptyRowsNeeded = Math.max(0, TOTAL_GRID_ROWS - Math.min(medList.length, 14));

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
          <Text style={styles.doctor_sign}>{doctorFullName}</Text>
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
          {showAdvice && report?.additionalAdvice && (
            <View style={styles.heading_values}>
              <Text style={styles.heading}>Advice: </Text>
              <Text>{report.additionalAdvice}</Text>
            </View>
          )}
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
            {showAdvice && report?.additionalAdvice && (
              <View style={styles.heading_values}>
                <Text style={styles.heading}>Advice: </Text>
                <Text>{report.additionalAdvice}</Text>
              </View>
            )}
            {report?.followUp && (
              <View style={styles.heading_values}>
                <Text style={styles.heading}>Follow-up Date: </Text>
                <Text>{formatDate(report.followUp)}</Text>
              </View>
            )}
          </View>
          <View style={{ textAlign: "right", paddingRight: "2mm" }}>
            <Text style={styles.doctor_sign}>{doctorFullName}</Text>
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
          <Image style={styles.header_image} src={header || "/G.Jakaria_header.png"} />
        </View>

        {isTwoColumn ? (
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
                  <Text style={styles.heading}>{p_data.name},</Text>
                  <Text>{p_data.gender},</Text>
                  <Text>
                    {p_data.dob
                      ? dobToAge(p_data.dob)
                      : p_data.age
                      ? `${p_data.age} years`
                      : ""}
                  </Text>
                  {p_data.phone && <Text>, +91{p_data.phone}</Text>}
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
                    <Text style={styles.heading}>{p_data.name},</Text>
                    <Text>{p_data.gender},</Text>
                    <Text>
                      {p_data.dob
                        ? dobToAge(p_data.dob)
                        : p_data.age
                        ? `${p_data.age} years`
                        : ""}
                    </Text>
                    {p_data.phone && <Text>,+91{p_data.phone}</Text>}
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
              </View>
            </View>

            <View style={styles.seal} fixed>
              <View style={styles.seal_left}>
                {report?.additionalAdvice && (
                  <View style={styles.heading_values}>
                    <Text style={styles.heading}>Advice:</Text>
                    <Text>{report.additionalAdvice}</Text>
                  </View>
                )}
                {report?.followUp && (
                  <View style={styles.heading_values}>
                    <Text style={styles.heading}>Follow-up Date:</Text>
                    <Text>{formatDate(report.followUp)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.seal_right}>
                <Text style={styles.heading}>{doctorFullName}</Text>
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={[styles.footer_section, { maxHeight: `${footerHeight}mm` }]} fixed>
          <Image style={styles.footer_image} src={footer || "/G.Jakaria_footer1.png"} />
        </View>

        {/* Template label at bottom if Template 1 or 2 */}
        {isTemplate1 && (
          <Text style={styles.bottom_label}>Template 1: Right-side margin layout</Text>
        )}
        {isTemplate2 && (
          <Text style={styles.bottom_label}>Template 2: Left-side margin layout</Text>
        )}
      </Page>
    </Document>
  );
};

export default MyDocument;
