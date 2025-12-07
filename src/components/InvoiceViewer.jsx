import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Modal from 'react-modal';
import { toast } from 'react-toastify';

const InvoiceViewer = ({ invoiceId, isOpen, onClose }) => {
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (!invoiceId) {
      setInvoice(null);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get(`/api/v1/invoice/${invoiceId}`);
        let inv = data.invoice || data;
        if (Array.isArray(inv)) inv = inv[0];
        setInvoice(inv);
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Failed to load invoice');
        setInvoice(null);
      }
    })();
  }, [invoiceId]);

  const download = async () => {
    try {
      const resp = await api.get(`/api/v1/invoice/${invoiceId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice?.invoiceNumber || invoice?._id || 'invoice'}.html`;
      a.click();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Download failed');
      alert('Download failed');
    }
  };

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} ariaHideApp={false} style={{ content: { maxWidth: 700, margin: 'auto', borderRadius: 8, background: '#fff' } }}>
      <div style={{ padding: 24 }}>
        {invoice ? (
          <div>
            <div style={{ marginBottom: 8 }}>
              <b>Patient:</b> {invoice.patient ? `${invoice.patient.firstName || ''} ${invoice.patient.lastName || ''}` : '-'}
              <div style={{ color: '#666', fontSize: 14 }}>
                {invoice.patient?.age ? `Age: ${invoice.patient.age}` : ''}
                {invoice.patient?.gender ? `, Gender: ${invoice.patient.gender}` : ''}
                {invoice.patient?.phone ? `, Phone: ${invoice.patient.phone}` : ''}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}><b>Date:</b> {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : (invoice.date ? new Date(invoice.date).toLocaleDateString() : '-')}</div>
            <div style={{ marginBottom: 8 }}><b>Status:</b> <span style={{ padding: '2px 8px', background: '#f0f0f0', borderRadius: 4 }}>{invoice.status || '-'}</span></div>
            <div style={{ marginBottom: 8 }}><b>Items:</b>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Unit Price</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items && invoice.items.length > 0) ? invoice.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ padding: '4px 8px' }}>{it.description || '-'}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px' }}>{it.quantity || 0}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px' }}>{it.unitPrice || 0}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px' }}>{it.total || 0}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '8px' }}>No items</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginBottom: 8 }}><b>Subtotal:</b> {(Number(invoice.subtotal) || 0).toFixed(2)}</div>
            <div style={{ marginBottom: 8 }}><b>Tax:</b> {(Number(invoice.tax) || 0).toFixed(2)}</div>
            <div style={{ marginBottom: 8 }}><b>Discount:</b> {(Number(invoice.discount) || 0).toFixed(2)}</div>
            <div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 18 }}><b>Total:</b> {(Number(invoice.total) || 0).toFixed(2)}</div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button onClick={download} style={{ padding: '8px 20px', background: '#0859af', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Download</button>
              <button onClick={() => { if (window.history.length > 1) window.history.back(); else if (onClose) onClose(); }} style={{ padding: '8px 20px', background: '#eee', color: '#222', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        ) : <div><span className="loader"></span></div>}
      </div>
    </Modal>
  );
};

export default InvoiceViewer;
