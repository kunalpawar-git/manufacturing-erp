import * as qrService from '../services/qrService.js';
import * as checklistService from '../services/checklistService.js';
import * as dispatchApprovalService from '../services/dispatchApprovalService.js';
import * as shipmentService from '../services/shipmentService.js';

// QR & TRACEABILITY
export const scanQr = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Scanned QR input code is required' });
    const data = await qrService.resolveQrScan(code);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const downloadQrLabelsPdf = async (req, res, next) => {
  try {
    const { type = 'parts', ids } = req.query;
    const idList = ids ? ids.split(',') : [];
    const pdfBuffer = await qrService.getPrintableQrLabels({ type, ids: idList });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=QR_Labels_${type}_${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

// CHECKLISTS
export const getChecklists = async (req, res, next) => {
  try {
    const data = await checklistService.getChecklists(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getChecklistById = async (req, res, next) => {
  try {
    const data = await checklistService.getChecklistById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Checklist not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createChecklist = async (req, res, next) => {
  try {
    const data = await checklistService.createChecklist(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Accounts Checklist created', data });
  } catch (err) { next(err); }
};

export const updateChecklist = async (req, res, next) => {
  try {
    const data = await checklistService.updateChecklist(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Checklist updated (affected dispatch approvals invalidated)', data });
  } catch (err) { next(err); }
};

// 3-WAY DISPATCH APPROVAL
export const getClearanceRequests = async (req, res, next) => {
  try {
    const data = await dispatchApprovalService.getClearanceRequests();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getClearanceById = async (req, res, next) => {
  try {
    const data = await dispatchApprovalService.getClearanceById(req.params.shipmentId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const submitApprovalDecision = async (req, res, next) => {
  try {
    const data = await dispatchApprovalService.submitApprovalDecision(req.params.shipmentId, req.body, req.user);
    res.json({ success: true, message: 'Dispatch approval decision recorded', data });
  } catch (err) { next(err); }
};

// SHIPMENTS & OUTWARD DISPATCH
export const getShipments = async (req, res, next) => {
  try {
    const data = await shipmentService.getShipments(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getShipmentById = async (req, res, next) => {
  try {
    const data = await shipmentService.getShipmentById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createShipment = async (req, res, next) => {
  try {
    const { box_ids, ...shipmentData } = req.body;
    const data = await shipmentService.createShipment(shipmentData, box_ids || [], req.user.id);
    res.status(201).json({
      success: true,
      message: 'Shipment created and queued for mandatory 3-Way Dispatch Clearance (Admin, Sales, Accounts)',
      data,
    });
  } catch (err) { next(err); }
};

export const executeOutwardDispatch = async (req, res, next) => {
  try {
    const data = await shipmentService.executeOutwardDispatch(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'Shipment verified and outward dispatched! Boxes and parts marked as dispatched.',
      data,
    });
  } catch (err) { next(err); }
};

export const downloadGatePassPdf = async (req, res, next) => {
  try {
    const pdfBuffer = await shipmentService.downloadGatePassPdf(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=GatePass_${req.params.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};
