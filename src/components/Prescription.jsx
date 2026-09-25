import React, { useEffect, useState, useMemo } from "react";
import AutoSuggestInput from "./AutoSuggestInput";
import AutoSuggestInputforSymptom from "./AutoSuggestInputforSymptom";
import useSymptomSuggestions from "./useSymptomSuggestions";
import useMedicineSuggestions from "./useMedicineSuggestions";
import useDiagnosticTestSuggestions from "./useDiagnosticTestSuggestions";
import useAdviceSuggestions from "./useAdviceSuggestions";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../context/SnackbarContext";
import { playSaveSound } from "../utils/soundUtils";
import "./Prescription.css";
import { formatAppointmentId, formatPatientId } from "../utils/idUtils";
import { addMedicineRequest } from "../store/medicineSlice";
import {
  IoIosClose,
  IoIosCloseCircle,
  IoIosCloseCircleOutline,
} from "react-icons/io";
import { FaSave, FaChevronDown, FaChevronUp, FaKeyboard } from "react-icons/fa";
import {
  FaHeartPulse,
  FaStethoscope,
  FaCommentMedical,
  FaFileMedical,
  FaUserDoctor,
  FaFileLines,
  FaVial,
  FaXRay,
  FaPills,
  FaVials,
  FaLightbulb,
  FaCalendarCheck,
  FaPersonPregnant,
  FaCheck,
  FaNotesMedical,
} from "react-icons/fa6";
import { BsPrinter, BsTrash } from "react-icons/bs";
import { TbLoader3, TbRefresh } from "react-icons/tb";
import { useSelector, useDispatch } from "react-redux";
import { change } from "../store/diagnosisSlice";
import { changeSdisease } from "../store/diseaseSlice";

