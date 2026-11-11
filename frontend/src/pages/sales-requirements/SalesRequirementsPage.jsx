import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  FileSpreadsheet,
  Plus,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function SalesRequirementsPage() {
  const { user } = useSelector((state) => state.auth);
  const [requirements, setRequirements] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviseModalOpen, setReviseModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    customer_id: '',
    po_id: '',
    product_id: '',
    required_quantity: 50,
    required_delivery_date: '',
    priority: 'Medium',
    description: '',
  });

  const [reviewForm, setReviewForm] = useState({
    decision: 'Approved',
    comments: 'Technical specs & shopfloor capacity verified. Approved for Work Order creation.',
  });

  const [reviseForm, setReviseForm] = useState({
    required_quantity: '',
    required_delivery_date: '',
    priority: 'Medium',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, cRes, pRes, poRes] = await Promise.all([
        api.get('/sales-requirements'),
        api.get('/customers'),
        api.get('/products'),
        api.get('/purchase-orders'),
      ]);
      setRequirements(rRes.data || []);
      setCustomers(cRes.data || []);
      setProducts(pRes.data || []);
      setPos(poRes.data || []);
    } catch {
      // toast error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sales-requirements', createForm);
      toast.success('Sales Requirement submitted to Admin review');
      setCreateModalOpen(false);
      loadData();
    } catch {
      // toast handled
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      const res = await api.put(`/sales-requirements/${selectedReq.id}/review`, reviewForm);
      toast.success(res.message || 'Requirement review recorded');
      setReviewModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleReviseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      await api.put(`/sales-requirements/${selectedReq.id}/revise`, reviseForm);
      toast.success('Requirement revised and resubmitted to Admin');
      setReviseModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const canReview = user?.role === 'Super Admin' || user?.role === 'Admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales Requirement Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit customer demand specifications to Admin for capacity review and automated Work Order issuance.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateForm({
              customer_id: customers[0]?.id || '',
              po_id: pos[0]?.id || '',
              product_id: products[0]?.id || '',
              required_quantity: 50,
              required_delivery_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
              priority: 'High',
              description: 'Urgent production batch requirement.',
            });
            setCreateModalOpen(true);
          }}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Requirement</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Requirement #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-center">Quantity</th>
                  <th className="px-4 py-3">Delivery Date</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Rev #</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requirements
                  .filter((r) => r.requirement_number?.toLowerCase().includes(search.toLowerCase()) || r.customer?.name?.toLowerCase().includes(search.toLowerCase()))
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.requirement_number}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{r.customer?.name}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{r.product?.name}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">{r.required_quantity}</td>
                      <td className="px-4 py-3 text-slate-600">{r.required_delivery_date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.priority === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-center">r{r.revision_number || 1}</td>
                      <td className="px-4 py-3"><Badge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canReview && r.status === 'Submitted' && (
                            <button
                              onClick={() => { setSelectedReq(r); setReviewModalOpen(true); }}
                              className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded border border-brand-200 transition-colors flex items-center gap-1"
                            >
                              <span>Review</span>
                            </button>
                          )}
                          {r.status === 'Rejected' && (
                            <button
                              onClick={() => {
                                setSelectedReq(r);
                                setReviseForm({
                                  required_quantity: r.required_quantity,
                                  required_delivery_date: r.required_delivery_date,
                                  priority: r.priority,
                                  description: r.description,
                                });
                                setReviseModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors flex items-center gap-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Revise</span>
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

      {/* CREATE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Submit New Sales Requirement"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
              <select
                required
                value={createForm.customer_id}
                onChange={(e) => setCreateForm({ ...createForm, customer_id: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.customer_code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product</label>
              <select
                required
                value={createForm.product_id}
                onChange={(e) => setCreateForm({ ...createForm, product_id: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.product_code} - {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required Quantity</label>
              <input
                type="number"
                required
                value={createForm.required_quantity}
                onChange={(e) => setCreateForm({ ...createForm, required_quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required Delivery Date</label>
              <input
                type="date"
                required
                value={createForm.required_delivery_date}
                onChange={(e) => setCreateForm({ ...createForm, required_delivery_date: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Notes / Specs</label>
            <textarea
              rows={2}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Submit to Admin</button>
          </div>
        </form>
      </Modal>

      {/* ADMIN REVIEW MODAL */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Admin Review for Requirement ${selectedReq?.requirement_number}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border text-xs">
            <div><strong>Customer:</strong> {selectedReq?.customer?.name}</div>
            <div><strong>Product:</strong> {selectedReq?.product?.name}</div>
            <div><strong>Required Qty:</strong> {selectedReq?.required_quantity} pcs</div>
            <div className="text-emerald-700 font-semibold mt-1">
              ✓ Upon approval, a Production Work Order is automatically initiated!
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer font-semibold text-xs ${
                reviewForm.decision === 'Approved' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="Approved"
                  checked={reviewForm.decision === 'Approved'}
                  onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
                  className="sr-only"
                />
                Approve (Issue Work Order)
              </label>

              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer font-semibold text-xs ${
                reviewForm.decision === 'Rejected' ? 'bg-rose-50 border-rose-500 text-rose-800' : 'border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="Rejected"
                  checked={reviewForm.decision === 'Rejected'}
                  onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
                  className="sr-only"
                />
                Reject (Return to Sales)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {reviewForm.decision === 'Rejected' ? 'Rejection Reason (Required)' : 'Comments / Technical Guidance'}
            </label>
            <textarea
              rows={3}
              required={reviewForm.decision === 'Rejected'}
              value={reviewForm.comments}
              onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setReviewModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Confirm Decision</button>
          </div>
        </form>
      </Modal>

      {/* REVISE MODAL */}
      <Modal
        isOpen={reviseModalOpen}
        onClose={() => setReviseModalOpen(false)}
        title={`Revise Requirement ${selectedReq?.requirement_number}`}
      >
        <form onSubmit={handleReviseSubmit} className="space-y-4">
          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800">
            <strong>Rejection Reason from Admin:</strong> {selectedReq?.rejection_reason || 'Timeline or specifications infeasible.'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Updated Quantity</label>
              <input
                type="number"
                required
                value={reviseForm.required_quantity}
                onChange={(e) => setReviseForm({ ...reviseForm, required_quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Updated Delivery Date</label>
              <input
                type="date"
                required
                value={reviseForm.required_delivery_date}
                onChange={(e) => setReviseForm({ ...reviseForm, required_delivery_date: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Revision Explanation</label>
            <textarea
              rows={2}
              required
              value={reviseForm.description}
              onChange={(e) => setReviseForm({ ...reviseForm, description: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              placeholder="Corrected specs..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setReviseModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold">Resubmit to Admin</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

