import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  FileCheck2,
  Plus,
  Edit,
  AlertTriangle,
  Search,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  const [form, setForm] = useState({
    shipment_id: '',
    acknowledgement_method: 'Internal Verification',
    acknowledgement_status: 'Cleared',
    commercial_invoice_number: '',
    acknowledgement_ref: '',
    remarks: 'Commercial terms, GST e-way bill, and freight rates reconciled.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [ckRes, shRes] = await Promise.all([
        api.get('/checklists'),
        api.get('/shipments'),
      ]);
      setChecklists(ckRes.data || []);
      setShipments(shRes.data || []);
    } catch {
      // toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (ck) => {
    setSelectedChecklist(ck);
    setForm({
      shipment_id: ck.shipment_id || '',
      acknowledgement_method: ck.acknowledgement_method || 'Internal Verification',
      acknowledgement_status: ck.acknowledgement_status || 'Draft',
      commercial_invoice_number: ck.commercial_invoice_number || '',
      acknowledgement_ref: ck.acknowledgement_ref || '',
      remarks: ck.remarks || '',
    });
    setEditModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/checklists', form);
      toast.success('Accounts Checklist created');
      setCreateModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChecklist) return;

    try {
      await api.put(`/checklists/${selectedChecklist.id}`, form);
      toast.warning('Checklist updated. Any existing 3-Way dispatch clearances for this shipment are now INVALIDATED and require re-approval.');
      setEditModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Accounts & Dispatch Checklists</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial invoicing, tax clearance, external customer acknowledgement, and pre-dispatch compliance.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({
              shipment_id: shipments[0]?.id || '',
              acknowledgement_method: 'Internal Verification',
              acknowledgement_status: 'Cleared',
              commercial_invoice_number: `TAX-INV-${Date.now().toString().slice(-4)}`,
              acknowledgement_ref: `ACK-${Date.now().toString().slice(-4)}`,
              remarks: 'Accounts clearance complete.',
            });
            setCreateModalOpen(true);
          }}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Dispatch Checklist</span>
        </button>
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Re-Approval Enforcement Rule:</strong> If commercial terms, invoice numbers, or checklist parameters are edited post-approval, the ERP engine automatically invalidates prior Admin, Sales, and Accounts clearances, mandating a fresh 3-way signoff.
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Checklist #</th>
                  <th className="px-4 py-3">Shipment Ref</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Commercial Invoice</th>
                  <th className="px-4 py-3">Acknowledgement Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {checklists
                  .filter((c) => c.checklist_number?.toLowerCase().includes(search.toLowerCase()) || c.commercial_invoice_number?.toLowerCase().includes(search.toLowerCase()))
                  .map((ck) => (
                    <tr key={ck.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{ck.checklist_number}</td>
                      <td className="px-4 py-3 font-mono font-bold text-brand-700">
                        {ck.shipment?.shipment_number || 'General Clearance'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{ck.customer?.name || 'Authorized Consignee'}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{ck.commercial_invoice_number || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                          {ck.acknowledgement_method}
                        </span>
                      </td>
                      <td className="px-4 py-3"><Badge status={ck.acknowledgement_status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenEdit(ck)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded border border-slate-200"
                        >
                          Edit Terms
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Accounts Dispatch Checklist">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Shipment</label>
            <select
              required
              value={form.shipment_id}
              onChange={(e) => setForm({ ...form, shipment_id: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Select Shipment</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>{s.shipment_number} - {s.customer?.name} ({s.total_boxes} boxes)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Acknowledgement Method</label>
              <select
                value={form.acknowledgement_method}
                onChange={(e) => setForm({ ...form, acknowledgement_method: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Internal Verification">Internal Verification</option>
                <option value="Document Upload">Document Upload</option>
                <option value="Email Acknowledgement">Email Acknowledgement</option>
                <option value="Customer Portal">Customer Portal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Commercial Invoice Number</label>
              <input
                type="text"
                required
                value={form.commercial_invoice_number}
                onChange={(e) => setForm({ ...form, commercial_invoice_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                placeholder="TAX-INV-2026-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Checklist Remarks</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Checklist</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL WITH INVALIDATION WARNING */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Checklist ${selectedChecklist?.checklist_number}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800">
            <strong>Warning:</strong> Modifying commercial terms on an approved shipment automatically invalidates prior 3-way clearances.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Acknowledgement Method</label>
              <select
                value={form.acknowledgement_method}
                onChange={(e) => setForm({ ...form, acknowledgement_method: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Internal Verification">Internal Verification</option>
                <option value="Document Upload">Document Upload</option>
                <option value="Email Acknowledgement">Email Acknowledgement</option>
                <option value="Customer Portal">Customer Portal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Commercial Invoice #</label>
              <input
                type="text"
                required
                value={form.commercial_invoice_number}
                onChange={(e) => setForm({ ...form, commercial_invoice_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold">
              Save & Invalidate Approvals
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