// Clean, single-component Prescription (5-step slider)
const Prescription = ({ patientId, onClose, appointmentId: propAppointmentId }) => {
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [appointmentId, setAppointmentId] = useState(propAppointmentId || "");
  const [nic, setNic] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [appointmentType, setAppointmentType] = useState("OPD");
  const [bookedBy, setBookedBy] = useState("");
  const rDiagnosis = useSelector((state) => state.diagnosis.value);
  const dispatch = useDispatch();
  const symptomSuggestions = useSymptomSuggestions();
  const medSuggestions = useMedicineSuggestions();
  const { tests: diagnosticTests } = useDiagnosticTestSuggestions();
  const { advices: adviceSuggestions } = useAdviceSuggestions();
  // server-driven complaint suggestions while typing
  const [complaintQuery, setComplaintQuery] = useState("");
  const [complaintSuggestions, setComplaintSuggestions] = useState([]);
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isFetchingComplaints, setIsFetchingComplaints] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const complainDebounceRef = React.useRef(null);
  const [toggleOpen, setToggleOpen] = useState({
    medicalHistory: false,
    clinicalFindings: false,
    availableReports: true,
  });
  const [obgynOpen, setObgynOpen] = useState(false);

  // Derived test suggestions: Diagnostic Tests from DB (/tests) + symptom advice tests
  const testSuggestions = useMemo(() => {
    const map = new Map();

    // 1. All saved Diagnostic Tests from DB
    (diagnosticTests || []).forEach((t) => {
      const key = (t.name || "").trim();
      if (!key) return;
      const lowerKey = key.toLowerCase();
      map.set(lowerKey, {
        name: key,
        label: key,
        category: t.category || "General",
        composition: t.category || "General",
        testType: t.category || "General",
      });
    });

    // 2. Merge any additional test items from symptom suggestions
    (symptomSuggestions || []).forEach((a) => {
      if (Array.isArray(a.testAdvice)) {
        a.testAdvice.forEach((t) => {
          const key = (t.testName || "").trim();
          if (!key) return;
          const lowerKey = key.toLowerCase();
          if (!map.has(lowerKey)) {
            map.set(lowerKey, {
              name: key,
              label: key,
              category: t.testType || "General",
              composition: t.testType || "General",
              ...t,
            });
          }
        });
      }
    });

    return Array.from(map.values());
  }, [diagnosticTests, symptomSuggestions]);
  const [temp_complain, setTemp_complain] = useState([
    "Fever",
    "Cough",
    "Headache",
    "Body Pain",
    "Cold",
  ]);
  const [temp_medicalHistory, setTemp_medicalHistory] = useState([
    "HTN(Hypertension)",
    "T2DM(Type-2 Diabetes Mellitus)",
    "Hyperlipidemia",
    "Thyroid",
  ]);
  const [medicalHistory, setMedicalHistory] = useState("");
  const [clinical_findings, setClinical_findings] = useState({
    patientCondition: {
      c1: "",
      c2: "",
      c3: "",
      c4: "",
    },
    polar: "",
    icterus: "",
    edema: "",
    cyanosis: "",
    clubbing: "",
    lymph_nodes: "",
    chest: "",
    cvs: "",
    per_abdomen: {
      pt: "",
      pv: "",
    },
    others: "",
  });
  const [diagnosys_heading, setDiagnosys_heading] = useState(
    "Provisional Diagnosis"
  );
  const [complaints, setComplaints] = useState("");
  const [gravida, setGravida] = useState("");
  const [parity, setParity] = useState({ Pa: "", Pb: "" });
  const [LMP, setLMP] = useState("");
  const [EDD, setEDD] = useState("");
  const [diagnosys, setDiagnosys] = useState({
    BP: "",
    PR: "",
    SPO2: "",
    Temp: "",
    Height: "",
    Weight: "",
    BMI: "",
    Others: "",
  });
  const [followUp, setFollowUp] = useState("");
  const [medicineAdvice, setMedicineAdvice] = useState([]);
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [selectedTestTypes, setSelectedTestTypes] = useState([]);
  const [testAdviceRows, setTestAdviceRows] = useState([
    {
      testName: "",
      testType: "",
      precautions: "",
      testDate: "",
      selected: false,
    },
  ]);
  const [pathologyReport, setPathologyReport] = useState("");
  const [radiologyReport, setRadiologyReport] = useState("");
  const [medicationAdvice, setMedicationAdvice] = useState("");
  const [dietAdvice, setDietAdvice] = useState("");
  const [additionalAdvice, setAdditionalAdvice] = useState("");
  // helper: dedupe (case-insensitive) and sort lines alphabetically (case-insensitive)
  const dedupeAndSortLines = (text) => {
    if (!text) return "";
    const lines = String(text)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const map = new Map();
    lines.forEach((l) => {
      const key = l.toLowerCase();
      if (!map.has(key)) map.set(key, l);
    });
    // sort by lowercase key
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => v)
      .join("\n");
  };

  const buildNormalizedSnapshot = (stateObj = {}) => {
    const diag = stateObj.diagnosys || {};
    const h = (diag.Height || "").toString().trim();
    const w = (diag.Weight || "").toString().trim();
    let computedBmi = (diag.BMI || "").toString().trim();
    if (h && w) {
      const hM = parseFloat(h) / 100;
      const wK = parseFloat(w);
      if (hM > 0 && wK > 0) {
        computedBmi = (wK / (hM * hM)).toFixed(2);
      }
    }

    const pa = (stateObj.parity?.Pa || "").toString().trim();
    const pb = (stateObj.parity?.Pb || "").toString().trim();
    const parityStr = (pa || pb) ? `${pa}+${pb}` : "";

    const medAdviceList = (stateObj.medicineAdvice || []).map((m) => ({
      name: (m.name || m.label || "").toString().trim(),
      type: (m.type || "").toString().trim(),
      dose: (m.dose || "").toString().trim(),
      frequency: (m.frequency || "").toString().trim(),
      route: (m.route || "mouth").toString().trim(),
      duration: (m.duration || "").toString().trim(),
      notes: (m.notes || "").toString().trim(),
      selected: m.selected !== undefined ? Boolean(m.selected) : true,
    }));

    const testAdvList = (stateObj.testAdviceRows || [])
      .filter((r) => (r.testName || "").toString().trim() !== "")
      .map((r) => ({
        testName: (r.testName || "").toString().trim(),
        testType: (r.testType || "").toString().trim(),
        precautions: (r.precautions || "").toString().trim(),
        testDate: (r.testDate || "").toString().trim(),
        selected: Boolean(r.selected),
      }));

    return JSON.stringify({
      initialComplain: (stateObj.rDiagnosis || "").toString().trim(),
      presentingComplaints: (stateObj.complaints || "").toString().trim(),
      medicalHistory: (stateObj.medicalHistory || "").toString().trim(),
      pathologyReport: (stateObj.pathologyReport || "").toString().trim(),
      radiologyReport: (stateObj.radiologyReport || "").toString().trim(),
      clinical_findings: {
        patientCondition: {
          c1: (stateObj.clinical_findings?.patientCondition?.c1 || "").toString().trim(),
          c2: (stateObj.clinical_findings?.patientCondition?.c2 || "").toString().trim(),
          c3: (stateObj.clinical_findings?.patientCondition?.c3 || "").toString().trim(),
          c4: (stateObj.clinical_findings?.patientCondition?.c4 || "").toString().trim(),
        },
        polar: (stateObj.clinical_findings?.polar || "").toString().trim(),
        icterus: (stateObj.clinical_findings?.icterus || "").toString().trim(),
        edema: (stateObj.clinical_findings?.edema || "").toString().trim(),
        cyanosis: (stateObj.clinical_findings?.cyanosis || "").toString().trim(),
        clubbing: (stateObj.clinical_findings?.clubbing || "").toString().trim(),
        lymph_nodes: (stateObj.clinical_findings?.lymph_nodes || "").toString().trim(),
        chest: (stateObj.clinical_findings?.chest || "").toString().trim(),
        cvs: (stateObj.clinical_findings?.cvs || "").toString().trim(),
        per_abdomen: {
          pt: (stateObj.clinical_findings?.per_abdomen?.pt || "").toString().trim(),
          pv: (stateObj.clinical_findings?.per_abdomen?.pv || "").toString().trim(),
        },
        others: (stateObj.clinical_findings?.others || "").toString().trim(),
      },
      diagnosys_heading: (stateObj.diagnosys_heading || "Provisional Diagnosis").toString().trim(),
      femaleTests: {
        Gravida: (stateObj.gravida || "").toString().trim(),
        Parity: parityStr,
        LMP: (stateObj.LMP || "").toString().trim(),
        EDD: (stateObj.EDD || "").toString().trim(),
        POG: (stateObj.POG || "").toString().trim(),
        LCB: (stateObj.LCB || "").toString().trim(),
        MOD: (stateObj.MOD || "").toString().trim(),
      },
      diagnosys: {
        BP: (diag.BP || "").toString().trim(),
        PR: (diag.PR || "").toString().trim(),
        SPO2: (diag.SPO2 || "").toString().trim(),
        Temp: (diag.Temp || "").toString().trim(),
        Height: h,
        Weight: w,
        BMI: computedBmi,
        Others: (diag.Others || "").toString().trim(),
      },
      additionalAdvice: (stateObj.additionalAdvice || "").toString().trim(),
      followUp: (stateObj.followUp || "").toString().trim(),
      medicineAdvice: medAdviceList,
      testAdvice: testAdvList,
      medicationAdvice: (stateObj.medicationAdvice || "").toString().trim(),
      dietAdvice: (stateObj.dietAdvice || "").toString().trim(),
    });
  };

  const [originalPayload, setOriginalPayload] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  // Checkbox toggle for advice types
  const [POG, setPOG] = useState("");
  const [LCB, setLCB] = useState("");
  const [MOD, setMOD] = useState("");
  const handleCheckboxToggle = (e, testType) => {
    setSelectedTestTypes((prev) =>
      e.target.checked
        ? [...prev, testType]
        : prev.filter((t) => t !== testType)
    );
  };

  // Add new test advice row
  const addNewTestAdviceRow = () => {
    setTestAdviceRows((prev) => [
      ...prev,
      {
        testName: "",
        testType: "",
        precautions: "",
        testDate: "",
        selected: true,
      },
    ]);
  };

  // Obstetric calculations
  useEffect(() => {
    if (!LMP) {
      setPOG("");
      return;
    }
    try {
      const lmpDate = new Date(LMP);
      if (isNaN(lmpDate.getTime())) {
        setPOG("");
        return;
      }

      // Calculate EDD from LMP
      const eddDate = new Date(lmpDate);
      eddDate.setMonth(eddDate.getMonth() + 9);
      eddDate.setDate(eddDate.getDate() + 7);
      setEDD(eddDate.toISOString().slice(0, 10));

      // Calculate POG
      const today = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysDifference = Math.floor((today - lmpDate) / msPerDay);
      const weeks = Math.floor(daysDifference / 7);
      const days = daysDifference % 7;
      setPOG(`${weeks} weeks, ${days} days`);
    } catch (e) {
      setPOG("");
    }
  }, [LMP]);

  const handleEddChange = (e) => {
    const newEdd = e.target.value;
    setEDD(newEdd);
    if (!newEdd) return;
    try {
      const eddDate = new Date(newEdd);
      eddDate.setMonth(eddDate.getMonth() - 9);
      eddDate.setDate(eddDate.getDate() - 7);
      setLMP(eddDate.toISOString().slice(0, 10));
    } catch (e) {
      // ignore invalid date
    }
  };

  // Update test advice row
  const handleTestAdviceChange = (idx, field, value) => {
    setTestAdviceRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };
  const [doctorId, setDoctorId] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);

  const steps = ["Complain & Medicines", "Medical History"];
  const rootRef = React.useRef(null);
  const keysPressed = React.useRef(new Set());
  useEffect(() => {
    const fetchLatestAppointment = async () => {
      try {
        const { data } = await api.get(
          `/api/v1/appointment/patient/${patientId}`
        );
        const appointments = data.appointments || [];
        if (!appointments.length) return setLoading(false);
        let selectedAppt = null;
        if (propAppointmentId) {
          selectedAppt = appointments.find((a) => String(a._id) === String(propAppointmentId));
        }
        if (!selectedAppt) {
          appointments.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt || b.appointment_date) - new Date(a.updatedAt || a.createdAt || a.appointment_date)
          );
          selectedAppt = appointments[0];
        }
        const latest = selectedAppt;
        setAppointmentId(latest._id);
        setAppointmentType(latest.appointmentType || latest.type || "OPD");
        setNic(latest.nic || "");
        setName(latest.name || "");
        setGender(latest.gender || "");
        setAge(latest.age || "");
        setBookedBy(latest.bookedBy || "");
        const docIdVal = latest.doctorId?._id || (typeof latest.doctorId === "string" ? latest.doctorId : "");
        setDoctorId(docIdVal);

        // Now try to fetch the latest prescription
        let r = null;
        try {
          const presRes = await api.get(`/api/v1/prescription/patient/${patientId}`);
          const presList = presRes.data.prescriptions || [];
          if (presList.length > 0) {
            r = presList[0];
            if (!docIdVal && r.doctorId) {
              setDoctorId(r.doctorId?._id || (typeof r.doctorId === "string" ? r.doctorId : ""));
            }
          }
        } catch (err) {
          console.log("Failed to fetch prescription", err);
        }

        // Fallback to appointment result if no prescription found
        if (!r && latest.result && latest.result.length) {
          r = latest.result[0];
        }

        let diagVal = "";
        let nextComplaints = "";
        let nextMedicalHistory = "";
        let nextPathologyReport = "";
        let nextRadiologyReport = "";
        let nextClinicalFindings = {
          patientCondition: { c1: "", c2: "", c3: "", c4: "" },
          polar: "",
          icterus: "",
          edema: "",
          cyanosis: "",
          clubbing: "",
          lymph_nodes: "",
          chest: "",
          cvs: "",
          per_abdomen: { pt: "", pv: "" },
          others: "",
        };
        let nextDiagnosysHeading = "Provisional Diagnosis";
        let nextGravida = "";
        let nextParity = { Pa: "", Pb: "" };
        let nextLMP = "";
        let nextEDD = "";
        let nextPOG = "";
        let nextLCB = "";
        let nextMOD = "";
        let nextDiagnosys = {
          BP: "",
          PR: "",
          SPO2: "",
          Temp: "",
          Height: "",
          Weight: "",
          BMI: "",
          Others: "",
        };
        let nextMedicineAdvice = [];
        let nextTestAdviceRows = [];
        let nextMedicationAdvice = "";
        let nextDietAdvice = "";
        let nextAdditionalAdvice = "";
        let nextFollowUp = "";
        let nextSelectedTestTypes = [];

        if (r) {
          nextComplaints = r.presentingComplaints || "";
          diagVal = typeof r.provisionalDiagnosis === "object"
            ? (r.provisionalDiagnosis?.value || "")
            : (r.provisionalDiagnosis || r.initialComplain || "");
          nextMedicalHistory = r.medicalHistory || "";
          nextPathologyReport =
            r.pathologyReport ||
            r.pathologicalReport ||
            r.availableReports?.pathology ||
            "";
          nextRadiologyReport =
            r.radiologyReport ||
            r.radiologicalReport ||
            r.availableReports?.radiology ||
            "";
          const cf = (typeof r.clinical_findings === 'object' && r.clinical_findings !== null)
            ? r.clinical_findings
            : (typeof r.clinicalFindings === 'object' && r.clinicalFindings !== null)
            ? r.clinicalFindings
            : null;

          nextClinicalFindings = {
            patientCondition: {
              c1: cf?.patientCondition?.c1 || "",
              c2: cf?.patientCondition?.c2 || "",
              c3: cf?.patientCondition?.c3 || "",
              c4: cf?.patientCondition?.c4 || "",
            },
            polar: cf?.polar || "",
            icterus: cf?.icterus || "",
            edema: cf?.edema || "",
            cyanosis: cf?.cyanosis || "",
            clubbing: cf?.clubbing || "",
            lymph_nodes: cf?.lymph_nodes || "",
            chest: cf?.chest || "",
            cvs: cf?.cvs || "",
            per_abdomen: {
              pt: cf?.per_abdomen?.pt || "",
              pv: cf?.per_abdomen?.pv || "",
            },
            others: cf?.others || (typeof r.clinicalFindings === 'string' ? r.clinicalFindings : ""),
          };
          nextDiagnosysHeading = r.diagnosys_heading || "Provisional Diagnosis";
          if (r.femaleTests) {
            nextGravida = r.femaleTests.Gravida || "";
            if (r.femaleTests.Parity && r.femaleTests.Parity.includes("+")) {
              const [Pa, Pb] = r.femaleTests.Parity.split("+");
              nextParity = { Pa: Pa || "", Pb: Pb || "" };
            } else {
              nextParity = { Pa: r.femaleTests.Parity || "", Pb: "" };
            }
            nextLMP = r.femaleTests.LMP || "";
            nextEDD = r.femaleTests.EDD || "";
            nextPOG = r.femaleTests.POG || "";
            nextLCB = r.femaleTests.LCB || "";
            nextMOD = r.femaleTests.MOD || "";
          } else {
            nextGravida = r.Gravida || "";
            if (r.Parity && r.Parity.includes("+")) {
              const [Pa, Pb] = r.Parity.split("+");
              nextParity = { Pa: Pa || "", Pb: Pb || "" };
            } else {
              nextParity = { Pa: r.Parity || "", Pb: "" };
            }
            nextLMP = r.LMP || "";
            nextEDD = r.EDD || "";
            nextPOG = r.POG || "";
            nextLCB = r.LCB || "";
            nextMOD = r.MOD || "";
          }

          if (nextLMP) {
            try {
              const lmpDate = new Date(nextLMP);
              if (!isNaN(lmpDate.getTime())) {
                const eddDate = new Date(lmpDate);
                eddDate.setMonth(eddDate.getMonth() + 9);
                eddDate.setDate(eddDate.getDate() + 7);
                nextEDD = eddDate.toISOString().slice(0, 10);

                const today = new Date();
                const msPerDay = 1000 * 60 * 60 * 24;
                const daysDifference = Math.floor((today - lmpDate) / msPerDay);
                const weeks = Math.floor(daysDifference / 7);
                const days = daysDifference % 7;
                nextPOG = `${weeks} weeks, ${days} days`;
              }
            } catch (e) {
              // ignore
            }
          }

          nextAdditionalAdvice = r.additionalAdvice || "";
          nextFollowUp = r.followUp || "";
          const vitalsObj = r.vitals || r.diagnosys || {};
          nextDiagnosys = {
            BP: vitalsObj.BP || "",
            PR: vitalsObj.PR || "",
            SPO2: vitalsObj.SPO2 || "",
            Temp: vitalsObj.Temp || "",
            Height: vitalsObj.Height || "",
            Weight: vitalsObj.Weight || "",
            BMI: vitalsObj.BMI || "",
            Others: vitalsObj.Others || "",
          };
          const rawMeds = Array.isArray(r.medicineAdvice)
            ? r.medicineAdvice
            : r.medicineAdvice
            ? [r.medicineAdvice]
            : Array.isArray(r.medicines)
            ? r.medicines
            : [];
          nextMedicineAdvice = rawMeds.map((m) => ({
            ...m,
            selected: m.selected !== undefined ? m.selected : true,
          }));

          const adv = r.advice;
          if (!adv) {
            // nothing
          } else if (typeof adv === "string") {
            nextMedicationAdvice = adv;
            nextSelectedTestTypes = ["Medication"];
          } else if (typeof adv === "object") {
            if (Array.isArray(adv.testAdvice)) {
              nextTestAdviceRows = adv.testAdvice;
            }
            if (adv.medication) nextMedicationAdvice = adv.medication;
            if (adv.diet) nextDietAdvice = adv.diet;
            const sel = [];
            if (adv.testAdvice && adv.testAdvice.length)
              sel.push("Test Advice");
            if (adv.medication) sel.push("Medication");
            if (adv.diet) sel.push("Diet");
            nextSelectedTestTypes = sel;
          }
        }

        // Apply all state setters
        dispatch(change(diagVal));
        setComplaints(nextComplaints);
        setMedicalHistory(nextMedicalHistory);
        setPathologyReport(nextPathologyReport);
        setRadiologyReport(nextRadiologyReport);
        setClinical_findings(nextClinicalFindings);
        setDiagnosys_heading(nextDiagnosysHeading);
        setGravida(nextGravida);
        setParity(nextParity);
        setLMP(nextLMP);
        setEDD(nextEDD);
        setPOG(nextPOG);
        setLCB(nextLCB);
        setMOD(nextMOD);
        setAdditionalAdvice(nextAdditionalAdvice);
        setFollowUp(nextFollowUp);
        setDiagnosys(nextDiagnosys);
        setMedicineAdvice(nextMedicineAdvice);
        if (nextTestAdviceRows.length > 0) {
          setTestAdviceRows(nextTestAdviceRows);
        }
        setMedicationAdvice(nextMedicationAdvice);
        setDietAdvice(nextDietAdvice);
        setSelectedTestTypes(nextSelectedTestTypes);

        const initSnap = buildNormalizedSnapshot({
          rDiagnosis: diagVal,
          complaints: nextComplaints,
          medicalHistory: nextMedicalHistory,
          pathologyReport: nextPathologyReport,
          radiologyReport: nextRadiologyReport,
          clinical_findings: nextClinicalFindings,
          diagnosys_heading: nextDiagnosysHeading,
          gravida: nextGravida,
          parity: nextParity,
          LMP: nextLMP,
          EDD: nextEDD,
          POG: nextPOG,
          LCB: nextLCB,
          MOD: nextMOD,
          diagnosys: nextDiagnosys,
          additionalAdvice: nextAdditionalAdvice,
          followUp: nextFollowUp,
          medicineAdvice: nextMedicineAdvice,
          testAdviceRows: nextTestAdviceRows,
          medicationAdvice: nextMedicationAdvice,
          dietAdvice: nextDietAdvice,
        });

        setOriginalPayload(initSnap);
        setIsDirty(false);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchLatestAppointment();
  }, [patientId]);

  // compute dirty state whenever key fields change
  useEffect(() => {
    if (loading || !originalPayload) {
      setIsDirty(false);
      return;
    }
    try {
      const currentSnap = buildNormalizedSnapshot({
        rDiagnosis,
        complaints,
        medicalHistory,
        pathologyReport,
        radiologyReport,
        clinical_findings,
        diagnosys_heading,
        gravida,
        parity,
        LMP,
        EDD,
        POG,
        LCB,
        MOD,
        diagnosys,
        additionalAdvice,
        followUp,
        medicineAdvice,
        testAdviceRows,
        medicationAdvice,
        dietAdvice,
      });
      const dirty = originalPayload !== currentSnap;
      setIsDirty(Boolean(dirty));
    } catch (e) {
      setIsDirty(false);
    }
  }, [
    loading,
    originalPayload,
    rDiagnosis,
    complaints,
    medicalHistory,
    clinical_findings,
    diagnosys_heading,
    gravida,
    parity,
    LMP,
    EDD,
    diagnosys,
    medicineAdvice,
    selectedTestTypes,
    testAdviceRows,
    medicationAdvice,
    dietAdvice,
    additionalAdvice,
    followUp,
    POG,
    LCB,
    MOD,
    pathologyReport,
    radiologyReport,
  ]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get(`/api/v1/user/doctors/list`);
        setDoctorsList(data.doctors || []);
      } catch (e) {
        snackbar.error(
          e?.response?.data?.message || "Failed to save prescription"
        );
      }
    };
    fetchDoctors();
  }, []);

  // keyboard navigation handlers (supports Enter combos and Ctrl/Cmd equivalents)
  useEffect(() => {
    const selector =
      "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])";

    const getFocusable = (container) => {
      if (!container) return [];
      return Array.from(container.querySelectorAll(selector)).filter(
        (el) => el.offsetParent !== null
      );
    };

    const focusNext = (current) => {
      const container = rootRef.current;
      if (!container) return;
      const focusables = getFocusable(container);
      const idx = focusables.indexOf(current);
      if (idx >= 0 && idx < focusables.length - 1) {
        focusables[idx + 1].focus();
        return true;
      }
      return false;
    };

    const focusFirstInStep = (stepIndex) => {
      const container = rootRef.current;
      if (!container) return;
      const slides = Array.from(container.querySelectorAll(".step-slide"));
      const stepEl = slides[stepIndex];
      if (!stepEl) return;
      const focusables = getFocusable(stepEl);
      if (focusables.length) {
        focusables[0].focus();
      }
    };

    const handleEnterActions = (e, modifiers = {}) => {
      // keep textareas normal
      const active = document.activeElement;
      // let native controls (textareas, buttons, links, selects, checkboxes/radios) handle Enter
      if (active) {
        const tag = active.tagName;
        const type = active.type || "";
        if (tag === "TEXTAREA") return true;
        if (tag === "BUTTON" || tag === "A" || tag === "SELECT") return true;
        if (tag === "INPUT" && (type === "checkbox" || type === "radio"))
          return true;
      }

      const { ctrlOrMeta = false, tab = false, p = false } = modifiers;

      // Ctrl/Cmd+P or Enter+P -> save & print
      if (p || keysPressed.current.has("p") || keysPressed.current.has("P")) {
        e.preventDefault();
        handleSave(true);
        return true;
      }

      // Ctrl/Cmd+Tab or Enter+Tab -> next step
      if (tab) {
        e.preventDefault();
        setCurrentStep((s) => {
          const next = Math.min(s + 1, steps.length - 1);
          setTimeout(() => focusFirstInStep(next), 120);
          return next;
        });
        return true;
      }

      // plain Enter or Ctrl/Cmd+Enter -> focus next field
      e.preventDefault();
      const moved = focusNext(active);
      if (!moved) {
        setCurrentStep((s) => {
          const next = Math.min(s + 1, steps.length - 1);
          setTimeout(() => focusFirstInStep(next), 120);
          return next;
        });
      }
      return true;
    };

    const onKeyDown = (e) => {
      // handle Ctrl/Cmd shortcuts first
      const isCtrl = e.ctrlKey || e.metaKey;
      const active = document.activeElement;
      if (active && active.tagName === "BUTTON") {
        // don't intercept Enter/Tab when a button is focused
        if (e.key === "Enter" || e.key === "Tab") return;
      }
      if (isCtrl && (e.key === "p" || e.key === "P")) {
        // override browser print
        e.preventDefault();
        handleSave(true);
        return;
      }
      if (isCtrl && e.key === "Tab") {
        e.preventDefault();
        handleEnterActions(e, { ctrlOrMeta: true, tab: true });
        return;
      }
      if (isCtrl && e.key === "Enter") {
        e.preventDefault();
        handleEnterActions(e, { ctrlOrMeta: true });
        return;
      }

      // Arrow keys: navigate fields/steps
      if (e.key === "ArrowRight") {
        // go to next step (only if not inside editing text in middle)
        const active = document.activeElement;
        let allow = true;
        if (
          active &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        ) {
          const val = active.value || "";
          try {
            // only navigate step if caret is at end
            allow = active.selectionEnd === val.length;
          } catch (err) {
            allow = false;
          }
        }
        if (allow) {
          e.preventDefault();
          setCurrentStep((s) => {
            const next = Math.min(s + 1, steps.length - 1);
            setTimeout(() => {
              const slides = Array.from(
                rootRef.current.querySelectorAll(".step-slide")
              );
              const stepEl = slides[next];
              if (stepEl) {
                const focusables = Array.from(
                  stepEl.querySelectorAll("input, select, textarea, button")
                ).filter((el) => el.offsetParent !== null);
                if (focusables.length) focusables[0].focus();
              }
            }, 80);
            return next;
          });
          return;
        }
      }
      if (e.key === "ArrowLeft") {
        const active = document.activeElement;
        let allow = true;
        if (
          active &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        ) {
          try {
            allow = active.selectionStart === 0;
          } catch (err) {
            allow = false;
          }
        }
        if (allow) {
          e.preventDefault();
          setCurrentStep((s) => {
            const prev = Math.max(s - 1, 0);
            setTimeout(() => {
              const slides = Array.from(
                rootRef.current.querySelectorAll(".step-slide")
              );
              const stepEl = slides[prev];
              if (stepEl) {
                const focusables = Array.from(
                  stepEl.querySelectorAll("input, select, textarea, button")
                ).filter((el) => el.offsetParent !== null);
                if (focusables.length) focusables[0].focus();
              }
            }, 80);
            return prev;
          });
          return;
        }
      }

      // keep track for Enter+P and Enter+Tab combos
      keysPressed.current.add(e.key);
      if (e.key === "Enter") {
        // delegate to handler which checks pressed keys for Tab or P
        const set = keysPressed.current;
        // Enter+P
        if (set.has("p") || set.has("P")) {
          e.preventDefault();
          handleSave(true);
          return;
        }
        // Enter+Tab
        if (set.has("Tab")) {
          e.preventDefault();
          handleEnterActions(e, { tab: true });
          return;
        }
        // plain Enter
        handleEnterActions(e, {});
      }

      // ArrowDown: next focusable field (if caret at end or not an input/textarea)
      if (e.key === "ArrowDown") {
        const active = document.activeElement;
        let doNavigate = true;
        if (
          active &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        ) {
          const val = active.value || "";
          try {
            doNavigate = active.selectionEnd === val.length;
          } catch (err) {
            doNavigate = false;
          }
        }
        if (doNavigate) {
          e.preventDefault();
          const moved = (function () {
            const container = rootRef.current;
            if (!container) return false;
            const selector =
              "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])";
            const focusables = Array.from(
              container.querySelectorAll(selector)
            ).filter((el) => el.offsetParent !== null);
            const idx = focusables.indexOf(document.activeElement);
            if (idx >= 0 && idx < focusables.length - 1) {
              focusables[idx + 1].focus();
              return true;
            }
            return false;
          })();
          if (!moved) {
            setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
          }
        }
      }

      // ArrowUp: previous focusable field (if caret at start or not an input/textarea)
      if (e.key === "ArrowUp") {
        const active = document.activeElement;
        let doNavigate = true;
        if (
          active &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        ) {
          try {
            doNavigate = active.selectionStart === 0;
          } catch (err) {
            doNavigate = false;
          }
        }
        if (doNavigate) {
          e.preventDefault();
          const moved = (function () {
            const container = rootRef.current;
            if (!container) return false;
            const selector =
              "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])";
            const focusables = Array.from(
              container.querySelectorAll(selector)
            ).filter((el) => el.offsetParent !== null);
            const idx = focusables.indexOf(document.activeElement);
            if (idx > 0) {
              focusables[idx - 1].focus();
              return true;
            }
            return false;
          })();
          if (!moved) {
            setCurrentStep((s) => Math.max(s - 1, 0));
          }
        }
      }
    };

    const onKeyUp = (e) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length, handleSave]);

  // Auto-populate medicines when rDiagnosis changes (debounced)
  useEffect(() => {
    if (!rDiagnosis || rDiagnosis.trim().length < 3) return; // wait for meaningful input
    // don't overwrite manual medicines
    if (medicineAdvice && medicineAdvice.length > 0) return;

    const id = setTimeout(() => {
      autoPopulateFromComplaint(rDiagnosis);
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rDiagnosis]);

  // improved scoring: count token matches, prefer advices matching ALL tokens, add bonuses for symptom matches and exact name match
  const scoreAdvice = (adviceObj, q) => {
    const text = (
      (adviceObj.name || "") +
      " " +
      (adviceObj.desese_description || "") +
      " " +
      (adviceObj.type || "") +
      " " +
      (adviceObj.route || "") +
      " " +
      (adviceObj.symptoms || []).join(" ")
    ).toLowerCase();
    const tokens = (q || "").toLowerCase().split(/\W+/).filter(Boolean);
    if (!tokens.length) return { score: 0, matches: 0, matchedAll: false };
    let matches = 0;
    tokens.forEach((t) => {
      if (!t) return;
      if (text.includes(t)) matches += 1;
    });
    // bonus: symptoms match weight
    let symptomBonus = 0;
    if (Array.isArray(adviceObj.symptoms)) {
      const lowerSymptoms = adviceObj.symptoms.map((s) =>
        (s || "").toLowerCase()
      );
      tokens.forEach((t) => {
        if (lowerSymptoms.some((s) => s.includes(t))) symptomBonus += 1;
      });
    }
    // bonus for exact name match of whole query
    const exactName = (adviceObj.name || "").toLowerCase() === tokens.join(" ");
    let score = matches + symptomBonus;
    if (exactName) score += 2;
    const matchedAll = matches === tokens.length;
    // final score accentuates matchedAll
    if (matchedAll) score += 2;
    return { score, matches, matchedAll };
  };

  // Accept either a string query or an object (selected advice) to populate medicines/tests/advice
  // append: when true, merge into existing lists (used when multiple complaints selected)
  const autoPopulateFromComplaint = async (
    queryOrObject,
    force = false,
    append = false
  ) => {
    if (!queryOrObject || (!force && medicineAdvice.length > 0 && !append))
      return;
    setAutoPopulating(true);
    try {
      let advices = [];
      if (typeof queryOrObject === "object" && queryOrObject !== null) {
        advices = [queryOrObject];
      } else {
        const { data } = await api.get(`/api/v1/medical/search`, {
          params: { q: queryOrObject },
        });
        advices = data.advices || [];
      }
      if (!advices.length) return;
      // scoring if string query
      let selected = advices;
      if (typeof queryOrObject === "string") {
        const scored = advices.map((a) => ({
          a,
          ...scoreAdvice(a, queryOrObject),
        }));
        scored.sort((x, y) => {
          if (x.matchedAll && !y.matchedAll) return -1;
          if (!x.matchedAll && y.matchedAll) return 1;
          return (y.score || 0) - (x.score || 0);
        });
        selected = scored
          .filter((s) => s.score > 0)
          .slice(0, 12)
          .map((s) => ({
            ...s.a,
            _score: s.score,
            _matches: s.matches,
            _matchedAll: s.matchedAll,
          }));
        if (!selected.length) selected = advices.slice(0, 6);
      }

      // build medicines
      const meds = [];
      selected.forEach((t) => {
        if (Array.isArray(t.medicines) && t.medicines.length) {
          t.medicines.forEach((m) => {
            meds.push({
              name: m.name || m.label || t.name || "",
              type: m.type || t.type || "",
              dose: m.dose || t.dose || "",
              frequency: m.frequency || t.frequency || "",
              route: m.route || "mouth",
              duration: m.duration || "",
              notes: m.notes || "",
              selected: m.selected || false,
            });
          });
        } else {
          meds.push({
            name: t.name || "",
            type: t.type || "",
            dose: t.dose || "",
            frequency: t.frequency || "",
            route: t.route || "mouth",
            duration: t.duration || "",
            notes: t.notes || "",
            selected: t.selected || false,
          });
        }
      });

      if (append) {
        setMedicineAdvice((prev) => {
          const map = new Map();
          (prev || []).forEach((p) => {
            if (p && p.name) map.set(p.name, p);
          });
          meds.forEach((m) => {
            if (m && m.name) map.set(m.name, m);
          });
          return Array.from(map.values());
        });
      } else if (force) {
        setMedicineAdvice(meds);
      } else {
        setMedicineAdvice((prev) => (prev && prev.length ? prev : meds));
      }

      const tests = [];
      const medsText = [];
      let diet = "";
      selected.forEach((t) => {
        if (Array.isArray(t.testAdvice) && t.testAdvice.length)
          t.testAdvice.forEach((x) => tests.push(x));
        if (t.medication) medsText.push(t.medication);
        if (t.diet) diet = diet ? diet + "\n" + t.diet : t.diet;
      });

      if (tests.length) {
        setTestAdviceRows((prev) => {
          if (append) {
            const map = new Map();
            (prev || []).forEach((r) => {
              if (r && r.testName) map.set(r.testName, r);
            });
            tests.forEach((t) => {
              if (t && t.testName) map.set(t.testName, t);
            });
            return Array.from(map.values());
          }
          if (prev && prev.length && prev.some((r) => r.testName)) return prev;
          return tests;
        });
        setSelectedTestTypes((prev) =>
          Array.from(new Set([...(prev || []), "Test Advice", "Medication"]))
        );
      }
      if (medsText.length)
        setMedicationAdvice((prev) =>
          prev ? prev + "\n" + medsText.join("\n") : medsText.join("\n")
        );
      if (diet) setDietAdvice((prev) => (prev ? prev + "\n" + diet : diet));
    } catch (e) {
      // ignore
    } finally {
      setAutoPopulating(false);
    }
  };

  async function handleSave(printAfter = false) {
    let prescriptionSaved = false;
    try {
      if (!appointmentId)
        return alert("No appointment found to attach the prescription to.");
      // Build structured advice
      const adviceToSave = {};
      const selectedMedicines = medicineAdvice.filter((m) => m.selected);
      let selectedTests = [];
      if (selectedTestTypes.includes("Test Advice")) {
        selectedTests = testAdviceRows.filter(
          (r) => r.selected && r.testName && r.testName.trim() !== ""
        );
        adviceToSave.testAdvice = selectedTests;
      }
      if (selectedTestTypes.includes("Medication")) {
        adviceToSave.medication = medicationAdvice;
      }
      if (selectedTestTypes.includes("Diet")) {
        adviceToSave.diet = dietAdvice;
      }
      // validation: ensure something meaningful is present
      const diagnosysHasContent =
        diagnosys &&
        Object.keys(diagnosys).some(
          (k) => (diagnosys[k] || "").toString().trim() !== ""
        );
      const hasContent =
        (rDiagnosis && rDiagnosis.trim()) ||
        (Array.isArray(selectedMedicines) && selectedMedicines.length > 0) ||
        Object.keys(adviceToSave).length > 0 ||
        (pathologyReport && pathologyReport.trim()) ||
        (radiologyReport && radiologyReport.trim()) ||
        diagnosysHasContent;
      if (!hasContent) {
        snackbar.error(
          "Please add at least one of: Diagnosis, medicines or test advice before saving."
        );
        return;
      }
      const { data: saveResult } = await api.post(`/api/v1/prescription/save`, {
        patientId,
        doctorId: doctorId || undefined,
        appointmentId,
        medicalHistory,
        clinicalFindings: clinical_findings,
        provisionalDiagnosis: rDiagnosis,
        diagnosys_heading,
        presentingComplaints: complaints,
        pathologyReport,
        radiologyReport,
        femaleTests: {
          Gravida: gravida,
          Parity: `${parity.Pa || ""}+${parity.Pb || ""}`,
          LMP,
          EDD,
          POG,
          LCB,
          MOD,
        },
        vitals: diagnosys,
        medicines: selectedMedicines.map((m) => ({
          ...m,
          instruction: m.notes || m.instruction || m.instructions || "",
          notes: m.notes || m.instruction || m.instructions || "",
        })),
        advice: adviceToSave,
        additionalAdvice,
        followUp,
        prescriptionTemplate:
          localStorage.getItem("defaultPrescriptionTemplate") ||
          admin?.prescriptionTemplate ||
          "Template 3: Orthopedic Layout",
      });

      prescriptionSaved = true;

      // The save endpoint can resolve a doctor even when the form did not load one.
      // Use that resolved doctor as the recipient so the notification appears in their inbox.
      const notificationRecipient =
        saveResult?.prescription?.doctorId?._id ||
        saveResult?.prescription?.doctorId ||
        doctorId;
      if (notificationRecipient) {
        try {
          const previewUrl = `${window.location.origin}/preview/${patientId}`;
          await api.post(`/api/v1/message/send`, {
            firstName: "System",
            lastName: "Notification",
            email: "notifications@biomechasoft.in",
            phone: "0000000000",
            recipient: notificationRecipient,
            message: `Prescription completed for ${name || `patient NIC: ${nic}`}.\nDownload link: ${previewUrl}`,
          });
        } catch (msgErr) {
          console.warn("Failed to send doctor notification message", msgErr);
        }
      }
      playSaveSound();
      snackbar.success("Prescription saved");
      // refresh original snapshot to current state
      const savedSnap = buildNormalizedSnapshot({
        rDiagnosis,
        complaints,
        medicalHistory,
        pathologyReport,
        radiologyReport,
        clinical_findings,
        diagnosys_heading,
        gravida,
        parity,
        LMP,
        EDD,
        POG,
        LCB,
        MOD,
        diagnosys,
        additionalAdvice,
        followUp,
        medicineAdvice: selectedMedicines,
        testAdviceRows: selectedTests,
        medicationAdvice,
        dietAdvice,
      });
      setOriginalPayload(savedSnap);
      setIsDirty(false);
      if (printAfter) {
        if (onClose) onClose();
        navigate(`/preview/${patientId}`);
      } else {
        if (onClose) onClose();
      }
    } catch (e) {
      console.error("Failed to save prescription", e);
      if (prescriptionSaved) {
        snackbar.warning(
          "Prescription was saved, but the screen could not finish updating. Please refresh."
        );
      } else {
        snackbar.error(
          e?.response?.data?.message || "Failed to save prescription. Please try again."
        );
      }
    }
  }

  const handleSaveCatalog = async () => {
    // Top middle save catalog logic
    const catalogName = prompt("Enter a name for this Professional Diagnosis Catalog:", diagnosys_heading || "Provisional Diagnosis");
    if (!catalogName || !catalogName.trim()) return;

    try {
      const payload = {
        name: catalogName.trim(),
        symptoms: selectedComplaints.map((c) => (typeof c === "object" ? c.name : c)),
        medicines: medicineAdvice,
        testAdvice: testAdviceRows,
        diet: dietAdvice,
        medication: medicationAdvice,
      };

      await api.post("/api/v1/medical", payload);
      snackbar.success("Catalog saved successfully!");
      playSaveSound();
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to save catalog");
    }
  };

  const handleClose = () => {
    if (isDirty) {
      snackbar.confirm("You have unsaved changes. Discard and close?", () => {
        if (onClose) onClose();
      });
    } else {
      if (onClose) onClose();
    }
  };

  // const nextStep = () =>
  //   setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  // const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));
  // const goToStep = (i) => setCurrentStep(i);

  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // normalize to local date
  const todayStr = d.toISOString().split("T")[0];

  useEffect(() => {
    // compute BMI from Height (cm) and Weight (kg)
    let bmiValue = "";
    const heightInMeters = Number(diagnosys.Height) / 100;
    const weightInKg = Number(diagnosys.Weight);
    if (heightInMeters > 0 && weightInKg > 0) {
      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
      bmiValue = bmi;
    }
    // avoid unnecessary state updates
    if ((diagnosys.BMI || "") !== bmiValue) {
      setDiagnosys({ ...diagnosys, BMI: bmiValue });
      // console.log("Calculated BMI:", bmiValue);
    }
  }, [diagnosys.Height, diagnosys.Weight]);


  const getBmiStatus = (bmi) => {
    const val = parseFloat(bmi);
    if (!val || isNaN(val)) return { text: "", cls: "" };
    if (val < 18.5) return { text: "Underweight", cls: "underweight" };
    if (val < 25.0) return { text: "Normal", cls: "normal" };
    if (val < 30.0) return { text: "Overweight", cls: "overweight" };
    return { text: "Obese", cls: "obese" };
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: "50vh" }}>
        <span className="loader"></span>
        <p>Loading prescription...</p>
      </div>
    );
  }

  return (
    <div className="content-box" ref={rootRef}>
      {/* Integrated Modal Header */}
      <header className="pres-modal-header">
        <div className="pres-header-left">
          <div className="patient-avatar-badge">
            {name ? name.slice(0, 2).toUpperCase() : "PT"}
          </div>
          <div className="patient-info-wrap">
            <div className="patient-title-line">
              <h2 className="patient-name-text">{name || "Patient Prescription"}</h2>
            </div>
            <div className="patient-meta-row">
              <span className="patient-meta-chip highlight">
                {gender || "Patient"} • {age ? `${age} yrs` : "N/A"}
              </span>
              <span className="patient-meta-chip">
                Reg. No: {nic || formatPatientId(patientId)}
              </span>
              {appointmentId && (
                <span className="patient-meta-chip">
                  Appt: {formatAppointmentId(appointmentId)}
                </span>
              )}
              <span className="patient-meta-chip">
                Date: {todayStr}
              </span>
            </div>
          </div>
        </div>

        <div className="pres-header-actions">
          {isDirty ? (
            <span className="pres-status-badge dirty" title="You have unsaved changes">
              <span className="status-dot warning"></span> Unsaved
            </span>
          ) : (
            <span className="pres-status-badge clean" title="All changes are saved">
              <span className="status-dot success"></span> Saved
            </span>
          )}

          <button
            type="button"
            className="btn-save-catalog"
            onClick={handleSaveCatalog}
            title="Save current prescription as a reusable clinical catalog"
          >
            <FaSave /> Save Catalog
          </button>

          <div
            className="shortcuts-badge-btn"
            title="Keyboard Shortcuts:&#10;• Enter / Ctrl+Enter: Next field&#10;• Tab / Enter+Tab: Next section&#10;• Ctrl+P / Enter+P: Save & Print"
          >
            <FaKeyboard style={{ marginRight: "4px" }} /> Shortcuts
          </div>

          <button
            type="button"
            className="pres-modal-close-btn"
            onClick={handleClose}
            title="Close (Esc)"
            aria-label="Close Prescription Modal"
          >
            <IoIosClose />
          </button>
        </div>
      </header>

      {/* Main Prescription Body */}
      <div className="pres-form-body">
        {/* 1. Obstetric History Card (Females Only) */}
        {gender && gender.toLowerCase() === "female" && (
          <div className="pres-card obgyn-card">
            <div
              className="pres-card-header clickable"
              onClick={() => setObgynOpen((prev) => !prev)}
            >
              <div className="card-title-group">
                <span className="card-icon"><FaPersonPregnant /></span>
                <h3>Obstetric History (OB-GYN)</h3>
                {POG && <span className="pog-badge">{POG}</span>}
              </div>
              <span className="collapse-toggle-icon">
                {obgynOpen ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            </div>

            {obgynOpen && (
              <div className="pres-card-body">
                <div className="form-grid-4">
                  <div className="pres-form-group">
                    <label>Gravida</label>
                    <AutoSuggestInput
                      single
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={gravida}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setGravida(v);
                      }}
                      suggestions={Array.from({ length: 16 }, (_, i) => String(i))}
                      placeholder="G"
                    />
                  </div>

                  <div className="pres-form-group">
                    <label>Parity (Pa + Pb)</label>
                    <div className="segmented-parity-input">
                      <AutoSuggestInput
                        single
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={parity?.Pa}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          setParity({ ...parity, Pa: v });
                        }}
                        suggestions={Array.from({ length: 16 }, (_, i) => String(i))}
                        placeholder="Pa"
                      />
                      <span className="parity-plus-divider">+</span>
                      <AutoSuggestInput
                        single
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={parity?.Pb}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          setParity({ ...parity, Pb: v });
                        }}
                        suggestions={Array.from({ length: 16 }, (_, i) => String(i))}
                        placeholder="Pb"
                      />
                    </div>
                  </div>

                  <div className="pres-form-group">
                    <label>LMP (Last Menstrual Period)</label>
                    <input
                      type="date"
                      value={LMP}
                      onChange={(e) => setLMP(e.target.value)}
                    />
                  </div>

                  <div className="pres-form-group">
                    <label>EDD (Expected Delivery Date)</label>
                    <input
                      type="date"
                      value={EDD}
                      onChange={handleEddChange}
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="pres-form-group">
                    <label>LCB (Last Child Birth)</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 years ago"
                      value={LCB}
                      onChange={(e) => setLCB(e.target.value)}
                    />
                  </div>

                  <div className="pres-form-group">
                    <label>MOD (Mode of Delivery)</label>
                    <select value={MOD} onChange={(e) => setMOD(e.target.value)}>
                      <option value="">Select MOD</option>
                      <option value="NVD">NVD (Normal Vaginal Delivery)</option>
                      <option value="LUCS">LUCS (Lower Uterine C-Section)</option>
                    </select>
                  </div>

                  <div className="pres-form-group">
                    <label>POG (Period of Gestation)</label>
                    <div className="pog-display-box">
                      {POG || "Calculated from LMP / EDD"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Patient Vitals & Biometrics Card */}
        <div className="pres-card vitals-card">
          <div className="pres-card-header">
            <div className="card-title-group">
              <span className="card-icon"><FaHeartPulse /></span>
              <h3>Patient Vitals & Biometrics</h3>
            </div>
            <button
              type="button"
              style={{ padding: "4px 8px", fontSize: "12px", background: "#e0e7ff", color: "#4f46e5", border: "none", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              onClick={() => setDiagnosys(d => ({ ...d, BP: "120/80", PR: "75", SPO2: "98", Temp: "98.6" }))}
              title="Auto-populate normal vitals"
            >
              <FaNotesMedical /> Quick Fill Normal
            </button>
          </div>
          <div className="pres-card-body">
            <div className="vitals-grid">
              <div className="vital-input-box">
                <label>Blood Pressure</label>
                <div className="input-with-affix">
                  <input
                    type="text"
                    placeholder="120/80"
                    maxLength={7}
                    value={diagnosys.BP}
                    onChange={(e) =>
                      setDiagnosys({ ...diagnosys, BP: e.target.value })
                    }
                  />
                  <span className="unit-affix">mmHg</span>
                </div>
              </div>

              <div className="vital-input-box">
                <label>Pulse Rate</label>
                <div className="input-with-affix">
                  <input
                    type="number"
                    min="20"
                    max="500"
                    placeholder="72"
                    value={diagnosys.PR}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDiagnosys({ ...diagnosys, PR: v && v > 500 ? 500 : v });
                    }}
                  />
                  <span className="unit-affix">bpm</span>
                </div>
              </div>

              <div className="vital-input-box">
                <label>SpO₂ (Oxygen)</label>
                <div className="input-with-affix">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    inputMode="numeric"
                    placeholder="98"
                    value={diagnosys.SPO2}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDiagnosys({ ...diagnosys, SPO2: v && v > 100 ? 100 : v });
                    }}
                  />
                  <span className="unit-affix">% in RA</span>
                </div>
              </div>

              <div className="vital-input-box">
                <label>Temperature</label>
                <div className="input-with-affix">
                  <input
                    type="number"
                    min="50"
                    max="200"
                    placeholder="98.6"
                    value={diagnosys.Temp}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDiagnosys({ ...diagnosys, Temp: v && v > 200 ? 200 : v });
                    }}
                  />
                  <span className="unit-affix">°F</span>
                </div>
              </div>

              <div className="vital-input-box">
                <label>Height</label>
                <div className="input-with-affix">
                  <input
                    type="number"
                    min="30"
                    max="250"
                    placeholder="165"
                    value={diagnosys.Height}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDiagnosys({
                        ...diagnosys,
                        Height: v && v > 250 ? 250 : v,
                      });
                    }}
                  />
                  <span className="unit-affix">cm</span>
                </div>
              </div>

              <div className="vital-input-box">
                <label>Weight</label>
                <div className="input-with-affix">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    placeholder="65"
                    value={diagnosys.Weight}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDiagnosys({
                        ...diagnosys,
                        Weight: v && v > 300 ? 300 : v,
                      });
                    }}
                  />
                  <span className="unit-affix">kg</span>
                </div>
              </div>

              <div className="vital-input-box">
                <div className="label-with-pill">
                  <label>BMI</label>
                  {diagnosys.BMI && (
                    <span
                      className={`bmi-status-pill ${
                        getBmiStatus(diagnosys.BMI).cls
                      }`}
                    >
                      {getBmiStatus(diagnosys.BMI).text}
                    </span>
                  )}
                </div>
                <div className="input-with-affix">
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto Calculated"
                    value={diagnosys.BMI}
                  />
                  <span className="unit-affix">kg/m²</span>
                </div>
              </div>

              <div className="vital-input-box">
                <label>Other Clinical Notes</label>
                <div className="input-with-affix no-affix">
                  <input
                    type="text"
                    placeholder="e.g. RBS, Fasting Sugar..."
                    value={diagnosys.Others}
                    onChange={(e) =>
                      setDiagnosys({ ...diagnosys, Others: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Presenting Complaints Card */}
        <div className="pres-card complaints-card">
          <div className="pres-card-header">
            <div className="card-title-group">
              <span className="card-icon"><FaCommentMedical /></span>
              <h3>Presenting Complaints</h3>
            </div>
            <button
              type="button"
              className="refresh-ai-btn"
              title="Analyze complaints and fetch associated diagnoses"
              onClick={async () => {
                try {
                  const complaints_arr = complaints.split(",");
                  const complaints_arr_cln = complaints_arr.filter(
                    (c) => c.trim() !== ""
                  );

                  const diseases = [];
                  const uniqueDiseases = [];

                  for (const query of complaints_arr_cln) {
                    try {
                      const { data } = await api.get(
                        `/api/v1/medical/advance-search-symptoms`,
                        { params: { query } }
                      );
                      diseases.push(...data.results);
                    } catch (err) {
                      console.log("Failed to fetch advices for query:", query, err);
                    }
                  }

                  for (const d of diseases) {
                    if (!uniqueDiseases.includes(d)) {
                      uniqueDiseases.push(d);
                    }
                  }
                  dispatch(changeSdisease(uniqueDiseases));
                  snackbar.success("Associated diagnoses updated!");
                } catch (err) {
                  snackbar.error("Failed to process diagnoses");
                }
              }}
            >
              <TbRefresh />
              <span>Analyze & Suggest</span>
            </button>
          </div>

          <div className="pres-card-body">
            <div className="quick-chips-container">
              <span className="quick-chips-label">Quick Select:</span>
              {temp_complain.map((com) => (
                <button
                  key={com}
                  type="button"
                  className={`quick-chip ${
                    complaints.includes(com) ? "active" : ""
                  }`}
                  onClick={() => {
                    complaints.includes(com + ", ")
                      ? setComplaints(complaints.replace(com + ", ", ""))
                      : complaints.includes(com + ",")
                      ? setComplaints(complaints.replace(com + ",", ""))
                      : complaints.includes(com)
                      ? setComplaints(complaints.replace(com, ""))
                      : setComplaints(complaints + com + ", ");
                  }}
                >
                  {complaints.includes(com) ? (
                    <FaCheck style={{ marginRight: "4px", fontSize: "0.72rem" }} />
                  ) : (
                    "+ "
                  )}
                  {com}
                </button>
              ))}
            </div>

            <AutoSuggestInputforSymptom
              value={complaints || ""}
              onChange={(e) => setComplaints(e.target.value)}
              onSelect={(item, newValue) => setComplaints(newValue)}
              placeholder="Type to search or enter custom presenting complaints..."
            />
          </div>
        </div>

        {/* 4. Medical History Card */}
        <div className="pres-card history-card">
          <div
            className="pres-card-header clickable"
            onClick={() =>
              setToggleOpen({
                ...toggleOpen,
                medicalHistory: !toggleOpen.medicalHistory,
              })
            }
          >
            <div className="card-title-group">
              <span className="card-icon"><FaFileMedical /></span>
              <h3>Medical & Past History</h3>
            </div>
            <span className="collapse-toggle-icon">
              {toggleOpen.medicalHistory ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          </div>

          {toggleOpen.medicalHistory && (
            <div className="pres-card-body">
              <div className="quick-chips-container">
                <span className="quick-chips-label">Common Conditions:</span>
                {temp_medicalHistory.map((history) => (
                  <button
                    key={history}
                    type="button"
                    className={`quick-chip ${
                      medicalHistory.includes(history) ? "active" : ""
                    }`}
                    onClick={() => {
                      medicalHistory.includes(history + ", ")
                        ? setMedicalHistory(
                            medicalHistory.replace(history + ", ", "")
                          )
                        : medicalHistory.includes(history + ",")
                        ? setMedicalHistory(
                            medicalHistory.replace(history + ",", "")
                          )
                        : medicalHistory.includes(history)
                        ? setMedicalHistory(
                            medicalHistory.replace(history, "")
                          )
                        : setMedicalHistory(medicalHistory + history + ", ");
                    }}
                  >
                    {medicalHistory.includes(history) ? (
                      <FaCheck style={{ marginRight: "4px", fontSize: "0.72rem" }} />
                    ) : (
                      "+ "
                    )}
                    {history}
                  </button>
                ))}
              </div>
              <input
                placeholder="Enter medical history, comorbidities, previous surgeries..."
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* 5. Clinical Examination (On Examination) Card */}
        <div className="pres-card exam-card">
          <div
            className="pres-card-header clickable"
            onClick={() =>
              setToggleOpen({
                ...toggleOpen,
                clinicalFindings: !toggleOpen.clinicalFindings,
              })
            }
          >
            <div className="card-title-group">
              <span className="card-icon"><FaUserDoctor /></span>
              <h3>On Examination (Physical & Systemic Findings)</h3>
            </div>
            <span className="collapse-toggle-icon">
              {toggleOpen.clinicalFindings ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          </div>

          {toggleOpen.clinicalFindings && (
            <div className="pres-card-body">
              <div>
                <div className="exam-section-label">General Condition</div>
                <div className="form-grid-4">
                  <div className="pres-form-group">
                    <select
                      value={clinical_findings.patientCondition.c1}
                      onChange={(e) => {
                        setClinical_findings({
                          ...clinical_findings,
                          patientCondition: {
                            ...clinical_findings.patientCondition,
                            c1: e.target.value,
                          },
                        });
                      }}
                    >
                      <option value="">Consciousness</option>
                      <option value="Alert">Alert</option>
                    </select>
                  </div>
                  <div className="pres-form-group">
                    <select
                      value={clinical_findings.patientCondition.c2}
                      onChange={(e) => {
                        setClinical_findings({
                          ...clinical_findings,
                          patientCondition: {
                            ...clinical_findings.patientCondition,
                            c2: e.target.value,
                          },
                        });
                      }}
                    >
                      <option value="">Mental State</option>
                      <option value="Conscious">Conscious</option>
                      <option value="Semi conscious">Semi conscious</option>
                      <option value="Unconscious">Unconscious</option>
                    </select>
                  </div>
                  <div className="pres-form-group">
                    <select
                      value={clinical_findings.patientCondition.c3}
                      onChange={(e) => {
                        setClinical_findings({
                          ...clinical_findings,
                          patientCondition: {
                            ...clinical_findings.patientCondition,
                            c3: e.target.value,
                          },
                        });
                      }}
                    >
                      <option value="">Cooperation</option>
                      <option value="Co-operative">Co-operative</option>
                      <option value="Confused">Confused</option>
                      <option value="Drowsy">Drowsy</option>
                    </select>
                  </div>
                  <div className="pres-form-group">
                    <select
                      value={clinical_findings.patientCondition.c4}
                      onChange={(e) => {
                        setClinical_findings({
                          ...clinical_findings,
                          patientCondition: {
                            ...clinical_findings.patientCondition,
                            c4: e.target.value,
                          },
                        });
                      }}
                    >
                      <option value="">Appearance</option>
                      <option value="Active">Active</option>
                      <option value="Looking Toxic">Looking Toxic</option>
                      <option value="Ill-looking">Ill-looking</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="exam-section-label">General Signs</div>
                <div className="form-grid-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <div className="pres-form-group">
                    <label>Pallor</label>
                    <select
                      value={clinical_findings.polar}
                      onChange={(e) =>
                        setClinical_findings({
                          ...clinical_findings,
                          polar: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Pallor</option>
                      <option value="Absent">Absent</option>
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>

                  <div className="pres-form-group">
                    <label>Icterus</label>
                    <select
                      value={clinical_findings.icterus}
                      onChange={(e) =>
                        setClinical_findings({
                          ...clinical_findings,
                          icterus: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Icterus</option>
                      <option value="Absent">Absent</option>
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>

                  <div className="pres-form-group">
                    <label>Edema</label>
                    <select
                      value={clinical_findings.edema}
                      onChange={(e) =>
                        setClinical_findings({
                          ...clinical_findings,
                          edema: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Edema</option>
                      <option value="Absent">Absent</option>
                      <option value="Present">Present</option>
                      <option value="B/L Pedal">B/L Pedal</option>
                    </select>
                  </div>

                  <div className="pres-form-group">
                    <label>Cyanosis</label>
                    <select
                      value={clinical_findings.cyanosis}
                      onChange={(e) =>
                        setClinical_findings({
                          ...clinical_findings,
                          cyanosis: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Cyanosis</option>
                      <option value="Absent">Absent</option>
                      <option value="Present">Present</option>
                    </select>
                  </div>

                  <div className="pres-form-group">
                    <label>Clubbing</label>
                    <select
                      value={clinical_findings.clubbing}
                      onChange={(e) =>
                        setClinical_findings({
                          ...clinical_findings,
                          clubbing: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Clubbing</option>
                      <option value="Absent">Absent</option>
                      <option value="Present">Present</option>
                    </select>
                  </div>

                  <div className="pres-form-group">
                    <label>Lymph Nodes</label>
                    <select
                      value={clinical_findings.lymph_nodes}
                      onChange={(e) =>
                        setClinical_findings({
                          ...clinical_findings,
                          lymph_nodes: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Lymph Nodes</option>
                      <option value="Not Palpable">Not Palpable</option>
                      <option value="Palpable">Palpable</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="exam-section-label">Systemic Examination</div>
                <div className="form-grid-3">
                  <div className="pres-form-group">
                    <label>Chest</label>
                    <select
                      value={clinical_findings.chest}
                      onChange={(e) =>
                        setClinical_findings({
                          ...clinical_findings,
                          chest: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Chest Sound</option>
                      <option value="B/L VBS">B/L VBS</option>
                      <option value="Wheeze">Wheeze</option>
                      <option value="Crepitations">Crepitations</option>
                      <option value="Rhonchi/Wheeze">Rhonchi/Wheeze</option>
                    </select>
                  </div>

                  <div className="pres-form-group">
                    <label>CVS</label>
                    <select
                      value={clinical_findings.cvs}
                      onChange={(e) =>
                        setClinical_findings({
                          ...clinical_findings,
                          cvs: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Heart Sound</option>
                      <option value="S1,S2 normal">S1,S2 normal</option>
                      <option value="Mid-Diastolic murmur">Mid-Diastolic murmur</option>
                      <option value="Pansystolic murmur">Pansystolic murmur</option>
                      <option value="Mid-systolic murmur">Mid-systolic murmur</option>
                      <option value="Systolic murmur">Systolic murmur</option>
                      <option value="Diastolic murmur">Diastolic murmur</option>
                    </select>
                  </div>

                  <div className="pres-form-group">
                    <label>Per Abdomen</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        style={{ flex: 1 }}
                        value={clinical_findings.per_abdomen.pt}
                        onChange={(e) => {
                          setClinical_findings({
                            ...clinical_findings,
                            per_abdomen: {
                              ...clinical_findings.per_abdomen,
                              pt: e.target.value,
                            },
                          });
                        }}
                      >
                        <option value="">Tenderness</option>
                        <option value="Soft, Nontender">Soft, Nontender</option>
                        <option value="Tender">Tender</option>
                      </select>

                      <select
                        style={{ flex: 1 }}
                        value={clinical_findings.per_abdomen.pv}
                        onChange={(e) => {
                          setClinical_findings({
                            ...clinical_findings,
                            per_abdomen: {
                              ...clinical_findings.per_abdomen,
                              pv: e.target.value,
                            },
                          });
                        }}
                      >
                        {clinical_findings.per_abdomen.pt !== "Tender" ? (
                          <>
                            <option value="">Organomegaly</option>
                            <option value="No Organomegaly">No Organomegaly</option>
                            <option value="Hepatomegaly">Hepatomegaly</option>
                            <option value="Spleenomegaly">Spleenomegaly</option>
                            <option value="Hepatospleenomegaly">
                              Hepatospleenomegaly
                            </option>
                          </>
                        ) : (
                          <>
                            <option value="">Quadrant</option>
                            <option value="Epigastric">Epigastric</option>
                            <option value="hypogastric">hypogastric</option>
                            <option value="Umbilical">Umbilical</option>
                            <option value="RUQ">RUQ</option>
                            <option value="LUQ">LUQ</option>
                            <option value="RIF">RIF</option>
                            <option value="LIF">LIF</option>
                            <option value="Rt. Lumber">Rt. Lumber</option>
                            <option value="Lt. Lumber">Lt. Lumber</option>
                            <option value="Both Lumber">Both Lumber</option>
                            <option value="Lower Abd.">Lower Abd.</option>
                            <option value="Upper Abd.">Upper Abd.</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pres-form-group" style={{ marginTop: "12px" }}>
                  <label>Other Examination Findings</label>
                  <input
                    type="text"
                    placeholder="Enter any additional examination details..."
                    value={clinical_findings.others}
                    onChange={(e) =>
                      setClinical_findings({
                        ...clinical_findings,
                        others: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Available Test Reports Card (Before Diagnosis) */}
        <div className="pres-card available-reports-card">
          <div
            className="pres-card-header clickable"
            onClick={() =>
              setToggleOpen({
                ...toggleOpen,
                availableReports: !toggleOpen.availableReports,
              })
            }
          >
            <div className="card-title-group">
              <span className="card-icon"><FaFileLines /></span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                  Available Test Reports
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 400 }}>
                  Enter pathological and radiological reports brought by the patient
                </span>
              </div>
            </div>
            <span className="collapse-toggle-icon">
              {toggleOpen.availableReports ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          </div>

          {toggleOpen.availableReports && (
            <div className="pres-card-body">
              <div className="form-grid-2">
                <div className="pres-form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>
                    <FaVial className="report-tab-icon" /> Pathological Test Report
                  </label>
                  <textarea
                    rows={3}
                    className="pres-textarea"
                    placeholder="Enter available pathological / laboratory test reports (e.g. CBC: Hb 11.2, Platelets 2.5L, TLC 7800; LFT / KFT: Normal)..."
                    value={pathologyReport}
                    onChange={(e) => setPathologyReport(e.target.value)}
                  />
                </div>
                <div className="pres-form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>
                    <FaXRay className="report-tab-icon" /> Radiological Test Report
                  </label>
                  <textarea
                    rows={3}
                    className="pres-textarea"
                    placeholder="Enter available radiological test reports (e.g. Chest X-Ray: Clear lung fields; USG Abdomen: Mild Fatty Liver)..."
                    value={radiologyReport}
                    onChange={(e) => setRadiologyReport(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. Provisional Diagnosis Card */}
        <div className="pres-card diagnosis-card">
          <div className="pres-card-header">
            <div className="card-title-group">
              <span className="card-icon"><FaStethoscope /></span>
              <select
                className="diagnosis-type-select"
                value={diagnosys_heading}
                onChange={(e) => setDiagnosys_heading(e.target.value)}
              >
                <option value="Provisional Diagnosis">Provisional Diagnosis</option>
                <option value="Diagnosis">Confirmed Diagnosis</option>
                <option value="Diffential Diagnosis">Differential Diagnosis</option>
              </select>
            </div>

            <button
              type="button"
              className="refresh-ai-btn"
              title="Fetch treatment protocols and medicines based on diagnosis"
              onClick={async () => {
                try {
                  const rDiagnosis_arr = rDiagnosis.split(",");
                  const rDiagnosis_arr_cln = rDiagnosis_arr.filter(
                    (d) => d.trim() !== ""
                  );

                  const medicinesMap = new Map();

                  for (const query of rDiagnosis_arr_cln) {
                    try {
                      const { data } = await api.get(
                        `/api/v1/medical/suggestions/advices`,
                        { params: { q: query.trim(), limit: 20 } }
                      );

                      if (data.advices && Array.isArray(data.advices)) {
                        data.advices.forEach((a) => {
                          if (a.medicines && Array.isArray(a.medicines)) {
                            a.medicines.forEach((med) => {
                              const key = (med.name || "").toLowerCase().trim();
                              if (key && !medicinesMap.has(key)) {
                                medicinesMap.set(key, med);
                              }
                            });
                          }
                        });
                      }
                    } catch (err) {
                      console.log("Failed to fetch advices for query:", query, err);
                    }
                  }

                  const finalMedicines = Array.from(medicinesMap.values());
                  setMedicineAdvice(finalMedicines);
                  snackbar.success("Medicine advice loaded for diagnosis!");
                } catch (err) {
                  snackbar.error("Failed to process diagnoses");
                }
              }}
            >
              <TbRefresh />
              <span>Load Treatment Protocol</span>
            </button>
          </div>

          <div className="pres-card-body">
            <AutoSuggestInput
              value={rDiagnosis}
              onChange={(e) => {
                dispatch(change(e.target.value));
                setComplaintQuery(e.target.value);
                if (complainDebounceRef.current)
                  clearTimeout(complainDebounceRef.current);
                complainDebounceRef.current = setTimeout(async () => {
                  const val = e.target.value || "";
                  const lastToken = (val.split(",").pop() || "").trim();
                  if (!lastToken) {
                    setComplaintSuggestions([]);
                    return;
                  }
                  try {
                    setIsFetchingComplaints(true);
                    const { data } = await api.get(
                      `/api/v1/medical/suggestions/advices`,
                      { params: { q: lastToken, limit: 100 } }
                    );
                    setComplaintSuggestions(
                      (data.advices || []).map((a) => ({
                        ...a,
                        label: a.name,
                      }))
                    );
                  } catch (err) {
                    setComplaintSuggestions([]);
                  } finally {
                    setIsFetchingComplaints(false);
                  }
                }, 280);
              }}
              suggestions={
                complaintSuggestions.length
                  ? complaintSuggestions
                  : symptomSuggestions
              }
              placeholder="Type diagnosis (e.g. Acute Bronchitis, Type 2 Diabetes, Typhoid)..."
              onSelect={(item, newVal) => {
                const label =
                  item && typeof item === "object"
                    ? item.name || (typeof newVal === "string" ? newVal : "")
                    : typeof newVal === "string"
                    ? newVal
                    : item || "";
                setComplaintSuggestions([]);
                setSelectedComplaints((prev) => {
                  const names = new Set((prev || []).map((p) => p.name || p));
                  if (item && typeof item === "object") {
                    if (names.has(item.name)) return prev || [];
                    return [...(prev || []), item];
                  }
                  if (names.has(label)) return prev || [];
                  return [...(prev || []), label];
                });
                if (item && typeof item === "object")
                  autoPopulateFromComplaint(item, true, true);
                else autoPopulateFromComplaint(label, false, true);
              }}
            />

            {(selectedComplaints || []).length > 0 && (
              <div className="selected-complaints-tags">
                {selectedComplaints.map((c, i) => (
                  <div key={i} className="complaint-tag-pill">
                    <span>{typeof c === "string" ? c : c.name}</span>
                    <button
                      type="button"
                      className="complaint-tag-remove"
                      title="Remove"
                      onClick={() =>
                        setSelectedComplaints((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                    >
                      <BsTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 7. Medicine Advice Table Card */}
        <div className="pres-card medicine-card">
          <div className="pres-card-header">
            <div className="card-title-group">
              <span className="card-icon"><FaPills /></span>
              <h3>Prescription Medicines & Dosing</h3>
              <span className="patient-meta-chip highlight">
                {medicineAdvice.filter((m) => m.selected).length} of{" "}
                {medicineAdvice.length} Selected
              </span>
            </div>

            <button
              type="button"
              className="btn-add-med-row"
              onClick={() =>
                setMedicineAdvice([
                  ...medicineAdvice,
                  {
                    name: "",
                    type: "",
                    dose: "",
                    frequency: "",
                    route: "",
                    duration: "",
                    notes: "",
                    selected: true,
                  },
                ])
              }
            >
              + Add Medicine
            </button>
          </div>

          <div className="pres-card-body" style={{ padding: 0 }}>
            <div className="medicine-table-wrap">
              <table className="medicine-table">
                <thead>
                  <tr>
                    <th className="th-check">
                      <input
                        type="checkbox"
                        checked={
                          medicineAdvice.length > 0 &&
                          medicineAdvice.every((m) => m.selected)
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setMedicineAdvice(
                            medicineAdvice.map((m) => ({
                              ...m,
                              selected: checked,
                            }))
                          );
                        }}
                        title="Select/Deselect all medicines"
                      />
                    </th>
                    <th style={{ width: "24%" }}>Medicine Name</th>
                    <th style={{ width: "10%" }}>Form / Type</th>
                    <th style={{ width: "10%" }}>Dose</th>
                    <th style={{ width: "10%" }}>Route</th>
                    <th style={{ width: "12%" }}>Frequency</th>
                    <th style={{ width: "10%" }}>Duration</th>
                    <th style={{ width: "16%" }}>Instructions / Notes</th>
                    <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicineAdvice.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          textAlign: "center",
                          padding: "2rem",
                          color: "#94a3b8",
                        }}
                      >
                        No medicines added yet. Click "+ Add Medicine" or select a Diagnosis above to load a protocol.
                      </td>
                    </tr>
                  ) : (
                    medicineAdvice.map((m, idx) => (
                      <tr key={idx}>
                        <td className="td-check">
                          <input
                            type="checkbox"
                            checked={m.selected || false}
                            onChange={(e) => {
                              const copy = [...medicineAdvice];
                              copy[idx] = {
                                ...copy[idx],
                                selected: e.target.checked,
                              };
                              setMedicineAdvice(copy);
                            }}
                          />
                        </td>
                        <td>
                          <AutoSuggestInput
                            single
                            placeholder="Medicine name"
                            value={m.name || ""}
                            suggestions={medSuggestions.medicines}
                            onChange={(e) => {
                              const copy = [...medicineAdvice];
                              copy[idx] = { ...copy[idx], name: e.target.value };
                              setMedicineAdvice(copy);
                            }}
                            onSelect={(item, label) => {
                              const copy = [...medicineAdvice];
                              if (item && typeof item === "object") {
                                copy[idx] = {
                                  ...copy[idx],
                                  name: item.name || label || copy[idx].name,
                                  type: item.type || copy[idx].type,
                                  dose: item.dose || copy[idx].dose,
                                  frequency: item.frequency || copy[idx].frequency,
                                  route: item.route || copy[idx].route,
                                  duration: item.duration || copy[idx].duration,
                                  notes: item.notes || copy[idx].notes,
                                  selected: item.selected !== undefined ? item.selected : true,
                                };
                              } else {
                                copy[idx] = {
                                  ...copy[idx],
                                  name: label || item,
                                  selected: true,
                                };
                              }
                              setMedicineAdvice(copy);
                            }}
                          />
                        </td>
                        <td>
                          <AutoSuggestInput
                            single
                            placeholder="Type"
                            value={m.type || ""}
                            suggestions={medSuggestions.lists.types}
                            onChange={(e) => {
                              const copy = [...medicineAdvice];
                              copy[idx] = { ...copy[idx], type: e.target.value };
                              setMedicineAdvice(copy);
                            }}
                          />
                        </td>
                        <td>
                          <AutoSuggestInput
                            single
                            placeholder="Dose"
                            value={m.dose || ""}
                            suggestions={medSuggestions.lists.doses}
                            onChange={(e) => {
                              const copy = [...medicineAdvice];
                              copy[idx] = { ...copy[idx], dose: e.target.value };
                              setMedicineAdvice(copy);
                            }}
                          />
                        </td>
                        <td>
                          <AutoSuggestInput
                            single
                            placeholder="Route"
                            value={m.route || ""}
                            suggestions={medSuggestions.lists.routes}
                            onChange={(e) => {
                              const copy = [...medicineAdvice];
                              copy[idx] = { ...copy[idx], route: e.target.value };
                              setMedicineAdvice(copy);
                            }}
                          />
                        </td>
                        <td>
                          <AutoSuggestInput
                            single
                            placeholder="Frequency"
                            value={m.frequency || ""}
                            suggestions={medSuggestions.lists.frequencies}
                            onChange={(e) => {
                              const copy = [...medicineAdvice];
                              copy[idx] = {
                                ...copy[idx],
                                frequency: e.target.value,
                              };
                              setMedicineAdvice(copy);
                            }}
                          />
                        </td>
                        <td>
                          <AutoSuggestInput
                            single
                            placeholder="Duration"
                            value={m.duration || ""}
                            suggestions={medSuggestions.lists.durations}
                            onChange={(e) => {
                              const copy = [...medicineAdvice];
                              copy[idx] = {
                                ...copy[idx],
                                duration: e.target.value,
                              };
                              setMedicineAdvice(copy);
                            }}
                          />
                        </td>
                        <td>
                          <AutoSuggestInput
                            single
                            placeholder="e.g. After meals"
                            value={m.notes || ""}
                            suggestions={medSuggestions.lists.notes}
                            onChange={(e) => {
                              const copy = [...medicineAdvice];
                              copy[idx] = {
                                ...copy[idx],
                                notes: e.target.value,
                              };
                              setMedicineAdvice(copy);
                            }}
                          />
                        </td>
                        <td>
                          <div className="medicine-table-actions">
                            <button
                              type="button"
                              className="tbl-icon-btn delete"
                              title="Delete row"
                              onClick={() => {
                                const copy = [...medicineAdvice];
                                copy.splice(idx, 1);
                                setMedicineAdvice(copy);
                              }}
                            >
                              <BsTrash />
                            </button>
                            {m.name &&
                              !medSuggestions.medicines.find(
                                (med) =>
                                  med.name.toLowerCase() ===
                                  m.name.toLowerCase()
                              ) && (
                                <button
                                  type="button"
                                  className="tbl-icon-btn save-master"
                                  title="Save this new medicine to Master Database"
                                  onClick={() => {
                                    dispatch(
                                      addMedicineRequest({ name: m.name })
                                    );
                                    snackbar.success(
                                      `Medicine "${m.name}" saved to database!`
                                    );
                                  }}
                                >
                                  <FaSave />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="medicine-table-footer-controls">
                <button
                  type="button"
                  className="btn-add-med-row"
                  onClick={() =>
                    setMedicineAdvice([
                      ...medicineAdvice,
                      {
                        name: "",
                        type: "",
                        dose: "",
                        frequency: "",
                        route: "",
                        duration: "",
                        notes: "",
                        selected: true,
                      },
                    ])
                  }
                >
                  + Add Medicine
                </button>
                {medicineAdvice.length > 0 && (
                  <button
                    type="button"
                    className="btn-clear-all-meds"
                    onClick={() => setMedicineAdvice([])}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 8. Diagnostic Tests Advice Card */}
        <div className="pres-card tests-card">
          <div className="pres-card-header">
            <div className="card-title-group">
              <span className="card-icon"><FaVials /></span>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", margin: 0 }}>
                <input
                  type="checkbox"
                  value="Test Advice"
                  checked={selectedTestTypes.includes("Test Advice")}
                  onChange={(e) => handleCheckboxToggle(e, "Test Advice")}
                  style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--pres-primary)" }}
                />
                <h3>Diagnostic Lab Tests & Investigations</h3>
              </label>
            </div>

            {selectedTestTypes.includes("Test Advice") && (
              <button
                type="button"
                className="btn-add-med-row"
                onClick={addNewTestAdviceRow}
              >
                + Add Test
              </button>
            )}
          </div>

          {selectedTestTypes.includes("Test Advice") && (
            <div className="pres-card-body">
              <table className="test-advice-table">
                <tbody>
                  {testAdviceRows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ width: "36px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) =>
                            handleTestAdviceChange(
                              idx,
                              "selected",
                              e.target.checked
                            )
                          }
                          style={{ width: "17px", height: "17px", cursor: "pointer", accentColor: "var(--pres-primary)" }}
                        />
                      </td>
                      <td>
                        <AutoSuggestInput
                          single
                          placeholder="Search or enter diagnostic test name (e.g. CBC, USG Abdomen, Lipid Profile)..."
                          value={row.testName}
                          suggestions={testSuggestions}
                          onChange={(e) =>
                            handleTestAdviceChange(
                              idx,
                              "testName",
                              e.target.value
                            )
                          }
                          onSelect={(item, label) => {
                            if (item && typeof item === "object") {
                              handleTestAdviceChange(
                                idx,
                                "testName",
                                item.name || label
                              );
                              handleTestAdviceChange(
                                idx,
                                "testType",
                                item.category || item.testType || ""
                              );
                              handleTestAdviceChange(
                                idx,
                                "precautions",
                                item.precautions || ""
                              );
                              handleTestAdviceChange(
                                idx,
                                "testDate",
                                item.testDate || ""
                              );
                            } else {
                              handleTestAdviceChange(
                                idx,
                                "testName",
                                label || item
                              );
                            }
                          }}
                        />
                      </td>
                      <td style={{ width: "40px" }}>
                        <button
                          type="button"
                          className="tbl-icon-btn delete"
                          title="Delete test row"
                          onClick={() => {
                            const copy = [...testAdviceRows];
                            copy.splice(idx, 1);
                            setTestAdviceRows(copy);
                          }}
                        >
                          <BsTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                className="btn-add-med-row"
                onClick={addNewTestAdviceRow}
                style={{ width: "fit-content", marginTop: "6px" }}
              >
                + Add Another Test
              </button>
            </div>
          )}
        </div>

        {/* 9. Clinical Advice & Patient Instructions Card */}
        <div className="pres-card advice-card">
          <div className="pres-card-header">
            <div className="card-title-group">
              <span className="card-icon"><FaLightbulb /></span>
              <h3>Clinical Care Advice & Diet Instructions</h3>
            </div>

            <button
              type="button"
              className="save-advice-template-btn"
              disabled={!additionalAdvice || !additionalAdvice.trim()}
              onClick={async () => {
                const text = additionalAdvice.trim();
                if (!text) return;
                const adviceName = prompt("Enter a title for this reusable Advice Template:");
                if (!adviceName || !adviceName.trim()) return;
                try {
                  await api.post("/api/v1/advice", {
                    name: adviceName.trim(),
                    advice: text,
                  });
                  snackbar.success("Advice template saved successfully!");
                  playSaveSound();
                } catch (err) {
                  snackbar.error("Failed to save advice template");
                }
              }}
              title="Save current advice text as a reusable template in Care Advice settings"
            >
              <FaSave /> Save as Template
            </button>
          </div>

          <div className="pres-card-body">
            <AutoSuggestInput
              value={additionalAdvice}
              onChange={(e) => {
                const words = e.target.value.trim().split(/\s+/);
                if (words.length > 100 && words[0] !== "") {
                  setAdditionalAdvice(words.slice(0, 100).join(" "));
                  if (snackbar && snackbar.error) snackbar.error("Advice is limited to 100 words.");
                } else {
                  setAdditionalAdvice(e.target.value);
                }
              }}
              suggestions={adviceSuggestions}
              placeholder="Search or enter care guidelines, dietary restrictions, precautions..."
            />
          </div>
        </div>

        {/* 10. Next Follow-Up Scheduling Card */}
        <div className="pres-card followup-card">
          <div className="pres-card-header">
            <div className="card-title-group">
              <span className="card-icon"><FaCalendarCheck /></span>
              <h3>Next Follow-Up Date</h3>
            </div>
          </div>

          <div className="pres-card-body">
            <div className="form-grid-3">
              <div className="pres-form-group">
                <input
                  type="date"
                  min={todayStr}
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Elevated Sticky Action Footer */}
      <footer className="pres-modal-footer">
        <div className="footer-left">
          <button
            type="button"
            className="footer-cancel-btn"
            onClick={handleClose}
          >
            Cancel / Close
          </button>
          {isDirty ? (
            <span className="footer-status-indicator dirty">
              <TbLoader3 className="spin-icon" /> Unsaved changes
            </span>
          ) : (
            <span className="footer-status-indicator clean">
              <FaCheck style={{ marginRight: "4px", fontSize: "0.85rem" }} /> All changes saved
            </span>
          )}
        </div>

        <div className="footer-right">
          <button
            type="button"
            className="footer-save-draft-btn"
            onClick={() => handleSave(false)}
          >
            <FaSave /> Save Draft
          </button>
          <button
            type="button"
            className="footer-primary-print-btn"
            onClick={() => handleSave(true)}
            title="Save prescription and generate printable preview (Ctrl+P)"
          >
            <BsPrinter /> Save & Print <kbd>Ctrl+P</kbd>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Prescription;
