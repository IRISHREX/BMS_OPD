import React, { useState } from "react";
import {
  IoCloudUploadOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoWarningOutline,
  IoCheckmarkCircle,
  IoArrowForward,
  IoArrowBack,
  IoDocumentAttachOutline,
} from "react-icons/io5";
import "./CreateReferralTab.css";

const CreateReferralTab = ({
  referralForm = {},
  setReferralForm,
  setActiveTab,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Validate Step 1 (Patient Information)
  const validateStep1 = () => {
    const errs = {};
    if (!referralForm.patientName || !referralForm.patientName.trim()) {
      errs.patientName = "Patient Name is required";
    }
    if (!referralForm.age || Number(referralForm.age) <= 0) {
      errs.age = "Valid age is required";
    }
    if (!referralForm.gender) {
      errs.gender = "Gender is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate Step 2 (Clinical Details)
  const validateStep2 = () => {
    const errs = {};
    if (!referralForm.diagnosis || !referralForm.diagnosis.trim()) {
      errs.diagnosis = "Diagnosis is required";
    }
    if (!referralForm.clinicalNotes || !referralForm.clinicalNotes.trim()) {
      errs.clinicalNotes = "Clinical Notes are required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrev = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (setActiveTab) {
      setActiveTab("query");
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles((prev) => [...prev, ...files.map((f) => f.name)]);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    if (onSubmit) {
      onSubmit(referralForm);
    } else {
      alert("Referral created successfully!");
      if (setActiveTab) setActiveTab("tracking");
    }
  };

  // Progress width calculation
  const progressPercent = currentStep === 1 ? 0 : currentStep === 2 ? 50 : 100;

  return (
    <div className="tab-content">
      <div className="referral-multistep-container">
        {/* Stepper Bar */}
        <div className="referral-stepper">
          <div className="referral-stepper-progress-line">
            <div
              className="referral-stepper-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            type="button"
            className={`stepper-step ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}
            onClick={() => setCurrentStep(1)}
          >
            <div className="step-circle">
              {currentStep > 1 ? <IoCheckmarkCircle size={22} /> : "1"}
            </div>
            <span className="step-label">1. Patient Info</span>
          </button>

          <button
            type="button"
            className={`stepper-step ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}
            onClick={() => {
              if (validateStep1()) setCurrentStep(2);
            }}
          >
            <div className="step-circle">
              {currentStep > 2 ? <IoCheckmarkCircle size={22} /> : "2"}
            </div>
            <span className="step-label">2. Clinical Details</span>
          </button>

          <button
            type="button"
            className={`stepper-step ${currentStep === 3 ? "active" : ""}`}
            onClick={() => {
              if (validateStep1() && validateStep2()) setCurrentStep(3);
            }}
          >
            <div className="step-circle">3</div>
            <span className="step-label">3. Review & Submit</span>
          </button>
        </div>

        {/* Step Cards */}
        <form onSubmit={handleSubmit}>
          {/* STEP 1: PATIENT INFORMATION */}
          {currentStep === 1 && (
            <div className="step-card-content">
              <div className="step-header">
                <h3>
                  <IoPersonOutline /> Patient Information
                </h3>
                <p>Provide basic identification and demographic details of the patient.</p>
              </div>

              <div className="form-grid-2">
                <div
                  className={`referral-form-group ${errors.patientName ? "has-error" : ""}`}
                >
                  <label>Patient Full Name *</label>
                  <input
                    type="text"
                    value={referralForm.patientName || ""}
                    onChange={(e) =>
                      setReferralForm({
                        ...referralForm,
                        patientName: e.target.value,
                      })
                    }
                    placeholder="e.g. John Doe"
                  />
                  {errors.patientName && (
                    <span className="error-msg">{errors.patientName}</span>
                  )}
                </div>

                <div className={`referral-form-group ${errors.age ? "has-error" : ""}`}>
                  <label>Age (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    max="125"
                    value={referralForm.age || ""}
                    onChange={(e) =>
                      setReferralForm({ ...referralForm, age: e.target.value })
                    }
                    placeholder="e.g. 35"
                  />
                  {errors.age && <span className="error-msg">{errors.age}</span>}
                </div>

                <div className="referral-form-group">
                  <label>Gender *</label>
                  <select
                    value={referralForm.gender || "male"}
                    onChange={(e) =>
                      setReferralForm({
                        ...referralForm,
                        gender: e.target.value.toLowerCase(),
                      })
                    }
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="referral-form-group">
                  <label>ABHA ID (Optional)</label>
                  <input
                    type="text"
                    value={referralForm.abhaId || ""}
                    onChange={(e) =>
                      setReferralForm({ ...referralForm, abhaId: e.target.value })
                    }
                    placeholder="14-digit ABHA Number"
                  />
                </div>
              </div>

              <div className="step-actions">
                {setActiveTab && (
                  <button
                    type="button"
                    className="btn-step-prev"
                    onClick={() => setActiveTab("query")}
                  >
                    Back to Tabs
                  </button>
                )}
                <button
                  type="button"
                  className="btn-step-next"
                  onClick={handleNext}
                >
                  Next: Clinical Info <IoArrowForward style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CLINICAL DETAILS */}
          {currentStep === 2 && (
            <div className="step-card-content">
              <div className="step-header">
                <h3>
                  <IoMedicalOutline /> Clinical Information & Notes
                </h3>
                <p>Record medical diagnosis, clinical findings, and required care.</p>
              </div>

              <div className="form-grid-1">
                <div
                  className={`referral-form-group ${errors.diagnosis ? "has-error" : ""}`}
                >
                  <label>Primary Diagnosis *</label>
                  <input
                    type="text"
                    value={referralForm.diagnosis || ""}
                    onChange={(e) =>
                      setReferralForm({
                        ...referralForm,
                        diagnosis: e.target.value,
                      })
                    }
                    placeholder="e.g. Acute Appendicitis / Hypertension Stage II"
                  />
                  {errors.diagnosis && (
                    <span className="error-msg">{errors.diagnosis}</span>
                  )}
                </div>

                <div
                  className={`referral-form-group ${errors.clinicalNotes ? "has-error" : ""}`}
                >
                  <label>Clinical Notes & History *</label>
                  <textarea
                    rows={3}
                    value={referralForm.clinicalNotes || ""}
                    onChange={(e) =>
                      setReferralForm({
                        ...referralForm,
                        clinicalNotes: e.target.value,
                      })
                    }
                    placeholder="Summarize symptoms, present illness, examinations and vital observations..."
                  />
                  {errors.clinicalNotes && (
                    <span className="error-msg">{errors.clinicalNotes}</span>
                  )}
                </div>

                <div className="referral-form-group">
                  <label>Specific Required Care / Treatment</label>
                  <textarea
                    rows={2}
                    value={referralForm.requiredCare || ""}
                    onChange={(e) =>
                      setReferralForm({
                        ...referralForm,
                        requiredCare: e.target.value,
                      })
                    }
                    placeholder="e.g. ICU Observation, Urgent surgical consult, Dialysis support..."
                  />
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="btn-step-prev"
                  onClick={handlePrev}
                >
                  <IoArrowBack style={{ marginRight: 6 }} /> Back
                </button>
                <button
                  type="button"
                  className="btn-step-next"
                  onClick={handleNext}
                >
                  Next: Priority & Review <IoArrowForward style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: URGENCY, ATTACHMENTS & REVIEW */}
          {currentStep === 3 && (
            <div className="step-card-content">
              <div className="step-header">
                <h3>
                  <IoWarningOutline /> Urgency & Verification
                </h3>
                <p>Select referral priority, upload diagnostics, and confirm details.</p>
              </div>

              <div className="referral-form-group">
                <label>Urgency Level</label>
                <div className="urgency-selector-grid">
                  {[
                    {
                      id: "routine",
                      name: "Routine",
                      desc: "Scheduled evaluation within standard timeline",
                    },
                    {
                      id: "urgent",
                      name: "Urgent",
                      desc: "Requires prompt attention within 24-48 hours",
                    },
                    {
                      id: "emergency",
                      name: "Emergency",
                      desc: "Immediate clinical intervention and transfer needed",
                    },
                  ].map((level) => {
                    const isSelected =
                      (referralForm.urgency || "routine") === level.id;
                    return (
                      <div
                        key={level.id}
                        className={`urgency-card ${level.id} ${isSelected ? `selected ${level.id}` : ""}`}
                        onClick={() =>
                          setReferralForm({
                            ...referralForm,
                            urgency: level.id,
                          })
                        }
                      >
                        <div className="urgency-title">{level.name}</div>
                        <div className="urgency-desc">{level.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upload Zone */}
              <div className="referral-form-group" style={{ marginTop: "1.25rem" }}>
                <label>Diagnostic Reports & Documents (Optional)</label>
                <label className="referral-upload-zone">
                  <IoCloudUploadOutline />
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>
                    Click or Drag to Upload Diagnostic Reports
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    PDF, JPG, PNG files accepted (Up to 10MB)
                  </div>
                  <input
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </label>
                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: "0.85rem", color: "#166534" }}>
                    <IoDocumentAttachOutline style={{ verticalAlign: "middle" }} /> Attached:{" "}
                    {uploadedFiles.join(", ")}
                  </div>
                )}
              </div>

              {/* Summary Review Card */}
              <div className="referral-summary-box">
                <h5>Summary Preview</h5>
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>Patient Name</strong>
                    <span>{referralForm.patientName || "-"}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Age / Gender</strong>
                    <span>
                      {referralForm.age} Yrs /{" "}
                      {(referralForm.gender || "male").toUpperCase()}
                    </span>
                  </div>
                  <div className="summary-item">
                    <strong>Diagnosis</strong>
                    <span>{referralForm.diagnosis || "-"}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Urgency</strong>
                    <span style={{ textTransform: "capitalize" }}>
                      {referralForm.urgency || "routine"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="btn-step-prev"
                  onClick={handlePrev}
                >
                  <IoArrowBack style={{ marginRight: 6 }} /> Back
                </button>
                <button type="submit" className="btn-step-submit">
                  <IoCheckmarkCircle style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Submit Referral
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateReferralTab;
