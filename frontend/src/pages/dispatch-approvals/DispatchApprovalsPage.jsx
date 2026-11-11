import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';

export default function DispatchApprovalsPage() {
  const { user } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [clearanceData, setClearanceData] = useState(null);

  // Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionForm, setDecisionForm] = useState({
    decision: 'Approved',
    comments: 'All dispatch parameters verified and cleared.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dispatch-approvals');
      setRequests(res.data || []);
    } catch {
      // toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDecision = async (shipment) => {
    setSelectedShipment(shipment);
    try {
      const res = await api.get(`/dispatch-approvals/${shipment.id}`);
      setClearanceData(res.data);
      setDecisionForm({
        decision: 'Approved',
        comments: `Clearance granted by ${user?.role}.`,
      });
      setDecisionModalOpen(true);
    } catch {
      // toast
    }
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!selectedShipment) return;

    try {
      const res = await api.post(`/dispatch-approvals/${selectedShipment.id}/decision`, decisionForm);
      toast.success(res.message || 'Approval decision recorded successfully');
      setDecisionModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mandatory 3-Way Dispatch Clearance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict three-way operational and commercial clearance: Admin, Sales, and Accounts approvals must ALL apply to the exact same shipment version.
          </p>
        </div>
      </div>

      <div className="p-4 bg-brand-50/70 rounded-xl border border-brand-200 text-xs text-brand-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Server-Enforced 3-Way Verification:</strong>
          <span className="block mt-0.5 text-slate-700">
            Outward dispatch will be strictly blocked on the backend unless Admin, Sales, and Accounts have all stamped "Approved" on the current shipment revision. Modifying the checklist or contents resets version and invalidates existing approvals.
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <div className="space-y-4">
          {requests.map((shipment) => {
            const approvals = shipment.approvals?.filter((a) => a.shipment_version === shipment.version) || [];
            const adminApp = approvals.find((a) => a.role === 'Admin');
            const salesApp = approvals.find((a) => a.role === 'Sales');
            const accountsApp = approvals.find((a) => a.role === 'Accounts');

            const isFullyApproved =
              adminApp?.decision === 'Approved' &&
              salesApp?.decision === 'Approved' &&
              accountsApp?.decision === 'Approved';

            return (
              <div
                key={shipment.id}
                className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${
                  isFullyApproved ? 'border-emerald-200' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="font-mono font-bold text-base text-slate-900">
                      {shipment.shipment_number}
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      Rev v{shipment.version || 1}
                    </span>
                    <Badge status={shipment.status} />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <span className="text-slate-400 block font-medium">Customer / Consignee</span>
                      <span className="font-bold text-slate-800">{shipment.customer?.name}</span>
                    </div>

                    <button
                      onClick={() => handleOpenDecision(shipment)}
                      className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <span>Review & Vote Clearance</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3 Approver Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                  {/* 1. Admin */}
                  <ApproverCard
                    roleTitle="Admin Approval"
                    department="Operational & Production Supervisor"
                    approval={adminApp}
                  />

                  {/* 2. Sales */}
                  <ApproverCard
                    roleTitle="Sales Approval"
                    department="Commercial Sales & Customer Schedule"
                    approval={salesApp}
                  />

                  {/* 3. Accounts */}
                  <ApproverCard
                    roleTitle="Accounts Approval"
                    department="Commercial Invoice & Tax Compliance"
                    approval={accountsApp}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DECISION MODAL */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`3-Way Dispatch Clearance Decision - ${selectedShipment?.shipment_number}`}
      >
        <form onSubmit={handleSubmitDecision} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border text-xs">
            <div><strong>Shipment:</strong> {selectedShipment?.shipment_number} (Rev v{selectedShipment?.version})</div>
            <div><strong>Customer:</strong> {selectedShipment?.customer?.name}</div>
            <div><strong>Contained Master Boxes:</strong> {selectedShipment?.total_boxes} boxes ({selectedShipment?.total_parts} parts)</div>
            <div><strong>Your Signing Role:</strong> <span className="font-bold text-brand-700">{user?.role}</span></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clearance Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer font-semibold text-xs ${
                decisionForm.decision === 'Approved' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="Approved"
                  checked={decisionForm.decision === 'Approved'}
                  onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })}
                  className="sr-only"
                />
                Approve Dispatch
              </label>

              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer font-semibold text-xs ${
                decisionForm.decision === 'Rejected' ? 'bg-rose-50 border-rose-500 text-rose-800' : 'border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="Rejected"
                  checked={decisionForm.decision === 'Rejected'}
                  onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })}
                  className="sr-only"
                />
                Reject / Place on Hold
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Comments / Inspection Notes</label>
            <textarea
              rows={3}
              required
              value={decisionForm.comments}
              onChange={(e) => setDecisionForm({ ...decisionForm, comments: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              placeholder="State reason for approval or rejection..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setDecisionModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Submit Decision</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ApproverCard({ roleTitle, department, approval }) {
  const isApproved = approval?.decision === 'Approved';
  const isRejected = approval?.decision === 'Rejected';
  const isPending = !approval || approval?.decision === 'Pending';

  return (
    <div
      className={`p-3.5 rounded-xl border flex flex-col justify-between ${
        isApproved
          ? 'bg-emerald-50/50 border-emerald-200'
          : isRejected
          ? 'bg-rose-50/50 border-rose-200'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 text-xs">{roleTitle}</span>
          {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {isRejected && <XCircle className="w-4 h-4 text-rose-600" />}
          {isPending && <Clock className="w-4 h-4 text-slate-400" />}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">{department}</p>
        <div className="mt-2">
          <Badge status={approval?.decision || 'Pending'} />
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
        <div>Signee: <strong>{approval?.approver?.full_name || 'Pending Signoff'}</strong></div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5">{approval?.comments || 'No comments logged'}</div>
      </div>
    </div>
  );
}

