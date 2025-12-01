import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Reusable form for creating/updating a Medicine
// Fields: name, composition (comma separated), type, dose, frequency, route, duration, notes
const MedicineForm = ({ initialData = {}, onSave, onCancel, submitLabel = 'Save' }) => {
  const [form, setForm] = useState({
    name: '',
    composition: '', // internal representation as comma-separated string
    type: '',
    dose: '',
    frequency: '',
    route: '',
    duration: '',
    notes: '',
  });

  useEffect(() => {
    if (!initialData) return;
    setForm({
      name: initialData.name || '',
      composition: Array.isArray(initialData.composition) ? initialData.composition.join(', ') : (initialData.composition || ''),
      type: initialData.type || '',
      dose: initialData.dose || '',
      frequency: initialData.frequency || '',
      route: initialData.route || '',
      duration: initialData.duration || '',
      notes: initialData.notes || '',
    });
  }, [initialData]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e && e.preventDefault();
    // normalize composition into array of trimmed strings
    const compositionArray = String(form.composition || '').split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      name: (form.name || '').trim(),
      composition: compositionArray,
      type: (form.type || '').trim(),
      dose: (form.dose || '').trim(),
      frequency: (form.frequency || '').trim(),
      route: (form.route || '').trim(),
      duration: (form.duration || '').trim(),
      notes: (form.notes || '').trim(),
    };
    if (!payload.name) return alert('Name is required');
    if (onSave) onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label>
        Name *
        <input name="name" value={form.name} onChange={handleChange} required />
      </label>

      <label>
        Composition (comma separated)
        <input name="composition" value={form.composition} onChange={handleChange} placeholder="paracetamol, caffeine" />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <label style={{ flex: 1 }}>
          Type
          <input name="type" value={form.type} onChange={handleChange} />
        </label>
        <label style={{ flex: 1 }}>
          Dose
          <input name="dose" value={form.dose} onChange={handleChange} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <label style={{ flex: 1 }}>
          Frequency
          <input name="frequency" value={form.frequency} onChange={handleChange} />
        </label>
        <label style={{ flex: 1 }}>
          Route
          <input name="route" value={form.route} onChange={handleChange} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <label style={{ flex: 1 }}>
          Duration
          <input name="duration" value={form.duration} onChange={handleChange} />
        </label>
        <label style={{ flex: 1 }}>
          Notes
          <input name="notes" value={form.notes} onChange={handleChange} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
        <button type="button" className="clear-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="add-btn">{submitLabel}</button>
      </div>
    </form>
  );
};

MedicineForm.propTypes = {
  initialData: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  submitLabel: PropTypes.string,
};

export default MedicineForm;
