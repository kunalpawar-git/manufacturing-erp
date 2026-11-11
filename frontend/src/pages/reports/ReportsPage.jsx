import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Search,
} from 'lucide-react';

const reportOptions = [
  { id: 'purchase-orders', name: '1. Purchase Order Report' },
  { id: 'vendors', name: '2. Vendor Master Report' },
  { id: 'material-receipts', name: '3. Material Receipt Report' },
  { id: 'iqc', name: '4. IQC Inspection Report' },
  { id: 'batches-status', name: '5. Accepted / Rejected Batch Report' },
  { id: 'inventory', name: '6. Inventory Stock Report' },
  { id: 'batch-movements', name: '7. Batch Movement Report' },
  { id: 'sales-requirements', name: '8. Sales Requirement Report' },
  { id: 'production', name: '9. Production Work Order Report' },
  { id: 'sample-qc', name: '10. Sample QC Report' },
  { id: 'packaging', name: '11. Packaging Report' },
  { id: 'traceability', name: '12. QR Traceability Report' },
  { id: 'checklists', name: '13. Accounts Checklist Report' },
  { id: 'dispatch-approvals', name: '14. Dispatch Approval Report' },
  { id: 'shipments', name: '15. Outward Shipment Report' },
  { id: 'complaints', name: '16. Customer Complaint Report' },
  { id: 'vendor-performance', name: '17. Vendor Performance Report' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('purchase-orders');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [division, setDivision] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${selectedReport}`, {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          division: division || undefined,
          status: statusFilter || undefined,
        },
      });
      setReportData(res.data);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReport]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (division) params.set('division', division);
    if (statusFilter) params.set('status', statusFilter);
    return params.toString();
  };

  const handleExportExcel = async () => {
    try {
      const qs = buildQueryString();
      const url = `/api/reports/${selectedReport}/export-excel${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
        },
      });
      if (!res.ok) throw new Error('Excel export failed');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ERP_Report_${selectedReport}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Excel spreadsheet exported (.xlsx)');
    } catch (err) {
      toast.error(err.message || 'Failed to export Excel report');
    }
  };

  const handleExportPdf = async () => {
    try {
      const qs = buildQueryString();
      const url = `/api/reports/${selectedReport}/export-pdf${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
        },
      });
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ERP_Report_${selectedReport}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('PDF report generated (.pdf)');
    } catch (err) {
      toast.error(err.message || 'Failed to export PDF report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRows = (reportData?.rows || []).filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some(
      (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports, Exports & Operational Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All 17 enterprise manufacturing reports with Date, Division, Status, Vendor/Product filters, Excel (.xlsx), PDF (.pdf), and Print export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF (.pdf)</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Switcher & Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select ERP Report (17 Modules)</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
            >
              {reportOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Division Filter</label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">All Divisions</option>
              <option value="Paint">Paint</option>
              <option value="Assembly">Assembly</option>
              <option value="Store">Store</option>
              <option value="Basement">Basement</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchReport}
              className="flex-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter rows by Vendor, Product, Batch, Status..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {reportOptions.slice(0, 6).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  selectedReport === r.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.name.replace(/^\d+\.\s*/, '').replace(' Report', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* REPORT DATA TABLE */}
      {loading || !reportData ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <Card
          title={reportData.title}
          subtitle={`Showing ${filteredRows.length} of ${reportData.rows?.length || 0} records`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  {reportData.columns?.map((col) => (
                    <th key={col.key} className="px-4 py-3 whitespace-nowrap">{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={reportData.columns?.length || 1} className="px-4 py-8 text-center text-slate-400">
                      No matching records found for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      {reportData.columns?.map((col) => (
                        <td key={col.key} className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
