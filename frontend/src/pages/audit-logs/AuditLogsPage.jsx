import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { History, Search, ShieldCheck } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      setLogs(res.data?.rows || res.data || []);
    } catch {
      // toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Audit Logs & Compliance</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable audit trail capturing all system authentications, status changes, 3-way clearances, stock adjustments, and exceptions.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <Card title="Recorded System Events" subtitle={`Showing ${logs.length} logged entries`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action Event</th>
                  <th className="px-4 py-3">Actor / User</th>
                  <th className="px-4 py-3">Target Entity</th>
                  <th className="px-4 py-3">Entity ID</th>
                  <th className="px-4 py-3">Changes & Parameters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs
                  .filter((l) => l.action?.toLowerCase().includes(search.toLowerCase()) || l.entity_type?.toLowerCase().includes(search.toLowerCase()))
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-800">
                        {log.user?.full_name || 'System / Automated'}
                      </td>
                      <td className="px-4 py-3 text-brand-700 font-semibold">{log.entity_type}</td>
                      <td className="px-4 py-3 text-slate-600">{log.entity_id}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate font-mono text-[10px]">
                        {log.new_values ? JSON.stringify(log.new_values) : (log.reason || '-')}
                      </td>
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

