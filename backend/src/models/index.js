import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// 1. Roles & Permissions
export const Role = sequelize.define('Role', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.STRING },
  is_system: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export const Permission = sequelize.define('Permission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
});

export const RolePermission = sequelize.define('RolePermission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  role_id: { type: DataTypes.UUID, allowNull: false },
  permission_id: { type: DataTypes.UUID, allowNull: false },
});

// 2. Department & Location
export const Department = sequelize.define('Department', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
});

export const Location = sequelize.define('Location', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'Warehouse' },
});

// 3. User
export const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  full_name: { type: DataTypes.STRING, allowNull: false },
  role_id: { type: DataTypes.UUID, allowNull: false },
  department_id: { type: DataTypes.UUID },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  phone: { type: DataTypes.STRING },
  operational_permissions: { 
    type: DataTypes.JSON, 
    defaultValue: [] 
  },
});

// 4. Vendor & Customer
export const Vendor = sequelize.define('Vendor', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vendor_code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  contact_person: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  gst_number: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  rating: { type: DataTypes.FLOAT, defaultValue: 4.5 },
});

export const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customer_code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  contact_person: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  gst_number: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
});

// 5. Product Category, Material & Product
export const ProductCategory = sequelize.define('ProductCategory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
});

export const Material = sequelize.define('Material', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  material_code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category_id: { type: DataTypes.UUID },
  unit: { type: DataTypes.STRING, defaultValue: 'kg' },
  description: { type: DataTypes.TEXT },
  reorder_level: { type: DataTypes.FLOAT, defaultValue: 50 },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  standard_cost: { type: DataTypes.FLOAT, defaultValue: 0 },
});

export const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  product_code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category_id: { type: DataTypes.UUID },
  bom_type: { type: DataTypes.STRING, defaultValue: 'Standard Assembly' },
  description: { type: DataTypes.TEXT },
  unit: { type: DataTypes.STRING, defaultValue: 'pcs' },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
});

export const BomItem = sequelize.define('BomItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  product_id: { type: DataTypes.UUID, allowNull: false },
  material_id: { type: DataTypes.UUID, allowNull: false },
  quantity_required: { type: DataTypes.FLOAT, allowNull: false },
  unit: { type: DataTypes.STRING },
  notes: { type: DataTypes.STRING },
});

// 6. Purchase Order & Items
export const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  po_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  po_direction: { type: DataTypes.STRING, defaultValue: 'Inbound Supplier PO' },
  vendor_id: { type: DataTypes.UUID },
  customer_id: { type: DataTypes.UUID },
  order_date: { type: DataTypes.DATEONLY, allowNull: false },
  expected_delivery_date: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.STRING, defaultValue: 'Draft' },
  total_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: 'INR' },
  notes: { type: DataTypes.TEXT },
  attachments: { type: DataTypes.JSON, defaultValue: [] },
  created_by: { type: DataTypes.UUID },
});

export const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  po_id: { type: DataTypes.UUID, allowNull: false },
  material_id: { type: DataTypes.UUID },
  product_id: { type: DataTypes.UUID },
  ordered_quantity: { type: DataTypes.FLOAT, allowNull: false },
  received_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  unit_price: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_price: { type: DataTypes.FLOAT, defaultValue: 0 },
  notes: { type: DataTypes.STRING },
});

// 7. Material Receipt
export const MaterialReceipt = sequelize.define('MaterialReceipt', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  receipt_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  po_id: { type: DataTypes.UUID, allowNull: false },
  po_item_id: { type: DataTypes.UUID },
  vendor_id: { type: DataTypes.UUID, allowNull: false },
  material_id: { type: DataTypes.UUID, allowNull: false },
  received_quantity: { type: DataTypes.FLOAT, allowNull: false },
  receipt_date: { type: DataTypes.DATEONLY, allowNull: false },
  carrier_info: { type: DataTypes.STRING },
  challan_number: { type: DataTypes.STRING },
  invoice_number: { type: DataTypes.STRING },
  created_by: { type: DataTypes.UUID },
});

