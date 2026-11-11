import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Cpu,
  Microscope,
  CheckCircle,
  PackageCheck,
  Search,
  Plus,
  Boxes,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function ProductionPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedWo, setSelectedWo] = useState(null);

  // Form states
  const [sampleNotes, setSampleNotes] = useState('First machined sample ready for dimensional and tensile verification.');
  const [consumeForm, setConsumeForm] = useState({
    batch_id: '',
    quantity_consumed: 30,
    scrap_quantity: 1,
    notes: 'Batch material allocated for precision turning.',
  });
  const [completeForm, setCompleteForm] = useState({
    produced_quantity: '',
    rejected_quantity: 0,
    remarks: 'Full batch machined, de-burred, and ready for packaging inspection.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [woRes, invRes] = await Promise.all([
        api.get('/production'),
        api.get('/inventory/summary'),
      ]);
      setWorkOrders(woRes.data || []);
      setBatches(invRes.data?.batches || []);
    } catch {
      // toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrepareSample = async (e) => {
    e.preventDefault();
    if (!selectedWo) return;
    try {
      await api.post(`/production/${selectedWo.id}/sample`, { sample_notes: sampleNotes });
      toast.success('Sample prepared and routed to Sample QC department');
      setSampleModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleConsumeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWo || !consumeForm.batch_id) {
      toast.error('Please select an internal batch to consume');
      return;
    }
    try {
      await api.post(`/production/${selectedWo.id}/consume`, {
        consumptions: [consumeForm],
      });
      toast.success('Batch material consumption recorded in stock ledger');
      setConsumeModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWo) return;
    try {
      await api.post(`/production/${selectedWo.id}/complete`, completeForm);
      toast.success('Production completed! Packaging Order automatically created.');
      setCompleteModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Production Work Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track machining progress, sample QC qualification, and internal batch raw material consumption.
          </p>
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
                  <th className="px-4 py-3">Work Order #</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-center">Target Qty</th>
                  <th className="px-4 py-3 text-center">Produced</th>
                  <th className="px-4 py-3">Consumed Batches</th>
                  <th className="px-4 py-3">Sample QC</th>
                  <th className="px-4 py-3">WO Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders
                  .filter((w) => w.work_order_number?.toLowerCase().includes(search.toLowerCase()) || w.product?.name?.toLowerCase().includes(search.toLowerCase()))
                  .map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{w.work_order_number}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{w.product?.name}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">{w.target_quantity}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                        {w.produced_quantity || 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {w.consumptions?.map((c) => (
                            <span key={c.id} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-brand-50 text-brand-700 border border-brand-200">
                              {c.batch?.internal_batch_id || 'Batch'} ({c.quantity_consumed})
                            </span>
                          ))}
                          {(!w.consumptions || w.consumptions.length === 0) && (
                            <span className="text-[11px] text-slate-400 italic">None logged</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={w.sample_status} />
                      </td>
                      <td className="px-4 py-3"><Badge status={w.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sample Prep */}
                          {w.sample_status === 'Pending' && (
                            <button
                              onClick={() => { setSelectedWo(w); setSampleModalOpen(true); }}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                            >
                              Prepare Sample
                            </button>
                          )}

                          {/* Consume Batch */}
                          {w.status !== 'Completed' && w.status !== 'Cancelled' && (
                            <button
                              onClick={() => {
                                setSelectedWo(w);
                                setConsumeForm({
                                  batch_id: batches[0]?.id || '',
                                  quantity_consumed: w.target_quantity,
                                  scrap_quantity: 1,
                                  notes: `Material allocated for ${w.work_order_number}`,
                                });
                                setConsumeModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded border border-brand-200 transition-colors"
                              title="Record Material Consumption"
                            >
                              Consume Batch
                            </button>
                          )}

                          {/* Complete Production */}
                          {w.sample_status === 'QC Passed' && w.status !== 'Completed' && (
                            <button
                              onClick={() => {
                                setSelectedWo(w);
                                setCompleteForm({
                                  produced_quantity: w.target_quantity,
                                  rejected_quantity: 0,
                                  remarks: 'Production completed. Passing to packaging.',
                                });
                                setCompleteModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SAMPLE PREPARATION MODAL */}
      <Modal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        title={`Prepare Sample for Work Order ${selectedWo?.work_order_number}`}
      >
        <form onSubmit={handlePrepareSample} className="space-y-4">
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 text-xs text-indigo-900">
            <strong>Sample QC Protocol:</strong> Preparing this sample marks the work order status as "Sample QC Pending" and immediately queues an inspection ticket for the Quality Control team.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Inspection Notes / Tooling Settings</label>
            <textarea
              rows={3}
              required
              value={sampleNotes}
              onChange={(e) => setSampleNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setSampleModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">Submit Sample to QC</button>
          </div>
        </form>
      </Modal>

      {/* BATCH CONSUMPTION MODAL */}
      <Modal
        isOpen={consumeModalOpen}
        onClose={() => setConsumeModalOpen(false)}
        title={`Record Batch Material Consumption - ${selectedWo?.work_order_number}`}
      >
        <form onSubmit={handleConsumeSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border text-xs text-slate-700">
            Select the exact internal batch ID to consume for this work order. This establishes the immutable traceability link between raw material and finished goods.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Available Internal Batch</label>
            <select
              required
              value={consumeForm.batch_id}
              onChange={(e) => setConsumeForm({ ...consumeForm, batch_id: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Select Batch</option>
              {batches
                .filter((b) => b.status === 'Available' && b.current_quantity > 0)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.internal_batch_id} - {b.material?.name} (Avail: {b.current_quantity} {b.material?.unit}) - {b.division} Division
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Consumed</label>
              <input
                type="number"
                required
                value={consumeForm.quantity_consumed}
                onChange={(e) => setConsumeForm({ ...consumeForm, quantity_consumed: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scrap / Off-cut Qty</label>
              <input
                type="number"
                value={consumeForm.scrap_quantity}
                onChange={(e) => setConsumeForm({ ...consumeForm, scrap_quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Consumption Remarks</label>
            <input
              type="text"
              value={consumeForm.notes}
              onChange={(e) => setConsumeForm({ ...consumeForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setConsumeModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Record Consumption</button>
          </div>
        </form>
      </Modal>

      {/* COMPLETE PRODUCTION MODAL */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title={`Complete Production for ${selectedWo?.work_order_number}`}
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
            <strong>Handoff to Packaging:</strong> Marking production complete will automatically generate a Packaging Order for these finished parts to verify component count and physical condition before QR code generation.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Finished Good Produced Qty</label>
              <input
                type="number"
                required
                value={completeForm.produced_quantity}
                onChange={(e) => setCompleteForm({ ...completeForm, produced_quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shopfloor Rejections</label>
              <input
                type="number"
                value={completeForm.rejected_quantity}
                onChange={(e) => setCompleteForm({ ...completeForm, rejected_quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Completion Remarks</label>
            <textarea
              rows={2}
              value={completeForm.remarks}
              onChange={(e) => setCompleteForm({ ...completeForm, remarks: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setCompleteModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold">Finish Production & Handoff</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

