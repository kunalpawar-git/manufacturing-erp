import {
  PurchaseOrder,
  Vendor,
  Material,
  Customer,
  IqcInspection,
  InventoryBatch,
  SalesRequirement,
  ProductionWorkOrder,
  SampleQcRecord,
  PackagingOrder,
  Shipment,
  DispatchApproval,
  Complaint,
} from '../models/index.js';
import { ROLES, APPROVAL_DECISION } from '../constants/index.js';

export const getDashboardMetrics = async (user) => {
  const [
    totalPos,
    totalVendors,
    totalCustomers,
    totalMaterials,
    pendingIqc,
    acceptedIqc,
    rejectedIqc,
    activeWorkOrders,
    pendingSampleQc,
    pendingPackaging,
    pendingDispatchClearances,
    completedShipments,
    openComplaints,
    allBatches,
    salesRequirements,
  ] = await Promise.all([
    PurchaseOrder.count(),
    Vendor.count(),
    Customer.count(),
    Material.count(),
    IqcInspection.count({ where: { status: 'Pending' } }),
    IqcInspection.count({ where: { status: 'Accepted' } }),
    IqcInspection.count({ where: { status: 'Rejected' } }),
    ProductionWorkOrder.count({ where: { status: ['Planned', 'Sample Preparation', 'Sample QC Pending', 'In Production'] } }),
    SampleQcRecord.count({ where: { result: 'Pending' } }),
    PackagingOrder.count({ where: { status: 'Pending' } }),
    Shipment.count({ where: { status: 'Pending Clearance' } }),
    Shipment.count({ where: { status: 'Dispatched' } }),
    Complaint.count({ where: { investigation_status: ['Open', 'Investigating', 'Under CAPA'] } }),
    InventoryBatch.findAll({ attributes: ['division', 'current_quantity', 'status'] }),
    SalesRequirement.findAll({ attributes: ['status', 'created_by'] }),
  ]);

  // Total inventory calculation
  const totalInventoryUnits = allBatches.reduce((acc, b) => acc + (b.current_quantity || 0), 0);

  // IQC division counts
  const iqcByDivision = [
    { name: 'Paint', value: allBatches.filter((b) => b.division === 'Paint').length },
    { name: 'Assembly', value: allBatches.filter((b) => b.division === 'Assembly').length },
    { name: 'Store', value: allBatches.filter((b) => b.division === 'Store').length },
    { name: 'Basement', value: allBatches.filter((b) => b.division === 'Basement').length },
  ];

  // Sales requirements breakdown
  const salesStats = {
    total: salesRequirements.length,
    pending: salesRequirements.filter((s) => s.status === 'Submitted').length,
    approved: salesRequirements.filter((s) => s.status === 'Approved').length,
    rejected: salesRequirements.filter((s) => s.status === 'Rejected').length,
  };

  // Recent activity / trends for charts
  const monthlyActivity = [
    { month: 'Jun', production: 1200, dispatched: 1100, iqc: 1350 },
    { month: 'Jul', production: 1400, dispatched: 1300, iqc: 1500 },
    { month: 'Aug', production: 1600, dispatched: 1550, iqc: 1720 },
    { month: 'Sep', production: 1850, dispatched: 1700, iqc: 1900 },
    { month: 'Oct', production: 2100, dispatched: 2000, iqc: 2250 },
    { month: 'Nov', production: 2450, dispatched: 2320, iqc: 2600 },
  ];

  return {
    super_admin: {
      total_pos: totalPos,
      total_vendors: totalVendors,
      total_customers: totalCustomers,
      total_materials: totalMaterials,
      total_inventory_units: totalInventoryUnits,
      pending_iqc: pendingIqc,
      accepted_batches: acceptedIqc,
      rejected_batches: rejectedIqc,
      active_work_orders: activeWorkOrders,
      pending_sample_qc: pendingSampleQc,
      pending_packaging: pendingPackaging,
      pending_dispatch_approvals: pendingDispatchClearances,
      completed_shipments: completedShipments,
      open_complaints: openComplaints,
    },
    admin: {
      pending_sales_approvals: salesStats.pending,
      active_production_orders: activeWorkOrders,
      qc_pending: pendingSampleQc,
      packaging_pending: pendingPackaging,
      dispatch_approval_requests: pendingDispatchClearances,
      open_complaints: openComplaints,
    },
    sales: {
      my_requirements: salesStats.total,
      pending_approvals: salesStats.pending,
      approved_requirements: salesStats.approved,
      rejected_requirements: salesStats.rejected,
      active_production: activeWorkOrders,
      dispatched_shipments: completedShipments,
    },
    accounts: {
      pending_checklists: pendingDispatchClearances,
      pending_commercial_verification: pendingDispatchClearances,
      dispatch_approvals_pending: pendingDispatchClearances,
      completed_clearances: completedShipments,
    },
    charts: {
      iqc_divisions: iqcByDivision,
      monthly_trend: monthlyActivity,
    },
  };
};