// 8. IQC Inspection
export const IqcInspection = sequelize.define('IqcInspection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  inspection_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  receipt_id: { type: DataTypes.UUID, allowNull: false },
  division: { type: DataTypes.STRING, allowNull: false }, // Paint, Assembly, Store, Basement
  vendor_id: { type: DataTypes.UUID, allowNull: false },
  material_id: { type: DataTypes.UUID, allowNull: false },
  vendor_batch_number: { type: DataTypes.STRING, allowNull: false }, // PRESERVED EXACTLY
  internal_batch_id: { type: DataTypes.STRING, allowNull: false, unique: true }, // GENERATED
  received_quantity: { type: DataTypes.FLOAT, allowNull: false },
  accepted_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  rejected_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  quarantined_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending, Accepted, Rejected, Quarantined
  inspector_id: { type: DataTypes.UUID },
  inspection_date: { type: DataTypes.DATEONLY },
  checklist_data: { type: DataTypes.JSON, defaultValue: {} },
  remarks: { type: DataTypes.TEXT },
  evidence_files: { type: DataTypes.JSON, defaultValue: [] },
  created_by: { type: DataTypes.UUID },
});

// 9. Inventory Batch & Ledger Transactions
export const InventoryBatch = sequelize.define('InventoryBatch', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  internal_batch_id: { type: DataTypes.STRING, allowNull: false, unique: true },
  vendor_batch_number: { type: DataTypes.STRING, allowNull: false },
  vendor_id: { type: DataTypes.UUID, allowNull: false },
  material_id: { type: DataTypes.UUID, allowNull: false },
  iqc_id: { type: DataTypes.UUID },
  division: { type: DataTypes.STRING, allowNull: false },
  initial_quantity: { type: DataTypes.FLOAT, allowNull: false },
  current_quantity: { type: DataTypes.FLOAT, allowNull: false },
  reserved_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  rejected_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  quarantined_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  consumed_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'Available' }, // Available, Quarantined, Rejected, Consumed
  location_id: { type: DataTypes.UUID },
  receipt_date: { type: DataTypes.DATEONLY },
  expiry_date: { type: DataTypes.DATEONLY },
});

export const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  transaction_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  batch_id: { type: DataTypes.UUID, allowNull: false },
  material_id: { type: DataTypes.UUID, allowNull: false },
  transaction_type: { type: DataTypes.STRING, allowNull: false }, // RECEIPT, CONSUMPTION, ADJUSTMENT, REJECTION, QUARANTINE
  quantity: { type: DataTypes.FLOAT, allowNull: false },
  previous_quantity: { type: DataTypes.FLOAT, allowNull: false },
  new_quantity: { type: DataTypes.FLOAT, allowNull: false },
  reference_type: { type: DataTypes.STRING }, // IQC, PRODUCTION_WO, ADJUSTMENT
  reference_id: { type: DataTypes.STRING },
  remarks: { type: DataTypes.TEXT },
  created_by: { type: DataTypes.UUID },
});

// 10. Sales Requirement & Approval
export const SalesRequirement = sequelize.define('SalesRequirement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requirement_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  customer_id: { type: DataTypes.UUID, allowNull: false },
  po_id: { type: DataTypes.UUID },
  product_id: { type: DataTypes.UUID, allowNull: false },
  required_quantity: { type: DataTypes.FLOAT, allowNull: false },
  required_delivery_date: { type: DataTypes.DATEONLY, allowNull: false },
  priority: { type: DataTypes.STRING, defaultValue: 'Medium' },
  status: { type: DataTypes.STRING, defaultValue: 'Submitted' }, // Draft, Submitted, Approved, Rejected, Revised
  description: { type: DataTypes.TEXT },
  attachments: { type: DataTypes.JSON, defaultValue: [] },
  revision_number: { type: DataTypes.INTEGER, defaultValue: 1 },
  rejection_reason: { type: DataTypes.TEXT },
  created_by: { type: DataTypes.UUID, allowNull: false },
});

