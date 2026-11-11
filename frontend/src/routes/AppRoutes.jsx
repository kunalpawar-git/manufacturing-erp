import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';

// Pages
import Login from '../pages/auth/Login';
import Profile from '../pages/auth/Profile';
import Dashboard from '../pages/dashboard/Dashboard';
import MasterDataPage from '../pages/master-data/MasterDataPage';
import PurchaseOrdersPage from '../pages/purchase-orders/PurchaseOrdersPage';
import IqcInspectionsPage from '../pages/iqc/IqcInspectionsPage';
import InventoryPage from '../pages/inventory/InventoryPage';
import SalesRequirementsPage from '../pages/sales-requirements/SalesRequirementsPage';
import ProductionPage from '../pages/production/ProductionPage';
import SampleQcPage from '../pages/sample-qc/SampleQcPage';
import PackagingPage from '../pages/packaging/PackagingPage';
import QrScannerPage from '../pages/qr-traceability/QrScannerPage';
import ChecklistPage from '../pages/accounts-checklist/ChecklistPage';
import DispatchApprovalsPage from '../pages/dispatch-approvals/DispatchApprovalsPage';
import ShipmentDispatchPage from '../pages/outward-dispatch/ShipmentDispatchPage';
import ComplaintsPage from '../pages/complaints/ComplaintsPage';
import ReportsPage from '../pages/reports/ReportsPage';
import AuditLogsPage from '../pages/audit-logs/AuditLogsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected ERP Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/master-data" element={<MasterDataPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/iqc" element={<IqcInspectionsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/sales-requirements" element={<SalesRequirementsPage />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/sample-qc" element={<SampleQcPage />} />
        <Route path="/packaging" element={<PackagingPage />} />
        <Route path="/qr-traceability" element={<QrScannerPage />} />
        <Route path="/accounts-checklist" element={<ChecklistPage />} />
        <Route path="/dispatch-approvals" element={<DispatchApprovalsPage />} />
        <Route path="/outward-dispatch" element={<ShipmentDispatchPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Default fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

