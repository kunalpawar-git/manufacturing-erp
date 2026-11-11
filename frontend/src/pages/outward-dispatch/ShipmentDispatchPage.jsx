import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Truck,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Download,
  CheckCircle,
  Clock,
  Printer,
  FileText,
} from 'lucide-react';

export default function ShipmentDispatchPage() {
  const [shipments, setShipments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availableBoxes, setAvailableBoxes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Create Shipment Form
  const [createForm, setCreateForm] = useState({
    customer_id: '',
    destination_address: '',
    vehicle_number: 'MH-12-PQ-7788',
    lr_consignment_number: 'LR-TCI-2026-9901',
    driver_name: 'Santosh Sawant',
    driver_phone: '+91 94220 55112',
    box_ids: [],
    remarks: 'Transported with shock-resistant pallets.',
  });

  // Outward Dispatch Form
  const [dispatchForm, setDispatchForm] = useState({
    dispatch_date: new Date().toISOString().split('T')[0],
    vehicle_number: '',
    lr_consignment_number: '',
    driver_name: '',
    driver_phone: '',
    receiving_party: '',
    remarks: 'Physical gate pass verified. Outward gate-out completed.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [shRes, cRes, pkgRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/customers'),
        api.get('/packaging'),
      ]);
      setShipments(shRes.data || []);
      setCustomers(cRes.data || []);

      // Extract boxes with status 'Packed'
      const boxes = [];
      (pkgRes.data || []).forEach((p) => {
        if (p.boxes) {
          boxes.push(...p.boxes.filter((b) => b.status === 'Packed'));
        }
      });
      setAvailableBoxes(boxes);
    } catch {
      // toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (createForm.box_ids.length === 0) {
      toast.error('Select at least one packed master box for this shipment');
      return;
    }

    try {
      await api.post('/shipments', createForm);
      toast.success('Shipment created and submitted for 3-Way Dispatch Clearance');
      setCreateModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleOpenDispatch = (shipment) => {
    setSelectedShipment(shipment);
    setDispatchForm({
      dispatch_date: new Date().toISOString().split('T')[0],
      vehicle_number: shipment.vehicle_number || 'MH-12-PQ-7788',
      lr_consignment_number: shipment.lr_consignment_number || 'LR-2026-9901',
      driver_name: shipment.driver_name || 'Santosh Sawant',
      driver_phone: shipment.driver_phone || '+91 94220 55112',
      receiving_party: shipment.customer?.name || 'Customer Consignee',
      remarks: 'All 3 clearances validated. Outward gate pass issued.',
    });
    setDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShipment) return;

    try {
      const res = await api.post(`/shipments/${selectedShipment.id}/dispatch`, dispatchForm);
      toast.success(res.message || 'Shipment dispatched successfully!');
      setDispatchModalOpen(false);
      loadData();
    } catch {
      // toast handled
    }
  };

  const handleDownloadGatePass = async (id, shipmentNumber) => {
    try {
      const res = await fetch(`/api/shipments/${id}/gate-pass-pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to generate gate pass');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GatePass_${shipmentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Official Delivery Challan & Gate Pass downloaded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Outward Dispatch & Gate Pass</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical gate-out release, delivery challan generation, transport logistics, and box reconciliation.
          </p>
        </div>

        <button
          onClick={() => {
            const firstCust = customers[0];
            setCreateForm({
              customer_id: firstCust?.id || '',
              destination_address: firstCust?.address || 'Factory Yard, Gate 2',
              vehicle_number: 'MH-12-PQ-7788',
              lr_consignment_number: `LR-${Date.now().toString().slice(-4)}`,
              driver_name: 'Santosh Sawant',
              driver_phone: '+91 94220 55112',
              box_ids: availableBoxes.slice(0, 2).map((b) => b.id),
              remarks: 'Urgent delivery schedule.',
            });
            setCreateModalOpen(true);
          }}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Shipment</span>
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
                  <th className="px-4 py-3">Shipment #</th>
                  <th className="px-4 py-3">Customer / Consignee</th>
                  <th className="px-4 py-3 text-center">Boxes & Parts</th>
                  <th className="px-4 py-3">Vehicle # / LR</th>
                  <th className="px-4 py-3">Gate-Out Date</th>
                  <th className="px-4 py-3">Clearance & Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((sh) => {
                  const approvals = sh.approvals?.filter((a) => a.shipment_version === sh.version) || [];
                  const isFullyCleared =
                    approvals.some((a) => a.role === 'Admin' && a.decision === 'Approved') &&
                    approvals.some((a) => a.role === 'Sales' && a.decision === 'Approved') &&
                    approvals.some((a) => a.role === 'Accounts' && a.decision === 'Approved');

                  return (
                    <tr key={sh.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{sh.shipment_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{sh.customer?.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{sh.destination_address}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold text-slate-800">{sh.total_boxes} bxs</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-600">{sh.total_parts} pts</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <div>{sh.vehicle_number || '-'}</div>
                        <div className="text-slate-400">{sh.lr_consignment_number}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{sh.dispatch_date || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge status={sh.status} />
                          {isFullyCleared && sh.status !== 'Dispatched' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Ready
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If Dispatched, allow downloading Gate Pass */}
                          {sh.status === 'Dispatched' && (
                            <button
                              onClick={() => handleDownloadGatePass(sh.id, sh.shipment_number)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 flex items-center gap-1 transition-colors"
                              title="Download Gate Pass Delivery Challan PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Gate Pass</span>
                            </button>
                          )}

                          {/* If Approved, allow Outward Dispatch */}
                          {isFullyCleared && sh.status !== 'Dispatched' && (
                            <button
                              onClick={() => handleOpenDispatch(sh)}
                              className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1 transition-colors"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE SHIPMENT MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Outward Shipment">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Consignee</label>
              <select
                required
                value={createForm.customer_id}
                onChange={(e) => {
                  const cust = customers.find((c) => c.id === e.target.value);
                  setCreateForm({
                    ...createForm,
                    customer_id: e.target.value,
                    destination_address: cust ? cust.address : '',
                  });
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.customer_code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Unloading Address</label>
              <input
                type="text"
                required
                value={createForm.destination_address}
                onChange={(e) => setCreateForm({ ...createForm, destination_address: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Packed Master Boxes ({createForm.box_ids.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-50 border rounded-lg">
              {availableBoxes.map((box) => (
                <label
                  key={box.id}
                  className={`p-2 rounded border text-xs cursor-pointer flex items-center gap-2 ${
                    createForm.box_ids.includes(box.id)
                      ? 'bg-brand-50 border-brand-500 text-brand-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={createForm.box_ids.includes(box.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCreateForm({ ...createForm, box_ids: [...createForm.box_ids, box.id] });
                      } else {
                        setCreateForm({ ...createForm, box_ids: createForm.box_ids.filter((id) => id !== box.id) });
                      }
                    }}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <div>
                    <span className="font-mono">{box.box_number}</span>
                    <span className="text-[10px] text-slate-400 block font-normal">({box.packed_count} pcs)</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={createForm.vehicle_number}
                onChange={(e) => setCreateForm({ ...createForm, vehicle_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LR / Consignment #</label>
              <input
                type="text"
                value={createForm.lr_consignment_number}
                onChange={(e) => setCreateForm({ ...createForm, lr_consignment_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Queue for 3-Way Clearance</button>
          </div>
        </form>
      </Modal>

      {/* OUTWARD DISPATCH EXECUTION MODAL */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title={`Execute Outward Gate-Out - ${selectedShipment?.shipment_number}`}
      >
        <form onSubmit={handleDispatchSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Mandatory 3-Way Clearance Verified:</strong> Admin, Sales, and Accounts have all stamped approval. Ready to log final vehicle gate-out and issue official delivery pass.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Registration #</label>
              <input
                type="text"
                required
                value={dispatchForm.vehicle_number}
                onChange={(e) => setDispatchForm({ ...dispatchForm, vehicle_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LR Consignment #</label>
              <input
                type="text"
                required
                value={dispatchForm.lr_consignment_number}
                onChange={(e) => setDispatchForm({ ...dispatchForm, lr_consignment_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Driver / Carrier Name</label>
              <input
                type="text"
                required
                value={dispatchForm.driver_name}
                onChange={(e) => setDispatchForm({ ...dispatchForm, driver_name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Party / Consignee</label>
              <input
                type="text"
                required
                value={dispatchForm.receiving_party}
                onChange={(e) => setDispatchForm({ ...dispatchForm, receiving_party: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setDispatchModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Truck className="w-4 h-4" />
              <span>Confirm Outward Dispatch</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

