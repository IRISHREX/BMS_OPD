import api from "./api";
import QRCode from "qrcode";

let cachedSettings = null;
let lastFetchedAt = 0;

/**
 * Fetch general settings from API with in-memory caching
 */
export const getGeneralSettings = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now - lastFetchedAt < 60000) {
    return cachedSettings;
  }
  try {
    const { data } = await api.get("/api/v1/settings/general");
    if (data?.success && data?.settings) {
      cachedSettings = data.settings;
      lastFetchedAt = now;
      return cachedSettings;
    }
  } catch (err) {
    console.warn("Failed to fetch general settings, using defaults", err.message);
  }
  return (
    cachedSettings || {
      orgName: "BioMechaSoft OPD",
      regNo: "",
      address: "Vill - Tarbagan, Po - Dhuliyan, Dist - Murshidabad, Pin - 742202, State - WB",
      ownerName: "",
      platformFee: 50,
      googleLocationUrl: "",
      defaultHeaderImage: "/Header.jpeg",
      defaultFooterImage: "/Footer.png",
    }
  );
};

/**
 * Generate a QR code as a base64 Data URL
 */
export const generateLocationQrDataUrl = async (locationUrl) => {
  const target = (locationUrl && locationUrl.trim()) ? locationUrl.trim() : "https://maps.google.com";
  try {
    return await QRCode.toDataURL(target, {
      width: 140,
      margin: 1,
      color: {
        dark: "#0a4a75",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    return null;
  }
};

/**
 * Resolve full image URL for headers / footers
 */
export const resolveFullImageUrl = (imagePath, fallback = null) => {
  if (!imagePath) return fallback;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath;
  }
  const base = api.defaults.baseURL || "";
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${cleanBase}${cleanPath}`;
};
/**
 * Generate a complete, beautifully branded HTML receipt
 * containing:
 * - Default Header image
 * - Organization name, Reg No, Owner name, Address
 * - Consultation & Platform fee details
 * - Google Location QR code
 * - Default Footer image
 */
export const generateFullReceiptHtml = async ({
  receiptNo = "REC-001",
  serialNo = null,
  patientName = "Patient",
  doctorName = "Doctor",
  department = "General",
  dateTime = new Date().toLocaleString(),
  phone = "N/A",
  paymentStatus = "Paid",
  docFee = 0,
  platformFee = null,
  totalAmount = null,
  printedByName = "Admin",
}) => {
  const settings = await getGeneralSettings();
  const effectivePlatformFee = platformFee != null ? Number(platformFee) : (Number(settings.platformFee) || 0);
  const effectiveDocFee = Number(docFee) || 0;
  const grandTotal = totalAmount != null ? Number(totalAmount) : (effectiveDocFee + effectivePlatformFee);
  const paddedSerial = serialNo != null ? String(serialNo).padStart(2, '0') : (receiptNo.match(/-\d+$/) ? receiptNo.match(/\d+$/)[0].slice(-2) : '01');

  const qrDataUrl = await generateLocationQrDataUrl(settings.googleLocationUrl);
  const headerUrl = resolveFullImageUrl(settings.defaultHeaderImage, "/Header.jpeg");
  const footerUrl = resolveFullImageUrl(settings.defaultFooterImage, "/Footer.png");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Receipt ${receiptNo}</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 20px;
        color: #1e293b;
        max-width: 650px;
        margin: 0 auto;
        line-height: 1.5;
        background: #f8fafc;
      }
      .receipt-card {
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        overflow: hidden;
      }
      .receipt-banner {
        width: 100%;
        max-height: 120px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom: 1px solid #e2e8f0;
      }
      .receipt-banner img {
        width: 100%;
        max-height: 120px;
        object-fit: cover;
        display: block;
      }
      .receipt-content {
        padding: 24px;
      }
      .clinic-meta {
        text-align: center;
        border-bottom: 2px solid #f1f5f9;
        padding-bottom: 14px;
        margin-bottom: 18px;
      }
      .clinic-meta h1 {
        margin: 0 0 4px;
        color: #0a4a75;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.3px;
      }
      .clinic-meta .sub-info {
        font-size: 12.5px;
        color: #475569;
        margin: 2px 0;
      }
      .clinic-meta .address-text {
        font-size: 11.5px;
        color: #64748b;
        margin-top: 4px;
      }
      .receipt-sub-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px 14px;
        margin-bottom: 16px;
        font-size: 13px;
        font-weight: 600;
      }
      .receipt-no {
        color: #0a4a75;
      }
      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 20px;
        font-size: 13.5px;
      }
      .detail-item strong {
        color: #64748b;
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      .detail-item span {
        color: #0f172a;
        font-weight: 500;
      }
      .table-section {
        margin-bottom: 18px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 6px;
        font-size: 13.5px;
      }
      th {
        background: #f1f5f9;
        padding: 9px 12px;
        text-align: left;
        border-bottom: 2px solid #e2e8f0;
        color: #475569;
        font-weight: 600;
        font-size: 12.5px;
      }
      td {
        padding: 9px 12px;
        border-bottom: 1px solid #f1f5f9;
      }
      .totals {
        text-align: right;
        margin-top: 14px;
        padding-top: 10px;
        border-top: 2px dashed #e2e8f0;
      }
      .grand-total {
        font-size: 18px;
        font-weight: 700;
        color: #0a4a75;
      }
      .badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 11.5px;
        font-weight: 700;
        background: #dcfce7;
        color: #166534;
      }
      .badge-unpaid {
        background: #fef3c7;
        color: #92400e;
      }
      .qr-location-section {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: 20px;
        padding: 12px 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
      }
      .qr-location-img {
        width: 80px;
        height: 80px;
        flex-shrink: 0;
        background: #ffffff;
        padding: 4px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      }
      .qr-location-text strong {
        display: block;
        font-size: 13px;
        color: #0a4a75;
        margin-bottom: 2px;
      }
      .qr-location-text span {
        display: block;
        font-size: 11px;
        color: #64748b;
        line-height: 1.35;
      }
      .receipt-footer-banner {
        width: 100%;
        max-height: 60px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        border-top: 1px solid #e2e8f0;
      }
      .receipt-footer-banner img {
        width: 100%;
        max-height: 60px;
        object-fit: cover;
        display: block;
      }
      .footer-print-info {
        padding: 10px 24px;
        font-size: 11px;
        color: #94a3b8;
        display: flex;
        justify-content: space-between;
        background: #f8fafc;
      }
      @media print {
        body { padding: 0; background: #fff; }
        .receipt-card { border: none; box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="receipt-card">
      ${headerUrl ? `<div class="receipt-banner"><img src="${headerUrl}" alt="Clinic Header" /></div>` : ''}
      
      <div class="receipt-content">
        <div class="clinic-meta">
          <h1>${settings.orgName || "Medical Appointment Receipt"}</h1>
          <div class="sub-info">
            ${settings.regNo ? `<span>Reg. No: <strong>${settings.regNo}</strong></span>` : ''}
            ${settings.regNo && settings.ownerName ? ` • ` : ''}
            ${settings.ownerName ? `<span>Director / Owner: <strong>${settings.ownerName}</strong></span>` : ''}
          </div>
          ${settings.address ? `<div class="address-text">${settings.address}</div>` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 10px 16px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: #2563eb; color: #ffffff; border-radius: 8px; padding: 4px 12px; font-size: 22px; font-weight: 900; letter-spacing: 0.5px;">#${paddedSerial}</div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.8px;">Daily Token / Serial No</div>
              <div style="font-size: 12px; color: #3b82f6; font-weight: 600;">${doctorName || "Doctor"} • ${dateTime.split(",")[0] || ""}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${receiptNo}</div>
            <span class="badge ${paymentStatus === "Paid" ? "" : "badge-unpaid"}" style="margin-top: 3px;">${paymentStatus}</span>
          </div>
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <strong>Patient Name</strong>
            <span>${patientName || "-"}</span>
          </div>
          <div class="detail-item">
            <strong>Doctor Name</strong>
            <span>${doctorName || "-"}</span>
          </div>
          <div class="detail-item">
            <strong>Department</strong>
            <span>${department || "-"}</span>
          </div>
          <div class="detail-item">
            <strong>Date & Time</strong>
            <span>${dateTime}</span>
          </div>
          <div class="detail-item">
            <strong>Phone / Contact</strong>
            <span>${phone || "N/A"}</span>
          </div>
          <div class="detail-item">
            <strong>Payment Mode</strong>
            <span>Cash / Counter</span>
          </div>
        </div>

        <div class="table-section">
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
                <td>Doctor Consultation Fee</td>
                <td style="text-align:center">1</td>
                <td style="text-align:right">₹${effectiveDocFee}</td>
                <td style="text-align:right">₹${effectiveDocFee}</td>
              </tr>
              ${effectivePlatformFee > 0 ? `
              <tr>
                <td>OPD Registration / Platform Fee</td>
                <td style="text-align:center">1</td>
                <td style="text-align:right">₹${effectivePlatformFee}</td>
                <td style="text-align:right">₹${effectivePlatformFee}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div class="grand-total">Total Payable: ₹${grandTotal}</div>
        </div>

        ${qrDataUrl ? `
        <div class="qr-location-section">
          <img class="qr-location-img" src="${qrDataUrl}" alt="Google Location QR Code" />
          <div class="qr-location-text">
            <strong>📍 Scan for Clinic Location on Google Maps</strong>
            <span>Scan this QR code with your mobile camera to launch GPS directions to ${settings.orgName || "our clinic"}.</span>
          </div>
        </div>
        ` : ''}
      </div>

      ${footerUrl ? `<div class="receipt-footer-banner"><img src="${footerUrl}" alt="Clinic Footer" /></div>` : ''}

      <div class="footer-print-info">
        <span>Printed By: <strong>${printedByName}</strong></span>
        <span>Generated: ${new Date().toLocaleDateString("en-IN")}</span>
      </div>
    </div>

    <script>
      window.onload = function() {
        window.print();
      };
    </script>
  </body>
</html>`;
};
