import { Op } from 'sequelize';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  Vendor,
  Customer,
  Material,
  Product,
  MaterialReceipt,
  IqcInspection,
  InventoryBatch,
  InventoryTransaction,
  SalesRequirement,
  ProductionWorkOrder,
  SampleQcRecord,
  PackagingOrder,
  MasterBox,
  PartInstance,
  Checklist,
  Shipment,
  DispatchApproval,
  Complaint,
  User,
} from '../models/index.js';
import { generateExcelReport } from '../utils/excelGenerator.js';
import { generateReportPdf } from '../utils/pdfGenerator.js';

export const getReportData = async (reportType, filters = {}) => {
  const dateFilter = {};
  if (filters.start_date && filters.end_date) {
    dateFilter[Op.between] = [filters.start_date, filters.end_date];
  }

  switch (reportType) {
    case 'purchase-orders': {
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.vendor_id) where.vendor_id = filters.vendor_id;
      if (filters.start_date && filters.end_date) where.order_date = dateFilter;

      const data = await PurchaseOrder.findAll({
        where,
        include: [
          { model: Vendor, as: 'vendor' },
          { model: Customer, as: 'customer' },
          { model: PurchaseOrderItem, as: 'items' },
        ],
        order: [['order_date', 'DESC']],
      });

      return {
        title: '1. Purchase Order Report',
        columns: [
          { header: 'PO Number', key: 'po_number', width: 18 },
          { header: 'Direction', key: 'po_direction', width: 22 },
          { header: 'Counterparty', key: 'counterparty', width: 25 },
          { header: 'Order Date', key: 'order_date', width: 14 },
          { header: 'Expected Delivery', key: 'expected_delivery_date', width: 16 },
          { header: 'Items Count', key: 'items_count', width: 14 },
          { header: 'Total (INR)', key: 'total_amount', width: 16 },
          { header: 'Status', key: 'status', width: 16 },
        ],
        rows: data.map((d) => ({
          po_number: d.po_number,
          po_direction: d.po_direction,
          counterparty: d.vendor ? d.vendor.name : d.customer ? d.customer.name : 'N/A',
          order_date: d.order_date,
          expected_delivery_date: d.expected_delivery_date,
          items_count: d.items?.length || 0,
          total_amount: `INR ${(d.total_amount || 0).toLocaleString('en-IN')}`,
          status: d.status,
        })),
      };
    }

    case 'vendors': {
      const where = {};
      if (filters.status) where.status = filters.status;
      const data = await Vendor.findAll({ where, order: [['vendor_code', 'ASC']] });
      return {
        title: '2. Vendor Master Directory Report',
        columns: [
          { header: 'Code', key: 'vendor_code', width: 14 },
          { header: 'Vendor Name', key: 'name', width: 28 },
          { header: 'Contact Person', key: 'contact_person', width: 20 },
          { header: 'Phone', key: 'phone', width: 16 },
          { header: 'Email', key: 'email', width: 24 },
          { header: 'GST Number', key: 'gst_number', width: 20 },
          { header: 'Rating', key: 'rating', width: 12 },
          { header: 'Status', key: 'status', width: 12 },
        ],
        rows: data.map((d) => ({
          vendor_code: d.vendor_code,
          name: d.name,
          contact_person: d.contact_person,
          phone: d.phone,
          email: d.email,
          gst_number: d.gst_number,
          rating: `${d.rating} / 5`,
          status: d.status,
        })),
      };
    }

    case 'material-receipts': {
      const data = await MaterialReceipt.findAll({
        include: [
          { model: PurchaseOrder, as: 'purchase_order', include: [{ model: Vendor, as: 'vendor' }] },
          { model: Material, as: 'material' },
        ],
        order: [['receipt_date', 'DESC']],
      });
      return {
        title: '3. Material Receipt Report',
        columns: [
          { header: 'Receipt #', key: 'receipt_number', width: 18 },
          { header: 'PO Number', key: 'po_number', width: 18 },
          { header: 'Vendor', key: 'vendor', width: 24 },
          { header: 'Material', key: 'material', width: 24 },
          { header: 'Received Qty', key: 'received_quantity', width: 14 },
          { header: 'Challan #', key: 'challan_number', width: 18 },
          { header: 'Receipt Date', key: 'receipt_date', width: 14 },
          { header: 'Status', key: 'status', width: 14 },
        ],
        rows: data.map((d) => ({
          receipt_number: d.receipt_number,
          po_number: d.purchase_order?.po_number || '-',
          vendor: d.purchase_order?.vendor?.name || '-',
          material: d.material?.name || '-',
          received_quantity: d.received_quantity,
          challan_number: d.challan_number || '-',
          receipt_date: d.receipt_date,
          status: d.status,
        })),
      };
    }

    case 'iqc': {
      const where = {};
      if (filters.division) where.division = filters.division;
      if (filters.status) where.status = filters.status;
      if (filters.vendor_id) where.vendor_id = filters.vendor_id;
      if (filters.start_date && filters.end_date) where.inspection_date = dateFilter;

      const data = await IqcInspection.findAll({
        where,
        include: [
          { model: Vendor, as: 'vendor' },
          { model: Material, as: 'material' },
        ],
        order: [['created_at', 'DESC']],
      });

      return {
        title: '4. Incoming Quality Control (IQC) Report',
        columns: [
          { header: 'IQC Number', key: 'inspection_number', width: 18 },
          { header: 'Division', key: 'division', width: 14 },
          { header: 'Supplier', key: 'vendor', width: 24 },
          { header: 'Material', key: 'material', width: 22 },
          { header: 'Vendor Batch', key: 'vendor_batch', width: 18 },
          { header: 'Internal Batch ID', key: 'internal_batch', width: 18 },
          { header: 'Received Qty', key: 'received', width: 14 },
          { header: 'Accepted Qty', key: 'accepted', width: 14 },
          { header: 'Rejected Qty', key: 'rejected', width: 14 },
          { header: 'Status', key: 'status', width: 14 },
        ],
        rows: data.map((d) => ({
          inspection_number: d.inspection_number,
          division: d.division,
          vendor: d.vendor?.name,
          material: d.material?.name,
          vendor_batch: d.vendor_batch_number,
          internal_batch: d.internal_batch_id,
          received: d.received_quantity,
          accepted: d.accepted_quantity,
          rejected: d.rejected_quantity,
          status: d.status,
        })),
      };
    }

    case 'batches-status': {
      const where = {};
      if (filters.division) where.division = filters.division;
      if (filters.status) where.status = filters.status;
      const data = await IqcInspection.findAll({
        where,
        include: [{ model: Vendor, as: 'vendor' }, { model: Material, as: 'material' }],
        order: [['inspection_date', 'DESC']],
      });
      return {
        title: '5. Accepted / Rejected Batch Qualification Report',
        columns: [
          { header: 'Internal Batch ID', key: 'internal_batch', width: 18 },
          { header: 'Vendor Batch #', key: 'vendor_batch', width: 18 },
          { header: 'Division', key: 'division', width: 14 },
          { header: 'Material', key: 'material', width: 24 },
          { header: 'Vendor', key: 'vendor', width: 24 },
          { header: 'Accepted Qty', key: 'accepted', width: 14 },
          { header: 'Rejected Qty', key: 'rejected', width: 14 },
          { header: 'Qualification', key: 'status', width: 16 },
        ],
        rows: data.map((d) => ({
          internal_batch: d.internal_batch_id,
          vendor_batch: d.vendor_batch_number,
          division: d.division,
          material: d.material?.name,
          vendor: d.vendor?.name,
          accepted: d.accepted_quantity,
          rejected: d.rejected_quantity,
          status: d.status,
        })),
      };
    }

    case 'inventory': {
      const where = {};
      if (filters.division) where.division = filters.division;
      if (filters.status) where.status = filters.status;
      const data = await InventoryBatch.findAll({
        where,
        include: [
          { model: Material, as: 'material' },
          { model: Vendor, as: 'vendor' },
        ],
        order: [['created_at', 'DESC']],
      });

      return {
        title: '6. Central Batch Inventory Report',
        columns: [
          { header: 'Internal Batch ID', key: 'batch_id', width: 18 },
          { header: 'Vendor Batch', key: 'vendor_batch', width: 18 },
          { header: 'Material Code', key: 'mat_code', width: 16 },
          { header: 'Material Name', key: 'mat_name', width: 24 },
          { header: 'Division', key: 'division', width: 14 },
          { header: 'Current Stock', key: 'qty', width: 14 },
          { header: 'Reserved Stock', key: 'reserved', width: 14 },
          { header: 'Rejected Stock', key: 'rejected', width: 14 },
          { header: 'Status', key: 'status', width: 14 },
        ],
        rows: data.map((d) => ({
          batch_id: d.internal_batch_id,
          vendor_batch: d.vendor_batch_number,
          mat_code: d.material?.material_code,
          mat_name: d.material?.name,
          division: d.division,
          qty: `${d.current_quantity} ${d.material?.unit || ''}`,
          reserved: d.reserved_quantity,
          rejected: d.rejected_quantity,
          status: d.status,
        })),
      };
    }

    case 'batch-movements': {
      const data = await InventoryTransaction.findAll({
        include: [
          { model: InventoryBatch, as: 'batch' },
          { model: Material, as: 'material' },
        ],
        limit: 100,
        order: [['created_at', 'DESC']],
      });
      return {
        title: '7. Batch Movement & Stock Ledger Report',
        columns: [
          { header: 'Transaction #', key: 'txn_no', width: 18 },
          { header: 'Type', key: 'type', width: 16 },
          { header: 'Internal Batch ID', key: 'batch_id', width: 18 },
          { header: 'Material', key: 'material', width: 24 },
          { header: 'Qty Moved', key: 'qty', width: 14 },
          { header: 'Prev Balance', key: 'prev', width: 14 },
          { header: 'New Balance', key: 'next', width: 14 },
          { header: 'Remarks', key: 'remarks', width: 28 },
        ],
        rows: data.map((t) => ({
          txn_no: t.transaction_number,
          type: t.transaction_type,
          batch_id: t.batch?.internal_batch_id || '-',
          material: t.material?.name || '-',
          qty: t.quantity,
          prev: t.previous_quantity,
          next: t.new_quantity,
          remarks: t.remarks || '-',
        })),
      };
    }

    case 'sales-requirements': {
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.product_id) where.product_id = filters.product_id;
      const data = await SalesRequirement.findAll({
        where,
        include: [
          { model: Customer, as: 'customer' },
          { model: Product, as: 'product' },
        ],
        order: [['created_at', 'DESC']],
      });
      return {
        title: '8. Sales Requirement & Approval Report',
        columns: [
          { header: 'Requirement #', key: 'req_no', width: 18 },
          { header: 'Customer', key: 'customer', width: 24 },
          { header: 'Product', key: 'product', width: 24 },
          { header: 'Required Qty', key: 'qty', width: 14 },
          { header: 'Delivery Date', key: 'delivery', width: 14 },
          { header: 'Priority', key: 'priority', width: 12 },
          { header: 'Revision', key: 'rev', width: 10 },
          { header: 'Status', key: 'status', width: 16 },
        ],
        rows: data.map((r) => ({
          req_no: r.requirement_number,
          customer: r.customer?.name,
          product: r.product?.name,
          qty: r.required_quantity,
          delivery: r.required_delivery_date,
          priority: r.priority,
          rev: `r${r.revision_number || 1}`,
          status: r.status,
        })),
      };
    }

    case 'production': {
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.product_id) where.product_id = filters.product_id;
      const data = await ProductionWorkOrder.findAll({
        where,
        include: [
          { model: Product, as: 'product' },
          { model: SalesRequirement, as: 'sales_requirement' },
        ],
        order: [['created_at', 'DESC']],
      });

      return {
        title: '9. Production Work Orders Report',
        columns: [
          { header: 'Work Order #', key: 'wo_number', width: 18 },
          { header: 'Product', key: 'product', width: 26 },
          { header: 'Target Qty', key: 'target', width: 14 },
          { header: 'Produced Qty', key: 'produced', width: 14 },
          { header: 'Sample Status', key: 'sample', width: 16 },
          { header: 'Start Date', key: 'start', width: 14 },
          { header: 'Status', key: 'status', width: 16 },
        ],
        rows: data.map((d) => ({
          wo_number: d.work_order_number,
          product: d.product?.name,
          target: `${d.target_quantity} pcs`,
          produced: `${d.produced_quantity || 0} pcs`,
          sample: d.sample_status,
          start: d.start_date,
          status: d.status,
        })),
      };
    }

    case 'sample-qc': {
      const data = await SampleQcRecord.findAll({
        include: [
          { model: ProductionWorkOrder, as: 'work_order', include: [{ model: Product, as: 'product' }] },
          { model: User, as: 'inspector' },
        ],
        order: [['inspection_date', 'DESC']],
      });
      return {
        title: '10. Sample Quality Control (QC) Report',
        columns: [
          { header: 'QC Number', key: 'qc_no', width: 18 },
          { header: 'Work Order #', key: 'wo_no', width: 18 },
          { header: 'Product', key: 'product', width: 24 },
          { header: 'Sample ID', key: 'sample_id', width: 18 },
          { header: 'Inspector', key: 'inspector', width: 20 },
          { header: 'Date', key: 'date', width: 14 },
          { header: 'Result', key: 'result', width: 14 },
          { header: 'Remarks / Defects', key: 'remarks', width: 28 },
        ],
        rows: data.map((q) => ({
          qc_no: q.qc_number,
          wo_no: q.work_order?.work_order_number || '-',
          product: q.work_order?.product?.name || '-',
          sample_id: q.sample_identifier,
          inspector: q.inspector?.full_name || 'QC Officer',
          date: q.inspection_date,
          result: q.result,
          remarks: q.result === 'Failed' ? q.defect_details : q.remarks,
        })),
      };
    }

    case 'packaging': {
      const data = await PackagingOrder.findAll({
        include: [
          { model: ProductionWorkOrder, as: 'work_order' },
          { model: Product, as: 'product' },
          { model: MasterBox, as: 'boxes' },
        ],
        order: [['created_at', 'DESC']],
      });
      return {
        title: '11. Packaging & Master Box Report',
        columns: [
          { header: 'Packaging #', key: 'pkg_no', width: 18 },
          { header: 'Work Order #', key: 'wo_no', width: 18 },
          { header: 'Product', key: 'product', width: 24 },
          { header: 'Total Qty', key: 'total_qty', width: 14 },
          { header: 'Packed Qty', key: 'packed_qty', width: 14 },
          { header: 'Master Boxes', key: 'boxes', width: 14 },
          { header: 'Count / Cond Check', key: 'checks', width: 18 },
          { header: 'Status', key: 'status', width: 14 },
        ],
        rows: data.map((p) => ({
          pkg_no: p.packaging_number,
          wo_no: p.work_order?.work_order_number || '-',
          product: p.product?.name || '-',
          total_qty: p.total_quantity,
          packed_qty: p.packed_quantity,
          boxes: p.boxes?.length || 0,
          checks: p.component_verification && p.condition_verification ? 'Verified' : 'Pending',
          status: p.status,
        })),
      };
    }

    case 'traceability': {
      const parts = await PartInstance.findAll({
        include: [
          { model: Product, as: 'product' },
          { model: MasterBox, as: 'box' },
          { model: ProductionWorkOrder, as: 'work_order' },
        ],
        limit: 100,
        order: [['part_number', 'ASC']],
      });

      return {
        title: '12. End-to-End QR Part Traceability Report',
        columns: [
          { header: 'Part ID', key: 'part_number', width: 16 },
          { header: 'Product Name', key: 'product', width: 26 },
          { header: 'Work Order #', key: 'wo_number', width: 18 },
          { header: 'Master Box ID', key: 'box_number', width: 16 },
          { header: 'Serial #', key: 'serial', width: 22 },
          { header: 'Status', key: 'status', width: 14 },
        ],
        rows: parts.map((p) => ({
          part_number: p.part_number,
          product: p.product?.name,
          wo_number: p.work_order?.work_order_number || '-',
          box_number: p.box?.box_number || 'Unboxed',
          serial: p.serial_number,
          status: p.status,
        })),
      };
    }

    case 'checklists': {
      const data = await Checklist.findAll({
        include: [
          { model: Shipment, as: 'shipment' },
          { model: Customer, as: 'customer' },
        ],
        order: [['created_at', 'DESC']],
      });
      return {
        title: '13. Accounts Commercial Checklist Report',
        columns: [
          { header: 'Checklist #', key: 'ck_no', width: 18 },
          { header: 'Shipment #', key: 'sh_no', width: 18 },
          { header: 'Customer', key: 'customer', width: 24 },
          { header: 'Commercial Invoice', key: 'invoice', width: 20 },
          { header: 'Ack Method', key: 'method', width: 20 },
          { header: 'Ack Status', key: 'status', width: 16 },
          { header: 'Remarks', key: 'remarks', width: 26 },
        ],
        rows: data.map((c) => ({
          ck_no: c.checklist_number,
          sh_no: c.shipment?.shipment_number || '-',
          customer: c.customer?.name || '-',
          invoice: c.commercial_invoice_number || '-',
          method: c.acknowledgement_method,
          status: c.acknowledgement_status,
          remarks: c.remarks || '-',
        })),
      };
    }

    case 'dispatch-approvals': {
      const data = await DispatchApproval.findAll({
        include: [
          { model: Shipment, as: 'shipment' },
          { model: User, as: 'approver' },
        ],
        order: [['created_at', 'DESC']],
      });
      return {
        title: '14. Mandatory 3-Way Dispatch Approval Report',
        columns: [
          { header: 'Shipment #', key: 'sh_no', width: 18 },
          { header: 'Rev #', key: 'version', width: 10 },
          { header: 'Approver Role', key: 'role', width: 16 },
          { header: 'Signee Name', key: 'approver', width: 22 },
          { header: 'Decision', key: 'decision', width: 16 },
          { header: 'Decided At', key: 'decided_at', width: 18 },
          { header: 'Comments', key: 'comments', width: 30 },
        ],
        rows: data.map((a) => ({
          sh_no: a.shipment?.shipment_number || '-',
          version: `v${a.shipment_version}`,
          role: a.role,
          approver: a.approver?.full_name || a.role,
          decision: a.decision,
          decided_at: a.decided_at ? new Date(a.decided_at).toLocaleDateString('en-IN') : 'Pending',
          comments: a.comments || '-',
        })),
      };
    }

    case 'shipments': {
      const data = await Shipment.findAll({
        include: [
          { model: Customer, as: 'customer' },
          { model: MasterBox, as: 'boxes' },
        ],
        order: [['created_at', 'DESC']],
      });

      return {
        title: '15. Outward Dispatch & Shipment Report',
        columns: [
          { header: 'Shipment #', key: 'sh_number', width: 18 },
          { header: 'Customer', key: 'customer', width: 24 },
          { header: 'Destination', key: 'destination', width: 28 },
          { header: 'Total Boxes', key: 'boxes', width: 14 },
          { header: 'Total Parts', key: 'parts', width: 14 },
          { header: 'Vehicle #', key: 'vehicle', width: 16 },
          { header: 'LR Consignment', key: 'lr', width: 18 },
          { header: 'Dispatch Date', key: 'date', width: 14 },
          { header: 'Status', key: 'status', width: 16 },
        ],
        rows: data.map((d) => ({
          sh_number: d.shipment_number,
          customer: d.customer?.name,
          destination: d.destination_address,
          boxes: d.total_boxes,
          parts: d.total_parts,
          vehicle: d.vehicle_number || '-',
          lr: d.lr_consignment_number || '-',
          date: d.dispatch_date || '-',
          status: d.status,
        })),
      };
    }

    case 'complaints': {
      const data = await Complaint.findAll({
        include: [{ model: Customer, as: 'customer' }],
        order: [['created_at', 'DESC']],
      });

      return {
        title: '16. Customer Complaints & QR Authenticity Report',
        columns: [
          { header: 'Complaint #', key: 'cmp_number', width: 18 },
          { header: 'Customer', key: 'customer', width: 24 },
          { header: 'Defect Category', key: 'category', width: 22 },
          { header: 'Scanned Part QR', key: 'part_code', width: 18 },
          { header: 'Verification Status', key: 'auth_status', width: 20 },
          { header: 'Investigation Status', key: 'status', width: 18 },
          { header: 'Complaint Date', key: 'date', width: 14 },
        ],
        rows: data.map((d) => ({
          cmp_number: d.complaint_number,
          customer: d.customer?.name,
          category: d.defect_category,
          part_code: d.scanned_part_code || '-',
          auth_status: d.verification_status,
          status: d.investigation_status,
          date: d.complaint_date,
        })),
      };
    }

    case 'vendor-performance': {
      const vendors = await Vendor.findAll({
        include: [
          { model: PurchaseOrder, as: 'purchase_orders' },
          { model: IqcInspection, as: 'iqc_inspections' },
        ],
        order: [['vendor_code', 'ASC']],
      });

      return {
        title: '17. Vendor Quality & Delivery Performance Report',
        columns: [
          { header: 'Vendor Code', key: 'vendor_code', width: 14 },
          { header: 'Vendor Name', key: 'name', width: 26 },
          { header: 'Total POs', key: 'total_pos', width: 12 },
          { header: 'IQC Lots Inspected', key: 'total_iqc', width: 16 },
          { header: 'Accepted Qty', key: 'accepted_qty', width: 14 },
          { header: 'Rejected Qty', key: 'rejected_qty', width: 14 },
          { header: 'Quality Pass %', key: 'pass_rate', width: 14 },
          { header: 'Vendor Rating', key: 'rating', width: 14 },
        ],
        rows: vendors.map((v) => {
          const iqcs = v.iqc_inspections || [];
          const acc = iqcs.reduce((sum, i) => sum + (parseFloat(i.accepted_quantity) || 0), 0);
          const rej = iqcs.reduce((sum, i) => sum + (parseFloat(i.rejected_quantity) || 0), 0);
          const tot = acc + rej;
          const rate = tot > 0 ? ((acc / tot) * 100).toFixed(1) : '100.0';
          return {
            vendor_code: v.vendor_code,
            name: v.name,
            total_pos: v.purchase_orders?.length || 0,
            total_iqc: iqcs.length,
            accepted_qty: acc,
            rejected_qty: rej,
            pass_rate: `${rate}%`,
            rating: `${v.rating} / 5.0`,
          };
        }),
      };
    }

    default:
      return await getReportData('traceability', filters);
  }
};

export const exportReportExcel = async (reportType, filters = {}) => {
  const { title, columns, rows } = await getReportData(reportType, filters);
  return await generateExcelReport(reportType, columns, rows, title);
};

export const exportReportPdf = async (reportType, filters = {}) => {
  const { title, columns, rows } = await getReportData(reportType, filters);
  return await generateReportPdf(title, columns, rows);
};