export const RequirementApproval = sequelize.define('RequirementApproval', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requirement_id: { type: DataTypes.UUID, allowNull: false },
  reviewer_id: { type: DataTypes.UUID, allowNull: false },
  decision: { type: DataTypes.STRING, allowNull: false }, // Approved, Rejected
  revision_number: { type: DataTypes.INTEGER, defaultValue: 1 },
  comments: { type: DataTypes.TEXT },
  decided_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// 11. Production Work Order & Material Consumption
export const ProductionWorkOrder = sequelize.define('ProductionWorkOrder', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  work_order_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  requirement_id: { type: DataTypes.UUID, allowNull: false },
  po_id: { type: DataTypes.UUID },
  product_id: { type: DataTypes.UUID, allowNull: false },
  target_quantity: { type: DataTypes.FLOAT, allowNull: false },
  produced_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  rejected_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'Planned' }, // Planned, Sample Preparation, Sample QC Pending, Sample QC Passed, In Production, Completed, Cancelled
  sample_status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending, Prepared, QC Passed, QC Failed
  sample_notes: { type: DataTypes.TEXT },
  start_date: { type: DataTypes.DATEONLY },
  end_date: { type: DataTypes.DATEONLY },
  assigned_to: { type: DataTypes.UUID },
  department_id: { type: DataTypes.UUID },
  remarks: { type: DataTypes.TEXT },
  created_by: { type: DataTypes.UUID },
});

export const ProductionMaterialConsumption = sequelize.define('ProductionMaterialConsumption', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  work_order_id: { type: DataTypes.UUID, allowNull: false },
  batch_id: { type: DataTypes.UUID, allowNull: false },
  material_id: { type: DataTypes.UUID, allowNull: false },
  quantity_consumed: { type: DataTypes.FLOAT, allowNull: false },
  scrap_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  notes: { type: DataTypes.STRING },
});

// 12. Sample QC
export const SampleQcRecord = sequelize.define('SampleQcRecord', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  qc_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  work_order_id: { type: DataTypes.UUID, allowNull: false },
  sample_identifier: { type: DataTypes.STRING, allowNull: false },
  inspector_id: { type: DataTypes.UUID, allowNull: false },
  inspection_date: { type: DataTypes.DATEONLY, allowNull: false },
  parameters: { type: DataTypes.JSON, defaultValue: [] },
  result: { type: DataTypes.STRING, allowNull: false }, // Passed, Failed
  defect_details: { type: DataTypes.TEXT },
  rework_instructions: { type: DataTypes.TEXT },
  remarks: { type: DataTypes.TEXT },
  images: { type: DataTypes.JSON, defaultValue: [] },
  approved_by: { type: DataTypes.UUID },
  approved_at: { type: DataTypes.DATE },
});

// 13. Packaging Order & Master Box & Part Instances
export const PackagingOrder = sequelize.define('PackagingOrder', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  packaging_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  work_order_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  total_quantity: { type: DataTypes.FLOAT, allowNull: false },
  packed_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  rejected_quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending, Inspected, Approved, Rejected, Packed
  component_verification: { type: DataTypes.BOOLEAN, defaultValue: false },
  condition_verification: { type: DataTypes.BOOLEAN, defaultValue: false },
  operator_id: { type: DataTypes.UUID },
  inspected_at: { type: DataTypes.DATE },
  remarks: { type: DataTypes.TEXT },
  approved_by: { type: DataTypes.UUID },
  approved_at: { type: DataTypes.DATE },
  created_by: { type: DataTypes.UUID },
});

export const MasterBox = sequelize.define('MasterBox', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  box_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  packaging_order_id: { type: DataTypes.UUID, allowNull: false },
  qr_code: { type: DataTypes.TEXT }, // QR payload or Data URL
  qr_token: { type: DataTypes.STRING, allowNull: false, unique: true }, // Opaque secure token
  capacity: { type: DataTypes.INTEGER, defaultValue: 20 },
  packed_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'Packed' }, // Packed, In Shipment, Dispatched
  weight_kg: { type: DataTypes.FLOAT, defaultValue: 5.0 },
  dimensions: { type: DataTypes.STRING, defaultValue: '40x30x30 cm' },
  created_by: { type: DataTypes.UUID },
});

export const PartInstance = sequelize.define('PartInstance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  part_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  packaging_order_id: { type: DataTypes.UUID, allowNull: false },
  box_id: { type: DataTypes.UUID },
  work_order_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  qr_code: { type: DataTypes.TEXT }, // QR payload or Data URL
  qr_token: { type: DataTypes.STRING, allowNull: false, unique: true }, // Opaque secure token
  status: { type: DataTypes.STRING, defaultValue: 'Active' }, // Active, Dispatched, Scanned, Returned
  serial_number: { type: DataTypes.STRING },
  created_by: { type: DataTypes.UUID },
});

