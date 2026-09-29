import React, { useState, useEffect } from "react";
import { getGeneralSettings, updateCommissionSettingsApi } from "../utils/generalSettingsUtil";
import { useSnackbar } from "../context/SnackbarContext";
import { playSaveSound, playClickSound } from "../utils/soundUtils";
import {
  FaHandshake,
  FaTimes,
  FaPercentage,
  FaUserCheck,
  FaUserTimes,
  FaUserTie,
  FaUsers,
  FaInfoCircle,
  FaCalculator,
  FaCheckCircle,
} from "react-icons/fa";
import "./ReferralCommissionModal.css";

const ReferralCommissionModal = ({ isOpen = true, onClose, onSaved, isInline = false }) => {
  const snackbar = useSnackbar();

  const [registeredSelf, setRegisteredSelf] = useState(5);
  const [registeredOther, setRegisteredOther] = useState(8);
  const [guestSelf, setGuestSelf] = useState(0);
  const [guestOther, setGuestOther] = useState(0);
  const [defaultPct, setDefaultPct] = useState(5);

  const [loading, setLoading] = useState(false);
  const [sampleConsultFee, setSampleConsultFee] = useState(500);

  useEffect(() => {
    if (!isOpen && !isInline) return;
    (async () => {
      try {
        const settings = await getGeneralSettings(true);
        const comm = settings?.commissionSettings || {};
        if (comm.registeredSelfPercentage !== undefined) setRegisteredSelf(comm.registeredSelfPercentage);
        if (comm.registeredOtherPercentage !== undefined) setRegisteredOther(comm.registeredOtherPercentage);
        if (comm.guestSelfPercentage !== undefined) setGuestSelf(comm.guestSelfPercentage);
        if (comm.guestOtherPercentage !== undefined) setGuestOther(comm.guestOtherPercentage);
        if (comm.defaultPercentage !== undefined) setDefaultPct(comm.defaultPercentage);
      } catch (err) {
        console.warn("Could not load commission settings:", err);
      }
    })();
  }, [isOpen, isInline]);

  if (!isOpen && !isInline) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        registeredSelfPercentage: Math.max(0, Math.min(100, Number(registeredSelf) || 0)),
        registeredOtherPercentage: Math.max(0, Math.min(100, Number(registeredOther) || 0)),
        guestSelfPercentage: Math.max(0, Math.min(100, Number(guestSelf) || 0)),
        guestOtherPercentage: Math.max(0, Math.min(100, Number(guestOther) || 0)),
        defaultPercentage: Math.max(0, Math.min(100, Number(defaultPct) || 0)),
      };

      const res = await updateCommissionSettingsApi(payload);
      if (res) {
        playSaveSound();
        snackbar.success("Predefined referral commission rules saved successfully!");
        if (onSaved) onSaved(res);
        if (onClose) onClose();
      } else {
        snackbar.error("Failed to save commission settings");
      }
    } catch (err) {
      console.error(err);
      snackbar.error("Error saving commission settings");
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = () => {
    playClickSound();
    setRegisteredSelf(5);
    setRegisteredOther(8);
    setGuestSelf(0);
    setGuestOther(0);
    setDefaultPct(5);
  };

  const modalBody = (
    <div className={`comm-modal-content ${isInline ? "is-inline-settings" : ""}`} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="comm-modal-header">
        <div className="comm-modal-title-box">
          <div className="comm-modal-icon">
            <FaPercentage />
          </div>
          <div>
            <h3>Predefined Referral Commission Rules</h3>
            <p>Automatically assign commission percentages based on referrer registration & patient type</p>
          </div>
        </div>
        {!isInline && onClose && (
          <button type="button" className="comm-modal-close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        )}
      </div>

      {/* Form Body */}
      <form onSubmit={handleSave} className="comm-modal-form">
          <div className="comm-rules-grid">
            {/* Rule 1: Registered Referrer Self */}
            <div className="comm-rule-card active-blue">
              <div className="comm-rule-top">
                <div className="comm-rule-badge blue">
                  <FaUserCheck /> Registered • Self Booking
                </div>
                <div className="comm-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="comm-number-input"
                    value={registeredSelf}
                    onChange={(e) => setRegisteredSelf(e.target.value)}
                    required
                  />
                  <span className="comm-pct-symbol">%</span>
                </div>
              </div>
              <p className="comm-rule-desc">
                When an enrolled partner / agent books an OPD appointment for <strong>themselves</strong> (e.g. 5% cashback benefit).
              </p>
            </div>

            {/* Rule 2: Registered Referrer for Someone Else */}
            <div className="comm-rule-card active-emerald">
              <div className="comm-rule-top">
                <div className="comm-rule-badge emerald">
                  <FaUserTie /> Registered • Booking for Others
                </div>
                <div className="comm-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="comm-number-input"
                    value={registeredOther}
                    onChange={(e) => setRegisteredOther(e.target.value)}
                    required
                  />
                  <span className="comm-pct-symbol">%</span>
                </div>
              </div>
              <p className="comm-rule-desc">
                When an enrolled partner / agent refers <strong>another patient</strong> (e.g. standard 8% commission payout).
              </p>
            </div>

            {/* Rule 3: Guest / Unregistered Self */}
            <div className="comm-rule-card active-slate">
              <div className="comm-rule-top">
                <div className="comm-rule-badge slate">
                  <FaUserTimes /> Guest • Self Booking
                </div>
                <div className="comm-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="comm-number-input"
                    value={guestSelf}
                    onChange={(e) => setGuestSelf(e.target.value)}
                    required
                  />
                  <span className="comm-pct-symbol">%</span>
                </div>
              </div>
              <p className="comm-rule-desc">
                When an unregistered public visitor books for <strong>themselves</strong> (typically 0% commission).
              </p>
            </div>

            {/* Rule 4: Guest / Unregistered for Others */}
            <div className="comm-rule-card active-purple">
              <div className="comm-rule-top">
                <div className="comm-rule-badge purple">
                  <FaUsers /> Guest • Booking for Others
                </div>
                <div className="comm-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="comm-number-input"
                    value={guestOther}
                    onChange={(e) => setGuestOther(e.target.value)}
                    required
                  />
                  <span className="comm-pct-symbol">%</span>
                </div>
              </div>
              <p className="comm-rule-desc">
                When an unregistered applicant books for <strong>another family member / friend</strong> (typically 0%).
              </p>
            </div>
          </div>

          {/* Fallback default */}
          <div className="comm-fallback-bar">
            <div className="comm-fallback-info">
              <FaInfoCircle />
              <span>Default Fallback Percentage (applied if matching rule cannot be determined):</span>
            </div>
            <div className="comm-input-wrap small">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="comm-number-input"
                value={defaultPct}
                onChange={(e) => setDefaultPct(e.target.value)}
                required
              />
              <span className="comm-pct-symbol">%</span>
            </div>
          </div>

          {/* Live Simulator Preview */}
          <div className="comm-simulation-box">
            <div className="comm-sim-header">
              <div className="comm-sim-title">
                <FaCalculator /> Payout Simulation on Consultation Fee:
              </div>
              <div className="comm-sim-fee-input">
                <span>₹</span>
                <input
                  type="number"
                  min="0"
                  value={sampleConsultFee}
                  onChange={(e) => setSampleConsultFee(Number(e.target.value) || 0)}
                  className="sim-fee-val"
                />
              </div>
            </div>
            <div className="comm-sim-grid">
              <div className="sim-chip blue">
                <span className="sim-label">Registered (Self)</span>
                <span className="sim-payout">₹{Math.round((sampleConsultFee * (Number(registeredSelf) || 0)) / 100)}</span>
                <span className="sim-pct">({registeredSelf}%)</span>
              </div>
              <div className="sim-chip emerald">
                <span className="sim-label">Registered (Other)</span>
                <span className="sim-payout">₹{Math.round((sampleConsultFee * (Number(registeredOther) || 0)) / 100)}</span>
                <span className="sim-pct">({registeredOther}%)</span>
              </div>
              <div className="sim-chip slate">
                <span className="sim-label">Guest (Self)</span>
                <span className="sim-payout">₹{Math.round((sampleConsultFee * (Number(guestSelf) || 0)) / 100)}</span>
                <span className="sim-pct">({guestSelf}%)</span>
              </div>
              <div className="sim-chip purple">
                <span className="sim-label">Guest (Other)</span>
                <span className="sim-payout">₹{Math.round((sampleConsultFee * (Number(guestOther) || 0)) / 100)}</span>
                <span className="sim-pct">({guestOther}%)</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="comm-modal-footer">
            <button
              type="button"
              className="btn-comm-reset"
              onClick={handleResetDefaults}
              disabled={loading}
            >
              Reset to Defaults
            </button>
            <div className="comm-modal-footer-right">
              <button
                type="button"
                className="btn-comm-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-comm-save"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Commission Rules"}
              </button>
            </div>
          </div>
        </form>
      </div>
  );

  if (isInline) {
    return modalBody;
  }

  return (
    <div className="comm-modal-overlay" onClick={onClose}>
      {modalBody}
    </div>
  );
};

export default ReferralCommissionModal;
