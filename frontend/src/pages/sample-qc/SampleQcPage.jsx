import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  CheckCircle,
  XCircle,
  AlertOctagon,
  Search,
  Plus,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

export default function SampleQcPage() {
  const [qcRecords, setQcRecords] = useState([]);
  const [pendingWorkOrders, setPendingWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedWo, setSelectedWo] = useState(null);

  const [form, setForm] = useState({
    result: 'Passed',
    sample_identifier: '',
    defect_details: '',
    rework_instructions: '',
    remarks: 'Sample dimensions and surface finish within acceptable tolerances.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [qcRes, woRes] = await Promise.all([
        api.get('/qc'),
        api.get('/production'),
      ]);
      setQcRecords(qcRes.data || []);
      const pending = (woRes.data || []).filter((w) => w.sample_status === 'Prepared' || w.sample_status === 'Pending');
      setPendingWorkOrders(pending);
    } catch {
      // toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenInspect = (wo) => {
    setSelectedWo(wo);
    setForm({
      result: 'Passed',
      sample_identifier: `SMP-${wo.work_order_number}`,
      defect_details: '',
      rework_instructions: '',
      remarks: 'Sample verified against engineering drawing tolerances.',
    });
    setInspectModalOpen(true);
  };

  const handleSubmitQc = async (e) => {
    e.preventDefault();
    if (!selectedWo) return;

    try {
      const res = await api.post('/qc', {
        work_order_id: selectedWo.id,
        ...form,
      });
      toast.success(res.message || 'Sample QC record submitted');
      setInspectModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sample Quality Control (QC)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            First-piece sample qualification prior to mass production authorization.
          </p>
        </div>
      </div>

      {/* PENDING SAMPLES QUEUE */}
      {pendingWorkOrders.length > 0 && (
        <Card title="Samples Awaiting QC Qualification" subtitle="First-piece samples prepared by shopfloor supervisor">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingWorkOrders.map((wo) => (
              <div key={wo.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-xs">{wo.work_order_number}</span>
                    <Badge status="Pending" />
                  </div>
                  <h4 className="font-semibold text-slate-800 text-xs mt-1">{wo.product?.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 italic">"{wo.sample_notes || 'Sample ready for inspection'}"</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Target: {wo.target_quantity} pcs</span>
                  <button
                    onClick={() => handleOpenInspect(wo)}
                    className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded border border-brand-200"
                  >
                    Inspect Sample
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* COMPLETED QC RECORDS */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <Card title="Historical Sample QC Inspections">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">QC Record #</th>
                  <th className="px-4 py-3">Work Order #</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Sample Identifier</th>
                  <th className="px-4 py-3">Inspector</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">QC Result</th>
                  <th className="px-4 py-3">Remarks / Defects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {qcRecords
                  .filter((q) => q.qc_number?.toLowerCase().includes(search.toLowerCase()) || q.work_order?.work_order_number?.toLowerCase().includes(search.toLowerCase()))
                  .map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{q.qc_number}</td>
                      <td className="px-4 py-3 font-mono font-bold text-brand-700">{q.work_order?.work_order_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{q.work_order?.product?.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">{q.sample_identifier}</td>
                      <td className="px-4 py-3">{q.inspector?.full_name || 'QC Inspector'}</td>
                      <td className="px-4 py-3 text-slate-500">{q.inspection_date}</td>
                      <td className="px-4 py-3"><Badge status={q.result} /></td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate">
                        {q.result === 'Failed' ? (
                          <span className="text-rose-600 font-semibold">{q.defect_details}</span>
                        ) : (
                          q.remarks
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* QC INSPECTION MODAL */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={`Sample QC Inspection for ${selectedWo?.work_order_number}`}
      >
        <form onSubmit={handleSubmitQc} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border text-xs">
            <div><strong>Product:</strong> {selectedWo?.product?.name}</div>
            <div><strong>Sample Identifier:</strong> {form.sample_identifier}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Result</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer font-semibold text-xs ${
                form.result === 'Passed' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="qc_result"
                  value="Passed"
                  checked={form.result === 'Passed'}
                  onChange={(e) => setForm({ ...form, result: e.target.value })}
                  className="sr-only"
                />
                Pass (Authorize Mass Production)
              </label>

              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer font-semibold text-xs ${
                form.result === 'Failed' ? 'bg-rose-50 border-rose-500 text-rose-800' : 'border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="qc_result"
                  value="Failed"
                  checked={form.result === 'Failed'}
                  onChange={(e) => setForm({ ...form, result: e.target.value })}
                  className="sr-only"
                />
                Fail (Require Rework / New Sample)
              </label>
            </div>
          </div>

          {form.result === 'Failed' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-rose-700 mb-1">Defect Details (Mandatory)</label>
                <textarea
                  rows={2}
                  required
                  value={form.defect_details}
                  onChange={(e) => setForm({ ...form, defect_details: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-rose-300 rounded-lg"
                  placeholder="E.g. Diameter out of tolerance by +0.08mm..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rework Instructions</label>
                <textarea
                  rows={2}
                  value={form.rework_instructions}
                  onChange={(e) => setForm({ ...form, rework_instructions: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  placeholder="Re-machine on second lathe..."
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">General QC Remarks</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setInspectModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Inspection</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

