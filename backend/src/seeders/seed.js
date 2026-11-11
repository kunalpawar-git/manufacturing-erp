import bcrypt from 'bcryptjs';
import sequelize, { connectDatabase } from '../config/database.js';
import {
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
} from '../models/index.js';
import { generateBusinessId, generateSecureToken } from '../utils/idGenerator.js';
import { generateQrDataUrl, createSecureQrPayload } from '../utils/qrGenerator.js';
import { ROLES, PERMISSIONS, PO_STATUS, IQC_STATUS, INVENTORY_STATUS, REQUIREMENT_STATUS, WORK_ORDER_STATUS, QC_RESULT, PACKAGING_STATUS, CHECKLIST_STATUS, APPROVAL_DECISION, SHIPMENT_STATUS, COMPLAINT_STATUS } from '../constants/index.js';

export const seedDatabase = async (forceReset = true) => {
  console.log('[Seeder] Initializing database synchronization...');
  await connectDatabase();
  await sequelize.sync({ force: forceReset });
  console.log('[Seeder] Tables synchronized.');

  // 1. ROLES
  const roleNames = [
    { name: ROLES.SUPER_ADMIN, description: 'Complete system oversight and administrative authority', is_system: true },
    { name: ROLES.ADMIN, description: 'Operational supervisor, requirement approval, 3-way clearance', is_system: true },
    { name: ROLES.SALES, description: 'Sales requirement creation, progress tracking, dispatch approval', is_system: true },
    { name: ROLES.ACCOUNTS, description: 'Commercial checklists, tax verification, dispatch clearance', is_system: true },
    { name: ROLES.IQC_OPERATOR, description: 'Incoming material quality inspection & batch entry', is_system: false },
    { name: ROLES.PRODUCTION, description: 'Work order execution, sample prep, material consumption', is_system: false },
    { name: ROLES.QC_OPERATOR, description: 'Sample quality inspection and pass/fail logging', is_system: false },
    { name: ROLES.PACKAGING, description: 'Component verification, box mapping, QR code generation', is_system: false },
  ];
  const roles = await Role.bulkCreate(roleNames);
  const roleMap = {};
  roles.forEach((r) => { roleMap[r.name] = r.id; });

  // 2. DEPARTMENTS
  const departmentsData = [
    { code: 'DEP-HQ', name: 'Executive Management', description: 'Central Executive Command' },
    { code: 'DEP-PROD', name: 'Production & Assembly', description: 'Machining, Fabrication & Assembly' },
    { code: 'DEP-QA', name: 'Quality Assurance & QC', description: 'IQC and Finished Good Inspection' },
    { code: 'DEP-WH', name: 'Central Warehouse & Store', description: 'Raw materials, spares and finished storage' },
    { code: 'DEP-DISP', name: 'Outward Logistics & Dispatch', description: 'Packaging and carrier dispatch' },
    { code: 'DEP-SALES', name: 'Commercial Sales', description: 'Customer relations & order intake' },
    { code: 'DEP-ACC', name: 'Finance & Accounts', description: 'Commercial invoicing & tax audit' },
  ];
  const departments = await Department.bulkCreate(departmentsData);
  const deptMap = {};
  departments.forEach((d) => { deptMap[d.code] = d.id; });

  // 3. LOCATIONS
  const locationsData = [
    { code: 'LOC-RM-01', name: 'Raw Material Rack A', type: 'Warehouse' },
    { code: 'LOC-RM-02', name: 'Chemical & Paint Store', type: 'Specialized' },
    { code: 'LOC-BS-01', name: 'Basement Storage Bay 3', type: 'Basement' },
    { code: 'LOC-FG-01', name: 'Finished Goods Bay 1', type: 'Warehouse' },
    { code: 'LOC-DISP-01', name: 'Dispatch Marshalling Yard', type: 'Dispatch' },
  ];
  const locations = await Location.bulkCreate(locationsData);

  // 4. USERS (8 DEMO ACCOUNTS)
  const passwordHash = await bcrypt.hash('Demo@123', 10);
  const usersData = [
    {
      email: 'superadmin@demo.com',
      password: passwordHash,
      full_name: 'Rajesh Sharma (Super Admin)',
      role_id: roleMap[ROLES.SUPER_ADMIN],
      department_id: deptMap['DEP-HQ'],
      phone: '+91 98200 11223',
      operational_permissions: Object.values(PERMISSIONS),
    },
    {
      email: 'admin@demo.com',
      password: passwordHash,
      full_name: 'Vikram Mehta (Plant Head & Admin)',
      role_id: roleMap[ROLES.ADMIN],
      department_id: deptMap['DEP-HQ'],
      phone: '+91 98200 44556',
      operational_permissions: ['approve_requirement', 'dispatch_approval_admin', 'adjust_inventory', 'manage_users'],
    },
    {
      email: 'sales@demo.com',
      password: passwordHash,
      full_name: 'Ananya Desai (Sales Executive)',
      role_id: roleMap[ROLES.SALES],
      department_id: deptMap['DEP-SALES'],
      phone: '+91 98200 77889',
      operational_permissions: ['create_requirement', 'dispatch_approval_sales', 'view_reports'],
    },
    {
      email: 'accounts@demo.com',
      password: passwordHash,
      full_name: 'Rohan Gupta (Lead Accountant)',
      role_id: roleMap[ROLES.ACCOUNTS],
      department_id: deptMap['DEP-ACC'],
      phone: '+91 98200 33445',
      operational_permissions: ['prepare_checklist', 'acknowledge_checklist', 'dispatch_approval_accounts'],
    },
    {
      email: 'iqc@demo.com',
      password: passwordHash,
      full_name: 'Suresh Patil (IQC Incharge)',
      role_id: roleMap[ROLES.IQC_OPERATOR],
      department_id: deptMap['DEP-QA'],
      phone: '+91 98200 66778',
      operational_permissions: ['perform_iqc', 'approve_iqc'],
    },
    {
      email: 'production@demo.com',
      password: passwordHash,
      full_name: 'Deepak Verma (Shopfloor Supervisor)',
      role_id: roleMap[ROLES.PRODUCTION],
      department_id: deptMap['DEP-PROD'],
      phone: '+91 98200 99001',
      operational_permissions: ['manage_production', 'execute_production'],
    },
    {
      email: 'qc@demo.com',
      password: passwordHash,
      full_name: 'Pooja Iyer (Senior QC Inspector)',
      role_id: roleMap[ROLES.QC_OPERATOR],
      department_id: deptMap['DEP-QA'],
      phone: '+91 98200 12345',
      operational_permissions: ['perform_qc', 'approve_qc'],
    },
    {
      email: 'packaging@demo.com',
      password: passwordHash,
      full_name: 'Manoj Yadav (Packaging & Dispatch Operator)',
      role_id: roleMap[ROLES.PACKAGING],
      department_id: deptMap['DEP-DISP'],
      phone: '+91 98200 54321',
      operational_permissions: ['perform_packaging', 'approve_packaging', 'generate_qr'],
    },
  ];
  const users = await User.bulkCreate(usersData);
  const userMap = {};
  users.forEach((u) => { userMap[u.email] = u.id; });

  // 5. VENDORS (8 REALISTIC INDIAN VENDORS)
  const vendorsData = [
    { vendor_code: 'V-01', name: 'Tata Steel Alloys Ltd', contact_person: 'Amitabh Sengupta', email: 'sales@tatasteelalloys.in', phone: '+91 22 6665 8282', address: 'Plot 45, MIDC Industrial Area, Bhosari, Pune, Maharashtra 411026', gst_number: '27AAACT2727Q1ZB', rating: 4.8 },
    { vendor_code: 'V-02', name: 'Bharat Forge Precision Works', contact_person: 'Kailash Kadam', email: 'supplies@bharatforgeprec.com', phone: '+91 20 6704 2777', address: 'Mundhwa, Pune Cantonment, Pune, Maharashtra 411036', gst_number: '27AABCB1805F1Z2', rating: 4.7 },
    { vendor_code: 'V-03', name: 'Asian Paints Industrial Coatings', contact_person: 'Raghavan Pillai', email: 'orders@apcoatings.in', phone: '+91 22 3981 8000', address: '6A Shantinagar, Santacruz East, Mumbai, Maharashtra 400055', gst_number: '27AAACA4517F1ZL', rating: 4.9 },
    { vendor_code: 'V-04', name: 'Hindalco Extrusions & Metals', contact_person: 'Sunil Mathur', email: 'extrusions@hindalco.aditya.com', phone: '+91 22 6662 6666', address: 'Century Bhavan, Dr Annie Besant Rd, Worli, Mumbai 400030', gst_number: '27AAACH1234K1ZX', rating: 4.6 },
    { vendor_code: 'V-05', name: 'Sundram Fasteners & Bolts', contact_person: 'G. Balasubramanian', email: 'chennaisales@sundramfasteners.co.in', phone: '+91 44 2847 8500', address: '98-A Padi Industrial Area, Chennai, Tamil Nadu 600050', gst_number: '33AAACS1098M1ZF', rating: 4.8 },
    { vendor_code: 'V-06', name: 'Polycab High-Temp Polymers', contact_person: 'Nirav Patel', email: 'industrial@polycabpoly.com', phone: '+91 26 5233 1111', address: 'GIDC Industrial Estate, Halol, Gujarat 389350', gst_number: '24AAACP4999C1Z3', rating: 4.5 },
    { vendor_code: 'V-07', name: 'SKF Bearings India Ltd', contact_person: 'Devendra Joshi', email: 'sales@skfindia.org', phone: '+91 20 6611 2500', address: 'Chinchwad, Pune, Maharashtra 411033', gst_number: '27AAACS1814E1Z4', rating: 4.9 },
    { vendor_code: 'V-08', name: 'Supreme Rubber Gaskets & Seals', contact_person: 'Harpreet Singh', email: 'orders@supremerubber.in', phone: '+91 16 1251 1234', address: 'Phase VII, Focal Point, Ludhiana, Punjab 141010', gst_number: '03AAACS5512B1Z1', rating: 4.4 },
  ];
  const vendors = await Vendor.bulkCreate(vendorsData);

  // 6. CUSTOMERS (5 REALISTIC INDIAN ENTERPRISE CLIENTS)
  const customersData = [
    { customer_code: 'CUST-01', name: 'Mahindra & Mahindra Automotive Div', contact_person: 'Sandeep Rane', email: 'procurement@mahindra.co.in', phone: '+91 22 2490 1441', address: 'Akurli Road, Kandivali East, Mumbai, Maharashtra 400101', gst_number: '27AAACM1504K1ZV' },
    { customer_code: 'CUST-02', name: 'Larsen & Toubro Heavy Engineering', contact_person: 'Manish Trivedi', email: 'vendor.connect@lntheavy.com', phone: '+91 22 6752 5656', address: 'Powai Campus, Saki Vihar Road, Mumbai, Maharashtra 400072', gst_number: '27AAACL0149C1Z6' },
    { customer_code: 'CUST-03', name: 'Godrej Aerospace & Precision Systems', contact_person: 'Kavita Nair', email: 'aerospace.orders@godrej.com', phone: '+91 22 6796 5656', address: 'Pirojshanagar, Vikhroli, Mumbai, Maharashtra 400079', gst_number: '27AAACG0561D1ZK' },
    { customer_code: 'CUST-04', name: 'BHEL Power Equipment Plant', contact_person: 'Raj Kumar Meena', email: 'procure@bhelbhopal.in', phone: '+91 75 5250 0100', address: 'Piplani, Bhopal, Madhya Pradesh 462022', gst_number: '23AAACB2417G1ZI' },
    { customer_code: 'CUST-05', name: 'Thermax Clean Energy Systems', contact_person: 'Prasad Kulkarni', email: 'purchase@thermaxglobal.com', phone: '+91 20 6605 1200', address: 'D-13 MIDC Industrial Area, Chinchwad, Pune 411019', gst_number: '27AAACT1497F1ZX' },
  ];
  const customers = await Customer.bulkCreate(customersData);

  // 7. PRODUCT CATEGORIES (5)
  const categoriesData = [
    { code: 'CAT-STL', name: 'Special Alloy Steels', description: 'Raw high tensile and forged alloy steels' },
    { code: 'CAT-COAT', name: 'Industrial Paints & Primers', description: 'Polyurethane and epoxy protective surface finishes' },
    { code: 'CAT-FAST', name: 'High-Tensile Fasteners', description: 'Grade 8.8 and 10.9 industrial bolts, nuts, and washers' },
    { code: 'CAT-HYD', name: 'Hydraulic Flanges & Valves', description: 'Finished pressure assemblies and flow regulators' },
    { code: 'CAT-ELM', name: 'Precision Actuators', description: 'Assembled electromechanical actuator units' },
  ];
  const categories = await ProductCategory.bulkCreate(categoriesData);

  // 8. MATERIALS (20 RAW MATERIALS)
  const materialsData = [
    { material_code: 'MAT-STL-01', name: 'AISI 4140 Chrome-Moly Round Bar 50mm', category_id: categories[0].id, unit: 'kg', reorder_level: 200, standard_cost: 145 },
    { material_code: 'MAT-STL-02', name: 'SS 316L Stainless Steel Plate 12mm', category_id: categories[0].id, unit: 'kg', reorder_level: 150, standard_cost: 320 },
    { material_code: 'MAT-STL-03', name: 'EN8 Carbon Steel Forging Blanks', category_id: categories[0].id, unit: 'pcs', reorder_level: 100, standard_cost: 85 },
    { material_code: 'MAT-STL-04', name: 'Structural Mild Steel Hollow Section', category_id: categories[0].id, unit: 'meters', reorder_level: 80, standard_cost: 210 },
    { material_code: 'MAT-PNT-01', name: 'Epoxy Anti-Corrosive Zinc Primer Grey', category_id: categories[1].id, unit: 'liters', reorder_level: 60, standard_cost: 450 },
    { material_code: 'MAT-PNT-02', name: 'Polyurethane Gloss Topcoat Navy Blue', category_id: categories[1].id, unit: 'liters', reorder_level: 50, standard_cost: 680 },
    { material_code: 'MAT-PNT-03', name: 'Heat Resistant Matte Black Enamel', category_id: categories[1].id, unit: 'liters', reorder_level: 40, standard_cost: 590 },
    { material_code: 'MAT-PNT-04', name: 'Industrial PU Thinner Grade T-200', category_id: categories[1].id, unit: 'liters', reorder_level: 100, standard_cost: 160 },
    { material_code: 'MAT-FST-01', name: 'M12 x 50mm Hex Head Bolt Grade 10.9', category_id: categories[2].id, unit: 'pcs', reorder_level: 500, standard_cost: 18 },
    { material_code: 'MAT-FST-02', name: 'M12 Nyloc Locking Nut Zinc Plated', category_id: categories[2].id, unit: 'pcs', reorder_level: 500, standard_cost: 8 },
    { material_code: 'MAT-FST-03', name: 'Hardened Spring Washer M12', category_id: categories[2].id, unit: 'pcs', reorder_level: 1000, standard_cost: 3 },
    { material_code: 'MAT-FST-04', name: 'M8 x 30mm Socket Head Cap Screw', category_id: categories[2].id, unit: 'pcs', reorder_level: 400, standard_cost: 12 },
    { material_code: 'MAT-SEAL-01', name: 'Viton High-Temperature O-Ring 45mm', category_id: categories[3].id, unit: 'pcs', reorder_level: 250, standard_cost: 45 },
    { material_code: 'MAT-SEAL-02', name: 'Spiral Wound SS316 Graphite Gasket', category_id: categories[3].id, unit: 'pcs', reorder_level: 150, standard_cost: 120 },
    { material_code: 'MAT-BRG-01', name: 'SKF Deep Groove Ball Bearing 6205-2RS', category_id: categories[3].id, unit: 'pcs', reorder_level: 60, standard_cost: 380 },
    { material_code: 'MAT-BRG-02', name: 'Needle Roller Bearing 25x32x16mm', category_id: categories[3].id, unit: 'pcs', reorder_level: 80, standard_cost: 290 },
    { material_code: 'MAT-ELEC-01', name: 'Copper Enamelled Winding Wire 1.2mm', category_id: categories[4].id, unit: 'kg', reorder_level: 50, standard_cost: 850 },
    { material_code: 'MAT-ELEC-02', name: 'Miniature Limit Switch 250V 5A', category_id: categories[4].id, unit: 'pcs', reorder_level: 100, standard_cost: 95 },
    { material_code: 'MAT-PKG-01', name: 'Heavy Duty 5-Ply Corrugated Master Box', category_id: categories[4].id, unit: 'pcs', reorder_level: 300, standard_cost: 75 },
    { material_code: 'MAT-PKG-02', name: 'Anti-Static VCI Bubble Roll 100m', category_id: categories[4].id, unit: 'rolls', reorder_level: 20, standard_cost: 1400 },
  ];
  const materials = await Material.bulkCreate(materialsData);

  // 9. FINISHED PRODUCTS (15 PRODUCTS WITH BOM)
  const productsData = [
    { product_code: 'PRD-FLG-01', name: 'High-Pressure Hydraulic Flange 2-Inch', category_id: categories[3].id, bom_type: 'Machined Assembly', unit: 'pcs', price: 4200 },
    { product_code: 'PRD-FLG-02', name: 'Stainless Cryogenic Flange 4-Inch', category_id: categories[3].id, bom_type: 'Precision Forged', unit: 'pcs', price: 8500 },
    { product_code: 'PRD-VLV-01', name: 'Bi-Directional High Pressure Check Valve', category_id: categories[3].id, bom_type: 'Valve Assembly', unit: 'pcs', price: 6300 },
    { product_code: 'PRD-VLV-02', name: 'Throttle Control Pressure Regulator', category_id: categories[3].id, bom_type: 'Flow Regulator', unit: 'pcs', price: 9200 },
    { product_code: 'PRD-ACT-01', name: 'Servo Linear Actuator Heavy Duty 24V', category_id: categories[4].id, bom_type: 'Electromechanical', unit: 'pcs', price: 18500 },
    { product_code: 'PRD-ACT-02', name: 'Rotary Positioner Actuator IP67', category_id: categories[4].id, bom_type: 'Electromechanical', unit: 'pcs', price: 22000 },
    { product_code: 'PRD-CYL-01', name: 'Double Acting Hydraulic Cylinder 100mm', category_id: categories[3].id, bom_type: 'Cylinder Assembly', unit: 'pcs', price: 14000 },
    { product_code: 'PRD-CYL-02', name: 'Telescopic Multi-Stage Ram Unit', category_id: categories[3].id, bom_type: 'Cylinder Assembly', unit: 'pcs', price: 28000 },
    { product_code: 'PRD-MNT-01', name: 'Vibration Isolator Engine Damper Mount', category_id: categories[0].id, bom_type: 'Cast & Molded', unit: 'pcs', price: 3100 },
    { product_code: 'PRD-MNT-02', name: 'Heavy Duty Structural Bracket 90-Deg', category_id: categories[0].id, bom_type: 'Fabricated Steel', unit: 'pcs', price: 2400 },
    { product_code: 'PRD-PMP-01', name: 'High-Torque Gear Pump Housing Assembly', category_id: categories[3].id, bom_type: 'Machined Cast', unit: 'pcs', price: 12500 },
    { product_code: 'PRD-PMP-02', name: 'Variable Displacement Piston Pump Head', category_id: categories[3].id, bom_type: 'Precision Cast', unit: 'pcs', price: 34000 },
    { product_code: 'PRD-MNF-01', name: 'Hydraulic Manifold Block 6-Port', category_id: categories[3].id, bom_type: 'CNC Machined Block', unit: 'pcs', price: 16500 },
    { product_code: 'PRD-CPG-01', name: 'Flexible High-Torque Shaft Coupling', category_id: categories[0].id, bom_type: 'Mechanical Drive', unit: 'pcs', price: 5800 },
    { product_code: 'PRD-ENC-01', name: 'IP68 Weatherproof Instrument Enclosure', category_id: categories[4].id, bom_type: 'Coated Sheetmetal', unit: 'pcs', price: 4700 },
  ];
  const products = await Product.bulkCreate(productsData);

  // Link BOM items for primary product
  const primaryProduct = products[0]; // PRD-FLG-01
  await BomItem.bulkCreate([
    { product_id: primaryProduct.id, material_id: materials[0].id, quantity_required: 4.5, unit: 'kg', notes: '4140 Round Bar for flange body' },
    { product_id: primaryProduct.id, material_id: materials[4].id, quantity_required: 0.15, unit: 'liters', notes: 'Epoxy primer coat' },
    { product_id: primaryProduct.id, material_id: materials[5].id, quantity_required: 0.2, unit: 'liters', notes: 'Navy Blue PU finish coat' },
    { product_id: primaryProduct.id, material_id: materials[8].id, quantity_required: 8, unit: 'pcs', notes: 'M12 Grade 10.9 Bolts' },
    { product_id: primaryProduct.id, material_id: materials[12].id, quantity_required: 1, unit: 'pcs', notes: 'Viton O-Ring 45mm' },
  ]);

  // 10. PURCHASE ORDERS (15 REALISTIC POs)
  const poStatuses = [
    PO_STATUS.FULLY_RECEIVED, PO_STATUS.FULLY_RECEIVED, PO_STATUS.FULLY_RECEIVED,
    PO_STATUS.PARTIALLY_RECEIVED, PO_STATUS.SUBMITTED, PO_STATUS.SUBMITTED,
    PO_STATUS.DRAFT, PO_STATUS.FULLY_RECEIVED, PO_STATUS.FULLY_RECEIVED,
    PO_STATUS.PARTIALLY_RECEIVED, PO_STATUS.SUBMITTED, PO_STATUS.CLOSED,
    PO_STATUS.FULLY_RECEIVED, PO_STATUS.FULLY_RECEIVED, PO_STATUS.FULLY_RECEIVED,
  ];

  const pos = [];
  for (let i = 0; i < 15; i++) {
    const poNum = generateBusinessId('PO', i + 1);
    const vendor = vendors[i % vendors.length];
    const po = await PurchaseOrder.create({
      po_number: poNum,
      po_direction: i % 4 === 0 ? 'Outbound Customer SO' : 'Inbound Supplier PO',
      vendor_id: vendor.id,
      customer_id: i % 4 === 0 ? customers[i % customers.length].id : null,
      order_date: `2026-10-${String((i % 20) + 1).padStart(2, '0')}`,
      expected_delivery_date: `2026-11-${String((i % 20) + 10).padStart(2, '0')}`,
      status: poStatuses[i],
      total_amount: (i + 1) * 75000 + 45000,
      currency: 'INR',
      notes: `Standard PO covering industrial supply terms. Inspection required at destination.`,
      created_by: userMap['admin@demo.com'],
    });

    // Create 2 items per PO
    const matA = materials[(i * 2) % materials.length];
    const matB = materials[(i * 2 + 1) % materials.length];
    await PurchaseOrderItem.bulkCreate([
      {
        po_id: po.id,
        material_id: matA.id,
        ordered_quantity: 100 + i * 10,
        received_quantity: po.status === PO_STATUS.FULLY_RECEIVED ? (100 + i * 10) : (po.status === PO_STATUS.PARTIALLY_RECEIVED ? 50 : 0),
        unit_price: matA.standard_cost,
        total_price: (100 + i * 10) * matA.standard_cost,
      },
      {
        po_id: po.id,
        material_id: matB.id,
        ordered_quantity: 50 + i * 5,
        received_quantity: po.status === PO_STATUS.FULLY_RECEIVED ? (50 + i * 5) : 0,
        unit_price: matB.standard_cost,
        total_price: (50 + i * 5) * matB.standard_cost,
      },
    ]);
    pos.push(po);
  }

  // 11. MATERIAL RECEIPTS (30 RECORDS)
  const receipts = [];
  for (let i = 0; i < 30; i++) {
    const po = pos[i % pos.length];
    const poItems = await PurchaseOrderItem.findAll({ where: { po_id: po.id } });
    const poItem = poItems[i % poItems.length] || poItems[0];
    const mrNum = generateBusinessId('MR', i + 1);

    const receipt = await MaterialReceipt.create({
      receipt_number: mrNum,
      po_id: po.id,
      po_item_id: poItem ? poItem.id : null,
      vendor_id: po.vendor_id || vendors[0].id,
      material_id: poItem ? poItem.material_id : materials[0].id,
      received_quantity: 100,
      receipt_date: `2026-10-${String((i % 25) + 1).padStart(2, '0')}`,
      carrier_info: `VRL Logistics Truck MH-14-GH-${1000 + i}`,
      challan_number: `DC-VEND-99${100 + i}`,
      invoice_number: `INV-2026-${4000 + i}`,
      created_by: userMap['admin@demo.com'],
    });
    receipts.push(receipt);
  }

  // 12. IQC INSPECTIONS (40 RECORDS) & INVENTORY BATCHES (30 RECORDS) & TRANSACTIONS (100)
  const iqcDivisionsList = ['Paint', 'Assembly', 'Store', 'Basement'];
  const createdBatches = [];

  for (let i = 0; i < 40; i++) {
    const receipt = receipts[i % receipts.length];
    const division = iqcDivisionsList[i % 4];
    const iqcNum = generateBusinessId('IQC', i + 1);
    const internalBatchId = generateBusinessId('B', i + 1);
    const vendorBatchNum = `VB-TATA-2026-${8800 + i}`;

    // Scenarios: mostly accepted, some rejected, some quarantined, some pending
    let status = IQC_STATUS.ACCEPTED;
    let accQty = 100;
    let rejQty = 0;
    let quarQty = 0;

    if (i === 3) {
      status = IQC_STATUS.REJECTED;
      accQty = 0;
      rejQty = 100;
    } else if (i === 7) {
      status = IQC_STATUS.QUARANTINED;
      accQty = 0;
      quarQty = 100;
    } else if (i >= 35) {
      status = IQC_STATUS.PENDING;
      accQty = 0;
    }

    const inspection = await IqcInspection.create({
      inspection_number: iqcNum,
      receipt_id: receipt.id,
      division,
      vendor_id: receipt.vendor_id,
      material_id: receipt.material_id,
      vendor_batch_number: vendorBatchNum, // EXACT PRESERVATION
      internal_batch_id: internalBatchId,   // SYSTEM UNIQUE
      received_quantity: 100,
      accepted_quantity: accQty,
      rejected_quantity: rejQty,
      quarantined_quantity: quarQty,
      status,
      inspector_id: userMap['iqc@demo.com'],
      inspection_date: `2026-10-${String((i % 25) + 3).padStart(2, '0')}`,
      checklist_data: {
        visual_check: status === IQC_STATUS.REJECTED ? 'Failed: excessive oxidation' : 'Passed',
        dimensional_accuracy: 'Passed tolerance +/- 0.05mm',
        material_test_certificate: 'Verified against heat number',
      },
      remarks: status === IQC_STATUS.REJECTED ? 'Material failed surface hardness specifications. Returned to quarantine.' : 'Quality verified and passed.',
      created_by: userMap['iqc@demo.com'],
    });

    if (i < 30) {
      // Create batch
      const batch = await InventoryBatch.create({
        internal_batch_id: internalBatchId,
        vendor_batch_number: vendorBatchNum,
        vendor_id: receipt.vendor_id,
        material_id: receipt.material_id,
        iqc_id: inspection.id,
        division,
        initial_quantity: accQty,
        current_quantity: accQty,
        reserved_quantity: 0,
        rejected_quantity: rejQty,
        quarantined_quantity: quarQty,
        consumed_quantity: 0,
        status: accQty > 0 ? INVENTORY_STATUS.AVAILABLE : (rejQty > 0 ? INVENTORY_STATUS.REJECTED : INVENTORY_STATUS.QUARANTINED),
        location_id: locations[i % locations.length].id,
        receipt_date: inspection.inspection_date,
      });
      createdBatches.push(batch);

      // Ledger Transaction
      await InventoryTransaction.create({
        transaction_number: generateBusinessId('TXN', i + 1),
        batch_id: batch.id,
        material_id: batch.material_id,
        transaction_type: 'RECEIPT',
        quantity: accQty,
        previous_quantity: 0,
        new_quantity: accQty,
        reference_type: 'IQC',
        reference_id: iqcNum,
        remarks: `Initial IQC intake for batch ${internalBatchId}`,
        created_by: userMap['iqc@demo.com'],
      });
    }
  }

  // Add more ledger transactions to reach 100
  for (let k = 31; k <= 100; k++) {
    const b = createdBatches[k % createdBatches.length];
    await InventoryTransaction.create({
      transaction_number: generateBusinessId('TXN', k),
      batch_id: b.id,
      material_id: b.material_id,
      transaction_type: k % 5 === 0 ? 'ADJUSTMENT' : 'CONSUMPTION',
      quantity: 5,
      previous_quantity: b.current_quantity,
      new_quantity: b.current_quantity,
      reference_type: 'SHOPFLOOR_AUDIT',
      reference_id: `AUDIT-REF-${k}`,
      remarks: `Periodic verification cycle ${k}`,
      created_by: userMap['admin@demo.com'],
    });
  }

  // 13. SALES REQUIREMENTS (20 RECORDS)
  const salesRequirements = [];
  for (let i = 0; i < 20; i++) {
    const cust = customers[i % customers.length];
    const prd = products[i % products.length];
    const reqNum = generateBusinessId('REQ', i + 1);

    let status = REQUIREMENT_STATUS.APPROVED;
    let rejReason = null;
    if (i === 1) {
      status = REQUIREMENT_STATUS.REJECTED;
      rejReason = 'Customer delivery timeline is infeasible given current machining queue capacity.';
    } else if (i === 4 || i === 8) {
      status = REQUIREMENT_STATUS.SUBMITTED;
    }

    const req = await SalesRequirement.create({
      requirement_number: reqNum,
      customer_id: cust.id,
      po_id: pos[i % pos.length].id,
      product_id: prd.id,
      required_quantity: 40 + i * 5,
      required_delivery_date: `2026-11-${String((i % 20) + 10).padStart(2, '0')}`,
      priority: i % 3 === 0 ? 'High' : 'Medium',
      status,
      description: `Precision manufacturing requirement for ${prd.name}. Client drawing rev 3.2.`,
      revision_number: i === 1 ? 2 : 1,
      rejection_reason: rejReason,
      created_by: userMap['sales@demo.com'],
    });

    if (status === REQUIREMENT_STATUS.APPROVED) {
      await RequirementApproval.create({
        requirement_id: req.id,
        reviewer_id: userMap['admin@demo.com'],
        decision: 'Approved',
        revision_number: 1,
        comments: 'Technical specs & BOM availability reviewed and approved.',
        decided_at: new Date(),
      });
    } else if (status === REQUIREMENT_STATUS.REJECTED) {
      await RequirementApproval.create({
        requirement_id: req.id,
        reviewer_id: userMap['admin@demo.com'],
        decision: 'Rejected',
        revision_number: 1,
        comments: rejReason,
        decided_at: new Date(),
      });
    }
    salesRequirements.push(req);
  }

  // 14. PRODUCTION WORK ORDERS (15) & SAMPLE QC (15) & PACKAGING (15)
  const workOrders = [];
  const packagingOrders = [];
  const allMasterBoxes = [];
  const allParts = [];

  for (let i = 0; i < 15; i++) {
    const req = salesRequirements[i];
    const woNum = generateBusinessId('WO', i + 1);
    const prd = products[i % products.length];

    // Status variations
    let woStatus = WORK_ORDER_STATUS.COMPLETED;
    let sampleStatus = 'QC Passed';
    let qcResult = QC_RESULT.PASSED;

    if (i === 2) {
      woStatus = WORK_ORDER_STATUS.SAMPLE_QC_FAILED;
      sampleStatus = 'QC Failed';
      qcResult = QC_RESULT.FAILED;
    } else if (i === 5) {
      woStatus = WORK_ORDER_STATUS.IN_PRODUCTION;
      sampleStatus = 'QC Passed';
    } else if (i === 9) {
      woStatus = WORK_ORDER_STATUS.SAMPLE_PREPARATION;
      sampleStatus = 'Prepared';
      qcResult = QC_RESULT.PENDING;
    }

    const wo = await ProductionWorkOrder.create({
      work_order_number: woNum,
      requirement_id: req.id,
      po_id: req.po_id,
      product_id: prd.id,
      target_quantity: 40,
      produced_quantity: woStatus === WORK_ORDER_STATUS.COMPLETED ? 40 : 0,
      rejected_quantity: 0,
      status: woStatus,
      sample_status: sampleStatus,
      start_date: `2026-10-${String((i % 15) + 5).padStart(2, '0')}`,
      end_date: woStatus === WORK_ORDER_STATUS.COMPLETED ? `2026-10-${String((i % 15) + 12).padStart(2, '0')}` : null,
      assigned_to: userMap['production@demo.com'],
      department_id: deptMap['DEP-PROD'],
      remarks: `Work Order processed on CNC Cell 4.`,
      created_by: userMap['admin@demo.com'],
    });
    workOrders.push(wo);

    // Record source batch consumption
    const sourceBatch = createdBatches[i % createdBatches.length];
    await ProductionMaterialConsumption.create({
      work_order_id: wo.id,
      batch_id: sourceBatch.id,
      material_id: sourceBatch.material_id,
      quantity_consumed: 35,
      scrap_quantity: 2,
      notes: `Batch ${sourceBatch.internal_batch_id} allocated for work order ${woNum}`,
    });

    // Sample QC Record
    const qcNum = generateBusinessId('QC', i + 1);
    await SampleQcRecord.create({
      qc_number: qcNum,
      work_order_id: wo.id,
      sample_identifier: `SMP-${woNum}`,
      inspector_id: userMap['qc@demo.com'],
      inspection_date: `2026-10-${String((i % 15) + 7).padStart(2, '0')}`,
      parameters: [
        { name: 'CMM Dimensional Verification', status: qcResult === QC_RESULT.PASSED ? 'Pass' : 'Fail' },
        { name: 'Surface Roughness Ra < 0.8', status: 'Pass' },
        { name: 'Hardness Rockwell C 42-45', status: 'Pass' },
      ],
      result: qcResult,
      defect_details: qcResult === QC_RESULT.FAILED ? 'Critical internal bore dimension exceeded tolerance by +0.12mm' : '',
      rework_instructions: qcResult === QC_RESULT.FAILED ? 'Re-machine second sample on lathe after tool offset compensation.' : '',
      remarks: 'Sample inspected thoroughly according to ISO 9001 quality criteria.',
      approved_by: userMap['qc@demo.com'],
      approved_at: new Date(),
    });

    // Packaging Order
    const pkgNum = generateBusinessId('PKG', i + 1);
    let pkgStatus = PACKAGING_STATUS.APPROVED;
    if (i === 6) pkgStatus = PACKAGING_STATUS.PENDING;

    const pkgOrder = await PackagingOrder.create({
      packaging_number: pkgNum,
      work_order_id: wo.id,
      product_id: prd.id,
      total_quantity: 40,
      packed_quantity: pkgStatus === PACKAGING_STATUS.APPROVED ? 40 : 0,
      rejected_quantity: 0,
      status: pkgStatus,
      component_verification: pkgStatus === PACKAGING_STATUS.APPROVED,
      condition_verification: pkgStatus === PACKAGING_STATUS.APPROVED,
      operator_id: userMap['packaging@demo.com'],
      inspected_at: pkgStatus === PACKAGING_STATUS.APPROVED ? new Date() : null,
      remarks: 'Components counted and visually verified free of burrs and scratches.',
      approved_by: pkgStatus === PACKAGING_STATUS.APPROVED ? userMap['packaging@demo.com'] : null,
      approved_at: pkgStatus === PACKAGING_STATUS.APPROVED ? new Date() : null,
      created_by: userMap['packaging@demo.com'],
    });
    packagingOrders.push(pkgOrder);

    // If packaging is approved, generate Master Boxes and Part Instances with QR Codes
    if (pkgStatus === PACKAGING_STATUS.APPROVED && allMasterBoxes.length < 20) {
      // Create 2 boxes per order (20 parts per box)
      for (let b = 0; b < 2; b++) {
        if (allMasterBoxes.length >= 20) break;
        const boxIndex = allMasterBoxes.length + 1;
        const boxNumber = generateBusinessId('BX', boxIndex);
        const boxToken = generateSecureToken('box', boxNumber);
        const boxQrPayload = createSecureQrPayload('box', boxNumber, boxToken);
        const boxQrData = await generateQrDataUrl(boxQrPayload);

        const box = await MasterBox.create({
          box_number: boxNumber,
          packaging_order_id: pkgOrder.id,
          qr_code: boxQrData,
          qr_token: boxToken,
          capacity: 20,
          packed_count: 20,
          status: 'Packed',
          created_by: userMap['packaging@demo.com'],
        });

        await QrCode.create({
          code_type: 'BOX',
          code_value: boxNumber,
          token: boxToken,
          entity_type: 'MasterBox',
          entity_id: box.id,
          qr_image_data: boxQrData,
        });

        allMasterBoxes.push(box);

        // Generate 10 parts per box up to 100 parts total
        for (let p = 0; p < 10; p++) {
          if (allParts.length >= 100) break;
          const partIndex = allParts.length + 1;
          const partNumber = generateBusinessId('PT', partIndex);
          const partToken = generateSecureToken('part', partNumber);
          const partQrPayload = createSecureQrPayload('part', partNumber, partToken);
          const partQrData = await generateQrDataUrl(partQrPayload);

          const part = await PartInstance.create({
            part_number: partNumber,
            packaging_order_id: pkgOrder.id,
            box_id: box.id,
            work_order_id: wo.id,
            product_id: prd.id,
            qr_code: partQrData,
            qr_token: partToken,
            status: 'Active',
            serial_number: `SN-${Date.now().toString().slice(-6)}-${partIndex}`,
            created_by: userMap['packaging@demo.com'],
          });

          await QrCode.create({
            code_type: 'PART',
            code_value: partNumber,
            token: partToken,
            entity_type: 'PartInstance',
            entity_id: part.id,
            qr_image_data: partQrData,
          });

          await BoxPartMapping.create({
            box_id: box.id,
            part_id: part.id,
            batch_id: sourceBatch.id,
          });

          allParts.push(part);
        }
      }
    }
  }

  // 15. CHECKLISTS (10) & SHIPMENTS (10) & 3-WAY CLEARANCE APPROVALS (15+)
  const shipments = [];
  for (let i = 0; i < 10; i++) {
    const cust = customers[i % customers.length];
    const shNum = generateBusinessId('SH', i + 1);

    // Box assignment (2 boxes per shipment)
    const boxSlice = allMasterBoxes.slice(i * 2, i * 2 + 2);

    let shipStatus = SHIPMENT_STATUS.PENDING_CLEARANCE;
    if (i === 0) shipStatus = SHIPMENT_STATUS.DISPATCHED; // One successfully dispatched
    else if (i === 1) shipStatus = SHIPMENT_STATUS.APPROVED;   // One with all 3 approved ready to dispatch
    else if (i === 2) shipStatus = SHIPMENT_STATUS.PENDING_CLEARANCE; // One pending approval
    else if (i === 3) shipStatus = 'On Hold (Rejected)'; // One rejected

    const shipment = await Shipment.create({
      shipment_number: shNum,
      version: 1,
      customer_id: cust.id,
      destination_address: `${cust.address} (Unloading Bay 2)`,
      total_boxes: boxSlice.length,
      total_parts: boxSlice.length * 20,
      status: shipStatus === 'On Hold (Rejected)' ? SHIPMENT_STATUS.PENDING_CLEARANCE : shipStatus,
      vehicle_number: `MH-12-PQ-${7700 + i}`,
      lr_consignment_number: `LR-TCI-2026-${9100 + i}`,
      driver_name: 'Santosh Sawant',
      driver_phone: '+91 94220 55112',
      dispatch_date: shipStatus === SHIPMENT_STATUS.DISPATCHED ? '2026-11-05' : null,
      gate_out_time: shipStatus === SHIPMENT_STATUS.DISPATCHED ? new Date() : null,
      receiving_party: cust.contact_person,
      remarks: 'Transported with shock-resistant pallets and GPS tracking enabled.',
      created_by: userMap['admin@demo.com'],
    });

    // Associate boxes
    for (const b of boxSlice) {
      await ShipmentBox.create({ shipment_id: shipment.id, box_id: b.id });
      if (shipStatus === SHIPMENT_STATUS.DISPATCHED) {
        b.status = 'Dispatched';
        await b.save();
        await PartInstance.update({ status: 'Dispatched' }, { where: { box_id: b.id } });
      }
    }

    // Create 3-Way Approvals (Admin, Sales, Accounts)
    const adminDecision = (i === 0 || i === 1) ? APPROVAL_DECISION.APPROVED : (i === 3 ? APPROVAL_DECISION.REJECTED : APPROVAL_DECISION.PENDING);
    const salesDecision = (i === 0 || i === 1) ? APPROVAL_DECISION.APPROVED : APPROVAL_DECISION.PENDING;
    const accountsDecision = (i === 0 || i === 1) ? APPROVAL_DECISION.APPROVED : APPROVAL_DECISION.PENDING;

    await DispatchApproval.create({
      shipment_id: shipment.id,
      shipment_version: 1,
      role: 'Admin',
      approver_id: userMap['admin@demo.com'],
      decision: adminDecision,
      comments: adminDecision === APPROVAL_DECISION.REJECTED ? 'Physical dispatch hold: Customer payment overdue on previous order.' : 'Physical and operational clearance verified.',
      decided_at: adminDecision !== APPROVAL_DECISION.PENDING ? new Date() : null,
    });

    await DispatchApproval.create({
      shipment_id: shipment.id,
      shipment_version: 1,
      role: 'Sales',
      approver_id: userMap['sales@demo.com'],
      decision: salesDecision,
      comments: salesDecision === APPROVAL_DECISION.APPROVED ? 'Commercial delivery schedule and customer delivery slot confirmed.' : 'Awaiting confirmation of delivery slot.',
      decided_at: salesDecision !== APPROVAL_DECISION.PENDING ? new Date() : null,
    });

    await DispatchApproval.create({
      shipment_id: shipment.id,
      shipment_version: 1,
      role: 'Accounts',
      approver_id: userMap['accounts@demo.com'],
      decision: accountsDecision,
      comments: accountsDecision === APPROVAL_DECISION.APPROVED ? 'Tax invoice and E-way bill generated. Commercial documents cleared.' : 'Pending tax invoice generation.',
      decided_at: accountsDecision !== APPROVAL_DECISION.PENDING ? new Date() : null,
    });

    // Accounts Checklist (10)
    const ckNum = generateBusinessId('CK', i + 1);
    await Checklist.create({
      checklist_number: ckNum,
      shipment_id: shipment.id,
      customer_id: cust.id,
      acknowledgement_method: i % 2 === 0 ? 'Document Upload' : 'Customer Portal',
      acknowledgement_status: (i === 0 || i === 1) ? CHECKLIST_STATUS.CLEARED : CHECKLIST_STATUS.SENT,
      acknowledgement_date: '2026-11-04',
      acknowledgement_ref: `ACK-PORTAL-${8000 + i}`,
      commercial_invoice_number: `TAX-INV-2026-${5500 + i}`,
      remarks: 'Commercial terms verified against purchase contract.',
      created_by: userMap['accounts@demo.com'],
    });

    shipments.push(shipment);
  }

  // 16. COMPLAINTS (5 RECORDS - INCLUDING AUTHENTIC & MISMATCH CASES)
  const complaintsData = [
    {
      customer_id: customers[0].id,
      description: 'Customer reported minor oil seep on high-pressure flange joint after 50 operating hours.',
      defect_category: 'Surface Finish / Paint Flaw',
      scanned_part_code: allParts[0] ? allParts[0].part_number : 'PT-0001',
      scanned_box_code: allMasterBoxes[0] ? allMasterBoxes[0].box_number : 'BX-0001',
      claimed_internal_batch: createdBatches[0] ? createdBatches[0].internal_batch_id : 'B-2026-0001',
      claimed_vendor_batch: createdBatches[0] ? createdBatches[0].vendor_batch_number : 'VB-TATA-2026-8800',
      verification_status: 'Verified Authentic',
      discrepancy_flags: [],
      investigation_status: COMPLAINT_STATUS.RESOLVED,
      resolution: 'Replaced Viton seal ring and recalibrated flange face parallelism. Part authenticated successfully.',
      replacement_details: 'Replacement kit sent via priority courier Ref #EXP-9921',
      capa_summary: 'CAPA #401: Installed dual-probe surface dial gauge at finish CNC station.',
    },
    {
      // MISMATCH SCENARIO!
      customer_id: customers[1].id,
      description: 'Client claim: Bracket cracked under standard static test. Claimed batch B-2026-0001.',
      defect_category: 'Material Brittleness / Failure',
      scanned_part_code: allParts[1] ? allParts[1].part_number : 'PT-0002',
      scanned_box_code: 'BX-9999', // NON-EXISTENT BOX MISMATCH
      claimed_internal_batch: 'B-2026-9999', // MISMATCH
      claimed_vendor_batch: 'VB-FAKE-999', // MISMATCH
      verification_status: 'Mismatch Detected',
      discrepancy_flags: [
        "Master Box code 'BX-9999' was NOT found in ERP records.",
        "Claimed Internal Batch 'B-2026-9999' does NOT match actual production batch.",
        "Claimed Vendor Batch 'VB-FAKE-999' does NOT match supplier record.",
      ],
      investigation_status: COMPLAINT_STATUS.INVESTIGATING,
      resolution: '',
      replacement_details: '',
      capa_summary: 'Fraud / counterfeit mitigation audit initiated. Custody chain records requested from customer site.',
    },
    {
      customer_id: customers[2].id,
      description: 'O-ring groove depth variance of +0.08mm observed during incoming QA check.',
      defect_category: 'Dimensional Inaccuracy',
      scanned_part_code: allParts[2] ? allParts[2].part_number : 'PT-0003',
      scanned_box_code: allMasterBoxes[0] ? allMasterBoxes[0].box_number : 'BX-0001',
      claimed_internal_batch: createdBatches[0] ? createdBatches[0].internal_batch_id : 'B-2026-0001',
      claimed_vendor_batch: createdBatches[0] ? createdBatches[0].vendor_batch_number : 'VB-TATA-2026-8800',
      verification_status: 'Verified Authentic',
      discrepancy_flags: [],
      investigation_status: COMPLAINT_STATUS.UNDER_CAPA,
      resolution: 'Batch sample re-inspected. Re-machining approved.',
      capa_summary: 'Tool wear monitoring threshold reduced from 100 cycles to 60 cycles.',
    },
    {
      customer_id: customers[3].id,
      description: 'Outer carton seal was broken upon arrival at power plant stores.',
      defect_category: 'Packaging Damage',
      scanned_box_code: allMasterBoxes[1] ? allMasterBoxes[1].box_number : 'BX-0002',
      verification_status: 'Verified Authentic',
      discrepancy_flags: [],
      investigation_status: COMPLAINT_STATUS.OPEN,
      resolution: '',
    },
    {
      customer_id: customers[4].id,
      description: 'Missing M12 hex bolt fastener set inside master carton packaging.',
      defect_category: 'Missing Component',
      scanned_part_code: allParts[3] ? allParts[3].part_number : 'PT-0004',
      verification_status: 'Verified Authentic',
      discrepancy_flags: [],
      investigation_status: COMPLAINT_STATUS.RESOLVED,
      resolution: 'Fastener hardware kit dispatched via same-day air logistics.',
    },
  ];

  for (let i = 0; i < complaintsData.length; i++) {
    const cData = complaintsData[i];
    const cmpNum = generateBusinessId('CMP', i + 1);
    const complaint = await Complaint.create({
      ...cData,
      complaint_number: cmpNum,
      complaint_date: `2026-11-${String(i + 2).padStart(2, '0')}`,
      created_by: userMap['admin@demo.com'],
    });

    await ComplaintInvestigation.create({
      complaint_id: complaint.id,
      investigator_id: userMap['qc@demo.com'],
      findings: cData.discrepancy_flags.length > 0 ? `DISCREPANCIES DETECTED: ${cData.discrepancy_flags.join('; ')}` : 'Authentic batch verified against IQC and production records.',
      root_cause: cData.capa_summary || 'Standard operational feedback.',
      status: complaint.investigation_status === COMPLAINT_STATUS.RESOLVED ? 'Closed' : 'In Progress',
    });
  }

  // 17. NOTIFICATIONS & AUDIT LOGS
  await Notification.create({
    role: ROLES.ADMIN,
    title: 'System Startup Seed Completed',
    message: 'Manufacturing ERP database seeded with comprehensive realistic Indian industrial data.',
    type: 'success',
  });
  await Notification.create({
    role: ROLES.ACCOUNTS,
    title: 'Pending Dispatch Checklists',
    message: 'Multiple outward shipments awaiting commercial document verification.',
    type: 'info',
  });
  await Notification.create({
    role: ROLES.QC_OPERATOR,
    title: 'Sample QC Queue Active',
    message: 'New work order samples submitted for tensile and dimensional verification.',
    type: 'warning',
  });

  await AuditLog.create({
    user_id: userMap['superadmin@demo.com'],
    action: 'SYSTEM_DATABASE_SEEDED',
    entity_type: 'System',
    entity_id: 'SEED-2026',
    new_values: {
      vendors: 8,
      customers: 5,
      materials: 20,
      products: 15,
      purchase_orders: 15,
      receipts: 30,
      batches: 30,
      iqc_inspections: 40,
      work_orders: 15,
      parts: 100,
      boxes: 20,
      shipments: 10,
    },
    reason: 'Initial system provisioning',
  });

  console.log('================================================================');
  console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log(' - 8 Roles, 7 Departments, 5 Locations');
  console.log(' - 8 Demo Users (superadmin@demo.com, admin@demo.com, etc.)');
  console.log(' - 8 Vendors, 5 Customers, 5 Categories');
  console.log(' - 20 Raw Materials, 15 Finished Products with BOM');
  console.log(' - 15 Purchase Orders, 30 Material Receipts');
  console.log(' - 40 IQC Inspection Records across 4 Divisions');
  console.log(' - 30 Vendor-Linked Batches, 100+ Stock Ledger Transactions');
  console.log(' - 20 Sales Requirements, 15 Work Orders, 15 Sample QC Records');
  console.log(' - 15 Packaging Orders, 20 Master Boxes, 100 Part Instances with QRs');
  console.log(' - 10 Checklists, 10 Shipments, 3-Way Dispatch Clearance Approvals');
  console.log(' - 5 Complaints (Authentic & Mismatched/Fake Detection Scenarios)');
  console.log('================================================================');
};

// Direct script execution support
if (process.argv[1]?.endsWith('seed.js')) {
  const isReset = !process.argv.includes('--no-reset');
  seedDatabase(isReset)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seeder Failed]', err);
      process.exit(1);
    });
}
