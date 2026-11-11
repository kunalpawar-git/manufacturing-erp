import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Microscope,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

const divisions = ['All', 'Paint', 'Assembly', 'Store', 'Basement'];

export default function IqcInspectionsPage() {
  const [inspections, setInspections] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [activeDivision, setActiveDivision] = useState('All');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Inspection Form
  const [form, setForm] = useState({
    division: 'Paint',
    vendor_batch_number: '',
    accepted_quantity: 100,
    rejected_quantity: 0,
    quarantined_quantity: 0,
    inspection_date: new Date().toISOString().split('T')[0],
    checklist_data: {
      visual_appearance: 'Passed',
      dimensional_check: 'Passed (+/- 0.02mm)',
      hardness_coating: 'Passed',
    },
    remarks: 'Metallurgical & dimensional check conforms to drawing standard.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [iqcRes, rRes] = await Promise.all([
        api.get('/iqc', {
          params: {
            division: activeDivision === 'All' ? undefined : activeDivision,
            status: statusFilter || undefined,
          },
        }),
        api.get('/receipts'),
      ]);
      setInspections(iqcRes.data || []);
      setReceipts(rRes.data || []);
    } catch {
      // toast error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeDivision, statusFilter]);

  const handleOpenInspect = (receipt) => {
    setSelectedReceipt(receipt);
    setForm({
      division: activeDivision === 'All' ? 'Paint' : activeDivision,
      vendor_batch_number: `VB-${Date.now().toString().slice(-6)}`,
      accepted_quantity: receipt.received_quantity,
      rejected_quantity: 0,
      quarantined_quantity: 0,
      inspection_date: new Date().toISOString().split('T')[0],
      checklist_data: {
        visual_appearance: 'Passed',
        dimensional_check: 'Passed',
        certification_check: 'Passed',
      },
      remarks: 'Inspected and passed incoming quality parameters.',
    });
    setInspectModalOpen(true);
  };

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!selectedReceipt) return;

    const accepted = parseFloat(form.accepted_quantity || 0);
    const rejected = parseFloat(form.rejected_quantity || 0);
    const quarantined = parseFloat(form.quarantined_quantity || 0);
    const total = accepted + rejected + quarantined;

    if (total > selectedReceipt.received_quantity) {
      toast.error(`Total accounted quantity (${total}) exceeds received quantity (${selectedReceipt.received_quantity})`);
      return;
    }

    try {
      const res = await api.post('/iqc', {
        receipt_id: selectedReceipt.id,
        ...form,
      });
      toast.success(res.message || 'IQC Inspection logged successfully!');
      setInspectModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Incoming Quality Control (IQC)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain 4 distinct division queues: Paint, Assembly, Store, and Basement. Generate unique internal batch IDs while preserving vendor lot labels.
          </p>
        </div>

        {receipts.length > 0 && (
          <button
            onClick={() => handleOpenInspect(receipts[0])}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Perform IQC Inspection</span>
          </button>
        )}
      </div>

      {/* 4 IQC DIVISION QUEUE TABS */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-medium">
        {divisions.map((div) => {
          const count = div === 'All'
            ? inspections.length
            : inspections.filter((i) => i.division === div).length;
          return (
            <button
              key={div}
              onClick={() => setActiveDivision(div)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeDivision === div
                  ? 'border-brand-600 text-brand-700 font-bold bg-brand-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{div === 'All' ? 'All Divisions' : `${div} Division`}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                activeDivision === div ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Batch ID, vendor, material..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Accepted">Accepted (In Available Stock)</option>
            <option value="Rejected">Rejected (Blocked from Stock)</option>
            <option value="Quarantined">Quarantined</option>
            <option value="Pending">Pending Inspection</option>
          </select>
        </div>
      </div>

      {/* IQC Table */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={7} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">IQC Number</th>
                  <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3">Vendor / Material</th>
                  <th className="px-4 py-3">Original Vendor Batch</th>
                  <th className="px-4 py-3">Generated Internal Batch</th>
                  <th className="px-4 py-3 text-center">Quantities (Acc / Rej)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections
                  .filter((i) => i.internal_batch_id?.toLowerCase().includes(search.toLowerCase()) || i.vendor_batch_number?.toLowerCase().includes(search.toLowerCase()) || i.vendor?.name?.toLowerCase().includes(search.toLowerCase()))
                  .map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{i.inspection_number}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {i.division}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{i.material?.name || 'Raw Material'}</div>
                        <div className="text-[11px] text-slate-400">{i.vendor?.name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700 font-medium">
                        {i.vendor_batch_number}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-brand-700 text-[11px]">
                        {i.internal_batch_id}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold text-emerald-700">{i.accepted_quantity}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className={`font-bold ${i.rejected_quantity > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {i.rejected_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={i.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* INSPECT MODAL */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Incoming Material Quality Inspection (IQC)"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitInspection} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Strict Quality Rule:</strong> Rejected and quarantined quantities are locked and will NEVER enter available manufacturing inventory. The original vendor batch is preserved for traceability while a system-unique internal batch ID is assigned upon pass.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned IQC Division</label>
              <select
                value={form.division}
                onChange={(e) => setForm({ ...form, division: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
              >
                <option value="Paint">Paint Division</option>
                <option value="Assembly">Assembly Division</option>
                <option value="Store">Store Division</option>
                <option value="Basement">Basement Division</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Original Vendor Batch #</label>
              <input
                type="text"
                required
                value={form.vendor_batch_number}
                onChange={(e) => setForm({ ...form, vendor_batch_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold"
                placeholder="VB-LOT-9821"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-emerald-700 mb-1">Accepted Qty</label>
              <input
                type="number"
                required
                value={form.accepted_quantity}
                onChange={(e) => setForm({ ...form, accepted_quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg font-mono font-bold text-center bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-rose-700 mb-1">Rejected Qty</label>
              <input
                type="number"
                value={form.rejected_quantity}
                onChange={(e) => setForm({ ...form, rejected_quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-rose-300 rounded-lg font-mono font-bold text-center bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-purple-700 mb-1">Quarantined Qty</label>
              <input
                type="number"
                value={form.quarantined_quantity}
                onChange={(e) => setForm({ ...form, quarantined_quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-purple-300 rounded-lg font-mono font-bold text-center bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Remarks & Checklist Findings</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setInspectModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Confirm IQC Inspection Decision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