export const BoxPartMapping = sequelize.define('BoxPartMapping', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  box_id: { type: DataTypes.UUID, allowNull: false },
  part_id: { type: DataTypes.UUID, allowNull: false },
  batch_id: { type: DataTypes.UUID },
  mapped_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

export const QrCode = sequelize.define('QrCode', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code_type: { type: DataTypes.STRING, allowNull: false }, // PART, BOX, BATCH, SHIPMENT
  code_value: { type: DataTypes.STRING, allowNull: false, unique: true },
  token: { type: DataTypes.STRING, allowNull: false, unique: true },
  entity_type: { type: DataTypes.STRING, allowNull: false },
  entity_id: { type: DataTypes.UUID, allowNull: false },
  qr_image_data: { type: DataTypes.TEXT },
  scan_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  last_scanned_at: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
});

// 14. Accounts Checklist
export const Checklist = sequelize.define('Checklist', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  checklist_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  po_id: { type: DataTypes.UUID },
  shipment_id: { type: DataTypes.UUID },
  customer_id: { type: DataTypes.UUID },
  vendor_id: { type: DataTypes.UUID },
  acknowledgement_method: { type: DataTypes.STRING, defaultValue: 'Internal Verification' }, // Document Upload, Email, Customer Portal, Internal Verification
  acknowledgement_status: { type: DataTypes.STRING, defaultValue: 'Draft' }, // Draft, Sent, Acknowledged, Cleared
  acknowledgement_date: { type: DataTypes.DATEONLY },
  acknowledgement_ref: { type: DataTypes.STRING },
  documents: { type: DataTypes.JSON, defaultValue: [] },
  commercial_invoice_number: { type: DataTypes.STRING },
  tax_details: { type: DataTypes.JSON, defaultValue: {} },
  remarks: { type: DataTypes.TEXT },
  created_by: { type: DataTypes.UUID },
});

// 15. Shipment & Dispatch (Mandatory 3-Way Clearance)
export const Shipment = sequelize.define('Shipment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  shipment_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  version: { type: DataTypes.INTEGER, defaultValue: 1 }, // Changed if boxes or quantities modified!
  customer_id: { type: DataTypes.UUID, allowNull: false },
  destination_address: { type: DataTypes.TEXT, allowNull: false },
  total_boxes: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_parts: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'Pending Clearance' }, // Draft, Pending Clearance, Approved, Dispatched, Delivered, Cancelled
  vehicle_number: { type: DataTypes.STRING },
  lr_consignment_number: { type: DataTypes.STRING },
  driver_name: { type: DataTypes.STRING },
  driver_phone: { type: DataTypes.STRING },
  dispatch_date: { type: DataTypes.DATEONLY },
  gate_out_time: { type: DataTypes.DATE },
  receiving_party: { type: DataTypes.STRING },
  remarks: { type: DataTypes.TEXT },
  documents: { type: DataTypes.JSON, defaultValue: [] },
  created_by: { type: DataTypes.UUID },
});

export const ShipmentBox = sequelize.define('ShipmentBox', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  shipment_id: { type: DataTypes.UUID, allowNull: false },
  box_id: { type: DataTypes.UUID, allowNull: false },
});

export const DispatchApproval = sequelize.define('DispatchApproval', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  shipment_id: { type: DataTypes.UUID, allowNull: false },
  shipment_version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  role: { type: DataTypes.STRING, allowNull: false }, // Admin, Sales, Accounts
  approver_id: { type: DataTypes.UUID },
  decision: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending, Approved, Rejected, Invalidated
  comments: { type: DataTypes.TEXT },
  decided_at: { type: DataTypes.DATE },
});

