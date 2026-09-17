import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../utils/api";
import Modal from "react-modal";
// @ts-ignore
import jsPDF from "jspdf";
import {
  dobToAge,
  dobToAgeParts,
  formatAge,
  ageToDob,
} from "../utils/ageUtils";
import { useSnackbar } from "../context/SnackbarContext";
import "./Appointment.css";
import { useNavigate } from "react-router-dom";
import { GoArrowLeft } from "react-icons/go";
import { BsArrowLeft } from "react-icons/bs";

const Appointment = () => {
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  // const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [dob, setDob] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [ageDays, setAgeDays] = useState("");
  const [gender, setGender] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [department, setDepartment] = useState("Pediatrics");
  const [doctorFirstName, setDoctorFirstName] = useState("");
  const [doctorLastName, setDoctorLastName] = useState("");
  const [profession, setProfession] = useState("");
  const [address, setAddress] = useState("");
  const [_id, set_id] = useState("");
  const [hasVisited, setHasVisited] = useState(false);
  const [price, setPrice] = useState(0);
  const [doctorFee, setDoctorFee] = useState(100);
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
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  const [downloadInvoice, setDownloadInvoice] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceFields, setInvoiceFields] = useState({
    address: "",
    doctorFee: 100,
    price: 0,
    paymentStatus: "Pending",
  });
  const [step, setStep] = useState(1);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [searchNameOrPhone, setSearchNameOrPhone] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const suggestRef = useRef();
  const suggestTimer = useRef();
  const formRef = useRef(null);
  const keysPressed = useRef(new Set());

  const departmentsArray = [
    "Pediatrics",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Oncology",
    "Radiology",
    "Physical Therapy",
    "Dermatology",
    "ENT",
  ];

  const professions = [
    "Farmer",
    "Toto Driver",
    "Laborer / Day Laborer",
    "Teacher",
    "Professor",
    "Student",
    "Housewife/Homemaker",
    "Shopkeeper",
    "Driver (auto, truck, taxi)",
    "Clerk",
    "Police personnel",
    "Army personnel",
    "Businessman",
    "Sweeper/Sanitation worker",
    "Tailor",
    "Barber",
    "Electrician",
    "Plumber",
    "Mechanic",
    "Mason",
    "Painter",
    "Fisherman",
    "Watchman/Security guard",
    "Nurse",
    "Doctor",
    "Engineer",
    "Technician",
    "Imam",
    "Vendor (street, market)",
    "Unemployed",
    "Retired",
  ];
  const [doctors, setDoctors] = useState([]);
  const [dashboardUser, setDashboardUser] = useState(null);
  const [canBook, setCanBook] = useState(false);
  const dispatch = useDispatch();
  const appointmentState = useSelector((s) => s.appointment);
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get(`/api/v1/user/doctors`);
        setDoctors(data.doctors || []);
      } catch (err) {
        snackbar.error(
          err?.response?.data?.message || "Failed to fetch doctors",
        );
      }
    };
    fetchDoctors();
    // check dashboard session
    const checkDashboard = async () => {
      try {
        const { data: res } = await api.get(`/api/v1/user/dashboard/me`);
        setDashboardUser(res.user);
        setCanBook(["Admin", "Doctor", "Compounder"].includes(res.user.role));
      } catch (e) {
        setDashboardUser(null);
        setCanBook(false);
      }
    };
    checkDashboard();
  }, []);

  // keyboard navigation inside the appointment form
  useEffect(() => {
    const selector =
      "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])";

    const getFocusable = (container) => {
      if (!container) return [];
      return Array.from(container.querySelectorAll(selector)).filter(
        (el) => el.offsetParent !== null,
      );
    };

    const focusNext = (active) => {
      const container = formRef.current;
      if (!container) return false;
      const focusables = getFocusable(container);
      const idx = focusables.indexOf(active);
      if (idx >= 0 && idx < focusables.length - 1) {
        focusables[idx + 1].focus();
        return true;
      }
      return false;
    };

    const focusPrev = (active) => {
      const container = formRef.current;
      if (!container) return false;
      const focusables = getFocusable(container);
      const idx = focusables.indexOf(active);
      if (idx > 0) {
        focusables[idx - 1].focus();
        return true;
      }
      return false;
    };

    const onKeyDown = (e) => {
      const active = document.activeElement;
      // only handle when focus is inside the form
      if (!formRef.current || !formRef.current.contains(active)) return;

      // track pressed keys for combos
      keysPressed.current.add(e.key);

      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd+V -> save & print (scoped)
      if (isCtrl && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        setDownloadInvoice(true);
        setTimeout(() => handleAppointment(), 50);
        return;
      }

      // allow native behavior for buttons, links, selects and checkboxes/radios
      if (active) {
        const tag = active.tagName;
        const type = active.type || "";
        if (tag === "TEXTAREA") return;
        if (tag === "BUTTON" || tag === "A" || tag === "SELECT") return;
        if (tag === "INPUT" && (type === "checkbox" || type === "radio"))
          return;
      }

      // Enter handling: plain Enter -> next field; Enter+Tab -> next step
      if (e.key === "Enter") {
        // detect Enter+Tab combo via keysPressed
        const hasTab = keysPressed.current.has("Tab");
        if (hasTab) {
          e.preventDefault();
          setStep((s) => Math.min(s + 1, 4));
          return;
        }
        e.preventDefault();
        const moved = focusNext(active);
        if (!moved) {
          setStep((s) => Math.min(s + 1, 4));
        }
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const moved = focusNext(active);
        if (!moved) setStep((s) => Math.min(s + 1, 4));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const moved = focusPrev(active);
        if (!moved) setStep((s) => Math.max(s - 1, 1));
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setStep((s) => Math.min(s + 1, 4));
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setStep((s) => Math.max(s - 1, 1));
        return;
      }
    };

    const onKeyUp = (e) => {
      // remove from pressed set
      keysPressed.current.delete(e.key);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [formRef]);

  // set default appointment date to today (yyyy-mm-dd)
  useEffect(() => {
    if (!appointmentDate) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setAppointmentDate(`${yyyy}-${mm}-${dd}`);
    }
  }, []);

  // auto-generate NIC if missing when phone changes
  // useEffect(() => {
  //   if (!nic && phone) {
  //     const base = (phone + Date.now().toString()).replace(/\D/g, "");
  //     setNic(base.slice(0, 13).padEnd(13, "0"));
  //   }
  // }, [phone]);

  useEffect(() => {
    if (!dashboardUser || !doctors.length) return;

    let filteredDoctors = [];
    if (dashboardUser.role === "Admin") {
      filteredDoctors = doctors;
    } else if (dashboardUser.role === "Doctor") {
      filteredDoctors = doctors.filter((doc) => doc._id === dashboardUser._id);
    } else if (dashboardUser.role === "Compounder") {
      const assignedIds = (dashboardUser.assignedDoctors || []).map((doc) =>
        doc._id ? doc._id.toString() : doc.toString()
      );
      filteredDoctors = doctors.filter((doc) =>
        assignedIds.includes(doc._id ? doc._id.toString() : doc.toString())
      );
    }

    setDoctorList(filteredDoctors);

    if (filteredDoctors.length > 0) {
      set_id(filteredDoctors[0]._id);
    } else {
      set_id("");
    }
  }, [dashboardUser, doctors]);

  useEffect(() => {
    if (_id) {
      const d = doctors.find((doc) => doc._id === _id);
      if (d) {
        setDoctorFirstName(d.firstName);
        setDoctorLastName(d.lastName);
        setDoctorFee(d.consultationFee || 100);
        setPrice(Math.round((d.consultationFee || 100) * 0.2));
        if (d.doctorDepartment) {
          setDepartment(d.doctorDepartment);
        }
      }
    }
  }, [_id, doctors]);

  const handleNextStep = () => {
    if (!name || !name.trim()) {
      snackbar.error("Please enter Patient Full Name.");
      return;
    }
    if (!gender) {
      snackbar.error("Please select Gender.");
      return;
    }
    if (!phone || phone.trim().length !== 10) {
      snackbar.error("Please enter a valid 10-digit Phone Number.");
      return;
    }
    if (!address || !address.trim()) {
      snackbar.error("Please enter Address.");
      return;
    }
    setStep(2);
  };

  const printAppointmentReceipt = ({
    name,
    phone,
    doctorFirstName,
    doctorLastName,
    department,
    price,
    doctorFee,
    paymentStatus,
    receiptNo,
  }) => {
    try {
      const now = new Date();
      const dateTimeFormatted = now.toLocaleString("en-GB", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      });

      const apptFee = Number(price) || 0;
      const docFee = Number(doctorFee) || 0;
      const totalAmount = apptFee + docFee;
      const rNo = receiptNo || `INV-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-6)}`;
      
      const printedByName = (dashboardUser?.firstName || dashboardUser?.lastName)
        ? `${dashboardUser.firstName || ""} ${dashboardUser.lastName || ""}`.trim()
        : (dashboardUser?.name || "Admin");

      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Receipt ${rNo}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #2d3748; max-width: 650px; margin: 0 auto; line-height: 1.5; background: #fff; }
      .receipt-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background: #ffffff; }
      .header { text-align: center; border-bottom: 2px solid #edf2f7; padding-bottom: 16px; margin-bottom: 20px; }
      .header h1 { margin: 0; color: #1a202c; font-size: 22px; font-weight: 700; }
      .header p { margin: 4px 0 0; color: #718096; font-size: 14px; }
      .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; font-size: 14px; }
      .detail-item strong { color: #4a5568; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
      .detail-item span { color: #1a202c; }
      .table-section { margin-bottom: 20px; }
      .table-section h3 { margin: 0 0 10px 0; color: #1a202c; font-size: 16px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
      th { background: #f7fafc; padding: 10px; text-align: left; border-bottom: 2px solid #edf2f7; color: #4a5568; font-weight: 600; }
      td { padding: 10px; border-bottom: 1px solid #edf2f7; }
      .totals { text-align: right; margin-top: 16px; font-size: 14px; }
      .totals .grand-total { font-size: 18px; font-weight: bold; color: #2b6cb0; margin-top: 8px; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #e6fffa; color: #234e52; }
      .badge-unpaid { background: #fef3c7; color: #92400e; }
      .footer-print-info { margin-top: 24px; padding-top: 12px; border-top: 1px dashed #e2e8f0; font-size: 11.5px; color: #718096; text-align: right; }
    </style>
  </head>
  <body>
    <div class="receipt-card">
      <div class="header">
        <h1>Medical Appointment Receipt</h1>
        <p>Receipt #: ${rNo}</p>
      </div>
      <div class="details-grid">
        <div class="detail-item">
          <strong>Patient Name</strong>
          <span>${name || "-"}</span>
        </div>
        <div class="detail-item">
          <strong>Doctor Name</strong>
          <span>Dr. ${doctorFirstName || ""} ${doctorLastName || ""}</span>
        </div>
        <div class="detail-item">
          <strong>Department</strong>
          <span>${department || "-"}</span>
        </div>
        <div class="detail-item">
          <strong>Date & Time</strong>
          <span>${dateTimeFormatted}</span>
        </div>
        <div class="detail-item">
          <strong>Phone / Contact</strong>
          <span>${phone || "N/A"}</span>
        </div>
        <div class="detail-item">
          <strong>Payment Status</strong>
          <span class="badge ${paymentStatus === "Paid" ? "" : "badge-unpaid"}">${paymentStatus === "Paid" ? "Paid" : "Unpaid"}</span>
        </div>
      </div>

      <div class="table-section">
        <h3>Fee Details</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Consultation Fee</td>
              <td style="text-align:center">1</td>
              <td style="text-align:right">₹${docFee}</td>
              <td style="text-align:right">₹${docFee}</td>
            </tr>
            <tr>
              <td>Platform Fee</td>
              <td style="text-align:center">1</td>
              <td style="text-align:right">₹${apptFee}</td>
              <td style="text-align:right">₹${apptFee}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="totals">
        <div class="grand-total">Total Payable: ₹${totalAmount}</div>
      </div>

      <div class="footer-print-info">
        Printed By: <strong>${printedByName}</strong> (${dateTimeFormatted})
      </div>
    </div>
    <script>
      window.onload = function() {
        window.print();
      };
    </script>
  </body>
</html>`;

      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 60000);
    } catch (err) {
      console.error("Failed to print receipt:", err);
    }
  };

  const handleAppointment = async (e, printAfter = false) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      // Name parsing logic
      let firstName = "";
      let lastName = "";
      if (name && name.trim()) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
          firstName = parts[0];
          lastName = "";
        } else if (parts.length === 2) {
          firstName = parts[0];
          lastName = parts[1];
        } else if (parts.length > 2) {
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        }
      }
      const hasVisitedBool = Boolean(hasVisited);

      // Calculate BMI if height and weight are available
      let bmiValue = "";
      const heightInMeters = Number(diagnosys.Height) / 100;
      const weightInKg = Number(diagnosys.Weight);
      if (heightInMeters > 0 && weightInKg > 0) {
        const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
        bmiValue = bmi;
      }

      // Append units to diagnosys fields for the payload
      const diagnosysForPayload = {
        BP: diagnosys.BP ? diagnosys.BP : undefined,
        PR: diagnosys.PR ? diagnosys.PR : undefined,
        SPO2: diagnosys.SPO2 ? diagnosys.SPO2 : undefined,
        Temp: diagnosys.Temp ? diagnosys.Temp : undefined,
        Height: diagnosys.Height ? diagnosys.Height : undefined,
        Weight: diagnosys.Weight ? diagnosys.Weight : undefined,
        BMI: bmiValue ? bmiValue : undefined,
        Others: diagnosys.Others ? diagnosys.Others : undefined,
      };

      const payload = {
        firstName: firstName,
        lastName: lastName || "Not Confirmed",
        name,
        // email: email || undefined,
        phone,
        nic: nic || undefined,
        dob: dob || undefined,
        // send numeric years for backend compatibility; prefer ageYears then fallback to undefined
        age:
          ageYears !== "" && ageYears !== null && ageYears !== undefined
            ? Number(ageYears)
            : undefined,
        gender,
        appointment_date: appointmentDate
          ? new Date(appointmentDate).toISOString()
          : undefined,
        department,
        doctorId: _id || undefined,
        hasVisited: hasVisitedBool,
        profession,
        address,
        price: Number(price) || 0,
        doctorFee: Number(doctorFee) || 0,
        // send paymentStatus to backend and let backend decide status according to centralized rules
        paymentStatus,
        // do not set status from frontend creation; backend will harmonize (Paid -> Accepted at creation)
        status: undefined,
        // match backend schema keys and casing
        result: { diagnosys: diagnosysForPayload },
      };
      // payload prepared for appointment creation
      if (!canBook)
        return snackbar.error(
          "Only Admin/Doctor/Compounder may create appointments. Please login to dashboard.",
        );

      if (printAfter) {
        printAppointmentReceipt({
          name,
          phone,
          doctorFirstName,
          doctorLastName,
          department,
          price: Number(price) || 0,
          doctorFee: Number(doctorFee) || 0,
          paymentStatus,
        });
      }

      // dispatch redux action to create appointment (saga handles download)
      console.log("Creating appointment with payload:", payload);
      dispatch({
        type: "appointment/createAppointmentRequest",
        payload: { payload, download: downloadInvoice },
      });
      navigate("/");
      // Let saga handle success. Saga will toast. We listen to appointmentState below to reset.
    } catch (error) {
      // show friendly error to user
      snackbar.error(
        error?.response?.data?.message ||
          "An error occurred. Please try again.",
      );
    }
  };

  // reset form on successful appointment creation
  useEffect(() => {
    if (appointmentState && appointmentState.lastCreated) {
      setName("");
      // setEmail("");
      setPhone("");
      setNic("");
      setDob("");
      setAgeYears("");
      setAgeMonths("");
      setAgeDays("");
      setGender("");
      setAppointmentDate("");
      setDepartment("Pediatrics");
      setDoctorFirstName("");
      setDoctorLastName("");
      setHasVisited(false);
      setProfession("");
      setAddress("");
      set_id("");
      setPrice(0);
      setDiagnosys({
        BP: "",
        PR: "",
        SPO2: "",
        Temp: "",
        Height: "",
        Weight: "",
        BMI: "",
        Others: "",
      });
      setDownloadInvoice(false);
      setStep(1);
    }
  }, [appointmentState.lastCreated]);

  const handlePrefillFromVisited = async () => {
    if (!searchNameOrPhone)
      return snackbar.error("Enter name or phone to search");
    try {
      const q = encodeURIComponent(searchNameOrPhone);
      // use api helper (axios instance) instead of undefined globals
      const { data } = await api.get(`/api/v1/appointment/search`, {
        params: { q },
      });
      const appt = data.appointments[0];
      if (appt) {
        setName(
          appt.name || `${appt.firstName || ""} ${appt.lastName || ""}`.trim(),
        );
        // setEmail(appt.email || "");
        setPhone(appt.phone || "");
        setNic(appt.nic || "");
        if (appt.dob) {
          const iso = new Date(appt.dob).toISOString().slice(0, 10);
          setDob(iso);
          const parts = dobToAgeParts(iso);
          if (parts) {
            setAgeYears(parts.years);
            setAgeMonths(parts.months);
            setAgeDays(parts.days);
          }
        } else if (appt.age) {
          // if only numeric age is available, set years and clear months/days
          setAgeYears(appt.age);
          setAgeMonths("");
          setAgeDays("");
        }
        setProfession(appt.profession || "");
        setAddress(appt.address || "");
        setDepartment(appt.department || department);
        if (appt.doctorId) set_id(appt.doctorId);
        snackbar.success("Prefilled from previous appointment");
      }
    } catch (err) {
      snackbar.error(
        err?.response?.data?.message || "No previous appointment found",
      );
    }
  };

  // simple focus navigation: Enter -> next focusable, Shift+Enter -> previous
  const handleKeyNavigation = (e) => {
    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const form = formRef.current;
      if (!form) return;
      const focusable = Array.from(
        form.querySelectorAll("input,select,textarea,button"),
      ).filter((el) => !el.disabled && el.type !== "hidden");
      const idx = focusable.indexOf(document.activeElement);
      if (e.shiftKey) {
        const prev = focusable[Math.max(0, idx - 1)];
        if (prev) prev.focus();
      } else {
        const next = focusable[Math.min(focusable.length - 1, idx + 1)];
        if (next) {
          // if next is a button to change step, trigger step change
          if (next.dataset && next.dataset.step) {
            setStep(Number(next.dataset.step));
            next.focus();
          } else {
            next.focus();
          }
        }
      }
    }
  };
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // normalize to local date
  const todayStr = d.toISOString().split("T")[0];

  return (
    <>
      <section className="page">
        <div className="back-btn-box">
          <button className="arrow-btn" onClick={() => navigate("/")}>
            <BsArrowLeft />
          </button>
        </div>
        <div className="appointment-card">
          <div className="appointment-header">
            {/* <img src="/logo.png" alt="PathologyLab Logo" className="appointment-logo" /> */}
            <h2>Appointment</h2>
          </div>
          <div className="mb-05rem appointment-step">
            <small>Step {step} of 2</small>
            <small>Shortcut: Ctrl/Cmd+P to submit & download</small>
          </div>
          <p className="form-legend mt-0">
            <span className="required-star">*</span> Indicates required field
          </p>
          <form
            className="appointment-form"
            ref={formRef}
            onKeyDown={handleKeyNavigation}
            onSubmit={handleAppointment}
          >
            <div className="has-visited-box ">
              <div className="checkbox-container">
                <p className="font-1rem mb-0">Have you visited before?</p>
                <input
                  type="checkbox"
                  checked={hasVisited}
                  onChange={(e) => setHasVisited(e.target.checked)}
                />
              </div>
              {/* {hasVisited && (
                <div className="search-container">
                  <input
                    type="search"
                    placeholder="Search by name or phone"
                    value={searchNameOrPhone}
                    onChange={(e) => setSearchNameOrPhone(e.target.value)}
                  />
                  <button type="button" onClick={handlePrefillFromVisited}>
                    Search
                  </button>
                </div>
              )} */}
            </div>
            {step === 1 && (
              <div className="position-relative">
                {showPatientSuggestions &&
                  patientSuggestions &&
                  patientSuggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "3rem",
                        background: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        zIndex: 1200,
                        maxHeight: 220,
                        overflowY: "auto",
                      }}
                    >
                      {patientSuggestions.map((p) => (
                        <div
                          key={p._id}
                          style={{
                            padding: "8px 10px",
                            borderBottom: "1px solid #eee",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            snackbar.success("Prefilled existing patient");
                            // autofill fields
                            setName(p.name || "");
                            setPhone(p.phone || "");
                            setNic(p.nic || "");
                            if (p.profession) setProfession(p.profession);
                            if (p.address) setAddress(p.address);
                            // fill dob/age/gender if present (but do NOT override appointmentDate)
                            if (p.dob) {
                              const iso = new Date(p.dob)
                                .toISOString()
                                .slice(0, 10);
                              setDob(iso);
                              const parts = dobToAgeParts(iso);
                              if (parts) {
                                setAgeYears(String(parts.years || ""));
                                setAgeMonths(String(parts.months || ""));
                                setAgeDays(String(parts.days || ""));
                              }
                            } else if (p.age) {
                              setAgeYears(String(p.age || ""));
                              setAgeMonths("");
                              setAgeDays("");
                            }
                            if (p.gender) setGender(p.gender);
                            // mark as visited (we found existing patient)
                            setHasVisited(true);
                            setShowPatientSuggestions(false);
                          }}
                        >
                          <div className="fw-600">{p.name}</div>
                          <div className="muted font-13">
                            {p.phone ||
                              p.email ||
                              p.profession ||
                              p.address ||
                              ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                <div className="lnr-input-box">
                  <div className="form-group" ref={suggestRef}>
                    <label htmlFor="">
                      Full Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      className="w-100"
                      value={name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setName(v);
                        // debounce suggestions
                        if (suggestTimer.current)
                          clearTimeout(suggestTimer.current);
                        if (!v || v.trim().length < 2) {
                          setPatientSuggestions([]);
                          setShowPatientSuggestions(false);
                          return;
                        }
                        suggestTimer.current = setTimeout(async () => {
                          try {
                            const q = encodeURIComponent(v);
                            const { data } = await api.get(
                              `/api/v1/appointment/suggest`,
                              { params: { q, limit: 8 } },
                            );
                            setPatientSuggestions(data.patients || []);
                            setShowPatientSuggestions(true);
                          } catch (err) {
                            setPatientSuggestions([]);
                            setShowPatientSuggestions(false);
                          }
                        }, 300);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="">
                      Gender <span className="required-star">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Select Gender *</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>
                <div className="lnr-input-box">
                  <div className="form-group">
                    <label htmlFor="">
                      Enter your age <span className="optional-tag">(Optional)</span>:
                    </label>
                    <div className="age-grid">
                      <input
                        type="number"
                        placeholder="Years (Optional)"
                        min={0}
                        value={ageYears}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, "");
                          setAgeYears(v && v > 150 ? 150 : v);
                          // compute DOB from parts
                          const y = Number(v) || 0;
                          const m = Number(ageMonths) || 0;
                          const d = Number(ageDays) || 0;
                          const computed = (() => {
                            // subtract y/m/d from today
                            const dt = new Date();
                            dt.setFullYear(dt.getFullYear() - y);
                            // subtract months
                            const month = dt.getMonth() - m;
                            dt.setMonth(month);
                            // subtract days
                            dt.setDate(dt.getDate() - d);
                            dt.setMinutes(
                              dt.getMinutes() - dt.getTimezoneOffset(),
                            );
                            return dt.toISOString().slice(0, 10);
                          })();
                          setDob(computed);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Months (Optional)"
                        min={0}
                        max={12}
                        value={ageMonths}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, "");
                          setAgeMonths(v && v > 12 ? 12 : v);
                          const y = Number(ageYears) || 0;
                          const m = Number(v) || 0;
                          const d = Number(ageDays) || 0;
                          const dt = new Date();
                          dt.setFullYear(dt.getFullYear() - y);
                          dt.setMonth(dt.getMonth() - m);
                          dt.setDate(dt.getDate() - d);
                          dt.setMinutes(
                            dt.getMinutes() - dt.getTimezoneOffset(),
                          );
                          setDob(dt.toISOString().slice(0, 10));
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Days (Optional)"
                        min={0}
                        max={31}
                        value={ageDays}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, "");
                          setAgeDays(v && v > 31 ? 31 : v);
                          const y = Number(ageYears) || 0;
                          const m = Number(ageMonths) || 0;
                          const d = Number(v) || 0;
                          const dt = new Date();
                          dt.setFullYear(dt.getFullYear() - y);
                          dt.setMonth(dt.getMonth() - m);
                          dt.setDate(dt.getDate() - d);
                          dt.setMinutes(
                            dt.getMinutes() - dt.getTimezoneOffset(),
                          );
                          setDob(dt.toISOString().slice(0, 10));
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="">
                      Phone Number <span className="required-star">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="\d{10}"
                      placeholder="10-digit Mobile Number *"
                      value={phone}
                      onChange={(e) => {
                        const v = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setPhone(v);
                      }}
                    />
                  </div>
                </div>
                <div className="lnr-input-box">
                  <div className="form-group mb-0">
                    <label htmlFor="">
                      Profession <span className="optional-tag">(Optional)</span>:
                    </label>
                    <select
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                    >
                      <option value="">Select Profession (Optional)</option>
                      {professions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label htmlFor="">
                      Address <span className="required-star">*</span>
                    </label>
                    <textarea
                      className="address-box"
                      rows="1"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Area, Village/City, P.O, P.S, District, PIN code *"
                    />
                  </div>
                </div>
                <div className="btn-container">
                  <button
                    className="btn-cls next-btn"
                    type="button"
                    data-step="2"
                    onClick={handleNextStep}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="vitals-grid">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="BP (e.g., 120/80) (Optional)"
                      maxLength={7}
                      value={diagnosys.BP}
                      onChange={(e) =>
                        setDiagnosys((d) => ({ ...d, BP: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="number"
                      placeholder="PR (bpm) (Optional)"
                      min="20"
                      max="500"
                      value={diagnosys.PR}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDiagnosys((d) => ({
                          ...d,
                          PR: v && v > 500 ? 500 : v,
                        }));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="number"
                      placeholder="SPO2 (% in RA) (Optional)"
                      min="0"
                      max="100"
                      inputMode="numeric"
                      value={diagnosys.SPO2}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDiagnosys((d) => ({
                          ...d,
                          SPO2: v && v > 100 ? 100 : v,
                        }));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="number"
                      placeholder="Temp (F) (Optional)"
                      min="50"
                      max="200"
                      value={diagnosys.Temp}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDiagnosys((d) => ({
                          ...d,
                          Temp: v && v > 200 ? 200 : v,
                        }));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="number"
                      placeholder="Height (cm) (Optional)"
                      min="30"
                      max="250"
                      value={diagnosys.Height}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDiagnosys((d) => ({
                          ...d,
                          Height: v && v > 250 ? 250 : v,
                        }));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="number"
                      placeholder="Weight (kg) (Optional)"
                      min="1"
                      max="300"
                      value={diagnosys.Weight}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDiagnosys((d) => ({
                          ...d,
                          Weight: v && v > 300 ? 300 : v,
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="lnr-input-box">
                  <div className="form-group">
                    <label className="d-block mb-1 font-14">
                      Department <span className="required-star">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={true}
                    >
                      {Array.from(
                        new Set([
                          ...departmentsArray,
                          ...(department ? [department] : []),
                        ])
                      ).map((depart) => (
                        <option value={depart} key={depart}>
                          {depart}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="d-block mb-1 font-14">
                      Select Doctor <span className="required-star">*</span>
                    </label>
                    <select
                      value={_id}
                      onChange={(e) => set_id(e.target.value)}
                      disabled={
                        dashboardUser && dashboardUser.role === "Doctor"
                      }
                    >
                      <option value="">Select Doctor *</option>
                      {doctorList.map((doctor) => (
                        <option value={doctor._id} key={doctor._id}>
                          {doctor.firstName} {doctor.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="lnr-input-box">
                  <div className="form-group">
                    <label className="d-block mb-1 font-14">
                      Others / Notes <span className="optional-tag">(Optional)</span>
                    </label>
                    <textarea
                      rows="2"
                      value={diagnosys.Others}
                      onChange={(e) =>
                        setDiagnosys((d) => ({ ...d, Others: e.target.value }))
                      }
                      placeholder="Others (Optional)"
                    />
                  </div>
                  <div className="form-group">
                    <label className="d-block mb-1 font-14">
                      Appointment Date <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      placeholder="Appointment Date *"
                      min={todayStr}
                      value={appointmentDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAppointmentDate(v && v < todayStr ? todayStr : v);
                      }}
                    />
                  </div>
                </div>

                <div className="fees-detail-box">
                  <div className="fees-inputs-grid">
                    <div className="fee-input-group">
                      <label>Appointment Fee (Rs):</label>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value) || 0)}
                        className="fee-input"
                      />
                    </div>

                    <div className="fee-input-group">
                      <label>Doctor Fee (Rs):</label>
                      <input
                        type="number"
                        min="0"
                        value={doctorFee}
                        onChange={(e) => setDoctorFee(Number(e.target.value) || 0)}
                        className="fee-input"
                      />
                    </div>

                    <div className="fee-input-group total-box">
                      <label>Total (Rs):</label>
                      <span className="total-fee-val">₹{(Number(price) || 0) + (Number(doctorFee) || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="invoice-container">
                  <div className="checkbox-container">
                    <div className="pay-status-box">
                      <label htmlFor="">Payment Status: </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        style={{ cursor: "pointer" }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="btn-container">
                  <button
                    type="button"
                    className="btn-cls"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="btn-cls"
                    type="button"
                    onClick={() => {
                      setInvoiceFields({
                        address,
                        doctorFee,
                        price,
                        paymentStatus,
                      });
                      setShowInvoicePreview(true);
                    }}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="btn-cls save-btn"
                    onClick={(e) => handleAppointment(e, false)}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-cls save-print-btn"
                    onClick={(e) => handleAppointment(e, true)}
                  >
                    Save & Print
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Complete Appointment Preview Modal */}
      <Modal
        isOpen={showInvoicePreview}
        onRequestClose={() => setShowInvoicePreview(false)}
        contentLabel="Appointment Preview"
        style={{
          overlay: { zIndex: 1000, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" },
          content: {
            maxWidth: "760px",
            maxHeight: "90vh",
            overflowY: "auto",
            margin: "auto",
            borderRadius: "16px",
            padding: "2rem",
            border: "none",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            background: "#ffffff",
          },
        }}
      >
        <div className="preview-modal-header">
          <div className="preview-header-brand">
            <img src="/logo.svg" alt="logo" className="preview-logo" />
            <div>
              <h2 className="preview-title">Appointment Preview</h2>
              <p className="preview-subtitle">Verify all patient, clinical & billing details before saving</p>
            </div>
          </div>
          <button
            type="button"
            className="preview-close-btn"
            onClick={() => setShowInvoicePreview(false)}
          >
            ×
          </button>
        </div>

        <div className="preview-modal-body">
          {/* Section 1: Patient Information */}
          <div className="preview-section">
            <h3 className="preview-section-title">
              <span className="preview-section-badge">1</span> Patient Information
            </h3>
            <div className="preview-grid-3">
              <div className="preview-item">
                <span className="preview-label">Patient Name:</span>
                <span className="preview-val fw-bold">{name || "-"}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Gender:</span>
                <span className="preview-val">{gender || "-"}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Age / DOB:</span>
                <span className="preview-val">
                  {dob
                    ? formatAge(dobToAgeParts(dob))
                    : ageYears
                      ? `${ageYears} yrs ${ageMonths ? `${ageMonths}m ` : ""}${ageDays ? `${ageDays}d` : ""}`
                      : "-"}
                </span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Phone Number:</span>
                <span className="preview-val">{phone || "-"}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Profession:</span>
                <span className="preview-val">{profession || "-"}</span>
              </div>
              <div className="preview-item col-span-2">
                <span className="preview-label">Address:</span>
                <span className="preview-val">{address || "-"}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Doctor & Schedule */}
          <div className="preview-section">
            <h3 className="preview-section-title">
              <span className="preview-section-badge">2</span> Doctor & Schedule
            </h3>
            <div className="preview-grid-3">
              <div className="preview-item">
                <span className="preview-label">Doctor Name:</span>
                <span className="preview-val fw-bold">Dr. {doctorFirstName || ""} {doctorLastName || ""}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Department:</span>
                <span className="preview-val">{department || "-"}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Appointment Date:</span>
                <span className="preview-val">{appointmentDate || "-"}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Valid Up To:</span>
                <span className="preview-val">
                  {(() => {
                    if (!appointmentDate) return "-";
                    const d = new Date(appointmentDate);
                    if (isNaN(d.getTime())) return "-";
                    d.setDate(d.getDate() + 2);
                    return d.toISOString().slice(0, 10);
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Vitals & Notes */}
          <div className="preview-section">
            <h3 className="preview-section-title">
              <span className="preview-section-badge">3</span> Clinical Vitals & Notes
            </h3>
            <div className="preview-vitals-wrap">
              <div className="preview-vital-chip"><strong>BP:</strong> {diagnosys.BP || "-"}</div>
              <div className="preview-vital-chip"><strong>Pulse (PR):</strong> {diagnosys.PR ? `${diagnosys.PR} bpm` : "-"}</div>
              <div className="preview-vital-chip"><strong>SPO2:</strong> {diagnosys.SPO2 ? `${diagnosys.SPO2}%` : "-"}</div>
              <div className="preview-vital-chip"><strong>Temp:</strong> {diagnosys.Temp ? `${diagnosys.Temp}°F` : "-"}</div>
              <div className="preview-vital-chip"><strong>Height:</strong> {diagnosys.Height ? `${diagnosys.Height} cm` : "-"}</div>
              <div className="preview-vital-chip"><strong>Weight:</strong> {diagnosys.Weight ? `${diagnosys.Weight} kg` : "-"}</div>
              {(() => {
                const heightInMeters = Number(diagnosys.Height) / 100;
                const weightInKg = Number(diagnosys.Weight);
                if (heightInMeters > 0 && weightInKg > 0) {
                  const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
                  return <div className="preview-vital-chip"><strong>BMI:</strong> {bmi}</div>;
                }
                return null;
              })()}
            </div>
            {diagnosys.Others && (
              <div className="preview-notes-box">
                <span className="preview-label">Other Clinical Notes:</span>
                <p className="preview-notes-text">{diagnosys.Others}</p>
              </div>
            )}
          </div>

          {/* Section 4: Billing Summary */}
          <div className="preview-section">
            <h3 className="preview-section-title">
              <span className="preview-section-badge">4</span> Billing & Payment Summary
            </h3>
            <div className="preview-billing-box">
              <div className="preview-billing-row">
                <span>Appointment Booking Fee:</span>
                <span className="fw-semibold">₹{Number(price) || 0}</span>
              </div>
              <div className="preview-billing-row">
                <span>Doctor Consultation Fee:</span>
                <span className="fw-semibold">₹{Number(doctorFee) || 0}</span>
              </div>
              <div className="preview-billing-row total-row">
                <span>Total Amount:</span>
                <span className="preview-total-val">₹{(Number(price) || 0) + (Number(doctorFee) || 0)}</span>
              </div>
              <div className="preview-billing-row preview-payment-info-row">
                <span>Payment Mode: <strong>Cash</strong></span>
                <span className="preview-pay-badge-wrap">
                  Payment Status: 
                  <span className={`preview-status-pill ${paymentStatus === "Paid" ? "paid" : "pending"}`}>
                    {paymentStatus}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="preview-modal-footer">
          <button
            type="button"
            className="preview-btn-secondary"
            onClick={() => setShowInvoicePreview(false)}
          >
            ← Back to Edit
          </button>

          <button
            type="button"
            className="preview-btn-save"
            onClick={(e) => {
              setShowInvoicePreview(false);
              handleAppointment(e, false);
            }}
          >
            Save
          </button>

          <button
            type="button"
            className="preview-btn-save-print"
            onClick={(e) => {
              setShowInvoicePreview(false);
              handleAppointment(e, true);
            }}
          >
            Save & Print
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Appointment;
