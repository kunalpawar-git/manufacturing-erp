export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SALES: 'Sales',
  ACCOUNTS: 'Accounts',
  IQC_OPERATOR: 'IQC Operator',
  PRODUCTION: 'Production',
  QC_OPERATOR: 'QC Operator',
  PACKAGING: 'Packaging',
};

export const PERMISSIONS = {
  // Master data
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_MASTER_DATA: 'manage_master_data',
  VIEW_MASTER_DATA: 'view_master_data',

  // PO & Receipt
  CREATE_PO: 'create_po',
  APPROVE_PO: 'approve_po',
  RECEIVE_PO: 'receive_po',

  // IQC
  PERFORM_IQC: 'perform_iqc',
  APPROVE_IQC: 'approve_iqc',

  // Inventory
  VIEW_INVENTORY: 'view_inventory',
  ADJUST_INVENTORY: 'adjust_inventory',

  // Sales Requirement
  CREATE_REQUIREMENT: 'create_requirement',
  APPROVE_REQUIREMENT: 'approve_requirement',

  // Production
  MANAGE_PRODUCTION: 'manage_production',
  EXECUTE_PRODUCTION: 'execute_production',

  // QC
  PERFORM_QC: 'perform_qc',
  APPROVE_QC: 'approve_qc',

  // Packaging & QR
  PERFORM_PACKAGING: 'perform_packaging',
  APPROVE_PACKAGING: 'approve_packaging',
  GENERATE_QR: 'generate_qr',

  // Accounts Checklist
  PREPARE_CHECKLIST: 'prepare_checklist',
  ACKNOWLEDGE_CHECKLIST: 'acknowledge_checklist',

  // Dispatch Approvals (3-Way)
  DISPATCH_APPROVAL_ADMIN: 'dispatch_approval_admin',
  DISPATCH_APPROVAL_SALES: 'dispatch_approval_sales',
  DISPATCH_APPROVAL_ACCOUNTS: 'dispatch_approval_accounts',

  // Outward Dispatch
  EXECUTE_DISPATCH: 'execute_dispatch',

  // Complaints
  MANAGE_COMPLAINTS: 'manage_complaints',
  INVESTIGATE_COMPLAINTS: 'investigate_complaints',

  // Reports & Logs
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
};

export const IQC_DIVISIONS = {
  PAINT: 'Paint',
  ASSEMBLY: 'Assembly',
  STORE: 'Store',
  BASEMENT: 'Basement',
};

export const PO_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PARTIALLY_RECEIVED: 'Partially Received',
  FULLY_RECEIVED: 'Fully Received',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

export const PO_DIRECTION = {
  INBOUND_SUPPLIER: 'Inbound Supplier PO',
  OUTBOUND_CUSTOMER: 'Outbound Customer SO',
};

export const IQC_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  QUARANTINED: 'Quarantined',
};

export const INVENTORY_STATUS = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  QUARANTINED: 'Quarantined',
  REJECTED: 'Rejected',
  CONSUMED: 'Consumed',
};

export const REQUIREMENT_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVISED: 'Revised',
};

export const WORK_ORDER_STATUS = {
  PLANNED: 'Planned',
  SAMPLE_PREPARATION: 'Sample Preparation',
  SAMPLE_QC_PENDING: 'Sample QC Pending',
  SAMPLE_QC_FAILED: 'Sample QC Failed',
  SAMPLE_QC_PASSED: 'Sample QC Passed',
  IN_PRODUCTION: 'In Production',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const QC_RESULT = {
  PENDING: 'Pending',
  PASSED: 'Passed',
  FAILED: 'Failed',
};

export const PACKAGING_STATUS = {
  PENDING: 'Pending',
  INSPECTED: 'Inspected',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PACKED: 'Packed',
};

export const CHECKLIST_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACKNOWLEDGED: 'Acknowledged',
  CLEARED: 'Cleared',
};

export const ACKNOWLEDGEMENT_METHOD = {
  DOCUMENT_UPLOAD: 'Document Upload',
  EMAIL_ACKNOWLEDGEMENT: 'Email Acknowledgement',
  CUSTOMER_PORTAL: 'Customer Portal',
  INTERNAL_VERIFICATION: 'Internal Verification',
};

export const APPROVAL_DECISION = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  INVALIDATED: 'Invalidated',
};

export const SHIPMENT_STATUS = {
  DRAFT: 'Draft',
  PENDING_CLEARANCE: 'Pending Clearance',
  APPROVED: 'Approved',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const COMPLAINT_STATUS = {
  OPEN: 'Open',
  INVESTIGATING: 'Investigating',
  UNDER_CAPA: 'Under CAPA',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const DEFECT_CATEGORIES = [
  'Dimensional Inaccuracy',
  'Surface Finish / Paint Flaw',
  'Assembly Defect',
  'Packaging Damage',
  'Missing Component',
  'Material Brittleness / Failure',
  'Label Mismatch',
];
