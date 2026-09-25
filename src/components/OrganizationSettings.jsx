import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import {
  generateLocationQrDataUrl,
  resolveFullImageUrl,
  getGeneralSettings,
} from "../utils/generalSettingsUtil";
import {
  FaBuilding,
  FaIdCard,
  FaLocationDot,
  FaUserTie,
  FaIndianRupeeSign,
  FaMapLocationDot,
  FaImage,
  FaFloppyDisk,
  FaSpinner,
  FaArrowUpRightFromSquare,
  FaRotateLeft,
} from "react-icons/fa6";
import "./OrganizationSettings.css";

const OrganizationSettings = () => {
  const snackbar = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [platformFee, setPlatformFee] = useState(50);
  const [googleLocationUrl, setGoogleLocationUrl] = useState("");

  const [headerPreview, setHeaderPreview] = useState("");
  const [headerFile, setHeaderFile] = useState(null);
  const [removeHeader, setRemoveHeader] = useState(false);

  const [footerPreview, setFooterPreview] = useState("");
  const [footerFile, setFooterFile] = useState(null);
  const [removeFooter, setRemoveFooter] = useState(false);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await getGeneralSettings(true);
        setOrgName(settings.orgName || "");
        setRegNo(settings.regNo || "");
        setAddress(settings.address || "");
        setOwnerName(settings.ownerName || "");
        setPlatformFee(settings.platformFee ?? 50);
        setGoogleLocationUrl(settings.googleLocationUrl || "");

        if (settings.defaultHeaderImage) {
          setHeaderPreview(resolveFullImageUrl(settings.defaultHeaderImage));
        }
        if (settings.defaultFooterImage) {
          setFooterPreview(resolveFullImageUrl(settings.defaultFooterImage));
        }
      } catch (err) {
        console.error("Failed to load organization settings", err);
        snackbar.error("Failed to load organization settings");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Live update QR code when location URL changes
  useEffect(() => {
    let active = true;
    if (googleLocationUrl && googleLocationUrl.trim()) {
      generateLocationQrDataUrl(googleLocationUrl.trim()).then((dataUrl) => {
        if (active) setQrCodeDataUrl(dataUrl);
      });
    } else {
      setQrCodeDataUrl("");
    }
    return () => {
      active = false;
    };
  }, [googleLocationUrl]);

  const handleHeaderChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderFile(file);
      setRemoveHeader(false);
      const reader = new FileReader();
      reader.onload = () => setHeaderPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFooterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFooterFile(file);
      setRemoveFooter(false);
      const reader = new FileReader();
      reader.onload = () => setFooterPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleResetHeader = () => {
    setHeaderFile(null);
    setRemoveHeader(true);
    setHeaderPreview("/Header.jpeg");
  };

  const handleResetFooter = () => {
    setFooterFile(null);
    setRemoveFooter(true);
    setFooterPreview("/Footer.png");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("orgName", orgName);
      formData.append("regNo", regNo);
      formData.append("address", address);
      formData.append("ownerName", ownerName);
      formData.append("platformFee", platformFee);
      formData.append("googleLocationUrl", googleLocationUrl);

      if (removeHeader) formData.append("removeHeaderImage", "true");
      if (removeFooter) formData.append("removeFooterImage", "true");

      if (headerFile) formData.append("defaultHeaderImage", headerFile);
      if (footerFile) formData.append("defaultFooterImage", footerFile);

      const { data } = await api.put("/api/v1/settings/general", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data?.success) {
        snackbar.success("Organization details & branding saved successfully!");
        // Refresh cache
        await getGeneralSettings(true);
      }
    } catch (err) {
      console.error("Save error:", err);
      snackbar.error(err?.response?.data?.message || err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="org-loading">
        <FaSpinner className="org-spinner" size={32} />
        <p>Loading organization settings…</p>
      </div>
    );
  }

  return (
    <div className="org-settings-container">
      <div className="org-header-card">
        <div className="org-header-icon">
          <FaBuilding size={28} />
        </div>
        <div>
          <h3>Organization Profile & Default Branding</h3>
          <p>
            Configure clinic identity, registration, location QR code, and default
            header/footer images for prescriptions and receipts.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="org-form">
        <div className="org-grid">
          {/* Left Column: Organization Details */}
          <div className="org-card">
            <h4 className="org-section-title">
              <FaIdCard /> Clinic & Owner Details
            </h4>

            <div className="org-form-group">
              <label>Organization Name *</label>
              <div className="org-input-wrap">
                <FaBuilding className="org-field-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. BioMechaSoft OPD Clinic"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>

            <div className="org-form-group">
              <label>Registration / License Number</label>
              <div className="org-input-wrap">
                <FaIdCard className="org-field-icon" />
                <input
                  type="text"
                  placeholder="e.g. REG-WB-2024-8971"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                />
              </div>
            </div>

            <div className="org-form-group">
              <label>Name of the Owner / Medical Director</label>
              <div className="org-input-wrap">
                <FaUserTie className="org-field-icon" />
                <input
                  type="text"
                  placeholder="e.g. Dr. Tarikul Alam"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>
            </div>

            <div className="org-form-group">
              <label>Platform / OPD Registration Fee (₹)</label>
              <div className="org-input-wrap">
                <FaIndianRupeeSign className="org-field-icon" />
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 50"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                />
              </div>
              <span className="org-hint">
                Standard platform registration fee included on consultation receipts.
              </span>
            </div>

            <div className="org-form-group">
              <label>Clinic Address</label>
              <div className="org-input-wrap">
                <FaLocationDot className="org-field-icon" style={{ alignSelf: "flex-start", marginTop: "10px" }} />
                <textarea
                  rows={3}
                  placeholder="e.g. Vill - Tarbagan, Po - Dhuliyan, Dist - Murshidabad, Pin - 742202, State - WB"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Google Location & QR Code */}
          <div className="org-card">
            <h4 className="org-section-title">
              <FaMapLocationDot /> Google Location & Navigation QR Code
            </h4>

            <div className="org-form-group">
              <label>Google Maps Location Link</label>
              <div className="org-input-wrap">
                <FaMapLocationDot className="org-field-icon" />
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={googleLocationUrl}
                  onChange={(e) => setGoogleLocationUrl(e.target.value)}
                />
              </div>
              <span className="org-hint">
                Paste your clinic's Google Maps link. A scannable QR code is generated
                instantly for patient receipts.
              </span>
            </div>

            {/* QR Code Card */}
            <div className="org-qr-preview-box">
              {qrCodeDataUrl ? (
                <div className="org-qr-display">
                  <div className="org-qr-img-wrapper">
                    <img src={qrCodeDataUrl} alt="Clinic Location QR Code" />
                  </div>
                  <div className="org-qr-details">
                    <span className="org-qr-badge">Active QR Code</span>
                    <h5>Scan for Clinic Location</h5>
                    <p>
                      Patients can scan this QR code on receipts to navigate directly to
                      your clinic on Google Maps.
                    </p>
                    {googleLocationUrl && (
                      <a
                        href={googleLocationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="org-qr-test-btn"
                      >
                        <FaArrowUpRightFromSquare size={12} /> Test Location Link
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="org-qr-empty">
                  <FaMapLocationDot size={36} style={{ opacity: 0.3 }} />
                  <p>Enter a Google Maps URL above to generate a live scannable QR code.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Default Header & Footer Branding */}
        <div className="org-card org-branding-card">
          <h4 className="org-section-title">
            <FaImage /> Default Header & Footer Branding
          </h4>
          <p className="org-branding-desc">
            These default banners are applied to <strong>all consultation receipts</strong>, and serve as the
            <strong> fallback branding for prescriptions</strong> whenever a doctor hasn't set their own custom header/footer.
          </p>

          <div className="org-branding-grid">
            {/* Default Header */}
            <div className="org-asset-box">
              <div className="org-asset-header">
                <h5>Default Header Image</h5>
                <button
                  type="button"
                  onClick={handleResetHeader}
                  className="org-reset-btn"
                  title="Reset to system default"
                >
                  <FaRotateLeft size={12} /> Reset
                </button>
              </div>
              <div className="org-img-preview-frame header-frame">
                {headerPreview ? (
                  <img src={headerPreview} alt="Default Header Preview" />
                ) : (
                  <span className="org-no-img">No header uploaded</span>
                )}
              </div>
              <label className="org-upload-btn">
                <span>Upload New Header Image</span>
                <input type="file" accept="image/*" onChange={handleHeaderChange} />
              </label>
              <span className="org-dim-hint">Recommended size: ~1200 x 200px (JPG/PNG)</span>
            </div>

            {/* Default Footer */}
            <div className="org-asset-box">
              <div className="org-asset-header">
                <h5>Default Footer Image</h5>
                <button
                  type="button"
                  onClick={handleResetFooter}
                  className="org-reset-btn"
                  title="Reset to system default"
                >
                  <FaRotateLeft size={12} /> Reset
                </button>
              </div>
              <div className="org-img-preview-frame footer-frame">
                {footerPreview ? (
                  <img src={footerPreview} alt="Default Footer Preview" />
                ) : (
                  <span className="org-no-img">No footer uploaded</span>
                )}
              </div>
              <label className="org-upload-btn">
                <span>Upload New Footer Image</span>
                <input type="file" accept="image/*" onChange={handleFooterChange} />
              </label>
              <span className="org-dim-hint">Recommended size: ~1200 x 90px (JPG/PNG)</span>
            </div>
          </div>
        </div>

        {/* Form Action Footer */}
        <div className="org-actions-bar">
          <button type="submit" disabled={saving} className="org-save-btn">
            {saving ? (
              <>
                <FaSpinner className="org-spinner" /> Saving Settings…
              </>
            ) : (
              <>
                <FaFloppyDisk /> Save Organization Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationSettings;
