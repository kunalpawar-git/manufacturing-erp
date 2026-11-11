import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { seedDatabase } from '../seeders/seed.js';
import { ROLES, APPROVAL_DECISION, SHIPMENT_STATUS } from '../constants/index.js';

describe('Manufacturing Operations & Traceability ERP - End-to-End Test Suite', () => {
  let superAdminToken;
  let adminToken;
  let salesToken;
  let accountsToken;
  let iqcToken;
  let prodToken;
  let qcToken;
  let pkgToken;

  beforeAll(async () => {
    // Seed test database
    await seedDatabase(true);

    // Login users to acquire JWT tokens
    const loginUser = async (email, password = 'Demo@123') => {
      const res = await request(app).post('/api/auth/login').send({ email, password });
      return res.body.data.token;
    };

    superAdminToken = await loginUser('superadmin@demo.com');
    adminToken = await loginUser('admin@demo.com');
    salesToken = await loginUser('sales@demo.com');
    accountsToken = await loginUser('accounts@demo.com');
    iqcToken = await loginUser('iqc@demo.com');
    prodToken = await loginUser('production@demo.com');
    qcToken = await loginUser('qc@demo.com');
    pkgToken = await loginUser('packaging@demo.com');
  });

  it('1. Verifies authentication and role profile resolution', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.Role.name).toBe(ROLES.ADMIN);
  });

  it('2. Simulates full end-to-end manufacturing and QR traceability workflow', async () => {
    // A. Create Vendor
    const vendorRes = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vendor_code: 'V-TEST-99',
        name: 'Apex Precision Castings India',
        contact_person: 'Gautam Singhania',
        email: 'apex@castings.in',
        phone: '+91 9988776655',
        address: 'Sector 5, Pimpri Industrial Area, Pune',
        gst_number: '27AAACA9999M1ZX',
      });
    expect(vendorRes.status).toBe(201);
    const vendorId = vendorRes.body.data.id;

    // B. Create Material
    const materialRes = await request(app)
      .post('/api/materials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        material_code: 'MAT-TEST-ALLOY',
        name: 'Aerospace Grade 7075-T6 Billet',
        unit: 'kg',
        reorder_level: 50,
        standard_cost: 550,
      });
    expect(materialRes.status).toBe(201);
    const materialId = materialRes.body.data.id;

    // C. Create Purchase Order
    const poRes = await request(app)
      .post('/api/purchase-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        po_direction: 'Inbound Supplier PO',
        vendor_id: vendorId,
        order_date: '2026-11-01',
        expected_delivery_date: '2026-11-15',
        items: [
          {
            material_id: materialId,
            ordered_quantity: 120,
            unit_price: 550,
          },
        ],
      });
    expect(poRes.status).toBe(201);
    const poId = poRes.body.data.id;
    const poItemId = poRes.body.data.items[0].id;

    // D. Material Receipt against PO
    const receiptRes = await request(app)
      .post('/api/receipts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        po_id: poId,
        po_item_id: poItemId,
        material_id: materialId,
        vendor_id: vendorId,
        received_quantity: 120,
        carrier_info: 'BlueDart Express Truck MH-12-AZ-9988',
        challan_number: 'DC-APEX-8821',
        invoice_number: 'INV-APEX-1002',
      });
    expect(receiptRes.status).toBe(201);
    const receiptId = receiptRes.body.data.id;

    // E. Perform IQC (Paint / Assembly / Store / Basement division)
    const iqcRes = await request(app)
      .post('/api/iqc')
      .set('Authorization', `Bearer ${iqcToken}`)
      .send({
        receipt_id: receiptId,
        division: 'Paint',
        vendor_batch_number: 'VB-APEX-LOT-777', // Preserved
        accepted_quantity: 120,
        rejected_quantity: 0,
        quarantined_quantity: 0,
        checklist_data: { visual: 'Pass', coating_thickness: 'Passed 80 microns' },
        remarks: 'Sample material passed all metallurgical specifications.',
      });
    expect(iqcRes.status).toBe(201);
    const internalBatchId = iqcRes.body.data.internal_batch_id;
    const batchId = iqcRes.body.data.batch.id;
    expect(internalBatchId).toMatch(/^B-\d{4}-\d+/);

    // F. Create Sales Requirement
    const productsRes = await request(app).get('/api/products').set('Authorization', `Bearer ${salesToken}`);
    const productId = productsRes.body.data[0].id;
    const customersRes = await request(app).get('/api/customers').set('Authorization', `Bearer ${salesToken}`);
    const customerId = customersRes.body.data[0].id;

    const reqRes = await request(app)
      .post('/api/sales-requirements')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: customerId,
        po_id: poId,
        product_id: productId,
        required_quantity: 20,
        required_delivery_date: '2026-11-20',
        priority: 'High',
        description: 'Urgent order for testing complete traceability.',
      });
    expect(reqRes.status).toBe(201);
    const reqId = reqRes.body.data.id;

    // G. Admin reviews and approves Sales Requirement (Auto-generates Work Order)
    const reviewRes = await request(app)
      .put(`/api/sales-requirements/${reqId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'Approved',
        comments: 'Approved for urgent shopfloor production.',
      });
    expect(reviewRes.status).toBe(200);

    // H. Retrieve auto-generated Work Order
    const woListRes = await request(app).get('/api/production').set('Authorization', `Bearer ${prodToken}`);
    const wo = woListRes.body.data.find((w) => w.requirement_id === reqId);
    expect(wo).toBeDefined();
    const woId = wo.id;

    // I. Prepare Sample
    const sampleRes = await request(app)
      .post(`/api/production/${woId}/sample`)
      .set('Authorization', `Bearer ${prodToken}`)
      .send({
        sample_notes: 'Initial test sample machined and ready for QC dimensional verification.',
      });
    expect(sampleRes.status).toBe(200);

    // J. Sample QC Inspection (Passed)
    const qcRes = await request(app)
      .post('/api/qc')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        work_order_id: woId,
        sample_identifier: `SMP-${wo.work_order_number}`,
        result: 'Passed',
        remarks: 'Sample meets all drawing tolerances.',
      });
    expect(qcRes.status).toBe(201);

    // K. Record Material Consumption of the Internal Batch
    const consumeRes = await request(app)
      .post(`/api/production/${woId}/consume`)
      .set('Authorization', `Bearer ${prodToken}`)
      .send({
        consumptions: [
          {
            batch_id: batchId,
            quantity_consumed: 30,
            scrap_quantity: 1,
            notes: `Consuming batch ${internalBatchId}`,
          },
        ],
      });
    expect(consumeRes.status).toBe(200);

    // L. Complete Production (Auto-generates Packaging Order)
    const completeWoRes = await request(app)
      .post(`/api/production/${woId}/complete`)
      .set('Authorization', `Bearer ${prodToken}`)
      .send({
        produced_quantity: 20,
        rejected_quantity: 0,
        remarks: 'Batch completed successfully.',
      });
    expect(completeWoRes.status).toBe(200);

    // M. Packaging Order & Approval (Generates Part QRs and Master Box QR)
    const pkgListRes = await request(app).get('/api/packaging').set('Authorization', `Bearer ${pkgToken}`);
    const pkgOrder = pkgListRes.body.data.find((p) => p.work_order_id === woId);
    expect(pkgOrder).toBeDefined();

    const approvePkgRes = await request(app)
      .post(`/api/packaging/${pkgOrder.id}/approve`)
      .set('Authorization', `Bearer ${pkgToken}`)
      .send({
        component_verification: true,
        condition_verification: true,
        box_capacity: 20,
        remarks: 'Component count verified 20/20. No cosmetic flaws.',
      });
    expect(approvePkgRes.status).toBe(200);
    expect(approvePkgRes.body.data.boxes.length).toBeGreaterThan(0);
    const box = approvePkgRes.body.data.boxes[0];
    const boxId = box.id;
    const boxNumber = box.box_number;
    const parts = approvePkgRes.body.data.parts;
    expect(parts.length).toBe(20);
    const testPartNumber = parts[0].part_number;

    // N. Create Accounts Checklist
    const ckRes = await request(app)
      .post('/api/checklists')
      .set('Authorization', `Bearer ${accountsToken}`)
      .send({
        customer_id: customerId,
        acknowledgement_method: 'Internal Verification',
        acknowledgement_status: 'Cleared',
        commercial_invoice_number: 'TAX-INV-TEST-001',
        remarks: 'Cleared by accounts for dispatch.',
      });
    expect(ckRes.status).toBe(201);

    // O. Create Shipment with Box
    const shipRes = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        destination_address: 'Unloading Dock 1, Industrial Hub',
        vehicle_number: 'MH-12-TEST-7788',
        lr_consignment_number: 'LR-TEST-5544',
        driver_name: 'Harish R',
        box_ids: [boxId],
      });
    expect(shipRes.status).toBe(201);
    const shipmentId = shipRes.body.data.id;

    // P. CRITICAL BUSINESS RULE TEST: Attempt Outward Dispatch BEFORE 3-Way clearance
    // Must be FORBIDDEN / Rejected!
    const earlyDispatchRes = await request(app)
      .post(`/api/shipments/${shipmentId}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ vehicle_number: 'MH-12-TEST-7788' });
    expect(earlyDispatchRes.status).toBe(500); // Or 400 error caught by handler
    expect(earlyDispatchRes.body.success).toBe(false);

    // Q. Perform 3-Way Clearance (Admin, Sales, Accounts)
    // Admin approval
    await request(app)
      .post(`/api/dispatch-approvals/${shipmentId}/decision`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'Approved', comments: 'Admin dispatch check ok' });

    // Sales approval
    await request(app)
      .post(`/api/dispatch-approvals/${shipmentId}/decision`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ decision: 'Approved', comments: 'Sales clearance granted' });

    // Accounts approval
    await request(app)
      .post(`/api/dispatch-approvals/${shipmentId}/decision`)
      .set('Authorization', `Bearer ${accountsToken}`)
      .send({ decision: 'Approved', comments: 'Commercial and tax accounts verified' });

    // R. Re-check Clearance Status
    const clearanceRes = await request(app)
      .get(`/api/dispatch-approvals/${shipmentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(clearanceRes.body.data.clearance_status.is_fully_cleared).toBe(true);

    // S. Execute Outward Dispatch (Now Authorized!)
    const dispatchRes = await request(app)
      .post(`/api/shipments/${shipmentId}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicle_number: 'MH-12-TEST-7788',
        lr_consignment_number: 'LR-TEST-5544',
        driver_name: 'Harish R',
        driver_phone: '+91 9898989898',
        receiving_party: 'Factory Stores Manager',
      });
    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.data.status).toBe(SHIPMENT_STATUS.DISPATCHED);

    // T. QR Scan of Part: Verify complete end-to-end lineage and timeline!
    const scanPartRes = await request(app)
      .post('/api/qr/scan')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ code: testPartNumber });

    expect(scanPartRes.status).toBe(200);
    expect(scanPartRes.body.data.found).toBe(true);
    expect(scanPartRes.body.data.is_authentic).toBe(true);
    expect(scanPartRes.body.data.source_batch.internal_batch_id).toBe(internalBatchId);
    expect(scanPartRes.body.data.source_batch.vendor_batch_number).toBe('VB-APEX-LOT-777');
    expect(scanPartRes.body.data.timeline.length).toBeGreaterThanOrEqual(5);

    // U. QR Scan of Master Box
    const scanBoxRes = await request(app)
      .post('/api/qr/scan')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ code: boxNumber });
    expect(scanBoxRes.status).toBe(200);
    expect(scanBoxRes.body.data.parts.length).toBe(20);

    // V. Register Customer Complaint using Part QR (Verified Authentic case)
    const complaintRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        description: 'Customer claims hairline scratch on part.',
        defect_category: 'Surface Finish / Paint Flaw',
        scanned_part_code: testPartNumber,
        scanned_box_code: boxNumber,
        claimed_internal_batch: internalBatchId,
        claimed_vendor_batch: 'VB-APEX-LOT-777',
      });
    expect(complaintRes.status).toBe(201);
    expect(complaintRes.body.data.complaint.verification_status).toBe('Verified Authentic');

    // W. Register Complaint with Mismatch (Fake / Discrepancy scenario)
    const fakeComplaintRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        description: 'Counterfeit claim with wrong batch.',
        defect_category: 'Label Mismatch',
        scanned_part_code: testPartNumber,
        scanned_box_code: 'BX-FAKE-999',
        claimed_internal_batch: 'B-WRONG-000',
      });
    expect(fakeComplaintRes.status).toBe(201);
    expect(fakeComplaintRes.body.data.complaint.verification_status).toBe('Mismatch Detected');
    expect(fakeComplaintRes.body.data.complaint.discrepancy_flags.length).toBeGreaterThan(0);
  });
});

