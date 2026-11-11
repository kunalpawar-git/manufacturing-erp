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
} from '../models/index.js';
import { generateExcelReport } from '../utils/excelGenerator.js';

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
        title: 'Purchase Order Report',
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
          counterparty: d.vendor ? d.vendor.name : (d.customer ? d.customer.name : 'N/A'),
          order_date: d.order_date,
          expected_delivery_date: d.expected_delivery_date,
          items_count: d.items.length,
          total_amount: `₹${(d.total_amount || 0).toLocaleString('en-IN')}`,
          status: d.status,
        })),
      };
    }

    case 'vendors': {
      const data = await Vendor.findAll({ order: [['vendor_code', 'ASC']] });
      return {
        title: 'Vendor Master Directory Report',
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

    case 'iqc': {
      const where = {};
      if (filters.division) where.division = filters.division;
      if (filters.status) where.status = filters.status;
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
        title: 'Incoming Quality Control (IQC) Report',
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

    case 'inventory': {
      const data = await InventoryBatch.findAll({
        include: [
          { model: Material, as: 'material' },
          { model: Vendor, as: 'vendor' },
        ],
        order: [['created_at', 'DESC']],
      });

      return {
        title: 'Central Batch Inventory Report',
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

    case 'production': {
      const data = await ProductionWorkOrder.findAll({
        include: [
          { model: Product, as: 'product' },
          { model: SalesRequirement, as: 'sales_requirement' },
        ],
        order: [['created_at', 'DESC']],
      });

      return {
        title: 'Production Work Orders Report',
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

    case 'shipments': {
      const data = await Shipment.findAll({
        include: [
          { model: Customer, as: 'customer' },
          { model: MasterBox, as: 'boxes' },
        ],
        order: [['created_at', 'DESC']],
      });

      return {
        title: 'Outward Dispatch & Shipment Report',
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
        title: 'Customer Complaints & QR Authenticity Report',
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

    default: {
      // General Batch Traceability Overview
      const parts = await PartInstance.findAll({
        include: [
          { model: Product, as: 'product' },
          { model: MasterBox, as: 'box' },
        ],
        limit: 100,
        order: [['part_number', 'ASC']],
      });

      return {
        title: 'QR Part Traceability Report',
        columns: [
          { header: 'Part ID', key: 'part_number', width: 16 },
          { header: 'Product Name', key: 'product', width: 26 },
          { header: 'Master Box ID', key: 'box_number', width: 16 },
          { header: 'Serial #', key: 'serial', width: 22 },
          { header: 'Status', key: 'status', width: 14 },
        ],
        rows: parts.map((p) => ({
          part_number: p.part_number,
          product: p.product?.name,
          box_number: p.box?.box_number || 'Unboxed',
          serial: p.serial_number,
          status: p.status,
        })),
      };
    }
  }
};

export const exportReportExcel = async (reportType, filters = {}) => {
  const { title, columns, rows } = await getReportData(reportType, filters);
  return await generateExcelReport(reportType, columns, rows, title);
};