// 16. Complaints & Investigation
export const Complaint = sequelize.define('Complaint', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  complaint_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  customer_id: { type: DataTypes.UUID, allowNull: false },
  complaint_date: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  defect_category: { type: DataTypes.STRING, allowNull: false },
  part_id: { type: DataTypes.UUID },
  box_id: { type: DataTypes.UUID },
  scanned_part_code: { type: DataTypes.STRING },
  scanned_box_code: { type: DataTypes.STRING },
  claimed_vendor_batch: { type: DataTypes.STRING },
  claimed_internal_batch: { type: DataTypes.STRING },
  verification_status: { type: DataTypes.STRING, defaultValue: 'Unverified' }, // Verified Authentic, Mismatch Detected, Unverified
  discrepancy_flags: { type: DataTypes.JSON, defaultValue: [] },
  investigation_status: { type: DataTypes.STRING, defaultValue: 'Open' }, // Open, Investigating, Under CAPA, Resolved, Closed
  resolution: { type: DataTypes.TEXT },
  replacement_details: { type: DataTypes.TEXT },
  capa_summary: { type: DataTypes.TEXT },
  closed_at: { type: DataTypes.DATE },
  created_by: { type: DataTypes.UUID },
});

export const ComplaintInvestigation = sequelize.define('ComplaintInvestigation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  complaint_id: { type: DataTypes.UUID, allowNull: false },
  investigator_id: { type: DataTypes.UUID, allowNull: false },
  findings: { type: DataTypes.TEXT, allowNull: false },
  root_cause: { type: DataTypes.TEXT },
  corrective_action: { type: DataTypes.TEXT },
  preventive_action: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'In Progress' },
  attachments: { type: DataTypes.JSON, defaultValue: [] },
});

// 17. Notification & Audit Log
export const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID },
  role: { type: DataTypes.STRING },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'info' }, // info, warning, success, error
  entity_type: { type: DataTypes.STRING },
  entity_id: { type: DataTypes.STRING },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID },
  action: { type: DataTypes.STRING, allowNull: false },
  entity_type: { type: DataTypes.STRING, allowNull: false },
  entity_id: { type: DataTypes.STRING, allowNull: false },
  old_values: { type: DataTypes.JSON },
  new_values: { type: DataTypes.JSON },
  reason: { type: DataTypes.TEXT },
  ip_address: { type: DataTypes.STRING },
});

// ================= RELATIONSHIPS =================

// Role & Permission
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id' });

// User
User.belongsTo(Role, { foreignKey: 'role_id' });
User.belongsTo(Department, { foreignKey: 'department_id' });

// Material & Product & Category
Material.belongsTo(ProductCategory, { foreignKey: 'category_id' });
Product.belongsTo(ProductCategory, { foreignKey: 'category_id' });
Product.hasMany(BomItem, { foreignKey: 'product_id', as: 'bom_items' });
BomItem.belongsTo(Product, { foreignKey: 'product_id' });
BomItem.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });

// PO
PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
PurchaseOrder.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'po_id', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'po_id' });
PurchaseOrderItem.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Material Receipt
MaterialReceipt.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });
MaterialReceipt.belongsTo(PurchaseOrderItem, { foreignKey: 'po_item_id', as: 'po_item' });
MaterialReceipt.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
MaterialReceipt.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });
MaterialReceipt.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// IQC Inspection
IqcInspection.belongsTo(MaterialReceipt, { foreignKey: 'receipt_id', as: 'receipt' });
IqcInspection.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
IqcInspection.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });
IqcInspection.belongsTo(User, { foreignKey: 'inspector_id', as: 'inspector' });
IqcInspection.hasOne(InventoryBatch, { foreignKey: 'iqc_id', as: 'batch' });

// Inventory Batch
InventoryBatch.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
InventoryBatch.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });
InventoryBatch.belongsTo(IqcInspection, { foreignKey: 'iqc_id', as: 'inspection' });
InventoryBatch.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
InventoryBatch.hasMany(InventoryTransaction, { foreignKey: 'batch_id', as: 'transactions' });
InventoryTransaction.belongsTo(InventoryBatch, { foreignKey: 'batch_id', as: 'batch' });
InventoryTransaction.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });
InventoryTransaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Sales Requirement
SalesRequirement.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
SalesRequirement.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });
SalesRequirement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
SalesRequirement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SalesRequirement.hasMany(RequirementApproval, { foreignKey: 'requirement_id', as: 'approvals' });
RequirementApproval.belongsTo(SalesRequirement, { foreignKey: 'requirement_id' });
RequirementApproval.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });

