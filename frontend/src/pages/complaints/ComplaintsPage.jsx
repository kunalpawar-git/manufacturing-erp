import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [investigateModalOpen, setInvestigateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [traceabilityDetails, setTraceabilityDetails] = useState(null);

  // Register Form
  const [registerForm, setRegisterForm] = useState({
    customer_id: '',
    defect_category: 'Surface Finish / Paint Flaw',
    scanned_part_code: 'PT-0001',
    scanned_box_code: 'BX-0001',
    claimed_internal_batch: 'B-2026-0001',
    claimed_vendor_batch: 'VB-TATA-2026-8800',
    description: 'Surface pitting observed on component flange face.',
  });

  // Investigation Form
  const [investigationForm, setInvestigationForm] = useState({
    investigation_status: 'Under CAPA',
    resolution: '',
    replacement_details: '',
    capa_summary: '',
    findings: '',
    root_cause: '',
    corrective_action: '',
    preventive_action: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, custRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/customers'),
      ]);
      setComplaints(cRes.data || []);
      setCustomers(custRes.data || []);
    } catch {
      // toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/complaints', registerForm);
      toast.success(res.message || 'Complaint logged & authenticity verified!');
      setRegisterModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleOpenInvestigate = async (c) => {
    setSelectedComplaint(c);
    try {
      const res = await api.get(`/complaints/${c.id}`);
      setSelectedComplaint(res.data.complaint);
      setTraceabilityDetails(res.data.traceability);

      setInvestigationForm({
        investigation_status: res.data.complaint.investigation_status || 'Investigating',
        resolution: res.data.complaint.resolution || '',
        replacement_details: res.data.complaint.replacement_details || '',
        capa_summary: res.data.complaint.capa_summary || '',
        findings: 'Detailed investigation conducted on manufacturing and IQC logs.',
        root_cause: 'Tooling wear or handling vibration.',
        corrective_action: 'Replace worn tooling insert.',
        preventive_action: 'Reduce tool replacement interval from 100 cycles to 60 cycles.',
      });
      setInvestigateModalOpen(true);
    } catch {
      // toast
    }
  };

  const handleInvestigationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      await api.put(`/complaints/${selectedComplaint.id}/investigate`, {
        investigation_status: investigationForm.investigation_status,
        resolution: investigationForm.resolution,
        replacement_details: investigationForm.replacement_details,
        capa_summary: investigationForm.capa_summary,
        investigation: {
          findings: investigationForm.findings,
          root_cause: investigationForm.root_cause,
          corrective_action: investigationForm.corrective_action,
          preventive_action: investigationForm.preventive_action,
        },
      });
      toast.success('Investigation and CAPA updated');
      setInvestigateModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Complaints, CAPA & Batch Authenticity</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-verify physical part QR, claimed vendor batch, and box mapping to prevent counterfeit claims and log corrective actions.
          </p>
        </div>

        <button
          onClick={() => {
            setRegisterForm({
              customer_id: customers[0]?.id || '',
              defect_category: 'Dimensional Inaccuracy',
              scanned_part_code: 'PT-0001',
              scanned_box_code: 'BX-0001',
              claimed_internal_batch: 'B-2026-0001',
              claimed_vendor_batch: 'VB-TATA-2026-8800',
              description: 'Customer claims dimension variance on part.',
            });
            setRegisterModalOpen(true);
          }}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Product Complaint</span>
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
                  <th className="px-4 py-3">Complaint #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Part QR / Box</th>
                  <th className="px-4 py-3">Defect Category</th>
                  <th className="px-4 py-3">Authenticity Check</th>
                  <th className="px-4 py-3">Investigation Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.complaint_number}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.customer?.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="font-bold text-brand-700">{c.scanned_part_code || c.part?.part_number || '-'}</div>
                      <div className="text-slate-400">Box: {c.scanned_box_code || c.box?.box_number || '-'}</div>
                    </td>
                    <td className="px-4 py-3">{c.defect_category}</td>
                    <td className="px-4 py-3">
                      <Badge status={c.verification_status} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={c.investigation_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenInvestigate(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded border border-brand-200 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Investigate & CAPA</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REGISTER COMPLAINT MODAL */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register Product Complaint & Verify Authenticity"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border text-xs text-slate-700">
            <strong>Authenticity Cross-Verification:</strong> Enter the scanned part QR code and customer's claimed batch details. The system checks whether the part exists, was legitimately dispatched, and matches the recorded raw material batch.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
            <select
              required
              value={registerForm.customer_id}
              onChange={(e) => setRegisterForm({ ...registerForm, customer_id: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.customer_code} - {c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scanned Part QR / ID</label>
              <input
                type="text"
                required
                value={registerForm.scanned_part_code}
                onChange={(e) => setRegisterForm({ ...registerForm, scanned_part_code: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold"
                placeholder="PT-0001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scanned Master Box ID</label>
              <input
                type="text"
                value={registerForm.scanned_box_code}
                onChange={(e) => setRegisterForm({ ...registerForm, scanned_box_code: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold"
                placeholder="BX-0001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Claimed Internal Batch ID</label>
              <input
                type="text"
                value={registerForm.claimed_internal_batch}
                onChange={(e) => setRegisterForm({ ...registerForm, claimed_internal_batch: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                placeholder="B-2026-0001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Claimed Vendor Batch #</label>
              <input
                type="text"
                value={registerForm.claimed_vendor_batch}
                onChange={(e) => setRegisterForm({ ...registerForm, claimed_vendor_batch: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                placeholder="VB-TATA-2026-8800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Defect Category</label>
            <select
              value={registerForm.defect_category}
              onChange={(e) => setRegisterForm({ ...registerForm, defect_category: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="Dimensional Inaccuracy">Dimensional Inaccuracy</option>
              <option value="Surface Finish / Paint Flaw">Surface Finish / Paint Flaw</option>
              <option value="Assembly Defect">Assembly Defect</option>
              <option value="Packaging Damage">Packaging Damage</option>
              <option value="Missing Component">Missing Component</option>
              <option value="Material Brittleness / Failure">Material Brittleness / Failure</option>
              <option value="Label Mismatch">Label Mismatch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Complaint Description</label>
            <textarea
              rows={2}
              required
              value={registerForm.description}
              onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setRegisterModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Verify & Register</button>
          </div>
        </form>
      </Modal>

      {/* INVESTIGATE & CAPA MODAL */}
      <Modal
        isOpen={investigateModalOpen}
        onClose={() => setInvestigateModalOpen(false)}
        title={`Investigation & CAPA: ${selectedComplaint?.complaint_number}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleInvestigationSubmit} className="space-y-4">
          {/* Discrepancy Warnings if Mismatch */}
          {selectedComplaint?.discrepancy_flags?.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              <strong className="block font-bold mb-1">DISCREPANCIES FLAGGED BY VERIFICATION ENGINE:</strong>
              <ul className="list-disc list-inside space-y-0.5">
                {selectedComplaint.discrepancy_flags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Investigation Status</label>
              <select
                value={investigationForm.investigation_status}
                onChange={(e) => setInvestigationForm({ ...investigationForm, investigation_status: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Under CAPA">Under CAPA</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Replacement Logistics</label>
              <input
                type="text"
                value={investigationForm.replacement_details}
                onChange={(e) => setInvestigationForm({ ...investigationForm, replacement_details: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                placeholder="E.g. Expedited courier Ref #9921"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Root Cause Analysis</label>
            <textarea
              rows={2}
              value={investigationForm.root_cause}
              onChange={(e) => setInvestigationForm({ ...investigationForm, root_cause: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corrective Action (Immediate)</label>
              <textarea
                rows={2}
                value={investigationForm.corrective_action}
                onChange={(e) => setInvestigationForm({ ...investigationForm, corrective_action: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preventive Action (CAPA)</label>
              <textarea
                rows={2}
                value={investigationForm.preventive_action}
                onChange={(e) => setInvestigationForm({ ...investigationForm, preventive_action: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Summary</label>
            <textarea
              rows={2}
              value={investigationForm.resolution}
              onChange={(e) => setInvestigationForm({ ...investigationForm, resolution: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              placeholder="Final resolution with client..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setInvestigateModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Investigation & CAPA</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

