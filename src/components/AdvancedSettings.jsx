import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../main";
import { FaArrowLeft, FaDatabase, FaClipboardList, FaHeading, FaServer, FaCheckCircle } from "react-icons/fa";
import api from "../utils/api";
import "./Settings.css";

const AdvancedSettings = () => {
  const navigate = useNavigate();
  const { admin } = useContext(Context);
  const [apiHealth, setApiHealth] = useState("checking");

  useEffect(() => {
    (async () => {
      try {
        await api.get("/api/v1/user/dashboard/me");
        setApiHealth("online");
      } catch (e) {
        setApiHealth("offline");
      }
    })();
  }, []);

  return (
    <section className="page">
      <div className="settings-page">
        <button onClick={() => navigate(-1)} className="back-btn add-btn" style={{ marginBottom: "1rem" }}>
          <FaArrowLeft style={{ marginRight: 6 }} /> Go Back
        </button>
        <h2>Advanced & System Settings</h2>
        <p style={{ color: "#64748b", marginTop: 4 }}>
          System diagnostics, audit logs, automated backups, and template branding.
        </p>

        <div className="settings-grid" style={{ marginTop: "1.5rem" }}>
          <div
            className="settings-card"
            onClick={() => navigate("/settings/advanced/backups")}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
          >
            <div className="settings-card-icon">
              <FaDatabase size={28} color="#0284c7" />
            </div>
            <div className="settings-card-body">
              <h3>Backups & Data Export</h3>
              <p>Export patient records and appointments (Excel, CSV, PDF) and inspect storage.</p>
            </div>
          </div>

          {admin?.role === "Admin" && (
            <div
              className="settings-card"
              onClick={() => navigate("/settings/advanced/logs")}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
            >
              <div className="settings-card-icon">
                <FaClipboardList size={28} color="#8b5cf6" />
              </div>
              <div className="settings-card-body">
                <h3>System Logs & Audit Trail</h3>
                <p>Inspect real-time authentication events, system errors, and diagnostics.</p>
              </div>
            </div>
          )}

          <div
            className="settings-card"
            onClick={() => navigate("/settings/header-footer")}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
          >
            <div className="settings-card-icon">
              <FaHeading size={28} color="#6366f1" />
            </div>
            <div className="settings-card-body">
              <h3>Prescription Branding</h3>
              <p>Generate bilingual print headers and footers for physical Rx pads.</p>
            </div>
          </div>

          <div className="settings-card" style={{ cursor: "default" }}>
            <div className="settings-card-icon">
              <FaServer size={28} color={apiHealth === "online" ? "#10b981" : "#f59e0b"} />
            </div>
            <div className="settings-card-body">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>API Server Status</h3>
                {apiHealth === "online" && (
                  <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                    ONLINE
                  </span>
                )}
              </div>
              <p>
                Connected to: <code style={{ fontSize: "0.8rem", color: "#0284c7" }}>https://bms-opd-be.onrender.com</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvancedSettings;
