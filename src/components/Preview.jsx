import React, { useEffect, useState, useContext } from "react";
import "./preview.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPreviewRequest, resetPreview } from "../store/previewSlice";
import { dobToAge } from "../utils/ageUtils";
import { Context } from "../main";
import "./presFormat.css";
import { PiPrescriptionBold } from "react-icons/pi";
import api from "../utils/api";

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

  // Construct full image URLs
  const headerImageUrl = doctor?.headerImage ? `${api.defaults.baseURL}${doctor.headerImage}` : "/Header.png";
  const signImageUrl = doctor?.signImage ? `${api.defaults.baseURL}${doctor.signImage}` : "/Footer.png";

  // Role check
  const canEdit = isAuthenticated && ["Admin", "Doctor"].includes(admin?.role);

  useEffect(() => {
    if (!patientId) return;
    // try to detect whether this is an appointment id (24 hex chars) or a patient id
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(patientId);
    dispatch(fetchPreviewRequest({ patientId }));
    return () => {
      dispatch(resetPreview());
    };
  }, [patientId, dispatch]);

  // PDF Download (A4, margin)
  const downLoadPDF = async () => {
    const input = document.getElementById("pdfDownload");
    if (!input) return;

    // prepare a clean A4 surface for capture
    const originalClass = input.className;
    const originalStyle = {
      width: input.style.width,
      minHeight: input.style.minHeight,
      boxShadow: input.style.boxShadow,
      borderRadius: input.style.borderRadius,
    };
    input.classList.add("a4-paper");

    // use a higher scale to improve text clarity in PDF
    const canvas = await html2canvas(input, {
      scale: 3,
      useCORS: true,
      logging: false,
    });

    // restore
    input.className = originalClass;
    input.style.width = originalStyle.width || "";
    input.style.minHeight = originalStyle.minHeight || "";
    input.style.boxShadow = originalStyle.boxShadow || "";
    input.style.borderRadius = originalStyle.borderRadius || "";

    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true,
    });
    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();
    const marginMm = 12;
    const pxToMm = (px) => px * 0.2645833333;
    const imgWidthMm = pxToMm(imgWidthPx);
    const imgHeightMm = pxToMm(imgHeightPx);
    const scale = (pageWidthMm - marginMm * 2) / imgWidthMm;
    const scaledImgHeightMm = imgHeightMm * scale;
    const pageContentHeightMm = pageHeightMm - marginMm * 2;
    const totalPages = Math.ceil(scaledImgHeightMm / pageContentHeightMm);
    const sliceHeightPx = Math.floor(
      pageContentHeightMm / scale / 0.2645833333
    );
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = imgWidthPx;
    tmpCanvas.height = sliceHeightPx;
    const tctx = tmpCanvas.getContext("2d");
    for (let page = 0; page < totalPages; page++) {
      const sx = 0;
      const sy = page * sliceHeightPx;
      const sw = imgWidthPx;
      const sh = Math.min(sliceHeightPx, imgHeightPx - sy);
      tctx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
      tctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      const imgData = tmpCanvas.toDataURL("image/png");
      const w = pageWidthMm - marginMm * 2;
      const h = sh * 0.2645833333 * scale;

      const imgProperties = pdf.getImageProperties(imgData);
      console.log(imgProperties);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      console.log(pdfWidth + "  " + pdfHeight);
      // pdf.addImage(imgData, 'PNG', marginMm, marginMm, w, h);
    }
    const fileName = `${patient?.firstName || "prescription"}.pdf`;
    pdf.save(fileName);
  };

  if (loading)
    return (
      <div className="prescription">
        <span class="loader" style={{height:"3rem"}}></span>      
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
      <div className="back-btn-box" style={{ width: "100%" }}>
        <button className="back-btn add-btn" onClick={() => navigate("/")}>
          ← Go Back
        </button>
      </div>
      {report ? (
        <div className="prescription">
          <div className="presdownload" id="pdfDownload">
            <div className="pres-page">
            {printWithHeader ? (
              <div>
              <div className="preview-header">
                {headerImageUrl && (
                  <img
                    src={headerImageUrl}
                    alt="Doctor Header"
                    className="preview-header-image"
                  />
                )}
              </div>
              <div className="header">
                <div className="logo">
                  <img src={"/Doctor_logo.svg"} alt="logo" />
                </div>
                <div className="Dr-detail">
                  <h2>
                    {doctor
                      ? `Dr. ${doctor.firstName || ""} ${
                          doctor.lastName || ""
                        }`
                      : clinic.name || "Doctor"}
                  </h2>
                  <p className="Doc-qualifications">{clinic.address}</p>
                </div>
              </div>
              </div>
            ) : (
              <div className="header">
                <div className="logo">
                  <img src={"/Doctor_logo.svg"} alt="logo" />
                </div>
                <div className="Dr-detail">
                  <h2>
                    {doctor
                      ? `Dr. ${doctor.firstName || ""} ${
                          doctor.lastName || ""
                        }`
                      : clinic.name || "Doctor"}
                  </h2>
                  <p className="Doc-qualifications">{clinic.address}</p>
                </div>
              </div>
            )}

              <div className="main">
                <div className="upper-box">
                  <div>
                    <p>
                      <b>ID: </b>
                      {patient.nic}
                    </p>
                    <p>
                      <b>Name: </b>
                      {patient.name ||
                        `${patient?.firstName} ${patient?.lastName}`}
                    </p>
                    <p>
                      <b>Address: </b>
                      {patient.address}
                    </p>
                    <p>
                      <b>Phone No: </b>
                      {patient.phone}
                    </p>
                    <p>
                      <b>Gender: </b>
                      {patient.gender}
                    </p>
                  </div>
                  <div className="mid">
                    <p>
                      <b>Age: </b>
                      {patient.dob
                        ? dobToAge(patient.dob)
                        : patient.age
                        ? `${patient.age} years`
                        : ""}
                    </p>
                  </div>
                  <div className="right">
                    <p>
                      <b>Date: </b>
                      {formatDate(report?.createdAt || patient.updatedAt)}
                    </p>
                    {report.diagnosys?.BMI && (
                      <p>
                        <b>BMI: </b>
                        {report.diagnosys.BMI} kg/m²
                      </p>
                    )}
                    {report.diagnosys?.Weight && (
                      <p>
                        <b>Weight: </b>
                        {report.diagnosys.Weight} Kg
                      </p>
                    )}
                  </div>
                </div>
                <div className="pData">
                  {patient.gender === "Female" && (
                    <div className="gravida-section">
                      {report?.Gravida && (
                        <p>
                          <b>G</b> {report.Gravida}
                          {report?.Parity && (
                            <span style={{ marginLeft: "0.5rem" }}>
                              <b>P</b> {report.Parity}
                            </span>
                          )}
                        </p>
                      )}
                      {report?.LMP && (
                        <p>
                          <b>LMP:</b> {formatDate(report.LMP)}
                        </p>
                      )}
                      {report?.EDD && (
                        <p>
                          <b>EDD:</b> {formatDate(report.EDD)}
                        </p>
                      )}
                      {report?.POG && (
                        <p>
                          <b>POG:</b> {report.POG}
                        </p>
                      )}
                      {report?.LCB && (
                        <p>
                          <b>LCB:</b> {report.LCB}
                        </p>
                      )}
                      {report?.MOD && (
                        <p>
                          <b>MOD:</b> {report.MOD}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="vitals">
                    {report?.diagnosys?.BP && (
                      <p>
                        <b>BP: </b>
                        {report.diagnosys.BP} mm of Hg
                      </p>
                    )}
                    {report?.diagnosys?.PR && (
                      <p>
                        <b>PR: </b>
                        {report.diagnosys.PR} bpm
                      </p>
                    )}
                    {report?.diagnosys?.SPO2 && (
                      <p>
                        <b>SPO2: </b>
                        {report.diagnosys.SPO2} % in RA
                      </p>
                    )}
                    {report?.diagnosys?.Temp && (
                      <p>
                        <b>Temp: </b>
                        {report.diagnosys.Temp} °F
                      </p>
                    )}
                    {report?.diagnosys?.Others && (
                      <p>
                        <b>Others: </b>
                        {report.diagnosys.Others}
                      </p>
                    )}
                  </div>
                  {report?.presentingComplaints && (
                    <p>
                      <b>Presenting Complaints: </b>
                      {report?.presentingComplaints}
                    </p>
                  )}
                  {report.medicalHistory && (
                    <p>
                      <b>Medical History: </b>
                      {report?.medicalHistory
                        ? report.medicalHistory.slice(
                            report.medicalHistory.length - 1,
                            report.medicalHistory.length
                          ) === ","
                        ? report.medicalHistory.slice(
                              0,
                            report.medicalHistory.length - 1
                            )
                        : report.medicalHistory
                        : ""}
                    </p>
                  )}
                  {report?.clinical_findings && (
                    <p>
                      <b>Clinical Findings: </b>
                      {report?.clinical_findings || ""}
                    </p>
                  )}
                  {report?.advice?.testAdvice?.length > 0 && (
                    <div className="advice-section">
                      <p className="investigation">
                        <b>Investigations: </b>
                        {report.advice.testAdvice.map((t, i) => (
                          <span key={i}>
                            {t.testName}
                            {report.advice.testAdvice.length - 1 !== i && ", "}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                  <p>
                    <b>{report.diagnosys_heading ? report.diagnosys_heading : "Provisional Diagnosis"}: </b>
                    {report?.initialComplain?.
                      slice(report.initialComplain.length - 1, report.initialComplain.length) === "," 
                      ? report.initialComplain.slice(0, report.initialComplain.length - 1) : report?.initialComplain || ""}
                  </p>
                </div>

                <div className="diagno-advice">
                  {/* <h3>Prescription (RX)</h3> */}
                  <PiPrescriptionBold
                    style={{ fontSize: "2rem", color: "black" }}
                  />
                  <div className="medic-details">
                    <div className="medicine-rows head-row">
                      <b>Sl</b>
                      <b>Medicine</b>
                      <b>Dose</b>
                      <b>Route</b>
                      <b>Frequency</b>
                      <b>Duration</b>
                    </div>
                    <div className="medic-data">
                      {medicines.length > 0 ? (
                        medicines.map((med, idx) => (
                          <div className="medicine-rows" key={med._id || idx}>
                            <p>{idx + 1}</p>
                            <p>
                              {med.name || ""}
                              {med.type && <span>({med.type}) </span>}
                            </p>
                            <p>{med.dose || ""}</p>
                            <p>{med.route || ""}</p>
                            <p>{med.frequency || ""}</p>
                            <p>{med.duration || ""}</p>
                          </div>
                        ))
                      ) : (
                        <div className="no-meds">No medicines prescribed.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="seal">
                  {report?.additionalAdvice && (
                    <div className="advice-section">
                      <p>
                        <b>Additional Advice:</b>
                        {report.additionalAdvice}
                      </p>
                    </div>
                  )}
                  <div className="follow-date">
                    <p>
                      <b>Next Follow-up Date: </b>
                      {formatDate(report?.followUp)}
                    </p>
                  </div>
                  <div className="drSeal">
                    <h3>
                      {doctor
                        ? `Dr. ${doctor.firstName || ""} ${
                            doctor.lastName || ""
                          }`
                        : ""}
                    </h3>

                    {/* {doctor?.qualification && <p>{doctor.qualification}</p>}
                  {doctor?.doctorDepartment && <p>{doctor.doctorDepartment}</p>}
                  {doctor?.designation && <p>{doctor.designation}</p>} */}
                  </div>
                </div>
              </div>

              {/* Conditional footer for preview */}
              {printWithFooter && (
              <div className="preview-footer">
                {signImageUrl && (
                  <img 
                    src={signImageUrl} 
                    alt="Doctor Signature" 
                    className="preview-footer-image"
                  />
                )}
              </div>
              )}
            </div>
          </div>
          <div className="print-options">
            <label>
              <input
                type="checkbox"
                checked={printWithHeader}
                onChange={(e) => setPrintWithHeader(e.target.checked)}
              />
              Print with Header
            </label>
            <label>
              <input
                type="checkbox"
                checked={printWithFooter}
                onChange={(e) => setPrintWithFooter(e.target.checked)}
              />
              Print with Footer
            </label>
          </div>
          <div className="pdf-down-btn" onClick={downLoadPDF}>
            Download PDF
          </div>
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

