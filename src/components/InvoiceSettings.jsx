import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import './Settings.css';

const InvoiceSettings = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ patient:'', doctor:'', appointment:'', status:'', start: '', end: '' });
  const [form, setForm] = useState({ invoiceNumber: '', patient: '', appointment: '', doctor:'', items: [], tax:0, discount:0, dueDate: '', status: 'Unpaid', notes: '' });
  const [editing, setEditing] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [dashboardUser, setDashboardUser] = useState(null);

  const fetchInvoices = async (opts={}) => {
    setLoading(true);
    try {
      const params = { page: opts.page || page, limit: opts.limit || limit, q: query, ...filters };
      const { data } = await api.get('/api/v1/invoice', { params });
      setInvoices(data.invoices || []);
      // backend returns invoices list; compute total locally when not provided
      setTotal(data.total || (data.invoices || []).length);
  } catch (e) { alert('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // fetch current user
    (async () => {
      try {
        const { data: userRes } = await api.get('/api/v1/user/dashboard/me');
        setDashboardUser(userRes.user);
      } catch (e) {
        setDashboardUser(null);
      }
    })();
  }, []);

  useEffect(() => {
    // load doctors for filter
    (async () => {
      try {
        const { data } = await api.get("/api/v1/user/doctors");
        let allDoctors = data.doctors || [];
        // Role-based filtering
        if (dashboardUser) {
          if (dashboardUser.role === 'Doctor') {
            allDoctors = allDoctors.filter(doc => doc._id === dashboardUser._id);
            setFilters(f => ({ ...f, doctor: dashboardUser._id }));
          } else if (dashboardUser.role === 'Compounder') {
            allDoctors = allDoctors.filter(doc => (dashboardUser.assignedDoctors || []).includes(doc._id));
            if (allDoctors.length > 0) setFilters(f => ({ ...f, doctor: allDoctors[0]._id }));
          }
        }
        setDoctors(allDoctors);
      } catch (e) {
        setDoctors([]);
      }
    })();
  }, [dashboardUser]);

  useEffect(()=>{ fetchInvoices({ page:1 }); }, [filters.doctor, filters.status, filters.start, filters.end]);

  const handleSearch = async () => { setPage(1); fetchInvoices({ page:1 }); };

  const handleCreateOrUpdate = async () => {
    try {
      // ensure numeric values and valid items; include computed totals
      const payload = { ...form, tax: Number(form.tax || 0), discount: Number(form.discount || 0) };
      // compute subtotal and total from items to send to backend (backend will normalize too)
      const computedSubtotal = (payload.items || []).reduce((s, it) => s + (Number(it.total) || (Number(it.quantity || 0) * Number(it.unitPrice || 0)) ), 0);
      payload.subtotal = computedSubtotal;
      payload.total = Math.max(0, computedSubtotal + Number(payload.tax || 0) - Number(payload.discount || 0));
      if (editing) {
        const { data } = await api.put(`/api/v1/invoice/${editing}`, payload);
        setInvoices(prev => prev.map(i => (i._id === data.invoice._id ? data.invoice : i)));
        setEditing(null);
        alert('Invoice updated');
      } else {
        const { data } = await api.post('/api/v1/invoice', payload);
        setInvoices(prev => [data.invoice, ...prev]);
        alert('Invoice created');
      }
      setForm({ invoiceNumber: '', patient: '', appointment: '', doctor:'', items: [], tax:0, discount:0, dueDate: '', status: 'Unpaid', notes: '' });
  } catch (e) { alert('Failed to save invoice'); }
  };

  const handleEdit = (inv) => {
    setEditing(inv._id || inv.id);
    const items = (inv.items || []).map(it => ({
      description: it.description || '',
      quantity: Number(it.quantity || 1),
      unitPrice: Number(it.unitPrice || it.price || 0),
      total: Number(it.total != null ? it.total : (Number(it.quantity || 1) * Number(it.unitPrice || it.price || 0))),
      _id: it._id || String(Math.random()).slice(2)
    }));
    setForm({ invoiceNumber: inv.invoiceNumber || '', patient: inv.patient?._id || inv.patient || '', appointment: inv.appointment?._id || inv.appointment || '', doctor: inv.doctor?._id || inv.doctor || '', items, tax: inv.tax||0, discount: inv.discount||0, dueDate: inv.dueDate||'', status: inv.status||'Unpaid' });
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [ ...(f.items || []), { description: '', quantity: 1, unitPrice: 0, total: 0, _id: String(Date.now()) } ] }));
  };

  const updateItem = (index, field, value) => {
    setForm(f => {
      const items = (f.items || []).map((it, i) => {
        if (i !== index) return it;
        const updated = { ...it };
        if (field === 'description') updated.description = value;
        else if (field === 'quantity') updated.quantity = Number(value || 0);
        else if (field === 'unitPrice') updated.unitPrice = Number(value || 0);
        // recalc total when qty or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = Number(updated.quantity || 0) * Number(updated.unitPrice || 0);
        }
        return updated;
      });
      return { ...f, items };
    });
  };

  const removeItem = (index) => {
    setForm(f => ({ ...f, items: (f.items || []).filter((_, i) => i !== index) }));
  };

  const computedSubtotal = useMemo(() => {
    return (form.items || []).reduce((s, it) => s + (Number(it.total) || (Number(it.quantity || 0) * Number(it.unitPrice || 0)) ), 0);
  }, [form.items]);

  const computedTotal = useMemo(() => Math.max(0, computedSubtotal + Number(form.tax || 0) - Number(form.discount || 0)), [computedSubtotal, form.tax, form.discount]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete invoice?')) return;
  try { await api.delete(`/api/v1/invoice/${id}`); setInvoices(prev => prev.filter(i => i._id !== id && i.id !== id)); alert('Deleted'); } catch(e){ alert('Delete failed'); }
  };

  const fetchByAppointment = async (appointmentId) => {
  try { const { data } = await api.get(`/api/v1/invoice/appointment/${appointmentId}`); return data.invoices || data.invoice || data; } catch(e){ alert('Fetch by appointment failed'); return null; }
  };

  const handleUpdateByAppointment = async (appointmentId, partial) => {
  try { const { data } = await api.put(`/api/v1/invoice/appointment/${appointmentId}`, partial); alert(`Updated ${data.updatedCount} invoices`); return data; } catch(e){ alert('Update by appointment failed'); }
  };

  const stats = useMemo(()=>({}), []);

  return (
    <section className="page">
      <div className="settings-header">
        <h2>Invoice Settings</h2>
        <p>Manage invoices: create, search, edit, delete and view stats.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:20 }}>
        <div>
          <h3>{editing ? 'Edit Invoice' : 'Create Invoice'}</h3>
          <div style={{ display:'grid', gap:8 }}>
            <input placeholder="Invoice Number" value={form.invoiceNumber} onChange={e=>setForm({...form, invoiceNumber: e.target.value})} />
            <input placeholder="Patient ID" value={form.patient} onChange={e=>setForm({...form, patient: e.target.value})} />
            <input placeholder="Appointment ID (optional)" value={form.appointment} onChange={e=>setForm({...form, appointment: e.target.value})} />
            <input placeholder="Doctor ID (optional)" value={form.doctor} onChange={e=>setForm({...form, doctor: e.target.value})} />
            <div style={{ border: '1px solid #e8e8e8', padding: 8, borderRadius: 6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontWeight:600 }}>Items</div>
                <div>
                  <button onClick={addItem} style={{ padding: '6px 10px' }}>+ Add Item</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>
                    <th style={{ padding: '6px' }}>Description</th>
                    <th style={{ padding: '6px', width: 80 }}>Qty</th>
                    <th style={{ padding: '6px', width: 120 }}>Unit Price</th>
                    <th style={{ padding: '6px', width: 120 }}>Total</th>
                    <th style={{ padding: '6px', width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(form.items || []).length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 8, textAlign: 'center', color:'#666' }}>No items added</td></tr>
                  )}
                  {(form.items || []).map((it, idx) => (
                    <tr key={it._id || idx}>
                      <td style={{ padding: 6 }}>
                        <input value={it.description} onChange={e=>updateItem(idx, 'description', e.target.value)} style={{ width: '100%' }} />
                      </td>
                      <td style={{ padding: 6 }}>
                        <input type="number" min={0} value={it.quantity} onChange={e=>updateItem(idx, 'quantity', e.target.value)} style={{ width: '100%' }} />
                      </td>
                      <td style={{ padding: 6 }}>
                        <input type="number" min={0} value={it.unitPrice} onChange={e=>updateItem(idx, 'unitPrice', e.target.value)} style={{ width: '100%' }} />
                      </td>
                      <td style={{ padding: 6, textAlign: 'right' }}>{(Number(it.total) || 0).toFixed(2)}</td>
                      <td style={{ padding: 6 }}>
                        <button onClick={()=>removeItem(idx)} style={{ color:'#c00' }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <input placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} />
            <div style={{ display:'grid',gridTemplateColumns:'150px 100px 100px', gap:8, width:'100%' }}>
              <input placeholder="Due Date" type='date' value={form.dueDate} onChange={e=>setForm({...form, dueDate: e.target.value})} />
              <input placeholder="Tax" value={form.tax} onChange={e=>setForm({...form, tax: Number(e.target.value)})} />
              <input placeholder="Discount" value={form.discount} onChange={e=>setForm({...form, discount: Number(e.target.value)})} />
            </div>
            <label style={{ marginTop: 6 }}>Status:
              <select value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
              <div style={{ fontSize:14 }}>
                <div>Subtotal: <strong>{computedSubtotal.toFixed(2)}</strong></div>
                <div>Tax: <strong>{Number(form.tax || 0).toFixed(2)}</strong> • Discount: <strong>{Number(form.discount || 0).toFixed(2)}</strong></div>
                <div style={{ marginTop:6, fontSize:16 }}>Total: <strong>{computedTotal.toFixed(2)}</strong></div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleCreateOrUpdate}>{editing ? 'Update' : 'Create'}</button>
                {editing && <button onClick={()=>{ setEditing(null); setForm({ invoiceNumber: '', patient: '', appointment: '', doctor:'', items: [], tax:0, discount:0, dueDate: '', status: 'Unpaid', notes: '' }); }}>Cancel</button>}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3>Search & List</h3>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <input placeholder="Search q" value={query} onChange={e=>setQuery(e.target.value)} />
            <input placeholder="Patient ID" value={filters.patient} onChange={e=>setFilters({...filters, patient: e.target.value})} />
            <label>Doctor:
              <select
                value={filters.doctor}
                onChange={e => setFilters(f => ({ ...f, doctor: e.target.value }))}
                disabled={dashboardUser && dashboardUser.role === 'Doctor'}
              >
                {dashboardUser && dashboardUser.role === 'Admin' && (
                  <option value="">All</option>
                )}
                {doctors.map(d => <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>)}
              </select>
            </label>
            <button onClick={handleSearch}>Search</button>
          </div>
          <div style={{ maxHeight: '60vh', overflowY: 'auto', border: '1px solid #eee', padding:8 }}>
            {loading ? <div>Loading...</div> : (
              invoices.map(inv => {
                const paid = (inv.payments || []).reduce((s, p) => s + (Number(p.amount || p) || 0), 0);
                const due = (Number(inv.total) || 0) - paid;
                return (
                <div key={inv._id || inv.id} style={{ borderBottom:'1px solid #f0f0f0', padding:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700 }}>{inv.invoiceNumber}</div>
                    <div style={{ color:'#666' }}>Patient: {inv.patient?._id || inv.patient}</div>
                    <div style={{ color:'#666' }}>Amount: {inv.total} • Paid: {paid} • Due: {due}</div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>handleEdit(inv)}>Edit</button>
                    <button onClick={()=>navigator.clipboard.writeText(inv._id || inv.id)}>Copy ID</button>
                    <button onClick={()=>handleDelete(inv._id || inv.id)}>Delete</button>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvoiceSettings;
