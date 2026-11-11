import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  PackageCheck,
  QrCode,
  CheckSquare,
  AlertTriangle,
  Boxes,
  Eye,
  Download,
  ShieldCheck,
} from 'lucide-react';

export default function PackagingPage() {
  const [packagingOrders, setPackagingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);

  // Approval Form
  const [approveForm, setApproveForm] = useState({
    component_verification: true,
    condition_verification: true,
    box_capacity: 20,
    remarks: 'Component count verified 100%. Free of surface defects. Packaging approved.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/packaging');
      setPackagingOrders(res.data || []);
    } catch {
      // toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenApprove = (order) => {
    setSelectedOrder(order);
    setApproveForm({
      component_verification: true,
      condition_verification: true,
      box_capacity: 20,
      remarks: 'Components counted and visually verified against spec. Ready for master boxing and QR generation.',
    });
    setApproveModalOpen(true);
  };

  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!approveForm.component_verification || !approveForm.condition_verification) {
      toast.error('Component count and physical condition verification are mandatory prior to packaging approval.');
      return;
    }

    try {
      const res = await api.post(`/packaging/${selectedOrder.id}/approve`, approveForm);
      toast.success(res.message || 'Packaging approved and QR codes generated successfully!');
      setApproveModalOpen(false);
      loadData();
    } catch {
      // toast handled
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Packaging & Master Box Association</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Component verification, condition check, and dual QR code generation (Part QR + Master Box QR).
          </p>
        </div>
      </div>

      <div className="p-4 bg-brand-50/60 rounded-xl border border-brand-200 text-xs text-brand-900 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Security & Quality Control Rule:</strong> Final Part and Box QR codes are strictly blocked from being generated prior to packaging inspection approval. Once approved, unique physical part records (`PT-xxxx`) are generated and mapped to exact master boxes (`BX-xxxx`).
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
                  <th className="px-4 py-3">Packaging Order #</th>
                  <th className="px-4 py-3">Work Order #</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-center">Total Qty</th>
                  <th className="px-4 py-3 text-center">Master Boxes</th>
                  <th className="px-4 py-3">Verification Checks</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packagingOrders.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{pkg.packaging_number}</td>
                    <td className="px-4 py-3 font-mono font-bold text-brand-700">{pkg.work_order?.work_order_number}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{pkg.product?.name}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{pkg.total_quantity} pcs</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700">
                      {pkg.boxes?.length || 0} boxes
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className={`inline-flex items-center gap-1 ${pkg.component_verification ? 'text-emerald-700' : 'text-slate-400'}`}>
                          <CheckSquare className="w-3.5 h-3.5" /> Count
                        </span>
                        <span className={`inline-flex items-center gap-1 ${pkg.condition_verification ? 'text-emerald-700' : 'text-slate-400'}`}>
                          <CheckSquare className="w-3.5 h-3.5" /> Condition
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge status={pkg.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedOrder(pkg); setViewDetailsModalOpen(true); }}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg"
                          title="View Box and Parts Mapping"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {pkg.status === 'Pending' && (
                          <button
                            onClick={() => handleOpenApprove(pkg)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 flex items-center gap-1"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Verify & Approve</span>
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

      {/* APPROVE PACKAGING MODAL */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title={`Approve Packaging - ${selectedOrder?.packaging_number}`}
      >
        <form onSubmit={handleSubmitApproval} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border text-xs">
            <div><strong>Product:</strong> {selectedOrder?.product?.name}</div>
            <div><strong>Total Parts:</strong> {selectedOrder?.total_quantity} pcs</div>
          </div>

          <div className="space-y-2 p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-xs">
            <span className="font-bold text-amber-900 block mb-1">Mandatory Quality Verification Checks:</span>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input
                type="checkbox"
                required
                checked={approveForm.component_verification}
                onChange={(e) => setApproveForm({ ...approveForm, component_verification: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span>1. 100% Component Count Verification Completed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input
                type="checkbox"
                required
                checked={approveForm.condition_verification}
                onChange={(e) => setApproveForm({ ...approveForm, condition_verification: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span>2. Physical Condition (Zero Scratch / Protective VCI Wrap) Verified</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Master Box Capacity (Parts per Box)</label>
            <input
              type="number"
              required
              value={approveForm.box_capacity}
              onChange={(e) => setApproveForm({ ...approveForm, box_capacity: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Remarks</label>
            <textarea
              rows={2}
              value={approveForm.remarks}
              onChange={(e) => setApproveForm({ ...approveForm, remarks: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setApproveModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <QrCode className="w-4 h-4" />
              <span>Approve & Generate QRs</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={viewDetailsModalOpen}
        onClose={() => setViewDetailsModalOpen(false)}
        title={`Boxes & Parts - ${selectedOrder?.packaging_number}`}
        maxWidth="max-w-3xl"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-800">Generated Master Boxes ({selectedOrder.boxes?.length || 0})</span>
              <a
                href={`/api/qr/labels-pdf?type=boxes&token=${encodeURIComponent(localStorage.getItem('erp_token') || '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded font-semibold flex items-center gap-1 text-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Box Labels PDF</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              {selectedOrder.boxes?.map((box) => (
                <div key={box.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  {box.qr_code && (
                    <img src={box.qr_code} alt="Box QR" className="w-16 h-16 rounded border bg-white p-1 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-mono font-bold text-slate-900 text-xs">{box.box_number}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Token: {box.qr_token?.slice(0, 16)}...</div>
                    <div className="text-[11px] text-slate-600 mt-1">Packed Count: {box.packed_count} pcs</div>
                    <Badge status={box.status} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setViewDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

