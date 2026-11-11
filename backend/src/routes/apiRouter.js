import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRole, authorizePermission } from '../middleware/rbacMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { ROLES, PERMISSIONS } from '../constants/index.js';

import * as authCtrl from '../controllers/authController.js';
import * as masterCtrl from '../controllers/masterDataController.js';
import * as poCtrl from '../controllers/poController.js';
import * as invCtrl from '../controllers/inventoryController.js';
import * as salesCtrl from '../controllers/salesController.js';
import * as prodCtrl from '../controllers/productionController.js';
import * as shipCtrl from '../controllers/shipmentController.js';
import * as compCtrl from '../controllers/complaintController.js';

const router = express.Router();

// ================= AUTH =================
router.post('/auth/login', authCtrl.login);
router.get('/auth/profile', authenticate, authCtrl.getProfile);
router.post('/auth/change-password', authenticate, authCtrl.changePassword);

// ================= USER MANAGEMENT =================
router.get('/users/roles-departments', authenticate, authCtrl.getRolesAndDepartments);
router.get('/users', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), authCtrl.getUsers);
router.post('/users', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), authCtrl.createUser);
router.put('/users/:id', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), authCtrl.updateUser);

// ================= MASTER DATA =================
// Vendors
router.get('/vendors', authenticate, masterCtrl.getVendors);
router.post('/vendors', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), masterCtrl.createVendor);
router.put('/vendors/:id', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), masterCtrl.updateVendor);

// Customers
router.get('/customers', authenticate, masterCtrl.getCustomers);
router.post('/customers', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES), masterCtrl.createCustomer);
router.put('/customers/:id', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), masterCtrl.updateCustomer);

// Categories
router.get('/categories', authenticate, masterCtrl.getCategories);
router.post('/categories', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), masterCtrl.createCategory);

// Materials
router.get('/materials', authenticate, masterCtrl.getMaterials);
router.post('/materials', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), masterCtrl.createMaterial);
router.put('/materials/:id', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), masterCtrl.updateMaterial);

// Products & BOM
router.get('/products', authenticate, masterCtrl.getProducts);
router.get('/products/:id', authenticate, masterCtrl.getProductById);
router.post('/products', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), masterCtrl.createProduct);
router.put('/products/:id', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), masterCtrl.updateProduct);

// Departments & Locations
router.get('/departments', authenticate, masterCtrl.getDepartments);
router.get('/locations', authenticate, masterCtrl.getLocations);

// ================= PURCHASE ORDERS & RECEIPTS =================
router.get('/purchase-orders', authenticate, poCtrl.getPurchaseOrders);
router.get('/purchase-orders/:id', authenticate, poCtrl.getPurchaseOrderById);
router.post('/purchase-orders', authenticate, poCtrl.createPurchaseOrder);
router.put('/purchase-orders/:id/status', authenticate, poCtrl.updatePurchaseOrderStatus);
router.get('/receipts', authenticate, poCtrl.getReceipts);
router.post('/receipts', authenticate, poCtrl.receiveMaterial);

// ================= IQC =================
router.get('/iqc', authenticate, poCtrl.getIqcInspections);
router.get('/iqc/:id', authenticate, poCtrl.getIqcById);
router.post('/iqc', authenticate, poCtrl.createIqcInspection);

// ================= INVENTORY =================
router.get('/inventory/summary', authenticate, invCtrl.getInventorySummary);
router.get('/inventory/batches/:id', authenticate, invCtrl.getBatchById);
router.get('/inventory/transactions', authenticate, invCtrl.getTransactionsLedger);
router.post('/inventory/adjust', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), invCtrl.adjustStock);

// ================= SALES REQUIREMENTS =================
router.get('/sales-requirements', authenticate, salesCtrl.getSalesRequirements);
router.get('/sales-requirements/:id', authenticate, salesCtrl.getSalesRequirementById);
router.post('/sales-requirements', authenticate, salesCtrl.createSalesRequirement);
router.put('/sales-requirements/:id/review', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), salesCtrl.reviewSalesRequirement);
router.put('/sales-requirements/:id/revise', authenticate, salesCtrl.reviseSalesRequirement);

// ================= PRODUCTION WORK ORDERS =================
router.get('/production', authenticate, prodCtrl.getWorkOrders);
router.get('/production/:id', authenticate, prodCtrl.getWorkOrderById);
router.post('/production/:id/sample', authenticate, prodCtrl.prepareSample);
router.post('/production/:id/consume', authenticate, prodCtrl.consumeBatches);
router.post('/production/:id/complete', authenticate, prodCtrl.completeProduction);

// ================= SAMPLE QC =================
router.get('/qc', authenticate, prodCtrl.getQcRecords);
router.post('/qc', authenticate, prodCtrl.submitSampleQc);

// ================= PACKAGING =================
router.get('/packaging', authenticate, prodCtrl.getPackagingOrders);
router.get('/packaging/:id', authenticate, prodCtrl.getPackagingOrderById);
router.post('/packaging/:id/approve', authenticate, prodCtrl.approvePackagingOrder);

// ================= QR CODE & TRACEABILITY =================
router.post('/qr/scan', authenticate, shipCtrl.scanQr);
router.get('/qr/labels-pdf', authenticate, shipCtrl.downloadQrLabelsPdf);

// ================= ACCOUNTS CHECKLIST =================
router.get('/checklists', authenticate, shipCtrl.getChecklists);
router.get('/checklists/:id', authenticate, shipCtrl.getChecklistById);
router.post('/checklists', authenticate, shipCtrl.createChecklist);
router.put('/checklists/:id', authenticate, shipCtrl.updateChecklist);

// ================= 3-WAY DISPATCH APPROVAL =================
router.get('/dispatch-approvals', authenticate, shipCtrl.getClearanceRequests);
router.get('/dispatch-approvals/:shipmentId', authenticate, shipCtrl.getClearanceById);
router.post('/dispatch-approvals/:shipmentId/decision', authenticate, shipCtrl.submitApprovalDecision);

// ================= SHIPMENTS & OUTWARD DISPATCH =================
router.get('/shipments', authenticate, shipCtrl.getShipments);
router.get('/shipments/:id', authenticate, shipCtrl.getShipmentById);
router.post('/shipments', authenticate, shipCtrl.createShipment);
router.post('/shipments/:id/dispatch', authenticate, shipCtrl.executeOutwardDispatch);
router.get('/shipments/:id/gate-pass-pdf', authenticate, shipCtrl.downloadGatePassPdf);

// ================= COMPLAINTS & RETURN =================
router.get('/complaints', authenticate, compCtrl.getComplaints);
router.get('/complaints/:id', authenticate, compCtrl.getComplaintById);
router.post('/complaints', authenticate, compCtrl.registerComplaint);
router.put('/complaints/:id/investigate', authenticate, compCtrl.updateComplaintInvestigation);

// ================= REPORTS & EXPORTS =================
router.get('/reports/:reportType', authenticate, compCtrl.getReportData);
router.get('/reports/:reportType/export-excel', authenticate, compCtrl.exportReportExcel);

// ================= DASHBOARD & NOTIFICATIONS & AUDIT =================
router.get('/dashboard', authenticate, compCtrl.getDashboardMetrics);
router.get('/notifications', authenticate, compCtrl.getNotifications);
router.put('/notifications/:id/read', authenticate, compCtrl.markNotificationRead);
router.put('/notifications/mark-all-read', authenticate, compCtrl.markAllNotificationsRead);
router.get('/audit-logs', authenticate, authorizeRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), compCtrl.getAuditLogs);

// ================= FILE UPLOAD =================
router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
    },
  });
});

export default router;
