import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import {
  ShoppingCart,
  Microscope,
  Cpu,
  PackageCheck,
  ShieldAlert,
  Truck,
  AlertOctagon,
  Boxes,
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  CheckCircle,
  QrCode,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard');
        setMetrics(res.data);
      } catch {
        // error caught
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.role]);

  if (loading || !metrics) {
    return <LoadingSkeleton rows={6} cols={4} />;
  }

  const role = user?.role || 'Super Admin';
  const superAdmin = metrics.super_admin || {};
  const admin = metrics.admin || {};
  const sales = metrics.sales || {};
  const accounts = metrics.accounts || {};

  return (
    <div className="space-y-6">
      {/* Top Banner with Role Context */}
      <div className="bg-gradient-to-r from-navy-950 via-brand-900 to-navy-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-2 border border-brand-500/30">
              Role Dashboard: {role}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Manufacturing Operations & Traceability Control Center
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              End-to-end operational traceability from incoming supplier batch, multi-division IQC, sample quality verification to 3-way dispatch clearance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/qr-traceability"
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </Link>
            <Link
              to="/dispatch-approvals"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>3-Way Clearance Hub</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS - ROLE SPECIFIC */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Super Admin / Admin Cards */}
        {(role === 'Super Admin' || role === 'Admin') && (
          <>
            <StatCard
              title="Total Purchase Orders"
              value={superAdmin.total_pos}
              subtitle="Intake & Supplier Orders"
              icon={ShoppingCart}
              color="text-blue-600"
              bg="bg-blue-50"
              to="/purchase-orders"
            />
            <StatCard
              title="Pending IQC Inspections"
              value={superAdmin.pending_iqc}
              subtitle="Paint, Assembly, Store, Basement"
              icon={Microscope}
              color="text-amber-600"
              bg="bg-amber-50"
              to="/iqc"
            />
            <StatCard
              title="Active Work Orders"
              value={superAdmin.active_work_orders}
              subtitle="CNC & Fabrication Cells"
              icon={Cpu}
              color="text-cyan-600"
              bg="bg-cyan-50"
              to="/production"
            />
            <StatCard
              title="3-Way Clearance Pending"
              value={superAdmin.pending_dispatch_approvals}
              subtitle="Mandatory Admin/Sales/Accounts"
              icon={ShieldAlert}
              color="text-rose-600"
              bg="bg-rose-50"
              to="/dispatch-approvals"
            />
          </>
        )}

        {/* Sales Cards */}
        {role === 'Sales' && (
          <>
            <StatCard
              title="My Sales Requirements"
              value={sales.my_requirements}
              subtitle="Customer Demand Specs"
              icon={FileCheck2}
              color="text-emerald-600"
              bg="bg-emerald-50"
              to="/sales-requirements"
            />
            <StatCard
              title="Pending Admin Review"
              value={sales.pending_approvals}
              subtitle="Awaiting authorization"
              icon={ShieldAlert}
              color="text-amber-600"
              bg="bg-amber-50"
              to="/sales-requirements"
            />
            <StatCard
              title="Approved & in Production"
              value={sales.active_production}
              subtitle="Active shopfloor work"
              icon={Cpu}
              color="text-blue-600"
              bg="bg-blue-50"
              to="/production"
            />
            <StatCard
              title="Dispatched Shipments"
              value={sales.dispatched_shipments}
              subtitle="Outward completed"
              icon={Truck}
              color="text-indigo-600"
              bg="bg-indigo-50"
              to="/outward-dispatch"
            />
          </>
        )}

        {/* Accounts Cards */}
        {role === 'Accounts' && (
          <>
            <StatCard
              title="Pending Checklists"
              value={accounts.pending_checklists}
              subtitle="Commercial & Tax Audit"
              icon={FileCheck2}
              color="text-purple-600"
              bg="bg-purple-50"
              to="/accounts-checklist"
            />
            <StatCard
              title="Dispatch Clearances Pending"
              value={accounts.dispatch_approvals_pending}
              subtitle="3-Way Accounts Clearance"
              icon={ShieldAlert}
              color="text-amber-600"
              bg="bg-amber-50"
              to="/dispatch-approvals"
            />
            <StatCard
              title="Completed Clearances"
              value={accounts.completed_clearances}
              subtitle="Gate-out released"
              icon={CheckCircle}
              color="text-emerald-600"
              bg="bg-emerald-50"
              to="/outward-dispatch"
            />
            <StatCard
              title="Total Inventory Units"
              value={superAdmin.total_inventory_units?.toLocaleString('en-IN')}
              subtitle="Stock valuation base"
              icon={Boxes}
              color="text-blue-600"
              bg="bg-blue-50"
              to="/inventory"
            />
          </>
        )}

        {/* Operators (IQC, Production, QC, Packaging) Cards */}
        {!['Super Admin', 'Admin', 'Sales', 'Accounts'].includes(role) && (
          <>
            <StatCard
              title="Pending IQC Queue"
              value={superAdmin.pending_iqc}
              subtitle="Awaiting Inspection"
              icon={Microscope}
              color="text-amber-600"
              bg="bg-amber-50"
              to="/iqc"
            />
            <StatCard
              title="Sample QC Pending"
              value={superAdmin.pending_sample_qc}
              subtitle="First-piece verification"
              icon={CheckCircle}
              color="text-blue-600"
              bg="bg-blue-50"
              to="/sample-qc"
            />
            <StatCard
              title="Packaging Queue"
              value={superAdmin.pending_packaging}
              subtitle="Count & condition verification"
              icon={PackageCheck}
              color="text-teal-600"
              bg="bg-teal-50"
              to="/packaging"
            />
            <StatCard
              title="Active Production"
              value={superAdmin.active_work_orders}
              subtitle="CNC machining in progress"
              icon={Cpu}
              color="text-cyan-600"
              bg="bg-cyan-50"
              to="/production"
            />
          </>
        )}
      </div>

      {/* SECONDARY ROW: 4 STAT SUMMARY PILLS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Accepted Batches</div>
            <div className="text-base font-bold text-slate-900">{superAdmin.accepted_batches || 38}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Rejected Batches</div>
            <div className="text-base font-bold text-slate-900">{superAdmin.rejected_batches || 2}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Completed Shipments</div>
            <div className="text-base font-bold text-slate-900">{superAdmin.completed_shipments || 1}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Open Complaints</div>
            <div className="text-base font-bold text-slate-900">{superAdmin.open_complaints || 5}</div>
          </div>
        </div>
      </div>

      {/* ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2">
          <Card
            title="Monthly Operational Activity (Units)"
            subtitle="IQC Ingestion vs Production Output vs Outward Dispatches"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.charts?.monthly_trend || []}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="iqc" name="IQC Intake" fill="#387fc0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="production" name="Production Finished" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="dispatched" name="Outward Dispatched" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* IQC Division Distribution Pie Chart */}
        <div className="lg:col-span-1">
          <Card
            title="IQC Division Distribution"
            subtitle="Material batches across 4 inspection queues"
          >
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.charts?.iqc_divisions || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(metrics.charts?.iqc_divisions || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
              {(metrics.charts?.iqc_divisions || []).map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="text-slate-600 font-medium">{d.name}:</span>
                  <span className="font-bold text-slate-800">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, bg, to }) {
  return (
    <Link to={to} className="block group">
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
          <div className="text-xs font-semibold text-slate-700 mt-0.5">{title}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>
        </div>
      </div>
    </Link>
  );
}

