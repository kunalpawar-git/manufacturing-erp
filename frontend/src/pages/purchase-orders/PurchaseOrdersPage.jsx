import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  ShoppingCart,
  Plus,
  Eye,
  PackageCheck,
  Search,
  Calendar,
  Building,
  Truck,
  FileText,
  Trash2,
} from 'lucide-react';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);

  const [selectedPo, setSelectedPo] = useState(null);

  // New PO Form state
  const [poForm, setPoForm] = useState({
    po_direction: 'Inbound Supplier PO',
    vendor_id: '',
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
    items: [{ material_id: '', ordered_quantity: 100, unit_price: 150 }],
  });

  // Receive Material Form state
  const [receiveForm, setReceiveForm] = useState({
    material_id: '',
    received_quantity: '',
    receipt_date: new Date().toISOString().split('T')[0],
    carrier_info: '',
    challan_number: '',
    invoice_number: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [posRes, vRes, cRes, mRes, pRes] = await Promise.all([
        api.get('/purchase-orders', { params: { status: statusFilter || undefined } }),
        api.get('/vendors'),
        api.get('/customers'),
        api.get('/materials'),
        api.get('/products'),
      ]);
      setPurchaseOrders(posRes.data || []);
      setVendors(vRes.data || []);
      setCustomers(cRes.data || []);
      setMaterials(mRes.data || []);
      setProducts(pRes.data || []);
    } catch {
      // error toast handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Handle PO line item operations
  const handleAddItem = () => {
    setPoForm({
      ...poForm,
      items: [...poForm.items, { material_id: materials[0]?.id || '', ordered_quantity: 50, unit_price: 100 }],
    });
  };

  const handleRemoveItem = (index) => {
    const updated = poForm.items.filter((_, i) => i !== index);
    setPoForm({ ...poForm, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...poForm.items];
    updated[index][field] = value;
    if (field === 'material_id') {
      const selectedMat = materials.find((m) => m.id === value);
      if (selectedMat) {
        updated[index].unit_price = selectedMat.standard_cost;
      }
    }
    setPoForm({ ...poForm, items: updated });
  };

  const calculateTotal = () => {
    return poForm.items.reduce((acc, item) => acc + (parseFloat(item.ordered_quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    if (!poForm.vendor_id && !poForm.customer_id) {
      toast.error('Please select a supplier vendor or customer');
      return;
    }
    if (poForm.items.length === 0) {
      toast.error('At least one item is required in the PO');
      return;
    }

    try {
      await api.post('/purchase-orders', poForm);
      toast.success('Purchase Order registered successfully');
      setCreateModalOpen(false);
      loadData();
    } catch {
      // error handled
    }
  };

  const handleOpenReceive = (po) => {
    setSelectedPo(po);
    const firstItem = po.items && po.items.length > 0 ? po.items[0] : null;
    const pendingQty = firstItem ? Math.max(0, firstItem.ordered_quantity - (firstItem.received_quantity || 0)) : 100;

    setReceiveForm({
      material_id: firstItem ? firstItem.material_id : '',
      received_quantity: pendingQty,
      receipt_date: new Date().toISOString().split('T')[0],
      carrier_info: 'BlueDart / VRL Freight Logistics',
      challan_number: `DC-${Date.now().toString().slice(-6)}`,
      invoice_number: `INV-VEND-${Date.now().toString().slice(-4)}`,
    });
    setReceiveModalOpen(true);
  };

  const handleReceiveMaterial = async (e) => {
    e.preventDefault();
    try {
      await api.post('/receipts', {
        po_id: selectedPo.id,
        ...receiveForm,
      });
      toast.success('Material received successfully! Dispatched to IQC queue.');
      setReceiveModalOpen(false);
      loadData();
    } catch {
      // error handled
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Purchase Order Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Order intake, counterparty tracking, material receipt, and automatic IQC division routing.
          </p>
        </div>

        <button
          onClick={() => {
            setPoForm({
              po_direction: 'Inbound Supplier PO',
              vendor_id: vendors[0]?.id || '',
              customer_id: '',
              order_date: new Date().toISOString().split('T')[0],
              expected_delivery_date: '',
              notes: 'Standard industrial procurement terms.',
              items: [{ material_id: materials[0]?.id || '', ordered_quantity: 100, unit_price: materials[0]?.standard_cost || 100 }],
            });
            setCreateModalOpen(true);
          }}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO #, vendor, counterparty..."
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
            <option value="Submitted">Submitted</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Fully Received">Fully Received</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">PO Number</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Counterparty</th>
                  <th className="px-4 py-3">Order Date</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders
                  .filter((po) => po.po_number?.toLowerCase().includes(search.toLowerCase()) || po.vendor?.name?.toLowerCase().includes(search.toLowerCase()) || po.customer?.name?.toLowerCase().includes(search.toLowerCase()))
                  .map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{po.po_number}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {po.po_direction}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">
                          {po.vendor ? po.vendor.name : (po.customer ? po.customer.name : 'N/A')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {po.vendor ? `Code: ${po.vendor.vendor_code}` : `Cust: ${po.customer?.customer_code}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{po.order_date}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        ₹{(po.total_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {po.items?.length || 0} items
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={po.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedPo(po); setDetailsModalOpen(true); }}
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View PO Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {po.status !== 'Fully Received' && po.status !== 'Closed' && (
                            <button
                              onClick={() => handleOpenReceive(po)}
                              className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors flex items-center gap-1"
                              title="Receive Goods"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Receive</span>
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

      {/* CREATE PO MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Purchase Order"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreatePo} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PO Direction / Type</label>
              <select
                value={poForm.po_direction}
                onChange={(e) => setPoForm({ ...poForm, po_direction: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Inbound Supplier PO">Inbound Supplier PO (Procurement)</option>
                <option value="Outbound Customer SO">Outbound Customer SO (Sales Intake)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {poForm.po_direction === 'Inbound Supplier PO' ? 'Select Vendor / Supplier' : 'Select Customer'}
              </label>
              {poForm.po_direction === 'Inbound Supplier PO' ? (
                <select
                  required
                  value={poForm.vendor_id}
                  onChange={(e) => setPoForm({ ...poForm, vendor_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.vendor_code} - {v.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  required
                  value={poForm.customer_id}
                  onChange={(e) => setPoForm({ ...poForm, customer_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.customer_code} - {c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order Date</label>
              <input
                type="date"
                required
                value={poForm.order_date}
                onChange={(e) => setPoForm({ ...poForm, order_date: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={poForm.expected_delivery_date}
                onChange={(e) => setPoForm({ ...poForm, expected_delivery_date: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Line items section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">Line Items & Materials</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2 py-1 text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 rounded border border-brand-200 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {poForm.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Material</label>
                    <select
                      value={item.material_id}
                      onChange={(e) => handleItemChange(idx, 'material_id', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                    >
                      <option value="">Select Material</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>{m.material_code} - {m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Quantity</label>
                    <input
                      type="number"
                      value={item.ordered_quantity}
                      onChange={(e) => handleItemChange(idx, 'ordered_quantity', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-center font-mono font-semibold"
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Unit Price (₹)</label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-right font-mono"
                    />
                  </div>

                  <div className="w-28 text-right font-mono font-bold text-slate-800">
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Subtotal</label>
                    ₹{((item.ordered_quantity || 0) * (item.unit_price || 0)).toLocaleString('en-IN')}
                  </div>

                  {poForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 mt-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 text-sm font-bold text-slate-900">
              Total Order Value: ₹{calculateTotal().toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={poForm.notes}
              onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Submit Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* RECEIVE MATERIAL MODAL */}
      <Modal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        title={`Receive Material Against ${selectedPo?.po_number}`}
      >
        <form onSubmit={handleReceiveMaterial} className="space-y-4">
          <div className="p-3 bg-brand-50/60 rounded-lg border border-brand-200 text-xs text-brand-900">
            <strong>Inbound Receipt Notice:</strong> Upon recording this material receipt, the batch will automatically be routed to the Incoming Quality Control (IQC) queue for division assignment (Paint, Assembly, Store, Basement).
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Material Item</label>
            <select
              required
              value={receiveForm.material_id}
              onChange={(e) => setReceiveForm({ ...receiveForm, material_id: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              {selectedPo?.items?.map((item) => (
                <option key={item.id} value={item.material_id}>
                  {item.material?.material_code} - {item.material?.name} (Ordered: {item.ordered_quantity}, Recv: {item.received_quantity || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Received Quantity</label>
              <input
                type="number"
                required
                value={receiveForm.received_quantity}
                onChange={(e) => setReceiveForm({ ...receiveForm, received_quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Date</label>
              <input
                type="date"
                required
                value={receiveForm.receipt_date}
                onChange={(e) => setReceiveForm({ ...receiveForm, receipt_date: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier / Truck Info</label>
              <input
                type="text"
                value={receiveForm.carrier_info}
                onChange={(e) => setReceiveForm({ ...receiveForm, carrier_info: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                placeholder="MH-14-GH-1002 (VRL Logistics)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Challan # / Delivery Note</label>
              <input
                type="text"
                value={receiveForm.challan_number}
                onChange={(e) => setReceiveForm({ ...receiveForm, challan_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                placeholder="DC-99201"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Commercial Invoice #</label>
            <input
              type="text"
              value={receiveForm.invoice_number}
              onChange={(e) => setReceiveForm({ ...receiveForm, invoice_number: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
              placeholder="INV-2026-4010"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setReceiveModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Confirm Receipt & Send to IQC
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW PO DETAILS MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Purchase Order Details - ${selectedPo?.po_number}`}
        maxWidth="max-w-3xl"
      >
        {selectedPo && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Counterparty</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedPo.vendor ? selectedPo.vendor.name : (selectedPo.customer ? selectedPo.customer.name : 'N/A')}
                </span>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  GST: {selectedPo.vendor?.gst_number || selectedPo.customer?.gst_number || '-'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Order Date / Delivery</span>
                <span className="font-semibold text-slate-700">{selectedPo.order_date}</span>
                <div className="text-[11px] text-slate-500">Exp: {selectedPo.expected_delivery_date || 'N/A'}</div>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Amount & Status</span>
                <span className="font-mono font-bold text-brand-700 text-sm">
                  ₹{(selectedPo.total_amount || 0).toLocaleString('en-IN')}
                </span>
                <div className="mt-1"><Badge status={selectedPo.status} /></div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Order Line Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2.5">Material / Item</th>
                      <th className="p-2.5 text-center">Ordered</th>
                      <th className="p-2.5 text-center">Received</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPo.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-medium text-slate-800">
                          {it.material ? `${it.material.material_code} - ${it.material.name}` : (it.product ? it.product.name : 'Item')}
                        </td>
                        <td className="p-2.5 text-center font-mono font-semibold">{it.ordered_quantity}</td>
                        <td className="p-2.5 text-center font-mono font-semibold text-emerald-700">
                          {it.received_quantity || 0}
                        </td>
                        <td className="p-2.5 text-right font-mono">₹{it.unit_price?.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono font-bold">₹{it.total_price?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
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

