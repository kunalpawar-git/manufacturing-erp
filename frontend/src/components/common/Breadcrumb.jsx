import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames = {
  dashboard: 'Dashboard',
  'master-data': 'Master Data',
  vendors: 'Vendors',
  customers: 'Customers',
  materials: 'Materials',
  products: 'Products & BOM',
  users: 'User Management',
  'purchase-orders': 'Purchase Orders',
  iqc: 'Incoming Quality Control (IQC)',
  inventory: 'Inventory & Stock Ledger',
  'sales-requirements': 'Sales Requirements',
  production: 'Production Work Orders',
  'sample-qc': 'Sample Quality Control',
  packaging: 'Packaging & Box Association',
  'qr-traceability': 'QR Code Scanner & Traceability',
  'accounts-checklist': 'Accounts Dispatch Checklist',
  'dispatch-approvals': '3-Way Dispatch Clearance',
  'outward-dispatch': 'Outward Dispatch & Gate Pass',
  complaints: 'Customer Complaints & Authenticity',
  reports: 'Reports & Analytics',
  'audit-logs': 'System Audit Logs',
  profile: 'My Profile',
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-brand-600 transition-colors">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>Home</span>
      </Link>
      {pathnames.map((segment, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = routeNames[segment] || segment.replace(/-/g, ' ');

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1.5" />
            {isLast ? (
              <span className="font-semibold text-slate-800 capitalize">{name}</span>
            ) : (
              <Link to={to} className="hover:text-brand-600 capitalize transition-colors">
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

