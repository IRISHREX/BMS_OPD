/**
 * idUtils.js - Unified identifier formatting across BMS OPD
 */

/**
 * Format appointment ID to standardized human-readable short code (e.g. APT-622C18)
 */
export const formatAppointmentId = (apptOrId) => {
  if (!apptOrId) return "-";
  
  if (typeof apptOrId === "object") {
    const raw = apptOrId._id || apptOrId.appointmentId || apptOrId.id;
    if (!raw) return "-";
    const str = String(raw);
    if (str.startsWith("APT-")) return str;
    return `APT-${str.slice(-6).toUpperCase()}`;
  }

  const str = String(apptOrId).trim();
  if (str.startsWith("APT-")) return str;
  return `APT-${str.slice(-6).toUpperCase()}`;
};

/**
 * Format patient registration / national ID (e.g. 9134101587179 or P-XXXXX)
 */
export const formatPatientId = (patientOrId) => {
  if (!patientOrId) return "-";

  if (typeof patientOrId === "object") {
    if (patientOrId.nic) return String(patientOrId.nic).trim();
    if (patientOrId.NIC) return String(patientOrId.NIC).trim();
    if (patientOrId.patientNic) return String(patientOrId.patientNic).trim();
    if (patientOrId._id) {
      return `P-${String(patientOrId._id).slice(-5).toUpperCase()}`;
    }
    return "-";
  }

  const str = String(patientOrId).trim();
  // If it's a 24-character hex Mongo ID, format with P- prefix
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    return `P-${str.slice(-5).toUpperCase()}`;
  }
  return str;
};

/**
 * Format patient display name and registration ID (e.g. "Jidan Hossain (9134101587179)")
 */
export const formatPatientDisplayName = (patientOrObj) => {
  if (!patientOrObj) return "-";

  if (typeof patientOrObj === "object") {
    const name =
      patientOrObj.name ||
      `${patientOrObj.firstName || ""} ${patientOrObj.lastName || ""}`.trim();
    const id = formatPatientId(patientOrObj);
    if (name && id && id !== "-") {
      return `${name} (${id})`;
    }
    return name || id || "-";
  }

  return formatPatientId(patientOrObj);
};

/**
 * Format invoice number / ID
 */
export const formatInvoiceId = (invOrId) => {
  if (!invOrId) return "-";
  if (typeof invOrId === "object") {
    return invOrId.invoiceNumber || (invOrId._id ? `INV-${String(invOrId._id).slice(-6).toUpperCase()}` : "-");
  }
  return String(invOrId);
};