// Production Work Order
ProductionWorkOrder.belongsTo(SalesRequirement, { foreignKey: 'requirement_id', as: 'sales_requirement' });
ProductionWorkOrder.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });
ProductionWorkOrder.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductionWorkOrder.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
ProductionWorkOrder.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
ProductionWorkOrder.hasMany(ProductionMaterialConsumption, { foreignKey: 'work_order_id', as: 'consumptions' });
ProductionMaterialConsumption.belongsTo(ProductionWorkOrder, { foreignKey: 'work_order_id' });
ProductionMaterialConsumption.belongsTo(InventoryBatch, { foreignKey: 'batch_id', as: 'batch' });
ProductionMaterialConsumption.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });
ProductionWorkOrder.hasMany(SampleQcRecord, { foreignKey: 'work_order_id', as: 'qc_records' });
SampleQcRecord.belongsTo(ProductionWorkOrder, { foreignKey: 'work_order_id', as: 'work_order' });
SampleQcRecord.belongsTo(User, { foreignKey: 'inspector_id', as: 'inspector' });

// Packaging
PackagingOrder.belongsTo(ProductionWorkOrder, { foreignKey: 'work_order_id', as: 'work_order' });
PackagingOrder.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
PackagingOrder.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });
PackagingOrder.hasMany(MasterBox, { foreignKey: 'packaging_order_id', as: 'boxes' });
PackagingOrder.hasMany(PartInstance, { foreignKey: 'packaging_order_id', as: 'parts' });

MasterBox.belongsTo(PackagingOrder, { foreignKey: 'packaging_order_id', as: 'packaging_order' });
MasterBox.hasMany(PartInstance, { foreignKey: 'box_id', as: 'parts' });
PartInstance.belongsTo(MasterBox, { foreignKey: 'box_id', as: 'box' });
PartInstance.belongsTo(PackagingOrder, { foreignKey: 'packaging_order_id', as: 'packaging_order' });
PartInstance.belongsTo(ProductionWorkOrder, { foreignKey: 'work_order_id', as: 'work_order' });
PartInstance.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

MasterBox.belongsToMany(PartInstance, { through: BoxPartMapping, foreignKey: 'box_id', as: 'mapped_parts' });
PartInstance.belongsToMany(MasterBox, { through: BoxPartMapping, foreignKey: 'part_id', as: 'mapped_boxes' });
BoxPartMapping.belongsTo(InventoryBatch, { foreignKey: 'batch_id', as: 'source_batch' });

// Checklist
Checklist.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });
Checklist.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });
Checklist.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Checklist.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// Shipment & 3-Way Clearance
Shipment.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Shipment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Shipment.belongsToMany(MasterBox, { through: ShipmentBox, foreignKey: 'shipment_id', as: 'boxes' });
MasterBox.belongsToMany(Shipment, { through: ShipmentBox, foreignKey: 'box_id', as: 'shipments' });
Shipment.hasMany(DispatchApproval, { foreignKey: 'shipment_id', as: 'approvals' });
DispatchApproval.belongsTo(Shipment, { foreignKey: 'shipment_id' });
DispatchApproval.belongsTo(User, { foreignKey: 'approver_id', as: 'approver' });

// Complaint
Complaint.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Complaint.belongsTo(PartInstance, { foreignKey: 'part_id', as: 'part' });
Complaint.belongsTo(MasterBox, { foreignKey: 'box_id', as: 'box' });
Complaint.hasMany(ComplaintInvestigation, { foreignKey: 'complaint_id', as: 'investigations' });
ComplaintInvestigation.belongsTo(Complaint, { foreignKey: 'complaint_id' });
ComplaintInvestigation.belongsTo(User, { foreignKey: 'investigator_id', as: 'investigator' });

// Audit & Notification
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default {
  sequelize,
  Role,
  Permission,
  RolePermission,
  Department,
  Location,
  User,
  Vendor,
  Customer,
  ProductCategory,
  Material,
  Product,
  BomItem,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialReceipt,
  IqcInspection,
  InventoryBatch,
  InventoryTransaction,
  SalesRequirement,
  RequirementApproval,
  ProductionWorkOrder,
  ProductionMaterialConsumption,
  SampleQcRecord,
  PackagingOrder,
  MasterBox,
  PartInstance,
  BoxPartMapping,
  QrCode,
  Checklist,
  Shipment,
  ShipmentBox,
  DispatchApproval,
  Complaint,
  ComplaintInvestigation,
  Notification,
  AuditLog,
};
