import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid corporate email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const purchaseOrderSchema = z.object({
  po_direction: z.enum(['Inbound Supplier PO', 'Outbound Customer SO']),
  vendor_id: z.union([z.number(), z.string()]).optional(),
  customer_id: z.union([z.number(), z.string()]).optional(),
  order_date: z.string().min(1, 'PO Date is required'),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
});

export const iqcInspectionSchema = z.object({
  division: z.enum(['Paint', 'Assembly', 'Store', 'Basement']),
  vendor_batch_number: z.string().min(1, 'Original Vendor Batch Number is mandatory'),
  received_qty: z.number().positive('Received quantity must be positive'),
  accepted_qty: z.number().min(0),
  rejected_qty: z.number().min(0),
  status: z.enum(['Accepted', 'Rejected', 'Quarantined']),
});

