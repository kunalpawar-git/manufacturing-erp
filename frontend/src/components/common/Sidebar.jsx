import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  ShoppingCart,
  Microscope,
  Boxes,
  FileSpreadsheet,
  Cpu,
  CheckCircle,
  PackageCheck,
  QrCode,
  FileCheck2,
  ShieldAlert,
  Truck,
  AlertOctagon,
  BarChart3,
  History,
  Database,
  X,
} from 'lucide-react';

const navigationGroups = [
  {
    group: 'OVERVIEW',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'INBOUND & STORES',
    items: [
      { name: 'Purchase Orders', to: '/purchase-orders', icon: ShoppingCart },
      { name: 'Incoming QC (IQC)', to: '/iqc', icon: Microscope },
      { name: 'Inventory & Ledger', to: '/inventory', icon: Boxes },
    ],
  },
  {
    group: 'MANUFACTURING',
    items: [
      { name: 'Sales Requirements', to: '/sales-requirements', icon: FileSpreadsheet },
      { name: 'Production Orders', to: '/production', icon: Cpu },
      { name: 'Sample QC', to: '/sample-qc', icon: CheckCircle },
      { name: 'Packaging & Boxes', to: '/packaging', icon: PackageCheck },
    ],
  },
  {
    group: 'TRACEABILITY & QR',
    items: [
      { name: 'QR Scanner & Lineage', to: '/qr-traceability', icon: QrCode, highlight: true },
    ],
  },
  {
    group: 'CLEARANCE & DISPATCH',
    items: [
      { name: 'Accounts Checklist', to: '/accounts-checklist', icon: FileCheck2 },
      { name: '3-Way Clearance', to: '/dispatch-approvals', icon: ShieldAlert, badge: 'Mandatory' },
      { name: 'Outward Dispatch', to: '/outward-dispatch', icon: Truck },
    ],
  },
  {
    group: 'QUALITY & ASSURANCE',
    items: [
      { name: 'Customer Complaints', to: '/complaints', icon: AlertOctagon },
    ],
  },
  {
    group: 'CONTROL & MASTERS',
    items: [
      { name: 'Reports & Analytics', to: '/reports', icon: BarChart3 },
      { name: 'System Audit Logs', to: '/audit-logs', icon: History },
      { name: 'Master Data', to: '/master-data', icon: Database },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 bg-navy-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-black text-base shadow-md shadow-brand-500/20">
              M
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                MFG-ERP <span className="text-[10px] bg-brand-500/20 text-brand-300 font-mono px-1.5 py-0.5 rounded">v2.6</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Operations & Traceability</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navigationGroups.map((group) => (
            <div key={group.group}>
              <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-sm font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        } ${item.highlight ? 'border border-brand-500/30' : ''}`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / System status */}
        <div className="p-3.5 bg-navy-950 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-slate-400 font-medium">ERP Engine Online</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">PostgreSQL</span>
          </div>
        </div>
      </aside>
    </>
  );
}

