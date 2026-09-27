import React from 'react';
import './MedicineCard.css';
import { FaTimes, FaEdit, FaPills, FaVial, FaNotesMedical, FaStethoscope } from 'react-icons/fa';
import { LuTag, LuSparkles } from 'react-icons/lu';

const MedicineCard = ({ advice, onClose, onEdit }) => {
  if (!advice) return null;

  return (
    <div className="protocol-view-modal-overlay" onClick={onClose}>
      <div className="protocol-view-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="protocol-view-modal-header">
          <div className="protocol-view-header-left">
            <div className="protocol-view-icon-wrap">
              <FaStethoscope />
            </div>
            <div>
              <h3 className="protocol-view-modal-title">{advice.name || 'Protocol Details'}</h3>
              {advice.type && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                  Specialty: <strong>{advice.type}</strong>
                </span>
              )}
            </div>
          </div>
          <button
            className="protocol-view-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            title="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="protocol-view-modal-body">
          {/* Clinical Indications / Description */}
          {advice.desese_description && (
            <div className="protocol-view-section">
              <div className="protocol-view-section-header">
                <FaNotesMedical className="sec-icon" />
                <span>Description & Clinical Notes</span>
              </div>
              <p className="protocol-view-description-text">{advice.desese_description}</p>
            </div>
          )}

          {/* Primary Symptoms */}
          {advice.symptoms?.length > 0 && (
            <div className="protocol-view-section">
              <div className="protocol-view-section-header">
                <LuTag className="sec-icon" />
                <span>Symptoms & Indications</span>
              </div>
              <div className="protocol-view-tags-wrap">
                {advice.symptoms.map((symptom, i) => (
                  <span key={i} className="protocol-view-symptom-tag">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prescribed Medicines */}
          {advice.medicines?.length > 0 && (
            <div className="protocol-view-section">
              <div className="protocol-view-section-header">
                <FaPills className="sec-icon" />
                <span>Standard Medication Regimen ({advice.medicines.length})</span>
              </div>
              <div className="protocol-view-table-wrapper">
                <table className="protocol-view-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Type</th>
                      <th>Dose</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advice.medicines.map((med, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{med.name}</td>
                        <td>{med.type || '-'}</td>
                        <td>{med.dose || '-'}</td>
                        <td>{med.frequency || '-'}</td>
                        <td>{med.duration || '-'}</td>
                        <td style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem' }}>
                          {med.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Diagnostic Lab Tests */}
          {advice.testAdvice?.length > 0 && (
            <div className="protocol-view-section">
              <div className="protocol-view-section-header">
                <FaVial className="sec-icon" />
                <span>Recommended Diagnostic Tests ({advice.testAdvice.length})</span>
              </div>
              <ul className="protocol-view-test-list">
                {advice.testAdvice.map((test, i) => (
                  <li key={i} className="protocol-view-test-item">
                    <span className="test-dot"></span>
                    <span style={{ fontWeight: 600 }}>{test.testName}</span>
                    {test.testType && (
                      <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem' }}>
                        ({test.testType})
                      </span>
                    )}
                    {test.precautions && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#f59e0b' }}>
                        ⚠️ {test.precautions}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* General Medication / Diet Advice */}
          {(advice.medication || advice.diet) && (
            <div className="protocol-view-section">
              <div className="protocol-view-section-header">
                <LuSparkles className="sec-icon" />
                <span>Care Advice & Dietary Guidance</span>
              </div>
              {advice.medication && (
                <p className="protocol-view-description-text" style={{ marginBottom: advice.diet ? 8 : 0 }}>
                  <strong>Medication Guidance:</strong> {advice.medication}
                </p>
              )}
              {advice.diet && (
                <p className="protocol-view-description-text">
                  <strong>Dietary Advice:</strong> {advice.diet}
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {advice.tags?.length > 0 && (
            <div className="protocol-view-section">
              <div className="protocol-view-section-header">
                <LuTag className="sec-icon" />
                <span>Classification Tags</span>
              </div>
              <div className="protocol-view-tags-wrap">
                {advice.tags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'var(--bg-card, #ffffff)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="protocol-view-modal-footer">
          <button className="protocol-modal-btn secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="protocol-modal-btn primary"
            onClick={() => {
              onEdit(advice);
              onClose();
            }}
          >
            <FaEdit />
            <span>Edit Protocol</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicineCard;