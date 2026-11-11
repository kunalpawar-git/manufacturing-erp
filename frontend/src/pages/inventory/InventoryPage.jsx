import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Boxes,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  SlidersHorizontal,
  Search,
} from 'lucide-react';

export default function InventoryPage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials'); // materials, batches, ledger
  const [search, setSearch] = useState('');

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustment_type: 'SET',
    quantity: '',
    remarks: 'Physical cycle count adjustment',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, txnRes] = await Promise.all([
        api.get('/inventory/summary'),
        api.get('/inventory/transactions'),
      ]);
      setSummary(sumRes.data);
      setTransactions(txnRes.data || []);
    } catch {
      // toast error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdjust = (batch) => {
    setSelectedBatch(batch);
    setAdjustForm({
      adjustment_type: 'SET',
      quantity: batch.current_quantity,
      remarks: 'Quarterly stock take reconciliation',
    });
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    try {
      await api.post('/inventory/adjust', {
        batch_id: selectedBatch.id,
        adjustment_type: adjustForm.adjustment_type,
        quantity: parseFloat(adjustForm.quantity),
        remarks: adjustForm.remarks,
      });
      toast.success('Inventory stock adjusted successfully');
      setAdjustModalOpen(false);
      loadData();
    } catch {
      // error toast handled
    }
  };

  if (loading || !summary) {
    return <LoadingSkeleton rows={6} cols={5} />;
  }

  const materials = summary.materials || [];
  const batches = summary.batches || [];
  const divisions = summary.divisions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Central Inventory & Batch Stock Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time material stock levels, batch-level segregation, division distribution, and immutable ledger movements.
          </p>
        </div>
      </div>

      {/* 4 Division Stock Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {divisions.map((div) => (
          <div key={div.division} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{div.division} Division</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{div.available_stock} <span className="text-xs font-normal text-slate-400">units</span></div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Batches: <strong className="text-slate-700">{div.total_batches}</strong></span>
              {div.rejected_stock > 0 && (
                <span className="text-rose-600 font-semibold">Rej: {div.rejected_stock}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors ${
            activeTab === 'materials'
              ? 'border-brand-600 text-brand-700 font-bold bg-brand-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Material Summary ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors ${
            activeTab === 'batches'
              ? 'border-brand-600 text-brand-700 font-bold bg-brand-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Batch Inventory ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors ${
            activeTab === 'ledger'
              ? 'border-brand-600 text-brand-700 font-bold bg-brand-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Movement Ledger ({transactions.length})
        </button>
      </div>

      {/* TAB 1: MATERIALS */}
      {activeTab === 'materials' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Material Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Available Stock</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3 text-right">Rejected</th>
                  <th className="px-4 py-3 text-center">Reorder Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((m) => (
                  <tr key={m.material_id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{m.material_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                    <td className="px-4 py-3 text-slate-500">{m.category}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {m.available_stock} {m.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">{m.reserved_stock}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">{m.rejected_stock}</td>
                    <td className="px-4 py-3 text-center">
                      {m.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          Low (Min: {m.reorder_level})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Sufficient
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: BATCHES */}
      {activeTab === 'batches' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Internal Batch ID</th>
                  <th className="px-4 py-3">Vendor Batch #</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-brand-700">{b.internal_batch_id}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{b.vendor_batch_number}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{b.material?.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                        {b.division}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {b.current_quantity} {b.material?.unit}
                    </td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenAdjust(b)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: STOCK LEDGER TRANSACTIONS */}
      {activeTab === 'ledger' && (
        <Card title="Stock Movement Audit Ledger" subtitle="Every stock receipt, consumption, and adjustment is recorded immutably">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Txn #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Batch ID</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-center">Balance Transition</th>
                  <th className="px-4 py-3">Remarks / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.transaction_number}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        t.transaction_type === 'RECEIPT' ? 'bg-emerald-50 text-emerald-700' : (t.transaction_type === 'CONSUMPTION' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700')
                      }`}>
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-brand-700">{t.batch?.internal_batch_id || '-'}</td>
                    <td className="px-4 py-3">{t.material?.name || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{t.quantity}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500">
                      {t.previous_quantity} → <strong className="text-slate-800">{t.new_quantity}</strong>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{t.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ADJUSTMENT MODAL */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Stock for Batch ${selectedBatch?.internal_batch_id}`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border text-xs">
            <div><strong>Material:</strong> {selectedBatch?.material?.name}</div>
            <div><strong>Current Stock:</strong> {selectedBatch?.current_quantity} {selectedBatch?.material?.unit}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type</label>
              <select
                value={adjustForm.adjustment_type}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustment_type: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="SET">SET (Exact Physical Count)</option>
                <option value="ADD">ADD (Receipt / Found Stock)</option>
                <option value="DEDUCT">DEDUCT (Scrap / Wastage)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Adjustment</label>
            <textarea
              rows={2}
              required
              value={adjustForm.remarks}
              onChange={(e) => setAdjustForm({ ...adjustForm, remarks: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              placeholder="Authorized audit reason..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setAdjustModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Adjustment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

