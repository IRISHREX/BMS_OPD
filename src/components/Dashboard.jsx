import React, { useContext, useEffect, useState } from "react";
import InvoiceViewer from "./InvoiceViewer";
import Reports from "./Reports";
import { Context } from "../main";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import api, { rescheduleAppointment } from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { GoCheckCircleFill } from "react-icons/go";
import { AiFillCloseCircle } from "react-icons/ai";
import { FaUserMd, FaUsers } from "react-icons/fa";
import Prescription from "./Prescription";
import Modal from "react-modal";
import { FaTrash } from "react-icons/fa";
import RequirePermission from "./RequirePermission";
import {
  MdOutlineContentPasteSearch,
  MdOutlineDelete,
  MdSchedule,
} from "react-icons/md";
import { RiCalendarScheduleFill } from "react-icons/ri";
import { FaEye } from "react-icons/fa";
import { IoReceipt } from "react-icons/io5";
import useSound from "use-sound";
import RescheduleModal from "./RescheduleModal";
import DashboardSlotChecker from "./DashboardSlotChecker";
import {
  playSaveSound,
  playLoadSound,
  playDeleteSound,
} from "../utils/soundUtils";
import "./Dashboard.css";
import { RiExpandHorizontalSFill } from "react-icons/ri";
import { FaPrescriptionBottleMedical } from "react-icons/fa6";
import { IoIosShareAlt } from "react-icons/io";
import CreateReferralTab from "./tabs/CreateReferralTab";
import RadialMenu from "./RadialMenu";
import useClickSound from "../hooks/useClickSound";
import { RiExpandVerticalLine } from "react-icons/ri";

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [filterOption, setFilterOption] = useState("Today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // For text search
  const [selectedDoctorId, setSelectedDoctorId] = useState(""); // For doctor filter
  const navigate = useNavigate();
  const location = useLocation();
  const [doctors, setDoctors] = useState([]); // For total count card
  const [doctorFilterList, setDoctorFilterList] = useState([]); // For dropdown
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  // const [filterPrescibed, setFilterPrescibed] = useState({
  //   status: "Completed",
  //   prescribed: "filterPrescibed",
  // });
  const [filterPrescibed, setfilterPrescibed] = useState("Unprescribed");
  const setupClickSound = useClickSound();

  const fmt = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };
  // Modal and prescription state
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatientData, setSelectedPatientData] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointmentToReschedule, setSelectedAppointmentToReschedule] =
    useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [slotCheckerOpen, setSlotCheckerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(
    () => typeof window !== "undefined" && window.innerWidth > 900
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsExpanded(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { isAuthenticated, admin } = useContext(Context);
  const snackbar = useSnackbar();
  // Note: Sound file should be in the `public` directory.
  const [playDeleteSound] = useSound("/delete.mp3");
  const [playSettledSound] = useSound("/settled.mp3");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await api.get(`/api/v1/appointment/getall`);
        setAppointments(data.appointments);
      } catch (error) {
        setAppointments([]);
      }
    };
    fetchAppointments();

    const onUpdated = () => fetchAppointments();
    window.addEventListener("appointments:updated", onUpdated);
    return () => window.removeEventListener("appointments:updated", onUpdated);
  }, [location.pathname]);

  // Role-limited metrics
  const metrics = React.useMemo(() => {
    const now = new Date();
    const todayYmd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toLocaleDateString("en-CA");
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const getDoctorId = (appt) => {
      if (!appt) return null;
      if (appt.doctor && (appt.doctor._id || appt.doctor.id))
        return String(appt.doctor._id || appt.doctor.id);
      if (appt.doctorId) return String(appt.doctorId);
      return null;
    };

    const isVisible = (appt) => {
      if (!admin || !admin.role) return true;
      if (admin.role === "Admin") return true;
      if (admin.role === "Doctor")
        return String(getDoctorId(appt)) === String(admin._id);
      if (admin.role === "Compounder") {
        const assigned = (admin.assignedDoctors || []).map((d) =>
          String(d._id || d),
        );
        return assigned.includes(String(getDoctorId(appt)));
      }
      return true;
    };

    let patientsToday = new Set();
    let paidToday = 0;
    let patientsMonth = new Set();
    let paidMonth = 0;

    (appointments || []).forEach((a) => {
      try {
        if (!isVisible(a)) return;
        const d = new Date(a.appointment_date);
        const ymd = d.toLocaleDateString("en-CA");
        const price = Number(a.price || a.feesAmount || a.amount || 0) || 0;
        const paid = String(a.paymentStatus || "").toLowerCase() === "paid";

        if (ymd === todayYmd) {
          if (a.patientId) patientsToday.add(String(a.patientId));
          if (paid) paidToday += price;
        }

        if (d >= monthStart && d <= monthEnd) {
          if (a.patientId) patientsMonth.add(String(a.patientId));
          if (paid) paidMonth += price;
        }
      } catch (e) {}
    });

    return {
      patientsViewedToday: patientsToday.size,
      paidToday,
      patientsThisMonth: patientsMonth.size,
      paidThisMonth: paidMonth,
    };
  }, [appointments, admin]);

  const handleUpdatePaymentStatus = async (appointmentId, paymentStatus) => {
    try {
      // send only paymentStatus and let backend harmonize status/payment according to rules
      const body = { paymentStatus };
      const { data } = await api.put(
        `/api/v1/appointment/status/${appointmentId}`,
        body,
      );
      const updated = data.appointment || null;
      if (updated) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === appointmentId ? updated : a)),
        );
      } else {
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === appointmentId
              ? { ...a, paymentStatus: paymentStatus }
              : a,
          ),
        );
      }
      playSaveSound();
      snackbar.success(data.message || "Payment status updated");
      if (paymentStatus === "Paid") {
        playSettledSound();
      }
    } catch (e) {
      snackbar.error(
        e?.response?.data?.message || "Failed to update payment status",
      );
    }
  };

  // Set up doctor filter list based on user role
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get(`/api/v1/user/doctors`);
        setDoctors(data.doctors || []);

        if (admin && admin.role) {
          if (admin.role === "Admin") {
            setDoctorFilterList(data.doctors || []);
            setSelectedDoctorId(""); // Admin can see all by default
          } else if (admin.role === "Doctor") {
            setDoctorFilterList(data.doctors || []);
            setSelectedDoctorId(admin._id); // Doctor sees only their own
            setfilterPrescibed("Unprescribed");
          } else if (admin.role === "Compounder") {
            // Compounder sees only their assigned doctors
            const assignedDoctorIds = (admin.assignedDoctors || []).map(
              (d) => d._id,
            );
            const assignedDoctorsList = (data.doctors || []).filter((doc) =>
              assignedDoctorIds.includes(doc._id),
            );
            setDoctorFilterList(assignedDoctorsList);
            if (assignedDoctorsList.length > 0) {
              setSelectedDoctorId(assignedDoctorsList[0]._id); // Default to first assigned doctor
            } else {
              setSelectedDoctorId("");
            }
          }
        }
      } catch (error) {
        snackbar.error(
          error.response?.data?.message || "Failed to fetch doctors",
        );
        setDoctors([]);
        setDoctorFilterList([]);
      }
    };
    if (isAuthenticated && admin) {
      fetchDoctors();
    }
  }, [isAuthenticated, admin]);

  // Delete single appointment by ID
  const handleDeleteAppointment = async (id) => {
    snackbar.confirm("Delete this appointment?", async () => {
      try {
        await api.delete(`/api/v1/appointment/delete/${id}`);
        setAppointments((prev) => prev.filter((a) => a._id !== id));
        setSelectedAppointments((prev) => prev.filter((x) => x !== id));
        playDeleteSound();
        snackbar.success("Appointment deleted");
      } catch (err) {
        snackbar.error("Delete failed");
      }
    });
  };

  // Bulk delete selected appointments
  const handleBulkDelete = async () => {
    if (selectedAppointments.length === 0) {
      return snackbar.info("No appointments selected");
    }
    snackbar.confirm(
      `Delete ${selectedAppointments.length} appointments?`,
      async () => {
        try {
          await api.post(`/api/v1/appointment/bulk-delete`, {
            ids: selectedAppointments,
          });
          setAppointments((prev) =>
            prev.filter((a) => !selectedAppointments.includes(a._id)),
          );
          setSelectedAppointments([]);
          playDeleteSound();
          snackbar.success("Bulk delete complete");
        } catch (err) {
          snackbar.error("Bulk delete failed");
        }
      },
    );
  };

  // Toggle select for bulk delete
  const toggleSelectAppointment = (id) => {
    setSelectedAppointments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      // Let backend enforce rules. When requesting Completed, backend will ensure paymentStatus is Paid.
      // If requesting Completed from UI, include paymentStatus: 'Paid' so harmonizeStatusPayment accepts Completed
      const body =
        status === "Completed" ? { status, paymentStatus: "Paid" } : { status };
      const { data } = await api.put(
        `/api/v1/appointment/status/${appointmentId}`,
        body,
      );
      const updatedAppt = data.appointment || null;
      if (updatedAppt) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === appointmentId ? updatedAppt : a)),
        );
      }
      playSaveSound();
      snackbar.success(data.message || "Status updated");
      if (updatedAppt && updatedAppt.paymentStatus === "Paid") {
        playSettledSound();
      }
    } catch (error) {
      snackbar.error(error.response.data.message);
    }
  };

  const [invoicesList, setInvoicesList] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);

  const handleInvoiceClick = async (appointmentId) => {
    try {
      const { data } = await api.get(
        `/api/v1/invoice/appointment/${appointmentId}`,
      );
      let invoices = [];
      if (Array.isArray(data.invoices)) {
        invoices = data.invoices;
      } else if (Array.isArray(data.invoice)) {
        invoices = data.invoice;
      } else if (data.invoices) {
        invoices = [data.invoices];
      } else if (data.invoice) {
        invoices = [data.invoice];
      } else if (Array.isArray(data)) {
        invoices = data;
      } else if (data && data._id) {
        invoices = [data];
      }

      if (!invoices || invoices.length === 0) {
        snackbar.info("No invoice found for this appointment");
        return;
      }

      const inv = invoices[0];
      const printUrl = `/api/v1/invoice/${inv._id || inv.id}/download`;

      const resp = await api.get(printUrl);
      const htmlContent = typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data);

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
      frameDoc.write(htmlContent);
      frameDoc.write(`<script>window.onload = function() { window.print(); };</script>`);
      frameDoc.close();

      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    } catch (e) {
      snackbar.error("Failed to print invoice for appointment");
    }
  };

  const handlePrescriptionClick = async (patientId) => {
    setSelectedPatientId(patientId);
    // Fetch patient data
    try {
      const { data } = await api.get(`/api/v1/user/patient/${patientId}`);
      setSelectedPatientData(data.patient);
      setPrescriptionModalOpen(true);
    } catch (error) {
      setSelectedPatientData(null);
      snackbar.error("Failed to fetch patient data");
    }
  };

  const closePrescriptionModal = () => {
    setPrescriptionModalOpen(false);
    setSelectedPatientId(null);
    setSelectedPatientData(null);
  };

  const handleRescheduleClick = (appointment) => {
    setSelectedAppointmentToReschedule(appointment);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleConfirm = async (appointmentId, newDate) => {
    setIsRescheduling(true);
    try {
      const response = await rescheduleAppointment(appointmentId, newDate);
      snackbar.success("Appointment rescheduled successfully!");
      setRescheduleModalOpen(false);
      setSelectedAppointmentToReschedule(null);
      // Refresh appointments list
      const fetchAppointments = async () => {
        try {
          const { data } = await api.get("/api/v1/appointment/getall");
          setAppointments(data.appointments);
        } catch (error) {
          console.error("Error fetching appointments:", error);
        }
      };
      fetchAppointments();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      const errorMessage = error?.message || "Failed to reschedule appointment";
      snackbar.error(errorMessage);
    } finally {
      setIsRescheduling(false);
    }
  };

  const closeRescheduleModal = () => {
    setRescheduleModalOpen(false);
    setSelectedAppointmentToReschedule(null);
  };

  useEffect(() => {
    let filtered = (appointments || []).filter((appointment) => {
      try {
        // Filter by selected doctor
        if (selectedDoctorId && appointment.doctorId !== selectedDoctorId) {
          return false;
        }

        const apptDate = new Date(appointment.appointment_date);
        const apptYmd = apptDate.toLocaleDateString("en-CA");
        const today = new Date();
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        const todayYmd = startOfToday.toLocaleDateString("en-CA");

        // Filter by dropdown
        if (filterOption === "Today" && apptYmd !== todayYmd) return false;
        if (filterOption === "Old" && apptYmd >= todayYmd) return false;
        if (filterOption === "Upcoming" && apptYmd <= todayYmd) return false;
        if (filterOption === "Custom" && customStart && customEnd) {
          const start = new Date(customStart + "T00:00:00");
          const end = new Date(customEnd + "T23:59:59");
          if (apptDate < start || apptDate > end) return false;
        }

        // Filter by prescribed status
        if (filterPrescibed !== "All") {
          const isPrescribed = !(
            appointment.status === "Pending" ||
            appointment.status === "Accepted"
          );
          if (filterPrescibed === "Prescribed" && !isPrescribed) {
            return false;
          }
          if (filterPrescibed === "Unprescribed" && isPrescribed) {
            return false;
          }
        }

        // Search term across name, phone, date and invoice number
        if (searchTerm && searchTerm.trim() !== "") {
          const q = searchTerm.toLowerCase().trim();
          const name = (
            appointment.name ||
            `${appointment.firstName || ""} ${appointment.lastName || ""}`
          ).toLowerCase();
          const phone = (
            appointment.phone ||
            appointment.mobile ||
            appointment.patientPhone ||
            ""
          )
            .toString()
            .toLowerCase();
          const dateStr = (appointment.appointment_date || "")
            .toString()
            .toLowerCase();

          let invoiceNums = [];
          if (Array.isArray(appointment.invoices)) {
            appointment.invoices.forEach((inv) => {
              if (typeof inv === "object" && inv !== null) {
                if (inv.invoiceNumber) invoiceNums.push(inv.invoiceNumber.toLowerCase());
                if (inv._id) invoiceNums.push(inv._id.toString().toLowerCase());
              } else if (inv) {
                invoiceNums.push(inv.toString().toLowerCase());
              }
            });
          }
          if (appointment.invoiceNumber) {
            invoiceNums.push(appointment.invoiceNumber.toString().toLowerCase());
          }

          const matchesInvoice = invoiceNums.some((num) => num.includes(q));

          if (!name.includes(q) && !phone.includes(q) && !dateStr.includes(q) && !matchesInvoice) {
            return false;
          }
        }

        return true;
      } catch (err) {
        // If any error occurs during filtering (e.g., invalid date), include the item by default
        return true;
      }
    });

    // After all filters are applied, set the state
    setFilteredAppointments(filtered);
  }, [
    appointments,
    selectedDoctorId,
    searchTerm,
    filterOption,
    customStart,
    customEnd,
    filterPrescibed,
  ]);

  const prescibeFilterChange = (event) => {
    // const { name, value } = event.target;
    // setFilterPrescibed((prev) => ({ ...prev, [name]: value }));
    setFilterPrescibed(event.target.value);
    // if (filterPrescibed === "Prescribed") {
    //   if (appointment.status == "Completed") {
    //     // return "Prescribed";
    //     return console.log("data prescribed");
    //   }
    // } else if (filterPrescibed === "Unprescribed") {
    //   // return "Unprescribed";
    //   return console.log("data not prescribed");
    // } else if (filterPrescibed === "All") {
    //   // return "All";
    //   return console.log("All");
    // }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <section className="dashboard page">
        <div className="banner">
          <div className="firstBox">
            <div className="doctor-imgbox">
              <img src="/doc.png" alt="docImg" />
            </div>
            <div className="content">
              <div>
                <p>Hello ,</p>
                <h5>{admin && `${admin.firstName} ${admin.lastName}`} </h5>
              </div>
              <p>
                Welcome to your dashboard! Here you can manage appointments,
                view patient information, and oversee your medical practice with
                ease. If you have any questions or need assistance, feel free to
                reach out to our support team.{" "}
                <b>Biomechasoft +91 9609436103</b>
              </p>
            </div>
          </div>
          <div className="secondBox">
            <p>Total Appointments</p>
            <h3>{appointments?.length}</h3>
          </div>
          <RequirePermission allowedRoles={["Admin"]}>
            <div className="thirdBox">
              <p>Registered Doctors</p>
              <h3>{doctors.length}</h3>
            </div>
          </RequirePermission>
        </div>
        {/* Role-based quick metrics */}
        <div className="dashboard-metrics-container">
          <div className="dashboard-metric-card blue">
            <div className="dashboard-metric-icon">
              <FaUserMd size={28} color="#0859af" />
            </div>
            <div className="dashboard-metric-content">
              <div className="dashboard-metric-header">
                <p className="dashboard-metric-title">Patients Viewed Today</p>
                <div className="dashboard-metric-value blue">
                  {metrics.patientsViewedToday}
                </div>
              </div>
              <div className="dashboard-metric-footer">
                <span className="dashboard-metric-footer-label">
                  Paid today
                </span>
                <strong className="dashboard-metric-footer-amount">
                  ₹{fmt(metrics.paidToday)}
                </strong>
              </div>
            </div>
          </div>

          <div className="dashboard-metric-card red">
            <div className="dashboard-metric-icon">
              <FaUsers size={28} color="#b91c1c" />
            </div>
            <div className="dashboard-metric-content">
              <div className="dashboard-metric-header">
                <p className="dashboard-metric-title">Patients This Month</p>
                <div className="dashboard-metric-value red">
                  {metrics.patientsThisMonth}
                </div>
              </div>
              <div className="dashboard-metric-footer">
                <span className="dashboard-metric-footer-label">
                  Paid this month
                </span>
                <strong className="dashboard-metric-footer-amount">
                  ₹{fmt(metrics.paidThisMonth)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Reports summary (today/month/total) */}
        <Reports appointments={appointments} showSummary={false} />

        {/* Middle banner / navbar-like filter area */}
        <div className="banner middle-banner">
          <div className="filter-box">
            <select
              name="dateFilter"
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Today">Today</option>
              <option value="Old">Old</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Custom">Custom</option>
            </select>

            {/* Doctor Filter Dropdown */}
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={admin?.role === "Doctor"}
              style={{ background: "#009688" }}
            >
              {admin?.role !== "Doctor" && (
                <option value="">All Doctors</option>
              )}
              {doctorFilterList.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.firstName} {doc.lastName}
                </option>
              ))}
            </select>

            <select
              value={filterPrescibed}
              // onChange={prescibeFilterChange}
              onChange={(e) => setfilterPrescibed(e.target.value)}
              className="prescribed-filter"
            >
              <option value="Prescribed">Prescribed Data</option>
              <option value="Unprescribed">Non Prescribed</option>
              <option value="All">All</option>
            </select>

            {/* <input
                type="text"
                placeholder="Search by doctor name"
                onChange={(e) => setSearchTerm(e.target.value)}
              /> */}

            {filterOption === "Custom" && (
              <div className="custom-dates">
                <input
                  type="date"
                  placeholder="Start date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <input
                  type="date"
                  placeholder="End date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="search-box dashboard-home-search-box">
            <MdOutlineContentPasteSearch size={"1.8rem"} color="grey" />
            <input
              type="text"
              placeholder="Search by name/phone/date/invoice #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="banner table-banner">
          <div className="heading-box">
            <h5>Appointments</h5>
            <div className="btn-box">
              <button
                className="btn"
                onClick={() => navigate("/add-appointment")}
              >
                <FaPrescriptionBottleMedical /> Book Appointment
              </button>
              <button
                ref={setupClickSound}
                className="btn"
                onClick={() => setSlotCheckerOpen(true)}
              >
                <MdSchedule /> View Slots
              </button>
              <RequirePermission allowedRoles={["Admin"]}>
                <button
                  ref={setupClickSound}
                  className="btn btn-danger"
                  onClick={handleBulkDelete}
                  disabled={selectedAppointments.length === 0}
                >
                  <MdOutlineDelete /> Delete ({selectedAppointments.length})
                </button>
              </RequirePermission>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "45px", minWidth: "45px", textAlign: "center" }}>
                    <RequirePermission allowedRoles={["Admin"]}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const filteredAppointments = (
                            appointments || []
                          ).filter((appointment) => {
                            try {
                              const apptDate = new Date(
                                appointment.appointment_date,
                              );
                              const apptYmd =
                                apptDate.toLocaleDateString("en-CA");
                              const today = new Date();
                              const startOfToday = new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                today.getDate(),
                              );
                              const todayYmd =
                                startOfToday.toLocaleDateString("en-CA");

                              // Filter by dropdown
                              if (filterOption === "Today") {
                                if (apptYmd !== todayYmd) return false;
                              } else if (filterOption === "Old") {
                                if (apptYmd >= todayYmd) return false;
                              } else if (filterOption === "Upcoming") {
                                // future (strictly greater than today)
                                if (apptYmd <= todayYmd) return false;
                              } else if (filterOption === "Custom") {
                                if (customStart && customEnd) {
                                  const start = new Date(
                                    customStart + "T00:00:00",
                                  );
                                  const end = new Date(customEnd + "T23:59:59");
                                  if (apptDate < start || apptDate > end)
                                    return false;
                                }
                              }

                              // Search term across name, phone, date and invoice number
                              if (searchTerm && searchTerm.trim() !== "") {
                                const q = searchTerm.toLowerCase().trim();
                                const name = (
                                  appointment.name ||
                                  `${appointment.firstName || ""} ${
                                    appointment.lastName || ""
                                  }`
                                ).toLowerCase();
                                const phone = (
                                  appointment.phone ||
                                  appointment.mobile ||
                                  appointment.patientPhone ||
                                  ""
                                )
                                  .toString()
                                  .toLowerCase();
                                const dateStr = (
                                  appointment.appointment_date || ""
                                )
                                  .toString()
                                  .toLowerCase();

                                let invoiceNums = [];
                                if (Array.isArray(appointment.invoices)) {
                                  appointment.invoices.forEach((inv) => {
                                    if (typeof inv === "object" && inv !== null) {
                                      if (inv.invoiceNumber) invoiceNums.push(inv.invoiceNumber.toLowerCase());
                                      if (inv._id) invoiceNums.push(inv._id.toString().toLowerCase());
                                    } else if (inv) {
                                      invoiceNums.push(inv.toString().toLowerCase());
                                    }
                                  });
                                }
                                if (appointment.invoiceNumber) {
                                  invoiceNums.push(appointment.invoiceNumber.toString().toLowerCase());
                                }

                                const matchesInvoice = invoiceNums.some((num) => num.includes(q));

                                if (
                                  !name.includes(q) &&
                                  !phone.includes(q) &&
                                  !dateStr.includes(q) &&
                                  !matchesInvoice
                                ) {
                                  return false;
                                }
                              }
                              return true;
                            } catch (err) {
                              return true;
                            }
                          });
                          setSelectedAppointments(
                            e.target.checked
                              ? filteredAppointments.map((a) => a._id)
                              : [],
                          );
                        }}
                      />
                    </RequirePermission>
                  </th>
                  <th style={{ textAlign: "left" }}>Name</th>
                  <th style={{ width: "130px", minWidth: "110px", textAlign: "center", position: "relative" }}>
                    Date
                    <button
                      ref={setupClickSound}
                      className="expand-btn icon-btn"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {/* <RiExpandHorizontalSFill /> */}
                      <RiExpandVerticalLine />
                    </button>
                  </th>
                  {/* <th>Created By</th> */}
                  {isExpanded && <th style={{ textAlign: "center" }}>Phone</th>}
                  {isExpanded && <th style={{ textAlign: "center" }}>Gender</th>}
                  {/* <th>Payment Mode</th> */}
                  {/* <th>Fees Amount</th> */}
                  {isExpanded && <th style={{ textAlign: "center" }}>Payment Status</th>}
                  {isExpanded && <th style={{ textAlign: "center" }}>Status</th>}
                  <RequirePermission allowedRoles={["Admin"]}>
                    {isExpanded && <th style={{ textAlign: "left" }}>Doctor</th>}
                    {isExpanded && <th style={{ textAlign: "left" }}>Department</th>}
                  </RequirePermission>
                  {isExpanded && <th style={{ textAlign: "center" }}>Visited Before</th>}
                  {isExpanded && <th style={{ textAlign: "left" }}>Booked By</th>}
                  <th style={{ width: "140px", textAlign: "center" }}>Prescription</th>
                  <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments && filteredAppointments.length > 0 ? (
                  // <div>
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td style={{ width: "45px", minWidth: "45px", textAlign: "center" }}>
                        <RequirePermission allowedRoles={["Admin"]}>
                          <input
                            type="checkbox"
                            checked={selectedAppointments.includes(
                              appointment._id,
                            )}
                            onChange={() =>
                              toggleSelectAppointment(appointment._id)
                            }
                          />
                        </RequirePermission>
                      </td>
                      <td style={{ textAlign: "left", fontWeight: 500 }}>
                        {appointment.name ||
                          `${appointment.firstName} ${appointment.lastName}`}
                      </td>
                      <td style={{ textAlign: "center" }}>{appointment.appointment_date.substring(0, 10)}</td>
                      {/* <td>{appointment?.booked_by || "You"}</td> */}
                      {isExpanded && (
                        <td style={{ textAlign: "center" }}>{appointment.phone || appointment.mobile}</td>
                      )}
                      {isExpanded && <td style={{ textAlign: "center" }}>{appointment.gender}</td>}
                      {/* <td>{appointment.paymentMode || "Cash"}</td> */}
                      {/* <td>{appointment.price || appointment.feesAmount || "0"}</td> */}
                      {isExpanded && (
                        <td style={{ minWidth: "6.5rem" }}>
                          <select
                            value={appointment.paymentStatus || "Pending"}
                            onChange={(e) =>
                              handleUpdatePaymentStatus(
                                appointment._id,
                                e.target.value,
                              )
                            }
                            className={
                              appointment.paymentStatus === "Pending"
                                ? "value-rejected"
                                : "value-completed"
                            }
                            style={{ fontSize: "0.875rem" }}
                          >
                            <option value="Pending" className="value-rejected">
                              Pending
                            </option>
                            {/* <option value="Accepted">Accepted</option> */}
                            <option value="Paid" className="value-completed">
                              Paid
                            </option>
                          </select>
                        </td>
                      )}
                      {isExpanded && (
                        <td style={{ minWidth: "8rem" }}>
                          <select
                            name="status"
                            className={
                              appointment.status === "Pending"
                                ? "value-pending"
                                : appointment.status === "Accepted"
                                  ? "value-accepted"
                                  : appointment.status === "Completed"
                                    ? "value-completed"
                                    : "value-rejected"
                            }
                            value={appointment.status}
                            onChange={(e) =>
                              handleUpdateStatus(
                                appointment._id,
                                e.target.value,
                              )
                            }
                            style={{ fontSize: "0.875rem" }}
                          >
                            <option value="Pending" className="value-pending">
                              Pending
                            </option>
                            <option value="Accepted" className="value-accepted">
                              Accepted
                            </option>
                            <option value="Rejected" className="value-rejected">
                              Rejected
                            </option>
                            <option
                              value="Completed"
                              className="value-completed"
                            >
                              Completed
                            </option>
                          </select>
                        </td>
                      )}
                      <RequirePermission allowedRoles={["Admin"]}>
                        {isExpanded && (
                          <td>{`${appointment.doctor.firstName} ${appointment.doctor.lastName}`}</td>
                        )}
                        {isExpanded && <td>{appointment.department}</td>}
                      </RequirePermission>
                      {isExpanded && (
                        <td>
                          {appointment.hasVisited === true ? (
                            <GoCheckCircleFill className="green" />
                          ) : (
                            <AiFillCloseCircle className="red" />
                          )}
                        </td>
                      )}
                      {isExpanded && (
                        <td>
                          {appointment.book_by_name
                            ? appointment.book_by_name
                            : appointment.patientId || "-"}
                        </td>
                      )}
                      <td>
                        <RequirePermission allowedRoles={["Admin", "Doctor"]}>
                          <button
                            className="btn btn-primary prescribe-btn"
                            onClick={() =>
                              handlePrescriptionClick(appointment.patientId)
                            }
                          >
                            Prescription
                          </button>
                        </RequirePermission>
                      </td>
                      {/* <td>
                        <div className="td-btn-container">
                          TODO:functionalities need to be implemented
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              color: "#0859afff",
                              cursor: "pointer",
                            }}
                            onClick={() => handleRescheduleClick(appointment)}
                            title="Reschedule"
                          >
                            <RiCalendarScheduleFill />
                          </button>
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              color: "#5bbe8eff",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(`/preview/${appointment.patientId}`)
                            }
                          >
                            <FaEye title="View prescription" />
                          </button>
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              color: "#760692ff",
                              cursor: "pointer",
                            }}
                            onClick={() => handleInvoiceClick(appointment._id)}
                          >
                            <IoReceipt title="Invoice" />
                          </button>
                          
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              color: "#686868",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(`/referral/${appointment._id}`)
                            }
                          >
                            <IoIosShareAlt title="Referral" />
                          </button>
                          <select>
                              <option value="Pending" className="value-rejected">Pending</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Paid" className="value-completed">Paid</option>
                            </select>
                          </div>
                          </td> */}
                      {/* {
                          isExpanded && <td style={{minWidth: "8rem"}}>
                            <select
                              className={
                                appointment.status === "Pending"
                                  ? "value-pending"
                                  : appointment.status === "Accepted"
                                  ? "value-accepted"
                                  : appointment.status === "Completed"
                                  ? "value-completed"
                                  : "value-rejected"
                              }
                              value={appointment.status}
                              onChange={(e) =>
                                handleUpdateStatus(
                                  appointment._id,
                                  e.target.value
                                )
                              }
                              style={{fontSize: "1rem"}}
                            >
                              <option value="Pending" className="value-pending">
                                Pending
                              </option>
                              <option
                                value="Accepted"
                                className="value-accepted"
                              >
                                Accepted
                              </option>
                              <option
                                value="Rejected"
                                className="value-rejected"
                              >
                                Rejected
                              </option>
                              <option
                                value="Completed"
                                className="value-completed" 
                              >
                                Completed
                              </option>
                            </select>
                          </td>} */}

                      {/*  */}

                      {/* <RequirePermission allowedRoles={["Admin"]}>
                            {isExpanded && <td>{`${appointment.doctor.firstName} ${appointment.doctor.lastName}`}</td>}
                            {isExpanded && <td>{appointment.department}</td>}
                          </RequirePermission> */}

                      {/* {isExpanded && <td>
                            {appointment.hasVisited === true ? (
                              <GoCheckCircleFill className="green" />
                            ) : (
                              <AiFillCloseCircle className="red" />
                            )}
                          </td>}
                          {isExpanded && <td>
                            {appointment.book_by_name
                              ? appointment.book_by_name
                              : appointment.patientId || "-"}
                          </td>} */}

                      {/* {isExpanded &&<td>
                            <RequirePermission allowedRoles={["Admin", "Doctor"]}>

                            <button
                              className="btn btn-primary"
                              onClick={() =>
                                handlePrescriptionClick(appointment.patientId)
                              }
                            >
                              Prescription
                            </button>
                            </RequirePermission>
                          </td>} */}
                      <td>
                        <RadialMenu>
                          {/* TODO:functionalities need to be implemented */}
                          <button
                            ref={setupClickSound}
                            className="icon-btn"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#0859afff",
                              cursor: "pointer",
                            }}
                            onClick={() => handleRescheduleClick(appointment)}
                            title="Reschedule"
                          >
                            <RiCalendarScheduleFill />
                          </button>
                          <button
                            ref={setupClickSound}
                            className="icon-btn"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#5bbe8eff",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(`/preview/${appointment.patientId}`)
                            }
                          >
                            <FaEye title="View prescription" />
                          </button>
                          <button
                            ref={setupClickSound}
                            className="icon-btn"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#760692ff",
                              cursor: "pointer",
                            }}
                            onClick={() => handleInvoiceClick(appointment._id)}
                          >
                            <IoReceipt title="Invoice" />
                          </button>
                          {/* 06-01-26 */}
                          <button
                            ref={setupClickSound}
                            className="icon-btn"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#686868",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(`/referral/${appointment._id}`)
                            }
                          >
                            <IoIosShareAlt title="Referral" />
                          </button>
                          {/* 06-01-26 */}
                          <RequirePermission allowedRoles={["Admin"]}>
                            <button
                              ref={setupClickSound}
                              className="icon-btn"
                              onClick={() =>
                                handleDeleteAppointment(appointment._id)
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "#b10c0c",
                                cursor: "pointer",
                              }}
                            >
                              <FaTrash title="Delete" />
                            </button>
                          </RequirePermission>
                        </RadialMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  // }
                  //   </div>
                  <tr>
                    <td
                      colSpan="100%"
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      No Appointments Found!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>



          {/* Prescription modal - only for prescription */}
          <Modal
            isOpen={prescriptionModalOpen}
            onRequestClose={closePrescriptionModal}
            contentLabel="Prescription Modal"
            ariaHideApp={false}
            style={{ content: { margin: "auto" } }}
          >
            <Prescription
              patientId={selectedPatientId}
              patientData={selectedPatientData}
              onClose={closePrescriptionModal}
            />
          </Modal>

          {/* Reschedule modal */}
          {selectedAppointmentToReschedule && (
            <RescheduleModal
              isOpen={rescheduleModalOpen}
              onClose={closeRescheduleModal}
              appointment={selectedAppointmentToReschedule}
              onSave={handleRescheduleConfirm}
              isLoading={isRescheduling}
            />
          )}

          {/* Slot Checker Modal */}
          <DashboardSlotChecker
            isOpen={slotCheckerOpen}
            onClose={() => setSlotCheckerOpen(false)}
          />
        </div>
      </section>
    </>
  );
};

export default Dashboard;
