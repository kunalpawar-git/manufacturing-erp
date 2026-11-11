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
} from 'lucide-react';

const reportOptions = [
  { id: 'purchase-orders', name: '1. Purchase Order Report' },
  { id: 'vendors', name: '2. Vendor Master Report' },
  { id: 'iqc', name: '3. Incoming Quality Control (IQC) Report' },
  { id: 'inventory', name: '4. Batch Inventory Report' },
  { id: 'production', name: '5. Production Work Order Report' },
  { id: 'shipments', name: '6. Outward Dispatch & Shipment Report' },
  { id: 'complaints', name: '7. Customer Complaints & Authenticity Report' },
  { id: 'traceability', name: '8. Part QR Traceability Report' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('purchase-orders');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${selectedReport}`, {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      setReportData(res.data);
    } catch {
      // toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReport]);

  const handleExportExcel = async () => {
    try {
      const url = `/api/reports/${selectedReport}/export-excel?start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
        },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ERP_Report_${selectedReport}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Excel spreadsheet exported successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to export Excel report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports, Exports & Operational Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Query standard manufacturing datasets, apply date range filters, and export formatted Excel sheets.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export to Excel (.xlsx)</span>
        </button>
      </div>

      {/* Report Switcher & Date Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select ERP Report Module</label>
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

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <button
            onClick={fetchReport}
            className="px-3 py-1.5 mt-4 bg-brand-600 text-white rounded-lg text-xs font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* REPORT DATA TABLE */}
      {loading || !reportData ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <Card
          title={reportData.title}
          subtitle={`Total Records: ${reportData.rows?.length || 0}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  {reportData.columns?.map((col) => (
                    <th key={col.key} className="px-4 py-3">{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    {reportData.columns?.map((col) => (
                      <td key={col.key} className="px-4 py-3 font-medium text-slate-800">
                        {row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

