import React, { useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaCheck,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import api from "../utils/api";
import {
  playSaveSound,
  playLoadSound,
  playDeleteSound,
} from "../utils/soundUtils";
import "./Settings.css";
import { MdOutlineEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoSearch, IoClose } from "react-icons/io5";


const InvoiceSettings = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    patient: "",
    doctor: "",
    appointment: "",
    status: "",
    start: "",
    end: "",
  });
  const [form, setForm] = useState({
    invoiceNumber: "",
    patient: "",
    appointment: "",
    doctor: "",
    items: [],
    tax: 0,
    discount: 0,
    dueDate: "",
    status: "Unpaid",
    notes: "",
  });
  const [editing, setEditing] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [dashboardUser, setDashboardUser] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const fetchInvoices = async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        page: opts.page || page,
        limit: opts.limit || limit,
        q: query,
        ...filters,
      };
      const { data } = await api.get("/api/v1/invoice", { params });
      setInvoices(data.invoices || []);
      setTotal(data.total || (data.invoices || []).length);
    } catch (e) {
      alert("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: userRes } = await api.get("/api/v1/user/dashboard/me");
        setDashboardUser(userRes.user);
      } catch (e) {
        setDashboardUser(null);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/v1/user/doctors");
        let allDoctors = data.doctors || [];
        if (dashboardUser) {
          if (dashboardUser.role === "Doctor") {
            allDoctors = allDoctors.filter(
              (doc) => doc._id === dashboardUser._id
            );
            setFilters((f) => ({ ...f, doctor: dashboardUser._id }));
          } else if (dashboardUser.role === "Compounder") {
            const assignedIds = (dashboardUser.assignedDoctors || []).map(
              (d) => (d._id ? d._id.toString() : d.toString())
            );
            allDoctors = allDoctors.filter((doc) =>
              assignedIds.includes(doc._id ? doc._id.toString() : doc.toString())
            );
            if (allDoctors.length > 0)
              setFilters((f) => ({ ...f, doctor: allDoctors[0]._id }));
          }
        }
        setDoctors(allDoctors);
      } catch (e) {
        setDoctors([]);
      }
    })();
  }, [dashboardUser]);

  useEffect(() => {
    fetchInvoices({ page: 1 });
  }, [filters.doctor, filters.status, filters.start, filters.end]);

  const statusBadgeClass = (status) => {
    if (!status) return "badge-status badge-unpaid";
    if (status === "Paid") return "badge-status badge-paid";
    if (status === "Partial") return "badge-status badge-partial";
    if (status === "Cancelled") return "badge-status badge-cancelled";
    return "badge-status badge-unpaid";
  };

  const handleSearch = async () => {
    setPage(1);
    fetchInvoices({ page: 1 });
  };

  const handleResetFilters = () => {
    setQuery("");
    setFilters({
      patient: "",
      doctor: "",
      appointment: "",
      status: "",
      start: "",
      end: "",
    });
    setPage(1);
    fetchInvoices({
      page: 1,
      q: "",
      patient: "",
      doctor: "",
      status: "",
      start: "",
      end: "",
    });
  };

  const handleOpenCreateInvoice = () => {
    setEditing(null);
    setForm({
      invoiceNumber: "",
      patient: "",
      appointment: "",
      doctor: "",
      items: [],
      tax: 0,
      discount: 0,
      dueDate: "",
      status: "Unpaid",
      notes: "",
    });
    setInvoiceModalOpen(true);
  };

  const handleCreateOrUpdate = async () => {
    try {
      const payload = {
        ...form,
        tax: Number(form.tax || 0),
        discount: Number(form.discount || 0),
      };
      const computedSubtotal = (payload.items || []).reduce(
        (s, it) =>
          s +
          (Number(it.total) ||
            Number(it.quantity || 0) * Number(it.unitPrice || 0)),
        0
      );
      payload.subtotal = computedSubtotal;
      payload.total = Math.max(
        0,
        computedSubtotal +
          Number(payload.tax || 0) -
          Number(payload.discount || 0)
      );
      if (editing) {
        const { data } = await api.put(`/api/v1/invoice/${editing}`, payload);
        playSaveSound();
        setInvoices((prev) =>
          prev.map((i) => (i._id === data.invoice._id ? data.invoice : i))
        );
        setEditing(null);
        alert("Invoice updated");
      } else {
        const { data } = await api.post("/api/v1/invoice", payload);
        playSaveSound();
        setInvoices((prev) => [data.invoice, ...prev]);
        alert("Invoice created");
      }
      setForm({
        invoiceNumber: "",
        patient: "",
        appointment: "",
        doctor: "",
        items: [],
        tax: 0,
        discount: 0,
        dueDate: "",
        status: "Unpaid",
        notes: "",
      });
      setInvoiceModalOpen(false);
    } catch (e) {
      alert("Failed to save invoice");
    }
  };

  const handleEdit = (inv) => {
    setEditing(inv._id || inv.id);
    const items = (inv.items || []).map((it) => ({
      description: it.description || "",
      quantity: Number(it.quantity || 1),
      unitPrice: Number(it.unitPrice || it.price || 0),
      total: Number(
        it.total != null
          ? it.total
          : Number(it.quantity || 1) * Number(it.unitPrice || it.price || 0)
      ),
      _id: it._id || String(Math.random()).slice(2),
    }));
    setForm({
      invoiceNumber: inv.invoiceNumber || "",
      patient: inv.patient?._id || inv.patient || "",
      appointment: inv.appointment?._id || inv.appointment || "",
      doctor: inv.doctor?._id || inv.doctor || "",
      items,
      tax: inv.tax || 0,
      discount: inv.discount || 0,
      dueDate: inv.dueDate ? String(inv.dueDate).slice(0, 10) : "",
      status: inv.status || "Unpaid",
      notes: inv.notes || "",
    });
    setInvoiceModalOpen(true);
  };

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [
        ...(f.items || []),
        {
          description: "New Item",
          quantity: 1,
          unitPrice: 0,
          total: 0,
          _id: String(Date.now()),
        },
      ],
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((f) => {
      const items = (f.items || []).map((it, i) => {
        if (i !== index) return it;
        const updated = { ...it };
        if (field === "description") updated.description = value;
        else if (field === "quantity") updated.quantity = Number(value || 0);
        else if (field === "unitPrice") updated.unitPrice = Number(value || 0);
        if (field === "quantity" || field === "unitPrice") {
          updated.total =
            Number(updated.quantity || 0) * Number(updated.unitPrice || 0);
        }
        return updated;
      });
      return { ...f, items };
    });
  };

  const removeItem = (index) => {
    setForm((f) => ({
      ...f,
      items: (f.items || []).filter((_, i) => i !== index),
    }));
  };

  const computedSubtotal = useMemo(() => {
    return (form.items || []).reduce(
      (s, it) =>
        s +
        (Number(it.total) ||
          Number(it.quantity || 0) * Number(it.unitPrice || 0)),
      0
    );
  }, [form.items]);

  const computedTotal = useMemo(
    () =>
      Math.max(
        0,
        computedSubtotal + Number(form.tax || 0) - Number(form.discount || 0)
      ),
    [computedSubtotal, form.tax, form.discount]
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete invoice?")) return;
    try {
      await api.delete(`/api/v1/invoice/${id}`);
      playDeleteSound();
      setInvoices((prev) => prev.filter((i) => i._id !== id && i.id !== id));
      alert("Deleted");
    } catch (e) {
      alert("Delete failed");
    }
  };

  return (
    <section className="page">
      <div className="medicine-page-header">
        <div className="header-title-group">
          <h2>Invoice Settings</h2>
          <p style={{ margin: 0 }}>
            Manage invoices: create, search, edit, delete and view stats.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenCreateInvoice}>
            <FaPlus style={{ marginRight: "8px" }} />
            Create Invoice
          </button>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: "1rem" }}>
        <div className="filter-group">
          <label>Search by Keyword</label>
          <input
            className="invoice-input"
            placeholder="Invoice #, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Patient ID</label>
          <input
            className="invoice-input"
            placeholder="Patient ID..."
            value={filters.patient}
            onChange={(e) =>
              setFilters({ ...filters, patient: e.target.value })
            }
          />
        </div>
        <div className="filter-box">
          <select
            value={filters.doctor}
            onChange={(e) =>
              setFilters((f) => ({ ...f, doctor: e.target.value }))
            }
            disabled={dashboardUser && dashboardUser.role === "Doctor"}
          >
            {dashboardUser && dashboardUser.role === "Admin" && (
              <option value="">All</option>
            )}
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.firstName} {d.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-box">
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">All Statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="filter-group">
          <label>From</label>
          <input
            type="date"
            className="invoice-input"
            value={filters.start}
            onChange={(e) =>
              setFilters((f) => ({ ...f, start: e.target.value }))
            }
          />
        </div>
        <div className="filter-group">
          <label>To</label>
          <input
            type="date"
            className="invoice-input"
            value={filters.end}
            onChange={(e) =>
              setFilters((f) => ({ ...f, end: e.target.value }))
            }
          />
        </div>
        <div className="filter-group" style={{ display: 'flex', gap: '6px' }}>
          <button className="btn-cls" onClick={handleSearch} title="Search">
            <IoSearch />
          </button>
          <button
            className="btn-cls secondary"
            onClick={handleResetFilters}
            title="Reset filters"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            Reset
          </button>
        </div>
      </div>
      <div
        className="invoice-list-wrap"
        // style={{
        //   maxHeight: "60vh",
        //   overflowY: "auto",
        //   border: "1px solid #eee",
        //   padding: 8,
        // }}
      >
        {loading ? (
          <div>Loading...</div>
        ) : (
          invoices.map((inv) => {
            const paid = (inv.payments || []).reduce(
              (s, p) => s + (Number(p.amount || p) || 0),
              0
            );
            const due = (Number(inv.total) || 0) - paid;
            return (
              <div
                className="invoice-card-item"
                key={inv._id || inv.id}
                // style={{
                //   borderBottom: "1px solid #f0f0f0",
                //   padding: 8,
                //   display: "flex",
                //   justifyContent: "space-between",
                //   alignItems: "center",
                // }}
              >
                <div>
                  <div
                    className="invoice-title-div"
                    // style={{
                    //   fontWeight: 700,
                    //   display: "flex",
                    //   gap: 8,
                    //   alignItems: "center",
                    // }}
                  >
                    <span className="invoice-numb">{inv.invoiceNumber}</span>
                    <span className={statusBadgeClass(inv.status)}>
                      {inv.status || "Unpaid"}
                    </span>
                  </div>
                  <div className="invoice-info">
                    Patient: {inv.patient?._id || inv.patient}
                  </div>
                  <div className="invoice-info">
                    Amount: {inv.total} • Paid: {paid} • Due: {due}
                  </div>
                </div>
                <div
                  className="btn-icn-container"
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <button
                    className="icn-btn"
                    onClick={() => handleEdit(inv)}
                    title="Edit"
                    aria-label={`Edit invoice ${
                      inv.invoiceNumber || inv._id || ""
                    }`}
                  >
                    <MdOutlineEdit />
                  </button>
                  <button
                    className="icn-btn"
                    onClick={() => handleDelete(inv._id || inv.id)}
                    title="Delete"
                    aria-label={`Delete invoice ${
                      inv.invoiceNumber || inv._id || ""
                    }`}
                  >
                    {/* <FaTrash /> */}
                    <RiDeleteBin6Line />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem 0' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Page {page} of {Math.max(1, Math.ceil(total / limit))} ({total} total records)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-small"
              disabled={page <= 1 || loading}
              onClick={() => {
                const nextP = Math.max(1, page - 1);
                setPage(nextP);
                fetchInvoices({ page: nextP });
              }}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-small"
              disabled={page * limit >= total || loading}
              onClick={() => {
                const nextP = page + 1;
                setPage(nextP);
                fetchInvoices({ page: nextP });
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {invoiceModalOpen && (
        <div
          className="invoice-modal-overlay"
          onClick={() => setInvoiceModalOpen(false)}
        >
          <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="invoice-modal-header">
              <div className="invoice-modal-title-group">
                <div className="invoice-modal-icon-badge">
                  <FaFileInvoiceDollar />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 className="invoice-modal-title">{editing ? "Edit Invoice" : "Create Invoice"}</h3>
                    {form.invoiceNumber && (
                      <span className="invoice-modal-chip">{form.invoiceNumber}</span>
                    )}
                    <span className={statusBadgeClass(form.status)}>
                      {form.status || "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="invoice-modal-close-btn"
                onClick={() => setInvoiceModalOpen(false)}
                title="Close"
              >
                <IoClose />
              </button>
            </div>

            {/* Body: 2-Column Responsive Layout */}
            <div className="invoice-modal-2col-body">
              {/* LEFT COLUMN: Metadata & Notes */}
              <div className="invoice-modal-left-col">
                <div className="invoice-section-title">Billing & Patient Info</div>
                <div className="invoice-form-compact-grid">
                  <div className="invoice-field-group">
                    <label>Invoice Number</label>
                    <input
                      className="invoice-input"
                      placeholder="e.g. INV-20260924-001"
                      value={form.invoiceNumber}
                      onChange={(e) =>
                        setForm({ ...form, invoiceNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="invoice-field-group">
                    <label>Patient ID / Name</label>
                    <input
                      className="invoice-input"
                      placeholder="Enter Patient ID or Name"
                      value={form.patient}
                      onChange={(e) => setForm({ ...form, patient: e.target.value })}
                    />
                  </div>

                  <div className="invoice-field-group">
                    <label>Attending Doctor</label>
                    {doctors.length > 0 ? (
                      <select
                        className="invoice-select"
                        value={form.doctor}
                        onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                      >
                        <option value="">-- Select Doctor --</option>
                        {doctors.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.firstName} {d.lastName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="invoice-input"
                        placeholder="Doctor ID"
                        value={form.doctor}
                        onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                      />
                    )}
                  </div>

                  <div className="invoice-grid-2col">
                    <div className="invoice-field-group">
                      <label>Due Date</label>
                      <input
                        className="invoice-input"
                        type="date"
                        value={form.dueDate}
                        onChange={(e) =>
                          setForm({ ...form, dueDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="invoice-field-group">
                      <label>Payment Status</label>
                      <select
                        className="invoice-select"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="invoice-field-group">
                    <label>Notes & Instructions (Optional)</label>
                    <textarea
                      className="invoice-notes-textarea"
                      placeholder="Payment remarks, terms, or patient notes..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      style={{ height: "60px", minHeight: "50px" }}
                    />
                    {form.appointment && (
                      <div className="sub-label">Linked Appointment: {form.appointment}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Line Items & Financial Summary */}
              <div className="invoice-modal-right-col">
                {/* Line Items Card */}
                <div className="invoice-items-card">
                  <div className="invoice-items-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="invoice-section-title" style={{ margin: 0 }}>Line Items</span>
                      <span className="invoice-items-count-badge">
                        {(form.items || []).length} item{(form.items || []).length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="invoice-add-item-btn"
                      onClick={addItem}
                    >
                      <FaPlus style={{ fontSize: "0.72rem" }} /> Add Line Item
                    </button>
                  </div>

                  <div className="invoice-items-table-wrapper">
                    <table className="invoice-items-table">
                      <thead>
                        <tr>
                          <th>Description / Service</th>
                          <th style={{ width: "65px", textAlign: "center" }}>Qty</th>
                          <th style={{ width: "95px", textAlign: "right" }}>Unit Price</th>
                          <th style={{ width: "95px", textAlign: "right" }}>Total</th>
                          <th style={{ width: "36px", textAlign: "center" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(form.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "1.2rem", color: "#64748b", fontSize: "0.82rem" }}>
                              No line items. Click <strong>"+ Add Line Item"</strong> above.
                            </td>
                          </tr>
                        ) : (
                          (form.items || []).map((it, idx) => (
                            <tr key={it._id || idx}>
                              <td>
                                <input
                                  className="invoice-item-input"
                                  placeholder="Service / Item name..."
                                  value={it.description}
                                  onChange={(e) =>
                                    updateItem(idx, "description", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  className="invoice-item-input"
                                  style={{ textAlign: "center" }}
                                  type="number"
                                  min={0}
                                  value={it.quantity}
                                  onChange={(e) =>
                                    updateItem(idx, "quantity", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  className="invoice-item-input"
                                  style={{ textAlign: "right" }}
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={it.unitPrice}
                                  onChange={(e) =>
                                    updateItem(idx, "unitPrice", e.target.value)
                                  }
                                />
                              </td>
                              <td style={{ textAlign: "right", fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>
                                ₹{(Number(it.total) || 0).toFixed(2)}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <button
                                  type="button"
                                  className="invoice-item-del-btn"
                                  title="Delete Item"
                                  onClick={() => removeItem(idx)}
                                >
                                  <RiDeleteBin6Line />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="invoice-summary-card">
                  <div className="invoice-summary-row">
                    <span>Subtotal:</span>
                    <strong>₹ {computedSubtotal.toFixed(2)}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>Tax (₹):</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="invoice-item-input"
                      style={{ width: "85px", height: "28px", textAlign: "right" }}
                      value={form.tax}
                      onChange={(e) =>
                        setForm({ ...form, tax: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="invoice-summary-row">
                    <span>Discount (₹):</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="invoice-item-input"
                      style={{ width: "85px", height: "28px", textAlign: "right" }}
                      value={form.discount}
                      onChange={(e) =>
                        setForm({ ...form, discount: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="invoice-summary-row total">
                    <span>Total Amount:</span>
                    <span style={{ color: "#4f46e5" }}>₹ {computedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="invoice-modal-footer">
              <span className="invoice-footer-hint">
                All amounts are auto-calculated dynamically
              </span>
              <div className="invoice-footer-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setInvoiceModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateOrUpdate}
                >
                  <FaCheck style={{ marginRight: "6px" }} />
                  {editing ? "Update Invoice" : "Create Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default InvoiceSettings;
