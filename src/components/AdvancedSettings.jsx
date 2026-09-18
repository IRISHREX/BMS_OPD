import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../main";
import "./Settings.css";

const AdvancedSettings = () => {
  const navigate = useNavigate();
  const { admin } = useContext(Context);

  return (
    <section className="page">
      <div className="settings-page">
        <button onClick={() => navigate(-1)} className="back-btn add-btn">
          ← Go Back
        </button>
        <h2>Advanced Settings</h2>
        <p>CRUD operations for advanced options will be visualized here.</p>

        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-card-body">
              <h3>System Options</h3>
              <p>Configure system-level toggles (dummy).</p>
            </div>
          </div>
          <div className="settings-card">
            <div className="settings-card-body">
              <h3>Integrations</h3>
              <p>Manage third-party integrations (dummy).</p>
            </div>
          </div>
          <div
            className="settings-card"
            onClick={() => navigate("/settings/advanced/backups")}
            style={{ cursor: "pointer" }}
          >
            <div className="settings-card-body">
              <h3>Backups & Data Export</h3>
              <p>Export appointments and patients (Excel, CSV, PDF) and monitor storage.</p>
            </div>
          </div>
          {admin?.role === "Admin" && (
            <div
              className="settings-card"
              onClick={() => navigate("/settings/advanced/logs")}
              style={{ cursor: "pointer" }}
            >
              <div className="settings-card-body">
                <h3>Logs</h3>
                <p>View real-time audit trail, error logs, and system diagnostics.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdvancedSettings;
