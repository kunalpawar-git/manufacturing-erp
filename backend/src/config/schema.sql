-- PostgreSQL DDL Schema for Manufacturing Operations & Traceability ERP
-- Compatible with PostgreSQL 13+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Master Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organization Structure
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) DEFAULT 'Warehouse',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  department_id UUID REFERENCES departments(id),
  status VARCHAR(50) DEFAULT 'Active',
  phone VARCHAR(50),
  operational_permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Commercial Master Data
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(150),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  gst_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Active',
  rating NUMERIC(3,2) DEFAULT 4.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(150),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  gst_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category_id UUID REFERENCES product_categories(id),
  unit VARCHAR(50) DEFAULT 'kg',
  description TEXT,
  reorder_level NUMERIC(10,2) DEFAULT 50,
  status VARCHAR(50) DEFAULT 'Active',
  standard_cost NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category_id UUID REFERENCES product_categories(id),
  bom_type VARCHAR(100) DEFAULT 'Standard Assembly',
  description TEXT,
  unit VARCHAR(50) DEFAULT 'pcs',
  status VARCHAR(50) DEFAULT 'Active',
  price NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bom_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id),
  quantity_required NUMERIC(10,4) NOT NULL,
  unit VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inbound PO & Material Receipts
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number VARCHAR(50) NOT NULL UNIQUE,
  po_direction VARCHAR(50) DEFAULT 'Inbound Supplier PO',
  vendor_id UUID REFERENCES vendors(id),
  customer_id UUID REFERENCES customers(id),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  status VARCHAR(50) DEFAULT 'Draft',
  total_amount NUMERIC(14,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id),
  product_id UUID REFERENCES products(id),
  ordered_quantity NUMERIC(12,2) NOT NULL,
  received_quantity NUMERIC(12,2) DEFAULT 0,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  po_id UUID NOT NULL REFERENCES purchase_orders(id),
  po_item_id UUID REFERENCES purchase_order_items(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  material_id UUID NOT NULL REFERENCES materials(id),
  received_quantity NUMERIC(12,2) NOT NULL,
  receipt_date DATE NOT NULL,
  carrier_info VARCHAR(255),
  challan_number VARCHAR(100),
  invoice_number VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. IQC & Batch Inventory
CREATE TABLE IF NOT EXISTS iqc_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_number VARCHAR(50) NOT NULL UNIQUE,
  receipt_id UUID NOT NULL REFERENCES material_receipts(id),
  division VARCHAR(50) NOT NULL, -- Paint, Assembly, Store, Basement
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  material_id UUID NOT NULL REFERENCES materials(id),
  vendor_batch_number VARCHAR(100) NOT NULL, -- PRESERVED
  internal_batch_id VARCHAR(50) NOT NULL UNIQUE, -- GENERATED
  received_quantity NUMERIC(12,2) NOT NULL,
  accepted_quantity NUMERIC(12,2) DEFAULT 0,
  rejected_quantity NUMERIC(12,2) DEFAULT 0,
  quarantined_quantity NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pending',
  inspector_id UUID REFERENCES users(id),
  inspection_date DATE,
  checklist_data JSONB DEFAULT '{}'::jsonb,
  remarks TEXT,
  evidence_files JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  internal_batch_id VARCHAR(50) NOT NULL UNIQUE,
  vendor_batch_number VARCHAR(100) NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  material_id UUID NOT NULL REFERENCES materials(id),
  iqc_id UUID REFERENCES iqc_inspections(id),
  division VARCHAR(50) NOT NULL,
  initial_quantity NUMERIC(12,2) NOT NULL,
  current_quantity NUMERIC(12,2) NOT NULL,
  reserved_quantity NUMERIC(12,2) DEFAULT 0,
  rejected_quantity NUMERIC(12,2) DEFAULT 0,
  quarantined_quantity NUMERIC(12,2) DEFAULT 0,
  consumed_quantity NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Available',
  location_id UUID REFERENCES locations(id),
  receipt_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number VARCHAR(50) NOT NULL UNIQUE,
  batch_id UUID NOT NULL REFERENCES inventory_batches(id),
  material_id UUID NOT NULL REFERENCES materials(id),
  transaction_type VARCHAR(50) NOT NULL, -- RECEIPT, CONSUMPTION, ADJUSTMENT
  quantity NUMERIC(12,2) NOT NULL,
  previous_quantity NUMERIC(12,2) NOT NULL,
  new_quantity NUMERIC(12,2) NOT NULL,
  reference_type VARCHAR(100),
  reference_id VARCHAR(100),
  remarks TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sales Requirements & Production
CREATE TABLE IF NOT EXISTS sales_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  po_id UUID REFERENCES purchase_orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  required_quantity NUMERIC(12,2) NOT NULL,
  required_delivery_date DATE NOT NULL,
  priority VARCHAR(50) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'Submitted',
  description TEXT,
  revision_number INT DEFAULT 1,
  rejection_reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requirement_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id UUID NOT NULL REFERENCES sales_requirements(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(50) NOT NULL,
  revision_number INT DEFAULT 1,
  comments TEXT,
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_number VARCHAR(50) NOT NULL UNIQUE,
  requirement_id UUID NOT NULL REFERENCES sales_requirements(id),
  po_id UUID REFERENCES purchase_orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  target_quantity NUMERIC(12,2) NOT NULL,
  produced_quantity NUMERIC(12,2) DEFAULT 0,
  rejected_quantity NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Planned',
  sample_status VARCHAR(50) DEFAULT 'Pending',
  sample_notes TEXT,
  start_date DATE,
  end_date DATE,
  assigned_to UUID REFERENCES users(id),
  department_id UUID REFERENCES departments(id),
  remarks TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_material_consumptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES production_work_orders(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES inventory_batches(id),
  material_id UUID NOT NULL REFERENCES materials(id),
  quantity_consumed NUMERIC(12,2) NOT NULL,
  scrap_quantity NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sample_qc_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qc_number VARCHAR(50) NOT NULL UNIQUE,
  work_order_id UUID NOT NULL REFERENCES production_work_orders(id),
  sample_identifier VARCHAR(100) NOT NULL,
  inspector_id UUID NOT NULL REFERENCES users(id),
  inspection_date DATE NOT NULL,
  parameters JSONB DEFAULT '[]'::jsonb,
  result VARCHAR(50) NOT NULL, -- Passed / Failed
  defect_details TEXT,
  rework_instructions TEXT,
  remarks TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Packaging, Master Boxes & Part Instances
CREATE TABLE IF NOT EXISTS packaging_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  packaging_number VARCHAR(50) NOT NULL UNIQUE,
  work_order_id UUID NOT NULL REFERENCES production_work_orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  total_quantity NUMERIC(12,2) NOT NULL,
  packed_quantity NUMERIC(12,2) DEFAULT 0,
  rejected_quantity NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pending',
  component_verification BOOLEAN DEFAULT false,
  condition_verification BOOLEAN DEFAULT false,
  operator_id UUID REFERENCES users(id),
  inspected_at TIMESTAMPTZ,
  remarks TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  box_number VARCHAR(50) NOT NULL UNIQUE,
  packaging_order_id UUID NOT NULL REFERENCES packaging_orders(id),
  qr_code TEXT,
  qr_token VARCHAR(255) NOT NULL UNIQUE,
  capacity INT DEFAULT 20,
  packed_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Packed',
  weight_kg NUMERIC(8,2) DEFAULT 5.0,
  dimensions VARCHAR(50) DEFAULT '40x30x30 cm',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS part_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_number VARCHAR(50) NOT NULL UNIQUE,
  packaging_order_id UUID NOT NULL REFERENCES packaging_orders(id),
  box_id UUID REFERENCES master_boxes(id),
  work_order_id UUID NOT NULL REFERENCES production_work_orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qr_code TEXT,
  qr_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'Active',
  serial_number VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS box_part_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  box_id UUID NOT NULL REFERENCES master_boxes(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES part_instances(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES inventory_batches(id),
  mapped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_type VARCHAR(50) NOT NULL, -- PART, BOX, BATCH, SHIPMENT
  code_value VARCHAR(100) NOT NULL UNIQUE,
  token VARCHAR(255) NOT NULL UNIQUE,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  qr_image_data TEXT,
  scan_count INT DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Accounts Checklist & 3-Way Dispatch Clearance
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_number VARCHAR(50) NOT NULL UNIQUE,
  po_id UUID REFERENCES purchase_orders(id),
  shipment_id UUID,
  customer_id UUID REFERENCES customers(id),
  vendor_id UUID REFERENCES vendors(id),
  acknowledgement_method VARCHAR(100) DEFAULT 'Internal Verification',
  acknowledgement_status VARCHAR(50) DEFAULT 'Draft',
  acknowledgement_date DATE,
  acknowledgement_ref VARCHAR(100),
  documents JSONB DEFAULT '[]'::jsonb,
  commercial_invoice_number VARCHAR(100),
  tax_details JSONB DEFAULT '{}'::jsonb,
  remarks TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_number VARCHAR(50) NOT NULL UNIQUE,
  version INT DEFAULT 1,
  customer_id UUID NOT NULL REFERENCES customers(id),
  destination_address TEXT NOT NULL,
  total_boxes INT DEFAULT 0,
  total_parts INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pending Clearance',
  vehicle_number VARCHAR(50),
  lr_consignment_number VARCHAR(100),
  driver_name VARCHAR(150),
  driver_phone VARCHAR(50),
  dispatch_date DATE,
  gate_out_time TIMESTAMPTZ,
  receiving_party VARCHAR(150),
  remarks TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  box_id UUID NOT NULL REFERENCES master_boxes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatch_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  shipment_version INT NOT NULL DEFAULT 1,
  role VARCHAR(50) NOT NULL, -- Admin, Sales, Accounts
  approver_id UUID REFERENCES users(id),
  decision VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Invalidated
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Complaints & Investigations
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  complaint_date DATE NOT NULL,
  description TEXT NOT NULL,
  defect_category VARCHAR(100) NOT NULL,
  part_id UUID REFERENCES part_instances(id),
  box_id UUID REFERENCES master_boxes(id),
  scanned_part_code VARCHAR(100),
  scanned_box_code VARCHAR(100),
  claimed_vendor_batch VARCHAR(100),
  claimed_internal_batch VARCHAR(100),
  verification_status VARCHAR(50) DEFAULT 'Unverified',
  discrepancy_flags JSONB DEFAULT '[]'::jsonb,
  investigation_status VARCHAR(50) DEFAULT 'Open',
  resolution TEXT,
  replacement_details TEXT,
  capa_summary TEXT,
  closed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_investigations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  investigator_id UUID NOT NULL REFERENCES users(id),
  findings TEXT NOT NULL,
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  status VARCHAR(50) DEFAULT 'In Progress',
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Notifications & Audit Logs
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_iqc_internal_batch ON iqc_inspections(internal_batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_internal_batch ON inventory_batches(internal_batch_id);
CREATE INDEX IF NOT EXISTS idx_parts_part_number ON part_instances(part_number);
CREATE INDEX IF NOT EXISTS idx_boxes_box_number ON master_boxes(box_number);
CREATE INDEX IF NOT EXISTS idx_qr_code_value ON qr_codes(code_value);
CREATE INDEX IF NOT EXISTS idx_shipments_number ON shipments(shipment_number);
CREATE INDEX IF NOT EXISTS idx_dispatch_approvals ON dispatch_approvals(shipment_id, shipment_version);

