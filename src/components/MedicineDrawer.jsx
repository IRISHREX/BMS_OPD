import React from 'react';
import MedicineSearch from './MedicineSearch';
import { FaTrash, FaTimes, FaSearch, FaPills, FaVial, FaFileMedical } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';

const MedicineDrawer = ({
  form,
  handleChange,
  handleSubmit,
  saving,
  editingId,
  error,
  addMedicineRow,
  updateMedicineRow,
  removeMedicineRow,
  addTestRow,
  updateTestRow,
  removeTestRow,
  clearForm,
  onClose,
  medicineRowRefs,
  focusedMedicineIndex,
  addSelectedMedicine,
}) => {
  return (
    <div className="protocol-drawer-overlay" onClick={onClose}>
      <div className="protocol-drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="protocol-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(26, 158, 155, 0.12)',
                color: 'var(--accent, #1a9e9b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <FaFileMedical />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              {editingId ? 'Edit Treatment Protocol' : 'Create Treatment Protocol'}
            </h3>
          </div>
          <button
            className="protocol-drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
            title="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Drawer Form Body */}
        <div className="protocol-drawer-body">
          <form onSubmit={handleSubmit} className="medicine-form">
            {/* Basic Info Section */}
            <div className="protocol-form-section-title">
              <FaFileMedical style={{ color: 'var(--accent, #1a9e9b)' }} />
              <span>General Protocol Information</span>
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>
                Condition / Protocol Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Frozen Shoulder, Type 2 Diabetes"
                required
                className="protocol-row-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>
                  Specialty / Type
                </label>
                <input
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  placeholder="e.g. Ortho, General, Derm"
                  className="protocol-row-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>
                  Effected Area / Route
                </label>
                <input
                  name="route"
                  value={form.route}
                  onChange={handleChange}
                  placeholder="e.g. Shoulder, Oral, Topical"
                  className="protocol-row-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>
                Symptoms (comma separated)
              </label>
              <input
                name="symptoms"
                value={form.symptoms}
                onChange={handleChange}
                placeholder="e.g. Shoulder stiffness, Decreased range of motion, Pain"
                className="protocol-row-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>
                Clinical Description & Indications
              </label>
              <textarea
                name="desese_description"
                value={form.desese_description}
                onChange={handleChange}
                rows={3}
                placeholder="Detailed clinical notes or description of the protocol..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Structured Medicines Section */}
            <div className="protocol-form-section-title">
              <FaPills style={{ color: 'var(--accent, #1a9e9b)' }} />
              <span>Standard Prescribed Medicines</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                background: 'var(--bg-subtle, #f8fafc)',
                padding: 12,
                borderRadius: 10,
                border: '1px solid var(--border-color, #e2e8f0)',
              }}
            >
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  <FaSearch style={{ marginRight: 6, color: '#0284c7' }} /> Add Medicine by Name
                </label>
                <MedicineSearch
                  searchBy="name"
                  onSelect={(medicine) => {
                    if (typeof addSelectedMedicine === 'function') addSelectedMedicine(medicine);
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  <FaSearch style={{ marginRight: 6, color: '#0284c7' }} /> Add Medicine by Composition
                </label>
                <MedicineSearch
                  onSelect={(medicine) => {
                    if (typeof addSelectedMedicine === 'function') addSelectedMedicine(medicine);
                  }}
                />
              </div>
            </div>

            {/* List of Structured Medicines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {(form.medicines || []).map((m, idx) => (
                <div
                  key={idx}
                  ref={(el) => {
                    if (medicineRowRefs && medicineRowRefs.current) medicineRowRefs.current[idx] = el;
                  }}
                  className="protocol-row-card"
                  style={{
                    background: focusedMedicineIndex === idx ? 'rgba(245, 158, 11, 0.08)' : undefined,
                    borderColor: focusedMedicineIndex === idx ? '#f59e0b' : undefined,
                  }}
                >
                  <input
                    placeholder="Medicine Name *"
                    value={m.name || ''}
                    onChange={(e) => updateMedicineRow(idx, 'name', e.target.value)}
                    className="protocol-row-input"
                    style={{ flex: 2.2, minWidth: 150 }}
                  />
                  <input
                    placeholder="Type (e.g. Tab)"
                    value={m.type || ''}
                    onChange={(e) => updateMedicineRow(idx, 'type', e.target.value)}
                    className="protocol-row-input"
                    style={{ flex: 1.2, minWidth: 95 }}
                  />
                  <input
                    placeholder="Dose"
                    value={m.dose || ''}
                    onChange={(e) => updateMedicineRow(idx, 'dose', e.target.value)}
                    className="protocol-row-input"
                    style={{ flex: 0.9, minWidth: 75 }}
                  />
                  <input
                    placeholder="Freq"
                    value={m.frequency || ''}
                    onChange={(e) => updateMedicineRow(idx, 'frequency', e.target.value)}
                    className="protocol-row-input"
                    style={{ flex: 0.9, minWidth: 75 }}
                  />
                  <input
                    placeholder="Duration"
                    value={m.duration || ''}
                    onChange={(e) => updateMedicineRow(idx, 'duration', e.target.value)}
                    className="protocol-row-input"
                    style={{ flex: 1.1, minWidth: 90 }}
                  />
                  <input
                    placeholder="Notes / Route"
                    value={m.notes || ''}
                    onChange={(e) => updateMedicineRow(idx, 'notes', e.target.value)}
                    className="protocol-row-input"
                    style={{ flex: 1.6, minWidth: 110 }}
                  />
                  <button
                    type="button"
                    className="protocol-row-delete-btn"
                    title="Remove Medicine"
                    aria-label="Remove medicine row"
                    onClick={() => removeMedicineRow(idx)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMedicineRow}
                style={{
                  alignSelf: 'flex-start',
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px dashed var(--border-color, #cbd5e1)',
                  background: 'var(--bg-subtle, #f8fafc)',
                  color: 'var(--accent, #1a9e9b)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                + Add Medicine Row
              </button>
            </div>

            {/* Diagnostic Test Section */}
            <div className="protocol-form-section-title">
              <FaVial style={{ color: 'var(--accent, #1a9e9b)' }} />
              <span>Recommended Diagnostic Tests</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(form.testAdvice || []).map((t, idx) => (
                <div key={idx} className="protocol-row-card">
                  <input
                    placeholder="Test Name (e.g. X-Ray Shoulder)"
                    value={t.testName || ''}
                    onChange={(e) => updateTestRow(idx, 'testName', e.target.value)}
                    className="protocol-row-input"
                    style={{ flex: 2.2, minWidth: 170 }}
                  />
                  <input
                    placeholder="Test Type"
                    value={t.testType || ''}
                    onChange={(e) => updateTestRow(idx, 'testType', e.target.value)}
                    className="protocol-row-input"
                    style={{ flex: 1.3, minWidth: 100 }}
                  />
                  <input
                    placeholder="Precautions"
                    value={t.precautions || ''}
                    onChange={(e) => updateTestRow(idx, 'precautions', e.target.value)}
                    className="protocol-row-input"
                    style={{ flex: 1.8, minWidth: 120 }}
                  />
                  <input
                    type="date"
                    value={t.testDate ? t.testDate.slice(0, 10) : ''}
                    onChange={(e) => updateTestRow(idx, 'testDate', e.target.value)}
                    className="protocol-row-input protocol-date-input"
                  />
                  <button
                    type="button"
                    className="protocol-row-delete-btn"
                    title="Remove Test"
                    aria-label="Remove test row"
                    onClick={() => removeTestRow(idx)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTestRow}
                style={{
                  alignSelf: 'flex-start',
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px dashed var(--border-color, #cbd5e1)',
                  background: 'var(--bg-subtle, #f8fafc)',
                  color: 'var(--accent, #1a9e9b)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                + Add Lab Test Row
              </button>
            </div>

            {/* Care Guidance & Tags Section */}
            <div className="protocol-form-section-title">
              <LuSparkles style={{ color: 'var(--accent, #1a9e9b)' }} />
              <span>Care Advice & Classification Tags</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>
                  General Medication Guidance
                </label>
                <textarea
                  name="medication"
                  value={form.medication}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Take after meals, Drink plenty of water..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-card, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>
                  Dietary & Lifestyle Advice
                </label>
                <textarea
                  name="diet"
                  value={form.diet}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Avoid oily foods, gentle shoulder exercises..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-card, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4, display: 'block' }}>
                Classification Tags (comma separated)
              </label>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="e.g. Ortho, Shoulder, Joint Pain"
                className="protocol-row-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Actions Bar */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--border-color, #e2e8f0)',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={clearForm}
                style={{
                  height: 40,
                  padding: '0 18px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-subtle, #f8fafc)',
                  color: 'var(--text-muted, #64748b)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  height: 40,
                  padding: '0 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--btn-gradient, linear-gradient(135deg, #1a9e9b, #2f78c8))',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(26, 158, 155, 0.25)',
                }}
              >
                {saving ? 'Saving...' : editingId ? 'Update Protocol' : 'Create Protocol'}
              </button>
            </div>

            {error && (
              <div
                style={{
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.1)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginTop: 10,
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default MedicineDrawer;
